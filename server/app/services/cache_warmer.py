"""
Cache Warming Service

Loads game constants from PostgreSQL into Redis cache on server startup.
This ensures the cache is pre-populated for fast API responses.

Usage:
    from app.services.cache_warmer import warm_game_constants_cache

    # In main.py startup event:
    @app.on_event("startup")
    async def startup():
        await warm_game_constants_cache()
"""
import logging
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.cache import cache, CacheKeys
from ..core.database import async_session_maker
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

logger = logging.getLogger(__name__)


def model_to_dict(obj) -> dict:
    """Convert SQLAlchemy model to dictionary."""
    result = {}
    for column in obj.__table__.columns:
        value = getattr(obj, column.name)
        # Skip internal fields
        if column.name in ("id", "created_at"):
            continue
        result[column.name] = value
    return result


async def warm_enemies_cache(session: AsyncSession) -> int:
    """Load all enemies into cache."""
    result = await session.execute(select(Enemy))
    enemies = result.scalars().all()

    if not enemies:
        logger.warning("No enemies found in database - cache not warmed")
        return 0

    enemy_list = [model_to_dict(e) for e in enemies]
    await cache.set_game_constants("enemies", enemy_list)

    logger.info(f"Cached {len(enemy_list)} enemies")
    return len(enemy_list)


async def warm_floor_pools_cache(session: AsyncSession) -> int:
    """Load floor enemy pools into cache."""
    result = await session.execute(select(FloorEnemyPool))
    pools = result.scalars().all()

    if not pools:
        logger.warning("No floor pools found in database - cache not warmed")
        return 0

    # Group by floor
    floor_data = {}
    for pool in pools:
        if pool.floor not in floor_data:
            floor_data[pool.floor] = []
        floor_data[pool.floor].append({
            "enemy_id": pool.enemy_id,
            "weight": pool.weight,
            "theme": pool.theme,
            "lore_aspect": pool.lore_aspect,
        })

    # Cache each floor's pool
    for floor, enemies in floor_data.items():
        await cache.set_floor_pool(floor, enemies)

    # Also cache the full list
    all_pools = [model_to_dict(p) for p in pools]
    await cache.set_game_constants("floor_pools", all_pools)

    logger.info(f"Cached floor pools for {len(floor_data)} floors ({len(pools)} entries)")
    return len(pools)


async def warm_bosses_cache(session: AsyncSession) -> int:
    """Load all bosses into cache."""
    result = await session.execute(select(Boss))
    bosses = result.scalars().all()

    if not bosses:
        return 0

    boss_list = [model_to_dict(b) for b in bosses]
    await cache.set_game_constants("bosses", boss_list)

    logger.info(f"Cached {len(boss_list)} bosses")
    return len(boss_list)


async def warm_races_cache(session: AsyncSession) -> int:
    """Load all races into cache."""
    result = await session.execute(select(Race))
    races = result.scalars().all()

    if not races:
        return 0

    race_list = [model_to_dict(r) for r in races]
    await cache.set_game_constants("races", race_list)

    logger.info(f"Cached {len(race_list)} races")
    return len(race_list)


async def warm_classes_cache(session: AsyncSession) -> int:
    """Load all classes into cache."""
    result = await session.execute(select(PlayerClass))
    classes = result.scalars().all()

    if not classes:
        return 0

    class_list = [model_to_dict(c) for c in classes]
    await cache.set_game_constants("classes", class_list)

    logger.info(f"Cached {len(class_list)} classes")
    return len(class_list)


async def warm_themes_cache(session: AsyncSession) -> int:
    """Load all themes into cache."""
    result = await session.execute(select(Theme))
    themes = result.scalars().all()

    if not themes:
        return 0

    theme_list = [model_to_dict(t) for t in themes]
    await cache.set_game_constants("themes", theme_list)

    logger.info(f"Cached {len(theme_list)} themes")
    return len(theme_list)


async def warm_traps_cache(session: AsyncSession) -> int:
    """Load all traps into cache."""
    result = await session.execute(select(Trap))
    traps = result.scalars().all()

    if not traps:
        return 0

    trap_list = [model_to_dict(t) for t in traps]
    await cache.set_game_constants("traps", trap_list)

    logger.info(f"Cached {len(trap_list)} traps")
    return len(trap_list)


async def warm_hazards_cache(session: AsyncSession) -> int:
    """Load all hazards into cache."""
    result = await session.execute(select(Hazard))
    hazards = result.scalars().all()

    if not hazards:
        return 0

    hazard_list = [model_to_dict(h) for h in hazards]
    await cache.set_game_constants("hazards", hazard_list)

    logger.info(f"Cached {len(hazard_list)} hazards")
    return len(hazard_list)


async def warm_status_effects_cache(session: AsyncSession) -> int:
    """Load all status effects into cache."""
    result = await session.execute(select(StatusEffect))
    effects = result.scalars().all()

    if not effects:
        return 0

    effect_list = [model_to_dict(e) for e in effects]
    await cache.set_game_constants("status_effects", effect_list)

    logger.info(f"Cached {len(effect_list)} status effects")
    return len(effect_list)


async def warm_items_cache(session: AsyncSession) -> int:
    """Load all items into cache."""
    result = await session.execute(select(Item))
    items = result.scalars().all()

    if not items:
        return 0

    item_list = [model_to_dict(i) for i in items]
    await cache.set_game_constants("items", item_list)

    logger.info(f"Cached {len(item_list)} items")
    return len(item_list)


async def warm_game_constants_cache(skip_if_populated: bool = True) -> dict:
    """
    Load all game constants from database into Redis cache.

    Args:
        skip_if_populated: If True, skip warming if cache already has data

    Returns:
        Dictionary with counts of cached records per type
    """
    logger.info("Starting game constants cache warming...")

    # Check if already populated
    if skip_if_populated:
        existing = await cache.get_game_constants("enemies")
        if existing:
            logger.info("Cache already populated - skipping warm-up")
            return {"status": "skipped", "reason": "already_populated"}

    results = {
        "status": "completed",
        "enemies": 0,
        "floor_pools": 0,
        "bosses": 0,
        "races": 0,
        "classes": 0,
        "themes": 0,
        "traps": 0,
        "hazards": 0,
        "status_effects": 0,
        "items": 0,
    }

    async with async_session_maker() as session:
        try:
            results["enemies"] = await warm_enemies_cache(session)
            results["floor_pools"] = await warm_floor_pools_cache(session)
            results["bosses"] = await warm_bosses_cache(session)
            results["races"] = await warm_races_cache(session)
            results["classes"] = await warm_classes_cache(session)
            results["themes"] = await warm_themes_cache(session)
            results["traps"] = await warm_traps_cache(session)
            results["hazards"] = await warm_hazards_cache(session)
            results["status_effects"] = await warm_status_effects_cache(session)
            results["items"] = await warm_items_cache(session)

            total = sum(v for k, v in results.items() if isinstance(v, int))
            logger.info(f"Cache warming complete: {total} total records cached")

        except Exception as e:
            logger.error(f"Cache warming failed: {e}")
            results["status"] = "failed"
            results["error"] = str(e)

    return results


async def invalidate_and_rewarm() -> dict:
    """
    Invalidate all game constants cache and reload from database.

    Use this after running seed_database.py or modifying game data.
    """
    logger.info("Invalidating game constants cache...")

    # Clear all game constants
    await cache.invalidate_game_constants()

    # Re-warm the cache
    return await warm_game_constants_cache(skip_if_populated=False)


async def get_cache_status() -> dict:
    """
    Get current cache status for all game constants.

    Returns dict with each constant type and whether it's cached.
    """
    status = {}

    constant_types = [
        "enemies", "floor_pools", "bosses", "races", "classes",
        "themes", "traps", "hazards", "status_effects", "items"
    ]

    for const_type in constant_types:
        data = await cache.get_game_constants(const_type)
        status[const_type] = {
            "cached": data is not None,
            "count": len(data) if data else 0,
        }

    # Get Redis health
    health = await cache.health_check()
    status["redis"] = health

    return status
