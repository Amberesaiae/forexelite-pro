import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import health, auth, onboarding, trading, agents, ea, candles, deployment
from app.api.routes.onboarding import check_onboarding_complete
from app.core.config import settings
from app.core.logging import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logging.info("Application startup")
    yield
    logging.info("Application shutdown")


def create_app() -> FastAPI:
    app = FastAPI(
        title="ForexElite Pro API",
        description="Backend API for ForexElite Pro trading platform",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include all route modules
    app.include_router(health.router, tags=["health"])
    app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
    app.include_router(onboarding.router, tags=["onboarding"])
    app.include_router(trading.router, tags=["trading"])
    app.include_router(agents.router, tags=["agents"])
    app.include_router(ea.router, tags=["ea"])
    app.include_router(candles.router, tags=["candles"])
    app.include_router(deployment.router, tags=["deployment"])

    # Onboarding gate middleware
    @app.middleware("http")
    async def onboarding_gate_middleware(request: Request, call_next):
        # Paths that require completed onboarding
        protected_paths = ["/api/v1/trading", "/api/v1/ea"]
        
        # Check if path is protected
        is_protected = any(request.url.path.startswith(path) for path in protected_paths)
        
        if is_protected:
            # Get user from Authorization header
            auth_header = request.headers.get("Authorization")
            
            if auth_header and auth_header.startswith("Bearer "):
                from app.core.auth import verify_supabase_jwt
                import jwt
                
                try:
                    token = auth_header[7:]
                    payload = jwt.decode(
                        token,
                        settings.SUPABASE_JWT_SECRET,
                        algorithms=["HS256"],
                        audience="authenticated"
                    )
                    user_id = payload.get("sub")
                    
                    # Check onboarding status
                    if not check_onboarding_complete(user_id):
                        return JSONResponse(
                            status_code=428,
                            content={"detail": "onboarding_required"}
                        )
                        
                except Exception:
                    pass
        
        response = await call_next(request)
        return response

    # WebSocket endpoint
    @app.websocket("/ws/prices/{instrument}")
    async def websocket_prices(websocket, instrument: str):
        from app.ws.price_stream import handle_price_websocket
        await handle_price_websocket(websocket, instrument)

    return app


app = create_app()
