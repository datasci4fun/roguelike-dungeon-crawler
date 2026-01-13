"""
Pydantic schemas for Game Constants API responses.

These schemas provide:
- Type validation for API responses
- OpenAPI/Swagger documentation
- Response serialization
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


# =============================================================================
# Enemy Schemas
# =============================================================================

class EnemyResponse(BaseModel):
    """Enemy definition response."""
    enemy_id: str = Field(..., description="Unique enemy identifier")
    name: str = Field(..., description="Display name")
    symbol: str = Field(..., description="ASCII symbol for rendering")
    hp: int = Field(..., description="Base hit points")
    damage: int = Field(..., description="Base damage")
    xp: int = Field(..., description="Experience points awarded on kill")
    weight: int = Field(10, description="Spawn weight (higher = more common)")
    min_level: int = Field(1, description="Minimum dungeon level to spawn")
    max_level: int = Field(8, description="Maximum dungeon level to spawn")
    ai_type: Optional[str] = Field(None, description="AI behavior type")
    element: Optional[str] = Field(None, description="Elemental affinity")
    abilities: Optional[List[str]] = Field(None, description="Special abilities")
    resistances: Optional[Dict[str, float]] = Field(None, description="Damage resistances (0-1)")

    class Config:
        json_schema_extra = {
            "example": {
                "enemy_id": "goblin",
                "name": "Goblin",
                "symbol": "g",
                "hp": 6,
                "damage": 1,
                "xp": 10,
                "weight": 40,
                "min_level": 1,
                "max_level": 3
            }
        }


class FloorPoolEntry(BaseModel):
    """Single entry in a floor's enemy spawn pool."""
    enemy_id: str = Field(..., description="Enemy identifier")
    weight: int = Field(..., description="Spawn weight for this floor")
    theme: Optional[str] = Field(None, description="Floor theme")
    lore_aspect: Optional[str] = Field(None, description="Lore aspect of this floor")


class FloorPoolResponse(BaseModel):
    """Floor enemy spawn pool response."""
    floor: int = Field(..., description="Dungeon floor number (1-8)")
    enemies: List[FloorPoolEntry] = Field(..., description="Enemies that can spawn on this floor")


# =============================================================================
# Boss Schemas
# =============================================================================

class BossResponse(BaseModel):
    """Boss definition response."""
    boss_id: str = Field(..., description="Unique boss identifier")
    name: str = Field(..., description="Display name")
    symbol: str = Field(..., description="ASCII symbol for rendering")
    hp: int = Field(..., description="Base hit points")
    damage: int = Field(..., description="Base damage")
    xp: int = Field(..., description="Experience points awarded on kill")
    level: int = Field(..., description="Dungeon level where boss appears")
    theme: Optional[str] = Field(None, description="Associated dungeon theme")
    description: Optional[str] = Field(None, description="Flavor text description")
    abilities: Optional[List[str]] = Field(None, description="Special abilities")
    loot: Optional[List[str]] = Field(None, description="Guaranteed loot drops")

    class Config:
        json_schema_extra = {
            "example": {
                "boss_id": "goblin_king",
                "name": "Goblin King",
                "symbol": "K",
                "hp": 50,
                "damage": 5,
                "xp": 200,
                "level": 1,
                "theme": "stone_dungeon",
                "description": "A crowned goblin wielding a bloodied mace",
                "abilities": ["summon_goblins", "war_cry"],
                "loot": ["iron_sword", "chain_mail"]
            }
        }


# =============================================================================
# Race & Class Schemas
# =============================================================================

class RaceResponse(BaseModel):
    """Playable race definition response."""
    race_id: str = Field(..., description="Unique race identifier")
    name: str = Field(..., description="Display name")
    description: str = Field(..., description="Race description")
    hp_modifier: int = Field(0, description="HP modifier from base")
    atk_modifier: int = Field(0, description="Attack modifier from base")
    def_modifier: int = Field(0, description="Defense modifier from base")
    trait: str = Field(..., description="Racial trait identifier")
    trait_name: str = Field(..., description="Racial trait display name")
    trait_description: str = Field(..., description="Racial trait effect description")
    starts_with_feat: bool = Field(False, description="Whether race starts with a feat")

    class Config:
        json_schema_extra = {
            "example": {
                "race_id": "human",
                "name": "Human",
                "description": "Balanced and adaptable",
                "hp_modifier": 0,
                "atk_modifier": 0,
                "def_modifier": 0,
                "trait": "adaptive",
                "trait_name": "Adaptive",
                "trait_description": "+10% XP gain, +1 starting feat",
                "starts_with_feat": True
            }
        }


class ClassResponse(BaseModel):
    """Playable class definition response."""
    class_id: str = Field(..., description="Unique class identifier")
    name: str = Field(..., description="Display name")
    description: str = Field(..., description="Class description")
    hp_modifier: int = Field(0, description="HP modifier from base")
    atk_modifier: int = Field(0, description="Attack modifier from base")
    def_modifier: int = Field(0, description="Defense modifier from base")
    active_abilities: Optional[List[str]] = Field(None, description="Active abilities")
    passive_abilities: Optional[List[str]] = Field(None, description="Passive abilities")

    class Config:
        json_schema_extra = {
            "example": {
                "class_id": "warrior",
                "name": "Warrior",
                "description": "Master of melee combat",
                "hp_modifier": 5,
                "atk_modifier": 1,
                "def_modifier": 1,
                "active_abilities": ["power_strike", "shield_wall"],
                "passive_abilities": ["combat_mastery"]
            }
        }


# =============================================================================
# Theme Schemas
# =============================================================================

class TileConfig(BaseModel):
    """Tile rendering configuration."""
    unicode: str = Field(..., description="Unicode character")
    ascii: str = Field(..., description="ASCII fallback character")


class ThemeResponse(BaseModel):
    """Dungeon theme definition response."""
    theme_id: str = Field(..., description="Unique theme identifier")
    name: str = Field(..., description="Display name")
    level: int = Field(..., description="Dungeon level using this theme")
    tiles: Dict[str, TileConfig] = Field(..., description="Wall/floor tile characters")
    decorations: Dict[str, List[str]] = Field(..., description="Decoration characters")
    terrain_features: List[str] = Field(default_factory=list, description="Special terrain types")
    torch_count_min: int = Field(4, description="Minimum torches per level")
    torch_count_max: int = Field(8, description="Maximum torches per level")


# =============================================================================
# Combat Schemas
# =============================================================================

class TrapResponse(BaseModel):
    """Trap definition response."""
    trap_id: str = Field(..., description="Unique trap identifier")
    name: str = Field(..., description="Display name")
    symbol_hidden: str = Field(..., description="Symbol when hidden")
    symbol_visible: str = Field(..., description="Symbol when revealed")
    damage_min: int = Field(..., description="Minimum damage")
    damage_max: int = Field(..., description="Maximum damage")
    cooldown: int = Field(..., description="Turns before trap resets")
    effect: Optional[str] = Field(None, description="Status effect applied")
    detection_dc: int = Field(10, description="Difficulty to detect")


class HazardResponse(BaseModel):
    """Environmental hazard definition response."""
    hazard_id: str = Field(..., description="Unique hazard identifier")
    name: str = Field(..., description="Display name")
    symbol: str = Field(..., description="Rendering symbol")
    damage_per_turn: int = Field(0, description="Damage dealt per turn")
    effect: Optional[str] = Field(None, description="Status effect applied")
    blocks_movement: bool = Field(False, description="Whether hazard blocks movement")
    color: int = Field(7, description="Curses color pair index")
    causes_slide: bool = Field(False, description="Whether hazard causes sliding")
    spreads: bool = Field(False, description="Whether hazard spreads")
    slows_movement: bool = Field(False, description="Whether hazard slows movement")
    drown_chance: Optional[float] = Field(None, description="Chance to drown per turn")


class StatusEffectResponse(BaseModel):
    """Status effect definition response."""
    effect_id: str = Field(..., description="Unique effect identifier")
    name: str = Field(..., description="Display name")
    damage_per_turn: int = Field(0, description="Damage dealt per turn")
    duration: int = Field(..., description="Default duration in turns")
    max_stacks: int = Field(1, description="Maximum stack count")
    stacking: str = Field("none", description="Stacking behavior")
    color: int = Field(7, description="Curses color pair index")
    message: Optional[str] = Field(None, description="Message shown when applied")
    movement_penalty: Optional[float] = Field(None, description="Movement speed penalty")
    skip_turn: bool = Field(False, description="Whether effect skips turn")


# =============================================================================
# Item Schemas
# =============================================================================

class ItemResponse(BaseModel):
    """Item definition response."""
    item_id: str = Field(..., description="Unique item identifier")
    category: str = Field(..., description="Item category")
    name: str = Field(..., description="Display name")
    symbol: str = Field(..., description="Rendering symbol")
    description: str = Field(..., description="Item description")
    rarity: str = Field(..., description="Rarity tier")
    slot: Optional[str] = Field(None, description="Equipment slot")
    attack_bonus: Optional[int] = Field(None, description="Attack bonus when equipped")
    defense_bonus: Optional[int] = Field(None, description="Defense bonus when equipped")
    stat_bonuses: Optional[Dict[str, int]] = Field(None, description="Stat bonuses")
    block_chance: Optional[float] = Field(None, description="Shield block chance")
    heal_amount: Optional[int] = Field(None, description="HP restored on use")
    atk_increase: Optional[int] = Field(None, description="Permanent ATK increase")
    effect: Optional[str] = Field(None, description="Special effect")
    effect_value: Optional[int] = Field(None, description="Effect magnitude")
    damage: Optional[int] = Field(None, description="Ranged/throwable damage")
    range: Optional[int] = Field(None, description="Attack range")
    is_ranged: bool = Field(False, description="Whether item is ranged")
    key_level: Optional[int] = Field(None, description="Key tier (1-3)")

    class Config:
        json_schema_extra = {
            "example": {
                "item_id": "health_potion",
                "category": "consumable",
                "name": "Health Potion",
                "symbol": "!",
                "description": "Restores 10 HP",
                "rarity": "common",
                "heal_amount": 10
            }
        }


# =============================================================================
# Cache & Metadata Schemas
# =============================================================================

class CacheTypeStatus(BaseModel):
    """Cache status for a single constant type."""
    cached: bool = Field(..., description="Whether type is in cache")
    count: int = Field(..., description="Number of cached records")


class RedisHealth(BaseModel):
    """Redis server health status."""
    status: str = Field(..., description="Health status")
    used_memory: Optional[str] = Field(None, description="Memory usage")
    connected_clients: Optional[int] = Field(None, description="Connected clients")
    error: Optional[str] = Field(None, description="Error message if unhealthy")


class CacheStatusResponse(BaseModel):
    """Overall cache status response."""
    enemies: CacheTypeStatus
    floor_pools: CacheTypeStatus
    bosses: CacheTypeStatus
    races: CacheTypeStatus
    classes: CacheTypeStatus
    themes: CacheTypeStatus
    traps: CacheTypeStatus
    hazards: CacheTypeStatus
    status_effects: CacheTypeStatus
    items: CacheTypeStatus
    redis: RedisHealth


class MetadataResponse(BaseModel):
    """Seed metadata response."""
    table_name: str = Field(..., description="Database table name")
    version: str = Field(..., description="Seed file version")
    seed_file: str = Field(..., description="Source seed file")
    record_count: int = Field(..., description="Number of records")
    last_synced_at: datetime = Field(..., description="Last sync timestamp")


class InvalidateCacheResponse(BaseModel):
    """Cache invalidation response."""
    invalidated: int = Field(..., description="Number of keys invalidated")
    type: Optional[str] = Field(None, description="Type invalidated (if specific)")
    status: Optional[str] = Field(None, description="Operation status")
