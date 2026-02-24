import os
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    SUPABASE_SUPABASE_KEY: str = ""  # Added for client auth
    UPSTASH_REDIS_URL: str = ""
    UPSTASH_REDIS_TOKEN: str = ""
    OANDA_STREAM_API_KEY: str = ""
    OANDA_STREAM_ACCOUNT_ID: str = ""
    OANDA_STREAM_ENV: str = "practice"

    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/forexelite_pro"
    REDIS_URL: str = "redis://localhost:6379"

    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    CORS_ORIGINS: list[str] = ["http://localhost:3000"]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
