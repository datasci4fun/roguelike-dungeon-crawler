"""Ghost replay API endpoints."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..services.ghost_service import GhostService
from ..schemas.ghost import (
    GhostSummary,
    GhostDetailResponse,
    GhostListResponse,
    GhostLevelFrames,
    MultiGhostResponse,
    GhostFrameResponse,
)


router = APIRouter(prefix="/api/ghost", tags=["ghost"])


@router.get("/level/{dungeon_level}", response_model=MultiGhostResponse)
async def get_ghosts_for_level(
    dungeon_level: int,
    limit: int = Query(5, ge=1, le=10),
    deaths_only: bool = Query(True),
    db: AsyncSession = Depends(get_db),
):
    """
    Get ghost replays for a specific dungeon level.

    Use this to show ghosts of other players who played on this level.
    By default, only returns ghosts that died (not victories).
    """
    if dungeon_level < 1 or dungeon_level > 10:
        raise HTTPException(status_code=400, detail="Invalid dungeon level")

    service = GhostService(db)
    ghosts = await service.get_ghosts_for_level(
        dungeon_level=dungeon_level,
        limit=limit,
        deaths_only=deaths_only,
    )

    return MultiGhostResponse(
        dungeon_level=dungeon_level,
        ghosts=[
            GhostLevelFrames(
                game_id=g["game_id"],
                username=g["username"],
                dungeon_level=dungeon_level,
                frames=[GhostFrameResponse(**f) for f in g["frames"]],
            )
            for g in ghosts
        ],
    )


@router.get("/game/{game_id}", response_model=GhostDetailResponse)
async def get_ghost_by_game(
    game_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Get full ghost replay data for a specific game.

    Returns all frames from the entire game session.
    """
    service = GhostService(db)
    ghost = await service.get_ghost_by_game_id(game_id)

    if not ghost:
        raise HTTPException(status_code=404, detail="Ghost not found")

    return GhostDetailResponse(
        game_id=ghost["game_id"],
        user_id=ghost["user_id"],
        username=ghost["username"],
        victory=ghost["victory"],
        cause_of_death=ghost["cause_of_death"],
        killed_by=ghost["killed_by"],
        final_level=ghost["final_level"],
        final_score=ghost["final_score"],
        total_turns=ghost["total_turns"],
        dungeon_seed=ghost["dungeon_seed"],
        started_at=ghost["started_at"],
        ended_at=ghost["ended_at"],
        frames=[GhostFrameResponse(**f) for f in ghost["frames"]],
    )


@router.get("/recent", response_model=GhostListResponse)
async def get_recent_deaths(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """
    Get recent death ghosts.

    Shows the most recent player deaths that can be replayed.
    """
    service = GhostService(db)
    offset = (page - 1) * page_size

    ghosts = await service.get_recent_deaths(limit=page_size, offset=offset)
    total = await service.get_ghost_count()

    return GhostListResponse(
        ghosts=[
            GhostSummary(
                game_id=g["game_id"],
                user_id=g["user_id"],
                username=g["username"],
                victory=g["victory"],
                cause_of_death=g["cause_of_death"],
                killed_by=g["killed_by"],
                final_level=g["final_level"],
                final_score=g["final_score"],
                total_turns=g["total_turns"],
                frame_count=g["frame_count"],
                started_at=g["started_at"],
                ended_at=g["ended_at"],
            )
            for g in ghosts
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/me", response_model=GhostListResponse)
async def get_my_ghosts(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current user's ghost recordings.

    View your own past game replays.
    """
    service = GhostService(db)
    offset = (page - 1) * page_size

    ghosts = await service.get_user_ghosts(
        user_id=current_user.id,
        limit=page_size,
        offset=offset,
    )

    return GhostListResponse(
        ghosts=[
            GhostSummary(
                game_id=g["game_id"],
                user_id=g["user_id"],
                username=g["username"],
                victory=g["victory"],
                cause_of_death=g["cause_of_death"],
                killed_by=g["killed_by"],
                final_level=g["final_level"],
                final_score=g["final_score"],
                total_turns=g["total_turns"],
                frame_count=g["frame_count"],
                started_at=g["started_at"],
                ended_at=g["ended_at"],
            )
            for g in ghosts
        ],
        total=len(ghosts),
        page=page,
        page_size=page_size,
    )


@router.get("/user/{user_id}", response_model=GhostListResponse)
async def get_user_ghosts(
    user_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific user's ghost recordings.

    View another player's past game replays.
    """
    service = GhostService(db)
    offset = (page - 1) * page_size

    ghosts = await service.get_user_ghosts(
        user_id=user_id,
        limit=page_size,
        offset=offset,
    )

    if not ghosts:
        # Check if user exists
        from sqlalchemy import select
        from ..models.user import User

        query = select(User).where(User.id == user_id)
        result = await db.execute(query)
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="User not found")

    return GhostListResponse(
        ghosts=[
            GhostSummary(
                game_id=g["game_id"],
                user_id=g["user_id"],
                username=g["username"],
                victory=g["victory"],
                cause_of_death=g["cause_of_death"],
                killed_by=g["killed_by"],
                final_level=g["final_level"],
                final_score=g["final_score"],
                total_turns=g["total_turns"],
                frame_count=g["frame_count"],
                started_at=g["started_at"],
                ended_at=g["ended_at"],
            )
            for g in ghosts
        ],
        total=len(ghosts),
        page=page,
        page_size=page_size,
    )
