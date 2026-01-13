"""
Redis Cache Service

Provides caching layer for game constants and user data following
the cache-aside pattern outlined in DATA_PERSISTENCE_MODEL.md.

Cache Tiers:
- WARM CACHE (24h TTL): Game constants (enemies, bosses, items, etc.)
- HOT CACHE (1h TTL): User sessions, profiles, active games
- COMPUTED CACHE (5min TTL): Aggregated stats, leaderboards

Key Patterns:
- game:{type}              - All records of a type (hash)
- game:{type}:{id}         - Single record
- game:version             - Current seed version
- user:{id}:{type}         - User-specific data
- session:{token}          - Active session
- leaderboard:{scope}      - Leaderboard data
- stats:{type}             - Computed statistics
"""
import json
import logging
from datetime import timedelta
from enum import Enum
from functools import wraps
from typing import Any, Callable, Optional, TypeVar, Union

from .redis import get_redis

logger = logging.getLogger(__name__)

# Type variable for generic cache operations
T = TypeVar("T")


class CacheTTL(Enum):
    """Cache TTL tiers in seconds."""
    WARM = 60 * 60 * 24      # 24 hours - game constants
    HOT = 60 * 60            # 1 hour - user data
    COMPUTED = 60 * 5        # 5 minutes - aggregated stats
    SESSION = 60 * 60 * 24 * 7  # 7 days - sessions
    NONE = 0                 # No expiration


class CacheKeys:
    """Cache key pattern builders."""

    # Game constants
    GAME_PREFIX = "game"
    GAME_ENEMIES = f"{GAME_PREFIX}:enemies"
    GAME_BOSSES = f"{GAME_PREFIX}:bosses"
    GAME_RACES = f"{GAME_PREFIX}:races"
    GAME_CLASSES = f"{GAME_PREFIX}:classes"
    GAME_THEMES = f"{GAME_PREFIX}:themes"
    GAME_ITEMS = f"{GAME_PREFIX}:items"
    GAME_TRAPS = f"{GAME_PREFIX}:traps"
    GAME_HAZARDS = f"{GAME_PREFIX}:hazards"
    GAME_STATUS_EFFECTS = f"{GAME_PREFIX}:status_effects"
    GAME_FLOOR_POOLS = f"{GAME_PREFIX}:floor_pools"
    GAME_VERSION = f"{GAME_PREFIX}:version"

    # User data
    USER_PREFIX = "user"

    # Sessions
    SESSION_PREFIX = "session"

    # Leaderboards
    LEADERBOARD_PREFIX = "leaderboard"
    LEADERBOARD_GLOBAL = f"{LEADERBOARD_PREFIX}:global"
    LEADERBOARD_DAILY = f"{LEADERBOARD_PREFIX}:daily"

    # Stats
    STATS_PREFIX = "stats"
    STATS_CODEBASE = f"{STATS_PREFIX}:codebase"
    STATS_ACTIVE_USERS = f"{STATS_PREFIX}:active_users"

    @classmethod
    def game_item(cls, item_type: str, item_id: str) -> str:
        """Build key for a single game item."""
        return f"{cls.GAME_PREFIX}:{item_type}:{item_id}"

    @classmethod
    def user_data(cls, user_id: int, data_type: str) -> str:
        """Build key for user-specific data."""
        return f"{cls.USER_PREFIX}:{user_id}:{data_type}"

    @classmethod
    def session(cls, token: str) -> str:
        """Build key for a session."""
        return f"{cls.SESSION_PREFIX}:{token}"

    @classmethod
    def leaderboard_daily(cls, date: str) -> str:
        """Build key for daily leaderboard."""
        return f"{cls.LEADERBOARD_DAILY}:{date}"

    @classmethod
    def floor_pool(cls, floor: int) -> str:
        """Build key for floor enemy pool."""
        return f"{cls.GAME_FLOOR_POOLS}:{floor}"


class CacheService:
    """
    Redis cache service with cache-aside pattern support.

    Usage:
        cache = CacheService()

        # Simple get/set
        await cache.set("key", {"data": "value"}, ttl=CacheTTL.WARM)
        data = await cache.get("key")

        # Cache-aside pattern
        data = await cache.get_or_set(
            "game:enemies",
            fetch_func=lambda: db.query(Enemy).all(),
            ttl=CacheTTL.WARM
        )

        # Bulk operations for game constants
        await cache.set_game_constants("enemies", enemy_list)
        enemies = await cache.get_game_constants("enemies")
    """

    async def get(self, key: str) -> Optional[Any]:
        """
        Get a value from cache.

        Returns None if key doesn't exist or on error.
        """
        try:
            redis = await get_redis()
            value = await redis.get(key)
            if value is None:
                return None
            return json.loads(value)
        except Exception as e:
            logger.warning(f"Cache get error for {key}: {e}")
            return None

    async def set(
        self,
        key: str,
        value: Any,
        ttl: Union[CacheTTL, int, None] = CacheTTL.WARM
    ) -> bool:
        """
        Set a value in cache with optional TTL.

        Args:
            key: Cache key
            value: Value to cache (will be JSON serialized)
            ttl: TTL enum, seconds as int, or None for no expiration

        Returns:
            True if successful, False on error
        """
        try:
            redis = await get_redis()
            serialized = json.dumps(value, default=str)

            if ttl is None or (isinstance(ttl, CacheTTL) and ttl == CacheTTL.NONE):
                await redis.set(key, serialized)
            else:
                seconds = ttl.value if isinstance(ttl, CacheTTL) else ttl
                await redis.setex(key, seconds, serialized)

            return True
        except Exception as e:
            logger.warning(f"Cache set error for {key}: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Delete a key from cache."""
        try:
            redis = await get_redis()
            await redis.delete(key)
            return True
        except Exception as e:
            logger.warning(f"Cache delete error for {key}: {e}")
            return False

    async def delete_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching a pattern.

        Args:
            pattern: Redis key pattern (e.g., "game:*")

        Returns:
            Number of keys deleted
        """
        try:
            redis = await get_redis()
            keys = []
            async for key in redis.scan_iter(match=pattern):
                keys.append(key)

            if keys:
                await redis.delete(*keys)

            return len(keys)
        except Exception as e:
            logger.warning(f"Cache delete_pattern error for {pattern}: {e}")
            return 0

    async def exists(self, key: str) -> bool:
        """Check if a key exists in cache."""
        try:
            redis = await get_redis()
            return await redis.exists(key) > 0
        except Exception as e:
            logger.warning(f"Cache exists error for {key}: {e}")
            return False

    async def get_or_set(
        self,
        key: str,
        fetch_func: Callable[[], T],
        ttl: Union[CacheTTL, int] = CacheTTL.WARM
    ) -> Optional[T]:
        """
        Cache-aside pattern: get from cache or fetch and cache.

        Args:
            key: Cache key
            fetch_func: Async or sync function to fetch data on cache miss
            ttl: TTL for cached data

        Returns:
            Cached or freshly fetched data
        """
        # Try cache first
        cached = await self.get(key)
        if cached is not None:
            logger.debug(f"Cache HIT: {key}")
            return cached

        # Cache miss - fetch from source
        logger.debug(f"Cache MISS: {key}")
        try:
            # Handle both async and sync fetch functions
            import asyncio
            if asyncio.iscoroutinefunction(fetch_func):
                data = await fetch_func()
            else:
                data = fetch_func()

            # Cache the result
            if data is not None:
                await self.set(key, data, ttl)

            return data
        except Exception as e:
            logger.error(f"Cache fetch error for {key}: {e}")
            return None

    # =========================================================================
    # Game Constants Methods
    # =========================================================================

    async def set_game_constants(
        self,
        constant_type: str,
        data: list[dict],
        version: str = "1.0.0"
    ) -> bool:
        """
        Cache game constants as a list.

        Args:
            constant_type: Type of constant (enemies, bosses, items, etc.)
            data: List of records to cache
            version: Version string for invalidation tracking
        """
        key = f"{CacheKeys.GAME_PREFIX}:{constant_type}"
        success = await self.set(key, data, CacheTTL.WARM)

        # Also store version for invalidation checks
        if success:
            await self.set(
                f"{key}:version",
                {"version": version, "count": len(data)},
                CacheTTL.WARM
            )

        return success

    async def get_game_constants(self, constant_type: str) -> Optional[list[dict]]:
        """Get cached game constants."""
        key = f"{CacheKeys.GAME_PREFIX}:{constant_type}"
        return await self.get(key)

    async def invalidate_game_constants(self, constant_type: Optional[str] = None) -> int:
        """
        Invalidate game constants cache.

        Args:
            constant_type: Specific type to invalidate, or None for all

        Returns:
            Number of keys invalidated
        """
        if constant_type:
            pattern = f"{CacheKeys.GAME_PREFIX}:{constant_type}*"
        else:
            pattern = f"{CacheKeys.GAME_PREFIX}:*"

        count = await self.delete_pattern(pattern)
        logger.info(f"Invalidated {count} game constant cache keys")
        return count

    async def set_floor_pool(self, floor: int, enemies: list[dict]) -> bool:
        """Cache enemy pool for a specific floor."""
        key = CacheKeys.floor_pool(floor)
        return await self.set(key, enemies, CacheTTL.WARM)

    async def get_floor_pool(self, floor: int) -> Optional[list[dict]]:
        """Get cached enemy pool for a floor."""
        key = CacheKeys.floor_pool(floor)
        return await self.get(key)

    # =========================================================================
    # User Data Methods
    # =========================================================================

    async def set_user_data(
        self,
        user_id: int,
        data_type: str,
        data: Any
    ) -> bool:
        """Cache user-specific data."""
        key = CacheKeys.user_data(user_id, data_type)
        return await self.set(key, data, CacheTTL.HOT)

    async def get_user_data(self, user_id: int, data_type: str) -> Optional[Any]:
        """Get cached user data."""
        key = CacheKeys.user_data(user_id, data_type)
        return await self.get(key)

    async def invalidate_user_data(self, user_id: int, data_type: Optional[str] = None) -> int:
        """Invalidate user cache."""
        if data_type:
            await self.delete(CacheKeys.user_data(user_id, data_type))
            return 1
        else:
            pattern = f"{CacheKeys.USER_PREFIX}:{user_id}:*"
            return await self.delete_pattern(pattern)

    # =========================================================================
    # Session Methods
    # =========================================================================

    async def set_session(self, token: str, data: dict) -> bool:
        """Cache session data."""
        key = CacheKeys.session(token)
        return await self.set(key, data, CacheTTL.SESSION)

    async def get_session(self, token: str) -> Optional[dict]:
        """Get cached session."""
        key = CacheKeys.session(token)
        return await self.get(key)

    async def delete_session(self, token: str) -> bool:
        """Delete session from cache."""
        key = CacheKeys.session(token)
        return await self.delete(key)

    # =========================================================================
    # Stats/Leaderboard Methods
    # =========================================================================

    async def set_leaderboard(self, scope: str, data: list[dict]) -> bool:
        """Cache leaderboard data."""
        key = f"{CacheKeys.LEADERBOARD_PREFIX}:{scope}"
        return await self.set(key, data, CacheTTL.COMPUTED)

    async def get_leaderboard(self, scope: str) -> Optional[list[dict]]:
        """Get cached leaderboard."""
        key = f"{CacheKeys.LEADERBOARD_PREFIX}:{scope}"
        return await self.get(key)

    async def set_stats(self, stat_type: str, data: Any) -> bool:
        """Cache computed statistics."""
        key = f"{CacheKeys.STATS_PREFIX}:{stat_type}"
        return await self.set(key, data, CacheTTL.COMPUTED)

    async def get_stats(self, stat_type: str) -> Optional[Any]:
        """Get cached statistics."""
        key = f"{CacheKeys.STATS_PREFIX}:{stat_type}"
        return await self.get(key)

    # =========================================================================
    # Utility Methods
    # =========================================================================

    async def health_check(self) -> dict:
        """Check Redis connectivity and return status."""
        try:
            redis = await get_redis()
            await redis.ping()
            info = await redis.info("memory")
            return {
                "status": "healthy",
                "used_memory": info.get("used_memory_human", "unknown"),
                "connected_clients": info.get("connected_clients", 0),
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
            }

    async def flush_all(self) -> bool:
        """
        Flush all cache data. USE WITH CAUTION.

        Only use during development or after major data changes.
        """
        try:
            redis = await get_redis()
            await redis.flushdb()
            logger.warning("Cache flushed - all data cleared")
            return True
        except Exception as e:
            logger.error(f"Cache flush error: {e}")
            return False


# Global cache service instance
cache = CacheService()


# =========================================================================
# Decorator for endpoint caching
# =========================================================================

def cached(
    key_builder: Callable[..., str],
    ttl: Union[CacheTTL, int] = CacheTTL.WARM
):
    """
    Decorator for caching endpoint responses.

    Usage:
        @cached(lambda: CacheKeys.GAME_ENEMIES, ttl=CacheTTL.WARM)
        async def get_enemies():
            return await db.query(Enemy).all()

        @cached(lambda floor: CacheKeys.floor_pool(floor), ttl=CacheTTL.WARM)
        async def get_floor_enemies(floor: int):
            return await db.query(FloorPool).filter_by(floor=floor).all()
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            # Build cache key from arguments
            cache_key = key_builder(*args, **kwargs)

            # Try cache first
            cached_data = await cache.get(cache_key)
            if cached_data is not None:
                return cached_data

            # Execute function and cache result
            result = await func(*args, **kwargs)
            if result is not None:
                await cache.set(cache_key, result, ttl)

            return result
        return wrapper
    return decorator
