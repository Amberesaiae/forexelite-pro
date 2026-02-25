# T01 — Backend Foundation & Auth API (Complete)

## Status: ✅ Done

This ticket documents what has already been built and verified in the codebase. No implementation work required.

### What Was Built

**`file:backend/app/` — Core Infrastructure**
- `file:backend/app/main.py` — FastAPI app factory, CORS, `OnboardingGateMiddleware` (428), WebSocket `/ws/prices/{instrument}` registered, Redis pub/sub background task in lifespan
- `file:backend/app/core/config.py` — Pydantic Settings with all env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_ANON_KEY`, `REDIS_URL`, `GLM5_API_KEY`, `GLM5_API_BASE_URL`, `CORS_ORIGINS`, `BASE_URL`
- `file:backend/app/core/auth.py` — `verify_supabase_jwt()`, `get_current_user()`, `get_optional_user()` FastAPI dependencies
- `file:backend/app/core/agent_auth.py` — `verify_agent_key()`, `get_current_agent()` with bcrypt hash verification
- `file:backend/app/core/supabase.py` — Service role singleton client
- `file:backend/app/core/redis.py` — Async Redis singleton with connection pool
- `file:backend/app/core/logging.py` — Structured logging setup

**`file:backend/app/api/routes/auth.py`** — `POST /auth/login`, `POST /auth/signup`, `POST /auth/refresh`, `GET /auth/me`

**`file:backend/app/api/routes/onboarding.py`** — `GET /onboarding/status`, `PUT /onboarding/brokers`, `PUT /onboarding/preferences`

**`file:backend/app/api/routes/agents.py`** — `POST /agents/pair` (bcrypt key generation), `POST /agents/{id}/heartbeat`, `GET /agents/{id}/jobs/next` (RPC), `POST /agents/{id}/jobs/{id}/result`, `POST /agents/{id}/prices`, `GET /agents/{id}/status`

**`file:backend/app/api/routes/strategies.py`** — Full CRUD for `tv_strategies` with per-strategy webhook URL construction

**`file:backend/app/api/routes/webhooks.py`** — `POST /webhooks/tv/{webhook_secret}` (always 200, disabled check, risk gate, signal + job creation)

**`file:backend/app/api/routes/signals.py`** — `GET /signals`, `GET /signals/{id}`

**`file:backend/app/api/routes/deployments.py`** — `GET /deployments`, `POST /deployments`, `POST /deployments/{id}/run`, `POST /deployments/{id}/stop`, `GET /deployments/{id}/logs`

**`file:backend/app/api/routes/ea.py`** — Full EA project/version CRUD, `POST /ea/generate` (GLM-5 + Storage), `POST /ea/versions/{id}/compile`, `GET /ea/versions/{id}/artifacts`, `POST /ea/projects/{id}/duplicate`, `POST /ea/import`

**`file:backend/app/ws/price_stream.py`** — `WebSocketManager` with Redis pub/sub broadcast, last-known price on connect

**`file:backend/requirements.txt`** — All dependencies pinned

### Acceptance Criteria (All Met)
- [x] FastAPI app starts with `uvicorn app.main:app`
- [x] `GET /health` returns `{"status": "healthy"}`
- [x] JWT auth middleware rejects invalid tokens with 401
- [x] Agent auth middleware verifies bcrypt key with 401 on failure
- [x] Onboarding gate returns 428 with `missing` array for protected routes
- [x] WebSocket endpoint registered at `/ws/prices/{instrument}`
- [x] All 9 route modules registered under `/api/v1`