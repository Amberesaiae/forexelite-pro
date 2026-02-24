# What You Actually Need - Pragmatic Implementation Checklist

**Last Updated**: February 23, 2026  
**Purpose**: Actionable checklist for building ForexElite Pro MVP

---

## Core Value Proposition

**ForexElite Pro = AI EA Code Generation (GLM-5) + TradingView Integration + Multi-Broker Dashboard (MT5-Only)**

---

## Tech Stack (Final Decisions)

### Frontend
- Next.js 14 + TypeScript + Tailwind CSS
- WebSocket for real-time updates
- Supabase client for auth

### Backend
- FastAPI + Python 3.11
- Supabase (PostgreSQL + Auth + Storage)
- Redis (price caching)
- **GLM-5** for EA generation (NOT Claude - 20x cheaper, better agentic capabilities)

### Broker Integration
- **MT5-Only** (universal broker support)
- MT5 Agent (Python script on user's VPS)
- Works with ANY MT5 broker (Exness, IC Markets, XM, OANDA MT5, etc.)

### AI Integration
- **GLM-5** as primary model ($0.015 per EA vs $0.35 for Claude)
- Clear Thought MCPs for reasoning quality (Sequential Thinking, Mental Models, Collaborative Reasoning)
- LangGraph optional (start simple, add later if needed)

---

## Phase 1: MVP (Month 1-2)

### Week 1-2: Foundation

**Backend Setup:**
- [ ] FastAPI project structure
- [ ] Supabase connection (PostgreSQL + Auth)
- [ ] JWT verification middleware
- [ ] Database schema migration
- [ ] RLS policies
- [ ] Redis connection

**Frontend Setup:**
- [ ] Next.js 14 project
- [ ] Tailwind CSS + design system
- [ ] Supabase auth integration
- [ ] Layout components (Navigation, Footer)

**Deliverable:** Auth flow working (login/signup)


### Week 3-4: Onboarding Flow

**Backend:**
- [ ] `POST /api/v1/onboarding/brokers` - Connect MT5 account
- [ ] `PUT /api/v1/onboarding/preferences` - Risk settings + disclaimer
- [ ] `GET /api/v1/onboarding/status` - Check completion

**Frontend:**
- [ ] `/onboarding` page
- [ ] Step 1: Connect MT5 account form
- [ ] Step 2: Risk preferences + disclaimer
- [ ] Progress indicator
- [ ] Redirect to dashboard on completion

**MT5 Agent:**
- [ ] Python script for agent
- [ ] Pairing flow (generate pairing key)
- [ ] Heartbeat endpoint
- [ ] Job polling (every 30 seconds)

**Deliverable:** User can connect MT5 account and complete onboarding

---

### Week 5-6: EA Generator (GLM-5)

**Backend:**
- [ ] GLM-5 API integration
- [ ] `POST /api/v1/ea/generate` - Generate MQL5 code
- [ ] `POST /api/v1/ea/projects` - Create EA project
- [ ] `GET /api/v1/ea/projects` - List projects
- [ ] Supabase Storage for .mq5 files

**Frontend:**
- [ ] `/dashboard/ea` page
- [ ] EA Generator UI (matches artefact)
- [ ] Strategy description textarea
- [ ] Template selector dropdown
- [ ] Code preview with syntax highlighting
- [ ] Download .mq5 button

**Deliverable:** User can generate MQL5 code from natural language

---

### Week 7-8: Basic Dashboard

**Backend:**
- [ ] `POST /api/v1/orders` - Place order
- [ ] `GET /api/v1/positions` - Get positions
- [ ] `DELETE /api/v1/positions/{id}` - Close position
- [ ] `GET /api/v1/account` - Get balance/equity
- [ ] `GET /api/v1/candles/{instrument}` - Historical data
- [ ] WebSocket `/ws/prices/{instrument}` - Real-time prices

**Frontend:**
- [ ] `/dashboard` page (matches artefact)
- [ ] Top bar (broker selector, instrument, price, balance)
- [ ] Price chart (TradingView widget or Canvas)
- [ ] Order panel (Buy/Sell, lot size, SL/TP, risk calculator)
- [ ] Positions table (live P&L updates)
- [ ] WebSocket connection for prices

**Deliverable:** User can place orders and see positions in real-time

---

## Phase 2: TradingView Integration (Month 2-3)

### Week 9-10: Webhook Receiver

**Backend:**
- [ ] `POST /api/v1/webhooks/tradingview` - Receive alerts
- [ ] Signal validation (check user exists, broker connected)
- [ ] Create job for MT5 Agent
- [ ] Store signal in `trade_signals` table

**MT5 Agent:**
- [ ] Poll for webhook jobs
- [ ] Execute trade on MT5 terminal
- [ ] Report result back to backend

**Frontend:**
- [ ] `/dashboard/signals` page
- [ ] Signal history table
- [ ] Execution status (pending, executed, failed)
- [ ] Performance metrics (win rate, avg P&L)

**Deliverable:** TradingView alerts execute trades on MT5

---

### Week 11-12: Signal Management

**Backend:**
- [ ] `GET /api/v1/signals` - List signals
- [ ] `GET /api/v1/signals/{id}` - Signal details
- [ ] `POST /api/v1/signals/{id}/disable` - Disable signal

**Frontend:**
- [ ] Signal configuration UI
- [ ] Enable/disable signals
- [ ] Edit signal parameters
- [ ] Test signal (dry run)

**Deliverable:** User can manage TradingView signals

---

## Phase 3: Advanced Features (Month 3-4)

### Week 13-14: EA Compilation & Deployment

**Backend:**
- [ ] `POST /api/v1/ea/versions/{id}/compile` - Create compile job
- [ ] `POST /api/v1/deployments` - Deploy EA to MT5
- [ ] `POST /api/v1/deployments/{id}/run` - Start EA
- [ ] `POST /api/v1/deployments/{id}/stop` - Stop EA
- [ ] `GET /api/v1/deployments/{id}/logs` - Get EA logs

**MT5 Agent:**
- [ ] Compile .mq5 to .ex5 (MQL5 compiler)
- [ ] Copy .ex5 to MT5/Experts/ folder
- [ ] Start/stop EA via MT5 API
- [ ] Monitor EA status (heartbeat)

**Frontend:**
- [ ] EA deployment UI
- [ ] Select agent + broker + symbol
- [ ] Start/stop buttons
- [ ] Status indicator (running, stopped, error)
- [ ] Logs viewer

**Deliverable:** User can deploy and run EAs on MT5

---

### Week 15-16: Multi-Account Dashboard

**Backend:**
- [ ] Aggregate positions across all broker connections
- [ ] Calculate total equity, P&L, margin
- [ ] Risk metrics (daily loss, weekly drawdown)

**Frontend:**
- [ ] Multi-account view
- [ ] Account selector (switch between accounts)
- [ ] Aggregate metrics dashboard
- [ ] Risk management alerts

**Deliverable:** User can monitor all MT5 accounts in one place

---

## Testing Checklist

### Unit Tests
- [ ] Auth middleware
- [ ] Order placement logic
- [ ] Position P&L calculation
- [ ] GLM-5 code generation
- [ ] Signal validation

### Integration Tests
- [ ] Auth flow (login → dashboard)
- [ ] Onboarding flow (connect broker → preferences)
- [ ] Order flow (place → fill → close)
- [ ] EA generation flow (generate → download)
- [ ] Webhook flow (TradingView → MT5)

### E2E Tests
- [ ] Complete user journey (signup → onboarding → trade → EA generation)
- [ ] Multi-account setup
- [ ] EA deployment

---

## Deployment Checklist

### Infrastructure
- [ ] Vercel project (frontend)
- [ ] Railway project (backend)
- [ ] Supabase project (database)
- [ ] Redis instance
- [ ] Cloudflare CDN

### Environment Variables
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SUPABASE_JWT_SECRET`
- [ ] `GLM5_API_KEY`
- [ ] `REDIS_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_API_URL`

### Monitoring
- [ ] Sentry (error tracking)
- [ ] LogRocket (session replay)
- [ ] Uptime monitoring (Pingdom)
- [ ] API performance (New Relic)

---

## Cost Estimates

### Development (4 months)
- 1 Senior Full-Stack Dev: $20k/month × 4 = **$80k**

### Monthly Operational Costs
- Vercel (Frontend): $20/month
- Railway (Backend): $50/month
- Supabase (Database): $25/month
- Redis: $10/month
- GLM-5 API: $15/month (100 EA generations at $0.015 each)
- **Total: $120/month** (vs $205/month with Claude)

### Per-User Costs
- EA Generation: **$0.015 per EA** (GLM-5) vs $0.35 (Claude) = **20x cheaper**
- Storage: $0.01/GB/month (Supabase)

---

## Revenue Model

### Freemium
- **Free Tier:** 5 EA generations/month, 1 MT5 account
- **Pro Tier:** $29/month - Unlimited EAs, 5 MT5 accounts, TradingView integration
- **Team Tier:** $99/month - 10 users, priority support

### Target
- 1,000 Pro users = $29k/month
- Break even at ~150 Pro users

---

## Success Metrics

### Week 4
- [ ] 10 users completed onboarding
- [ ] 5 MT5 accounts connected

### Week 8
- [ ] 50 users on platform
- [ ] 100 EAs generated
- [ ] 500 orders placed

### Week 12
- [ ] 200 users on platform
- [ ] 50 TradingView signals configured
- [ ] 1,000 trades executed

### Week 16 (MVP Complete)
- [ ] 500 users on platform
- [ ] 100 paying Pro users ($2,900 MRR)
- [ ] 50 active EAs deployed
- [ ] 5,000 trades executed

---

## What NOT to Build

### ❌ Demo Accounts
- MT5 brokers provide free demo accounts

### ❌ Strategy Tester / Backtesting
- MT5 has built-in Strategy Tester

### ❌ Signals Marketplace
- MT5 has MQL5 Market

### ❌ Mobile App
- MT5 has native iOS/Android apps

### ❌ Chart Analysis Tools
- MT5 has 30+ indicators built-in

---

## Key Decisions Summary

1. **AI Model:** GLM-5 (not Claude) - 20x cheaper, better agentic capabilities
2. **Broker Integration:** MT5-Only (not OANDA REST) - universal, simpler
3. **Architecture:** Start simple (no LangGraph initially), add complexity later
4. **Monitoring:** Rule-based (not AI) - drawdown thresholds, consecutive losses
5. **Focus:** AI EA generation + TradingView integration + Multi-broker dashboard

---

## Next Steps

1. Read `SYSTEM_ARCHITECTURE.md` for complete dataflow
2. Read `FRONTEND_IMPLEMENTATION_GUIDE.md` for UI component breakdown
3. Read `BACKEND_API_SPECIFICATION.md` for API contracts
4. Start with Phase 1, Week 1-2 (Foundation)
5. Ship MVP in 2 months, iterate based on user feedback
