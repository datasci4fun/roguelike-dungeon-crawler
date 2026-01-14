"""
Pydantic schemas for 3D Asset API.

These schemas provide:
- Type validation for API requests and responses
- OpenAPI/Swagger documentation
- Request/response serialization
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class AssetCategory(str, Enum):
    """Asset category types."""
    ENEMY = "enemy"
    BOSS = "boss"
    ITEM = "item"
    PROP = "prop"
    CHARACTER = "character"


class AssetStatus(str, Enum):
    """Asset generation status."""
    QUEUED = "queued"
    GENERATING = "generating"
    DONE = "done"
    ERROR = "error"


class AssetPriority(str, Enum):
    """Asset generation priority."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class JobStatus(str, Enum):
    """Job execution status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


# =============================================================================
# Asset Schemas
# =============================================================================

class Asset3DBase(BaseModel):
    """Base asset properties for creation."""
    asset_id: str = Field(..., description="Unique asset identifier (e.g., 'goblin')")
    name: str = Field(..., description="Display name")
    category: AssetCategory = Field(..., description="Asset category")
    priority: AssetPriority = Field(AssetPriority.MEDIUM, description="Generation priority")
    notes: Optional[str] = Field(None, description="Description or notes")


class Asset3DCreate(Asset3DBase):
    """Schema for creating a new asset."""

    class Config:
        json_schema_extra = {
            "example": {
                "asset_id": "skeleton",
                "name": "Skeleton Warrior",
                "category": "enemy",
                "priority": "high",
                "notes": "Classic undead. Sword and shield."
            }
        }


class Asset3DUpdate(BaseModel):
    """Schema for updating an asset (all fields optional)."""
    name: Optional[str] = Field(None, description="Display name")
    category: Optional[AssetCategory] = Field(None, description="Asset category")
    status: Optional[AssetStatus] = Field(None, description="Generation status")
    priority: Optional[AssetPriority] = Field(None, description="Generation priority")
    source_image: Optional[str] = Field(None, description="Path to concept art")
    model_path: Optional[str] = Field(None, description="Path to generated GLB model")
    texture_path: Optional[str] = Field(None, description="Path to texture file")
    notes: Optional[str] = Field(None, description="Description or notes")
    vertex_count: Optional[int] = Field(None, description="Number of vertices in model")
    file_size_bytes: Optional[int] = Field(None, description="Model file size in bytes")


class Asset3DResponse(BaseModel):
    """Full asset response."""
    asset_id: str = Field(..., description="Unique asset identifier")
    name: str = Field(..., description="Display name")
    category: str = Field(..., description="Asset category")
    status: str = Field(..., description="Generation status")
    priority: str = Field(..., description="Generation priority")
    source_image: Optional[str] = Field(None, description="Path to concept art")
    model_path: Optional[str] = Field(None, description="Path to generated GLB model")
    texture_path: Optional[str] = Field(None, description="Path to texture file")
    notes: Optional[str] = Field(None, description="Description or notes")
    vertex_count: Optional[int] = Field(None, description="Number of vertices in model")
    file_size_bytes: Optional[int] = Field(None, description="Model file size in bytes")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "asset_id": "goblin",
                "name": "Goblin",
                "category": "enemy",
                "status": "done",
                "priority": "high",
                "source_image": "concept_art/goblin.png",
                "model_path": "/assets/models/goblin/goblin.glb",
                "notes": "Floor 1 common enemy",
                "vertex_count": 32344,
                "file_size_bytes": 1293772,
                "created_at": "2026-01-14T16:55:09Z",
                "updated_at": "2026-01-14T16:57:29Z"
            }
        }


# =============================================================================
# Job Schemas
# =============================================================================

class JobCreate(BaseModel):
    """Schema for creating a generation job."""
    asset_id: str = Field(..., description="Asset to generate model for")
    texture_resolution: int = Field(1024, ge=256, le=4096, description="Texture resolution")
    device: str = Field("cpu", pattern="^(cpu|cuda)$", description="Compute device")

    class Config:
        json_schema_extra = {
            "example": {
                "asset_id": "goblin",
                "texture_resolution": 1024,
                "device": "cpu"
            }
        }


class JobUpdate(BaseModel):
    """Schema for updating job status (used by worker)."""
    status: Optional[JobStatus] = Field(None, description="Job status")
    error: Optional[str] = Field(None, description="Error message if failed")
    result_path: Optional[str] = Field(None, description="Path to generated model")
    progress: Optional[str] = Field(None, description="Current progress description")
    progress_pct: Optional[int] = Field(None, ge=0, le=100, description="Progress percentage")
    log_line: Optional[str] = Field(None, description="Log line to append")


class JobResponse(BaseModel):
    """Full job response."""
    job_id: str = Field(..., description="Unique job identifier")
    asset_id: str = Field(..., description="Asset being generated")
    status: str = Field(..., description="Job status")
    source_image: str = Field(..., description="Input concept art path")
    output_dir: Optional[str] = Field(None, description="Output directory")
    texture_resolution: int = Field(..., description="Texture resolution")
    device: str = Field(..., description="Compute device")
    result_path: Optional[str] = Field(None, description="Path to generated model")
    error: Optional[str] = Field(None, description="Error message if failed")
    progress: Optional[str] = Field(None, description="Current progress description")
    progress_pct: Optional[int] = Field(None, description="Progress percentage (0-100)")
    logs: List[str] = Field(default_factory=list, description="Recent log lines")
    created_at: datetime = Field(..., description="Job creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "job_id": "d349347e",
                "asset_id": "goblin",
                "status": "completed",
                "source_image": "concept_art/goblin.png",
                "output_dir": "web/public/assets/models/goblin",
                "texture_resolution": 1024,
                "device": "cpu",
                "result_path": "/web_assets/models/goblin/goblin.glb",
                "progress": "Complete!",
                "progress_pct": 100,
                "logs": ["Loading model...", "Running inference...", "Export complete!"],
                "created_at": "2026-01-14T16:55:09Z",
                "updated_at": "2026-01-14T16:57:29Z"
            }
        }


class Asset3DWithJobs(Asset3DResponse):
    """Asset response including generation job history."""
    jobs: List[JobResponse] = Field(default_factory=list, description="Generation job history")


# =============================================================================
# Stats Schemas
# =============================================================================

class AssetStats(BaseModel):
    """Asset queue statistics."""
    total: int = Field(..., description="Total number of assets")
    queued: int = Field(..., description="Assets waiting for generation")
    generating: int = Field(..., description="Assets currently being generated")
    done: int = Field(..., description="Assets with completed models")
    error: int = Field(..., description="Assets with generation errors")
    by_category: dict = Field(default_factory=dict, description="Counts by category")

    class Config:
        json_schema_extra = {
            "example": {
                "total": 44,
                "queued": 40,
                "generating": 1,
                "done": 2,
                "error": 1,
                "by_category": {
                    "enemy": 15,
                    "boss": 8,
                    "item": 12,
                    "prop": 5,
                    "character": 4
                }
            }
        }


# =============================================================================
# Upload Schemas
# =============================================================================

class UploadResponse(BaseModel):
    """Response for file upload operations."""
    filename: str = Field(..., description="Uploaded filename")
    path: str = Field(..., description="Server path to file")
    size: int = Field(..., description="File size in bytes")
    asset_id: str = Field(..., description="Associated asset ID")

    class Config:
        json_schema_extra = {
            "example": {
                "filename": "goblin.png",
                "path": "concept_art/goblin.png",
                "size": 245678,
                "asset_id": "goblin"
            }
        }
