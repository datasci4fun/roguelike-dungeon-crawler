"""Narrative and gameplay data models.

These models store narrative content and gameplay mechanics that can be
updated without code deploys. Data is seeded from JSON files in data/seeds/.
"""
from datetime import datetime
from typing import Optional, List

from sqlalchemy import String, Integer, Float, Boolean, DateTime, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column

from ..core.database import Base


class BossAbility(Base):
    """Boss ability definition for special attacks and mechanics."""

    __tablename__ = "game_boss_abilities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ability_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # Ability type: aoe_attack, summon, buff, ranged, special
    ability_type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)

    # Combat stats
    cooldown: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    damage: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    range: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # Optional parameters
    radius: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    summon_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    summon_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    buff_stat: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    buff_amount: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    buff_duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status_effect: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<BossAbility {self.ability_id}: {self.name}>"


class Feat(Base):
    """Character feat definition for permanent upgrades."""

    __tablename__ = "game_feats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    feat_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # Category: combat, defense, utility, special
    category: Mapped[str] = mapped_column(String(30), nullable=False, index=True)

    # Stat bonuses
    hp_bonus: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    atk_bonus: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    def_bonus: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    damage_bonus: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    crit_chance_bonus: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    dodge_bonus: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Special effects (JSON for flexibility)
    effects: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Requirements
    level_required: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    prerequisites: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Feat {self.feat_id}: {self.name}>"


class Artifact(Base):
    """Artifact definition for powerful unique items."""

    __tablename__ = "game_artifacts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    artifact_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # Flavor text
    lore: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Effect (JSON for complex effects)
    effect: Mapped[dict] = mapped_column(JSON, nullable=False)

    # Cost/drawback (JSON for flexibility)
    cost: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Unlock condition
    unlock_condition: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Artifact {self.artifact_id}: {self.name}>"


class Vow(Base):
    """Vow definition for optional challenge modifiers."""

    __tablename__ = "game_vows"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    vow_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # Restriction type
    restriction_type: Mapped[str] = mapped_column(String(50), nullable=False)

    # Reward for completing
    xp_multiplier: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    reward: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Vow {self.vow_id}: {self.name}>"


class LoreEntry(Base):
    """Lore entry for discoverable narrative content."""

    __tablename__ = "game_lore_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lore_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # Category: history, character, location, item, mystery
    category: Mapped[str] = mapped_column(String(30), nullable=False, index=True)

    # Discovery hints
    level_hint: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    item_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    zone_hint: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Ordering
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<LoreEntry {self.lore_id}: {self.title}>"


class EncounterMessage(Base):
    """Encounter message for enemy first-sighting flavor text."""

    __tablename__ = "game_encounter_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    enemy_id: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<EncounterMessage {self.enemy_id}>"


class LevelIntroMessage(Base):
    """Level introduction message for floor entry."""

    __tablename__ = "game_level_intros"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    floor: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<LevelIntroMessage floor={self.floor}>"


class TutorialHint(Base):
    """Tutorial hint for player guidance."""

    __tablename__ = "game_tutorial_hints"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    hint_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    # When to show
    trigger_condition: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<TutorialHint {self.hint_id}>"


class MicroEvent(Base):
    """Micro-event for Field Pulse system."""

    __tablename__ = "game_micro_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    event_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    floor: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(100), nullable=False)

    # Messages (JSON array)
    messages: Mapped[List[str]] = mapped_column(JSON, nullable=False)

    # Effect type: none, reveal_tiles, heal_minor, boost_vision, lore_hint, calm_enemies, glow_items
    effect_type: Mapped[str] = mapped_column(String(30), nullable=False)
    effect_value: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Codex evidence to unlock
    evidence_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<MicroEvent {self.event_id} floor={self.floor}>"


class FloorDescription(Base):
    """Floor description for UI display."""

    __tablename__ = "game_floor_descriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    floor: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    aspect: Mapped[str] = mapped_column(String(50), nullable=False)
    hint: Mapped[str] = mapped_column(Text, nullable=False)
    warden: Mapped[str] = mapped_column(String(100), nullable=False)
    warden_symbol: Mapped[str] = mapped_column(String(10), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<FloorDescription floor={self.floor}: {self.name}>"


class LoreQuote(Base):
    """Lore quote for atmospheric UI sections."""

    __tablename__ = "game_lore_quotes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    quote_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    author: Mapped[str] = mapped_column(String(100), nullable=False)

    # Optional sorting/grouping
    category: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<LoreQuote {self.quote_id}>"
