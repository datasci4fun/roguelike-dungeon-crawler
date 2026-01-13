"""
Game Guide API - Races, Classes, Traps, Hazards, Status Effects, Biomes, Elements

Serves all remaining game mechanics data from constants.py
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Optional, Any

router = APIRouter(prefix="/api/guide", tags=["guide"])


# === Data Models ===

class RaceEntry(BaseModel):
    id: str
    name: str
    description: str
    hp_modifier: int
    atk_modifier: int
    def_modifier: int
    trait_name: str
    trait_description: str


class ClassEntry(BaseModel):
    id: str
    name: str
    description: str
    hp_modifier: int
    atk_modifier: int
    def_modifier: int
    active_abilities: List[str]
    passive_abilities: List[str]


class TrapEntry(BaseModel):
    id: str
    name: str
    symbol: str
    damage_min: int
    damage_max: int
    cooldown: int
    effect: Optional[str]
    detection_dc: int


class HazardEntry(BaseModel):
    id: str
    name: str
    symbol: str
    damage_per_turn: int
    effect: Optional[str]
    special: str


class StatusEffectEntry(BaseModel):
    id: str
    name: str
    damage_per_turn: int
    duration: int
    max_stacks: int
    stacking: str
    special: Optional[str]
    message: str


class BiomeEntry(BaseModel):
    id: str
    floor: int
    name: str
    description: str
    wall_symbol: str
    floor_symbol: str
    boss: str
    field_aspect: str


class ElementEntry(BaseModel):
    id: str
    name: str
    color: str
    weak_to: str
    damage_multiplier: float


# === Actual Game Data from constants.py ===

RACES: List[RaceEntry] = [
    RaceEntry(
        id="human",
        name="Human",
        description="Balanced and adaptable",
        hp_modifier=0,
        atk_modifier=0,
        def_modifier=0,
        trait_name="Adaptive",
        trait_description="+10% XP gain, +1 starting feat"
    ),
    RaceEntry(
        id="elf",
        name="Elf",
        description="Agile and perceptive",
        hp_modifier=-2,
        atk_modifier=1,
        def_modifier=0,
        trait_name="Keen Sight",
        trait_description="+2 vision range"
    ),
    RaceEntry(
        id="dwarf",
        name="Dwarf",
        description="Sturdy and resilient",
        hp_modifier=4,
        atk_modifier=-1,
        def_modifier=2,
        trait_name="Poison Resistance",
        trait_description="50% poison resistance"
    ),
    RaceEntry(
        id="halfling",
        name="Halfling",
        description="Lucky and nimble",
        hp_modifier=-4,
        atk_modifier=0,
        def_modifier=0,
        trait_name="Lucky",
        trait_description="15% dodge chance"
    ),
    RaceEntry(
        id="orc",
        name="Orc",
        description="Powerful but reckless",
        hp_modifier=6,
        atk_modifier=2,
        def_modifier=-1,
        trait_name="Rage",
        trait_description="+50% damage below 25% HP"
    ),
]

CLASSES: List[ClassEntry] = [
    ClassEntry(
        id="warrior",
        name="Warrior",
        description="Master of melee combat",
        hp_modifier=5,
        atk_modifier=1,
        def_modifier=1,
        active_abilities=["Power Strike", "Shield Wall"],
        passive_abilities=["Combat Mastery"]
    ),
    ClassEntry(
        id="mage",
        name="Mage",
        description="Wielder of arcane power",
        hp_modifier=-3,
        atk_modifier=-1,
        def_modifier=0,
        active_abilities=["Fireball", "Frost Nova"],
        passive_abilities=["Mana Shield"]
    ),
    ClassEntry(
        id="rogue",
        name="Rogue",
        description="Silent and deadly",
        hp_modifier=0,
        atk_modifier=2,
        def_modifier=-1,
        active_abilities=["Backstab", "Smoke Bomb"],
        passive_abilities=["Critical Strike"]
    ),
    ClassEntry(
        id="cleric",
        name="Cleric",
        description="Divine light in darkness",
        hp_modifier=2,
        atk_modifier=0,
        def_modifier=1,
        active_abilities=["Heal", "Smite"],
        passive_abilities=["Divine Protection"]
    ),
]

TRAPS: List[TrapEntry] = [
    TrapEntry(
        id="spike",
        name="Spike Trap",
        symbol="^",
        damage_min=5,
        damage_max=10,
        cooldown=3,
        effect=None,
        detection_dc=12
    ),
    TrapEntry(
        id="fire",
        name="Fire Trap",
        symbol="^",
        damage_min=3,
        damage_max=3,
        cooldown=5,
        effect="Burn",
        detection_dc=14
    ),
    TrapEntry(
        id="poison",
        name="Poison Trap",
        symbol="^",
        damage_min=2,
        damage_max=2,
        cooldown=4,
        effect="Poison",
        detection_dc=16
    ),
    TrapEntry(
        id="arrow",
        name="Arrow Trap",
        symbol="^",
        damage_min=8,
        damage_max=8,
        cooldown=2,
        effect=None,
        detection_dc=10
    ),
]

HAZARDS: List[HazardEntry] = [
    HazardEntry(
        id="lava",
        name="Lava",
        symbol="~",
        damage_per_turn=5,
        effect="Burn",
        special="Continuous fire damage"
    ),
    HazardEntry(
        id="ice",
        name="Ice",
        symbol="=",
        damage_per_turn=0,
        effect=None,
        special="Causes sliding - you'll keep moving in your direction"
    ),
    HazardEntry(
        id="poison_gas",
        name="Poison Gas",
        symbol="!",
        damage_per_turn=0,
        effect="Poison",
        special="Spreads each turn to adjacent tiles"
    ),
    HazardEntry(
        id="deep_water",
        name="Deep Water",
        symbol="~",
        damage_per_turn=0,
        effect=None,
        special="Slows movement (2 turns to cross), 10% drown chance below 25% HP"
    ),
]

STATUS_EFFECTS: List[StatusEffectEntry] = [
    StatusEffectEntry(
        id="poison",
        name="Poison",
        damage_per_turn=2,
        duration=5,
        max_stacks=3,
        stacking="intensity",
        special="Stacks increase damage (up to 6 damage/turn at 3 stacks)",
        message="You feel sick from the poison!"
    ),
    StatusEffectEntry(
        id="burn",
        name="Burning",
        damage_per_turn=3,
        duration=3,
        max_stacks=1,
        stacking="refresh",
        special="Refreshes duration instead of stacking",
        message="You are burning!"
    ),
    StatusEffectEntry(
        id="freeze",
        name="Frozen",
        damage_per_turn=0,
        duration=3,
        max_stacks=1,
        stacking="none",
        special="50% movement speed penalty",
        message="You are frozen and moving slowly!"
    ),
    StatusEffectEntry(
        id="stun",
        name="Stunned",
        damage_per_turn=0,
        duration=1,
        max_stacks=1,
        stacking="none",
        special="Skip your turn completely",
        message="You are stunned and cannot act!"
    ),
]

# 8 Biomes aligned with LEVEL_THEMES and Field aspects from LORE_COMPENDIUM.md
BIOMES: List[BiomeEntry] = [
    BiomeEntry(
        id="stone_dungeon",
        floor=1,
        name="Stone Dungeon",
        description="The ancient prison where the Skyfall Seed first struck. Cold stone walls hold memories of those who fell.",
        wall_symbol="#",
        floor_symbol=".",
        boss="Goblin King",
        field_aspect="Memory"
    ),
    BiomeEntry(
        id="sewers",
        floor=2,
        name="Sewers of Valdris",
        description="The circulatory system of the ruined city, now home to disease and vermin.",
        wall_symbol="#",
        floor_symbol=".",
        boss="Rat King",
        field_aspect="Circulation"
    ),
    BiomeEntry(
        id="forest_depths",
        floor=3,
        name="Forest Depths",
        description="Where nature reclaimed the ruins, twisted by the Field's influence into something predatory.",
        wall_symbol="T",
        floor_symbol='"',
        boss="Spider Queen",
        field_aspect="Growth"
    ),
    BiomeEntry(
        id="mirror_valdris",
        floor=4,
        name="Mirror Valdris",
        description="A counterfeit palace populated by echoes of a court that never existed.",
        wall_symbol="#",
        floor_symbol=",",
        boss="The Regent",
        field_aspect="Legitimacy"
    ),
    BiomeEntry(
        id="ice_cavern",
        floor=5,
        name="Ice Cavern",
        description="Time moves slowly here. Frozen moments from across Valdris's history stand preserved.",
        wall_symbol="#",
        floor_symbol=".",
        boss="Frost Giant",
        field_aspect="Stasis"
    ),
    BiomeEntry(
        id="ancient_library",
        floor=6,
        name="Ancient Library",
        description="The accumulated knowledge of Valdris, now hostile to those who seek to read it.",
        wall_symbol="|",
        floor_symbol="_",
        boss="Arcane Keeper",
        field_aspect="Cognition"
    ),
    BiomeEntry(
        id="volcanic_depths",
        floor=7,
        name="Volcanic Depths",
        description="The forge where the Field transforms matter. Everything here is in flux.",
        wall_symbol="#",
        floor_symbol=",",
        boss="Flame Lord",
        field_aspect="Transformation"
    ),
    BiomeEntry(
        id="crystal_cave",
        floor=8,
        name="Crystal Cave",
        description="Where all aspects of the Field converge. The Dragon Emperor guards the path to understanding.",
        wall_symbol="*",
        floor_symbol=".",
        boss="Dragon Emperor",
        field_aspect="Integration"
    ),
]

ELEMENTS: List[ElementEntry] = [
    ElementEntry(
        id="fire",
        name="Fire",
        color="#ef4444",
        weak_to="Ice",
        damage_multiplier=1.5
    ),
    ElementEntry(
        id="ice",
        name="Ice",
        color="#22d3ee",
        weak_to="Fire",
        damage_multiplier=1.5
    ),
    ElementEntry(
        id="lightning",
        name="Lightning",
        color="#fbbf24",
        weak_to="Dark",
        damage_multiplier=1.5
    ),
    ElementEntry(
        id="dark",
        name="Dark",
        color="#a855f7",
        weak_to="Lightning",
        damage_multiplier=1.5
    ),
]


# === API Endpoints ===

@router.get("/")
async def get_all_guide_data():
    """Get all game guide data in one request."""
    return {
        "races": RACES,
        "classes": CLASSES,
        "traps": TRAPS,
        "hazards": HAZARDS,
        "status_effects": STATUS_EFFECTS,
        "biomes": BIOMES,
        "elements": ELEMENTS,
    }


@router.get("/races")
async def get_races():
    """Get all playable races."""
    return {"races": RACES}


@router.get("/classes")
async def get_classes():
    """Get all playable classes."""
    return {"classes": CLASSES}


@router.get("/traps")
async def get_traps():
    """Get all trap types."""
    return {"traps": TRAPS}


@router.get("/hazards")
async def get_hazards():
    """Get all environmental hazards."""
    return {"hazards": HAZARDS}


@router.get("/status-effects")
async def get_status_effects():
    """Get all status effects."""
    return {"status_effects": STATUS_EFFECTS}


@router.get("/biomes")
async def get_biomes():
    """Get all dungeon biomes/themes."""
    return {"biomes": BIOMES}


@router.get("/elements")
async def get_elements():
    """Get element system data."""
    return {"elements": ELEMENTS}
