-- =============================================================================
-- ForexElite Pro - Schema Migrations for MVP
-- Run in Supabase SQL Editor after DATABASE_SETUP.md tables
-- =============================================================================

-- =============================================================================
-- 1. broker_connections
-- One row per user per broker (OANDA / MT5_AGENT / METAAPI)
-- NOTE: credentials column is jsonb - encryption-at-rest must be implemented
-- =============================================================================

CREATE TABLE public.broker_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  broker_type VARCHAR(20) NOT NULL CHECK (broker_type IN ('OANDA', 'MT5_AGENT', 'METAAPI')),
  name TEXT NOT NULL,
  credentials JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.broker_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "broker_connections_select_policy" ON public.broker_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "broker_connections_insert_policy" ON public.broker_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "broker_connections_update_policy" ON public.broker_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "broker_connections_delete_policy" ON public.broker_connections
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX broker_connections_user_id_idx ON public.broker_connections(user_id);

-- =============================================================================
-- 2. mt5_agents
-- Paired MT5 agent devices
-- =============================================================================

CREATE TABLE public.mt5_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  broker_connection_id UUID REFERENCES public.broker_connections(id) ON DELETE SET NULL,
  agent_name TEXT NOT NULL,
  terminal_server TEXT NOT NULL,
  login TEXT NOT NULL,
  password_encrypted TEXT NOT NULL,
  is_connected BOOLEAN DEFAULT false,
  last_heartbeat TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mt5_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mt5_agents_select_policy" ON public.mt5_agents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "mt5_agents_insert_policy" ON public.mt5_agents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mt5_agents_update_policy" ON public.mt5_agents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "mt5_agents_delete_policy" ON public.mt5_agents
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX mt5_agents_user_id_idx ON public.mt5_agents(user_id);
CREATE INDEX mt5_agents_broker_connection_id_idx ON public.mt5_agents(broker_connection_id);

-- =============================================================================
-- 3. ea_projects
-- Logical EA container
-- =============================================================================

CREATE TABLE public.ea_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  default_settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ea_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ea_projects_select_policy" ON public.ea_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ea_projects_insert_policy" ON public.ea_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ea_projects_update_policy" ON public.ea_projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ea_projects_delete_policy" ON public.ea_projects
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX ea_projects_user_id_idx ON public.ea_projects(user_id);

-- =============================================================================
-- 4. ea_versions
-- Versioned EA metadata
-- =============================================================================

CREATE TABLE public.ea_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ea_project_id UUID NOT NULL REFERENCES public.ea_projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  source_code JSONB NOT NULL,
  config JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'compiling', 'compiled', 'failed')),
  compilation_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ea_project_id, version_number)
);

ALTER TABLE public.ea_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ea_versions_select_policy" ON public.ea_versions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.ea_projects WHERE id = ea_project_id
    )
  );

CREATE POLICY "ea_versions_insert_policy" ON public.ea_versions
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.ea_projects WHERE id = ea_project_id
    )
  );

CREATE POLICY "ea_versions_update_policy" ON public.ea_versions
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.ea_projects WHERE id = ea_project_id
    )
  );

CREATE POLICY "ea_versions_delete_policy" ON public.ea_versions
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.ea_projects WHERE id = ea_project_id
    )
  );

CREATE INDEX ea_versions_ea_project_id_idx ON public.ea_versions(ea_project_id);

-- =============================================================================
-- 5. ea_artifacts
-- File references in Supabase Storage
-- =============================================================================

CREATE TABLE public.ea_artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ea_version_id UUID NOT NULL REFERENCES public.ea_versions(id) ON DELETE CASCADE,
  artifact_type VARCHAR(20) NOT NULL CHECK (artifact_type IN ('ex4', 'ex5', 'log', 'config')),
  storage_path TEXT NOT NULL,
  file_size BIGINT,
  checksum TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ea_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ea_artifacts_select_policy" ON public.ea_artifacts
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.ea_projects 
      WHERE id IN (
        SELECT ea_project_id FROM public.ea_versions WHERE id = ea_version_id
      )
    )
  );

CREATE POLICY "ea_artifacts_insert_policy" ON public.ea_artifacts
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.ea_projects 
      WHERE id IN (
        SELECT ea_project_id FROM public.ea_versions WHERE id = ea_version_id
      )
    )
  );

CREATE POLICY "ea_artifacts_delete_policy" ON public.ea_artifacts
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.ea_projects 
      WHERE id IN (
        SELECT ea_project_id FROM public.ea_versions WHERE id = ea_version_id
      )
    )
  );

CREATE INDEX ea_artifacts_ea_version_id_idx ON public.ea_artifacts(ea_version_id);

-- =============================================================================
-- 6. ea_deployments
-- Where an EA version is deployed/running
-- =============================================================================

CREATE TABLE public.ea_deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ea_version_id UUID NOT NULL REFERENCES public.ea_versions(id) ON DELETE CASCADE,
  mt5_agent_id UUID REFERENCES public.mt5_agents(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'deploying', 'running', 'stopped', 'failed')),
  deployed_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,
  runtime_config JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ea_deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ea_deployments_select_policy" ON public.ea_deployments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.ea_projects 
      WHERE id IN (
        SELECT ea_project_id FROM public.ea_versions WHERE id = ea_version_id
      )
    )
  );

CREATE POLICY "ea_deployments_insert_policy" ON public.ea_deployments
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.ea_projects 
      WHERE id IN (
        SELECT ea_project_id FROM public.ea_versions WHERE id = ea_version_id
      )
    )
  );

CREATE POLICY "ea_deployments_update_policy" ON public.ea_deployments
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.ea_projects 
      WHERE id IN (
        SELECT ea_project_id FROM public.ea_versions WHERE id = ea_version_id
      )
    )
  );

CREATE INDEX ea_deployments_ea_version_id_idx ON public.ea_deployments(ea_version_id);
CREATE INDEX ea_deployments_mt5_agent_id_idx ON public.ea_deployments(mt5_agent_id);

-- =============================================================================
-- 7. jobs
-- Async job tracking (compile/deploy/run/stop)
-- =============================================================================

CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_type VARCHAR(20) NOT NULL CHECK (job_type IN ('compile', 'deploy', 'run', 'stop', 'test')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  entity_type VARCHAR(20) NOT NULL,
  entity_id UUID NOT NULL,
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobs_select_policy" ON public.jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "jobs_insert_policy" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "jobs_update_policy" ON public.jobs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX jobs_user_id_idx ON public.jobs(user_id);
CREATE INDEX jobs_status_idx ON public.jobs(status);
CREATE INDEX jobs_entity_idx ON public.jobs(entity_type, entity_id);

-- =============================================================================
-- 8. trade_events
-- Auditable manual trading event history
-- =============================================================================

CREATE TABLE public.trade_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  broker_connection_id UUID REFERENCES public.broker_connections(id) ON DELETE SET NULL,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('order_placed', 'order_closed', 'order_rejected', 'position_opened', 'position_closed', 'manual_trade')),
  pair VARCHAR(20) REFERENCES public.instrument_config(pair),
  direction VARCHAR(5) CHECK (direction IN ('LONG', 'SHORT')),
  quantity NUMERIC(12,5),
  entry_price NUMERIC(12,5),
  exit_price NUMERIC(12,5),
  sl NUMERIC(12,5),
  tp NUMERIC(12,5),
  profit_loss NUMERIC(14,2),
  external_order_id TEXT,
  external_position_id TEXT,
  metadata JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.trade_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trade_events_select_policy" ON public.trade_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "trade_events_insert_policy" ON public.trade_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX trade_events_user_id_idx ON public.trade_events(user_id);
CREATE INDEX trade_events_created_at_idx ON public.trade_events(created_at DESC);
CREATE INDEX trade_events_pair_idx ON public.trade_events(pair);
CREATE INDEX trade_events_event_type_idx ON public.trade_events(event_type);

-- =============================================================================
-- Storage Bucket for EA Artifacts
-- Run in Supabase Dashboard: Storage → Buckets → New Bucket
-- =============================================================================

-- Create the private bucket (run manually in Supabase Dashboard)
-- Name: ea-artifacts
-- Public: false (private bucket)

-- =============================================================================
-- Verification
-- =============================================================================

-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'instrument_config', 'profiles', 'user_settings', 'user_strategies', 'signals',
  'broker_connections', 'mt5_agents', 'ea_projects', 'ea_versions', 
  'ea_artifacts', 'ea_deployments', 'jobs', 'trade_events'
)
ORDER BY table_name;

-- Check RLS is enabled on new tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'broker_connections', 'mt5_agents', 'ea_projects', 'ea_versions', 
  'ea_artifacts', 'ea_deployments', 'jobs', 'trade_events'
);
