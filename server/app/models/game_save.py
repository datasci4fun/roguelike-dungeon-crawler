"""Game save model for storing in-progress game sessions."""
from datetime import datetime
from typing import Optional

from sqlalchemy import Integer, String, DateTime, ForeignKey, Text, Boolean, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base


# Constants
MAX_SAVE_SLOTS = 3
CURRENT_SAVE_VERSION = 1


class GameSave(Base):
    """Stores in-progress game sessions that can be resumed.

    Each user can have up to MAX_SAVE_SLOTS saves (slots 0, 1, 2).
    The game_state field contains the full serialized game state as JSON.
    Metadata fields (current_level, player_hp, etc.) allow displaying
    save info without deserializing the full game state.
    """

    __tablename__ = "game_saves"
    __table_args__ = (
        UniqueConstraint('user_id', 'slot_number', name='uq_user_save_slot'),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )
    slot_number: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Metadata
    save_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    save_version: Mapped[int] = mapped_column(Integer, default=CURRENT_SAVE_VERSION)

    # Progress snapshot (for display without deserializing)
    current_level: Mapped[int] = mapped_column(Integer, default=1)
    player_level: Mapped[int] = mapped_column(Integer, default=1)
    player_hp: Mapped[int] = mapped_column(Integer, default=0)
    player_max_hp: Mapped[int] = mapped_column(Integer, default=0)
    score: Mapped[int] = mapped_column(Integer, default=0)
    turns_played: Mapped[int] = mapped_column(Integer, default=0)

    # Full game state (JSON serialized)
    game_state: Mapped[str] = mapped_column(Text, nullable=False)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    user = relationship("User", back_populates="game_saves")

    def __repr__(self) -> str:
        return f"<GameSave(user_id={self.user_id}, slot={self.slot_number}, level={self.current_level})>"
