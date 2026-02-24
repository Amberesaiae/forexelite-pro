# ForexElite Pro - System Architecture

**Last Updated**: February 23, 2026  
**Purpose**: Canonical documentation showing complete dataflow, auth, and component interactions

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Component Map](#component-map)
3. [Auth Flow](#auth-flow)
4. [Core Data Flows](#core-data-flows)
5. [Database Schema](#database-schema)
6. [API Surface](#api-surface)
7. [Error Handling](#error-handling)

---

## System Overview

ForexElite Pro is a hybrid trading platform supporting:
- **Manual Trading**: Place orders via OANDA or MT5
- **EA Generation**: AI-powered MQL5 code generation (GLM-5)
- **EA Lifecycle**: Compile → Deploy → Monitor EAs on MT5
- **Live Monitoring**: Real-time price streaming and position tracking

### Technology Stack

```
Frontend:  Next.js 14 + TypeScript + Tailwind + WebSocket
Backend:   FastAPI + Python 3.11
Database:  Supabase (PostgreSQL + Storage)
Auth:      Supabase JWT
Cache:     Redis (price data)
AI:        GLM-5 (EA generation)
Brokers:   MT5 Agent (universal - works with ANY MT5 broker)
```

### Architecture Principles

1. **Single Backend Service** - One FastAPI app handles all APIs
2. **Supabase Auth** - JWT-based, no custom auth code
3. **MT5-Only Integration** - Universal broker support via MT5 Agent
4. **Outbound Agents** - MT5 Agents pull jobs (firewall-friendly)
5. **Real-time Updates** - WebSocket for prices and monitoring

---

## Component Map

### Frontend Components

```
app/
├── login/              # Auth (Supabase)
├── onboarding/         # Broker connection + disclaimer
├── dashboard/          # Trading UI (chart + order panel + positions)
└── dashboard/ea/       # EA Library + Deployments
```

### Backend Services

```
backend/app/
├── core/
│   ├── auth.py         # JWT verification
│   ├── config.py       # Environment settings
│   └── logging.py      # Structured logging
├── api/routes/
│   ├── auth.py         # Login/signup (proxies to Supabase)
│   ├── onboarding.py   # Broker connections + preferences
│   ├── trading.py      # Orders, positions, account
│   ├── candles.py      # Historical price data
│   ├── ea.py           # EA projects, versions, artifacts
│   ├── deployment.py   # EA deploy/run/stop
│   └── agents.py       # MT5 Agent pairing + jobs
├── brokers/
│   ├── base.py         # BrokerAdapter interface
│   └── mt5_agent.py    # MT5 Agent communication (universal)
├── services/
│   ├── ea_generator.py # GLM-5 code generation
│   ├── compilation.py  # Sandbox + Agent compilation
│   ├── deployment.py   # Job orchestration
│   └── price_stream.py # OANDA streaming + Redis cache
└── ws/
    └── price_stream.py # WebSocket handler
```


### External Services

```
Supabase:
├── Auth          # JWT tokens, user management
├── PostgreSQL    # All application data
└── Storage       # EA artifacts (.mq5, .ex5 files)

Redis:
└── Cache         # Latest prices for instant WS connect

MT5 Agent (Universal Broker Support):
├── Compilation   # MQL5 compiler
├── Deployment    # Copy EA to MT5
└── Runtime       # Start/stop EA, monitor status

GLM-5 API:
└── Code Gen      # Generate MQL5 from strategy description
```

---

## Auth Flow

### JWT Lifecycle

```
┌─────────┐                 ┌──────────┐                ┌─────────┐
│ Frontend│                 │ Supabase │                │ Backend │
└────┬────┘                 └────┬─────┘                └────┬────┘
     │                           │                           │
     │ 1. POST /auth/login       │                           │
     │ {email, password}         │                           │
     ├──────────────────────────>│                           │
     │                           │                           │
     │ 2. JWT Token              │                           │
     │ {sub: user_id, exp: ...}  │                           │
     │<──────────────────────────┤                           │
     │                           │                           │
     │ 3. Store in localStorage  │                           │
     │                           │                           │
     │ 4. API Request            │                           │
     │ Authorization: Bearer JWT │                           │
     ├───────────────────────────────────────────────────────>│
     │                           │                           │
     │                           │ 5. Verify JWT             │
     │                           │<──────────────────────────┤
     │                           │                           │
     │                           │ 6. user_id confirmed      │
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │                           │ 7. Check RLS
     │                           │                           │    (user_id)
     │                           │                           │
     │ 8. Response               │                           │
     │<───────────────────────────────────────────────────────┤
     │                           │                           │
```

### Auth Checkpoints

Every API request goes through:

1. **Frontend**: Attach JWT to `Authorization: Bearer <token>` header
2. **Backend Middleware**: Extract and verify JWT signature
3. **Route Handler**: Get `user_id` from verified token
4. **Database RLS**: Supabase enforces row-level security on `user_id`

### Onboarding Gate

Protected routes (`/api/v1/trading`, `/api/v1/ea`) check:
- JWT valid? ✓
- User onboarded? → Check `broker_connections` + `disclaimer_accepted`
- If not onboarded → Return `428 Precondition Required`

---

## Core Data Flows

### Flow 1: User Login

```
[Frontend]                [Supabase]              [Backend]
    │                         │                       │
    │ POST /auth/login        │                       │
    │ {email, password}       │                       │
    ├────────────────────────>│                       │
    │                         │                       │
    │                         │ Verify credentials    │
    │                         │                       │
    │ JWT Token               │                       │
    │ {sub, email, exp}       │                       │
    │<────────────────────────┤                       │
    │                         │                       │
    │ Store JWT               │                       │
    │ Redirect to /dashboard  │                       │
    │                         │                       │
```

**Key Points:**
- Backend doesn't handle auth - Supabase does
- JWT contains `user_id` (sub claim)
- Frontend stores JWT in localStorage
- JWT expires in 1 hour (refresh token for 30 days)


### Flow 2: Onboarding (Connect Broker)

```
[Frontend]              [Backend]              [Supabase DB]           [Broker]
    │                       │                       │                      │
    │ PUT /api/onboarding   │                       │                      │
    │ 🔑 JWT                │                       │                      │
    │ 📦 {type: OANDA,      │                       │                      │
    │     credentials}      │                       │                      │
    ├──────────────────────>│                       │                      │
    │                       │ Verify JWT            │                      │
    │                       │ Extract user_id       │                      │
    │                       │                       │                      │
    │                       │ Test credentials      │                      │
    │                       ├──────────────────────────────────────────────>│
    │                       │                       │                      │
    │                       │ Connection OK         │                      │
    │                       │<──────────────────────────────────────────────┤
    │                       │                       │                      │
    │                       │ INSERT broker_connection                     │
    │                       │ {user_id, type, credentials}                 │
    │                       ├──────────────────────>│                      │
    │                       │                       │                      │
    │                       │ broker_connection_id  │                      │
    │                       │<──────────────────────┤                      │
    │                       │                       │                      │
    │ {success: true}       │                       │                      │
    │<──────────────────────┤                       │                      │
    │                       │                       │                      │
```

**Key Points:**
- Credentials encrypted at rest in DB
- Backend tests connection before saving
- User can connect multiple brokers (OANDA + MT5)
- Onboarding complete when: `broker_connections.count > 0` AND `disclaimer_accepted = true`

### Flow 3: Place Order (Manual Trading)

```
[Frontend]         [Backend]         [Supabase DB]      [Broker Adapter]    [OANDA/MT5]
    │                  │                   │                    │                  │
    │ POST /api/orders │                   │                    │                  │
    │ 🔑 JWT           │                   │                    │                  │
    │ 📦 {             │                   │                    │                  │
    │   broker_conn_id,│                   │                    │                  │
    │   instrument,    │                   │                    │                  │
    │   side: BUY,     │                   │                    │                  │
    │   units: 1000    │                   │                    │                  │
    │ }                │                   │                    │                  │
    ├─────────────────>│                   │                    │                  │
    │                  │ Verify JWT        │                    │                  │
    │                  │ Extract user_id   │                    │                  │
    │                  │                   │                    │                  │
    │                  │ Load broker_connection                 │                  │
    │                  ├──────────────────>│                    │                  │
    │                  │                   │                    │                  │
    │                  │ {type, credentials}                    │                  │
    │                  │<──────────────────┤                    │                  │
    │                  │                   │                    │                  │
    │                  │ Resolve adapter   │                    │                  │
    │                  ├──────────────────────────────────────>│                  │
    │                  │                   │                    │                  │
    │                  │                   │                    │ place_order()    │
    │                  │                   │                    ├─────────────────>│
    │                  │                   │                    │                  │
    │                  │                   │                    │ {order_id, price}│
    │                  │                   │                    │<─────────────────┤
    │                  │                   │                    │                  │
    │                  │ INSERT trade_event│                    │                  │
    │                  │ {user_id, broker_conn_id, order_id}    │                  │
    │                  ├──────────────────>│                    │                  │
    │                  │                   │                    │                  │
    │ {order_id, price}│                   │                    │                  │
    │<─────────────────┤                   │                    │                  │
    │                  │                   │                    │                  │
```

**Key Points:**
- User selects broker via `broker_connection_id`
- Backend loads credentials from DB
- Broker adapter handles API differences (OANDA vs MT5)
- All trades logged in `trade_events` for audit


### Flow 4: Price Streaming (Real-time)

```
[OANDA Stream]    [Backend WS]      [Redis Cache]     [Frontend WS]
      │                │                  │                  │
      │ Tick: EUR/USD  │                  │                  │
      │ {bid, ask, t}  │                  │                  │
      ├───────────────>│                  │                  │
      │                │                  │                  │
      │                │ SET price:EURUSD │                  │
      │                ├─────────────────>│                  │
      │                │                  │                  │
      │                │ Broadcast to all │                  │
      │                │ subscribers      │                  │
      │                ├──────────────────────────────────────>│
      │                │                  │                  │
      │                │                  │                  │ Update chart
      │                │                  │                  │
      │                │                  │  New client connects
      │                │                  │                  │
      │                │                  │  ws://backend/ws/prices/EURUSD
      │                │<──────────────────────────────────────┤
      │                │                  │                  │
      │                │ GET price:EURUSD │                  │
      │                ├─────────────────>│                  │
      │                │                  │                  │
      │                │ Last known price │                  │
      │                │<─────────────────┤                  │
      │                │                  │                  │
      │                │ Send immediately │                  │
      │                ├──────────────────────────────────────>│
      │                │                  │                  │
      │ Next tick      │                  │                  │
      ├───────────────>│                  │                  │
      │                │ Broadcast        │                  │
      │                ├──────────────────────────────────────>│
      │                │                  │                  │
```

**Key Points:**
- Shared OANDA service account streams prices
- Redis caches latest price for instant WS connect
- All users see same prices (no per-user streaming)
- WebSocket auto-reconnects on disconnect

### Flow 5: EA Generation (AI-Powered)

```
[Frontend]        [Backend]         [GLM-5 API]       [Supabase Storage]   [Supabase DB]
    │                 │                  │                    │                  │
    │ POST /api/ea/generate              │                    │                  │
    │ 🔑 JWT                              │                    │                  │
    │ 📦 {strategy: "Scalping EA..."}    │                    │                  │
    ├────────────────>│                  │                    │                  │
    │                 │ Verify JWT       │                    │                  │
    │                 │                  │                    │                  │
    │                 │ Generate MQL5    │                    │                  │
    │                 ├─────────────────>│                    │                  │
    │                 │                  │                    │                  │
    │                 │                  │ GLM-5 reasoning    │                  │
    │                 │                  │ (Sequential Thinking)                 │
    │                 │                  │                    │                  │
    │                 │ MQL5 code        │                    │                  │
    │                 │<─────────────────┤                    │                  │
    │                 │                  │                    │                  │
    │                 │ Upload source.mq5│                    │                  │
    │                 ├────────────────────────────────────────>│                  │
    │                 │                  │                    │                  │
    │                 │ storage_path     │                    │                  │
    │                 │<────────────────────────────────────────┤                  │
    │                 │                  │                    │                  │
    │                 │ INSERT ea_version│                    │                  │
    │                 │ {project_id, source_code, status: Draft}                 │
    │                 ├────────────────────────────────────────────────────────────>│
    │                 │                  │                    │                  │
    │ {version_id}    │                  │                    │                  │
    │<────────────────┤                  │                    │                  │
    │                 │                  │                    │                  │
```

**Key Points:**
- GLM-5 generates MQL5 code from natural language
- Source stored in Supabase Storage (private bucket)
- Metadata in `ea_versions` table
- Cost: ~$0.015 per EA generation


### Flow 6: EA Compilation (MT5 Agent)

```
[Frontend]      [Backend]       [Supabase DB]      [MT5 Agent]       [MQL5 Compiler]
    │               │                 │                  │                   │
    │ POST /api/ea/versions/{id}/compile                │                   │
    │ 🔑 JWT                                             │                   │
    ├──────────────>│                 │                  │                   │
    │               │ Verify JWT      │                  │                   │
    │               │                 │                  │                   │
    │               │ CREATE job      │                  │                   │
    │               │ {type: compile, │                  │                   │
    │               │  version_id}    │                  │                   │
    │               ├────────────────>│                  │                   │
    │               │                 │                  │                   │
    │               │ job_id          │                  │                   │
    │               │<────────────────┤                  │                   │
    │               │                 │                  │                   │
    │ {job_id}      │                 │                  │                   │
    │<──────────────┤                 │                  │                   │
    │               │                 │                  │                   │
    │               │                 │  Agent polls     │                   │
    │               │                 │  GET /agents/{id}/jobs/next          │
    │               │                 │<─────────────────┤                   │
    │               │                 │                  │                   │
    │               │                 │  {job_id, payload}                   │
    │               │                 ├─────────────────>│                   │
    │               │                 │                  │                   │
    │               │                 │                  │ Download source   │
    │               │                 │                  │ from Storage      │
    │               │                 │                  │                   │
    │               │                 │                  │ Compile .mq5      │
    │               │                 │                  ├──────────────────>│
    │               │                 │                  │                   │
    │               │                 │                  │ .ex5 file         │
    │               │                 │                  │<──────────────────┤
    │               │                 │                  │                   │
    │               │                 │  POST /agents/{id}/jobs/{job_id}/result
    │               │                 │  {status: completed, artifact_path}  │
    │               │                 │<─────────────────┤                   │
    │               │                 │                  │                   │
    │               │                 │  UPDATE job      │                   │
    │               │                 │  UPDATE ea_version                   │
    │               │                 │  status: Compiled│                   │
    │               │                 │                  │                   │
```

**Key Points:**
- Agent polls for jobs (outbound only, firewall-friendly)
- Compilation happens on user's machine (secure)
- Compiled .ex5 uploaded to Supabase Storage
- Job system tracks async work with retry

### Flow 7: EA Deployment & Monitoring

```
[Frontend]      [Backend]       [Supabase DB]      [MT5 Agent]       [MT5 Terminal]
    │               │                 │                  │                   │
    │ POST /api/ea/deployments                           │                   │
    │ 🔑 JWT                                             │                   │
    │ 📦 {version_id, agent_id, symbol}                  │                   │
    ├──────────────>│                 │                  │                   │
    │               │ Verify JWT      │                  │                   │
    │               │                 │                  │                   │
    │               │ CREATE deployment                  │                   │
    │               │ CREATE job (deploy)                │                   │
    │               ├────────────────>│                  │                   │
    │               │                 │                  │                   │
    │ {deployment_id}                 │                  │                   │
    │<──────────────┤                 │                  │                   │
    │               │                 │                  │                   │
    │               │                 │  Agent polls     │                   │
    │               │                 │<─────────────────┤                   │
    │               │                 │                  │                   │
    │               │                 │  {job: deploy}   │                   │
    │               │                 ├─────────────────>│                   │
    │               │                 │                  │                   │
    │               │                 │                  │ Copy .ex5 to      │
    │               │                 │                  │ MT5/Experts/      │
    │               │                 │                  ├──────────────────>│
    │               │                 │                  │                   │
    │               │                 │                  │ Start EA          │
    │               │                 │                  ├──────────────────>│
    │               │                 │                  │                   │
    │               │                 │                  │ EA Running        │
    │               │                 │                  │<──────────────────┤
    │               │                 │                  │                   │
    │               │                 │  POST result     │                   │
    │               │                 │  {status: running}                   │
    │               │                 │<─────────────────┤                   │
    │               │                 │                  │                   │
    │               │                 │  UPDATE deployment                   │
    │               │                 │  status: Running │                   │
    │               │                 │                  │                   │
    │               │                 │                  │ Heartbeat         │
    │               │                 │                  │ every 5min        │
    │               │                 │<─────────────────┤                   │
    │               │                 │                  │                   │
```

**Key Points:**
- Deployment creates job for agent
- Agent copies EA to MT5 and starts it
- Heartbeat every 5 minutes confirms EA running
- If heartbeat stops → status changes to Offline


---

## Database Schema

### Core Tables

```sql
-- Users (managed by Supabase Auth)
profiles (
  id uuid PRIMARY KEY,
  email text,
  created_at timestamptz
)

-- Broker Connections (multi-broker support)
broker_connections (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  agent_id uuid REFERENCES mt5_agents(id),
  broker_name text, -- 'Exness', 'IC Markets', 'XM', 'OANDA MT5', etc.
  account_number text,
  account_type text, -- 'demo', 'live'
  label text,
  is_active boolean,
  created_at timestamptz
)

-- MT5 Agents (user's VPS/terminal)
mt5_agents (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  agent_name text,
  status text, -- 'online', 'offline'
  last_seen_at timestamptz,
  agent_key_fingerprint text,
  created_at timestamptz
)

-- EA Projects (logical container)
ea_projects (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  name text,
  strategy_id uuid, -- nullable
  created_at timestamptz
)

-- EA Versions (source code + metadata)
ea_versions (
  id uuid PRIMARY KEY,
  ea_project_id uuid REFERENCES ea_projects(id),
  version_number int,
  source_code jsonb, -- {template, code, config}
  config jsonb,
  status text, -- 'draft', 'compiled', 'error'
  compile_target text, -- 'backend', 'agent'
  created_at timestamptz
)

-- EA Artifacts (files in Supabase Storage)
ea_artifacts (
  id uuid PRIMARY KEY,
  ea_version_id uuid REFERENCES ea_versions(id),
  kind text, -- 'SOURCE_ZIP', 'MQ5', 'EX5'
  storage_path text,
  sha256 text,
  size_bytes bigint,
  created_at timestamptz
)

-- EA Deployments (running EAs)
ea_deployments (
  id uuid PRIMARY KEY,
  ea_version_id uuid REFERENCES ea_versions(id),
  broker_connection_id uuid REFERENCES broker_connections(id),
  agent_id uuid REFERENCES mt5_agents(id),
  symbol text,
  status text, -- 'deployed', 'running', 'stopped', 'error', 'offline'
  last_error text,
  created_at timestamptz
)

-- Jobs (async task tracking)
jobs (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  type text, -- 'compile', 'deploy', 'start', 'stop'
  status text, -- 'pending', 'in_progress', 'completed', 'failed'
  payload jsonb,
  result jsonb,
  created_at timestamptz,
  updated_at timestamptz
)

-- Trade Events (audit log)
trade_events (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  broker_connection_id uuid REFERENCES broker_connections(id),
  event_type text, -- 'ORDER_PLACED', 'ORDER_REJECTED', 'POSITION_CLOSED'
  instrument text,
  side text, -- 'BUY', 'SELL'
  units decimal,
  price decimal,
  broker_order_id text,
  broker_position_id text,
  raw jsonb,
  created_at timestamptz
)

-- User Settings (risk preferences)
user_settings (
  user_id uuid PRIMARY KEY REFERENCES profiles(id),
  risk_percent decimal DEFAULT 1.0,
  disclaimer_accepted boolean DEFAULT false,
  preferred_pairs text[],
  created_at timestamptz,
  updated_at timestamptz
)
```

### Row-Level Security (RLS)

All tables have RLS enabled with policies:
```sql
-- Example for broker_connections
CREATE POLICY "Users can only see their own connections"
  ON broker_connections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own connections"
  ON broker_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```


---

## API Surface

### Authentication

```
POST /api/v1/auth/login
  Body: {email, password}
  Returns: {access_token, refresh_token, user}

POST /api/v1/auth/signup
  Body: {email, password, name}
  Returns: {access_token, user}

POST /api/v1/auth/refresh
  Body: {refresh_token}
  Returns: {access_token}
```

### Onboarding

```
GET /api/v1/onboarding/status
  Headers: Authorization: Bearer <JWT>
  Returns: {onboarded: boolean, missing: string[]}

PUT /api/v1/onboarding/brokers
  Headers: Authorization: Bearer <JWT>
  Body: {type, credentials, label}
  Returns: {broker_connection_id}

PUT /api/v1/onboarding/preferences
  Headers: Authorization: Bearer <JWT>
  Body: {risk_percent, disclaimer_accepted, preferred_pairs}
  Returns: {success: true}
```

### Trading

```
POST /api/v1/orders
  Headers: Authorization: Bearer <JWT>
  Body: {broker_connection_id, instrument, side, units, sl?, tp?}
  Returns: {order_id, fill_price, timestamp}

GET /api/v1/positions
  Headers: Authorization: Bearer <JWT>
  Query: ?broker_connection_id=<uuid>
  Returns: [{position_id, instrument, side, units, open_price, current_price, pnl}]

DELETE /api/v1/positions/{position_id}
  Headers: Authorization: Bearer <JWT>
  Query: ?broker_connection_id=<uuid>
  Returns: {closed_price, pnl}

GET /api/v1/account
  Headers: Authorization: Bearer <JWT>
  Query: ?broker_connection_id=<uuid>
  Returns: {balance, equity, margin_used, margin_available}
```

### Market Data

```
GET /api/v1/candles/{instrument}
  Headers: Authorization: Bearer <JWT>
  Query: ?timeframe=H1&count=100
  Returns: [{time, open, high, low, close, volume}]

WS /ws/prices/{instrument}
  Protocol: WebSocket
  Receives: {bid, ask, timestamp}
```

### EA Management

```
GET /api/v1/ea/projects
  Headers: Authorization: Bearer <JWT>
  Returns: [{id, name, strategy_id, created_at}]

POST /api/v1/ea/projects
  Headers: Authorization: Bearer <JWT>
  Body: {name, strategy_id?}
  Returns: {project_id}

POST /api/v1/ea/generate
  Headers: Authorization: Bearer <JWT>
  Body: {project_id, strategy_description}
  Returns: {version_id, source_code}

POST /api/v1/ea/versions/{version_id}/compile
  Headers: Authorization: Bearer <JWT>
  Returns: {job_id}

GET /api/v1/ea/versions/{version_id}/artifacts
  Headers: Authorization: Bearer <JWT>
  Returns: [{artifact_id, kind, download_url}]
```

### Deployment

```
POST /api/v1/deployments
  Headers: Authorization: Bearer <JWT>
  Body: {version_id, agent_id, broker_connection_id, symbol}
  Returns: {deployment_id}

POST /api/v1/deployments/{deployment_id}/run
  Headers: Authorization: Bearer <JWT>
  Returns: {status: 'running'}

POST /api/v1/deployments/{deployment_id}/stop
  Headers: Authorization: Bearer <JWT>
  Returns: {status: 'stopped'}

GET /api/v1/deployments/{deployment_id}/logs
  Headers: Authorization: Bearer <JWT>
  Returns: [{timestamp, level, message}]
```

### MT5 Agent

```
POST /api/v1/agents/pair
  Headers: Authorization: Bearer <JWT>
  Body: {agent_name}
  Returns: {agent_id, pairing_key}

POST /api/v1/agents/{agent_id}/heartbeat
  Headers: X-Agent-Key: <pairing_key>
  Body: {status, metrics}
  Returns: {acknowledged: true}

GET /api/v1/agents/{agent_id}/jobs/next
  Headers: X-Agent-Key: <pairing_key>
  Returns: {job_id, type, payload} | {no_jobs: true}

POST /api/v1/agents/{agent_id}/jobs/{job_id}/result
  Headers: X-Agent-Key: <pairing_key>
  Body: {status, result, logs?}
  Returns: {acknowledged: true}
```


---

## Error Handling

### HTTP Status Codes

```
200 OK                  - Success
201 Created             - Resource created
204 No Content          - Success, no response body
400 Bad Request         - Invalid input
401 Unauthorized        - Invalid/missing JWT
403 Forbidden           - Valid JWT but insufficient permissions
404 Not Found           - Resource doesn't exist
428 Precondition Required - Onboarding not complete
500 Internal Server Error - Server error
503 Service Unavailable - External service down
```

### Error Response Format

```json
{
  "detail": "Human-readable error message",
  "code": "ERROR_CODE",
  "field": "field_name" // optional, for validation errors
}
```

### Common Error Scenarios

#### 1. Invalid JWT
```
Request: GET /api/v1/positions
Headers: Authorization: Bearer invalid_token

Response: 401 Unauthorized
{
  "detail": "Invalid token",
  "code": "INVALID_JWT"
}
```

#### 2. Onboarding Not Complete
```
Request: POST /api/v1/orders
Headers: Authorization: Bearer <valid_jwt>

Response: 428 Precondition Required
{
  "detail": "onboarding_required",
  "code": "ONBOARDING_INCOMPLETE"
}
```

#### 3. Broker Connection Failed
```
Request: POST /api/v1/orders
Body: {broker_connection_id: "...", ...}

Response: 503 Service Unavailable
{
  "detail": "Broker connection failed: timeout",
  "code": "BROKER_UNAVAILABLE"
}
```

#### 4. Insufficient Margin
```
Request: POST /api/v1/orders
Body: {units: 100000, ...}

Response: 400 Bad Request
{
  "detail": "Insufficient margin. Required: $5,000, Available: $1,240",
  "code": "INSUFFICIENT_MARGIN"
}
```

#### 5. Agent Offline
```
Request: POST /api/v1/deployments/{id}/run

Response: 503 Service Unavailable
{
  "detail": "MT5 Agent offline. Last seen: 2026-02-23 10:45:00 UTC",
  "code": "AGENT_OFFLINE"
}
```

### Retry Strategy

**Transient Errors (Retry):**
- 503 Service Unavailable
- Network timeouts
- Broker API rate limits

**Permanent Errors (Don't Retry):**
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found

**Frontend Retry Logic:**
```typescript
async function apiCall(url: string, options: RequestInit, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok) return response;
      
      // Don't retry permanent errors
      if (response.status < 500) throw new Error(await response.text());
      
      // Retry transient errors with exponential backoff
      await sleep(Math.pow(2, i) * 1000);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

### WebSocket Reconnection

```typescript
class PriceWebSocket {
  connect() {
    this.ws = new WebSocket(`ws://backend/ws/prices/${instrument}`);
    
    this.ws.onclose = () => {
      console.log('WebSocket closed, reconnecting...');
      setTimeout(() => this.connect(), 5000); // Reconnect after 5s
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.ws.close(); // Trigger reconnection
    };
  }
}
```

---

## Security Considerations

### 1. JWT Verification
- Every API request verifies JWT signature
- JWT contains `user_id` (sub claim)
- Backend never trusts client-provided user_id

### 2. Credential Encryption
- Broker credentials encrypted at rest in DB
- Supabase handles encryption automatically
- Never log credentials in plaintext

### 3. Row-Level Security (RLS)
- All tables have RLS policies
- Users can only access their own data
- Enforced at database level (not just API)

### 4. Agent Authentication
- Agents use pairing key (HMAC-signed)
- Pairing key never exposed to frontend
- Agent can only access jobs for its user

### 5. Rate Limiting
- API rate limits per user (100 req/min)
- WebSocket connections limited (10 per user)
- Broker API calls throttled to avoid bans

### 6. Input Validation
- All inputs validated with Pydantic models
- SQL injection prevented (parameterized queries)
- XSS prevented (React escapes by default)

---

## Performance Optimizations

### 1. Redis Caching
- Latest prices cached for instant WS connect
- Cache TTL: 5 seconds
- Reduces OANDA API calls

### 2. Database Indexing
```sql
CREATE INDEX idx_broker_connections_user_id ON broker_connections(user_id);
CREATE INDEX idx_ea_versions_project_id ON ea_versions(ea_project_id);
CREATE INDEX idx_jobs_user_id_status ON jobs(user_id, status);
CREATE INDEX idx_trade_events_user_id_created ON trade_events(user_id, created_at DESC);
```

### 3. Connection Pooling
- FastAPI uses connection pool (min: 5, max: 20)
- Supabase client reuses connections
- Redis connection pool (max: 10)

### 4. Lazy Loading
- Frontend loads data on-demand
- Positions table paginated (50 per page)
- EA versions lazy-loaded

### 5. WebSocket Batching
- Price updates batched (max 10/sec)
- Reduces frontend re-renders
- Improves chart performance

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Cloudflare CDN                            │
│                  (SSL, DDoS Protection)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌─────────────────┐            ┌─────────────────┐
│   Frontend      │            │   Backend       │
│   (Vercel)      │            │   (Railway)     │
│                 │            │                 │
│ - Next.js 14   │            │ - FastAPI       │
│ - Static pages │            │ - WebSocket     │
│ - Edge runtime │            │ - Redis         │
└─────────────────┘            └────────┬────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         │                             │
                         ▼                             ▼
                ┌─────────────────┐          ┌─────────────────┐
                │   Supabase      │          │   OANDA API     │
                │                 │          │                 │
                │ - PostgreSQL    │          │ - REST API      │
                │ - Auth          │          │ - Streaming     │
                │ - Storage       │          └─────────────────┘
                └─────────────────┘
                         │
                         │
                         ▼
                ┌─────────────────┐
                │   User's VPS    │
                │                 │
                │ - MT5 Terminal  │
                │ - MT5 Agent     │
                │ - Running EAs   │
                └─────────────────┘
```

---

## Monitoring & Observability

### Metrics to Track

1. **API Performance**
   - Request latency (p50, p95, p99)
   - Error rate by endpoint
   - Requests per second

2. **WebSocket Health**
   - Active connections
   - Messages per second
   - Reconnection rate

3. **Broker API**
   - OANDA API latency
   - Order success rate
   - API error rate

4. **EA Runtime**
   - Active deployments
   - Agent heartbeat failures
   - Compilation success rate

5. **Database**
   - Query latency
   - Connection pool usage
   - RLS policy violations

### Logging Strategy

```python
# Structured logging with context
logger.info(
    "Order placed",
    extra={
        "user_id": user_id,
        "broker": "OANDA",
        "instrument": "EUR/USD",
        "side": "BUY",
        "units": 1000,
        "order_id": order_id
    }
)
```

### Alerting Rules

- API error rate > 5% → Alert
- WebSocket reconnection rate > 10% → Alert
- Agent offline > 10 minutes → Notify user
- Database connection pool exhausted → Alert
- OANDA API rate limit hit → Alert

---

## Development Workflow

### Local Setup

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
pnpm install
pnpm dev
```

### Environment Variables

```bash
# Backend (.env)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
SUPABASE_JWT_SECRET=xxx
OANDA_API_KEY=xxx
OANDA_ACCOUNT_ID=xxx
REDIS_URL=redis://localhost:6379

# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Testing Strategy

1. **Unit Tests** - Individual functions
2. **Integration Tests** - API endpoints
3. **E2E Tests** - Full user flows
4. **Load Tests** - WebSocket performance

---

## Conclusion

This architecture provides:
- ✅ Secure auth with Supabase JWT
- ✅ Multi-broker support (OANDA + MT5)
- ✅ Real-time price streaming
- ✅ AI-powered EA generation (GLM-5)
- ✅ Async job system for compilation/deployment
- ✅ Scalable WebSocket architecture
- ✅ Comprehensive error handling
- ✅ Production-ready monitoring

All components work together holistically to deliver a complete trading platform.
