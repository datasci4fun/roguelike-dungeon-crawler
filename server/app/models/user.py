"""User database model."""
from datetime import datetime, date
from typing import Optional

from sqlalchemy import String, Boolean, DateTime, Integer, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from passlib.context import CryptContext

from ..core.database import Base


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class User(Base):
    """User account model."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))

    # Profile
    display_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Stats (for leaderboard)
    high_score: Mapped[int] = mapped_column(Integer, default=0)
    games_played: Mapped[int] = mapped_column(Integer, default=0)
    total_kills: Mapped[int] = mapped_column(Integer, default=0)
    max_level_reached: Mapped[int] = mapped_column(Integer, default=0)
    total_deaths: Mapped[int] = mapped_column(Integer, default=0)
    victories: Mapped[int] = mapped_column(Integer, default=0)

    # Daily challenge stats
    daily_streak: Mapped[int] = mapped_column(Integer, default=0)
    daily_best_streak: Mapped[int] = mapped_column(Integer, default=0)
    daily_high_score: Mapped[int] = mapped_column(Integer, default=0)
    daily_completions: Mapped[int] = mapped_column(Integer, default=0)
    last_daily_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Account status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    last_login: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )

    # Relationships
    game_results = relationship("GameResult", back_populates="user", lazy="dynamic")
    achievements = relationship("UserAchievement", back_populates="user", lazy="dynamic")
    game_saves = relationship("GameSave", back_populates="user", lazy="dynamic")
    daily_results = relationship("DailyChallengeResult", back_populates="user", lazy="dynamic")

    def verify_password(self, plain_password: str) -> bool:
        """Verify a plain password against the hash."""
        return pwd_context.verify(plain_password, self.hashed_password)

    @staticmethod
    def hash_password(plain_password: str) -> str:
        """Hash a plain password."""
        return pwd_context.hash(plain_password)

    def __repr__(self) -> str:
        return f"<User {self.username}>"
