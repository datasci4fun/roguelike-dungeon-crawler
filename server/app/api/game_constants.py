"""
Game Constants API

Provides cached access to game constants (enemies, bosses, items, etc.)
using the cache-aside pattern. Data is served from Redis when available,
falling back to PostgreSQL on cache miss.

This replaces static TypeScript data files in the frontend, allowing
game balance changes without frontend redeployment.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.cache import cache, CacheKeys, CacheTTL
from ..models.game_constants import (
    Enemy,
    FloorEnemyPool,
    Boss,
    Race,
    PlayerClass,
    Theme,
    Trap,
    Hazard,
    StatusEffect,
    Item,
    GameConstantsMeta,
)
from ..services.cache_warmer import (
    model_to_dict,
    get_cache_status,
    invalidate_and_rewarm,
)

router = APIRouter(prefix="/api/game-constants", tags=["game-constants"])


# =============================================================================
# Enemies
# =============================================================================

@router.get("/enemies")
async def get_enemies(
    db: AsyncSession = Depends(get_db),
    floor: Optional[int] = Query(None, ge=1, le=8, description="Filter by floor availability"),
):
    """
    Get all enemy definitions.

    Optionally filter by floor to get enemies available on a specific level.
    """
    # Try cache first
    cached = await cache.get_game_constants("enemies")
    if cached:
        if floor:
            # Filter by floor availability
            return [e for e in cached if e.get("min_level", 1) <= floor <= e.get("max_level", 8)]
        return cached

    # Cache miss - fetch from database
    result = await db.execute(select(Enemy))
    enemies = result.scalars().all()

    enemy_list = [model_to_dict(e) for e in enemies]

    # Cache the full list
    await cache.set_game_constants("enemies", enemy_list)

    if floor:
        return [e for e in enemy_list if e.get("min_level", 1) <= floor <= e.get("max_level", 8)]
    return enemy_list


@router.get("/enemies/{enemy_id}")
async def get_enemy(
    enemy_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific enemy by ID."""
    # Try cache first
    cached = await cache.get_game_constants("enemies")
    if cached:
        for enemy in cached:
            if enemy.get("enemy_id") == enemy_id:
                return enemy
        raise HTTPException(status_code=404, detail=f"Enemy '{enemy_id}' not found")

    # Cache miss - fetch from database
    result = await db.execute(select(Enemy).where(Enemy.enemy_id == enemy_id))
    enemy = result.scalar_one_or_none()

    if not enemy:
        raise HTTPException(status_code=404, detail=f"Enemy '{enemy_id}' not found")

    return model_to_dict(enemy)


@router.get("/floor-pools/{floor}")
async def get_floor_pool(
    floor: int,
    db: AsyncSession = Depends(get_db),
):
    """Get enemy spawn pool for a specific floor."""
    if floor < 1 or floor > 8:
        raise HTTPException(status_code=400, detail="Floor must be between 1 and 8")

    # Try cache first
    cached = await cache.get_floor_pool(floor)
    if cached:
        return {"floor": floor, "enemies": cached}

    # Cache miss - fetch from database
    result = await db.execute(
        select(FloorEnemyPool).where(FloorEnemyPool.floor == floor)
    )
    pools = result.scalars().all()

    if not pools:
        raise HTTPException(status_code=404, detail=f"No enemy pool for floor {floor}")

    pool_list = [{
        "enemy_id": p.enemy_id,
        "weight": p.weight,
        "theme": p.theme,
        "lore_aspect": p.lore_aspect,
    } for p in pools]

    # Cache the result
    await cache.set_floor_pool(floor, pool_list)

    return {"floor": floor, "enemies": pool_list}


# =============================================================================
# Bosses
# =============================================================================

@router.get("/bosses")
async def get_bosses(
    db: AsyncSession = Depends(get_db),
):
    """Get all boss definitions."""
    cached = await cache.get_game_constants("bosses")
    if cached:
        return cached

    result = await db.execute(select(Boss))
    bosses = result.scalars().all()

    boss_list = [model_to_dict(b) for b in bosses]
    await cache.set_game_constants("bosses", boss_list)

    return boss_list


@router.get("/bosses/{boss_id}")
async def get_boss(
    boss_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific boss by ID."""
    cached = await cache.get_game_constants("bosses")
    if cached:
        for boss in cached:
            if boss.get("boss_id") == boss_id:
                return boss
        raise HTTPException(status_code=404, detail=f"Boss '{boss_id}' not found")

    result = await db.execute(select(Boss).where(Boss.boss_id == boss_id))
    boss = result.scalar_one_or_none()

    if not boss:
        raise HTTPException(status_code=404, detail=f"Boss '{boss_id}' not found")

    return model_to_dict(boss)


# =============================================================================
# Races & Classes
# =============================================================================

@router.get("/races")
async def get_races(db: AsyncSession = Depends(get_db)):
    """Get all playable race definitions."""
    cached = await cache.get_game_constants("races")
    if cached:
        return cached

    result = await db.execute(select(Race))
    races = result.scalars().all()

    race_list = [model_to_dict(r) for r in races]
    await cache.set_game_constants("races", race_list)

    return race_list


@router.get("/classes")
async def get_classes(db: AsyncSession = Depends(get_db)):
    """Get all playable class definitions."""
    cached = await cache.get_game_constants("classes")
    if cached:
        return cached

    result = await db.execute(select(PlayerClass))
    classes = result.scalars().all()

    class_list = [model_to_dict(c) for c in classes]
    await cache.set_game_constants("classes", class_list)

    return class_list


# =============================================================================
# Themes
# =============================================================================

@router.get("/themes")
async def get_themes(db: AsyncSession = Depends(get_db)):
    """Get all dungeon theme definitions."""
    cached = await cache.get_game_constants("themes")
    if cached:
        return cached

    result = await db.execute(select(Theme))
    themes = result.scalars().all()

    theme_list = [model_to_dict(t) for t in themes]
    await cache.set_game_constants("themes", theme_list)

    return theme_list


@router.get("/themes/{theme_id}")
async def get_theme(
    theme_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific theme by ID."""
    cached = await cache.get_game_constants("themes")
    if cached:
        for theme in cached:
            if theme.get("theme_id") == theme_id:
                return theme
        raise HTTPException(status_code=404, detail=f"Theme '{theme_id}' not found")

    result = await db.execute(select(Theme).where(Theme.theme_id == theme_id))
    theme = result.scalar_one_or_none()

    if not theme:
        raise HTTPException(status_code=404, detail=f"Theme '{theme_id}' not found")

    return model_to_dict(theme)


# =============================================================================
# Combat (Traps, Hazards, Status Effects)
# =============================================================================

@router.get("/traps")
async def get_traps(db: AsyncSession = Depends(get_db)):
    """Get all trap definitions."""
    cached = await cache.get_game_constants("traps")
    if cached:
        return cached

    result = await db.execute(select(Trap))
    traps = result.scalars().all()

    trap_list = [model_to_dict(t) for t in traps]
    await cache.set_game_constants("traps", trap_list)

    return trap_list


@router.get("/hazards")
async def get_hazards(db: AsyncSession = Depends(get_db)):
    """Get all environmental hazard definitions."""
    cached = await cache.get_game_constants("hazards")
    if cached:
        return cached

    result = await db.execute(select(Hazard))
    hazards = result.scalars().all()

    hazard_list = [model_to_dict(h) for h in hazards]
    await cache.set_game_constants("hazards", hazard_list)

    return hazard_list


@router.get("/status-effects")
async def get_status_effects(db: AsyncSession = Depends(get_db)):
    """Get all status effect definitions."""
    cached = await cache.get_game_constants("status_effects")
    if cached:
        return cached

    result = await db.execute(select(StatusEffect))
    effects = result.scalars().all()

    effect_list = [model_to_dict(e) for e in effects]
    await cache.set_game_constants("status_effects", effect_list)

    return effect_list


# =============================================================================
# Items
# =============================================================================

@router.get("/items")
async def get_items(
    db: AsyncSession = Depends(get_db),
    category: Optional[str] = Query(None, description="Filter by category"),
    rarity: Optional[str] = Query(None, description="Filter by rarity"),
):
    """
    Get all item definitions.

    Optionally filter by category (weapon, armor, consumable, etc.)
    or rarity (common, uncommon, rare, legendary).
    """
    cached = await cache.get_game_constants("items")
    if cached:
        items = cached
        if category:
            items = [i for i in items if i.get("category") == category]
        if rarity:
            items = [i for i in items if i.get("rarity") == rarity]
        return items

    result = await db.execute(select(Item))
    items = result.scalars().all()

    item_list = [model_to_dict(i) for i in items]
    await cache.set_game_constants("items", item_list)

    if category:
        item_list = [i for i in item_list if i.get("category") == category]
    if rarity:
        item_list = [i for i in item_list if i.get("rarity") == rarity]

    return item_list


@router.get("/items/{item_id}")
async def get_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific item by ID."""
    cached = await cache.get_game_constants("items")
    if cached:
        for item in cached:
            if item.get("item_id") == item_id:
                return item
        raise HTTPException(status_code=404, detail=f"Item '{item_id}' not found")

    result = await db.execute(select(Item).where(Item.item_id == item_id))
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail=f"Item '{item_id}' not found")

    return model_to_dict(item)


# =============================================================================
# Cache Management
# =============================================================================

@router.get("/cache-status")
async def cache_status():
    """Get cache status for all game constants."""
    return await get_cache_status()


@router.post("/cache/invalidate")
async def invalidate_cache(
    constant_type: Optional[str] = Query(None, description="Specific type to invalidate, or all if not specified"),
):
    """
    Invalidate game constants cache.

    Use after running seed_database.py to refresh cached data.
    """
    if constant_type:
        count = await cache.invalidate_game_constants(constant_type)
        return {"invalidated": count, "type": constant_type}

    result = await invalidate_and_rewarm()
    return result


@router.get("/metadata")
async def get_metadata(db: AsyncSession = Depends(get_db)):
    """Get seed metadata (versions, sync timestamps, record counts)."""
    result = await db.execute(select(GameConstantsMeta))
    metadata = result.scalars().all()

    return [model_to_dict(m) for m in metadata]
