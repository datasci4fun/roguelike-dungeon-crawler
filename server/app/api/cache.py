"""
Cache Inspector API - Dev tool for browsing Redis cache.

SECURITY: Only available when DEBUG=true.
"""
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from ..core.config import settings
from ..core.redis import get_redis

router = APIRouter(prefix="/api/cache", tags=["cache-inspector"])


# Pydantic models
class KeyInfo(BaseModel):
    key: str
    type: str
    ttl: int  # -1 = no expiry, -2 = key doesn't exist
    memory_bytes: int | None = None


class KeyValue(BaseModel):
    key: str
    type: str
    ttl: int
    value: Any


class CacheStats(BaseModel):
    total_keys: int
    memory_used: str
    memory_peak: str
    connected_clients: int
    uptime_seconds: int
    redis_version: str


class DeleteResult(BaseModel):
    deleted: int
    keys: list[str]


def require_debug():
    """Dependency that blocks access unless DEBUG mode is enabled."""
    if not settings.debug:
        raise HTTPException(
            status_code=403,
            detail="Cache inspector is only available in debug mode"
        )


@router.get("/stats", response_model=CacheStats)
async def get_cache_stats(
    _: None = Depends(require_debug),
):
    """Get Redis server statistics."""
    client = await get_redis()
    info = await client.info()

    return CacheStats(
        total_keys=info.get("db0", {}).get("keys", 0) if isinstance(info.get("db0"), dict) else await client.dbsize(),
        memory_used=info.get("used_memory_human", "0B"),
        memory_peak=info.get("used_memory_peak_human", "0B"),
        connected_clients=info.get("connected_clients", 0),
        uptime_seconds=info.get("uptime_in_seconds", 0),
        redis_version=info.get("redis_version", "unknown"),
    )


@router.get("/keys", response_model=list[KeyInfo])
async def list_keys(
    pattern: str = Query("*", description="Key pattern (glob-style)"),
    limit: int = Query(100, ge=1, le=1000),
    _: None = Depends(require_debug),
):
    """List keys matching a pattern."""
    client = await get_redis()

    # Use SCAN for safety (non-blocking)
    keys = []
    cursor = 0
    while len(keys) < limit:
        cursor, batch = await client.scan(cursor, match=pattern, count=100)
        keys.extend(batch)
        if cursor == 0:
            break

    # Limit results
    keys = keys[:limit]

    # Get info for each key
    result = []
    pipe = client.pipeline()
    for key in keys:
        pipe.type(key)
        pipe.ttl(key)

    responses = await pipe.execute()

    for i, key in enumerate(keys):
        key_type = responses[i * 2]
        ttl = responses[i * 2 + 1]

        result.append(KeyInfo(
            key=key,
            type=key_type,
            ttl=ttl,
            memory_bytes=None,  # Memory per key requires DEBUG OBJECT
        ))

    return result


@router.get("/keys/{key:path}", response_model=KeyValue)
async def get_key_value(
    key: str,
    _: None = Depends(require_debug),
):
    """Get value for a specific key."""
    client = await get_redis()

    # Check if key exists
    key_type = await client.type(key)
    if key_type == "none":
        raise HTTPException(status_code=404, detail=f"Key '{key}' not found")

    ttl = await client.ttl(key)

    # Get value based on type
    value: Any = None
    if key_type == "string":
        value = await client.get(key)
    elif key_type == "list":
        value = await client.lrange(key, 0, 99)  # First 100 elements
    elif key_type == "set":
        value = list(await client.smembers(key))[:100]  # First 100 members
    elif key_type == "zset":
        value = await client.zrange(key, 0, 99, withscores=True)
    elif key_type == "hash":
        value = await client.hgetall(key)
    elif key_type == "stream":
        value = await client.xrange(key, count=100)
    else:
        value = f"<unsupported type: {key_type}>"

    return KeyValue(
        key=key,
        type=key_type,
        ttl=ttl,
        value=value,
    )


@router.delete("/keys/{key:path}")
async def delete_key(
    key: str,
    _: None = Depends(require_debug),
):
    """Delete a specific key."""
    client = await get_redis()

    deleted = await client.delete(key)

    if deleted == 0:
        raise HTTPException(status_code=404, detail=f"Key '{key}' not found")

    return {"deleted": True, "key": key}


@router.post("/keys/delete-pattern", response_model=DeleteResult)
async def delete_by_pattern(
    pattern: str = Query(..., description="Key pattern to delete (glob-style)"),
    dry_run: bool = Query(True, description="If true, only return keys that would be deleted"),
    _: None = Depends(require_debug),
):
    """Delete keys matching a pattern."""
    client = await get_redis()

    # Safety: require pattern to have at least one character before wildcard
    if pattern == "*" or pattern == "**":
        raise HTTPException(
            status_code=400,
            detail="Cannot delete all keys. Use a more specific pattern."
        )

    # Find matching keys
    keys = []
    cursor = 0
    while True:
        cursor, batch = await client.scan(cursor, match=pattern, count=100)
        keys.extend(batch)
        if cursor == 0:
            break
        if len(keys) >= 1000:  # Safety limit
            break

    if dry_run:
        return DeleteResult(deleted=0, keys=keys)

    # Actually delete
    if keys:
        deleted = await client.delete(*keys)
    else:
        deleted = 0

    return DeleteResult(deleted=deleted, keys=keys)


@router.post("/flush-db")
async def flush_database(
    confirm: bool = Query(False, description="Must be true to confirm flush"),
    _: None = Depends(require_debug),
):
    """Flush the entire Redis database. Requires confirmation."""
    if not confirm:
        raise HTTPException(
            status_code=400,
            detail="Must set confirm=true to flush database"
        )

    client = await get_redis()
    await client.flushdb()

    return {"flushed": True, "message": "Database flushed"}
