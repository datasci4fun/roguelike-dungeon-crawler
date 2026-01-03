"""Friendship model for player social connections."""
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Integer, DateTime, ForeignKey, UniqueConstraint, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base


class FriendshipStatus(str, PyEnum):
    """Status of a friendship connection."""
    PENDING = "pending"
    ACCEPTED = "accepted"
    BLOCKED = "blocked"


class Friendship(Base):
    """Tracks friend connections between users."""

    __tablename__ = "friendships"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )
    friend_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )
    status: Mapped[FriendshipStatus] = mapped_column(
        Enum(FriendshipStatus), default=FriendshipStatus.PENDING
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref="sent_friend_requests")
    friend = relationship("User", foreign_keys=[friend_id], backref="received_friend_requests")

    # Unique constraint: one request per user pair direction
    __table_args__ = (
        UniqueConstraint("user_id", "friend_id", name="uq_friendship"),
    )

    def __repr__(self) -> str:
        return f"<Friendship(user_id={self.user_id}, friend_id={self.friend_id}, status={self.status})>"
