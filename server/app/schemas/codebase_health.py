"""Pydantic schemas for codebase health API."""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class FileStatsResponse(BaseModel):
    """Single file statistics."""
    id: int
    path: str
    loc: int
    nesting_depth: int
    file_type: str
    area: str
    size_category: str

    class Config:
        from_attributes = True


class FileStatsListResponse(BaseModel):
    """Paginated list of file statistics."""
    files: List[FileStatsResponse]
    total: int
    page: int
    page_size: int


class RefactorTodoResponse(BaseModel):
    """Single refactor suggestion."""
    id: int
    item_id: str
    title: str
    description: str
    priority: str
    status: str
    category: List[str]
    effort: str
    affected_files: List[str]
    details: List[str]
    automated_reason: Optional[str]
    technique: Optional[str]

    class Config:
        from_attributes = True


class RefactorTodoListResponse(BaseModel):
    """List of refactor suggestions."""
    todos: List[RefactorTodoResponse]
    total: int


class ScanMetaResponse(BaseModel):
    """Scan metadata."""
    generated_at: datetime
    total_files: int
    total_loc: int
    total_todos: int
    avg_loc: int

    class Config:
        from_attributes = True


class AreaStats(BaseModel):
    """Statistics for a single area."""
    count: int
    total_loc: int


class CodebaseStatsResponse(BaseModel):
    """Aggregated codebase statistics."""
    total_files: int
    total_loc: int
    avg_loc: int
    total_todos: int
    generated_at: Optional[datetime]
    by_area: Dict[str, AreaStats]
    by_priority: Dict[str, int]


class ScanTriggerResponse(BaseModel):
    """Response from triggering a scan."""
    success: bool
    message: str
    files_processed: int
    todos_generated: int
