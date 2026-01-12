"""Daily challenge service for seeded daily runs with leaderboards."""
from datetime import datetime, date, timedelta
from typing import List, Optional
from sqlalchemy import select, func, desc, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from ..models.user import User
from ..models.daily_challenge import DailyChallenge, DailyChallengeResult


class DailyChallengeService:
    """Service for daily challenge operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_daily_challenge(
        self, challenge_date: Optional[date] = None
    ) -> DailyChallenge:
        """Get today's challenge or create it if it doesn't exist."""
        if challenge_date is None:
            challenge_date = date.today()

        # Check if challenge already exists
        query = select(DailyChallenge).where(
            DailyChallenge.challenge_date == challenge_date
        )
        result = await self.db.execute(query)
        challenge = result.scalar_one_or_none()

        if challenge:
            return challenge

        # Create new challenge
        seed = DailyChallenge.generate_seed_for_date(challenge_date)
        challenge = DailyChallenge(
            challenge_date=challenge_date,
            seed=seed,
        )
        self.db.add(challenge)
        await self.db.commit()
        await self.db.refresh(challenge)

        return challenge

    async def get_daily_challenge(
        self, challenge_date: Optional[date] = None
    ) -> Optional[DailyChallenge]:
        """Get a specific day's challenge (without creating)."""
        if challenge_date is None:
            challenge_date = date.today()

        query = select(DailyChallenge).where(
            DailyChallenge.challenge_date == challenge_date
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def has_user_completed_daily(
        self, user_id: int, challenge_date: Optional[date] = None
    ) -> bool:
        """Check if user has already completed today's daily challenge."""
        if challenge_date is None:
            challenge_date = date.today()

        challenge = await self.get_daily_challenge(challenge_date)
        if not challenge:
            return False

        query = select(func.count(DailyChallengeResult.id)).where(
            and_(
                DailyChallengeResult.user_id == user_id,
                DailyChallengeResult.challenge_id == challenge.id,
            )
        )
        result = await self.db.execute(query)
        count = result.scalar_one()
        return count > 0

    async def record_daily_result(
        self,
        user_id: int,
        victory: bool,
        score: int,
        level_reached: int,
        kills: int,
        turns_taken: int,
        game_duration_seconds: int,
        started_at: Optional[datetime] = None,
    ) -> Optional[DailyChallengeResult]:
        """Record a daily challenge result."""
        today = date.today()
        challenge = await self.get_or_create_daily_challenge(today)

        # Check if user already has a result for today
        if await self.has_user_completed_daily(user_id, today):
            return None  # Already completed

        # Create result
        result = DailyChallengeResult(
            user_id=user_id,
            challenge_id=challenge.id,
            victory=victory,
            score=score,
            level_reached=level_reached,
            kills=kills,
            turns_taken=turns_taken,
            game_duration_seconds=game_duration_seconds,
            started_at=started_at or datetime.utcnow(),
            completed_at=datetime.utcnow(),
        )
        self.db.add(result)

        # Update challenge stats
        challenge.total_participants += 1
        if victory:
            challenge.total_completions += 1
        if score > challenge.highest_score:
            challenge.highest_score = score

        # Update user streak
        await self._update_user_streak(user_id, today, score)

        await self.db.commit()
        await self.db.refresh(result)

        return result

    async def _update_user_streak(
        self, user_id: int, challenge_date: date, score: int
    ) -> None:
        """Update user's daily challenge streak."""
        query = select(User).where(User.id == user_id)
        result = await self.db.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            return

        yesterday = challenge_date - timedelta(days=1)

        # Update streak
        if user.last_daily_date == yesterday:
            # Continuing streak
            user.daily_streak += 1
        elif user.last_daily_date == challenge_date:
            # Already played today (shouldn't happen with check above)
            pass
        else:
            # Streak broken, start new
            user.daily_streak = 1

        # Update best streak
        if user.daily_streak > user.daily_best_streak:
            user.daily_best_streak = user.daily_streak

        # Update daily high score
        if score > user.daily_high_score:
            user.daily_high_score = score

        # Update completions and last date
        user.daily_completions += 1
        user.last_daily_date = challenge_date

    async def get_daily_leaderboard(
        self,
        challenge_date: Optional[date] = None,
        limit: int = 10,
        offset: int = 0,
    ) -> List[DailyChallengeResult]:
        """Get the leaderboard for a specific day's challenge."""
        if challenge_date is None:
            challenge_date = date.today()

        challenge = await self.get_daily_challenge(challenge_date)
        if not challenge:
            return []

        query = (
            select(DailyChallengeResult)
            .options(joinedload(DailyChallengeResult.user))
            .where(DailyChallengeResult.challenge_id == challenge.id)
            .order_by(desc(DailyChallengeResult.score))
            .offset(offset)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_user_daily_result(
        self, user_id: int, challenge_date: Optional[date] = None
    ) -> Optional[DailyChallengeResult]:
        """Get a user's result for a specific day's challenge."""
        if challenge_date is None:
            challenge_date = date.today()

        challenge = await self.get_daily_challenge(challenge_date)
        if not challenge:
            return None

        query = (
            select(DailyChallengeResult)
            .where(
                and_(
                    DailyChallengeResult.user_id == user_id,
                    DailyChallengeResult.challenge_id == challenge.id,
                )
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_user_daily_rank(
        self, user_id: int, challenge_date: Optional[date] = None
    ) -> Optional[int]:
        """Get a user's rank in today's daily challenge."""
        if challenge_date is None:
            challenge_date = date.today()

        user_result = await self.get_user_daily_result(user_id, challenge_date)
        if not user_result:
            return None

        challenge = await self.get_daily_challenge(challenge_date)
        if not challenge:
            return None

        # Count users with higher scores
        query = select(func.count(DailyChallengeResult.id)).where(
            and_(
                DailyChallengeResult.challenge_id == challenge.id,
                DailyChallengeResult.score > user_result.score,
            )
        )
        result = await self.db.execute(query)
        higher_count = result.scalar_one()

        return higher_count + 1

    async def get_user_daily_stats(self, user_id: int) -> dict:
        """Get a user's daily challenge statistics."""
        query = select(User).where(User.id == user_id)
        result = await self.db.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            return {}

        # Check if streak is still valid
        today = date.today()
        yesterday = today - timedelta(days=1)
        current_streak = user.daily_streak

        # If last play was more than yesterday, streak is broken
        if user.last_daily_date and user.last_daily_date < yesterday:
            current_streak = 0

        return {
            "current_streak": current_streak,
            "best_streak": user.daily_best_streak,
            "high_score": user.daily_high_score,
            "total_completions": user.daily_completions,
            "completed_today": user.last_daily_date == today,
        }

    async def get_recent_challenges(self, limit: int = 7) -> List[DailyChallenge]:
        """Get recent daily challenges."""
        query = (
            select(DailyChallenge)
            .order_by(desc(DailyChallenge.challenge_date))
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_streak_leaderboard(
        self, limit: int = 10, offset: int = 0
    ) -> List[User]:
        """Get users with highest daily challenge streaks."""
        today = date.today()
        yesterday = today - timedelta(days=1)

        # Only users with active streaks (played yesterday or today)
        query = (
            select(User)
            .where(
                and_(
                    User.daily_streak > 0,
                    User.last_daily_date >= yesterday,
                )
            )
            .order_by(desc(User.daily_streak))
            .offset(offset)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()
