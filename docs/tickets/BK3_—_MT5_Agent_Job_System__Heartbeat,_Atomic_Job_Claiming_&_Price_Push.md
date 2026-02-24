# BK3 — MT5 Agent Job System: Heartbeat, Atomic Job Claiming & Price Push

## What

Build all agent-facing endpoints. These are the backbone of the entire platform — every trade, compile, deploy, and price tick flows through this system.

## Scope

**Agent endpoints (`app/api/routes/agents.py`)**

All endpoints authenticated via `X-Agent-Key` header (uses `get_current_agent` dependency from BK1).

- `POST /api/v1/agents/{agent_id}/heartbeat`
  - Body: `{status: str, metrics: {cpu_percent, memory_percent, active_eas}}`
  - Update `mt5_agents`: `is_connected = true`, `last_heartbeat = now()`
  - Return `{acknowledged: true}`

- `GET /api/v1/agents/{agent_id}/jobs/next` — **atomic job claim**
  - Execute raw SQL via Supabase RPC or direct psycopg2:
    ```sql
    SELECT * FROM jobs
    WHERE status = 'pending'
    AND (agent_id IS NULL OR agent_id = $agent_id)
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
    ```
  - On claim: `UPDATE jobs SET status='running', agent_id=$agent_id, claimed_at=now()`
  - Return job payload or `{"no_jobs": true}`
  - **Critical**: must be atomic — two agents cannot claim the same job

- `POST /api/v1/agents/{agent_id}/jobs/{job_id}/result`
  - Body: `{status: "completed"|"failed", output_data: dict, error_message: str|null}`
  - Update `jobs` row
  - **Propagate result to parent entity** based on `job_type`:
    - `compile` → update `ea_versions.status` (`compiled` or `failed`), store artifact path
    - `deploy|run|stop` → update `ea_deployments.status`
    - `trade` → update `tv_signals.status` + `fill_price` + `broker_order_id` (using service role key)
  - Return `{acknowledged: true}`

- `POST /api/v1/agents/{agent_id}/prices`
  - Body: `{instrument: {bid: float, ask: float}}` dict (multiple instruments per call)
  - For each instrument: `await redis.set(f"prices:{instrument}", json.dumps({bid, ask, ts}))` + `await redis.publish(f"prices:{instrument}", payload)`
  - Return `{received: int}` (count of instruments processed)

- `GET /api/v1/agents/{agent_id}/status`
  - Return `{agent_id, is_connected, last_heartbeat, status: "online"|"degraded"|"offline", metrics}`
  - Status logic: `< 6 min` → online, `6–10 min` → degraded, `≥ 10 min` → offline

## Job Type Reference

| job_type | Created by | Executed by | Propagates to |
|---|---|---|---|
| `compile` | EA API | Agent | `ea_versions.status` |
| `deploy` | Deployments API | Agent | `ea_deployments.status` |
| `run` | Deployments API | Agent | `ea_deployments.status` |
| `stop` | Deployments API | Agent | `ea_deployments.status` |
| `trade` | Trading API / TV Webhook | Agent | `tv_signals.status` / order response |

## Acceptance Criteria
- Two simultaneous `GET /jobs/next` calls never return the same job (atomic claim verified)
- Heartbeat updates `last_heartbeat` and `is_connected = true`
- Job result for `compile` type updates `ea_versions.status` correctly
- Job result for `trade` type updates `tv_signals` using service role key (not user JWT)
- `POST /prices` writes to Redis and publishes to channel
- Invalid `X-Agent-Key` returns 401

## Spec References
- `spec:8faa0447-2e35-4cc5-9096-0cbce32ae00a/ff9b5702-f7bb-4863-b80f-475ca098bc44` — Tech Plan §3 (MT5 Agent, Job Claiming SQL, End-to-End sequences)
- `spec:8faa0447-2e35-4cc5-9096-0cbce32ae00a/ccad2713-2703-4e25-8dfe-6d522f7d65ca` — Schema Migration v2 (`jobs.agent_id`, `jobs.claimed_at`, `jobs.job_type` CHECK constraint)

## Dependencies
`ticket:8faa0447-2e35-4cc5-9096-0cbce32ae00a/BK2`