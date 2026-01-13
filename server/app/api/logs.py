"""
Log Viewer API - Real-time application log streaming.

Captures application logs in a ring buffer and provides:
- REST endpoint to fetch recent logs
- WebSocket endpoint for real-time streaming
- Filtering by level, source, and search term
"""

import logging
import asyncio
from datetime import datetime
from collections import deque
from typing import Optional
from enum import Enum

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel

from ..api.dbexplorer import require_debug

router = APIRouter(prefix="/api/logs", tags=["logs"])

# Ring buffer for storing logs (last 1000 entries)
MAX_LOG_ENTRIES = 1000
log_buffer: deque = deque(maxlen=MAX_LOG_ENTRIES)

# Connected WebSocket clients for real-time streaming
connected_clients: set[WebSocket] = set()


class LogLevel(str, Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class LogEntry(BaseModel):
    """A single log entry."""
    id: int
    timestamp: str
    level: str
    logger: str
    message: str
    source: Optional[str] = None
    line: Optional[int] = None


class LogsResponse(BaseModel):
    """Response containing log entries."""
    entries: list[LogEntry]
    total: int
    has_more: bool


# Custom log handler that captures logs to our buffer
class BufferLogHandler(logging.Handler):
    """Custom handler that writes logs to our ring buffer."""

    _id_counter = 0

    def emit(self, record: logging.LogRecord):
        try:
            BufferLogHandler._id_counter += 1
            entry = LogEntry(
                id=BufferLogHandler._id_counter,
                timestamp=datetime.fromtimestamp(record.created).isoformat() + "Z",
                level=record.levelname,
                logger=record.name,
                message=self.format(record),
                source=record.pathname if hasattr(record, 'pathname') else None,
                line=record.lineno if hasattr(record, 'lineno') else None,
            )
            log_buffer.append(entry)

            # Broadcast to connected WebSocket clients
            asyncio.create_task(broadcast_log(entry))
        except Exception:
            pass  # Don't let logging errors break the app


async def broadcast_log(entry: LogEntry):
    """Broadcast a log entry to all connected WebSocket clients."""
    if not connected_clients:
        return

    message = entry.model_dump_json()
    disconnected = set()

    for client in connected_clients:
        try:
            await client.send_text(message)
        except Exception:
            disconnected.add(client)

    # Clean up disconnected clients
    connected_clients.difference_update(disconnected)


def setup_log_capture():
    """Set up log capturing for the application."""
    handler = BufferLogHandler()
    handler.setLevel(logging.DEBUG)
    formatter = logging.Formatter('%(message)s')
    handler.setFormatter(formatter)

    # Add handler to root logger
    root_logger = logging.getLogger()
    root_logger.addHandler(handler)

    # Also capture uvicorn access logs
    uvicorn_logger = logging.getLogger("uvicorn.access")
    uvicorn_logger.addHandler(handler)

    # Capture FastAPI logs
    fastapi_logger = logging.getLogger("fastapi")
    fastapi_logger.addHandler(handler)

    return handler


# Initialize log capture on module load
_log_handler = setup_log_capture()


@router.get("", response_model=LogsResponse)
async def get_logs(
    _: None = Depends(require_debug),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    level: Optional[LogLevel] = None,
    logger: Optional[str] = None,
    search: Optional[str] = None,
):
    """
    Get recent application logs.

    Supports filtering by:
    - level: Filter by log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    - logger: Filter by logger name (e.g., 'uvicorn.access')
    - search: Search in log messages
    """
    # Convert deque to list for filtering
    all_entries = list(log_buffer)

    # Apply filters
    filtered = all_entries

    if level:
        level_order = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        min_level_idx = level_order.index(level.value)
        filtered = [
            e for e in filtered
            if e.level in level_order[min_level_idx:]
        ]

    if logger:
        filtered = [e for e in filtered if logger.lower() in e.logger.lower()]

    if search:
        search_lower = search.lower()
        filtered = [
            e for e in filtered
            if search_lower in e.message.lower() or search_lower in e.logger.lower()
        ]

    # Reverse to show newest first
    filtered = list(reversed(filtered))

    total = len(filtered)
    paginated = filtered[offset:offset + limit]

    return LogsResponse(
        entries=paginated,
        total=total,
        has_more=(offset + limit) < total,
    )


@router.get("/levels")
async def get_log_levels(_: None = Depends(require_debug)):
    """Get available log levels and their counts."""
    all_entries = list(log_buffer)

    counts = {
        "DEBUG": 0,
        "INFO": 0,
        "WARNING": 0,
        "ERROR": 0,
        "CRITICAL": 0,
    }

    for entry in all_entries:
        if entry.level in counts:
            counts[entry.level] += 1

    return {
        "levels": counts,
        "total": len(all_entries),
    }


@router.get("/loggers")
async def get_loggers(_: None = Depends(require_debug)):
    """Get list of active loggers."""
    all_entries = list(log_buffer)

    loggers: dict[str, int] = {}
    for entry in all_entries:
        loggers[entry.logger] = loggers.get(entry.logger, 0) + 1

    # Sort by count descending
    sorted_loggers = sorted(loggers.items(), key=lambda x: x[1], reverse=True)

    return {
        "loggers": [{"name": name, "count": count} for name, count in sorted_loggers],
    }


@router.delete("")
async def clear_logs(_: None = Depends(require_debug)):
    """Clear the log buffer."""
    log_buffer.clear()
    return {"status": "cleared", "message": "Log buffer cleared"}


@router.post("/test")
async def create_test_log(
    _: None = Depends(require_debug),
    level: LogLevel = LogLevel.INFO,
    message: str = "Test log message",
):
    """Create a test log entry for debugging."""
    logger = logging.getLogger("test.manual")
    log_func = getattr(logger, level.value.lower())
    log_func(message)
    return {"status": "created", "level": level, "message": message}


@router.websocket("/stream")
async def websocket_log_stream(websocket: WebSocket):
    """
    WebSocket endpoint for real-time log streaming.

    Clients receive log entries as JSON messages.
    Send 'ping' to keep connection alive.
    """
    await websocket.accept()

    # Check debug mode (simplified check for WebSocket)
    from ..core.config import settings
    if not settings.debug:
        await websocket.close(code=4003, reason="Debug mode required")
        return

    connected_clients.add(websocket)

    try:
        # Send recent logs on connect
        recent_logs = list(log_buffer)[-50:]  # Last 50 entries
        for entry in recent_logs:
            await websocket.send_text(entry.model_dump_json())

        # Keep connection alive and handle client messages
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                if data == "ping":
                    await websocket.send_text('{"type": "pong"}')
            except asyncio.TimeoutError:
                # Send keepalive
                await websocket.send_text('{"type": "keepalive"}')
    except WebSocketDisconnect:
        pass
    finally:
        connected_clients.discard(websocket)
