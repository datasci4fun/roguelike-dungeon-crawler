"""
Character Guide API - Player races and classes database routes.

Features:
- Playable races with stats and traits
- Character classes with abilities
- Race/class combinations with synergy notes
- 3D model preview support
"""
from fastapi import APIRouter

from .character_guide_data import (
    RACES, CLASSES, COMBINATIONS,
    get_race, get_class, get_combination,
    RACES_BY_ID, CLASSES_BY_ID,
)

router = APIRouter(prefix="/api/character-guide", tags=["character-guide"])


# =============================================================================
# Races
# =============================================================================

@router.get("")
async def get_overview():
    """Get overview of all races and classes."""
    return {
        "races": [r.model_dump() for r in RACES],
        "classes": [c.model_dump() for c in CLASSES],
        "combinations": [combo.model_dump() for combo in COMBINATIONS],
        "stats": {
            "totalRaces": len(RACES),
            "totalClasses": len(CLASSES),
            "totalCombinations": len(COMBINATIONS),
        },
    }


@router.get("/races")
async def get_all_races():
    """Get all playable races."""
    return {
        "races": [r.model_dump() for r in RACES],
        "total": len(RACES),
    }


@router.get("/races/{race_id}")
async def get_race_by_id(race_id: str):
    """Get a specific race by ID."""
    race = get_race(race_id.upper())
    if not race:
        return {"error": f"Race '{race_id}' not found"}
    return race.model_dump()


# =============================================================================
# Classes
# =============================================================================

@router.get("/classes")
async def get_all_classes():
    """Get all playable classes."""
    return {
        "classes": [c.model_dump() for c in CLASSES],
        "total": len(CLASSES),
    }


@router.get("/classes/{class_id}")
async def get_class_by_id(class_id: str):
    """Get a specific class by ID."""
    player_class = get_class(class_id.upper())
    if not player_class:
        return {"error": f"Class '{class_id}' not found"}
    return player_class.model_dump()


# =============================================================================
# Combinations
# =============================================================================

@router.get("/combinations")
async def get_all_combinations():
    """Get all race/class combinations with synergy notes."""
    return {
        "combinations": [combo.model_dump() for combo in COMBINATIONS],
        "total": len(COMBINATIONS),
    }


@router.get("/combinations/{race_id}/{class_id}")
async def get_specific_combination(race_id: str, class_id: str):
    """Get a specific race/class combination."""
    combo = get_combination(race_id.upper(), class_id.upper())
    if not combo:
        return {"error": f"Combination '{race_id}/{class_id}' not found"}

    # Also include full race and class data
    race = get_race(race_id.upper())
    player_class = get_class(class_id.upper())

    return {
        "combination": combo.model_dump(),
        "race": race.model_dump() if race else None,
        "class": player_class.model_dump() if player_class else None,
    }


# =============================================================================
# Search
# =============================================================================

@router.get("/search")
async def search(q: str):
    """Search races and classes by name or description."""
    query = q.lower()

    matching_races = []
    for race in RACES:
        if (query in race.name.lower()
            or query in race.description.lower()
            or query in race.lore.lower()):
            matching_races.append(race.model_dump())

    matching_classes = []
    for player_class in CLASSES:
        if (query in player_class.name.lower()
            or query in player_class.description.lower()
            or query in player_class.lore.lower()):
            matching_classes.append(player_class.model_dump())

    return {
        "query": q,
        "races": matching_races,
        "classes": matching_classes,
        "totalResults": len(matching_races) + len(matching_classes),
    }


# =============================================================================
# Stats Comparison
# =============================================================================

@router.get("/stats/races")
async def compare_race_stats():
    """Get race stats comparison for UI charts."""
    return {
        "races": [
            {
                "id": r.id,
                "name": r.name,
                "health": r.stat_modifiers.health,
                "attack": r.stat_modifiers.attack,
                "defense": r.stat_modifiers.defense,
                "trait": r.racial_trait.name,
            }
            for r in RACES
        ]
    }


@router.get("/stats/classes")
async def compare_class_stats():
    """Get class stats comparison for UI charts."""
    return {
        "classes": [
            {
                "id": c.id,
                "name": c.name,
                "health": c.stat_modifiers.health,
                "attack": c.stat_modifiers.attack,
                "defense": c.stat_modifiers.defense,
                "abilityCount": len(c.abilities),
            }
            for c in CLASSES
        ]
    }
