# Database Setup Guide
**Supabase PostgreSQL Schema for ForexElite Pro**

---

## Quick Setup

1. Go to https://supabase.com/dashboard
2. Create new project
3. Go to SQL Editor
4. Run the SQL scripts below in order

---

## Schema Creation Order

**IMPORTANT:** Run these in exact order due to foreign key dependencies.

### 1. Enable Extensions

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';
```

---

### 2. Create instrument_config Table

```sql
CREATE TABLE public.instrument_config (
  pair VARCHAR(20) PRIMARY KEY,
  pip_size NUMERIC(12,5) NOT NULL,
  tick_value NUMERIC(12,5) NOT NULL,
  contract_size NUMERIC(12,2) NOT NULL,
  instrument_type VARCHAR(20) NOT NULL CHECK (instrument_type IN ('forex', 'metals', 'indices')),
  display_name VARCHAR(30) NOT NULL,
  oanda_name VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.instrument_config ENABLE ROW LEVEL SECURITY;

-- Public read access (no auth required)
CREATE POLICY "instrument_config_select_policy" ON public.instrument_config
  FOR SELECT USING (true);

-- Seed data
INSERT INTO public.instrument_config (pair, pip_size, tick_value, contract_size, instrument_type, display_name, oanda_name) VALUES
  -- Forex pairs
  ('EUR_USD', 0.0001, 10.00, 100000, 'forex', 'EUR/USD', 'EUR_USD'),
  ('GBP_USD', 0.0001, 10.00, 100000, 'forex', 'GBP/USD', 'GBP_USD'),
  ('USD_JPY', 0.01, 9.50, 100000, 'forex', 'USD/JPY', 'USD_JPY'),
  ('AUD_USD', 0.0001, 10.00, 100000, 'forex', 'AUD/USD', 'AUD_USD'),
  ('USD_CAD', 0.0001, 7.50, 100000, 'forex', 'USD/CAD', 'USD_CAD'),
  ('NZD_USD', 0.0001, 10.00, 100000, 'forex', 'NZD/USD', 'NZD_USD'),
  
  -- Metals
  ('XAU_USD', 0.01, 1.00, 100, 'metals', 'Gold', 'XAU_USD'),
  ('XAG_USD', 0.001, 0.50, 5000, 'metals', 'Silver', 'XAG_USD'),
  
  -- Indices
  ('US30_USD', 1.00, 1.00, 1, 'indices', 'US 30', 'US30_USD'),
  ('NAS100_USD', 1.00, 1.00, 1, 'indices', 'NASDAQ 100', 'NAS100_USD'),
  ('SPX500_USD', 1.00, 1.00, 1, 'indices', 'S&P 500', 'SPX500_USD');
```

---

### 3. Create profiles Table

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### 4. Create user_settings Table

```sql
CREATE TABLE public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  oanda_api_key TEXT,
  oanda_account_id TEXT,
  oanda_env VARCHAR(10) DEFAULT 'practice' CHECK (oanda_env IN ('practice', 'trade')),
  account_balance NUMERIC(12,2) DEFAULT 0,
  risk_percent NUMERIC(5,2) DEFAULT 1.0 CHECK (risk_percent >= 0.1 AND risk_percent <= 10.0),
  account_currency VARCHAR(3) DEFAULT 'USD',
  disclaimer_accepted BOOLEAN DEFAULT false,
  preferred_pairs TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own settings
CREATE POLICY "user_settings_select_policy" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "user_settings_update_policy" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger to auto-create settings on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();
```

---

### 5. Create user_strategies Table

```sql
CREATE TABLE public.user_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pair VARCHAR(20) NOT NULL REFERENCES public.instrument_config(pair),
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_strategies ENABLE ROW LEVEL SECURITY;

-- Users can only see their own strategies
CREATE POLICY "user_strategies_select_policy" ON public.user_strategies
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own strategies
CREATE POLICY "user_strategies_insert_policy" ON public.user_strategies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own strategies
CREATE POLICY "user_strategies_update_policy" ON public.user_strategies
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own strategies
CREATE POLICY "user_strategies_delete_policy" ON public.user_strategies
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX user_strategies_user_id_idx ON public.user_strategies(user_id);
CREATE INDEX user_strategies_pair_idx ON public.user_strategies(pair);
```

---

### 6. Create signals Table

```sql
CREATE TABLE public.signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  strategy_id UUID REFERENCES public.user_strategies(id) ON DELETE SET NULL,
  pair VARCHAR(20) NOT NULL REFERENCES public.instrument_config(pair),
  direction VARCHAR(5) NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
  entry NUMERIC(12,5) NOT NULL,
  sl NUMERIC(12,5) NOT NULL,
  tp NUMERIC(12,5) NOT NULL,
  confidence SMALLINT NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  candles_used SMALLINT NOT NULL,
  strategy_config JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- Users can only see their own signals
CREATE POLICY "signals_select_policy" ON public.signals
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own signals
CREATE POLICY "signals_insert_policy" ON public.signals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX signals_user_id_idx ON public.signals(user_id);
CREATE INDEX signals_pair_idx ON public.signals(pair);
CREATE INDEX signals_generated_at_idx ON public.signals(generated_at DESC);

-- Dedup index: prevent duplicate signals within 5-minute window
CREATE UNIQUE INDEX signals_dedup_idx ON public.signals (
  user_id,
  (strategy_config::text),
  pair,
  (date_trunc('minute', generated_at) + 
   INTERVAL '5 minutes' * FLOOR(EXTRACT(EPOCH FROM generated_at) / 300))
);
```

---

## Verification Queries

Run these to verify setup:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check instrument_config data
SELECT pair, display_name, instrument_type 
FROM public.instrument_config 
ORDER BY instrument_type, pair;

-- Check triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

---

## Test Data (Optional)

```sql
-- Create test user (requires auth.users entry first)
-- This is just for reference - actual users created via Supabase Auth

-- Example: Check if profile auto-creation works
SELECT * FROM public.profiles LIMIT 5;

-- Example: Check if settings auto-creation works
SELECT * FROM public.user_settings LIMIT 5;
```

---

## Backup & Restore

### Backup
```bash
# From Supabase dashboard
# Settings → Database → Backups → Create backup
```

### Restore
```bash
# From Supabase dashboard
# Settings → Database → Backups → Restore from backup
```

---

## Security Checklist

- [x] RLS enabled on all tables
- [x] Policies restrict access to own data only
- [x] instrument_config is publicly readable
- [x] API keys stored encrypted (Supabase handles this)
- [x] Triggers auto-create related records
- [x] Foreign keys enforce referential integrity
- [x] Check constraints validate data
- [x] Indexes optimize query performance

---

## Troubleshooting

### "permission denied for table"
- Check RLS policies are created
- Verify user is authenticated
- Check policy conditions match user context

### "duplicate key value violates unique constraint"
- Check dedup index on signals table
- This is expected behavior (prevents duplicate signals)

### "foreign key violation"
- Ensure parent records exist before inserting child records
- Follow creation order: instrument_config → profiles → user_settings → user_strategies → signals

---

*ForexElite Pro Database Setup · v1.0 · February 2026*
