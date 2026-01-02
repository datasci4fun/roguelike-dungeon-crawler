"""Leaderboard service for querying game results and rankings."""
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy import select, func, desc, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from ..models.user import User
from ..models.game_result import GameResult


class LeaderboardService:
    """Service for leaderboard queries and game result management."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def record_game_result(
        self,
        user_id: int,
        victory: bool,
        level_reached: int,
        kills: int,
        damage_dealt: int,
        damage_taken: int,
        final_hp: int,
        max_hp: int,
        player_level: int,
        potions_used: int = 0,
        items_collected: int = 0,
        gold_collected: int = 0,
        cause_of_death: Optional[str] = None,
        killed_by: Optional[str] = None,
        game_duration_seconds: int = 0,
        turns_taken: int = 0,
        ghost_data: Optional[str] = None,
        started_at: Optional[datetime] = None,
    ) -> GameResult:
        """Record a completed game and update user stats."""

        # Create game result
        result = GameResult(
            user_id=user_id,
            victory=victory,
            level_reached=level_reached,
            kills=kills,
            damage_dealt=damage_dealt,
            damage_taken=damage_taken,
            final_hp=final_hp,
            max_hp=max_hp,
            player_level=player_level,
            potions_used=potions_used,
            items_collected=items_collected,
            gold_collected=gold_collected,
            cause_of_death=cause_of_death,
            killed_by=killed_by,
            game_duration_seconds=game_duration_seconds,
            turns_taken=turns_taken,
            ghost_data=ghost_data,
            started_at=started_at or datetime.utcnow(),
            ended_at=datetime.utcnow(),
        )

        # Calculate score
        result.score = result.calculate_score()

        self.db.add(result)

        # Update user stats
        user_query = select(User).where(User.id == user_id)
        user_result = await self.db.execute(user_query)
        user = user_result.scalar_one_or_none()

        if user:
            user.games_played += 1
            user.total_kills += kills

            if victory:
                user.victories += 1

            if not victory:
                user.total_deaths += 1

            if level_reached > user.max_level_reached:
                user.max_level_reached = level_reached

            if result.score > user.high_score:
                user.high_score = result.score

        await self.db.commit()
        await self.db.refresh(result)

        return result

    async def get_top_scores(
        self,
        limit: int = 10,
        offset: int = 0,
    ) -> List[GameResult]:
        """Get top scores of all time."""
        query = (
            select(GameResult)
            .options(joinedload(GameResult.user))
            .order_by(desc(GameResult.score))
            .offset(offset)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_top_scores_by_period(
        self,
        days: int = 7,
        limit: int = 10,
        offset: int = 0,
    ) -> List[GameResult]:
        """Get top scores within a time period."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        query = (
            select(GameResult)
            .options(joinedload(GameResult.user))
            .where(GameResult.ended_at >= cutoff)
            .order_by(desc(GameResult.score))
            .offset(offset)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_victories(
        self,
        limit: int = 10,
        offset: int = 0,
    ) -> List[GameResult]:
        """Get games that ended in victory, sorted by score."""
        query = (
            select(GameResult)
            .options(joinedload(GameResult.user))
            .where(GameResult.victory == True)
            .order_by(desc(GameResult.score))
            .offset(offset)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_fastest_victories(
        self,
        limit: int = 10,
        offset: int = 0,
    ) -> List[GameResult]:
        """Get fastest victory runs by turns taken."""
        query = (
            select(GameResult)
            .options(joinedload(GameResult.user))
            .where(GameResult.victory == True)
            .order_by(GameResult.turns_taken)
            .offset(offset)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_most_kills(
        self,
        limit: int = 10,
        offset: int = 0,
    ) -> List[GameResult]:
        """Get games with most kills in a single run."""
        query = (
            select(GameResult)
            .options(joinedload(GameResult.user))
            .order_by(desc(GameResult.kills))
            .offset(offset)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_user_games(
        self,
        user_id: int,
        limit: int = 10,
        offset: int = 0,
    ) -> List[GameResult]:
        """Get a user's game history."""
        query = (
            select(GameResult)
            .where(GameResult.user_id == user_id)
            .order_by(desc(GameResult.ended_at))
            .offset(offset)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_user_best_games(
        self,
        user_id: int,
        limit: int = 10,
    ) -> List[GameResult]:
        """Get a user's best games by score."""
        query = (
            select(GameResult)
            .where(GameResult.user_id == user_id)
            .order_by(desc(GameResult.score))
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_user_rank(self, user_id: int) -> Optional[int]:
        """Get a user's rank based on high score."""
        # Get user's high score
        user_query = select(User.high_score).where(User.id == user_id)
        user_result = await self.db.execute(user_query)
        user_score = user_result.scalar_one_or_none()

        if user_score is None:
            return None

        # Count users with higher scores
        rank_query = select(func.count(User.id)).where(User.high_score > user_score)
        rank_result = await self.db.execute(rank_query)
        higher_count = rank_result.scalar_one()

        return higher_count + 1

    async def get_top_players(
        self,
        limit: int = 10,
        offset: int = 0,
    ) -> List[User]:
        """Get top players by high score."""
        query = (
            select(User)
            .where(User.games_played > 0)
            .order_by(desc(User.high_score))
            .offset(offset)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_most_victories(
        self,
        limit: int = 10,
        offset: int = 0,
    ) -> List[User]:
        """Get players with most victories."""
        query = (
            select(User)
            .where(User.victories > 0)
            .order_by(desc(User.victories))
            .offset(offset)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_global_stats(self) -> dict:
        """Get global game statistics."""
        # Total games
        total_games_q = select(func.count(GameResult.id))
        total_games = (await self.db.execute(total_games_q)).scalar_one()

        # Total victories
        total_victories_q = select(func.count(GameResult.id)).where(
            GameResult.victory == True
        )
        total_victories = (await self.db.execute(total_victories_q)).scalar_one()

        # Total players
        total_players_q = select(func.count(User.id)).where(User.games_played > 0)
        total_players = (await self.db.execute(total_players_q)).scalar_one()

        # Total kills
        total_kills_q = select(func.sum(GameResult.kills))
        total_kills = (await self.db.execute(total_kills_q)).scalar_one() or 0

        # Average score
        avg_score_q = select(func.avg(GameResult.score))
        avg_score = (await self.db.execute(avg_score_q)).scalar_one() or 0

        # Highest score ever
        max_score_q = select(func.max(GameResult.score))
        max_score = (await self.db.execute(max_score_q)).scalar_one() or 0

        return {
            "total_games": total_games,
            "total_victories": total_victories,
            "total_players": total_players,
            "total_kills": total_kills,
            "average_score": int(avg_score),
            "highest_score": max_score,
            "victory_rate": (
                round(total_victories / total_games * 100, 1)
                if total_games > 0
                else 0
            ),
        }

    async def get_game_result(self, game_id: int) -> Optional[GameResult]:
        """Get a specific game result by ID."""
        query = (
            select(GameResult)
            .options(joinedload(GameResult.user))
            .where(GameResult.id == game_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
