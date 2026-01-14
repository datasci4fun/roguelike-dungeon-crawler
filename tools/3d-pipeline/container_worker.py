#!/usr/bin/env python3
"""
Container Worker - Processes 3D generation jobs inside Docker container.

Polls the /jobs directory and processes pending jobs using TripoSR.
"""

import argparse
import json
import logging
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

# Configure logging
logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

# Paths (Docker container paths)
JOBS_DIR = Path("/jobs")
CONCEPT_ART_DIR = Path("/concept_art")
OUTPUT_BASE_DIR = Path("/web_assets/models")  # Mounted to web/public/assets/models
TRIPOSR_DIR = Path("/app/TripoSR")

# Global model (loaded once)
_model = None
_rembg_session = None


def get_model():
    """Lazy-load the TripoSR model."""
    global _model
    if _model is None:
        logger.info("Loading TripoSR model (this may take a minute)...")
        sys.path.insert(0, str(TRIPOSR_DIR))
        from tsr.system import TSR

        _model = TSR.from_pretrained(
            "stabilityai/TripoSR",
            config_name="config.yaml",
            weight_name="model.ckpt",
        )
        _model.renderer.set_chunk_size(8192)
        _model.to("cpu")
        logger.info("Model loaded successfully")
    return _model


def get_rembg_session():
    """Lazy-load rembg session."""
    global _rembg_session
    if _rembg_session is None:
        import rembg
        _rembg_session = rembg.new_session()
    return _rembg_session


def update_job(job_id: str, **updates):
    """Update a job file."""
    job_file = JOBS_DIR / f"{job_id}.json"
    if not job_file.exists():
        return

    try:
        with open(job_file, "r") as f:
            job = json.load(f)

        job.update(updates)
        job["updated_at"] = datetime.utcnow().isoformat()

        # Handle log_line specially
        if "log_line" in updates:
            if "logs" not in job:
                job["logs"] = []
            job["logs"].append(updates["log_line"])
            job["logs"] = job["logs"][-20:]
            del job["log_line"]

        with open(job_file, "w") as f:
            json.dump(job, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to update job {job_id}: {e}")


def get_next_pending_job() -> Optional[dict]:
    """Get the next pending job from the queue."""
    if not JOBS_DIR.exists():
        return None

    for job_file in sorted(JOBS_DIR.glob("*.json")):
        if job_file.name.startswith("."):
            continue
        try:
            with open(job_file, "r") as f:
                job = json.load(f)
            if job.get("status") == "pending":
                return job
        except Exception:
            pass
    return None


def process_job(job: dict):
    """Process a single generation job using TripoSR."""
    import numpy as np
    import torch
    from PIL import Image

    job_id = job["job_id"]
    asset_id = job["asset_id"]

    logger.info(f"Processing job {job_id} for asset {asset_id}")

    # Update status
    update_job(job_id, status="processing", progress="Starting...", progress_pct=0)

    # Find source image
    source_path = None
    for ext in [".png", ".jpg", ".jpeg", ".webp"]:
        candidate = CONCEPT_ART_DIR / f"{asset_id}{ext}"
        if candidate.exists():
            source_path = candidate
            break

    if not source_path:
        update_job(
            job_id,
            status="failed",
            error=f"Source image not found for {asset_id}",
            progress="Failed",
        )
        return

    update_job(job_id, progress="Loading source image...", progress_pct=5,
               log_line=f"Source: {source_path}")

    # Create output directory
    output_dir = OUTPUT_BASE_DIR / asset_id
    output_dir.mkdir(parents=True, exist_ok=True)

    update_job(job_id, progress="Preparing output directory...", progress_pct=10,
               log_line=f"Output: {output_dir}")

    try:
        # Load and preprocess image
        update_job(job_id, progress="Removing background...", progress_pct=15,
                   log_line="Processing image with rembg...")

        sys.path.insert(0, str(TRIPOSR_DIR))
        from tsr.utils import remove_background, resize_foreground

        image = Image.open(source_path)
        image = remove_background(image, get_rembg_session())
        image = resize_foreground(image, 0.85)
        image = np.array(image).astype(np.float32) / 255.0
        image = image[:, :, :3] * image[:, :, 3:4] + (1 - image[:, :, 3:4]) * 0.5
        image = Image.fromarray((image * 255.0).astype(np.uint8))

        # Save processed input
        input_path = output_dir / "input.png"
        image.save(input_path)
        update_job(job_id, progress="Background removed", progress_pct=25,
                   log_line=f"Saved processed input: {input_path}")

        # Load model
        update_job(job_id, progress="Loading TripoSR model...", progress_pct=30,
                   log_line="Loading model (may download on first run)...")
        model = get_model()

        # Run model
        update_job(job_id, progress="Running 3D reconstruction...", progress_pct=40,
                   log_line="Running TripoSR inference...")

        with torch.no_grad():
            scene_codes = model([image], device="cpu")

        update_job(job_id, progress="Model inference complete", progress_pct=60,
                   log_line="Scene codes generated")

        # Extract mesh
        update_job(job_id, progress="Extracting mesh...", progress_pct=65,
                   log_line="Running marching cubes...")

        # Use vertex colors (baking requires OpenGL display which isn't available in Docker)
        meshes = model.extract_mesh(scene_codes, has_vertex_color=True, resolution=256)

        update_job(job_id, progress="Mesh extracted", progress_pct=75,
                   log_line=f"Vertices: {len(meshes[0].vertices)}")

        # Export mesh with vertex colors (GLB format for web compatibility)
        update_job(job_id, progress="Exporting mesh...", progress_pct=85,
                   log_line="Exporting to GLB format with vertex colors...")

        mesh_path = output_dir / f"{asset_id}.glb"
        meshes[0].export(str(mesh_path))

        update_job(job_id, progress="Mesh exported", progress_pct=95,
                   log_line=f"Model saved: {mesh_path}")

        # Success
        update_job(
            job_id,
            status="completed",
            progress="Complete!",
            progress_pct=100,
            result_path=str(mesh_path),
            log_line="Generation complete!",
        )
        logger.info(f"Job {job_id} completed: {mesh_path}")

    except Exception as e:
        logger.exception(f"Job {job_id} failed")
        update_job(
            job_id,
            status="failed",
            error=str(e),
            progress="Failed",
            log_line=f"Error: {e}",
        )


def worker_loop(poll_interval: float = 3.0):
    """Main worker loop."""
    logger.info("3D Generation Worker started")
    logger.info(f"Jobs directory: {JOBS_DIR}")
    logger.info(f"Concept art directory: {CONCEPT_ART_DIR}")
    logger.info(f"Output directory: {OUTPUT_BASE_DIR}")

    while True:
        try:
            job = get_next_pending_job()
            if job:
                process_job(job)
            else:
                time.sleep(poll_interval)
        except KeyboardInterrupt:
            logger.info("Worker stopped")
            break
        except Exception as e:
            logger.exception(f"Worker error: {e}")
            time.sleep(poll_interval)


def main():
    parser = argparse.ArgumentParser(description="3D Generation Worker")
    parser.add_argument("--watch", action="store_true", help="Continuously watch for new jobs")
    parser.add_argument("--once", action="store_true", help="Process one job and exit")
    parser.add_argument("--poll-interval", type=float, default=3.0, help="Seconds between job checks")
    args = parser.parse_args()

    if args.once:
        job = get_next_pending_job()
        if job:
            process_job(job)
        else:
            logger.info("No pending jobs")
    else:
        worker_loop(args.poll_interval)


if __name__ == "__main__":
    main()
