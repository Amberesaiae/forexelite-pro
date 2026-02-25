# Environment Setup Guide

## Quick Start: Local Development

### 1. Start Local Supabase

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Navigate to project
cd forexelite-pro

# Start local Supabase
supabase start
```

After running `supabase start`, you'll get output like:

```
API URL: http://127.0.0.1:54321
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Update .env.local

Replace the placeholder values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase start>
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<service_role key from supabase start>
```

### 3. Start Development Servers

```bash
# Terminal 1: Frontend
cd frontend
pnpm dev

# Terminal 2: Backend
cd backend
uvicorn app.main:app --reload

# Terminal 3: MT5 Agent (if needed)
cd mt5_agent
python mt5_agent.py
```

## Production Setup

### Hosted Supabase

1. Visit https://supabase.com/dashboard
2. Click "New Project"
3. Fill in project details
4. Wait for provisioning (~2 minutes)
5. Go to Settings → API
6. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### Optional Services

**TwelveData (Free Tier):**
- Visit https://twelvedata.com/
- Sign up for free account
- Get API key from dashboard
- Add to `NEXT_PUBLIC_TWELVEDATA_API_KEY`

**OANDA Practice Account (Free):**
- Visit https://www.oanda.com/
- Create practice account
- Go to Manage API Access
- Generate API token
- Add credentials to `.env.local`

## Troubleshooting

### Build fails with Supabase error

This is expected if using placeholder credentials. Solutions:
1. Use local Supabase (recommended)
2. Use hosted Supabase
3. Run in dev mode only: `pnpm dev` (skips build)

### Port conflicts

If ports 54321-54327 are in use:
```bash
supabase stop
supabase start
```

### Database migrations

```bash
# Apply migrations
supabase db reset

# Create new migration
supabase migration new your_migration_name
```
