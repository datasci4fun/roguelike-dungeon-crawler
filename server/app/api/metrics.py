"""
Metrics Dashboard API - Application performance metrics.

Features:
- Request counts and rates
- Response time statistics (avg, p50, p95, p99)
- Error tracking
- Endpoint-level metrics
- Time-series data for charts
- System resource usage
"""

import time
import statistics
import psutil
from collections import deque
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel
from starlette.middleware.base import BaseHTTPMiddleware

from ..api.dbexplorer import require_debug

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


class RequestMetric(BaseModel):
    """Single request metric."""
    timestamp: float
    method: str
    path: str
    status_code: int
    response_time_ms: float


class EndpointMetrics(BaseModel):
    """Metrics for a single endpoint."""
    path: str
    method: str
    request_count: int
    avg_response_time_ms: float
    min_response_time_ms: float
    max_response_time_ms: float
    p50_response_time_ms: float
    p95_response_time_ms: float
    p99_response_time_ms: float
    error_count: int
    error_rate: float


class OverviewMetrics(BaseModel):
    """Overview metrics."""
    total_requests: int
    total_errors: int
    error_rate: float
    avg_response_time_ms: float
    p50_response_time_ms: float
    p95_response_time_ms: float
    p99_response_time_ms: float
    requests_per_minute: float
    uptime_seconds: float


class SystemMetrics(BaseModel):
    """System resource metrics."""
    cpu_percent: float
    memory_percent: float
    memory_used_mb: float
    memory_available_mb: float
    disk_percent: float
    disk_used_gb: float
    disk_free_gb: float
    open_files: int
    threads: int


# In-memory metrics storage
class MetricsCollector:
    """Collects and stores application metrics."""

    def __init__(self, max_requests: int = 10000, max_timeseries: int = 1000):
        self.start_time = time.time()
        self.requests: deque[RequestMetric] = deque(maxlen=max_requests)
        self.timeseries: deque[dict] = deque(maxlen=max_timeseries)
        self.total_requests = 0
        self.total_errors = 0

        # Per-endpoint metrics
        self.endpoint_requests: dict[str, list[float]] = {}
        self.endpoint_errors: dict[str, int] = {}

        # Per-method counts
        self.method_counts: dict[str, int] = {}

        # Per-status counts
        self.status_counts: dict[int, int] = {}

        # Last minute tracking
        self.minute_requests: deque[float] = deque(maxlen=1000)

    def record_request(
        self,
        method: str,
        path: str,
        status_code: int,
        response_time_ms: float
    ):
        """Record a request metric."""
        now = time.time()

        metric = RequestMetric(
            timestamp=now,
            method=method,
            path=path,
            status_code=status_code,
            response_time_ms=response_time_ms,
        )
        self.requests.append(metric)

        # Update totals
        self.total_requests += 1
        if status_code >= 400:
            self.total_errors += 1

        # Update method counts
        self.method_counts[method] = self.method_counts.get(method, 0) + 1

        # Update status counts
        self.status_counts[status_code] = self.status_counts.get(status_code, 0) + 1

        # Update endpoint metrics
        endpoint_key = f"{method}:{path}"
        if endpoint_key not in self.endpoint_requests:
            self.endpoint_requests[endpoint_key] = []
            self.endpoint_errors[endpoint_key] = 0
        self.endpoint_requests[endpoint_key].append(response_time_ms)
        if status_code >= 400:
            self.endpoint_errors[endpoint_key] += 1

        # Track for requests per minute
        self.minute_requests.append(now)

        # Add to timeseries (aggregated by second)
        self._add_to_timeseries(now, response_time_ms, status_code >= 400)

    def _add_to_timeseries(self, timestamp: float, response_time: float, is_error: bool):
        """Add data point to timeseries."""
        second = int(timestamp)

        # Find or create bucket for this second
        if self.timeseries and self.timeseries[-1].get("timestamp") == second:
            bucket = self.timeseries[-1]
            bucket["count"] += 1
            bucket["total_time"] += response_time
            bucket["avg_time"] = bucket["total_time"] / bucket["count"]
            if is_error:
                bucket["errors"] += 1
        else:
            self.timeseries.append({
                "timestamp": second,
                "count": 1,
                "total_time": response_time,
                "avg_time": response_time,
                "errors": 1 if is_error else 0,
            })

    def get_overview(self) -> OverviewMetrics:
        """Get overview metrics."""
        response_times = [r.response_time_ms for r in self.requests]

        # Calculate requests per minute
        now = time.time()
        minute_ago = now - 60
        recent_requests = sum(1 for t in self.minute_requests if t > minute_ago)

        if response_times:
            sorted_times = sorted(response_times)
            return OverviewMetrics(
                total_requests=self.total_requests,
                total_errors=self.total_errors,
                error_rate=self.total_errors / self.total_requests if self.total_requests > 0 else 0,
                avg_response_time_ms=statistics.mean(response_times),
                p50_response_time_ms=self._percentile(sorted_times, 50),
                p95_response_time_ms=self._percentile(sorted_times, 95),
                p99_response_time_ms=self._percentile(sorted_times, 99),
                requests_per_minute=recent_requests,
                uptime_seconds=now - self.start_time,
            )
        else:
            return OverviewMetrics(
                total_requests=0,
                total_errors=0,
                error_rate=0,
                avg_response_time_ms=0,
                p50_response_time_ms=0,
                p95_response_time_ms=0,
                p99_response_time_ms=0,
                requests_per_minute=0,
                uptime_seconds=now - self.start_time,
            )

    def get_endpoint_metrics(self) -> list[EndpointMetrics]:
        """Get per-endpoint metrics."""
        metrics = []

        for endpoint_key, times in self.endpoint_requests.items():
            if not times:
                continue

            method, path = endpoint_key.split(":", 1)
            sorted_times = sorted(times)
            error_count = self.endpoint_errors.get(endpoint_key, 0)

            metrics.append(EndpointMetrics(
                path=path,
                method=method,
                request_count=len(times),
                avg_response_time_ms=statistics.mean(times),
                min_response_time_ms=min(times),
                max_response_time_ms=max(times),
                p50_response_time_ms=self._percentile(sorted_times, 50),
                p95_response_time_ms=self._percentile(sorted_times, 95),
                p99_response_time_ms=self._percentile(sorted_times, 99),
                error_count=error_count,
                error_rate=error_count / len(times) if times else 0,
            ))

        # Sort by request count descending
        metrics.sort(key=lambda m: m.request_count, reverse=True)
        return metrics

    def get_timeseries(self, minutes: int = 5) -> list[dict]:
        """Get timeseries data for the last N minutes."""
        cutoff = time.time() - (minutes * 60)
        return [
            {
                "timestamp": d["timestamp"],
                "requests": d["count"],
                "avg_response_time": round(d["avg_time"], 2),
                "errors": d["errors"],
            }
            for d in self.timeseries
            if d["timestamp"] > cutoff
        ]

    def get_recent_requests(self, limit: int = 50) -> list[dict]:
        """Get recent requests."""
        requests = list(self.requests)[-limit:]
        return [
            {
                "timestamp": r.timestamp,
                "method": r.method,
                "path": r.path,
                "status_code": r.status_code,
                "response_time_ms": round(r.response_time_ms, 2),
            }
            for r in reversed(requests)
        ]

    @staticmethod
    def _percentile(sorted_data: list[float], percentile: int) -> float:
        """Calculate percentile from sorted data."""
        if not sorted_data:
            return 0
        k = (len(sorted_data) - 1) * percentile / 100
        f = int(k)
        c = f + 1 if f + 1 < len(sorted_data) else f
        return sorted_data[f] + (k - f) * (sorted_data[c] - sorted_data[f])

    def reset(self):
        """Reset all metrics."""
        self.requests.clear()
        self.timeseries.clear()
        self.total_requests = 0
        self.total_errors = 0
        self.endpoint_requests.clear()
        self.endpoint_errors.clear()
        self.method_counts.clear()
        self.status_counts.clear()
        self.minute_requests.clear()
        self.start_time = time.time()


# Global metrics collector
metrics_collector = MetricsCollector()


class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware to collect request metrics."""

    def __init__(self, app, collector: MetricsCollector = None):
        super().__init__(app)
        self.collector = collector or metrics_collector

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        response = await call_next(request)

        # Calculate response time
        response_time_ms = (time.time() - start_time) * 1000

        # Record metric (skip metrics endpoints to avoid recursion)
        if not request.url.path.startswith("/api/metrics"):
            self.collector.record_request(
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                response_time_ms=response_time_ms,
            )

        return response


def get_system_metrics() -> SystemMetrics:
    """Get system resource metrics."""
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage("/")
        process = psutil.Process()

        return SystemMetrics(
            cpu_percent=cpu_percent,
            memory_percent=memory.percent,
            memory_used_mb=memory.used / (1024 * 1024),
            memory_available_mb=memory.available / (1024 * 1024),
            disk_percent=disk.percent,
            disk_used_gb=disk.used / (1024 * 1024 * 1024),
            disk_free_gb=disk.free / (1024 * 1024 * 1024),
            open_files=len(process.open_files()),
            threads=process.num_threads(),
        )
    except Exception:
        return SystemMetrics(
            cpu_percent=0,
            memory_percent=0,
            memory_used_mb=0,
            memory_available_mb=0,
            disk_percent=0,
            disk_used_gb=0,
            disk_free_gb=0,
            open_files=0,
            threads=0,
        )


@router.get("")
async def get_metrics_overview(
    _: None = Depends(require_debug),
):
    """Get metrics overview."""
    overview = metrics_collector.get_overview()
    system = get_system_metrics()

    return {
        "overview": overview.model_dump(),
        "system": system.model_dump(),
        "method_counts": metrics_collector.method_counts,
        "status_counts": metrics_collector.status_counts,
    }


@router.get("/endpoints")
async def get_endpoint_metrics(
    _: None = Depends(require_debug),
    limit: int = 50,
):
    """Get per-endpoint metrics."""
    metrics = metrics_collector.get_endpoint_metrics()
    return {
        "endpoints": [m.model_dump() for m in metrics[:limit]],
        "total": len(metrics),
    }


@router.get("/timeseries")
async def get_timeseries_metrics(
    _: None = Depends(require_debug),
    minutes: int = 5,
):
    """Get timeseries data for charts."""
    data = metrics_collector.get_timeseries(minutes)
    return {
        "timeseries": data,
        "minutes": minutes,
        "data_points": len(data),
    }


@router.get("/recent")
async def get_recent_requests(
    _: None = Depends(require_debug),
    limit: int = 50,
):
    """Get recent requests."""
    requests = metrics_collector.get_recent_requests(limit)
    return {
        "requests": requests,
        "total": len(requests),
    }


@router.get("/system")
async def get_system_metrics_endpoint(
    _: None = Depends(require_debug),
):
    """Get system resource metrics."""
    return get_system_metrics().model_dump()


@router.post("/reset")
async def reset_metrics(
    _: None = Depends(require_debug),
):
    """Reset all metrics."""
    metrics_collector.reset()
    return {"status": "reset", "message": "All metrics have been reset"}


@router.get("/summary")
async def get_metrics_summary(
    _: None = Depends(require_debug),
):
    """Get a compact metrics summary."""
    overview = metrics_collector.get_overview()
    top_endpoints = metrics_collector.get_endpoint_metrics()[:5]

    return {
        "uptime_seconds": overview.uptime_seconds,
        "total_requests": overview.total_requests,
        "requests_per_minute": overview.requests_per_minute,
        "avg_response_time_ms": round(overview.avg_response_time_ms, 2),
        "error_rate_percent": round(overview.error_rate * 100, 2),
        "top_endpoints": [
            {
                "endpoint": f"{e.method} {e.path}",
                "requests": e.request_count,
                "avg_ms": round(e.avg_response_time_ms, 2),
            }
            for e in top_endpoints
        ],
    }
