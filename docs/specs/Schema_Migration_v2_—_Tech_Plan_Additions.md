# Schema Migration v2 — Tech Plan Additions

## Overview

This migration appends 5 additions to the base schema defined in `file:artefacts/supabase_schema_migration.sql`. Run this **after** the base migration. All statements are idempotent-safe via `IF NOT EXISTS` or explicit existence checks where PostgreSQL supports it.

**Applies to:** `file:artefacts/supabase_schema_migration.sql` — append the sections below to the end of that file, or run as a separate migration in the Supabase SQL Editor.

---

## Addition 1 — `mt5_agents`: Agent Pairing Key

**Why:** The existing `mt5_agents` table stores MT5 terminal credentials (`password_encrypted`) but has no field for the agent's API authentication key. The backend needs to verify `X-Agent-Key` headers on all agent-facing endpoints.

**Design:** The full key is never stored — only a bcrypt hash. The first 8 characters (`pairing_key_prefix`) are stored in plaintext for display in the UI ("Key: pk_ab12cd34…").

```sql
-- =============================================================================
-- Addition 1: mt5_agents — agent pairing key for X-Agent-Key auth
-- =============================================================================

ALTER TABLE public.mt5_agents
  ADD COLUMN IF NOT EXISTS pairing_key_hash   TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pairing_key_prefix TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN public.mt5_agents.pairing_key_hash
  IS 'bcrypt hash of the full pairing key — never store the raw key';
COMMENT ON COLUMN public.mt5_agents.pairing_key_prefix
  IS 'First 8 chars of the raw key, shown in UI for identification only';
```

---

## Addition 2 — `jobs`: Agent Claim Tracking + Trade Job Type

**Why:** Two gaps in the existing `jobs` table:
1. No `agent_id` field — impossible to know which agent claimed a job, or to enforce that only the claiming agent can submit results.
2. `job_type` CHECK constraint does not include `'trade'` — required for TradingView signal execution jobs.

**Design note:** PostgreSQL does not support `ALTER CONSTRAINT`. The CHECK constraint must be dropped and recreated. The `DROP CONSTRAINT` name matches the auto-generated name from the base migration (`jobs_job_type_check`).

```sql
-- =============================================================================
-- Addition 2a: jobs — add agent_id and claimed_at columns
-- =============================================================================

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS agent_id   UUID REFERENCES public.mt5_agents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.jobs.agent_id
  IS 'Set atomically when an agent claims the job; prevents cross-agent pickup';
COMMENT ON COLUMN public.jobs.claimed_at
  IS 'Timestamp of claim; used for stale-job timeout detection (> 5 min = re-queue)';

CREATE INDEX IF NOT EXISTS jobs_agent_id_idx ON public.jobs(agent_id);

-- =============================================================================
-- Addition 2b: jobs — extend job_type CHECK to include 'trade'
-- =============================================================================

ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_job_type_check;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_job_type_check
  CHECK (job_type IN ('compile', 'deploy', 'run', 'stop', 'test', 'trade', 'get_positions', 'get_account', 'get_candles', 'close_position'));
```

---

## Addition 3 — `ea_projects`: Current Version Pointer

**Why:** The EA Studio editor needs to know which version is currently open when the user returns to a project. Without this, the editor would always default to the latest version, losing the user's last working context.

```sql
-- =============================================================================
-- Addition 3: ea_projects — track which version is active in the editor
-- =============================================================================

ALTER TABLE public.ea_projects
  ADD COLUMN IF NOT EXISTS current_version_id UUID
    REFERENCES public.ea_versions(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.ea_projects.current_version_id
  IS 'The version currently open in the EA Studio editor; updated on generation and manual version switch';
```

---

## Addition 4 — `tv_strategies`: Per-Strategy Webhook Configuration

**Why:** New table required for TradingView signal routing. Each strategy has its own unique `webhook_secret` embedded in the webhook URL, enabling explicit per-strategy routing without payload parsing.

**RLS:** Standard `auth.uid() = user_id` pattern, consistent with all other user-owned tables.

```sql
-- =============================================================================
-- Addition 4: tv_strategies — TradingView webhook strategy configuration
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.tv_strategies (
  id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  broker_connection_id UUID        NOT NULL REFERENCES public.broker_connections(id) ON DELETE RESTRICT,
  name                 TEXT        NOT NULL,
  webhook_secret       TEXT        NOT NULL UNIQUE,
  risk_override_pct    NUMERIC(5,2),
  allowed_pairs        TEXT[],
  is_enabled           BOOLEAN     NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.tv_strategies                    IS 'One row per TradingView strategy; each has a unique webhook URL';
COMMENT ON COLUMN public.tv_strategies.webhook_secret     IS 'URL-embedded routing token — treat as a secret; rotate per strategy';
COMMENT ON COLUMN public.tv_strategies.risk_override_pct  IS 'NULL = inherit from user_settings.risk_percent';
COMMENT ON COLUMN public.tv_strategies.allowed_pairs      IS 'NULL = all pairs allowed; non-null = whitelist';
COMMENT ON COLUMN public.tv_strategies.broker_connection_id IS 'ON DELETE RESTRICT: must disconnect broker before deleting strategy';

ALTER TABLE public.tv_strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tv_strategies_select" ON public.tv_strategies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "tv_strategies_insert" ON public.tv_strategies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tv_strategies_update" ON public.tv_strategies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "tv_strategies_delete" ON public.tv_strategies
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS tv_strategies_user_id_idx       ON public.tv_strategies(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS tv_strategies_secret_idx ON public.tv_strategies(webhook_secret);
```

---

## Addition 5 — `tv_signals`: Immutable Signal Log

**Why:** Every webhook received must be logged regardless of outcome — for audit, debugging failed signals, and the signal feed UI. Records are immutable after creation; only `status`, `fill_price`, `broker_order_id`, `error_message`, and `resolved_at` are updated post-creation.

**RLS:** `auth.uid() = user_id` for user-facing reads. The backend uses the service role key for inserts (webhook arrives unauthenticated).

```sql
-- =============================================================================
-- Addition 5: tv_signals — immutable log of every webhook received
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.tv_signals (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  strategy_id     UUID        NOT NULL REFERENCES public.tv_strategies(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES public.profiles(id)      ON DELETE CASCADE,
  symbol          TEXT        NOT NULL,
  action          TEXT        NOT NULL CHECK (action IN ('buy', 'sell', 'close')),
  price           NUMERIC(12,5),
  raw_payload     JSONB       NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'executed', 'failed', 'discarded')),
  fill_price      NUMERIC(12,5),
  broker_order_id TEXT,
  error_message   TEXT,
  job_id          UUID        REFERENCES public.jobs(id) ON DELETE SET NULL,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

COMMENT ON TABLE  public.tv_signals              IS 'Append-only log of every TradingView webhook received';
COMMENT ON COLUMN public.tv_signals.raw_payload  IS 'Full JSON body as received from TradingView — never modified';
COMMENT ON COLUMN public.tv_signals.status       IS 'pending → executed | failed | discarded';
COMMENT ON COLUMN public.tv_signals.job_id       IS 'NULL for discarded signals (no job created); set for pending/executed/failed';

ALTER TABLE public.tv_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tv_signals_select" ON public.tv_signals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "tv_signals_insert" ON public.tv_signals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- No UPDATE policy for users — signals are immutable from the user's perspective.
-- Backend uses service role key to update status, fill_price, error_message.

CREATE INDEX IF NOT EXISTS tv_signals_strategy_id_idx  ON public.tv_signals(strategy_id);
CREATE INDEX IF NOT EXISTS tv_signals_user_id_idx      ON public.tv_signals(user_id);
CREATE INDEX IF NOT EXISTS tv_signals_received_at_idx  ON public.tv_signals(received_at DESC);
CREATE INDEX IF NOT EXISTS tv_signals_status_idx       ON public.tv_signals(status)
  WHERE status = 'pending';  -- partial index: only pending signals need fast lookup
```

---

## Addition 6 — `claim_next_job`: Atomic Job Claiming Function

**Why:** The backend's `GET /agents/{id}/jobs/next` endpoint calls `supabase.rpc("claim_next_job", ...)`. This PostgreSQL function must exist in the database for atomic job claiming. Without it, the endpoint will fail with a 500 error. The function uses `FOR UPDATE SKIP LOCKED` to guarantee that two agents polling simultaneously never receive the same job.

```sql
-- =============================================================================
-- Addition 6: claim_next_job — atomic job claiming PostgreSQL function
-- =============================================================================

CREATE OR REPLACE FUNCTION public.claim_next_job(p_agent_id UUID)
RETURNS SETOF public.jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.jobs
  SET
    status     = 'running',
    agent_id   = p_agent_id,
    claimed_at = NOW()
  WHERE id = (
    SELECT id
    FROM   public.jobs
    WHERE  status   = 'pending'
      AND  (agent_id IS NULL OR agent_id = p_agent_id)
    ORDER  BY created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT  1
  )
  RETURNING *;
END;
$$;

COMMENT ON FUNCTION public.claim_next_job(UUID)
  IS 'Atomically claims the next pending job for an agent. Uses FOR UPDATE SKIP LOCKED to prevent double-pickup. Called by GET /agents/{id}/jobs/next.';

GRANT EXECUTE ON FUNCTION public.claim_next_job(UUID) TO service_role;
```

---

## Verification

Run after applying all additions to confirm the schema is complete:

```sql
-- Verify new columns on existing tables
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('mt5_agents', 'jobs', 'ea_projects')
  AND column_name IN (
    'pairing_key_hash', 'pairing_key_prefix',
    'agent_id', 'claimed_at',
    'current_version_id'
  )
ORDER BY table_name, column_name;

-- Verify new tables exist with RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('tv_strategies', 'tv_signals');

-- Verify updated CHECK constraint includes 'trade'
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.jobs'::regclass
  AND contype = 'c';
```

---

## Summary of Changes

| Table | Change Type | What |
|---|---|---|
| `mt5_agents` | Column addition | `pairing_key_hash`, `pairing_key_prefix` |
| `jobs` | Column addition | `agent_id`, `claimed_at` |
| `jobs` | Constraint update | `job_type` CHECK extended to include `'trade'`, `'get_positions'`, `'get_account'`, `'get_candles'`, `'close_position'` |
| `jobs` | New function | `claim_next_job(UUID)` — atomic `FOR UPDATE SKIP LOCKED` job claim |
| `ea_projects` | Column addition | `current_version_id` |
| `tv_strategies` | New table | Strategy config, webhook secret, RLS, indexes |
| `tv_signals` | New table | Signal log, RLS, partial index on pending |
