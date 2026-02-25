# T02 — Backend Bug Fixes (10 Critical Issues)

## Overview

10 bugs identified in the deep analysis that cause silent failures, wrong data, or security gaps. All must be fixed before any frontend wiring or MT5 agent testing.

---

## Bug 1 — `"now()"` String Literals in `agents.py`

**File:** `file:backend/app/api/routes/agents.py`

**Problem:** Three places pass the string `"now()"` as a timestamp value to Supabase. PostgreSQL does not accept this from the Python client — it stores the literal string, not the current timestamp.

**Affected endpoints:** `POST /agents/{id}/heartbeat` (`last_heartbeat`), `POST /agents/{id}/jobs/{id}/result` (`completed_at`, `resolved_at`), `POST /agents/{id}/prices` (`ts` field in price data)

**Fix:** Replace all `"now()"` with `datetime.now(timezone.utc).isoformat()`. Add `from datetime import datetime, timezone` at the top of the file.

---

## Bug 2 — Timezone-Naive `datetime.now()` Comparisons

**Files:** `file:backend/app/api/routes/agents.py` (agent status), `file:backend/app/api/routes/trading.py` (heartbeat check in `place_order`)

**Problem:** `datetime.now()` returns a naive datetime. Supabase timestamps are timezone-aware (UTC). Subtracting a naive from an aware datetime raises `TypeError: can't subtract offset-naive and offset-aware datetimes` — agent status always shows "offline" or crashes.

**Fix:** Replace `datetime.now()` with `datetime.now(timezone.utc)` in all comparison logic.

---

## Bug 3 — WebSocket Subscriber Silent Death

**File:** `file:backend/app/ws/price_stream.py`

**Problem:** `start_redis_subscriber()` has `except Exception: pass` — if Redis drops, the subscriber exits silently. No prices are ever streamed again until the server restarts.

**Fix:** Wrap the subscriber loop in a `while True` with exponential backoff retry (1s, 2s, 4s, max 30s). Log the error on each retry attempt.

---

## Bug 4 — Deployments EA Name Query (Wrong Table)

**File:** `file:backend/app/api/routes/deployments.py`

**Problem:** `list_deployments` queries `ea_versions(name, version_number)` — but `ea_versions` has no `name` field. The `name` field is on `ea_projects`. All deployment EA names return "Unknown".

**Fix:** Change the select to join through `ea_versions(version_number, ea_projects(name))` and update the response mapping accordingly.

---

## Bug 5 — Webhook Risk Gate Logic Error

**File:** `file:backend/app/api/routes/webhooks.py`

**Problem:** `abs(total_pnl) >= daily_loss_limit_pct` compares a **dollar P&L value** (e.g. `-$150`) against a **percentage** (e.g. `5.0`). The comparison is dimensionally wrong — the risk gate never triggers correctly.

**Fix:** The risk gate needs the user's account balance to compute the percentage. Either: (a) fetch account balance from `user_settings` or a cached value and compute `abs(total_pnl) / balance * 100 >= daily_loss_limit_pct`, or (b) store `daily_loss_limit_usd` instead of `pct` in `user_settings`. Use approach (a) for MVP.

---

## Bug 6 — Strategy Ownership Not Verified on Update/Delete

**File:** `file:backend/app/api/routes/strategies.py`

**Problem:** `PATCH /strategies/{id}` and `DELETE /strategies/{id}` do not verify that the strategy belongs to `current_user.id`. Any authenticated user can modify or delete any strategy by guessing the UUID.

**Fix:** Add `.eq("user_id", current_user.id)` to both the update and delete queries. Return 404 if no rows affected.

---

## Bug 7 — EA Projects Inner Join Excludes Empty Projects

**File:** `file:backend/app/api/routes/ea.py`

**Problem:** `list_projects` uses `ea_versions!inner(...)` — this is a Supabase PostgREST inner join that excludes projects with zero versions. A newly created project (before first generation) disappears from the list.

**Fix:** Change `ea_versions!inner(...)` to `ea_versions(...)` (left join).

---

## Bug 8 — EA Delete Checks Wrong Field

**File:** `file:backend/app/api/routes/ea.py`

**Problem:** `delete_project` checks for running deployments with `.eq("ea_version_id", project_id)` — but `project_id` is a project UUID, not a version UUID. The check always returns empty, so running EAs are never blocked from deletion.

**Fix:** First fetch all version IDs for the project, then check `ea_deployments` with `.in_("ea_version_id", version_ids)`.

---

## Bug 9 — Signup Crash on Email Confirmation Enabled

**File:** `file:backend/app/api/routes/auth.py`

**Problem:** When Supabase email confirmation is enabled (default for production), `supabase.auth.sign_up()` returns `response.session = None`. The current code accesses `response.session.access_token` unconditionally → `AttributeError` → 500.

**Fix:** Guard with `if response.session:` and return empty tokens with a `"confirm_email": True` flag when session is None. The frontend should show "Check your email to confirm your account."

---

## Bug 10 — Candles Endpoint Returns Mock Data on Timeout

**File:** `file:backend/app/api/routes/trading.py`

**Problem:** `GET /candles/{instrument}` falls back to 4 hardcoded mock candles when the agent job times out. A trader sees fake chart data without knowing it's fake.

**Fix:** Remove the mock fallback entirely. Return `[]` on timeout. The frontend `PriceChart` component should show an "Agent offline — no candle data" empty state.

---

## Acceptance Criteria

- [ ] `POST /agents/{id}/heartbeat` stores a real ISO timestamp in `last_heartbeat`
- [ ] `POST /agents/{id}/jobs/{id}/result` stores real timestamps in `completed_at` and `resolved_at`
- [ ] Agent status endpoint correctly returns "online" / "degraded" / "offline" based on real timestamps
- [ ] WebSocket price stream recovers automatically after Redis disconnection
- [ ] `GET /deployments` returns real EA names (not "Unknown")
- [ ] Webhook risk gate correctly compares percentage against account balance
- [ ] `PATCH /strategies/{id}` and `DELETE /strategies/{id}` return 404 for non-owned strategies
- [ ] `GET /ea/projects` includes projects with zero versions
- [ ] `DELETE /ea/projects/{id}` correctly blocks deletion when a version has a running deployment
- [ ] `POST /auth/signup` returns `{"confirm_email": true}` instead of 500 when email confirmation is enabled
- [ ] `GET /candles/{instrument}` returns `[]` on timeout (no mock data)