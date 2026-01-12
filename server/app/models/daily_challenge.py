"""Daily challenge model for seeded daily runs with leaderboards."""
from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Boolean, BigInteger
from sqlalchemy.orm import relationship

from ..core.database import Base


class DailyChallenge(Base):
    """Stores daily challenge metadata including the seed."""
    __tablename__ = "daily_challenges"

    id = Column(Integer, primary_key=True, index=True)
    challenge_date = Column(Date, unique=True, nullable=False, index=True)

    # Seed for deterministic dungeon generation
    seed = Column(BigInteger, nullable=False)

    # Optional modifiers (JSON-encoded, for future expansion)
    modifiers = Column(String(500), nullable=True)

    # Stats (cached)
    total_participants = Column(Integer, default=0)
    total_completions = Column(Integer, default=0)
    highest_score = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    results = relationship("DailyChallengeResult", back_populates="challenge")

    @staticmethod
    def generate_seed_for_date(challenge_date: date) -> int:
        """Generate a deterministic seed from a date."""
        # Use date components to create a repeatable seed
        # Format: YYYYMMDD * prime + day_of_year
        base = challenge_date.year * 10000 + challenge_date.month * 100 + challenge_date.day
        day_of_year = challenge_date.timetuple().tm_yday
        return (base * 7919 + day_of_year * 104729) % (2**31)

    def __repr__(self):
        return f"<DailyChallenge(date={self.challenge_date}, seed={self.seed})>"


class DailyChallengeResult(Base):
    """Stores a user's result for a specific daily challenge."""
    __tablename__ = "daily_challenge_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    challenge_id = Column(Integer, ForeignKey("daily_challenges.id"), nullable=False, index=True)

    # Game outcome
    victory = Column(Boolean, default=False)
    score = Column(Integer, default=0, index=True)

    # Progress stats
    level_reached = Column(Integer, default=1)
    kills = Column(Integer, default=0)
    turns_taken = Column(Integer, default=0)
    game_duration_seconds = Column(Integer, default=0)

    # Timestamps
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="daily_results")
    challenge = relationship("DailyChallenge", back_populates="results")

    def __repr__(self):
        return f"<DailyChallengeResult(user={self.user_id}, score={self.score})>"
