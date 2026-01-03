"""Achievement service for checking and awarding achievements."""
from datetime import datetime
from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from ..models.user import User
from ..models.user_achievement import UserAchievement
from ..models.game_result import GameResult
from ..config.achievements import (
    ACHIEVEMENTS,
    ACHIEVEMENT_CHECKERS,
    AchievementDef,
    get_all_achievements,
    get_total_points,
)


class AchievementService:
    """Service for achievement checking and management."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def check_and_award_achievements(
        self,
        user_id: int,
        game_result: GameResult,
    ) -> List[str]:
        """
        Check all achievements after a game ends.
        Returns list of newly unlocked achievement IDs.
        """
        # Get user stats
        user_query = select(User).where(User.id == user_id)
        user_result = await self.db.execute(user_query)
        user = user_result.scalar_one_or_none()

        if not user:
            return []

        # Get already unlocked achievements
        unlocked_query = select(UserAchievement.achievement_id).where(
            UserAchievement.user_id == user_id
        )
        unlocked_result = await self.db.execute(unlocked_query)
        unlocked_ids = set(unlocked_result.scalars().all())

        newly_unlocked = []

        # Check each achievement
        for achievement_id, checker in ACHIEVEMENT_CHECKERS.items():
            # Skip if already unlocked
            if achievement_id in unlocked_ids:
                continue

            # Check if achievement criteria is met
            try:
                if checker(game_result, user):
                    # Award the achievement
                    user_achievement = UserAchievement(
                        user_id=user_id,
                        achievement_id=achievement_id,
                        unlocked_at=datetime.utcnow(),
                        game_id=game_result.id,
                    )
                    self.db.add(user_achievement)
                    newly_unlocked.append(achievement_id)
            except Exception:
                # Skip on any checker error
                continue

        if newly_unlocked:
            await self.db.commit()

        return newly_unlocked

    async def get_user_achievements(
        self,
        user_id: int,
    ) -> List[UserAchievement]:
        """Get all achievements unlocked by a user."""
        query = (
            select(UserAchievement)
            .where(UserAchievement.user_id == user_id)
            .order_by(UserAchievement.unlocked_at.desc())
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_user_achievement_ids(self, user_id: int) -> set[str]:
        """Get set of achievement IDs unlocked by user."""
        query = select(UserAchievement.achievement_id).where(
            UserAchievement.user_id == user_id
        )
        result = await self.db.execute(query)
        return set(result.scalars().all())

    async def has_achievement(
        self,
        user_id: int,
        achievement_id: str,
    ) -> bool:
        """Check if user has unlocked an achievement."""
        query = select(UserAchievement).where(
            UserAchievement.user_id == user_id,
            UserAchievement.achievement_id == achievement_id,
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None

    async def award_achievement(
        self,
        user_id: int,
        achievement_id: str,
        game_id: Optional[int] = None,
    ) -> Optional[UserAchievement]:
        """Award an achievement to a user (if not already earned)."""
        # Check if already has it
        if await self.has_achievement(user_id, achievement_id):
            return None

        # Check if achievement exists
        if achievement_id not in ACHIEVEMENTS:
            return None

        user_achievement = UserAchievement(
            user_id=user_id,
            achievement_id=achievement_id,
            unlocked_at=datetime.utcnow(),
            game_id=game_id,
        )
        self.db.add(user_achievement)
        await self.db.commit()
        await self.db.refresh(user_achievement)

        return user_achievement

    async def get_user_achievement_stats(self, user_id: int) -> dict:
        """Get achievement statistics for a user."""
        unlocked_ids = await self.get_user_achievement_ids(user_id)

        total_points = sum(
            ACHIEVEMENTS[aid].points
            for aid in unlocked_ids
            if aid in ACHIEVEMENTS
        )

        total_achievements = len(ACHIEVEMENTS)
        total_unlocked = len(unlocked_ids)

        return {
            "total_unlocked": total_unlocked,
            "total_achievements": total_achievements,
            "total_points": total_points,
            "max_points": get_total_points(),
            "completion_percentage": round(
                total_unlocked / total_achievements * 100, 1
            ) if total_achievements > 0 else 0,
        }

    async def get_recent_achievements(
        self,
        limit: int = 20,
    ) -> List[UserAchievement]:
        """Get recently unlocked achievements globally."""
        query = (
            select(UserAchievement)
            .options(joinedload(UserAchievement.user))
            .order_by(UserAchievement.unlocked_at.desc())
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_achievement_stats(self) -> dict:
        """Get global achievement statistics."""
        # Total unlocks
        total_unlocks_q = select(func.count(UserAchievement.id))
        total_unlocks = (await self.db.execute(total_unlocks_q)).scalar_one()

        # Users with achievements
        users_with_q = select(func.count(func.distinct(UserAchievement.user_id)))
        users_with = (await self.db.execute(users_with_q)).scalar_one()

        # Most common achievement
        most_common_q = (
            select(
                UserAchievement.achievement_id,
                func.count(UserAchievement.id).label("count")
            )
            .group_by(UserAchievement.achievement_id)
            .order_by(func.count(UserAchievement.id).desc())
            .limit(1)
        )
        most_common_result = (await self.db.execute(most_common_q)).first()
        most_common = most_common_result[0] if most_common_result else None

        # Rarest achievement (at least 1 unlock)
        rarest_q = (
            select(
                UserAchievement.achievement_id,
                func.count(UserAchievement.id).label("count")
            )
            .group_by(UserAchievement.achievement_id)
            .order_by(func.count(UserAchievement.id))
            .limit(1)
        )
        rarest_result = (await self.db.execute(rarest_q)).first()
        rarest = rarest_result[0] if rarest_result else None

        return {
            "total_unlocks": total_unlocks,
            "users_with_achievements": users_with,
            "total_achievements": len(ACHIEVEMENTS),
            "most_common": most_common,
            "rarest": rarest,
        }

    def get_achievement_def(self, achievement_id: str) -> Optional[AchievementDef]:
        """Get achievement definition."""
        return ACHIEVEMENTS.get(achievement_id)

    def get_all_achievement_defs(self) -> List[AchievementDef]:
        """Get all achievement definitions."""
        return get_all_achievements()
