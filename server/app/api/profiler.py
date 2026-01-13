"""
Performance Profiler API - Request timing and performance metrics.

Features:
- Middleware captures request/response timing
- Stores performance data in ring buffer
- Identifies slow requests
- Provides aggregated statistics by endpoint
- Tracks response sizes and status codes
"""

import time
import statistics
from datetime import datetime, timedelta
from collections import deque
from typing import Optional
from enum import Enum

from fastapi import APIRouter, Depends, Request, Query
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from pydantic import BaseModel

from ..api.dbexplorer import require_debug

router = APIRouter(prefix="/api/profiler", tags=["profiler"])

# Ring buffer for storing request metrics (last 500 requests)
MAX_METRICS_ENTRIES = 500
metrics_buffer: deque = deque(maxlen=MAX_METRICS_ENTRIES)

# Slow request threshold in milliseconds
SLOW_REQUEST_THRESHOLD_MS = 500

# Global request counter
_request_id_counter = 0


class RequestMetric(BaseModel):
    """A single request performance metric."""
    id: int
    timestamp: str
    method: str
    path: str
    full_path: str
    status_code: int
    duration_ms: float
    response_size: Optional[int] = None
    client_ip: Optional[str] = None
    user_agent: Optional[str] = None
    is_slow: bool = False


class EndpointStats(BaseModel):
    """Aggregated statistics for an endpoint."""
    path: str
    method: str
    count: int
    avg_ms: float
    min_ms: float
    max_ms: float
    p50_ms: float
    p95_ms: float
    p99_ms: float
    slow_count: int
    error_count: int


class OverallStats(BaseModel):
    """Overall performance statistics."""
    total_requests: int
    avg_duration_ms: float
    slow_requests: int
    error_requests: int
    requests_per_minute: float
    by_status: dict[str, int]
    by_method: dict[str, int]


class ProfilingMiddleware(BaseHTTPMiddleware):
    """Middleware to capture request performance metrics."""

    def __init__(self, app: ASGIApp, enabled: bool = True):
        super().__init__(app)
        self.enabled = enabled

    async def dispatch(self, request: Request, call_next):
        if not self.enabled:
            return await call_next(request)

        # Skip profiling the profiler endpoints to avoid recursion
        if request.url.path.startswith('/api/profiler'):
            return await call_next(request)

        global _request_id_counter
        _request_id_counter += 1
        request_id = _request_id_counter

        start_time = time.perf_counter()

        # Process request
        response = await call_next(request)

        # Calculate duration
        duration = (time.perf_counter() - start_time) * 1000  # Convert to ms

        # Get response size if available
        response_size = None
        if hasattr(response, 'headers'):
            content_length = response.headers.get('content-length')
            if content_length:
                response_size = int(content_length)

        # Determine if slow
        is_slow = duration >= SLOW_REQUEST_THRESHOLD_MS

        # Create metric entry
        metric = RequestMetric(
            id=request_id,
            timestamp=datetime.utcnow().isoformat() + "Z",
            method=request.method,
            path=request.url.path,
            full_path=str(request.url),
            status_code=response.status_code,
            duration_ms=round(duration, 2),
            response_size=response_size,
            client_ip=request.client.host if request.client else None,
            user_agent=request.headers.get('user-agent'),
            is_slow=is_slow,
        )

        metrics_buffer.append(metric)

        return response


def get_profiling_middleware(enabled: bool = True):
    """Factory to create profiling middleware."""
    return lambda app: ProfilingMiddleware(app, enabled=enabled)


@router.get("/requests")
async def get_requests(
    _: None = Depends(require_debug),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    method: Optional[str] = None,
    path: Optional[str] = None,
    slow_only: bool = False,
    errors_only: bool = False,
    min_duration: Optional[float] = None,
):
    """
    Get recent request metrics.

    Supports filtering by:
    - method: HTTP method (GET, POST, etc.)
    - path: URL path contains
    - slow_only: Only slow requests
    - errors_only: Only error responses (4xx, 5xx)
    - min_duration: Minimum duration in ms
    """
    all_metrics = list(metrics_buffer)

    # Apply filters
    filtered = all_metrics

    if method:
        filtered = [m for m in filtered if m.method == method.upper()]

    if path:
        filtered = [m for m in filtered if path.lower() in m.path.lower()]

    if slow_only:
        filtered = [m for m in filtered if m.is_slow]

    if errors_only:
        filtered = [m for m in filtered if m.status_code >= 400]

    if min_duration is not None:
        filtered = [m for m in filtered if m.duration_ms >= min_duration]

    # Reverse to show newest first
    filtered = list(reversed(filtered))
    total = len(filtered)
    paginated = filtered[offset:offset + limit]

    return {
        "requests": [m.model_dump() for m in paginated],
        "total": total,
        "slow_threshold_ms": SLOW_REQUEST_THRESHOLD_MS,
    }


@router.get("/stats")
async def get_stats(_: None = Depends(require_debug)):
    """Get overall performance statistics."""
    all_metrics = list(metrics_buffer)

    if not all_metrics:
        return OverallStats(
            total_requests=0,
            avg_duration_ms=0,
            slow_requests=0,
            error_requests=0,
            requests_per_minute=0,
            by_status={},
            by_method={},
        )

    durations = [m.duration_ms for m in all_metrics]
    slow_count = len([m for m in all_metrics if m.is_slow])
    error_count = len([m for m in all_metrics if m.status_code >= 400])

    # Count by status code
    by_status: dict[str, int] = {}
    for m in all_metrics:
        status_group = f"{m.status_code // 100}xx"
        by_status[status_group] = by_status.get(status_group, 0) + 1

    # Count by method
    by_method: dict[str, int] = {}
    for m in all_metrics:
        by_method[m.method] = by_method.get(m.method, 0) + 1

    # Calculate requests per minute (based on time span of data)
    if len(all_metrics) >= 2:
        try:
            first_time = datetime.fromisoformat(all_metrics[0].timestamp.replace('Z', ''))
            last_time = datetime.fromisoformat(all_metrics[-1].timestamp.replace('Z', ''))
            time_span_minutes = (last_time - first_time).total_seconds() / 60
            if time_span_minutes > 0:
                rpm = len(all_metrics) / time_span_minutes
            else:
                rpm = 0
        except:
            rpm = 0
    else:
        rpm = 0

    return OverallStats(
        total_requests=len(all_metrics),
        avg_duration_ms=round(statistics.mean(durations), 2),
        slow_requests=slow_count,
        error_requests=error_count,
        requests_per_minute=round(rpm, 2),
        by_status=by_status,
        by_method=by_method,
    )


@router.get("/endpoints")
async def get_endpoint_stats(
    _: None = Depends(require_debug),
    sort_by: str = Query("count", regex="^(count|avg_ms|max_ms|slow_count)$"),
):
    """Get aggregated statistics by endpoint."""
    all_metrics = list(metrics_buffer)

    # Group by endpoint (method + path)
    endpoints: dict[str, list[RequestMetric]] = {}
    for m in all_metrics:
        key = f"{m.method} {m.path}"
        if key not in endpoints:
            endpoints[key] = []
        endpoints[key].append(m)

    # Calculate stats for each endpoint
    stats_list: list[EndpointStats] = []
    for key, metrics in endpoints.items():
        method, path = key.split(' ', 1)
        durations = [m.duration_ms for m in metrics]
        sorted_durations = sorted(durations)

        def percentile(data: list, p: float) -> float:
            k = (len(data) - 1) * p / 100
            f = int(k)
            c = f + 1 if f + 1 < len(data) else f
            return data[f] + (k - f) * (data[c] - data[f]) if c != f else data[f]

        stats = EndpointStats(
            path=path,
            method=method,
            count=len(metrics),
            avg_ms=round(statistics.mean(durations), 2),
            min_ms=round(min(durations), 2),
            max_ms=round(max(durations), 2),
            p50_ms=round(percentile(sorted_durations, 50), 2),
            p95_ms=round(percentile(sorted_durations, 95), 2),
            p99_ms=round(percentile(sorted_durations, 99), 2),
            slow_count=len([m for m in metrics if m.is_slow]),
            error_count=len([m for m in metrics if m.status_code >= 400]),
        )
        stats_list.append(stats)

    # Sort
    sort_key = {
        "count": lambda x: x.count,
        "avg_ms": lambda x: x.avg_ms,
        "max_ms": lambda x: x.max_ms,
        "slow_count": lambda x: x.slow_count,
    }.get(sort_by, lambda x: x.count)

    stats_list.sort(key=sort_key, reverse=True)

    return {
        "endpoints": [s.model_dump() for s in stats_list],
        "total_endpoints": len(stats_list),
    }


@router.get("/slow")
async def get_slow_requests(
    _: None = Depends(require_debug),
    limit: int = Query(20, ge=1, le=100),
):
    """Get slowest requests."""
    all_metrics = list(metrics_buffer)

    # Sort by duration descending
    sorted_metrics = sorted(all_metrics, key=lambda m: m.duration_ms, reverse=True)

    return {
        "requests": [m.model_dump() for m in sorted_metrics[:limit]],
        "threshold_ms": SLOW_REQUEST_THRESHOLD_MS,
    }


@router.get("/timeline")
async def get_timeline(
    _: None = Depends(require_debug),
    minutes: int = Query(10, ge=1, le=60),
    bucket_seconds: int = Query(30, ge=10, le=300),
):
    """Get request timeline data for charting."""
    all_metrics = list(metrics_buffer)

    if not all_metrics:
        return {"buckets": [], "bucket_seconds": bucket_seconds}

    now = datetime.utcnow()
    cutoff = now - timedelta(minutes=minutes)

    # Filter to time window
    recent = []
    for m in all_metrics:
        try:
            ts = datetime.fromisoformat(m.timestamp.replace('Z', ''))
            if ts >= cutoff:
                recent.append((ts, m))
        except:
            pass

    if not recent:
        return {"buckets": [], "bucket_seconds": bucket_seconds}

    # Create time buckets
    buckets: list[dict] = []
    bucket_start = cutoff
    while bucket_start < now:
        bucket_end = bucket_start + timedelta(seconds=bucket_seconds)

        bucket_metrics = [m for ts, m in recent if bucket_start <= ts < bucket_end]

        if bucket_metrics:
            durations = [m.duration_ms for m in bucket_metrics]
            bucket_data = {
                "time": bucket_start.isoformat() + "Z",
                "count": len(bucket_metrics),
                "avg_ms": round(statistics.mean(durations), 2),
                "max_ms": round(max(durations), 2),
                "errors": len([m for m in bucket_metrics if m.status_code >= 400]),
            }
        else:
            bucket_data = {
                "time": bucket_start.isoformat() + "Z",
                "count": 0,
                "avg_ms": 0,
                "max_ms": 0,
                "errors": 0,
            }

        buckets.append(bucket_data)
        bucket_start = bucket_end

    return {
        "buckets": buckets,
        "bucket_seconds": bucket_seconds,
        "minutes": minutes,
    }


@router.delete("")
async def clear_metrics(_: None = Depends(require_debug)):
    """Clear all performance metrics."""
    metrics_buffer.clear()
    return {"status": "cleared", "message": "Metrics buffer cleared"}


@router.patch("/threshold")
async def set_threshold(
    threshold_ms: int = Query(..., ge=100, le=5000),
    _: None = Depends(require_debug),
):
    """Set the slow request threshold."""
    global SLOW_REQUEST_THRESHOLD_MS
    SLOW_REQUEST_THRESHOLD_MS = threshold_ms
    return {"status": "updated", "threshold_ms": threshold_ms}


@router.get("/threshold")
async def get_threshold(_: None = Depends(require_debug)):
    """Get the current slow request threshold."""
    return {"threshold_ms": SLOW_REQUEST_THRESHOLD_MS}
