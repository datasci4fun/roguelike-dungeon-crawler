"""Achievement API endpoints."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.security import get_current_user, get_current_user_optional
from ..models.user import User
from ..services.achievement_service import AchievementService
from ..config.achievements import ACHIEVEMENTS
from ..schemas.achievement import (
    AchievementDefResponse,
    AchievementListResponse,
    UserAchievementResponse,
    UserAchievementsResponse,
    RecentAchievementResponse,
)

router = APIRouter(prefix="/api/achievements", tags=["achievements"])


def _achievement_def_to_response(ach_def) -> AchievementDefResponse:
    """Convert AchievementDef to response schema."""
    return AchievementDefResponse(
        id=ach_def.id,
        name=ach_def.name,
        description=ach_def.description,
        category=ach_def.category.value,
        rarity=ach_def.rarity.value,
        icon=ach_def.icon,
        points=ach_def.points,
        hidden=ach_def.hidden,
    )


def _user_achievement_to_response(ua, ach_def) -> UserAchievementResponse:
    """Convert UserAchievement to response schema."""
    return UserAchievementResponse(
        achievement_id=ua.achievement_id,
        name=ach_def.name,
        description=ach_def.description,
        category=ach_def.category.value,
        rarity=ach_def.rarity.value,
        icon=ach_def.icon,
        points=ach_def.points,
        unlocked_at=ua.unlocked_at,
        game_id=ua.game_id,
    )


@router.get("", response_model=AchievementListResponse)
async def get_all_achievements():
    """Get all achievement definitions."""
    achievements = [
        _achievement_def_to_response(ach)
        for ach in ACHIEVEMENTS.values()
        if not ach.hidden
    ]

    return AchievementListResponse(
        achievements=achievements,
        total=len(achievements),
    )


@router.get("/me", response_model=UserAchievementsResponse)
async def get_my_achievements(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's achievements."""
    service = AchievementService(db)

    user_achievements = await service.get_user_achievements(current_user.id)
    stats = await service.get_user_achievement_stats(current_user.id)

    unlocked = []
    for ua in user_achievements:
        ach_def = ACHIEVEMENTS.get(ua.achievement_id)
        if ach_def:
            unlocked.append(_user_achievement_to_response(ua, ach_def))

    return UserAchievementsResponse(
        unlocked=unlocked,
        total_unlocked=stats["total_unlocked"],
        total_points=stats["total_points"],
        total_achievements=stats["total_achievements"],
        completion_percentage=stats["completion_percentage"],
    )


@router.get("/user/{user_id}", response_model=UserAchievementsResponse)
async def get_user_achievements(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a user's achievements."""
    from sqlalchemy import select

    # Check user exists
    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    service = AchievementService(db)

    user_achievements = await service.get_user_achievements(user_id)
    stats = await service.get_user_achievement_stats(user_id)

    unlocked = []
    for ua in user_achievements:
        ach_def = ACHIEVEMENTS.get(ua.achievement_id)
        if ach_def:
            unlocked.append(_user_achievement_to_response(ua, ach_def))

    return UserAchievementsResponse(
        unlocked=unlocked,
        total_unlocked=stats["total_unlocked"],
        total_points=stats["total_points"],
        total_achievements=stats["total_achievements"],
        completion_percentage=stats["completion_percentage"],
    )


@router.get("/recent", response_model=list[RecentAchievementResponse])
async def get_recent_achievements(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get recently unlocked achievements globally."""
    service = AchievementService(db)
    recent = await service.get_recent_achievements(limit=limit)

    responses = []
    for ua in recent:
        ach_def = ACHIEVEMENTS.get(ua.achievement_id)
        if ach_def and ua.user:
            responses.append(RecentAchievementResponse(
                achievement_id=ua.achievement_id,
                name=ach_def.name,
                description=ach_def.description,
                category=ach_def.category.value,
                rarity=ach_def.rarity.value,
                icon=ach_def.icon,
                points=ach_def.points,
                unlocked_at=ua.unlocked_at,
                user_id=ua.user_id,
                username=ua.user.username,
                display_name=ua.user.display_name,
            ))

    return responses


@router.get("/stats")
async def get_achievement_stats(
    db: AsyncSession = Depends(get_db),
):
    """Get global achievement statistics."""
    service = AchievementService(db)
    return await service.get_achievement_stats()


@router.get("/{achievement_id}", response_model=AchievementDefResponse)
async def get_achievement(achievement_id: str):
    """Get a specific achievement definition."""
    ach_def = ACHIEVEMENTS.get(achievement_id)

    if not ach_def:
        raise HTTPException(status_code=404, detail="Achievement not found")

    return _achievement_def_to_response(ach_def)
