"""Codebase health models for storing file stats and refactor suggestions."""
from datetime import datetime
from typing import Optional, List

from sqlalchemy import Integer, String, DateTime, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column

from ..core.database import Base


class CodebaseFileStats(Base):
    """Stores file statistics from codebase health scans.

    Each record represents a single file with its metrics.
    Data is replaced entirely with each new scan (latest only).
    """

    __tablename__ = "codebase_file_stats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    path: Mapped[str] = mapped_column(String(500), unique=True, index=True, nullable=False)
    loc: Mapped[int] = mapped_column(Integer, nullable=False)
    nesting_depth: Mapped[int] = mapped_column(Integer, nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    area: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    size_category: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<CodebaseFileStats(path={self.path}, loc={self.loc})>"


class CodebaseRefactorTodo(Base):
    """Stores refactoring suggestions from codebase health scans.

    Each record represents a suggested refactoring task.
    Data is replaced entirely with each new scan (latest only).
    """

    __tablename__ = "codebase_refactor_todos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    item_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", index=True)
    category: Mapped[List[str]] = mapped_column(JSON, nullable=False, default=list)
    effort: Mapped[str] = mapped_column(String(20), nullable=False)
    affected_files: Mapped[List[str]] = mapped_column(JSON, nullable=False, default=list)
    details: Mapped[List[str]] = mapped_column(JSON, nullable=False, default=list)
    automated_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    technique: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<CodebaseRefactorTodo(id={self.item_id}, title={self.title})>"


class CodebaseScanMeta(Base):
    """Stores metadata about codebase health scans.

    Only one record exists - the most recent scan.
    Updated each time a new scan completes.
    """

    __tablename__ = "codebase_scan_meta"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    total_files: Mapped[int] = mapped_column(Integer, nullable=False)
    total_loc: Mapped[int] = mapped_column(Integer, nullable=False)
    total_todos: Mapped[int] = mapped_column(Integer, nullable=False)
    avg_loc: Mapped[int] = mapped_column(Integer, nullable=False)

    def __repr__(self) -> str:
        return f"<CodebaseScanMeta(generated_at={self.generated_at}, files={self.total_files})>"
