"""Codebase health API endpoints."""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..models.codebase_health import (
    CodebaseFileStats,
    CodebaseRefactorTodo,
    CodebaseScanMeta,
)
from ..schemas.codebase_health import (
    FileStatsResponse,
    FileStatsListResponse,
    RefactorTodoResponse,
    RefactorTodoListResponse,
    ScanMetaResponse,
    CodebaseStatsResponse,
    AreaStats,
)

router = APIRouter(prefix="/api/codebase-health", tags=["codebase-health"])


@router.get("/files", response_model=FileStatsListResponse)
async def list_files(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(100, ge=1, le=1000, description="Items per page"),
    area: Optional[str] = Query(None, description="Filter by area"),
    file_type: Optional[str] = Query(None, description="Filter by file type"),
    size_category: Optional[str] = Query(None, description="Filter by size category"),
    search: Optional[str] = Query(None, description="Search in file path"),
    sort_by: str = Query("loc", description="Sort by field: path, loc, file_type, area"),
    sort_dir: str = Query("desc", description="Sort direction: asc, desc"),
):
    """List file statistics with pagination and filtering."""
    # Build query
    query = select(CodebaseFileStats)

    # Apply filters
    if area:
        query = query.where(CodebaseFileStats.area == area)
    if file_type:
        query = query.where(CodebaseFileStats.file_type == file_type)
    if size_category:
        query = query.where(CodebaseFileStats.size_category == size_category)
    if search:
        query = query.where(CodebaseFileStats.path.ilike(f"%{search}%"))

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply sorting
    sort_column = getattr(CodebaseFileStats, sort_by, CodebaseFileStats.loc)
    if sort_dir == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    # Execute query
    result = await db.execute(query)
    files = result.scalars().all()

    return FileStatsListResponse(
        files=[FileStatsResponse.model_validate(f) for f in files],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/todos", response_model=RefactorTodoListResponse)
async def list_todos(
    db: AsyncSession = Depends(get_db),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search in title/description"),
):
    """List refactor suggestions with filtering."""
    query = select(CodebaseRefactorTodo)

    if priority:
        query = query.where(CodebaseRefactorTodo.priority == priority)
    if status:
        query = query.where(CodebaseRefactorTodo.status == status)
    if search:
        query = query.where(
            CodebaseRefactorTodo.title.ilike(f"%{search}%") |
            CodebaseRefactorTodo.description.ilike(f"%{search}%")
        )

    # Order by priority (critical first)
    priority_order = func.case(
        (CodebaseRefactorTodo.priority == "critical", 0),
        (CodebaseRefactorTodo.priority == "high", 1),
        (CodebaseRefactorTodo.priority == "medium", 2),
        (CodebaseRefactorTodo.priority == "low", 3),
        else_=4
    )
    query = query.order_by(priority_order, CodebaseRefactorTodo.title)

    result = await db.execute(query)
    todos = result.scalars().all()

    return RefactorTodoListResponse(
        todos=[RefactorTodoResponse.model_validate(t) for t in todos],
        total=len(todos),
    )


@router.get("/stats", response_model=CodebaseStatsResponse)
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Get aggregated codebase statistics."""
    # Get scan metadata
    meta_query = select(CodebaseScanMeta).limit(1)
    meta_result = await db.execute(meta_query)
    meta = meta_result.scalar_one_or_none()

    # Get stats by area
    area_query = select(
        CodebaseFileStats.area,
        func.count().label("count"),
        func.sum(CodebaseFileStats.loc).label("total_loc")
    ).group_by(CodebaseFileStats.area)
    area_result = await db.execute(area_query)
    area_rows = area_result.all()

    by_area = {
        row.area: AreaStats(count=row.count, total_loc=row.total_loc or 0)
        for row in area_rows
    }

    # Get todos by priority
    priority_query = select(
        CodebaseRefactorTodo.priority,
        func.count().label("count")
    ).group_by(CodebaseRefactorTodo.priority)
    priority_result = await db.execute(priority_query)
    priority_rows = priority_result.all()

    by_priority = {row.priority: row.count for row in priority_rows}

    # Calculate totals
    total_files = sum(s.count for s in by_area.values())
    total_loc = sum(s.total_loc for s in by_area.values())
    avg_loc = total_loc // total_files if total_files > 0 else 0
    total_todos = sum(by_priority.values())

    return CodebaseStatsResponse(
        total_files=meta.total_files if meta else total_files,
        total_loc=meta.total_loc if meta else total_loc,
        avg_loc=meta.avg_loc if meta else avg_loc,
        total_todos=meta.total_todos if meta else total_todos,
        generated_at=meta.generated_at if meta else None,
        by_area=by_area,
        by_priority=by_priority,
    )


@router.get("/scan-info", response_model=Optional[ScanMetaResponse])
async def get_scan_info(db: AsyncSession = Depends(get_db)):
    """Get information about the latest scan."""
    query = select(CodebaseScanMeta).limit(1)
    result = await db.execute(query)
    meta = result.scalar_one_or_none()

    if not meta:
        return None

    return ScanMetaResponse.model_validate(meta)
