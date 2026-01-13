"""
Bestiary API - Creature and enemy database routes.

Features:
- Creature categories (Common, Elite, Thematic, Rare, Boss)
- Stats (health, damage, XP)
- Floor ranges and spawn locations
- Abilities, elements, and AI behaviors
- Loot drops and resistances
"""
from fastapi import APIRouter

from .bestiary_models import Creature
from .bestiary_data import CREATURES, CATEGORIES, FLOOR_THEMES

router = APIRouter(prefix="/api/bestiary", tags=["bestiary"])


@router.get("")
async def get_all_creatures():
    """Get all bestiary entries."""
    return {
        "creatures": [c.model_dump() for c in CREATURES],
        "total": len(CREATURES),
        "categories": CATEGORIES,
    }


@router.get("/categories")
async def get_categories():
    """Get creature categories."""
    category_counts = {}
    for creature in CREATURES:
        cat = creature.category
        category_counts[cat] = category_counts.get(cat, 0) + 1

    return {
        "categories": [
            {
                "id": cat_id,
                **cat_info,
                "count": category_counts.get(cat_id, 0),
            }
            for cat_id, cat_info in CATEGORIES.items()
        ]
    }


@router.get("/category/{category_id}")
async def get_creatures_by_category(category_id: str):
    """Get creatures in a specific category."""
    creatures = [c for c in CREATURES if c.category == category_id]
    return {
        "category": CATEGORIES.get(category_id),
        "creatures": [c.model_dump() for c in creatures],
        "count": len(creatures),
    }


@router.get("/creature/{creature_id}")
async def get_creature(creature_id: str):
    """Get a specific creature."""
    for creature in CREATURES:
        if creature.id == creature_id:
            return creature.model_dump()
    return {"error": "Creature not found"}


@router.get("/search")
async def search_creatures(q: str):
    """Search creatures by name or description."""
    query = q.lower()
    results = [
        c for c in CREATURES
        if query in c.name.lower()
        or query in c.description.lower()
        or (c.title and query in c.title.lower())
    ]
    return {
        "query": q,
        "results": [c.model_dump() for c in results],
        "count": len(results),
    }


@router.get("/floors/{floor}")
async def get_creatures_by_floor(floor: int):
    """Get creatures that appear on a specific floor."""
    results = []
    for creature in CREATURES:
        floor_range = creature.floors
        if floor_range == "Any" or floor_range == "All":
            results.append(creature)
        elif "only" in floor_range.lower():
            # Single floor like "8 only"
            try:
                floor_num = int(floor_range.split()[0])
                if floor_num == floor:
                    results.append(creature)
            except ValueError:
                pass
        elif "(Boss)" in floor_range or "(Final Boss)" in floor_range:
            # Boss floor
            try:
                floor_num = int(floor_range.split()[0])
                if floor_num == floor:
                    results.append(creature)
            except ValueError:
                pass
        elif "-" in floor_range:
            # Handle ranges like "1-5"
            parts = floor_range.split("-")
            try:
                min_floor, max_floor = int(parts[0]), int(parts[1])
                if min_floor <= floor <= max_floor:
                    results.append(creature)
            except ValueError:
                pass

    return {
        "floor": floor,
        "theme": FLOOR_THEMES.get(floor, "Unknown"),
        "creatures": [c.model_dump() for c in results],
        "count": len(results),
    }


@router.get("/stats")
async def get_bestiary_stats():
    """Get bestiary statistics."""
    category_counts = {}
    total_health = 0
    max_damage = 0

    for creature in CREATURES:
        cat = creature.category
        category_counts[cat] = category_counts.get(cat, 0) + 1
        total_health += creature.health
        if creature.damage > max_damage:
            max_damage = creature.damage

    return {
        "total_creatures": len(CREATURES),
        "by_category": category_counts,
        "average_health": total_health // len(CREATURES) if CREATURES else 0,
        "max_damage": max_damage,
        "floor_themes": FLOOR_THEMES,
    }
