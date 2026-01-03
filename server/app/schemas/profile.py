"""Pydantic schemas for player profile API."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

from .leaderboard import UserGameHistory
from .achievement import UserAchievementResponse


class ProfileStats(BaseModel):
    """Core player statistics."""
    user_id: int
    username: str
    display_name: Optional[str]
    created_at: datetime

    # Rankings
    rank: Optional[int]

    # Stats
    high_score: int
    games_played: int
    victories: int
    total_deaths: int
    total_kills: int
    max_level_reached: int
    win_rate: float

    # Derived stats
    avg_score: float
    avg_kills_per_game: float
    favorite_death_cause: Optional[str]

    class Config:
        from_attributes = True


class ProfileResponse(ProfileStats):
    """Full profile response with games and achievements."""
    recent_games: List[UserGameHistory]
    achievements: List[UserAchievementResponse]
    achievement_points: int
    achievement_count: int
    total_achievements: int


class PublicProfileResponse(ProfileStats):
    """Public profile response (limited data)."""
    achievements: List[UserAchievementResponse]
    achievement_points: int
    achievement_count: int
    total_achievements: int


class ProfileSummary(BaseModel):
    """Compact profile summary for listings."""
    user_id: int
    username: str
    display_name: Optional[str]
    rank: Optional[int]
    high_score: int
    victories: int
    achievement_count: int

    class Config:
        from_attributes = True
