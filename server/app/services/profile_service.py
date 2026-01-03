"""Profile service for aggregating user profile data."""
from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.user import User
from ..models.game_result import GameResult
from ..models.user_achievement import UserAchievement
from ..config.achievements import ACHIEVEMENTS, get_total_points
from .leaderboard_service import LeaderboardService
from .achievement_service import AchievementService


class ProfileService:
    """Service for aggregating user profile data."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.leaderboard_service = LeaderboardService(db)
        self.achievement_service = AchievementService(db)

    async def get_full_profile(self, user_id: int) -> Optional[dict]:
        """
        Get comprehensive profile data including:
        - User stats
        - Recent games
        - Achievements
        - Rank
        """
        # Get user
        user_query = select(User).where(User.id == user_id)
        user_result = await self.db.execute(user_query)
        user = user_result.scalar_one_or_none()

        if not user:
            return None

        # Get rank
        rank = await self.leaderboard_service.get_user_rank(user_id)

        # Get recent games
        recent_games = await self.leaderboard_service.get_user_games(user_id, limit=10)

        # Get achievements
        achievements = await self.achievement_service.get_user_achievements(user_id)
        achievement_stats = await self.achievement_service.get_user_achievement_stats(user_id)

        # Calculate derived stats
        avg_score = await self._get_avg_score(user_id)
        avg_kills = (
            user.total_kills / user.games_played
            if user.games_played > 0
            else 0
        )
        favorite_death = await self._get_favorite_death_cause(user_id)

        # Build achievement responses
        achievement_responses = []
        for ua in achievements:
            ach_def = ACHIEVEMENTS.get(ua.achievement_id)
            if ach_def:
                achievement_responses.append({
                    "achievement_id": ua.achievement_id,
                    "name": ach_def.name,
                    "description": ach_def.description,
                    "category": ach_def.category.value,
                    "rarity": ach_def.rarity.value,
                    "icon": ach_def.icon,
                    "points": ach_def.points,
                    "unlocked_at": ua.unlocked_at,
                    "game_id": ua.game_id,
                })

        # Build game history responses
        game_responses = [
            {
                "id": g.id,
                "victory": g.victory,
                "score": g.score,
                "level_reached": g.level_reached,
                "kills": g.kills,
                "player_level": g.player_level,
                "turns_taken": g.turns_taken,
                "cause_of_death": g.cause_of_death,
                "killed_by": g.killed_by,
                "ended_at": g.ended_at,
            }
            for g in recent_games
        ]

        return {
            "user_id": user.id,
            "username": user.username,
            "display_name": user.display_name,
            "created_at": user.created_at,
            "rank": rank,
            "high_score": user.high_score,
            "games_played": user.games_played,
            "victories": user.victories,
            "total_deaths": user.total_deaths,
            "total_kills": user.total_kills,
            "max_level_reached": user.max_level_reached,
            "win_rate": round(
                user.victories / user.games_played * 100, 1
            ) if user.games_played > 0 else 0,
            "avg_score": round(avg_score, 1),
            "avg_kills_per_game": round(avg_kills, 1),
            "favorite_death_cause": favorite_death,
            "recent_games": game_responses,
            "achievements": achievement_responses,
            "achievement_points": achievement_stats["total_points"],
            "achievement_count": achievement_stats["total_unlocked"],
            "total_achievements": achievement_stats["total_achievements"],
        }

    async def get_public_profile(self, user_id: int) -> Optional[dict]:
        """Get public-facing profile data."""
        # Use full profile but could filter sensitive data if needed
        profile = await self.get_full_profile(user_id)
        if profile:
            # Remove recent_games for public profile to keep it lighter
            profile.pop("recent_games", None)
        return profile

    async def get_profile_by_username(self, username: str) -> Optional[dict]:
        """Get profile by username."""
        user_query = select(User).where(User.username == username)
        user_result = await self.db.execute(user_query)
        user = user_result.scalar_one_or_none()

        if not user:
            return None

        return await self.get_public_profile(user.id)

    async def _get_avg_score(self, user_id: int) -> float:
        """Get average score for a user."""
        query = select(func.avg(GameResult.score)).where(
            GameResult.user_id == user_id
        )
        result = await self.db.execute(query)
        avg = result.scalar_one()
        return float(avg) if avg else 0.0

    async def _get_favorite_death_cause(self, user_id: int) -> Optional[str]:
        """Get most common death cause for a user."""
        query = (
            select(
                GameResult.killed_by,
                func.count(GameResult.id).label("count")
            )
            .where(
                GameResult.user_id == user_id,
                GameResult.victory == False,
                GameResult.killed_by.isnot(None),
            )
            .group_by(GameResult.killed_by)
            .order_by(func.count(GameResult.id).desc())
            .limit(1)
        )
        result = await self.db.execute(query)
        row = result.first()
        return row[0] if row else None
