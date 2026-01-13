"""
Session Inspector API - Track and manage user sessions.

Features:
- Track active user sessions with metadata
- View session details (IP, user agent, login time)
- Revoke individual sessions
- Session statistics and activity tracking
"""

import hashlib
from datetime import datetime, timedelta
from collections import deque
from typing import Optional
from enum import Enum

from fastapi import APIRouter, Depends, Request, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..api.dbexplorer import require_debug
from ..core.database import get_db
from ..models.user import User

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

# In-memory session store (in production, use Redis)
# Maps session_id -> SessionInfo
active_sessions: dict[str, "SessionInfo"] = {}

# Recent session activity log
MAX_ACTIVITY_LOG = 200
activity_log: deque = deque(maxlen=MAX_ACTIVITY_LOG)


class SessionStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"


class SessionInfo(BaseModel):
    """Information about an active session."""
    session_id: str
    user_id: int
    username: str
    display_name: Optional[str] = None
    created_at: str
    last_activity: str
    expires_at: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    device_type: str = "unknown"
    browser: str = "unknown"
    os: str = "unknown"
    status: SessionStatus = SessionStatus.ACTIVE
    request_count: int = 0


class SessionActivity(BaseModel):
    """A session activity event."""
    timestamp: str
    session_id: str
    user_id: int
    username: str
    event: str
    ip_address: Optional[str] = None
    details: Optional[str] = None


class SessionStats(BaseModel):
    """Session statistics."""
    total_active: int
    total_today: int
    unique_users: int
    by_device: dict[str, int]
    by_browser: dict[str, int]
    avg_session_duration_minutes: float


def generate_session_id(user_id: int, token: str) -> str:
    """Generate a unique session ID from user and token."""
    content = f"{user_id}:{token[:32]}"
    return hashlib.sha256(content.encode()).hexdigest()[:16]


def parse_user_agent(user_agent: str) -> dict:
    """Parse user agent string to extract device, browser, OS."""
    ua = user_agent.lower() if user_agent else ""

    # Detect device type
    if "mobile" in ua or "android" in ua or "iphone" in ua:
        device = "mobile"
    elif "tablet" in ua or "ipad" in ua:
        device = "tablet"
    else:
        device = "desktop"

    # Detect browser
    if "firefox" in ua:
        browser = "Firefox"
    elif "edg" in ua:
        browser = "Edge"
    elif "chrome" in ua:
        browser = "Chrome"
    elif "safari" in ua:
        browser = "Safari"
    elif "opera" in ua:
        browser = "Opera"
    else:
        browser = "Other"

    # Detect OS
    if "windows" in ua:
        os_name = "Windows"
    elif "mac" in ua:
        os_name = "macOS"
    elif "linux" in ua:
        os_name = "Linux"
    elif "android" in ua:
        os_name = "Android"
    elif "iphone" in ua or "ipad" in ua:
        os_name = "iOS"
    else:
        os_name = "Other"

    return {"device": device, "browser": browser, "os": os_name}


def register_session(
    user_id: int,
    username: str,
    token: str,
    request: Optional[Request] = None,
    display_name: Optional[str] = None,
    expires_minutes: int = 60,
) -> SessionInfo:
    """Register a new session when user logs in."""
    session_id = generate_session_id(user_id, token)
    now = datetime.utcnow()

    ip_address = None
    user_agent = None
    device_info = {"device": "unknown", "browser": "unknown", "os": "unknown"}

    if request:
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent", "")
        device_info = parse_user_agent(user_agent)

    session = SessionInfo(
        session_id=session_id,
        user_id=user_id,
        username=username,
        display_name=display_name,
        created_at=now.isoformat() + "Z",
        last_activity=now.isoformat() + "Z",
        expires_at=(now + timedelta(minutes=expires_minutes)).isoformat() + "Z",
        ip_address=ip_address,
        user_agent=user_agent,
        device_type=device_info["device"],
        browser=device_info["browser"],
        os=device_info["os"],
        status=SessionStatus.ACTIVE,
        request_count=1,
    )

    active_sessions[session_id] = session

    # Log activity
    log_activity(session_id, user_id, username, "login", ip_address, "Session created")

    return session


def update_session_activity(session_id: str):
    """Update session last activity timestamp."""
    if session_id in active_sessions:
        session = active_sessions[session_id]
        session.last_activity = datetime.utcnow().isoformat() + "Z"
        session.request_count += 1


def revoke_session(session_id: str) -> bool:
    """Revoke a session."""
    if session_id in active_sessions:
        session = active_sessions[session_id]
        session.status = SessionStatus.REVOKED
        log_activity(
            session_id,
            session.user_id,
            session.username,
            "revoked",
            session.ip_address,
            "Session revoked"
        )
        del active_sessions[session_id]
        return True
    return False


def log_activity(
    session_id: str,
    user_id: int,
    username: str,
    event: str,
    ip_address: Optional[str] = None,
    details: Optional[str] = None,
):
    """Log session activity."""
    activity = SessionActivity(
        timestamp=datetime.utcnow().isoformat() + "Z",
        session_id=session_id,
        user_id=user_id,
        username=username,
        event=event,
        ip_address=ip_address,
        details=details,
    )
    activity_log.append(activity)


def cleanup_expired_sessions():
    """Remove expired sessions."""
    now = datetime.utcnow()
    expired = []

    for session_id, session in active_sessions.items():
        try:
            expires_at = datetime.fromisoformat(session.expires_at.replace("Z", ""))
            if now > expires_at:
                expired.append(session_id)
        except:
            pass

    for session_id in expired:
        session = active_sessions[session_id]
        log_activity(
            session_id,
            session.user_id,
            session.username,
            "expired",
            session.ip_address,
            "Session expired"
        )
        del active_sessions[session_id]


@router.get("")
async def get_sessions(
    _: None = Depends(require_debug),
    user_id: Optional[int] = None,
    status: Optional[SessionStatus] = None,
    limit: int = Query(50, ge=1, le=200),
):
    """Get all active sessions."""
    cleanup_expired_sessions()

    sessions = list(active_sessions.values())

    if user_id is not None:
        sessions = [s for s in sessions if s.user_id == user_id]

    if status:
        sessions = [s for s in sessions if s.status == status]

    # Sort by last activity descending
    sessions.sort(key=lambda s: s.last_activity, reverse=True)

    return {
        "sessions": [s.model_dump() for s in sessions[:limit]],
        "total": len(sessions),
    }


@router.get("/stats")
async def get_session_stats(
    _: None = Depends(require_debug),
    db: AsyncSession = Depends(get_db),
):
    """Get session statistics."""
    cleanup_expired_sessions()

    sessions = list(active_sessions.values())

    # Count by device
    by_device: dict[str, int] = {}
    by_browser: dict[str, int] = {}
    unique_users = set()
    total_duration = 0

    for session in sessions:
        by_device[session.device_type] = by_device.get(session.device_type, 0) + 1
        by_browser[session.browser] = by_browser.get(session.browser, 0) + 1
        unique_users.add(session.user_id)

        # Calculate duration
        try:
            created = datetime.fromisoformat(session.created_at.replace("Z", ""))
            last = datetime.fromisoformat(session.last_activity.replace("Z", ""))
            total_duration += (last - created).total_seconds()
        except:
            pass

    avg_duration = (total_duration / len(sessions) / 60) if sessions else 0

    # Get total users from database
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar() or 0

    # Get users active today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    active_today_result = await db.execute(
        select(func.count(User.id)).where(User.last_login >= today_start)
    )
    active_today = active_today_result.scalar() or 0

    return SessionStats(
        total_active=len(sessions),
        total_today=active_today,
        unique_users=len(unique_users),
        by_device=by_device,
        by_browser=by_browser,
        avg_session_duration_minutes=round(avg_duration, 1),
    )


@router.get("/activity")
async def get_activity_log(
    _: None = Depends(require_debug),
    event: Optional[str] = None,
    user_id: Optional[int] = None,
    limit: int = Query(50, ge=1, le=200),
):
    """Get session activity log."""
    activities = list(activity_log)

    if event:
        activities = [a for a in activities if a.event == event]

    if user_id is not None:
        activities = [a for a in activities if a.user_id == user_id]

    # Reverse to show newest first
    activities = list(reversed(activities))

    return {
        "activities": [a.model_dump() for a in activities[:limit]],
        "total": len(activities),
    }


@router.get("/users")
async def get_users_with_sessions(
    _: None = Depends(require_debug),
    db: AsyncSession = Depends(get_db),
):
    """Get users with session info."""
    cleanup_expired_sessions()

    # Get all users with recent activity
    result = await db.execute(
        select(User)
        .where(User.is_active == True)
        .order_by(User.last_login.desc())
        .limit(50)
    )
    users = result.scalars().all()

    user_sessions = []
    for user in users:
        # Find sessions for this user
        sessions = [s for s in active_sessions.values() if s.user_id == user.id]

        user_sessions.append({
            "id": user.id,
            "username": user.username,
            "display_name": user.display_name,
            "last_login": user.last_login.isoformat() + "Z" if user.last_login else None,
            "created_at": user.created_at.isoformat() + "Z" if user.created_at else None,
            "active_sessions": len(sessions),
            "sessions": [s.model_dump() for s in sessions],
        })

    return {
        "users": user_sessions,
        "total": len(user_sessions),
    }


@router.get("/{session_id}")
async def get_session_detail(
    session_id: str,
    _: None = Depends(require_debug),
):
    """Get detailed information about a session."""
    if session_id not in active_sessions:
        return {"error": "Session not found"}

    session = active_sessions[session_id]

    # Get activity for this session
    session_activity = [
        a.model_dump() for a in activity_log
        if a.session_id == session_id
    ]

    return {
        "session": session.model_dump(),
        "activity": list(reversed(session_activity))[-20:],
    }


@router.delete("/{session_id}")
async def revoke_session_endpoint(
    session_id: str,
    _: None = Depends(require_debug),
):
    """Revoke a specific session."""
    if revoke_session(session_id):
        return {"status": "revoked", "session_id": session_id}
    return {"error": "Session not found"}


@router.delete("/user/{user_id}")
async def revoke_user_sessions(
    user_id: int,
    _: None = Depends(require_debug),
):
    """Revoke all sessions for a user."""
    sessions_to_revoke = [
        s.session_id for s in active_sessions.values()
        if s.user_id == user_id
    ]

    for session_id in sessions_to_revoke:
        revoke_session(session_id)

    return {
        "status": "revoked",
        "user_id": user_id,
        "sessions_revoked": len(sessions_to_revoke),
    }


@router.delete("")
async def clear_all_sessions(_: None = Depends(require_debug)):
    """Clear all sessions (admin only)."""
    count = len(active_sessions)
    active_sessions.clear()
    activity_log.clear()
    return {"status": "cleared", "sessions_cleared": count}


@router.post("/test")
async def create_test_session(
    _: None = Depends(require_debug),
    username: str = "test_user",
    user_id: int = 999,
):
    """Create a test session for debugging."""
    import secrets
    token = secrets.token_hex(32)

    session = register_session(
        user_id=user_id,
        username=username,
        token=token,
        display_name=f"Test User {user_id}",
        expires_minutes=30,
    )

    return {
        "status": "created",
        "session": session.model_dump(),
    }
