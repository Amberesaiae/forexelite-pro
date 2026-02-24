"""API routes package."""

from app.api.routes import health, auth, onboarding, trading, agents, ea, candles, deployment

__all__ = ["health", "auth", "onboarding", "trading", "agents", "ea", "candles", "deployment"]