"""Pydantic schemas for chat API."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class ChatMessageCreate(BaseModel):
    """Schema for sending a chat message."""
    content: str = Field(..., min_length=1, max_length=500)
    channel: str = Field(default="global")
    recipient_id: Optional[int] = Field(default=None)


class ChatMessageResponse(BaseModel):
    """Schema for a chat message response."""
    id: int
    sender_id: int
    sender_username: str
    sender_display_name: Optional[str] = None
    recipient_id: Optional[int] = None
    recipient_username: Optional[str] = None
    channel: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    """Paginated chat history response."""
    messages: List[ChatMessageResponse]
    has_more: bool


class WhisperConversation(BaseModel):
    """Summary of a whisper conversation."""
    user_id: int
    username: str
    display_name: Optional[str] = None
    last_message: str
    last_message_at: datetime


class WhisperConversationsResponse(BaseModel):
    """List of whisper conversations."""
    conversations: List[WhisperConversation]


class OnlineUser(BaseModel):
    """Schema for an online user."""
    user_id: int
    username: str
    connected_at: datetime


class OnlineUsersResponse(BaseModel):
    """List of online users."""
    users: List[OnlineUser]
    count: int


class ChatStatus(BaseModel):
    """Chat system status."""
    online_count: int
    is_connected: bool
