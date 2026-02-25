"""
Configuration management using Pydantic Settings
"""

from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Supabase
    SUPABASE_URL: str = "https://example.supabase.co"
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    SUPABASE_ANON_KEY: str = ""

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # GLM-5 API
    GLM5_API_KEY: str = ""
    GLM5_API_BASE_URL: str = "https://open.bigmodel.cn/api/paas/v4"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # API
    API_V1_PREFIX: str = "/api/v1"

    # Base URL for webhook construction
    BASE_URL: str = "http://localhost:8000"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings singleton."""
    return Settings()
