"""
Redis Client
Async Redis connection management
"""
from typing import Optional
import redis.asyncio as redis
from app.core.config import get_settings


_redis_client: Optional[redis.Redis] = None


async def get_redis() -> redis.Redis:
    """
    Get async Redis client.
    Creates connection pool if not already created.
    """
    global _redis_client
    
    if _redis_client is None:
        settings = get_settings()
        _redis_client = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=20,
        )
    
    return _redis_client


async def close_redis():
    """Close Redis connection."""
    global _redis_client
    
    if _redis_client:
        await _redis_client.close()
        _redis_client = None
