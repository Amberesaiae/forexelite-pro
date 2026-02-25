"""
ForexElite Pro - Backend Application
Main FastAPI application factory
"""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.core.config import get_settings
from app.core.logging import setup_logging
from app.core.auth import verify_supabase_jwt
from app.ws.price_stream import ws_manager, handle_price_websocket


# Onboarding gate middleware
ONBOARDING_PROTECTED_PREFIXES = (
    "/api/v1/trading/",
    "/api/v1/ea/",
    "/api/v1/deployments/",
    "/api/v1/strategies/",
    "/api/v1/signals/",
)


class OnboardingGateMiddleware(BaseHTTPMiddleware):
    """Middleware to enforce onboarding completion for protected endpoints."""

    async def dispatch(self, request, call_next):
        # Skip non-protected paths
        path = request.url.path
        if not path.startswith(ONBOARDING_PROTECTED_PREFIXES):
            return await call_next(request)

        # Extract Bearer token
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            # Let route-level auth handle it
            return await call_next(request)

        token = auth_header[7:]  # Remove "Bearer " prefix

        try:
            from app.core.supabase import get_supabase_client
            from app.core.auth import verify_supabase_jwt

            payload = verify_supabase_jwt(token)
            user_id = payload.sub
            if not user_id:
                return await call_next(request)

            supabase = get_supabase_client()

            # Check disclaimer acceptance and risk settings
            settings_response = (
                supabase.table("user_settings")
                .select("disclaimer_accepted", "risk_percent")
                .eq("user_id", user_id)
                .execute()
            )

            disclaimer_accepted = False
            has_preferences = False
            if settings_response.data:
                disclaimer_accepted = settings_response.data[0].get(
                    "disclaimer_accepted", False
                )
                has_preferences = (
                    settings_response.data[0].get("risk_percent") is not None
                )

            # Count broker connections
            brokers_response = (
                supabase.table("broker_connections")
                .select("id")
                .eq("user_id", user_id)
                .execute()
            )

            broker_count = len(brokers_response.data) if brokers_response.data else 0

            # Collect missing requirements
            missing = []
            if not disclaimer_accepted:
                missing.append("disclaimer")
            if not has_preferences:
                missing.append("preferences")
            if broker_count == 0:
                missing.append("broker")

            if missing:
                return JSONResponse(
                    status_code=428,
                    content={"detail": "onboarding_required", "missing": missing},
                )

        except Exception:
            # Fall through on any error (invalid JWT, DB error, etc.)
            pass

        return await call_next(request)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown tasks."""
    setup_logging()
    settings = get_settings()

    # Start Redis subscriber for price streaming
    task = asyncio.create_task(ws_manager.start_redis_subscriber())

    yield

    # Cancel Redis subscriber on shutdown
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="ForexElite Pro API",
        description="Institutional Trading Intelligence Platform",
        version="1.0.0",
        lifespan=lifespan,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Onboarding gate middleware
    app.add_middleware(OnboardingGateMiddleware)

    # Health check endpoint
    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "version": "1.0.0"}

    # Import and include routes
    from app.api.routes import (
        auth,
        onboarding,
        agents,
        ea,
        trading,
        webhooks,
        strategies,
        signals,
        deployments,
    )

    api_v1_router = APIRouter(prefix="/api/v1")

    api_v1_router.include_router(auth.router, prefix="/auth", tags=["auth"])
    api_v1_router.include_router(
        onboarding.router, prefix="/onboarding", tags=["onboarding"]
    )
    api_v1_router.include_router(agents.router, prefix="/agents", tags=["agents"])
    api_v1_router.include_router(ea.router, prefix="/ea", tags=["ea"])
    api_v1_router.include_router(trading.router, prefix="/trading", tags=["trading"])
    api_v1_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
    api_v1_router.include_router(
        strategies.router, prefix="/strategies", tags=["strategies"]
    )
    api_v1_router.include_router(signals.router, prefix="/signals", tags=["signals"])
    api_v1_router.include_router(
        deployments.router, prefix="/deployments", tags=["deployments"]
    )

    app.include_router(api_v1_router)

    # WebSocket endpoint for price streaming
    @app.websocket("/ws/prices/{instrument}")
    async def websocket_prices(websocket: WebSocket, instrument: str, token: str = ""):
        await handle_price_websocket(websocket, instrument, token)

    return app


app = create_app()
