"""User-related Pydantic schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class UserCreate(BaseModel):
    """Schema for user registration."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    display_name: Optional[str] = Field(None, max_length=100)

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        """Validate username contains only alphanumeric and underscore."""
        if not re.match(r"^[a-zA-Z0-9_]+$", v):
            raise ValueError("Username must contain only letters, numbers, and underscores")
        return v.lower()

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Validate password has minimum strength."""
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserLogin(BaseModel):
    """Schema for user login."""
    username: str
    password: str


class UserResponse(BaseModel):
    """Schema for user responses (public data only)."""
    id: int
    username: str
    email: EmailStr
    display_name: Optional[str]
    high_score: int
    games_played: int
    total_kills: int
    max_level_reached: int
    victories: int
    created_at: datetime
    last_login: Optional[datetime]

    model_config = {"from_attributes": True}


class UserPublic(BaseModel):
    """Schema for public user profile (leaderboard, etc.)."""
    id: int
    username: str
    display_name: Optional[str]
    high_score: int
    games_played: int
    total_kills: int
    max_level_reached: int
    victories: int

    model_config = {"from_attributes": True}
