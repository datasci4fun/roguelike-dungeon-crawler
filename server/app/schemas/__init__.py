"""Pydantic schemas for request/response validation."""
from .user import UserCreate, UserResponse, UserLogin
from .auth import Token, TokenData
from .leaderboard import (
    GameResultCreate,
    GameResultResponse,
    LeaderboardEntry,
    LeaderboardResponse,
    PlayerRankingEntry,
    PlayerLeaderboardResponse,
    UserStats,
    UserGameHistory,
    GlobalStats,
)
from .ghost import (
    GhostFrameResponse,
    GhostSummary,
    GhostDetailResponse,
    GhostListResponse,
    GhostLevelFrames,
    MultiGhostResponse,
)
from .chat import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatHistoryResponse,
    WhisperConversation,
    WhisperConversationsResponse,
    OnlineUser,
    OnlineUsersResponse,
    ChatStatus,
)

__all__ = [
    "UserCreate",
    "UserResponse",
    "UserLogin",
    "Token",
    "TokenData",
    "GameResultCreate",
    "GameResultResponse",
    "LeaderboardEntry",
    "LeaderboardResponse",
    "PlayerRankingEntry",
    "PlayerLeaderboardResponse",
    "UserStats",
    "UserGameHistory",
    "GlobalStats",
    "GhostFrameResponse",
    "GhostSummary",
    "GhostDetailResponse",
    "GhostListResponse",
    "GhostLevelFrames",
    "MultiGhostResponse",
    "ChatMessageCreate",
    "ChatMessageResponse",
    "ChatHistoryResponse",
    "WhisperConversation",
    "WhisperConversationsResponse",
    "OnlineUser",
    "OnlineUsersResponse",
    "ChatStatus",
]
