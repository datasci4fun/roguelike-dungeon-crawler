"""Pydantic schemas for leaderboard API."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class GameResultBase(BaseModel):
    """Base game result schema."""
    victory: bool
    score: int
    level_reached: int
    kills: int
    damage_dealt: int
    damage_taken: int
    player_level: int
    turns_taken: int
    game_duration_seconds: int


class GameResultCreate(BaseModel):
    """Schema for recording a game result."""
    victory: bool
    level_reached: int
    kills: int
    damage_dealt: int
    damage_taken: int
    final_hp: int
    max_hp: int
    player_level: int
    potions_used: int = 0
    items_collected: int = 0
    gold_collected: int = 0
    cause_of_death: Optional[str] = None
    killed_by: Optional[str] = None
    game_duration_seconds: int = 0
    turns_taken: int = 0
    ghost_data: Optional[str] = None


class GameResultResponse(GameResultBase):
    """Full game result response."""
    id: int
    user_id: int
    username: str
    display_name: Optional[str]
    final_hp: int
    max_hp: int
    potions_used: int
    items_collected: int
    gold_collected: int
    cause_of_death: Optional[str]
    killed_by: Optional[str]
    ended_at: datetime

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    """Simplified leaderboard entry."""
    rank: int
    game_id: int
    user_id: int
    username: str
    display_name: Optional[str]
    score: int
    victory: bool
    level_reached: int
    kills: int
    player_level: int
    ended_at: datetime

    class Config:
        from_attributes = True


class PlayerRankingEntry(BaseModel):
    """Player ranking entry for player leaderboards."""
    rank: int
    user_id: int
    username: str
    display_name: Optional[str]
    high_score: int
    games_played: int
    victories: int
    total_kills: int
    max_level_reached: int

    class Config:
        from_attributes = True


class UserGameHistory(BaseModel):
    """User's game history entry."""
    id: int
    victory: bool
    score: int
    level_reached: int
    kills: int
    player_level: int
    turns_taken: int
    cause_of_death: Optional[str]
    killed_by: Optional[str]
    ended_at: datetime

    class Config:
        from_attributes = True


class UserStats(BaseModel):
    """User statistics summary."""
    user_id: int
    username: str
    display_name: Optional[str]
    rank: Optional[int]
    high_score: int
    games_played: int
    victories: int
    total_deaths: int
    total_kills: int
    max_level_reached: int
    win_rate: float

    class Config:
        from_attributes = True


class GlobalStats(BaseModel):
    """Global game statistics."""
    total_games: int
    total_victories: int
    total_players: int
    total_kills: int
    average_score: int
    highest_score: int
    victory_rate: float


class LeaderboardResponse(BaseModel):
    """Paginated leaderboard response."""
    entries: List[LeaderboardEntry]
    total: int
    page: int
    page_size: int


class PlayerLeaderboardResponse(BaseModel):
    """Paginated player leaderboard response."""
    entries: List[PlayerRankingEntry]
    total: int
    page: int
    page_size: int
