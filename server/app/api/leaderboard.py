"""Leaderboard API endpoints."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..services.leaderboard_service import LeaderboardService
from ..schemas.leaderboard import (
    LeaderboardEntry,
    LeaderboardResponse,
    PlayerRankingEntry,
    PlayerLeaderboardResponse,
    UserStats,
    UserGameHistory,
    GlobalStats,
    GameResultResponse,
)

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])


def _game_result_to_entry(result, rank: int) -> LeaderboardEntry:
    """Convert a GameResult to a LeaderboardEntry."""
    return LeaderboardEntry(
        rank=rank,
        game_id=result.id,
        user_id=result.user_id,
        username=result.user.username,
        display_name=result.user.display_name,
        score=result.score,
        victory=result.victory,
        level_reached=result.level_reached,
        kills=result.kills,
        player_level=result.player_level,
        ended_at=result.ended_at,
    )


def _user_to_ranking(user, rank: int) -> PlayerRankingEntry:
    """Convert a User to a PlayerRankingEntry."""
    return PlayerRankingEntry(
        rank=rank,
        user_id=user.id,
        username=user.username,
        display_name=user.display_name,
        high_score=user.high_score,
        games_played=user.games_played,
        victories=user.victories,
        total_kills=user.total_kills,
        max_level_reached=user.max_level_reached,
    )


@router.get("/top", response_model=LeaderboardResponse)
async def get_top_scores(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get all-time top scores."""
    service = LeaderboardService(db)
    offset = (page - 1) * page_size

    results = await service.get_top_scores(limit=page_size, offset=offset)
    entries = [
        _game_result_to_entry(r, offset + i + 1)
        for i, r in enumerate(results)
    ]

    return LeaderboardResponse(
        entries=entries,
        total=len(entries),
        page=page,
        page_size=page_size,
    )


@router.get("/weekly", response_model=LeaderboardResponse)
async def get_weekly_top_scores(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get top scores from the past week."""
    service = LeaderboardService(db)
    offset = (page - 1) * page_size

    results = await service.get_top_scores_by_period(
        days=7, limit=page_size, offset=offset
    )
    entries = [
        _game_result_to_entry(r, offset + i + 1)
        for i, r in enumerate(results)
    ]

    return LeaderboardResponse(
        entries=entries,
        total=len(entries),
        page=page,
        page_size=page_size,
    )


@router.get("/daily", response_model=LeaderboardResponse)
async def get_daily_top_scores(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get top scores from the past 24 hours."""
    service = LeaderboardService(db)
    offset = (page - 1) * page_size

    results = await service.get_top_scores_by_period(
        days=1, limit=page_size, offset=offset
    )
    entries = [
        _game_result_to_entry(r, offset + i + 1)
        for i, r in enumerate(results)
    ]

    return LeaderboardResponse(
        entries=entries,
        total=len(entries),
        page=page,
        page_size=page_size,
    )


@router.get("/victories", response_model=LeaderboardResponse)
async def get_top_victories(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get top victory runs by score."""
    service = LeaderboardService(db)
    offset = (page - 1) * page_size

    results = await service.get_victories(limit=page_size, offset=offset)
    entries = [
        _game_result_to_entry(r, offset + i + 1)
        for i, r in enumerate(results)
    ]

    return LeaderboardResponse(
        entries=entries,
        total=len(entries),
        page=page,
        page_size=page_size,
    )


@router.get("/speedrun", response_model=LeaderboardResponse)
async def get_fastest_victories(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get fastest victory runs by turns taken."""
    service = LeaderboardService(db)
    offset = (page - 1) * page_size

    results = await service.get_fastest_victories(limit=page_size, offset=offset)
    entries = [
        _game_result_to_entry(r, offset + i + 1)
        for i, r in enumerate(results)
    ]

    return LeaderboardResponse(
        entries=entries,
        total=len(entries),
        page=page,
        page_size=page_size,
    )


@router.get("/kills", response_model=LeaderboardResponse)
async def get_most_kills(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get games with most kills in a single run."""
    service = LeaderboardService(db)
    offset = (page - 1) * page_size

    results = await service.get_most_kills(limit=page_size, offset=offset)
    entries = [
        _game_result_to_entry(r, offset + i + 1)
        for i, r in enumerate(results)
    ]

    return LeaderboardResponse(
        entries=entries,
        total=len(entries),
        page=page,
        page_size=page_size,
    )


@router.get("/players", response_model=PlayerLeaderboardResponse)
async def get_top_players(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get top players by high score."""
    service = LeaderboardService(db)
    offset = (page - 1) * page_size

    users = await service.get_top_players(limit=page_size, offset=offset)
    entries = [
        _user_to_ranking(u, offset + i + 1)
        for i, u in enumerate(users)
    ]

    return PlayerLeaderboardResponse(
        entries=entries,
        total=len(entries),
        page=page,
        page_size=page_size,
    )


@router.get("/players/victories", response_model=PlayerLeaderboardResponse)
async def get_players_by_victories(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get players ranked by total victories."""
    service = LeaderboardService(db)
    offset = (page - 1) * page_size

    users = await service.get_most_victories(limit=page_size, offset=offset)
    entries = [
        _user_to_ranking(u, offset + i + 1)
        for i, u in enumerate(users)
    ]

    return PlayerLeaderboardResponse(
        entries=entries,
        total=len(entries),
        page=page,
        page_size=page_size,
    )


@router.get("/stats", response_model=GlobalStats)
async def get_global_stats(
    db: AsyncSession = Depends(get_db),
):
    """Get global game statistics."""
    service = LeaderboardService(db)
    return await service.get_global_stats()


@router.get("/me", response_model=UserStats)
async def get_my_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's stats and ranking."""
    service = LeaderboardService(db)
    rank = await service.get_user_rank(current_user.id)

    win_rate = 0.0
    if current_user.games_played > 0:
        win_rate = round(
            current_user.victories / current_user.games_played * 100, 1
        )

    return UserStats(
        user_id=current_user.id,
        username=current_user.username,
        display_name=current_user.display_name,
        rank=rank,
        high_score=current_user.high_score,
        games_played=current_user.games_played,
        victories=current_user.victories,
        total_deaths=current_user.total_deaths,
        total_kills=current_user.total_kills,
        max_level_reached=current_user.max_level_reached,
        win_rate=win_rate,
    )


@router.get("/me/history", response_model=list[UserGameHistory])
async def get_my_game_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's game history."""
    service = LeaderboardService(db)
    offset = (page - 1) * page_size

    results = await service.get_user_games(
        current_user.id, limit=page_size, offset=offset
    )

    return [
        UserGameHistory(
            id=r.id,
            victory=r.victory,
            score=r.score,
            level_reached=r.level_reached,
            kills=r.kills,
            player_level=r.player_level,
            turns_taken=r.turns_taken,
            cause_of_death=r.cause_of_death,
            killed_by=r.killed_by,
            ended_at=r.ended_at,
        )
        for r in results
    ]


@router.get("/user/{user_id}", response_model=UserStats)
async def get_user_stats(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific user's public stats."""
    from sqlalchemy import select
    from ..models.user import User

    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    service = LeaderboardService(db)
    rank = await service.get_user_rank(user_id)

    win_rate = 0.0
    if user.games_played > 0:
        win_rate = round(user.victories / user.games_played * 100, 1)

    return UserStats(
        user_id=user.id,
        username=user.username,
        display_name=user.display_name,
        rank=rank,
        high_score=user.high_score,
        games_played=user.games_played,
        victories=user.victories,
        total_deaths=user.total_deaths,
        total_kills=user.total_kills,
        max_level_reached=user.max_level_reached,
        win_rate=win_rate,
    )


@router.get("/game/{game_id}", response_model=GameResultResponse)
async def get_game_details(
    game_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get detailed information about a specific game."""
    service = LeaderboardService(db)
    result = await service.get_game_result(game_id)

    if not result:
        raise HTTPException(status_code=404, detail="Game not found")

    return GameResultResponse(
        id=result.id,
        user_id=result.user_id,
        username=result.user.username,
        display_name=result.user.display_name,
        victory=result.victory,
        score=result.score,
        level_reached=result.level_reached,
        kills=result.kills,
        damage_dealt=result.damage_dealt,
        damage_taken=result.damage_taken,
        player_level=result.player_level,
        turns_taken=result.turns_taken,
        game_duration_seconds=result.game_duration_seconds,
        final_hp=result.final_hp,
        max_hp=result.max_hp,
        potions_used=result.potions_used,
        items_collected=result.items_collected,
        gold_collected=result.gold_collected,
        cause_of_death=result.cause_of_death,
        killed_by=result.killed_by,
        ended_at=result.ended_at,
    )
