"""
Feature Flags API - Manage feature toggles for the application.

Features:
- Boolean flags (on/off)
- Percentage rollout (0-100%)
- User targeting (specific user IDs)
- Environment scoping (dev, staging, prod)
- Flag history tracking
"""

import hashlib
from datetime import datetime
from collections import deque
from typing import Optional
from enum import Enum

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from ..api.dbexplorer import require_debug

router = APIRouter(prefix="/api/flags", tags=["feature-flags"])

# In-memory flag store
feature_flags: dict[str, "FeatureFlag"] = {}

# Flag change history
MAX_HISTORY = 100
flag_history: deque = deque(maxlen=MAX_HISTORY)


class FlagType(str, Enum):
    BOOLEAN = "boolean"
    PERCENTAGE = "percentage"
    USER_LIST = "user_list"


class FlagEnvironment(str, Enum):
    ALL = "all"
    DEV = "dev"
    STAGING = "staging"
    PROD = "prod"


class FeatureFlag(BaseModel):
    """A feature flag definition."""
    key: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=200)
    description: str = ""
    flag_type: FlagType = FlagType.BOOLEAN
    enabled: bool = False
    percentage: int = Field(default=0, ge=0, le=100)
    user_ids: list[int] = []
    environment: FlagEnvironment = FlagEnvironment.ALL
    created_at: str = ""
    updated_at: str = ""
    created_by: str = "system"
    tags: list[str] = []


class FlagChange(BaseModel):
    """A flag change event."""
    timestamp: str
    flag_key: str
    action: str  # created, updated, deleted, toggled
    field: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    changed_by: str = "system"


class CreateFlagRequest(BaseModel):
    """Request to create a new flag."""
    key: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=200)
    description: str = ""
    flag_type: FlagType = FlagType.BOOLEAN
    enabled: bool = False
    percentage: int = Field(default=0, ge=0, le=100)
    user_ids: list[int] = []
    environment: FlagEnvironment = FlagEnvironment.ALL
    tags: list[str] = []


class UpdateFlagRequest(BaseModel):
    """Request to update a flag."""
    name: Optional[str] = None
    description: Optional[str] = None
    flag_type: Optional[FlagType] = None
    enabled: Optional[bool] = None
    percentage: Optional[int] = Field(default=None, ge=0, le=100)
    user_ids: Optional[list[int]] = None
    environment: Optional[FlagEnvironment] = None
    tags: Optional[list[str]] = None


def log_change(
    flag_key: str,
    action: str,
    field: Optional[str] = None,
    old_value: Optional[str] = None,
    new_value: Optional[str] = None,
    changed_by: str = "system",
):
    """Log a flag change."""
    change = FlagChange(
        timestamp=datetime.utcnow().isoformat() + "Z",
        flag_key=flag_key,
        action=action,
        field=field,
        old_value=old_value,
        new_value=new_value,
        changed_by=changed_by,
    )
    flag_history.append(change)


def evaluate_flag(flag: FeatureFlag, user_id: Optional[int] = None) -> bool:
    """Evaluate if a flag is enabled for a given context."""
    if not flag.enabled:
        return False

    if flag.flag_type == FlagType.BOOLEAN:
        return True

    if flag.flag_type == FlagType.USER_LIST:
        return user_id in flag.user_ids if user_id else False

    if flag.flag_type == FlagType.PERCENTAGE:
        if user_id is None:
            return False
        # Deterministic hash-based rollout
        hash_input = f"{flag.key}:{user_id}"
        hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
        bucket = hash_value % 100
        return bucket < flag.percentage

    return False


def seed_default_flags():
    """Seed some default feature flags for demo purposes."""
    defaults = [
        {
            "key": "dark_mode",
            "name": "Dark Mode",
            "description": "Enable dark mode UI theme",
            "flag_type": FlagType.BOOLEAN,
            "enabled": True,
            "tags": ["ui", "theme"],
        },
        {
            "key": "new_combat_system",
            "name": "New Combat System",
            "description": "Beta combat mechanics with combo attacks",
            "flag_type": FlagType.PERCENTAGE,
            "enabled": True,
            "percentage": 25,
            "tags": ["gameplay", "beta"],
        },
        {
            "key": "vip_features",
            "name": "VIP Features",
            "description": "Premium features for VIP users",
            "flag_type": FlagType.USER_LIST,
            "enabled": True,
            "user_ids": [1, 2, 3],
            "tags": ["premium"],
        },
        {
            "key": "achievement_v2",
            "name": "Achievement System V2",
            "description": "Redesigned achievement tracking and display",
            "flag_type": FlagType.BOOLEAN,
            "enabled": False,
            "tags": ["achievements", "v2"],
        },
        {
            "key": "multiplayer_beta",
            "name": "Multiplayer Beta",
            "description": "Real-time multiplayer dungeon crawling",
            "flag_type": FlagType.PERCENTAGE,
            "enabled": True,
            "percentage": 10,
            "environment": FlagEnvironment.DEV,
            "tags": ["multiplayer", "beta"],
        },
        {
            "key": "debug_overlay",
            "name": "Debug Overlay",
            "description": "Show FPS and performance metrics in-game",
            "flag_type": FlagType.BOOLEAN,
            "enabled": True,
            "environment": FlagEnvironment.DEV,
            "tags": ["debug", "dev"],
        },
    ]

    now = datetime.utcnow().isoformat() + "Z"
    for flag_data in defaults:
        if flag_data["key"] not in feature_flags:
            flag = FeatureFlag(
                **flag_data,
                created_at=now,
                updated_at=now,
            )
            feature_flags[flag.key] = flag


# Seed defaults on module load
seed_default_flags()


@router.get("")
async def get_flags(
    _: None = Depends(require_debug),
    enabled: Optional[bool] = None,
    flag_type: Optional[FlagType] = None,
    environment: Optional[FlagEnvironment] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
):
    """Get all feature flags with optional filtering."""
    flags = list(feature_flags.values())

    if enabled is not None:
        flags = [f for f in flags if f.enabled == enabled]

    if flag_type:
        flags = [f for f in flags if f.flag_type == flag_type]

    if environment:
        flags = [f for f in flags if f.environment == environment or f.environment == FlagEnvironment.ALL]

    if tag:
        flags = [f for f in flags if tag in f.tags]

    if search:
        search_lower = search.lower()
        flags = [f for f in flags if search_lower in f.key.lower() or search_lower in f.name.lower()]

    # Sort by name
    flags.sort(key=lambda f: f.name.lower())

    return {
        "flags": [f.model_dump() for f in flags],
        "total": len(flags),
        "enabled_count": sum(1 for f in flags if f.enabled),
    }


@router.get("/stats")
async def get_flag_stats(_: None = Depends(require_debug)):
    """Get feature flag statistics."""
    flags = list(feature_flags.values())

    by_type = {}
    by_environment = {}
    by_tag = {}

    for flag in flags:
        # By type
        type_key = flag.flag_type.value
        by_type[type_key] = by_type.get(type_key, 0) + 1

        # By environment
        env_key = flag.environment.value
        by_environment[env_key] = by_environment.get(env_key, 0) + 1

        # By tag
        for tag in flag.tags:
            by_tag[tag] = by_tag.get(tag, 0) + 1

    return {
        "total": len(flags),
        "enabled": sum(1 for f in flags if f.enabled),
        "disabled": sum(1 for f in flags if not f.enabled),
        "by_type": by_type,
        "by_environment": by_environment,
        "by_tag": by_tag,
    }


@router.get("/history")
async def get_flag_history(
    _: None = Depends(require_debug),
    flag_key: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
):
    """Get flag change history."""
    history = list(flag_history)

    if flag_key:
        history = [h for h in history if h.flag_key == flag_key]

    if action:
        history = [h for h in history if h.action == action]

    # Reverse to show newest first
    history = list(reversed(history))

    return {
        "history": [h.model_dump() for h in history[:limit]],
        "total": len(history),
    }


@router.get("/evaluate/{flag_key}")
async def evaluate_flag_endpoint(
    flag_key: str,
    user_id: Optional[int] = None,
    _: None = Depends(require_debug),
):
    """Evaluate if a flag is enabled for a given user."""
    if flag_key not in feature_flags:
        return {"error": "Flag not found", "enabled": False}

    flag = feature_flags[flag_key]
    is_enabled = evaluate_flag(flag, user_id)

    return {
        "flag_key": flag_key,
        "enabled": is_enabled,
        "flag_type": flag.flag_type.value,
        "user_id": user_id,
    }


@router.get("/{flag_key}")
async def get_flag(
    flag_key: str,
    _: None = Depends(require_debug),
):
    """Get a specific feature flag."""
    if flag_key not in feature_flags:
        return {"error": "Flag not found"}

    flag = feature_flags[flag_key]

    # Get history for this flag
    history = [h.model_dump() for h in flag_history if h.flag_key == flag_key]

    return {
        "flag": flag.model_dump(),
        "history": list(reversed(history))[-10:],
    }


@router.post("")
async def create_flag(
    request: CreateFlagRequest,
    _: None = Depends(require_debug),
):
    """Create a new feature flag."""
    if request.key in feature_flags:
        return {"error": "Flag with this key already exists"}

    now = datetime.utcnow().isoformat() + "Z"

    flag = FeatureFlag(
        key=request.key,
        name=request.name,
        description=request.description,
        flag_type=request.flag_type,
        enabled=request.enabled,
        percentage=request.percentage,
        user_ids=request.user_ids,
        environment=request.environment,
        tags=request.tags,
        created_at=now,
        updated_at=now,
    )

    feature_flags[flag.key] = flag
    log_change(flag.key, "created", new_value=f"Flag '{flag.name}' created")

    return {
        "status": "created",
        "flag": flag.model_dump(),
    }


@router.put("/{flag_key}")
async def update_flag(
    flag_key: str,
    request: UpdateFlagRequest,
    _: None = Depends(require_debug),
):
    """Update a feature flag."""
    if flag_key not in feature_flags:
        return {"error": "Flag not found"}

    flag = feature_flags[flag_key]
    now = datetime.utcnow().isoformat() + "Z"

    # Track changes
    if request.name is not None and request.name != flag.name:
        log_change(flag_key, "updated", "name", flag.name, request.name)
        flag.name = request.name

    if request.description is not None and request.description != flag.description:
        log_change(flag_key, "updated", "description", flag.description, request.description)
        flag.description = request.description

    if request.flag_type is not None and request.flag_type != flag.flag_type:
        log_change(flag_key, "updated", "flag_type", flag.flag_type.value, request.flag_type.value)
        flag.flag_type = request.flag_type

    if request.enabled is not None and request.enabled != flag.enabled:
        log_change(flag_key, "toggled", "enabled", str(flag.enabled), str(request.enabled))
        flag.enabled = request.enabled

    if request.percentage is not None and request.percentage != flag.percentage:
        log_change(flag_key, "updated", "percentage", str(flag.percentage), str(request.percentage))
        flag.percentage = request.percentage

    if request.user_ids is not None and request.user_ids != flag.user_ids:
        log_change(flag_key, "updated", "user_ids", str(flag.user_ids), str(request.user_ids))
        flag.user_ids = request.user_ids

    if request.environment is not None and request.environment != flag.environment:
        log_change(flag_key, "updated", "environment", flag.environment.value, request.environment.value)
        flag.environment = request.environment

    if request.tags is not None and request.tags != flag.tags:
        log_change(flag_key, "updated", "tags", str(flag.tags), str(request.tags))
        flag.tags = request.tags

    flag.updated_at = now

    return {
        "status": "updated",
        "flag": flag.model_dump(),
    }


@router.post("/{flag_key}/toggle")
async def toggle_flag(
    flag_key: str,
    _: None = Depends(require_debug),
):
    """Toggle a flag on/off."""
    if flag_key not in feature_flags:
        return {"error": "Flag not found"}

    flag = feature_flags[flag_key]
    old_value = flag.enabled
    flag.enabled = not flag.enabled
    flag.updated_at = datetime.utcnow().isoformat() + "Z"

    log_change(flag_key, "toggled", "enabled", str(old_value), str(flag.enabled))

    return {
        "status": "toggled",
        "flag_key": flag_key,
        "enabled": flag.enabled,
    }


@router.delete("/{flag_key}")
async def delete_flag(
    flag_key: str,
    _: None = Depends(require_debug),
):
    """Delete a feature flag."""
    if flag_key not in feature_flags:
        return {"error": "Flag not found"}

    flag = feature_flags[flag_key]
    log_change(flag_key, "deleted", new_value=f"Flag '{flag.name}' deleted")
    del feature_flags[flag_key]

    return {
        "status": "deleted",
        "flag_key": flag_key,
    }


@router.delete("")
async def reset_flags(_: None = Depends(require_debug)):
    """Reset all flags to defaults."""
    feature_flags.clear()
    flag_history.clear()
    seed_default_flags()

    return {
        "status": "reset",
        "flags_count": len(feature_flags),
    }
