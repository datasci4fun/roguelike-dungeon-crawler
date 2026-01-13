"""Game constants database models.

These models store game balance data that can be updated without code deploys.
Data is seeded from JSON files in data/seeds/ and cached in Redis.
"""
from datetime import datetime
from typing import Optional, List

from sqlalchemy import String, Integer, Float, Boolean, DateTime, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column

from ..core.database import Base


class Enemy(Base):
    """Enemy definition - stats, abilities, and spawn configuration."""

    __tablename__ = "game_enemies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    enemy_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    symbol: Mapped[str] = mapped_column(String(10), nullable=False)
    hp: Mapped[int] = mapped_column(Integer, nullable=False)
    damage: Mapped[int] = mapped_column(Integer, nullable=False)
    xp: Mapped[int] = mapped_column(Integer, nullable=False)
    weight: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    min_level: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    max_level: Mapped[int] = mapped_column(Integer, nullable=False, default=8)

    # Optional fields
    ai_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    element: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    abilities: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    resistances: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Enemy {self.enemy_id}: {self.name}>"


class FloorEnemyPool(Base):
    """Floor-specific enemy spawn pool configuration."""

    __tablename__ = "game_floor_enemy_pools"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    floor: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    enemy_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    weight: Mapped[int] = mapped_column(Integer, nullable=False)
    theme: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    lore_aspect: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<FloorEnemyPool floor={self.floor} enemy={self.enemy_id}>"


class Boss(Base):
    """Boss definition - powerful enemies at the end of each floor."""

    __tablename__ = "game_bosses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    boss_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    symbol: Mapped[str] = mapped_column(String(10), nullable=False)
    hp: Mapped[int] = mapped_column(Integer, nullable=False)
    damage: Mapped[int] = mapped_column(Integer, nullable=False)
    xp: Mapped[int] = mapped_column(Integer, nullable=False)
    level: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    theme: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    abilities: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    loot: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Boss {self.boss_id}: {self.name}>"


class Race(Base):
    """Playable race definition with stat modifiers and traits."""

    __tablename__ = "game_races"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    race_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    hp_modifier: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    atk_modifier: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    def_modifier: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    trait: Mapped[str] = mapped_column(String(50), nullable=False)
    trait_name: Mapped[str] = mapped_column(String(100), nullable=False)
    trait_description: Mapped[str] = mapped_column(Text, nullable=False)
    starts_with_feat: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Race {self.race_id}: {self.name}>"


class PlayerClass(Base):
    """Playable class definition with stat modifiers and abilities."""

    __tablename__ = "game_classes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    class_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    hp_modifier: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    atk_modifier: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    def_modifier: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    active_abilities: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    passive_abilities: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<PlayerClass {self.class_id}: {self.name}>"


class Theme(Base):
    """Dungeon theme definition with tiles, decorations, and terrain."""

    __tablename__ = "game_themes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    theme_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    level: Mapped[int] = mapped_column(Integer, nullable=False, index=True)

    # Tiles (stored as JSON with unicode/ascii variants)
    tiles: Mapped[dict] = mapped_column(JSON, nullable=False)
    decorations: Mapped[dict] = mapped_column(JSON, nullable=False)
    terrain_features: Mapped[List[str]] = mapped_column(JSON, nullable=False, default=list)

    # Torch configuration
    torch_count_min: Mapped[int] = mapped_column(Integer, nullable=False, default=4)
    torch_count_max: Mapped[int] = mapped_column(Integer, nullable=False, default=8)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Theme {self.theme_id}: {self.name}>"


class Trap(Base):
    """Trap definition for dungeon hazards."""

    __tablename__ = "game_traps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    trap_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    symbol_hidden: Mapped[str] = mapped_column(String(10), nullable=False)
    symbol_visible: Mapped[str] = mapped_column(String(10), nullable=False)
    damage_min: Mapped[int] = mapped_column(Integer, nullable=False)
    damage_max: Mapped[int] = mapped_column(Integer, nullable=False)
    cooldown: Mapped[int] = mapped_column(Integer, nullable=False)
    effect: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    detection_dc: Mapped[int] = mapped_column(Integer, nullable=False, default=10)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Trap {self.trap_id}: {self.name}>"


class Hazard(Base):
    """Environmental hazard definition."""

    __tablename__ = "game_hazards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    hazard_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    symbol: Mapped[str] = mapped_column(String(10), nullable=False)
    damage_per_turn: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    effect: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    blocks_movement: Mapped[bool] = mapped_column(Boolean, default=False)
    color: Mapped[int] = mapped_column(Integer, nullable=False, default=7)

    # Special properties
    causes_slide: Mapped[bool] = mapped_column(Boolean, default=False)
    spreads: Mapped[bool] = mapped_column(Boolean, default=False)
    slows_movement: Mapped[bool] = mapped_column(Boolean, default=False)
    drown_chance: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Hazard {self.hazard_id}: {self.name}>"


class StatusEffect(Base):
    """Status effect definition for buffs/debuffs."""

    __tablename__ = "game_status_effects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    effect_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    damage_per_turn: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    duration: Mapped[int] = mapped_column(Integer, nullable=False)
    max_stacks: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    stacking: Mapped[str] = mapped_column(String(20), nullable=False, default="none")
    color: Mapped[int] = mapped_column(Integer, nullable=False, default=7)
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Special properties
    movement_penalty: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    skip_turn: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<StatusEffect {self.effect_id}: {self.name}>"


class Item(Base):
    """Item definition for equipment, consumables, and accessories."""

    __tablename__ = "game_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    item_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    symbol: Mapped[str] = mapped_column(String(10), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    rarity: Mapped[str] = mapped_column(String(20), nullable=False, index=True)

    # Equipment slot (nullable for consumables)
    slot: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Stat bonuses (stored as JSON for flexibility)
    attack_bonus: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    defense_bonus: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    stat_bonuses: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Shield-specific
    block_chance: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Consumable-specific
    heal_amount: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    atk_increase: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Amulet-specific
    effect: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    effect_value: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Ranged/Throwable
    damage: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    range: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_ranged: Mapped[bool] = mapped_column(Boolean, default=False)

    # Key-specific
    key_level: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Item {self.item_id}: {self.name}>"


class GameConstantsMeta(Base):
    """Metadata for tracking seed versions and sync status."""

    __tablename__ = "game_constants_meta"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    table_name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    version: Mapped[str] = mapped_column(String(20), nullable=False)
    seed_file: Mapped[str] = mapped_column(String(200), nullable=False)
    record_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_synced_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<GameConstantsMeta {self.table_name} v{self.version}>"
