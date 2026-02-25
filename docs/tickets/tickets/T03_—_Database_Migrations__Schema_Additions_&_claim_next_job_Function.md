# T03 — Database Migrations: Schema Additions & claim_next_job Function

## Overview

The backend code references 5 schema additions and 1 PostgreSQL function that do not yet exist in the Supabase database. Nothing works until these are applied. This ticket covers creating the migration SQL file and running it in Supabase.

The full SQL is documented in `spec:8faa0447-2e35-4cc5-9096-0cbce32ae00a/ccad2713-2703-4e25-8dfe-6d522f7d65ca`. This ticket is the execution of that spec.

---

## Migration File

Create `file:backend/supabase_migrations/002_tech_plan_additions.sql` containing all 6 additions below.

---

## Addition 1 — `mt5_agents` Pairing Key Columns

The `POST /agents/pair` endpoint writes `pairing_key_hash` and `pairing_key_prefix` to `mt5_agents`. These columns don't exist in the base schema.

```sql
ALTER TABLE mt5_agents
  ADD COLUMN IF NOT EXISTS pairing_key_hash  TEXT,
  ADD COLUMN IF NOT EXISTS pairing_key_prefix TEXT;
```

---

## Addition 2 — `jobs` Agent Tracking Columns

The `claim_next_job` RPC sets `agent_id` and `claimed_at` on the job row. These columns don't exist.

```sql
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS agent_id   UUID REFERENCES mt5_agents(id),
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
```

Also update the `job_type` CHECK constraint to include the new job types used by the trading and candles endpoints:

```sql
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_job_type_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_job_type_check
  CHECK (job_type IN (
    'compile','deploy','run','stop','trade',
    'get_positions','get_account','get_candles','close_position'
  ));
```

---

## Addition 3 — `ea_projects` Current Version Pointer

`POST /ea/generate` updates `current_version_id` on the project. This column doesn't exist.

```sql
ALTER TABLE ea_projects
  ADD COLUMN IF NOT EXISTS current_version_id UUID REFERENCES ea_versions(id);
```

---

## Addition 4 — `tv_strategies` Table

The entire TradingView strategies feature depends on this table.

```sql
CREATE TABLE IF NOT EXISTS tv_strategies (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_connection_id UUID REFERENCES broker_connections(id),
  name                 TEXT NOT NULL,
  webhook_secret       TEXT NOT NULL UNIQUE,
  risk_override_pct    NUMERIC(5,2),
  allowed_pairs        TEXT[],
  is_enabled           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tv_strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own strategies"
  ON tv_strategies FOR ALL USING (auth.uid() = user_id);
```

---

## Addition 5 — `tv_signals` Table

Signal history, status tracking, and fill price storage.

```sql
CREATE TABLE IF NOT EXISTS tv_signals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id      UUID REFERENCES tv_strategies(id) ON DELETE SET NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','executed','failed','discarded')),
  symbol           TEXT,
  action           TEXT,
  volume           NUMERIC(10,2),
  fill_price       NUMERIC(18,5),
  broker_order_id  TEXT,
  error_message    TEXT,
  raw_payload      JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at      TIMESTAMPTZ
);

ALTER TABLE tv_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own signals"
  ON tv_signals FOR SELECT USING (auth.uid() = user_id);
-- Backend uses service role key for INSERT/UPDATE
```

---

## Addition 6 — `claim_next_job` PostgreSQL Function

This is the most critical addition. Without it, `GET /agents/{id}/jobs/next` returns a 500 error and no jobs are ever executed.

```sql
CREATE OR REPLACE FUNCTION claim_next_job(p_agent_id UUID)
RETURNS SETOF jobs
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id FROM mt5_agents WHERE id = p_agent_id;

  RETURN QUERY
  UPDATE jobs
  SET    status     = 'claimed',
         agent_id   = p_agent_id,
         claimed_at = NOW()
  WHERE  id = (
    SELECT id FROM jobs
    WHERE  user_id = v_user_id
      AND  status  = 'pending'
    ORDER BY created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  RETURNING *;
END;
$$;
```

---

## How to Apply

1. Open Supabase Dashboard → SQL Editor
2. Paste the full contents of `file:backend/supabase_migrations/002_tech_plan_additions.sql`
3. Click **Run**
4. Verify: check that `mt5_agents`, `jobs`, `ea_projects` have the new columns; `tv_strategies` and `tv_signals` tables exist; `claim_next_job` function appears in Database → Functions

---

## Acceptance Criteria

- [ ] `mt5_agents` table has `pairing_key_hash` and `pairing_key_prefix` columns
- [ ] `jobs` table has `agent_id` and `claimed_at` columns
- [ ] `jobs.job_type` CHECK constraint includes all 9 job types
- [ ] `ea_projects` table has `current_version_id` column
- [ ] `tv_strategies` table exists with RLS enabled
- [ ] `tv_signals` table exists with RLS enabled
- [ ] `claim_next_job(UUID)` function exists and returns a job row atomically
- [ ] Calling `claim_next_job` twice concurrently never returns the same job to two agents