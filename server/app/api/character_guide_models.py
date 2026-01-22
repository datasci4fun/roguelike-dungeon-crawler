"""
Character Guide Pydantic models.

Domain models for player race and class definitions.
"""
from typing import Optional
from pydantic import BaseModel


class RacialTrait(BaseModel):
    """A racial trait or passive ability."""
    name: str
    description: str
    effect: str  # Mechanical effect description


class ClassAbility(BaseModel):
    """A class ability (active or passive)."""
    name: str
    description: str
    ability_type: str  # "active" or "passive"
    damage: Optional[int] = None
    effect: Optional[str] = None
    cooldown: Optional[int] = None  # Turns


class StatModifier(BaseModel):
    """Stat modifier from race or class."""
    health: int = 0
    attack: int = 0
    defense: int = 0


class Race(BaseModel):
    """A playable race entry."""
    id: str  # e.g., "HUMAN", "ELF"
    name: str  # Display name
    description: str
    appearance: str  # Physical description
    lore: str  # Background/culture

    # Stats
    stat_modifiers: StatModifier
    base_height: float  # For 3D model scaling

    # Traits
    racial_trait: RacialTrait

    # Visual
    icon: str  # Emoji or icon code
    skin_color: str  # Hex color for 3D preview
    eye_color: str  # Hex color for 3D preview


class PlayerClass(BaseModel):
    """A playable class entry."""
    id: str  # e.g., "WARRIOR", "MAGE"
    name: str  # Display name
    description: str
    playstyle: str  # How to play this class
    lore: str  # Background/origin

    # Stats
    stat_modifiers: StatModifier

    # Abilities
    abilities: list[ClassAbility]

    # Equipment
    starting_equipment: str  # Description of starting gear
    equipment_type: str  # "sword_shield", "staff", "daggers", "holy"

    # Visual
    icon: str  # Emoji or icon code
    primary_color: str  # Hex color
    secondary_color: str  # Hex color
    glow_color: str  # Hex color for aura


class RaceClassCombination(BaseModel):
    """A specific race/class combination for preview."""
    race_id: str
    class_id: str
    display_name: str  # e.g., "Elf Mage"
    combined_stats: StatModifier
    synergy_notes: Optional[str] = None  # Tips about this combo
