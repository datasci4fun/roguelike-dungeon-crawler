"""Pydantic schemas for achievements API."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class AchievementDefResponse(BaseModel):
    """Achievement definition response."""
    id: str
    name: str
    description: str
    category: str
    rarity: str
    icon: str
    points: int
    hidden: bool


class UserAchievementResponse(BaseModel):
    """User's unlocked achievement response."""
    achievement_id: str
    name: str
    description: str
    category: str
    rarity: str
    icon: str
    points: int
    unlocked_at: datetime
    game_id: Optional[int]

    class Config:
        from_attributes = True


class AchievementListResponse(BaseModel):
    """List of all achievement definitions."""
    achievements: List[AchievementDefResponse]
    total: int


class UserAchievementsResponse(BaseModel):
    """User's achievements summary."""
    unlocked: List[UserAchievementResponse]
    total_unlocked: int
    total_points: int
    total_achievements: int
    completion_percentage: float


class AchievementProgress(BaseModel):
    """Progress toward an achievement."""
    achievement_id: str
    name: str
    description: str
    category: str
    rarity: str
    icon: str
    points: int
    current_value: int
    target_value: int
    progress_percentage: float
    unlocked: bool
    unlocked_at: Optional[datetime]


class AchievementProgressResponse(BaseModel):
    """All achievement progress for a user."""
    achievements: List[AchievementProgress]
    total_unlocked: int
    total_points: int


class RecentAchievementResponse(BaseModel):
    """Recently unlocked achievement."""
    achievement_id: str
    name: str
    description: str
    category: str
    rarity: str
    icon: str
    points: int
    unlocked_at: datetime
    user_id: int
    username: str
    display_name: Optional[str]


class NewAchievementsResponse(BaseModel):
    """Newly unlocked achievements after a game."""
    new_achievements: List[UserAchievementResponse]
    total_new: int
    total_points_earned: int
