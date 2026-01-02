"""Game result model for storing completed game data."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship

from ..core.database import Base


class GameResult(Base):
    """Stores the result of a completed game session."""
    __tablename__ = "game_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Game outcome
    victory = Column(Boolean, default=False)
    score = Column(Integer, default=0, index=True)

    # Progress stats
    level_reached = Column(Integer, default=1)
    max_level = Column(Integer, default=5)  # Total levels in dungeon

    # Combat stats
    kills = Column(Integer, default=0)
    damage_dealt = Column(Integer, default=0)
    damage_taken = Column(Integer, default=0)

    # Player final state
    final_hp = Column(Integer, default=0)
    max_hp = Column(Integer, default=0)
    player_level = Column(Integer, default=1)

    # Items
    potions_used = Column(Integer, default=0)
    items_collected = Column(Integer, default=0)
    gold_collected = Column(Integer, default=0)

    # Death info (if not victory)
    cause_of_death = Column(String(100), nullable=True)
    killed_by = Column(String(50), nullable=True)

    # Timing
    game_duration_seconds = Column(Integer, default=0)
    turns_taken = Column(Integer, default=0)

    # Ghost data (serialized game state for ghost replay)
    ghost_data = Column(Text, nullable=True)

    # Timestamps
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="game_results")

    def calculate_score(self) -> int:
        """Calculate final score based on game stats."""
        base_score = 0

        # Victory bonus
        if self.victory:
            base_score += 10000

        # Level progress
        base_score += self.level_reached * 1000

        # Combat performance
        base_score += self.kills * 100
        base_score += self.damage_dealt * 10

        # Survival bonus (HP remaining)
        if self.final_hp > 0:
            base_score += self.final_hp * 50

        # Efficiency bonus (fewer turns = better)
        if self.turns_taken > 0:
            efficiency = max(0, 5000 - self.turns_taken)
            base_score += efficiency

        # Gold bonus
        base_score += self.gold_collected * 5

        return base_score

    def __repr__(self):
        outcome = "Victory" if self.victory else f"Died on L{self.level_reached}"
        return f"<GameResult(user_id={self.user_id}, {outcome}, score={self.score})>"
