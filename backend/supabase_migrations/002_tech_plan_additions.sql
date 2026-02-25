-- T03 — Database Migrations: Schema Additions & claim_next_job Function
-- Applied: Tech Plan additions for trading, signals, and job claiming

-- Addition 1 — mt5_agents Pairing Key Columns
ALTER TABLE mt5_agents
  ADD COLUMN IF NOT EXISTS pairing_key_hash  TEXT,
  ADD COLUMN IF NOT EXISTS pairing_key_prefix TEXT;

-- Addition 2 — jobs Agent Tracking Columns
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS agent_id   UUID REFERENCES mt5_agents(id),
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- Update job_type CHECK constraint to include all job types
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_job_type_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_job_type_check
  CHECK (job_type IN (
    'compile','deploy','run','stop','trade',
    'get_positions','get_account','get_candles','close_position'
  ));

-- Addition 3 — ea_projects Current Version Pointer
ALTER TABLE ea_projects
  ADD COLUMN IF NOT EXISTS current_version_id UUID REFERENCES ea_versions(id);

-- Addition 4 — tv_strategies Table
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
DROP POLICY IF EXISTS "Users manage own strategies" ON tv_strategies;
CREATE POLICY "Users manage own strategies"
  ON tv_strategies FOR ALL USING (auth.uid() = user_id);

-- Addition 5 — tv_signals Table
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
DROP POLICY IF EXISTS "Users read own signals" ON tv_signals;
CREATE POLICY "Users read own signals"
  ON tv_signals FOR SELECT USING (auth.uid() = user_id);

-- Addition 6 — claim_next_job PostgreSQL Function
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
