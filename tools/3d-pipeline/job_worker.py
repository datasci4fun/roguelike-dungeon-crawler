#!/usr/bin/env python3
"""
3D Asset Generation Job Worker

Polls the job queue and processes pending generation jobs using TripoSR.
Run this on the host machine (not in Docker) for GPU access.

Usage:
    python tools/3d-pipeline/job_worker.py          # Process one job and exit
    python tools/3d-pipeline/job_worker.py --watch  # Watch for jobs continuously
    python tools/3d-pipeline/job_worker.py --list   # List pending jobs
"""

import argparse
import json
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

import requests

# Configuration
API_BASE = "http://localhost:8000"
JOBS_DIR = Path(__file__).parent.parent.parent / "jobs"
SCRIPT_DIR = Path(__file__).parent
TRIPOSR_DIR = SCRIPT_DIR / "TripoSR"
VENV_PYTHON = TRIPOSR_DIR / ".venv" / "Scripts" / "python.exe"
RUN_SCRIPT = TRIPOSR_DIR / "run.py"
PROJECT_ROOT = Path(__file__).parent.parent.parent


def log(msg: str):
    """Print timestamped log message."""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {msg}")


def check_triposr():
    """Verify TripoSR is installed."""
    if not VENV_PYTHON.exists():
        log(f"ERROR: TripoSR venv not found at {VENV_PYTHON}")
        log("Install: cd tools/3d-pipeline/TripoSR && python -m venv .venv && .venv/Scripts/pip install -r requirements.txt")
        return False
    if not RUN_SCRIPT.exists():
        log(f"ERROR: TripoSR run.py not found at {RUN_SCRIPT}")
        return False
    return True


def get_pending_jobs() -> list[dict]:
    """Fetch pending jobs from the API."""
    try:
        response = requests.get(f"{API_BASE}/api/assets/jobs", params={"status": "pending"})
        if response.ok:
            return response.json().get("jobs", [])
    except requests.RequestException as e:
        log(f"ERROR: Could not connect to API: {e}")
    return []


def update_job(
    job_id: str,
    status: str = None,
    error: str = None,
    result_path: str = None,
    progress: str = None,
    progress_pct: int = None,
    log_line: str = None,
):
    """Update job via API."""
    try:
        data = {}
        if status:
            data["status"] = status
        if error:
            data["error"] = error
        if result_path:
            data["result_path"] = result_path
        if progress:
            data["progress"] = progress
        if progress_pct is not None:
            data["progress_pct"] = progress_pct
        if log_line:
            data["log_line"] = log_line

        response = requests.patch(
            f"{API_BASE}/api/assets/jobs/{job_id}",
            json=data,
            timeout=5,
        )
        return response.ok
    except requests.RequestException:
        # Fall back to updating file directly
        job_file = JOBS_DIR / f"{job_id}.json"
        if job_file.exists():
            with open(job_file, "r") as f:
                job = json.load(f)
            if status:
                job["status"] = status
            if error:
                job["error"] = error
            if result_path:
                job["result_path"] = result_path
            if progress:
                job["progress"] = progress
            if progress_pct is not None:
                job["progress_pct"] = progress_pct
            if log_line:
                if "logs" not in job:
                    job["logs"] = []
                job["logs"].append(log_line)
                job["logs"] = job["logs"][-20:]
            job["updated_at"] = datetime.utcnow().isoformat()
            with open(job_file, "w") as f:
                json.dump(job, f, indent=2)
            return True
    return False


def process_job(job: dict) -> bool:
    """Process a single generation job."""
    job_id = job["job_id"]
    asset_id = job["asset_id"]
    source_image = PROJECT_ROOT / job["source_image"]
    output_dir = PROJECT_ROOT / job["output_dir"]
    texture_res = job.get("texture_resolution", 1024)
    device = job.get("device", "cuda")

    log(f"Processing job {job_id} for asset '{asset_id}'")
    log(f"  Source: {source_image}")
    log(f"  Output: {output_dir}")
    log(f"  Device: {device}, Texture: {texture_res}px")

    # Verify source exists
    if not source_image.exists():
        log(f"ERROR: Source image not found: {source_image}")
        update_job(job_id, status="failed", error=f"Source image not found: {source_image}")
        return False

    # Mark as processing
    update_job(job_id, status="processing", progress="Initializing...", progress_pct=0)

    # Ensure output directory exists
    output_dir.mkdir(parents=True, exist_ok=True)

    # Build TripoSR command
    cmd = [
        str(VENV_PYTHON),
        str(RUN_SCRIPT),
        str(source_image),
        "--output-dir", str(output_dir),
        "--device", device,
        "--bake-texture",
        "--texture-resolution", str(texture_res),
    ]

    log(f"Running TripoSR...")
    update_job(job_id, progress="Loading model...", progress_pct=5, log_line="Starting TripoSR...")

    try:
        # Run with real-time output capture
        process = subprocess.Popen(
            cmd,
            cwd=TRIPOSR_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )

        # Track progress based on output
        for line in process.stdout:
            line = line.strip()
            if not line:
                continue

            # Log the line
            log(f"  {line}")
            update_job(job_id, log_line=line)

            # Parse progress from TripoSR output
            line_lower = line.lower()
            if "loading" in line_lower and "checkpoint" in line_lower:
                update_job(job_id, progress="Loading checkpoint...", progress_pct=10)
            elif "running model" in line_lower or "processing image" in line_lower:
                update_job(job_id, progress="Processing image...", progress_pct=20)
            elif "running marching cubes" in line_lower:
                update_job(job_id, progress="Generating mesh...", progress_pct=50)
            elif "baking texture" in line_lower or "texture" in line_lower and "bak" in line_lower:
                update_job(job_id, progress="Baking texture...", progress_pct=70)
            elif "exporting" in line_lower or "saving" in line_lower:
                update_job(job_id, progress="Saving files...", progress_pct=90)

        process.wait(timeout=600)

        if process.returncode != 0:
            log(f"ERROR: TripoSR failed with code {process.returncode}")
            update_job(job_id, status="failed", error=f"Process exited with code {process.returncode}")
            return False

    except subprocess.TimeoutExpired:
        process.kill()
        log("ERROR: Generation timed out (10 minutes)")
        update_job(job_id, status="failed", error="Generation timed out")
        return False
    except Exception as e:
        log(f"ERROR: {e}")
        update_job(job_id, status="failed", error=str(e))
        return False

    update_job(job_id, progress="Processing output...", progress_pct=95)

    # Find generated files
    subdirs = sorted([d for d in output_dir.iterdir() if d.is_dir()])
    if not subdirs:
        log("ERROR: No output generated")
        update_job(job_id, status="failed", error="No output generated")
        return False

    latest_output = subdirs[-1]
    mesh_file = latest_output / "mesh.obj"

    if not mesh_file.exists():
        log(f"ERROR: mesh.obj not found in {latest_output}")
        update_job(job_id, status="failed", error="mesh.obj not found")
        return False

    # Rename output files
    final_mesh = output_dir / f"{asset_id}.obj"
    final_texture = output_dir / f"{asset_id}_texture.png"

    mesh_file.rename(final_mesh)
    texture_file = latest_output / "texture.png"
    if texture_file.exists():
        texture_file.rename(final_texture)

    # Clean up temp directory
    input_file = latest_output / "input.png"
    if input_file.exists():
        input_file.unlink()
    try:
        latest_output.rmdir()
    except OSError:
        pass  # Directory not empty

    log(f"SUCCESS: Generated {final_mesh}")
    result_rel_path = str(final_mesh.relative_to(PROJECT_ROOT))
    update_job(
        job_id,
        status="completed",
        result_path=result_rel_path,
        progress="Complete!",
        progress_pct=100,
        log_line=f"Output: {result_rel_path}",
    )

    # Print next steps
    log("")
    log("Next steps:")
    log(f"  1. Convert to GLB: python -c \"import trimesh; m=trimesh.load('{final_mesh}'); m.export('{output_dir}/{asset_id}.glb')\"")
    log(f"  2. Update assetQueue.ts with modelPath: '/assets/models/{asset_id}/{asset_id}.glb'")
    log("")

    return True


def list_jobs():
    """List all pending jobs."""
    jobs = get_pending_jobs()
    if not jobs:
        log("No pending jobs")
        return

    log(f"Pending jobs ({len(jobs)}):")
    for job in jobs:
        log(f"  [{job['job_id']}] {job['asset_id']} - {job['source_image']}")


def watch_jobs(interval: int = 5):
    """Continuously watch for and process jobs."""
    log(f"Watching for jobs (polling every {interval}s)... Press Ctrl+C to stop")

    try:
        while True:
            jobs = get_pending_jobs()
            if jobs:
                log(f"Found {len(jobs)} pending job(s)")
                for job in jobs:
                    process_job(job)
            time.sleep(interval)
    except KeyboardInterrupt:
        log("Stopped")


def main():
    parser = argparse.ArgumentParser(description="3D Asset Generation Job Worker")
    parser.add_argument("--watch", action="store_true", help="Watch for jobs continuously")
    parser.add_argument("--list", action="store_true", help="List pending jobs")
    parser.add_argument("--interval", type=int, default=5, help="Poll interval in seconds (default: 5)")

    args = parser.parse_args()

    # Check TripoSR installation
    if not args.list and not check_triposr():
        sys.exit(1)

    if args.list:
        list_jobs()
    elif args.watch:
        watch_jobs(args.interval)
    else:
        # Process one job and exit
        jobs = get_pending_jobs()
        if not jobs:
            log("No pending jobs")
            sys.exit(0)

        job = jobs[0]
        success = process_job(job)
        sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
