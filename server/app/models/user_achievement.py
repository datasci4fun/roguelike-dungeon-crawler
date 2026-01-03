"""User achievement model for tracking unlocked achievements."""
from datetime import datetime
from typing import Optional

from sqlalchemy import Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base


class UserAchievement(Base):
    """Tracks achievements unlocked by users."""

    __tablename__ = "user_achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )
    achievement_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    unlocked_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    game_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("game_results.id"), nullable=True
    )

    # Relationships
    user = relationship("User", back_populates="achievements")
    game = relationship("GameResult")

    # Unique constraint: one unlock per user per achievement
    __table_args__ = (
        UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),
    )

    def __repr__(self) -> str:
        return f"<UserAchievement(user_id={self.user_id}, achievement={self.achievement_id})>"
