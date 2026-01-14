"""
Asset Management API - Upload concept art and manage 3D asset generation jobs.

Handles file uploads and generation job queue for the 3D asset pipeline dev tool.
"""

import json
import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from .dbexplorer import require_debug

router = APIRouter(prefix="/api/assets", tags=["assets"])

# Path to concept_art directory
# In Docker: mounted at /concept_art
# Locally: at repo root (parent of server/)
def get_concept_art_dir() -> Path:
    """Get the concept_art directory path (works in Docker and local)."""
    # Check for Docker mount first
    docker_path = Path("/concept_art")
    if docker_path.exists():
        return docker_path
    # Fall back to local development path
    return Path(__file__).parent.parent.parent.parent / "concept_art"

CONCEPT_ART_DIR = get_concept_art_dir()


class UploadResponse(BaseModel):
    """Response for concept art upload."""
    success: bool
    asset_id: str
    filename: str
    path: str
    size: int


@router.post("/concept-art/{asset_id}")
async def upload_concept_art(
    asset_id: str,
    file: UploadFile = File(...),
):
    """
    Upload concept art image for a specific asset.

    The file will be saved to concept_art/<asset_id>.png
    """
    # Validate asset_id (prevent path traversal)
    if "/" in asset_id or "\\" in asset_id or ".." in asset_id:
        raise HTTPException(status_code=400, detail="Invalid asset ID")

    # Validate file type
    allowed_types = {"image/png", "image/jpeg", "image/jpg", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed: {', '.join(allowed_types)}"
        )

    # Ensure concept_art directory exists
    CONCEPT_ART_DIR.mkdir(parents=True, exist_ok=True)

    # Determine output filename (always save as .png for consistency)
    output_filename = f"{asset_id}.png"
    output_path = CONCEPT_ART_DIR / output_filename

    try:
        # Save the uploaded file
        with open(output_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        file_size = output_path.stat().st_size

        return UploadResponse(
            success=True,
            asset_id=asset_id,
            filename=output_filename,
            path=f"concept_art/{output_filename}",
            size=file_size,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")


@router.get("/concept-art")
async def list_concept_art():
    """List all concept art files in the concept_art directory."""
    if not CONCEPT_ART_DIR.exists():
        return {"files": [], "total": 0}

    files = []
    for f in CONCEPT_ART_DIR.iterdir():
        if f.is_file() and f.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}:
            files.append({
                "filename": f.name,
                "asset_id": f.stem,
                "size": f.stat().st_size,
                "path": f"concept_art/{f.name}",
            })

    # Sort by filename
    files.sort(key=lambda x: x["filename"])

    return {"files": files, "total": len(files)}


@router.delete("/concept-art/{asset_id}")
async def delete_concept_art(asset_id: str):
    """Delete concept art for a specific asset."""
    # Validate asset_id
    if "/" in asset_id or "\\" in asset_id or ".." in asset_id:
        raise HTTPException(status_code=400, detail="Invalid asset ID")

    # Look for the file with any image extension
    for ext in [".png", ".jpg", ".jpeg", ".webp"]:
        file_path = CONCEPT_ART_DIR / f"{asset_id}{ext}"
        if file_path.exists():
            file_path.unlink()
            return {"success": True, "deleted": f"{asset_id}{ext}"}

    raise HTTPException(status_code=404, detail=f"No concept art found for asset: {asset_id}")


# =============================================================================
# Job Queue for 3D Model Generation
# =============================================================================

def get_jobs_dir() -> Path:
    """Get the jobs directory path (works in Docker and local)."""
    docker_path = Path("/jobs")
    if docker_path.parent.exists() and docker_path.parent == Path("/"):
        # We're in Docker, use /jobs
        docker_path.mkdir(exist_ok=True)
        return docker_path
    # Fall back to local development path
    local_path = Path(__file__).parent.parent.parent.parent / "jobs"
    local_path.mkdir(exist_ok=True)
    return local_path

JOBS_DIR = get_jobs_dir()


class GenerationJob(BaseModel):
    """A 3D model generation job."""
    job_id: str
    asset_id: str
    status: str  # pending, processing, completed, failed
    created_at: str
    updated_at: str
    source_image: str
    output_dir: Optional[str] = None
    texture_resolution: int = 1024
    device: str = "cpu"
    error: Optional[str] = None
    result_path: Optional[str] = None
    progress: Optional[str] = None  # Current step description
    progress_pct: Optional[int] = None  # 0-100 percentage
    logs: list[str] = []  # Recent log lines


class CreateJobRequest(BaseModel):
    """Request to create a generation job."""
    asset_id: str
    texture_resolution: int = 1024
    device: str = "cpu"


def load_jobs() -> list[GenerationJob]:
    """Load all jobs from the jobs directory."""
    jobs = []
    if not JOBS_DIR.exists():
        return jobs

    for job_file in JOBS_DIR.glob("*.json"):
        try:
            with open(job_file, "r") as f:
                data = json.load(f)
                jobs.append(GenerationJob(**data))
        except Exception:
            pass  # Skip invalid job files

    # Sort by created_at descending (newest first)
    jobs.sort(key=lambda j: j.created_at, reverse=True)
    return jobs


def save_job(job: GenerationJob):
    """Save a job to the jobs directory."""
    JOBS_DIR.mkdir(exist_ok=True)
    job_path = JOBS_DIR / f"{job.job_id}.json"
    with open(job_path, "w") as f:
        json.dump(job.model_dump(), f, indent=2)


def get_job(job_id: str) -> Optional[GenerationJob]:
    """Get a specific job by ID."""
    job_path = JOBS_DIR / f"{job_id}.json"
    if not job_path.exists():
        return None
    try:
        with open(job_path, "r") as f:
            return GenerationJob(**json.load(f))
    except Exception:
        return None


@router.post("/jobs")
async def create_generation_job(request: CreateJobRequest):
    """
    Create a new 3D model generation job.

    The job will be picked up by the host-side worker script.
    """
    asset_id = request.asset_id

    # Validate asset_id
    if "/" in asset_id or "\\" in asset_id or ".." in asset_id:
        raise HTTPException(status_code=400, detail="Invalid asset ID")

    # Check if concept art exists
    source_image = None
    for ext in [".png", ".jpg", ".jpeg", ".webp"]:
        candidate = CONCEPT_ART_DIR / f"{asset_id}{ext}"
        if candidate.exists():
            source_image = f"concept_art/{asset_id}{ext}"
            break

    if not source_image:
        raise HTTPException(
            status_code=400,
            detail=f"No concept art found for asset '{asset_id}'. Upload concept art first."
        )

    # Check for existing pending/processing job
    existing_jobs = load_jobs()
    for job in existing_jobs:
        if job.asset_id == asset_id and job.status in ("pending", "processing"):
            raise HTTPException(
                status_code=409,
                detail=f"Job already exists for asset '{asset_id}' (status: {job.status})"
            )

    # Create new job
    now = datetime.utcnow().isoformat()
    job = GenerationJob(
        job_id=str(uuid4())[:8],
        asset_id=asset_id,
        status="pending",
        created_at=now,
        updated_at=now,
        source_image=source_image,
        output_dir=f"web/public/assets/models/{asset_id}",
        texture_resolution=request.texture_resolution,
        device=request.device,
    )

    save_job(job)

    return {
        "success": True,
        "job": job.model_dump(),
        "message": f"Job created. Run 'python tools/3d-pipeline/job_worker.py' to process."
    }


@router.get("/jobs")
async def list_jobs(status: Optional[str] = None):
    """List all generation jobs, optionally filtered by status."""
    jobs = load_jobs()

    if status:
        jobs = [j for j in jobs if j.status == status]

    return {
        "jobs": [j.model_dump() for j in jobs],
        "total": len(jobs),
    }


@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Get the status of a specific job."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")
    return job.model_dump()


class UpdateJobRequest(BaseModel):
    """Request to update a job."""
    status: Optional[str] = None
    error: Optional[str] = None
    result_path: Optional[str] = None
    progress: Optional[str] = None
    progress_pct: Optional[int] = None
    log_line: Optional[str] = None  # Append a single log line


@router.patch("/jobs/{job_id}")
async def update_job_status(job_id: str, request: UpdateJobRequest):
    """
    Update a job's status and progress. Used by the worker script.
    """
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")

    if request.status:
        if request.status not in ("pending", "processing", "completed", "failed"):
            raise HTTPException(status_code=400, detail=f"Invalid status: {request.status}")
        job.status = request.status

    if request.error is not None:
        job.error = request.error

    if request.result_path is not None:
        job.result_path = request.result_path

    if request.progress is not None:
        job.progress = request.progress

    if request.progress_pct is not None:
        job.progress_pct = max(0, min(100, request.progress_pct))

    if request.log_line is not None:
        # Keep last 20 log lines
        job.logs.append(request.log_line)
        job.logs = job.logs[-20:]

    job.updated_at = datetime.utcnow().isoformat()
    save_job(job)

    return job.model_dump()


@router.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    """Delete a job."""
    job_path = JOBS_DIR / f"{job_id}.json"
    if not job_path.exists():
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")

    job_path.unlink()
    return {"success": True, "deleted": job_id}


# =============================================================================
# Worker Status (runs as separate Docker container)
# =============================================================================


@router.get("/worker/status")
async def get_worker_status():
    """
    Get the worker status.

    Note: The 3D generation worker runs as a separate Docker container
    (roguelike_3d_worker) and processes jobs automatically.
    """
    # Check for any processing jobs as indicator that worker is active
    jobs_list = load_jobs()
    processing = [j for j in jobs_list if j.status == "processing"]
    pending = [j for j in jobs_list if j.status == "pending"]

    return {
        "running": True,  # Worker container runs continuously
        "status": "processing" if processing else "idle",
        "current_job": processing[0].job_id if processing else None,
        "pending_count": len(pending),
        "message": "Worker runs automatically via Docker container",
    }
