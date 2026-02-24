# ForexElite Pro - Documentation Index

**Last Updated**: February 23, 2026  
**Purpose**: Navigation guide for all project documentation

---

## 📋 Quick Start

**New to the project?** Read these 3 docs in order:

1. **[WHAT_YOU_ACTUALLY_NEED.md](./WHAT_YOU_ACTUALLY_NEED.md)** - Pragmatic implementation checklist with week-by-week tasks
2. **[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)** - Complete system overview with dataflows and ASCII diagrams
3. **[BACKEND_API_SPECIFICATION.md](./BACKEND_API_SPECIFICATION.md)** - API contracts with request/response examples

---

## 🎯 Core Documentation (The 3 Vivid Docs)

### 1. Implementation Checklist
**File:** `WHAT_YOU_ACTUALLY_NEED.md`  
**Purpose:** Week-by-week actionable tasks for building MVP  
**Read this when:** Starting development, planning sprints

**Key Sections:**
- Tech stack decisions (GLM-5, MT5-Only, etc.)
- Phase 1-3 breakdown (16 weeks)
- Testing & deployment checklists
- Cost estimates & revenue model
- Success metrics

---

### 2. System Architecture
**File:** `SYSTEM_ARCHITECTURE.md`  
**Purpose:** Complete technical architecture with dataflows  
**Read this when:** Understanding how components interact

**Key Sections:**
- Component map (frontend, backend, external services)
- Auth flow (JWT lifecycle)
- 7 core data flows with ASCII diagrams
- Database schema with RLS policies
- API surface overview
- Error handling & security
- Performance optimizations

---

### 3. Backend API Specification
**File:** `BACKEND_API_SPECIFICATION.md`  
**Purpose:** Complete API contracts with examples  
**Read this when:** Implementing frontend or backend endpoints

**Key Sections:**
- Authentication endpoints
- Onboarding flow
- Trading operations (orders, positions, account)
- Market data (candles, WebSocket)
- EA management (generate, compile, deploy)
- MT5 Agent communication
- Error codes & rate limits

---

## 📚 Supporting Documentation

### Frontend Implementation
**File:** `FRONTEND_IMPLEMENTATION_GUIDE.md`  
**Purpose:** UI component breakdown matching artefact  
**Read this when:** Building frontend components

**Key Sections:**
- Design system (colors, typography, patterns)
- Page structure (landing, dashboard)
- Component breakdown with code examples
- State management patterns
- Real-time features (WebSocket)

---

### Research & Decisions

#### AI Agent Frameworks
**File:** `AI_AGENT_FRAMEWORKS_RESEARCH.md`  
**Key Findings:**
- GLM-5 chosen as primary model (20x cheaper than Claude)
- Better agentic capabilities (77.8% SWE-bench)
- LangGraph optional for MVP
- Clear Thought MCPs for reasoning quality

#### MT5 Broker Research
**File:** `MT5_BROKER_RESEARCH.md`  
**Key Findings:**
- ANY MT5 broker works (Exness, IC Markets, XM, etc.)
- Demo accounts are FREE
- MT5-only architecture is simpler and universal

#### TradingView Integration
**File:** `TRADINGVIEW_INTEGRATION_RESEARCH.md`  
**Key Findings:**
- Webhook receiver approach (custom backend)
- TradingView Pro required ($14.95/month)
- JSON alert format with full control

#### EA Code Generation
**File:** `EA_CODE_GENERATION_TECHNICAL_RESEARCH.md`  
**Key Findings:**
- GLM-5 best for agentic engineering
- EA31337-classes framework (most mature)
- Event-driven state machine architecture

#### Competitive Analysis
**File:** `COMPETITIVE_ANALYSIS_AND_RECOMMENDATIONS.md`  
**Key Findings:**
- Don't build what MT5 already has
- Focus on AI generation + TradingView + Multi-broker dashboard

---

### Project Context

#### Deviation Proof
**File:** `DEVIATION_PROOF.md`  
**Purpose:** Evidence-based comparison of artefact vs specs  
**Key Finding:** Artefact has MORE features than specs (not lean)

#### Specs to Artefact Improvements
**File:** `SPECS_TO_ARTEFACT_IMPROVEMENTS.md`  
**Purpose:** Features from specs that improve artefact  
**Key Improvements:** Onboarding, Multi-Broker, EA Deployment, Library

---

## 🗂️ Specifications

### Epic Brief
**File:** `specs/Epic_Brief_—_ForexElite_Pro__Canonical_&_Pragmatic_Rebuild.md`  
**Purpose:** Original product vision and requirements

### Tech Plan
**File:** `specs/Tech_Plan_—_ForexElite_Pro__Canonical_&_Pragmatic_Rebuild.md`  
**Purpose:** Original technical specifications (now updated to MT5-only)

### Core Flows
**File:** `specs/Core_Flows_—_ForexElite_Pro.md`  
**Purpose:** User flows with wireframes

---

## 🎨 Design Artefacts

### HTML Mockup
**File:** `artefacts/remixed-69b6f0e6.html`  
**Purpose:** Complete UI mockup with all features  
**Includes:**
- Landing page with hero, ticker, stats
- Signal generator with controls
- Trading sessions cards
- Risk management calculators
- Strategy library (47+ strategies)
- EA code generator
- Broker connection form
- Currency pairs table

---

## 📊 Implementation Roadmap

### Phase 1: MVP (Month 1-2)
- Week 1-2: Foundation (auth, database)
- Week 3-4: Onboarding (MT5 connection)
- Week 5-6: EA Generator (GLM-5)
- Week 7-8: Basic Dashboard (trading)

### Phase 2: TradingView (Month 2-3)
- Week 9-10: Webhook receiver
- Week 11-12: Signal management

### Phase 3: Advanced (Month 3-4)
- Week 13-14: EA compilation & deployment
- Week 15-16: Multi-account dashboard

---

## 🔑 Key Decisions

### Technology
- **AI Model:** GLM-5 (not Claude) - 20x cheaper, better agentic
- **Broker:** MT5-Only (not OANDA REST) - universal, simpler
- **Architecture:** Start simple, add LangGraph later if needed
- **Monitoring:** Rule-based (not AI) - drawdown thresholds

### What NOT to Build
- ❌ Demo accounts (MT5 provides)
- ❌ Strategy tester (MT5 has built-in)
- ❌ Signals marketplace (MQL5 Market)
- ❌ Mobile app (MT5 native apps)
- ❌ Chart tools (MT5 has 30+ indicators)

### Focus Areas
- ✅ AI EA code generation (GLM-5)
- ✅ TradingView webhook integration
- ✅ Multi-broker dashboard (MT5-only)

---

## 💰 Cost & Revenue

### Development
- 4 months × $20k/month = **$80k**

### Monthly Operational
- Infrastructure: $105/month
- GLM-5 API: $15/month (100 EAs)
- **Total: $120/month**

### Revenue Model
- Free: 5 EAs/month, 1 MT5 account
- Pro: $29/month - Unlimited EAs, 5 accounts
- Team: $99/month - 10 users
- **Break even: 150 Pro users**

---

## 🎯 Success Metrics

### Week 4
- 10 users onboarded
- 5 MT5 accounts connected

### Week 8
- 50 users
- 100 EAs generated
- 500 orders placed

### Week 16 (MVP Complete)
- 500 users
- 100 paying Pro users ($2,900 MRR)
- 50 active EAs deployed

---

## 📖 Reading Order by Role

### Product Manager
1. WHAT_YOU_ACTUALLY_NEED.md
2. COMPETITIVE_ANALYSIS_AND_RECOMMENDATIONS.md
3. specs/Epic_Brief_—_ForexElite_Pro__Canonical_&_Pragmatic_Rebuild.md

### Backend Developer
1. SYSTEM_ARCHITECTURE.md
2. BACKEND_API_SPECIFICATION.md
3. AI_AGENT_FRAMEWORKS_RESEARCH.md

### Frontend Developer
1. FRONTEND_IMPLEMENTATION_GUIDE.md
2. artefacts/remixed-69b6f0e6.html
3. specs/Core_Flows_—_ForexElite_Pro.md

### Full-Stack Developer
1. WHAT_YOU_ACTUALLY_NEED.md
2. SYSTEM_ARCHITECTURE.md
3. BACKEND_API_SPECIFICATION.md
4. FRONTEND_IMPLEMENTATION_GUIDE.md

---

## 🚀 Getting Started

1. **Read the 3 core docs** (WHAT_YOU_ACTUALLY_NEED, SYSTEM_ARCHITECTURE, BACKEND_API_SPECIFICATION)
2. **Review the artefact** (artefacts/remixed-69b6f0e6.html) to see the target UI
3. **Start with Phase 1, Week 1-2** (Foundation setup)
4. **Follow the checklist** in WHAT_YOU_ACTUALLY_NEED.md
5. **Ship MVP in 2 months**, iterate based on feedback

---

## 📝 Document Status

| Document | Status | Last Updated |
|----------|--------|--------------|
| WHAT_YOU_ACTUALLY_NEED.md | ✅ Complete | 2026-02-23 |
| SYSTEM_ARCHITECTURE.md | ✅ Complete | 2026-02-23 |
| BACKEND_API_SPECIFICATION.md | ✅ Complete | 2026-02-23 |
| FRONTEND_IMPLEMENTATION_GUIDE.md | 🚧 In Progress | 2026-02-23 |
| AI_AGENT_FRAMEWORKS_RESEARCH.md | ✅ Complete | 2026-02-23 |
| MT5_BROKER_RESEARCH.md | ✅ Complete | 2026-02-23 |
| TRADINGVIEW_INTEGRATION_RESEARCH.md | ✅ Complete | 2026-02-23 |
| EA_CODE_GENERATION_TECHNICAL_RESEARCH.md | ✅ Complete | 2026-02-23 |

---

**All documentation aligns with the artefact folder and uses MT5-only architecture.**
