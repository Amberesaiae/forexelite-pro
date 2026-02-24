# Supabase Setup Guide for ForexElite Pro

## Quick Setup (5 minutes)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: `forexelite-pro`
   - **Database Password**: Generate a strong password and save it!
4. Wait for project creation (~30 seconds)

### Step 2: Get Your Credentials

Go to **Settings → API** and copy:

| Field | Env Variable | Where to use |
|-------|--------------|--------------|
| Project URL | `SUPABASE_URL` | backend, frontend |
| anon public key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | frontend |
| service_role key | `SUPABASE_SERVICE_ROLE_KEY` | backend only |
| JWT Secret | `SUPABASE_JWT_SECRET` | backend |

### Step 3: Run Database Migration

1. Go to **SQL Editor** in Supabase dashboard
2. Copy contents of `supabase_schema_migration.sql`
3. Click "Run" to execute

### Step 4: Create Storage Bucket

1. Go to **Storage** → **Buckets**
2. Click "New Bucket"
3. Fill in:
   - **Name**: `ea-artifacts`
   - **Public bucket**: OFF (uncheck)
4. Click "Create bucket"

### Step 5: Enable Authentication

1. Go to **Authentication → Providers**
2. Click "Email"
3. Enable "Enable email provider"
4. Save

### Step 6: Configure Environment Variables

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env and paste your Supabase credentials

# Frontend  
cd ../frontend
cp .env.local.example .env.local
# Edit .env.local and paste your Supabase credentials
```

## Environment Variables Reference

### Frontend (`frontend/.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### Backend (`backend/.env`)

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret-from-settings-jwt-page
SUPABASE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Verify Setup

Run the setup verification:

```bash
python setup_supabase.py
```

Or test manually:

```sql
-- Run in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'profiles', 'broker_connections', 'mt5_agents', 
  'ea_projects', 'ea_versions', 'ea_artifacts', 
  'ea_deployments', 'jobs', 'trade_events'
);
```

Should return 9 tables.

## Troubleshooting

### "relation does not exist"

Make sure you ran the migration in SQL Editor.

### Authentication errors

Check that `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct (not service_role key).

### RLS policy errors

Verify RLS is enabled on all tables:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All tables should have `rowsecurity = true`.

## Next Steps

After setup, start the development servers:

```bash
# Terminal 1: Backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend
pnpm dev
```

Open http://localhost:3000 and sign up for an account!