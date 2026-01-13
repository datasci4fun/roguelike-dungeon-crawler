"""
Error Tracker API - Captures and displays application errors.

Features:
- Captures unhandled exceptions with full stack traces
- Stores errors in a ring buffer (last 100 errors)
- Groups similar errors by fingerprint
- Provides error statistics and trends
"""

import sys
import traceback
import hashlib
from datetime import datetime
from collections import deque
from typing import Optional
from enum import Enum

from fastapi import APIRouter, Depends, Request, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from ..api.dbexplorer import require_debug

router = APIRouter(prefix="/api/errors", tags=["errors"])

# Ring buffer for storing errors (last 100 entries)
MAX_ERROR_ENTRIES = 100
error_buffer: deque = deque(maxlen=MAX_ERROR_ENTRIES)

# Error counts by fingerprint for grouping
error_counts: dict[str, int] = {}

# Global error counter
_error_id_counter = 0


class ErrorSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ErrorEntry(BaseModel):
    """A captured error entry."""
    id: int
    timestamp: str
    error_type: str
    message: str
    stack_trace: str
    fingerprint: str
    request_path: Optional[str] = None
    request_method: Optional[str] = None
    request_params: Optional[dict] = None
    user_agent: Optional[str] = None
    client_ip: Optional[str] = None
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
    count: int = 1
    resolved: bool = False
    notes: Optional[str] = None


class ErrorsResponse(BaseModel):
    """Response containing error entries."""
    entries: list[ErrorEntry]
    total: int
    unresolved: int
    by_type: dict[str, int]


class ErrorStats(BaseModel):
    """Error statistics."""
    total_errors: int
    unique_errors: int
    unresolved: int
    by_severity: dict[str, int]
    by_type: dict[str, int]
    recent_24h: int


def generate_fingerprint(error_type: str, message: str, stack_trace: str) -> str:
    """Generate a fingerprint for grouping similar errors."""
    # Use error type and first few lines of stack trace for fingerprinting
    trace_lines = stack_trace.split('\n')[:5]
    content = f"{error_type}:{message}:{':'.join(trace_lines)}"
    return hashlib.md5(content.encode()).hexdigest()[:12]


def determine_severity(error_type: str, message: str) -> ErrorSeverity:
    """Determine error severity based on type and message."""
    critical_types = ['SystemExit', 'KeyboardInterrupt', 'MemoryError', 'RecursionError']
    high_types = ['DatabaseError', 'ConnectionError', 'AuthenticationError', 'PermissionError']
    low_types = ['ValidationError', 'ValueError', 'KeyError', 'IndexError']

    if error_type in critical_types:
        return ErrorSeverity.CRITICAL
    elif error_type in high_types or 'database' in message.lower() or 'connection' in message.lower():
        return ErrorSeverity.HIGH
    elif error_type in low_types:
        return ErrorSeverity.LOW
    return ErrorSeverity.MEDIUM


def capture_error(
    exc: Exception,
    request: Optional[Request] = None,
) -> ErrorEntry:
    """Capture an exception and store it in the error buffer."""
    global _error_id_counter
    _error_id_counter += 1

    # Get exception details
    error_type = type(exc).__name__
    message = str(exc)

    # Get full stack trace
    tb = traceback.format_exception(type(exc), exc, exc.__traceback__)
    stack_trace = ''.join(tb)

    # Generate fingerprint for grouping
    fingerprint = generate_fingerprint(error_type, message, stack_trace)

    # Update counts
    error_counts[fingerprint] = error_counts.get(fingerprint, 0) + 1

    # Determine severity
    severity = determine_severity(error_type, message)

    # Extract request info if available
    request_path = None
    request_method = None
    request_params = None
    user_agent = None
    client_ip = None

    if request:
        request_path = str(request.url.path)
        request_method = request.method
        request_params = dict(request.query_params) if request.query_params else None
        user_agent = request.headers.get('user-agent')
        client_ip = request.client.host if request.client else None

    entry = ErrorEntry(
        id=_error_id_counter,
        timestamp=datetime.utcnow().isoformat() + "Z",
        error_type=error_type,
        message=message,
        stack_trace=stack_trace,
        fingerprint=fingerprint,
        request_path=request_path,
        request_method=request_method,
        request_params=request_params,
        user_agent=user_agent,
        client_ip=client_ip,
        severity=severity,
        count=error_counts[fingerprint],
    )

    error_buffer.append(entry)
    return entry


def get_exception_handler(app):
    """Create an exception handler that captures errors."""
    async def exception_handler(request: Request, exc: Exception):
        # Capture the error
        capture_error(exc, request)

        # Return a generic error response
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "error_type": type(exc).__name__,
            }
        )
    return exception_handler


@router.get("", response_model=ErrorsResponse)
async def get_errors(
    _: None = Depends(require_debug),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    severity: Optional[ErrorSeverity] = None,
    error_type: Optional[str] = None,
    unresolved_only: bool = False,
    search: Optional[str] = None,
):
    """
    Get captured application errors.

    Supports filtering by:
    - severity: Filter by severity level
    - error_type: Filter by exception type
    - unresolved_only: Show only unresolved errors
    - search: Search in error messages
    """
    all_entries = list(error_buffer)

    # Apply filters
    filtered = all_entries

    if severity:
        filtered = [e for e in filtered if e.severity == severity]

    if error_type:
        filtered = [e for e in filtered if error_type.lower() in e.error_type.lower()]

    if unresolved_only:
        filtered = [e for e in filtered if not e.resolved]

    if search:
        search_lower = search.lower()
        filtered = [
            e for e in filtered
            if search_lower in e.message.lower() or search_lower in e.error_type.lower()
        ]

    # Calculate stats
    by_type: dict[str, int] = {}
    for entry in all_entries:
        by_type[entry.error_type] = by_type.get(entry.error_type, 0) + 1

    unresolved = len([e for e in all_entries if not e.resolved])

    # Reverse to show newest first
    filtered = list(reversed(filtered))
    total = len(filtered)
    paginated = filtered[offset:offset + limit]

    return ErrorsResponse(
        entries=paginated,
        total=total,
        unresolved=unresolved,
        by_type=by_type,
    )


@router.get("/stats", response_model=ErrorStats)
async def get_error_stats(_: None = Depends(require_debug)):
    """Get error statistics."""
    all_entries = list(error_buffer)

    by_severity: dict[str, int] = {
        "low": 0,
        "medium": 0,
        "high": 0,
        "critical": 0,
    }

    by_type: dict[str, int] = {}
    fingerprints = set()
    recent_24h = 0
    now = datetime.utcnow()

    for entry in all_entries:
        by_severity[entry.severity.value] += 1
        by_type[entry.error_type] = by_type.get(entry.error_type, 0) + 1
        fingerprints.add(entry.fingerprint)

        # Check if within last 24 hours
        try:
            entry_time = datetime.fromisoformat(entry.timestamp.replace('Z', '+00:00').replace('+00:00', ''))
            if (now - entry_time).total_seconds() < 86400:
                recent_24h += 1
        except:
            pass

    unresolved = len([e for e in all_entries if not e.resolved])

    return ErrorStats(
        total_errors=len(all_entries),
        unique_errors=len(fingerprints),
        unresolved=unresolved,
        by_severity=by_severity,
        by_type=by_type,
        recent_24h=recent_24h,
    )


@router.get("/types")
async def get_error_types(_: None = Depends(require_debug)):
    """Get list of error types."""
    all_entries = list(error_buffer)

    types: dict[str, int] = {}
    for entry in all_entries:
        types[entry.error_type] = types.get(entry.error_type, 0) + 1

    sorted_types = sorted(types.items(), key=lambda x: x[1], reverse=True)

    return {
        "types": [{"name": name, "count": count} for name, count in sorted_types],
    }


@router.get("/{error_id}")
async def get_error_detail(
    error_id: int,
    _: None = Depends(require_debug),
):
    """Get detailed information about a specific error."""
    for entry in error_buffer:
        if entry.id == error_id:
            return entry

    return JSONResponse(status_code=404, content={"detail": "Error not found"})


@router.patch("/{error_id}/resolve")
async def resolve_error(
    error_id: int,
    _: None = Depends(require_debug),
):
    """Mark an error as resolved."""
    for entry in error_buffer:
        if entry.id == error_id:
            entry.resolved = True
            return {"status": "resolved", "id": error_id}

    return JSONResponse(status_code=404, content={"detail": "Error not found"})


@router.patch("/{error_id}/unresolve")
async def unresolve_error(
    error_id: int,
    _: None = Depends(require_debug),
):
    """Mark an error as unresolved."""
    for entry in error_buffer:
        if entry.id == error_id:
            entry.resolved = False
            return {"status": "unresolved", "id": error_id}

    return JSONResponse(status_code=404, content={"detail": "Error not found"})


@router.delete("")
async def clear_errors(_: None = Depends(require_debug)):
    """Clear all captured errors."""
    error_buffer.clear()
    error_counts.clear()
    return {"status": "cleared", "message": "Error buffer cleared"}


@router.post("/test")
async def create_test_error(
    _: None = Depends(require_debug),
    error_type: str = "TestError",
    message: str = "This is a test error",
):
    """Create a test error for debugging."""
    # Create a custom exception
    class TestException(Exception):
        pass

    try:
        raise TestException(message)
    except TestException as e:
        entry = capture_error(e)
        # Override the error type name
        entry.error_type = error_type
        return {"status": "created", "error_id": entry.id, "fingerprint": entry.fingerprint}


@router.post("/test/real")
async def trigger_real_error(_: None = Depends(require_debug)):
    """Trigger a real error to test error capturing."""
    # This will raise a real exception that gets captured
    result = 1 / 0  # ZeroDivisionError
    return {"result": result}
