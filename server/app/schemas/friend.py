"""Pydantic schemas for friends API."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

from ..models.friendship import FriendshipStatus


class FriendBase(BaseModel):
    """Base friend information."""
    user_id: int
    username: str
    display_name: Optional[str]
    high_score: int
    victories: int
    is_online: bool = False

    class Config:
        from_attributes = True


class FriendResponse(FriendBase):
    """Friend with relationship info."""
    since: datetime  # When friendship was accepted


class FriendRequestResponse(BaseModel):
    """Friend request information."""
    id: int
    user_id: int
    username: str
    display_name: Optional[str]
    high_score: int
    created_at: datetime

    class Config:
        from_attributes = True


class FriendsListResponse(BaseModel):
    """List of friends response."""
    friends: List[FriendResponse]
    total: int


class FriendRequestsResponse(BaseModel):
    """List of friend requests."""
    incoming: List[FriendRequestResponse]
    outgoing: List[FriendRequestResponse]


class PlayerSearchResult(BaseModel):
    """Player search result."""
    user_id: int
    username: str
    display_name: Optional[str]
    high_score: int
    victories: int
    games_played: int
    is_friend: bool = False
    is_pending: bool = False  # Friend request pending
    is_online: bool = False

    class Config:
        from_attributes = True


class PlayerSearchResponse(BaseModel):
    """Search results response."""
    results: List[PlayerSearchResult]
    total: int


class FriendActionResponse(BaseModel):
    """Response for friend actions."""
    success: bool
    message: str
