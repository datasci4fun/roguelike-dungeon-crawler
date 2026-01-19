"""3D Asset database models.

Models for tracking 3D game assets and their generation jobs.
Assets represent game entities (enemies, bosses, items, etc.) that need 3D models.
Jobs track the TripoSR generation process from concept art to GLB output.
"""
from datetime import datetime
from typing import Optional, List
import enum

from sqlalchemy import String, Integer, Boolean, Float, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base


class AssetCategory(str, enum.Enum):
    """Asset category types."""
    ENEMY = "enemy"
    BOSS = "boss"
    ITEM = "item"
    PROP = "prop"
    CHARACTER = "character"


class AssetStatus(str, enum.Enum):
    """Asset generation status."""
    QUEUED = "queued"
    GENERATING = "generating"
    DONE = "done"
    ERROR = "error"


class AssetPriority(str, enum.Enum):
    """Asset generation priority."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class JobStatus(str, enum.Enum):
    """Job execution status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Asset3D(Base):
    """3D Asset definition for game entities."""

    __tablename__ = "asset_3d"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    asset_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="queued", index=True)
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="medium")

    # File paths (relative to project root)
    source_image: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    model_path: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    texture_path: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Metadata
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    vertex_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    file_size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to jobs
    jobs: Mapped[List["GenerationJob"]] = relationship(
        "GenerationJob",
        back_populates="asset",
        order_by="desc(GenerationJob.created_at)",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Asset3D {self.asset_id}: {self.name}>"


class ProceduralModelCategory(str, enum.Enum):
    """Procedural model category types."""
    STRUCTURE = "structure"
    FURNITURE = "furniture"
    DECORATION = "decoration"
    INTERACTIVE = "interactive"
    PROP = "prop"
    ENEMY = "enemy"
    PLAYER = "player"


class ProceduralModelStatus(str, enum.Enum):
    """Procedural model status."""
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    WIP = "wip"


class ProceduralModel(Base):
    """Procedural 3D model registry (code-generated Three.js models)."""

    __tablename__ = "procedural_model"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    model_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", index=True)

    # Versioning support
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    base_model_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)

    # Source file info
    file_path: Mapped[str] = mapped_column(String(255), nullable=False)
    factory_function: Mapped[str] = mapped_column(String(100), nullable=False)
    meta_export: Mapped[str] = mapped_column(String(100), nullable=False)

    # Linked game entity (for enemy/player models)
    enemy_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    race_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    class_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)

    # Model metadata
    tags: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    bounding_box: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    default_scale: Mapped[Optional[float]] = mapped_column(nullable=True, default=1.0)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<ProceduralModel {self.model_id} v{self.version}>"


class GenerationJob(Base):
    """3D model generation job tracking."""

    __tablename__ = "generation_job"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    job_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    asset_id: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("asset_3d.asset_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", index=True)

    # Configuration
    source_image: Mapped[str] = mapped_column(String(255), nullable=False)
    output_dir: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    texture_resolution: Mapped[int] = mapped_column(Integer, nullable=False, default=1024)
    device: Mapped[str] = mapped_column(String(20), nullable=False, default="cpu")

    # Results
    result_path: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Progress tracking
    progress: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    progress_pct: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    logs: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True, default=list)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to asset
    asset: Mapped["Asset3D"] = relationship("Asset3D", back_populates="jobs")

    def __repr__(self) -> str:
        return f"<GenerationJob {self.job_id}: {self.asset_id} ({self.status})>"
