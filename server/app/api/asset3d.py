"""
3D Asset Management API - Database-backed asset and job tracking.

Provides CRUD operations for 3D assets and generation jobs stored in PostgreSQL.
Maintains backward compatibility with JSON file-based jobs for the Docker worker.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional, List
from uuid import uuid4

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..core.database import get_db
from ..models.asset3d import Asset3D, GenerationJob
from ..schemas.asset3d import (
    Asset3DCreate,
    Asset3DUpdate,
    Asset3DResponse,
    Asset3DWithJobs,
    JobCreate,
    JobUpdate,
    JobResponse,
    AssetStats,
    UploadResponse,
)

router = APIRouter(prefix="/api/assets3d", tags=["3D Assets"])


# =============================================================================
# Path Helpers
# =============================================================================

def get_concept_art_dir() -> Path:
    """Get the concept_art directory path (works in Docker and local)."""
    docker_path = Path("/concept_art")
    if docker_path.exists():
        return docker_path
    return Path(__file__).parent.parent.parent.parent / "concept_art"


def get_jobs_dir() -> Path:
    """Get the jobs directory path for JSON fallback."""
    docker_path = Path("/jobs")
    if docker_path.parent.exists() and docker_path.parent == Path("/"):
        docker_path.mkdir(exist_ok=True)
        return docker_path
    local_path = Path(__file__).parent.parent.parent.parent / "jobs"
    local_path.mkdir(exist_ok=True)
    return local_path


CONCEPT_ART_DIR = get_concept_art_dir()
JOBS_DIR = get_jobs_dir()


# =============================================================================
# Asset Endpoints
# =============================================================================

@router.get("", response_model=List[Asset3DResponse])
async def list_assets(
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    db: AsyncSession = Depends(get_db),
):
    """List all 3D assets with optional filters."""
    query = select(Asset3D)

    if category:
        query = query.where(Asset3D.category == category)
    if status:
        query = query.where(Asset3D.status == status)
    if priority:
        query = query.where(Asset3D.priority == priority)

    query = query.order_by(Asset3D.created_at.desc())

    result = await db.execute(query)
    assets = result.scalars().all()

    return assets


@router.get("/stats", response_model=AssetStats)
async def get_asset_stats(db: AsyncSession = Depends(get_db)):
    """Get asset queue statistics."""
    # Count by status
    status_query = select(Asset3D.status, func.count(Asset3D.id)).group_by(Asset3D.status)
    status_result = await db.execute(status_query)
    status_counts = {row[0]: row[1] for row in status_result.all()}

    # Count by category
    category_query = select(Asset3D.category, func.count(Asset3D.id)).group_by(Asset3D.category)
    category_result = await db.execute(category_query)
    category_counts = {row[0]: row[1] for row in category_result.all()}

    total = sum(status_counts.values())

    return AssetStats(
        total=total,
        queued=status_counts.get("queued", 0),
        generating=status_counts.get("generating", 0),
        done=status_counts.get("done", 0),
        error=status_counts.get("error", 0),
        by_category=category_counts,
    )


@router.get("/{asset_id}", response_model=Asset3DWithJobs)
async def get_asset(
    asset_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a single asset with its generation job history."""
    query = (
        select(Asset3D)
        .where(Asset3D.asset_id == asset_id)
        .options(selectinload(Asset3D.jobs))
    )
    result = await db.execute(query)
    asset = result.scalar_one_or_none()

    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset not found: {asset_id}")

    return asset


@router.post("", response_model=Asset3DResponse, status_code=201)
async def create_asset(
    request: Asset3DCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new 3D asset definition."""
    # Validate asset_id
    if "/" in request.asset_id or "\\" in request.asset_id or ".." in request.asset_id:
        raise HTTPException(status_code=400, detail="Invalid asset ID")

    # Check for duplicate
    existing = await db.execute(
        select(Asset3D).where(Asset3D.asset_id == request.asset_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Asset already exists: {request.asset_id}")

    asset = Asset3D(
        asset_id=request.asset_id,
        name=request.name,
        category=request.category.value,
        priority=request.priority.value,
        notes=request.notes,
    )

    db.add(asset)
    await db.commit()
    await db.refresh(asset)

    return asset


@router.patch("/{asset_id}", response_model=Asset3DResponse)
async def update_asset(
    asset_id: str,
    request: Asset3DUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing asset."""
    result = await db.execute(select(Asset3D).where(Asset3D.asset_id == asset_id))
    asset = result.scalar_one_or_none()

    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset not found: {asset_id}")

    # Update only provided fields
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            # Handle enum values
            if hasattr(value, 'value'):
                value = value.value
            setattr(asset, field, value)

    asset.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(asset)

    return asset


@router.delete("/{asset_id}")
async def delete_asset(
    asset_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Delete an asset and all its jobs."""
    result = await db.execute(select(Asset3D).where(Asset3D.asset_id == asset_id))
    asset = result.scalar_one_or_none()

    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset not found: {asset_id}")

    await db.delete(asset)
    await db.commit()

    return {"success": True, "deleted": asset_id}


# =============================================================================
# Concept Art Upload (kept for convenience)
# =============================================================================

@router.post("/{asset_id}/concept-art", response_model=UploadResponse)
async def upload_concept_art(
    asset_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload concept art for an asset and update the asset record."""
    # Validate asset_id
    if "/" in asset_id or "\\" in asset_id or ".." in asset_id:
        raise HTTPException(status_code=400, detail="Invalid asset ID")

    # Get asset from database
    result = await db.execute(select(Asset3D).where(Asset3D.asset_id == asset_id))
    asset = result.scalar_one_or_none()

    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset not found: {asset_id}")

    # Validate file type
    allowed_types = {"image/png", "image/jpeg", "image/jpg", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed: {', '.join(allowed_types)}"
        )

    # Ensure directory exists
    CONCEPT_ART_DIR.mkdir(parents=True, exist_ok=True)

    # Save file
    output_filename = f"{asset_id}.png"
    output_path = CONCEPT_ART_DIR / output_filename

    try:
        content = await file.read()
        with open(output_path, "wb") as buffer:
            buffer.write(content)

        file_size = output_path.stat().st_size

        # Update asset record
        asset.source_image = f"concept_art/{output_filename}"
        asset.updated_at = datetime.utcnow()
        await db.commit()

        return UploadResponse(
            filename=output_filename,
            path=f"concept_art/{output_filename}",
            size=file_size,
            asset_id=asset_id,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")


# =============================================================================
# Job Endpoints
# =============================================================================

def write_job_json(job: GenerationJob):
    """Write job to JSON file for Docker worker compatibility."""
    JOBS_DIR.mkdir(exist_ok=True)
    job_path = JOBS_DIR / f"{job.job_id}.json"
    job_data = {
        "job_id": job.job_id,
        "asset_id": job.asset_id,
        "status": job.status,
        "created_at": job.created_at.isoformat(),
        "updated_at": job.updated_at.isoformat(),
        "source_image": job.source_image,
        "output_dir": job.output_dir,
        "texture_resolution": job.texture_resolution,
        "device": job.device,
        "error": job.error,
        "result_path": job.result_path,
        "progress": job.progress,
        "progress_pct": job.progress_pct,
        "logs": job.logs or [],
    }
    with open(job_path, "w") as f:
        json.dump(job_data, f, indent=2)


def delete_job_json(job_id: str):
    """Delete JSON file for a job."""
    job_path = JOBS_DIR / f"{job_id}.json"
    if job_path.exists():
        job_path.unlink()


@router.get("/jobs", response_model=List[JobResponse])
async def list_jobs(
    status: Optional[str] = Query(None, description="Filter by status"),
    asset_id: Optional[str] = Query(None, description="Filter by asset"),
    db: AsyncSession = Depends(get_db),
):
    """List all generation jobs with optional filters."""
    query = select(GenerationJob)

    if status:
        query = query.where(GenerationJob.status == status)
    if asset_id:
        query = query.where(GenerationJob.asset_id == asset_id)

    query = query.order_by(GenerationJob.created_at.desc())

    result = await db.execute(query)
    jobs = result.scalars().all()

    return jobs


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific job by ID."""
    result = await db.execute(
        select(GenerationJob).where(GenerationJob.job_id == job_id)
    )
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")

    return job


@router.post("/jobs", response_model=JobResponse, status_code=201)
async def create_job(
    request: JobCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new 3D model generation job."""
    asset_id = request.asset_id

    # Get asset from database
    result = await db.execute(select(Asset3D).where(Asset3D.asset_id == asset_id))
    asset = result.scalar_one_or_none()

    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset not found: {asset_id}")

    # Check for concept art
    if not asset.source_image:
        # Try to find concept art file
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

        # Update asset with found source_image
        asset.source_image = source_image
    else:
        source_image = asset.source_image

    # Check for existing pending/processing job
    existing = await db.execute(
        select(GenerationJob).where(
            GenerationJob.asset_id == asset_id,
            GenerationJob.status.in_(["pending", "processing"])
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail=f"Active job already exists for asset '{asset_id}'"
        )

    # Create job
    now = datetime.utcnow()
    job = GenerationJob(
        job_id=str(uuid4())[:8],
        asset_id=asset_id,
        status="pending",
        source_image=source_image,
        output_dir=f"web/public/assets/models/{asset_id}",
        texture_resolution=request.texture_resolution,
        device=request.device,
        created_at=now,
        updated_at=now,
        logs=[],
    )

    db.add(job)

    # Update asset status
    asset.status = "generating"
    asset.updated_at = now

    await db.commit()
    await db.refresh(job)

    # Write JSON file for Docker worker
    write_job_json(job)

    return job


@router.patch("/jobs/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: str,
    request: JobUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a job's status and progress. Used by the worker."""
    result = await db.execute(
        select(GenerationJob).where(GenerationJob.job_id == job_id)
    )
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")

    # Update job fields
    if request.status:
        if request.status.value not in ("pending", "processing", "completed", "failed"):
            raise HTTPException(status_code=400, detail=f"Invalid status: {request.status}")
        job.status = request.status.value

    if request.error is not None:
        job.error = request.error

    if request.result_path is not None:
        job.result_path = request.result_path

    if request.progress is not None:
        job.progress = request.progress

    if request.progress_pct is not None:
        job.progress_pct = max(0, min(100, request.progress_pct))

    if request.log_line is not None:
        if job.logs is None:
            job.logs = []
        job.logs.append(request.log_line)
        job.logs = job.logs[-20:]  # Keep last 20 lines

    job.updated_at = datetime.utcnow()

    # Sync asset status when job completes or fails
    if request.status:
        asset_result = await db.execute(
            select(Asset3D).where(Asset3D.asset_id == job.asset_id)
        )
        asset = asset_result.scalar_one_or_none()
        if asset:
            if request.status.value == "completed":
                asset.status = "done"
                if request.result_path:
                    asset.model_path = request.result_path
            elif request.status.value == "failed":
                asset.status = "error"
            asset.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(job)

    # Update JSON file for Docker worker
    write_job_json(job)

    return job


@router.delete("/jobs/{job_id}")
async def delete_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Delete a job."""
    result = await db.execute(
        select(GenerationJob).where(GenerationJob.job_id == job_id)
    )
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")

    await db.delete(job)
    await db.commit()

    # Delete JSON file
    delete_job_json(job_id)

    return {"success": True, "deleted": job_id}


# =============================================================================
# Worker Status
# =============================================================================

@router.get("/worker/status")
async def get_worker_status(db: AsyncSession = Depends(get_db)):
    """Get the worker status based on job states."""
    processing = await db.execute(
        select(func.count(GenerationJob.id)).where(GenerationJob.status == "processing")
    )
    processing_count = processing.scalar()

    pending = await db.execute(
        select(func.count(GenerationJob.id)).where(GenerationJob.status == "pending")
    )
    pending_count = pending.scalar()

    # Get current job if processing
    current_job = None
    if processing_count > 0:
        result = await db.execute(
            select(GenerationJob).where(GenerationJob.status == "processing").limit(1)
        )
        job = result.scalar_one_or_none()
        if job:
            current_job = job.job_id

    return {
        "running": True,
        "status": "processing" if processing_count > 0 else "idle",
        "current_job": current_job,
        "pending_count": pending_count,
        "message": "Worker runs automatically via Docker container",
    }
