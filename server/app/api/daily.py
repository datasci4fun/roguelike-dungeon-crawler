"""Daily challenge API endpoints."""
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..services.daily_service import DailyChallengeService
from ..schemas.daily import (
    DailyChallengeInfo,
    DailyResultCreate,
    DailyResultResponse,
    DailyLeaderboardEntry,
    DailyUserStats,
    DailyOverview,
    StreakLeaderboardEntry,
)

router = APIRouter(prefix="/daily", tags=["daily"])


@router.get("", response_model=DailyOverview)
async def get_daily_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get today's daily challenge overview with user stats and leaderboard."""
    service = DailyChallengeService(db)

    # Get or create today's challenge
    challenge = await service.get_or_create_daily_challenge()

    # Get user stats
    user_stats = await service.get_user_daily_stats(current_user.id)

    # Get user's result for today (if any)
    user_result = await service.get_user_daily_result(current_user.id)
    user_rank = await service.get_user_daily_rank(current_user.id)

    # Get top scores
    leaderboard = await service.get_daily_leaderboard(limit=10)

    # Format leaderboard
    top_scores = [
        DailyLeaderboardEntry(
            rank=i + 1,
            username=entry.user.username,
            score=entry.score,
            victory=entry.victory,
            level_reached=entry.level_reached,
            kills=entry.kills,
            turns_taken=entry.turns_taken,
        )
        for i, entry in enumerate(leaderboard)
    ]

    # Format user result
    formatted_user_result = None
    if user_result:
        formatted_user_result = DailyResultResponse(
            id=user_result.id,
            score=user_result.score,
            victory=user_result.victory,
            level_reached=user_result.level_reached,
            kills=user_result.kills,
            turns_taken=user_result.turns_taken,
            game_duration_seconds=user_result.game_duration_seconds,
            completed_at=user_result.completed_at,
            username=current_user.username,
            rank=user_rank,
        )

    return DailyOverview(
        challenge=DailyChallengeInfo(
            id=challenge.id,
            challenge_date=challenge.challenge_date,
            seed=challenge.seed,
            total_participants=challenge.total_participants,
            total_completions=challenge.total_completions,
            highest_score=challenge.highest_score,
        ),
        user_stats=DailyUserStats(**user_stats),
        user_result=formatted_user_result,
        user_rank=user_rank,
        top_scores=top_scores,
    )


@router.get("/challenge")
async def get_today_challenge(
    db: AsyncSession = Depends(get_db),
):
    """Get today's daily challenge seed (public endpoint)."""
    service = DailyChallengeService(db)
    challenge = await service.get_or_create_daily_challenge()

    return {
        "date": challenge.challenge_date.isoformat(),
        "seed": challenge.seed,
        "participants": challenge.total_participants,
        "completions": challenge.total_completions,
        "highest_score": challenge.highest_score,
    }


@router.post("/result", response_model=DailyResultResponse)
async def submit_daily_result(
    result_data: DailyResultCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a daily challenge result."""
    service = DailyChallengeService(db)

    # Check if already completed today
    if await service.has_user_completed_daily(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already completed today's daily challenge",
        )

    # Record result
    result = await service.record_daily_result(
        user_id=current_user.id,
        victory=result_data.victory,
        score=result_data.score,
        level_reached=result_data.level_reached,
        kills=result_data.kills,
        turns_taken=result_data.turns_taken,
        game_duration_seconds=result_data.game_duration_seconds,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to record daily result",
        )

    # Get rank
    rank = await service.get_user_daily_rank(current_user.id)

    return DailyResultResponse(
        id=result.id,
        score=result.score,
        victory=result.victory,
        level_reached=result.level_reached,
        kills=result.kills,
        turns_taken=result.turns_taken,
        game_duration_seconds=result.game_duration_seconds,
        completed_at=result.completed_at,
        username=current_user.username,
        rank=rank,
    )


@router.get("/leaderboard", response_model=list[DailyLeaderboardEntry])
async def get_daily_leaderboard(
    challenge_date: Optional[date] = None,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """Get the leaderboard for a specific day's challenge."""
    service = DailyChallengeService(db)
    leaderboard = await service.get_daily_leaderboard(
        challenge_date=challenge_date,
        limit=min(limit, 100),
        offset=offset,
    )

    return [
        DailyLeaderboardEntry(
            rank=offset + i + 1,
            username=entry.user.username,
            score=entry.score,
            victory=entry.victory,
            level_reached=entry.level_reached,
            kills=entry.kills,
            turns_taken=entry.turns_taken,
        )
        for i, entry in enumerate(leaderboard)
    ]


@router.get("/stats", response_model=DailyUserStats)
async def get_user_daily_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's daily challenge statistics."""
    service = DailyChallengeService(db)
    stats = await service.get_user_daily_stats(current_user.id)
    return DailyUserStats(**stats)


@router.get("/streaks", response_model=list[StreakLeaderboardEntry])
async def get_streak_leaderboard(
    limit: int = 10,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """Get the streak leaderboard (users with active daily streaks)."""
    service = DailyChallengeService(db)
    users = await service.get_streak_leaderboard(
        limit=min(limit, 50),
        offset=offset,
    )

    return [
        StreakLeaderboardEntry(
            rank=offset + i + 1,
            username=user.username,
            streak=user.daily_streak,
            daily_high_score=user.daily_high_score,
            total_completions=user.daily_completions,
        )
        for i, user in enumerate(users)
    ]


@router.get("/history")
async def get_daily_history(
    limit: int = 7,
    db: AsyncSession = Depends(get_db),
):
    """Get recent daily challenges."""
    service = DailyChallengeService(db)
    challenges = await service.get_recent_challenges(limit=min(limit, 30))

    return [
        {
            "date": c.challenge_date.isoformat(),
            "participants": c.total_participants,
            "completions": c.total_completions,
            "highest_score": c.highest_score,
        }
        for c in challenges
    ]
