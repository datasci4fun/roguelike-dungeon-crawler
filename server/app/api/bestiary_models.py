"""
Bestiary Pydantic models.

Domain models for creature definitions.
"""
from typing import Optional
from pydantic import BaseModel


class Ability(BaseModel):
    """A creature ability or attack."""
    name: str
    description: str
    damage: Optional[int] = None
    effect: Optional[str] = None


class LootDrop(BaseModel):
    """A potential loot drop."""
    item: str
    chance: str  # "Common", "Rare", "Guaranteed"


class Creature(BaseModel):
    """A bestiary creature entry."""
    id: str
    name: str
    title: Optional[str] = None
    category: str  # "common", "elite", "thematic", "rare", "boss"
    description: str
    appearance: str
    behavior: str
    floors: str  # e.g., "1-3", "All", "5 only"

    # Stats
    health: int
    damage: int
    speed: str  # "Slow", "Normal", "Fast", "Very Fast"

    # Combat
    abilities: list[Ability]
    weaknesses: list[str]
    resistances: list[str]

    # Rewards
    experience: int
    loot: list[LootDrop]

    # Visual
    icon: str
    threat_level: int  # 1-5 skulls
