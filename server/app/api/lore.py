"""
Lore API - World-building and story content.

Built from actual game lore in LORE_COMPENDIUM.md.
Features:
- Lore categories (World, Locations, Wardens, Creatures, Artifacts, Discoveries)
- Individual lore entries with rich content
- The Skyfall Seed canon
"""

from fastapi import APIRouter

from .lore_models import LoreCategory
from .lore_content import (
    WORLD_LORE,
    LOCATION_LORE,
    WARDEN_LORE,
    CREATURE_LORE,
    ARTIFACT_LORE,
    DISCOVERY_LORE,
)

router = APIRouter(prefix="/api/lore", tags=["lore"])


# Combine all lore into categories
LORE_CATEGORIES = [
    LoreCategory(
        id="world",
        name="World & History",
        description="The Skyfall Seed, the Field, and the rewriting of Valdris",
        icon="🌍",
        entries=WORLD_LORE,
    ),
    LoreCategory(
        id="locations",
        name="The Dungeon Depths",
        description="Eight floors of stabilized Field reality",
        icon="🏰",
        entries=LOCATION_LORE,
    ),
    LoreCategory(
        id="wardens",
        name="The Wardens",
        description="Bosses who anchor each pocket of reality",
        icon="👑",
        entries=WARDEN_LORE,
    ),
    LoreCategory(
        id="creatures",
        name="Creatures",
        description="Patterns stabilized by the Field into recurring forms",
        icon="👹",
        entries=CREATURE_LORE,
    ),
    LoreCategory(
        id="artifacts",
        name="Sky-Touched Artifacts",
        description="Items that interface with the Field's power",
        icon="✨",
        entries=ARTIFACT_LORE,
    ),
    LoreCategory(
        id="discoveries",
        name="Discoverable Lore",
        description="Scrolls, journals, and evidence found in the depths",
        icon="📜",
        entries=DISCOVERY_LORE,
    ),
]


@router.get("")
async def get_all_lore():
    """Get all lore categories and entries."""
    return {
        "categories": [cat.model_dump() for cat in LORE_CATEGORIES],
        "total_entries": sum(len(cat.entries) for cat in LORE_CATEGORIES),
    }


@router.get("/categories")
async def get_lore_categories():
    """Get lore category list (without full entries)."""
    return {
        "categories": [
            {
                "id": cat.id,
                "name": cat.name,
                "description": cat.description,
                "icon": cat.icon,
                "entry_count": len(cat.entries),
            }
            for cat in LORE_CATEGORIES
        ]
    }


@router.get("/category/{category_id}")
async def get_lore_category(category_id: str):
    """Get a specific lore category with all entries."""
    for cat in LORE_CATEGORIES:
        if cat.id == category_id:
            return cat.model_dump()
    return {"error": "Category not found"}


@router.get("/entry/{entry_id}")
async def get_lore_entry(entry_id: str):
    """Get a specific lore entry."""
    for cat in LORE_CATEGORIES:
        for entry in cat.entries:
            if entry.id == entry_id:
                return entry.model_dump()
    return {"error": "Entry not found"}


@router.get("/search")
async def search_lore(q: str):
    """Search lore entries by title or content."""
    query = q.lower()
    results = []

    for cat in LORE_CATEGORIES:
        for entry in cat.entries:
            if query in entry.title.lower() or query in entry.content.lower():
                results.append({
                    **entry.model_dump(),
                    "category_name": cat.name,
                })

    return {
        "query": q,
        "results": results,
        "count": len(results),
    }
