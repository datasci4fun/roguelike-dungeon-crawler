"""Pydantic schemas for ghost replay API."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class GhostFrameResponse(BaseModel):
    """A single frame of ghost replay data."""
    turn: int
    x: int
    y: int
    health: int
    max_health: int
    level: int
    dungeon_level: int
    action: str
    target_x: Optional[int] = None
    target_y: Optional[int] = None
    damage_dealt: Optional[int] = None
    damage_taken: Optional[int] = None
    message: Optional[str] = None


class GhostSummary(BaseModel):
    """Summary of a ghost recording (without full frame data)."""
    game_id: int
    user_id: int
    username: str
    victory: bool
    cause_of_death: Optional[str] = None
    killed_by: Optional[str] = None
    final_level: int
    final_score: int
    total_turns: int
    frame_count: int
    started_at: datetime
    ended_at: datetime


class GhostDetailResponse(BaseModel):
    """Full ghost data including all frames."""
    game_id: int
    user_id: int
    username: str
    victory: bool
    cause_of_death: Optional[str] = None
    killed_by: Optional[str] = None
    final_level: int
    final_score: int
    total_turns: int
    dungeon_seed: Optional[int] = None
    started_at: str
    ended_at: str
    frames: List[GhostFrameResponse]


class GhostListResponse(BaseModel):
    """Paginated list of ghost summaries."""
    ghosts: List[GhostSummary]
    total: int
    page: int
    page_size: int


class GhostLevelFrames(BaseModel):
    """Frames for a specific dungeon level."""
    game_id: int
    username: str
    dungeon_level: int
    frames: List[GhostFrameResponse]


class MultiGhostResponse(BaseModel):
    """Multiple ghosts for the same level (for concurrent replay)."""
    dungeon_level: int
    ghosts: List[GhostLevelFrames]
