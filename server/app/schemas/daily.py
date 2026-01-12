"""Pydantic schemas for daily challenge API."""
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel


class DailyChallengeInfo(BaseModel):
    """Daily challenge metadata."""
    id: int
    challenge_date: date
    seed: int
    total_participants: int
    total_completions: int
    highest_score: int

    class Config:
        from_attributes = True


class DailyResultCreate(BaseModel):
    """Request body for submitting a daily result."""
    victory: bool
    score: int
    level_reached: int
    kills: int
    turns_taken: int
    game_duration_seconds: int


class DailyResultResponse(BaseModel):
    """Daily challenge result with user info."""
    id: int
    score: int
    victory: bool
    level_reached: int
    kills: int
    turns_taken: int
    game_duration_seconds: int
    completed_at: datetime
    username: str
    rank: Optional[int] = None

    class Config:
        from_attributes = True


class DailyLeaderboardEntry(BaseModel):
    """Leaderboard entry for daily challenge."""
    rank: int
    username: str
    score: int
    victory: bool
    level_reached: int
    kills: int
    turns_taken: int


class DailyUserStats(BaseModel):
    """User's daily challenge statistics."""
    current_streak: int
    best_streak: int
    high_score: int
    total_completions: int
    completed_today: bool


class DailyOverview(BaseModel):
    """Overview of today's daily challenge."""
    challenge: DailyChallengeInfo
    user_stats: DailyUserStats
    user_result: Optional[DailyResultResponse] = None
    user_rank: Optional[int] = None
    top_scores: List[DailyLeaderboardEntry]


class StreakLeaderboardEntry(BaseModel):
    """Streak leaderboard entry."""
    rank: int
    username: str
    streak: int
    daily_high_score: int
    total_completions: int
