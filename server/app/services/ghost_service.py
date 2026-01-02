"""Ghost service for querying and managing ghost replay data."""
import json
from typing import List, Optional
from datetime import datetime
from sqlalchemy import select, desc, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from ..models.game_result import GameResult
from ..models.user import User
from .ghost_recorder import GhostData


class GhostService:
    """Service for ghost replay queries."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_ghosts_for_level(
        self,
        dungeon_level: int,
        limit: int = 5,
        deaths_only: bool = True,
    ) -> List[dict]:
        """
        Get ghost data for a specific dungeon level.

        Args:
            dungeon_level: The dungeon level to get ghosts for
            limit: Maximum number of ghosts to return
            deaths_only: If True, only return ghosts that died on this level

        Returns:
            List of ghost data dictionaries
        """
        # Query game results that have ghost data
        query = (
            select(GameResult)
            .options(joinedload(GameResult.user))
            .where(GameResult.ghost_data.isnot(None))
        )

        if deaths_only:
            # Only ghosts that died (not victory)
            query = query.where(GameResult.victory == False)
            # And died on or after this level
            query = query.where(GameResult.level_reached >= dungeon_level)

        query = query.order_by(desc(GameResult.score)).limit(limit * 2)

        result = await self.db.execute(query)
        game_results = result.scalars().all()

        ghosts = []
        for game_result in game_results:
            try:
                ghost_data = GhostData.from_json(game_result.ghost_data)

                # Filter frames for this level
                level_frames = [
                    f for f in ghost_data.frames
                    if f.dungeon_level == dungeon_level
                ]

                if level_frames:
                    ghosts.append({
                        "game_id": game_result.id,
                        "user_id": game_result.user_id,
                        "username": game_result.user.username,
                        "dungeon_level": dungeon_level,
                        "frames": [f.to_dict() for f in level_frames],
                        "final_level": ghost_data.final_level,
                        "victory": ghost_data.victory,
                        "cause_of_death": ghost_data.cause_of_death,
                        "killed_by": ghost_data.killed_by,
                    })

                    if len(ghosts) >= limit:
                        break

            except (json.JSONDecodeError, Exception) as e:
                # Skip invalid ghost data
                continue

        return ghosts

    async def get_ghost_by_game_id(self, game_id: int) -> Optional[dict]:
        """
        Get full ghost data for a specific game.

        Args:
            game_id: The game result ID

        Returns:
            Full ghost data dictionary, or None
        """
        query = (
            select(GameResult)
            .options(joinedload(GameResult.user))
            .where(GameResult.id == game_id)
            .where(GameResult.ghost_data.isnot(None))
        )

        result = await self.db.execute(query)
        game_result = result.scalar_one_or_none()

        if not game_result:
            return None

        try:
            ghost_data = GhostData.from_json(game_result.ghost_data)
            return {
                "game_id": game_result.id,
                "user_id": game_result.user_id,
                "username": game_result.user.username,
                "victory": ghost_data.victory,
                "cause_of_death": ghost_data.cause_of_death,
                "killed_by": ghost_data.killed_by,
                "final_level": ghost_data.final_level,
                "final_score": game_result.score,
                "total_turns": ghost_data.total_turns,
                "dungeon_seed": ghost_data.dungeon_seed,
                "started_at": ghost_data.started_at,
                "ended_at": ghost_data.ended_at,
                "frames": [f.to_dict() for f in ghost_data.frames],
            }
        except (json.JSONDecodeError, Exception):
            return None

    async def get_recent_deaths(
        self,
        limit: int = 10,
        offset: int = 0,
    ) -> List[dict]:
        """
        Get recent death ghosts.

        Args:
            limit: Maximum number of ghosts
            offset: Pagination offset

        Returns:
            List of ghost summaries
        """
        query = (
            select(GameResult)
            .options(joinedload(GameResult.user))
            .where(GameResult.ghost_data.isnot(None))
            .where(GameResult.victory == False)
            .order_by(desc(GameResult.ended_at))
            .offset(offset)
            .limit(limit)
        )

        result = await self.db.execute(query)
        game_results = result.scalars().all()

        ghosts = []
        for game_result in game_results:
            try:
                ghost_data = GhostData.from_json(game_result.ghost_data)
                ghosts.append({
                    "game_id": game_result.id,
                    "user_id": game_result.user_id,
                    "username": game_result.user.username,
                    "victory": False,
                    "cause_of_death": ghost_data.cause_of_death,
                    "killed_by": ghost_data.killed_by,
                    "final_level": ghost_data.final_level,
                    "final_score": game_result.score,
                    "total_turns": ghost_data.total_turns,
                    "frame_count": len(ghost_data.frames),
                    "started_at": game_result.started_at,
                    "ended_at": game_result.ended_at,
                })
            except (json.JSONDecodeError, Exception):
                continue

        return ghosts

    async def get_user_ghosts(
        self,
        user_id: int,
        limit: int = 10,
        offset: int = 0,
    ) -> List[dict]:
        """
        Get a user's ghost recordings.

        Args:
            user_id: The user's ID
            limit: Maximum number of ghosts
            offset: Pagination offset

        Returns:
            List of ghost summaries
        """
        query = (
            select(GameResult)
            .options(joinedload(GameResult.user))
            .where(GameResult.user_id == user_id)
            .where(GameResult.ghost_data.isnot(None))
            .order_by(desc(GameResult.ended_at))
            .offset(offset)
            .limit(limit)
        )

        result = await self.db.execute(query)
        game_results = result.scalars().all()

        ghosts = []
        for game_result in game_results:
            try:
                ghost_data = GhostData.from_json(game_result.ghost_data)
                ghosts.append({
                    "game_id": game_result.id,
                    "user_id": game_result.user_id,
                    "username": game_result.user.username,
                    "victory": ghost_data.victory,
                    "cause_of_death": ghost_data.cause_of_death,
                    "killed_by": ghost_data.killed_by,
                    "final_level": ghost_data.final_level,
                    "final_score": game_result.score,
                    "total_turns": ghost_data.total_turns,
                    "frame_count": len(ghost_data.frames),
                    "started_at": game_result.started_at,
                    "ended_at": game_result.ended_at,
                })
            except (json.JSONDecodeError, Exception):
                continue

        return ghosts

    async def get_ghost_count(self) -> int:
        """Get total count of ghost recordings."""
        from sqlalchemy import func

        query = select(func.count(GameResult.id)).where(
            GameResult.ghost_data.isnot(None)
        )
        result = await self.db.execute(query)
        return result.scalar_one()
