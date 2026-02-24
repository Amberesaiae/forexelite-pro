# BK1 — Backend Foundation: FastAPI, Config, Auth Middleware, Supabase & Redis

## What

Bootstrap the entire FastAPI backend from scratch. This is the root ticket — nothing else can start until this is done.

## Scope

**Project structure**
- Create `file:backend/app/` with subdirectories: `api/routes/`, `core/`, `services/`, `models/`, `ws/`
- `file:backend/app/main.py` — FastAPI app factory, CORS middleware (allow origins from settings), lifespan handler, `GET /health` → `{"status": "healthy", "version": "1.0.0"}`
- `file:backend/Dockerfile` — Python 3.11-slim, uvicorn entrypoint
- `file:backend/.env.example` — all required env vars documented with descriptions

**Configuration (`app/core/config.py`)**
- Pydantic `BaseSettings` with `SettingsConfigDict(env_file=".env")`
- Required vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_ANON_KEY`, `REDIS_URL`, `GLM5_API_KEY`, `GLM5_API_BASE_URL`, `CORS_ORIGINS` (list), `ENVIRONMENT`, `DEBUG`
- `@lru_cache` singleton `get_settings()`

**JWT auth middleware (`app/core/auth.py`)**
- `verify_supabase_jwt(token: str) → TokenPayload` — decode using `SUPABASE_JWT_SECRET`, HS256, audience `"authenticated"`
- `get_current_user` FastAPI dependency (HTTPBearer) → returns `AuthenticatedUser(id, email)`
- `get_optional_user` — returns `None` if no valid token (used for public endpoints)
- Raises `401` on expired/invalid token

**X-Agent-Key auth (`app/core/agent_auth.py`)**
- `verify_agent_key(agent_id, key, db_client) → AgentRecord` — look up `mt5_agents` by `agent_id`, bcrypt verify `key` against `pairing_key_hash`
- `get_current_agent` FastAPI dependency (reads `X-Agent-Key` header)
- Raises `401` on invalid key, `404` if agent not found

**Supabase client (`app/core/supabase.py`)**
- `get_supabase_client()` — service role client (for backend operations)
- `get_supabase_anon_client()` — anon key client (for auth proxying)

**Redis client (`app/core/redis.py`)**
- Async Redis client using `redis.asyncio`
- `get_redis()` dependency — returns connected client
- Connection pool with max 20 connections

**Logging (`app/core/logging.py`)**
- Structured JSON logging in production, pretty in development
- Log level from `settings.DEBUG`

## Acceptance Criteria
- `uvicorn app.main:app --reload` starts without errors from `file:backend/`
- `GET /health` returns `{"status": "healthy"}` with 200
- `get_current_user` dependency raises 401 for missing/invalid/expired JWT
- `get_current_agent` dependency raises 401 for wrong `X-Agent-Key`
- Redis client connects successfully (or fails gracefully with logged error)
- All env vars documented in `.env.example`

## Spec References
- `spec:8faa0447-2e35-4cc5-9096-0cbce32ae00a/ff9b5702-f7bb-4863-b80f-475ca098bc44` — Tech Plan §1 (Auth decisions), §3 (Auth Middleware)
- `spec:8faa0447-2e35-4cc5-9096-0cbce32ae00a/ccad2713-2703-4e25-8dfe-6d522f7d65ca` — Schema Migration v2 (pairing_key_hash field)

## Archive Reference
`file:_archive/backup_20260223/backend/app/core/` — reference for config/auth patterns. **Do not copy OANDA references.**

## Dependencies
None — root ticket.