"""
System Status API - Comprehensive health monitoring endpoint.

Provides detailed status information about:
- Database connectivity and latency
- Redis connectivity and latency
- System resources (memory, CPU)
- Application info (version, uptime)
"""

import time
import asyncio
import platform
import psutil
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..core.config import settings
from ..core.database import async_session_maker
from ..core.redis import get_redis
from ..api.dbexplorer import require_debug

router = APIRouter(prefix="/api/status", tags=["status"])

# Track application start time
APP_START_TIME = datetime.utcnow()


class ServiceStatus(BaseModel):
    """Status of a single service."""
    name: str
    status: str  # 'healthy', 'degraded', 'unhealthy', 'unknown'
    latency_ms: Optional[float] = None
    message: Optional[str] = None
    details: Optional[dict] = None


class SystemInfo(BaseModel):
    """System resource information."""
    platform: str
    python_version: str
    cpu_percent: float
    memory_used_mb: float
    memory_total_mb: float
    memory_percent: float
    disk_used_gb: Optional[float] = None
    disk_total_gb: Optional[float] = None
    disk_percent: Optional[float] = None


class AppInfo(BaseModel):
    """Application information."""
    name: str
    version: str
    environment: str
    debug_mode: bool
    uptime_seconds: float
    uptime_human: str


class StatusResponse(BaseModel):
    """Complete system status response."""
    overall_status: str  # 'healthy', 'degraded', 'unhealthy'
    timestamp: str
    services: list[ServiceStatus]
    system: SystemInfo
    app: AppInfo


def format_uptime(seconds: float) -> str:
    """Format uptime in human-readable form."""
    days = int(seconds // 86400)
    hours = int((seconds % 86400) // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)

    parts = []
    if days > 0:
        parts.append(f"{days}d")
    if hours > 0:
        parts.append(f"{hours}h")
    if mins > 0:
        parts.append(f"{mins}m")
    if secs > 0 or not parts:
        parts.append(f"{secs}s")

    return " ".join(parts)


async def check_database() -> ServiceStatus:
    """Check database connectivity and measure latency."""
    start = time.perf_counter()
    try:
        async with async_session_maker() as session:
            # Simple query to test connection
            result = await session.execute("SELECT 1")
            result.scalar()

        latency = (time.perf_counter() - start) * 1000
        return ServiceStatus(
            name="PostgreSQL",
            status="healthy",
            latency_ms=round(latency, 2),
            message="Connected",
        )
    except Exception as e:
        latency = (time.perf_counter() - start) * 1000
        return ServiceStatus(
            name="PostgreSQL",
            status="unhealthy",
            latency_ms=round(latency, 2),
            message=str(e)[:100],
        )


async def check_redis() -> ServiceStatus:
    """Check Redis connectivity and measure latency."""
    start = time.perf_counter()
    try:
        redis = await get_redis()
        await redis.ping()
        info = await redis.info("server")

        latency = (time.perf_counter() - start) * 1000
        return ServiceStatus(
            name="Redis",
            status="healthy",
            latency_ms=round(latency, 2),
            message="Connected",
            details={
                "version": info.get("redis_version", "unknown"),
                "uptime_days": info.get("uptime_in_days", 0),
            }
        )
    except Exception as e:
        latency = (time.perf_counter() - start) * 1000
        return ServiceStatus(
            name="Redis",
            status="unhealthy",
            latency_ms=round(latency, 2),
            message=str(e)[:100],
        )


def get_system_info() -> SystemInfo:
    """Gather system resource information."""
    memory = psutil.virtual_memory()

    # Disk info (may fail in some containers)
    try:
        disk = psutil.disk_usage("/")
        disk_used = round(disk.used / (1024**3), 2)
        disk_total = round(disk.total / (1024**3), 2)
        disk_percent = disk.percent
    except:
        disk_used = None
        disk_total = None
        disk_percent = None

    return SystemInfo(
        platform=f"{platform.system()} {platform.release()}",
        python_version=platform.python_version(),
        cpu_percent=psutil.cpu_percent(interval=0.1),
        memory_used_mb=round(memory.used / (1024**2), 2),
        memory_total_mb=round(memory.total / (1024**2), 2),
        memory_percent=memory.percent,
        disk_used_gb=disk_used,
        disk_total_gb=disk_total,
        disk_percent=disk_percent,
    )


def get_app_info() -> AppInfo:
    """Get application information."""
    uptime = (datetime.utcnow() - APP_START_TIME).total_seconds()

    return AppInfo(
        name=settings.app_name,
        version=settings.app_version,
        environment="development" if settings.debug else "production",
        debug_mode=settings.debug,
        uptime_seconds=round(uptime, 2),
        uptime_human=format_uptime(uptime),
    )


@router.get("", response_model=StatusResponse)
async def get_system_status(_: None = Depends(require_debug)):
    """
    Get comprehensive system status.

    Returns status of all services, system resources, and app info.
    Only available in debug mode.
    """
    # Check all services concurrently
    db_status, redis_status = await asyncio.gather(
        check_database(),
        check_redis(),
    )

    services = [db_status, redis_status]

    # Determine overall status
    statuses = [s.status for s in services]
    if all(s == "healthy" for s in statuses):
        overall = "healthy"
    elif any(s == "unhealthy" for s in statuses):
        overall = "unhealthy"
    else:
        overall = "degraded"

    return StatusResponse(
        overall_status=overall,
        timestamp=datetime.utcnow().isoformat() + "Z",
        services=services,
        system=get_system_info(),
        app=get_app_info(),
    )


@router.get("/ping")
async def ping():
    """Simple ping endpoint for basic health checks."""
    return {"pong": True, "timestamp": datetime.utcnow().isoformat() + "Z"}


@router.get("/metrics")
async def get_metrics(_: None = Depends(require_debug)):
    """
    Get Prometheus-style metrics.
    Only available in debug mode.
    """
    uptime = (datetime.utcnow() - APP_START_TIME).total_seconds()
    memory = psutil.virtual_memory()

    # Simple text-based metrics
    metrics = [
        f"# HELP app_uptime_seconds Application uptime in seconds",
        f"# TYPE app_uptime_seconds gauge",
        f'app_uptime_seconds{{app="{settings.app_name}"}} {uptime:.2f}',
        f"",
        f"# HELP system_memory_bytes System memory usage",
        f"# TYPE system_memory_bytes gauge",
        f'system_memory_used_bytes {memory.used}',
        f'system_memory_total_bytes {memory.total}',
        f"",
        f"# HELP system_cpu_percent CPU usage percentage",
        f"# TYPE system_cpu_percent gauge",
        f'system_cpu_percent {psutil.cpu_percent(interval=0.1)}',
    ]

    return "\n".join(metrics)
