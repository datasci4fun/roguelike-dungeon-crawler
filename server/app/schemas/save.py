"""Pydantic schemas for game save API."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

from ..models.game_save import MAX_SAVE_SLOTS


class SaveMetadata(BaseModel):
    """Save metadata for listing (without full game state)."""
    slot_number: int
    save_name: Optional[str]
    save_version: int
    current_level: int
    player_level: int
    player_hp: int
    player_max_hp: int
    score: int
    turns_played: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SaveCreate(BaseModel):
    """Schema for creating or updating a save."""
    save_name: Optional[str] = Field(None, max_length=100)
    game_state: str = Field(..., description="JSON-serialized game state")
    current_level: int = Field(1, ge=1, le=8)
    player_level: int = Field(1, ge=1)
    player_hp: int = Field(0, ge=0)
    player_max_hp: int = Field(0, ge=0)
    score: int = Field(0, ge=0)
    turns_played: int = Field(0, ge=0)


class SaveResponse(SaveMetadata):
    """Full save response including game state."""
    id: int
    user_id: int
    game_state: str
    is_active: bool

    class Config:
        from_attributes = True


class SaveListResponse(BaseModel):
    """Response containing all saves for a user."""
    saves: List[SaveMetadata]
    max_slots: int = MAX_SAVE_SLOTS


class SaveSlotInfo(BaseModel):
    """Information about a save slot (may be empty)."""
    slot_number: int
    is_empty: bool
    save: Optional[SaveMetadata] = None
