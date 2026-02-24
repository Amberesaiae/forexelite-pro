# ForexElite Pro — Fresh Start Implementation Guide
**Version 1.0 · February 2026 · Clean Slate Approach**

---

## Table of Contents

1. [Project Status](#project-status)
2. [What We Kept](#what-we-kept)
3. [What We Deleted](#what-we-deleted)
4. [Canonical Documentation](#canonical-documentation)
5. [Week 1: Foundation Setup](#week-1-foundation-setup)
6. [Week 2: Onboarding Flow](#week-2-onboarding-flow)
7. [Week 3-4: EA Generator](#week-3-4-ea-generator)
8. [Implementation Checklist](#implementation-checklist)

---

## Project Status

**Date:** February 23, 2026  
**Status:** Fresh Start — All implementations deleted, documentation preserved  
**Backup Location:** `_archive/backup_20260223/`

### Decision Made
- **Approach:** Hybrid (keep docs + schema, rebuild everything else)
- **Reason:** Existing code didn't follow UI/UX spec, faster to rebuild correctly
- **Timeline:** 8-12 weeks to MVP

---

## What We Kept

### Documentation (Canonical References)
```
artefacts/
├── FOREXELITE_UIUX_SPEC.md              ← PRIMARY UI/UX REFERENCE (1,591 lines)
├── BACKEND_API_SPECIFICATION.md          ← API contracts with examples
├── SYSTEM_ARCHITECTURE.md                ← Complete dataflow diagrams
├── FRONTEND_IMPLEMENTATION_GUIDE.md      ← ASCII diagrams for 7 pages
├── WHAT_YOU_ACTUALLY_NEED.md            ← Pragmatic 16-week checklist
├── EA_CODE_GENERATION_TECHNICAL_RESEARCH.md
├── MT5_INTEGRATION_SIMPLIFICATION.md
├── IMPLEMENTATION_ROADMAP.md
├── supabase_schema_migration.sql         ← Database schema
├── forexelite-dashboard-v2.html          ← Visual mockup
└── ForexElite_MVP_Checklist.docx
```

### Configuration Files
```
.env.example                              ← Environment template
.gitignore                                ← Git ignore rules
docker-compose.yml                        ← Docker setup
supabase_schema_migration.sql            ← Database schema
setup_supabase.py                         ← Database setup script
```

---

## What We Deleted

### Frontend (Completely Removed)
```
❌ frontend/app/                          ← All pages (dashboard, login, etc.)
❌ frontend/components/                   ← All components
❌ frontend/hooks/                        ← All custom hooks
❌ frontend/lib/                          ← All utilities
❌ frontend/.next/                        ← Build artifacts
❌ frontend/node_modules/                 ← Dependencies
```

**Reason:** Didn't follow UI/UX spec design system, no shadcn/ui, wrong state management

### Backend (Completely Removed)
```
❌ backend/app/                           ← All API routes
❌ backend/tests/                         ← All tests
❌ backend/requirements.txt               ← Dependencies
❌ backend/Dockerfile                     ← Docker config
```

**Reason:** Mock implementations, no GLM-5 integration, no MT5 Agent

---

## Canonical Documentation

### Primary References (Read These First)

#### 1. UI/UX Specification
**File:** `artefacts/FOREXELITE_UIUX_SPEC.md` (1,591 lines)

**What it contains:**
- Technology decision (shadcn/ui selective adoption)
- Complete design system (tokens, colors, typography)
- Application architecture (folder structure, state management)
- 10 complete page specifications:
  - Page 00: Auth (Login/Signup)
  - Page 01: Onboarding Wizard (3 steps)
  - Page 02: Overview Dashboard
  - Page 03: Live Trading
  - Page 04: Positions
  - Page 05: TV Signals
  - Page 06: EA Studio (3 tabs)
  - Page 07: Deployments
  - Page 08: Account
  - Page 09: Settings
- Animation & motion system
- Responsive strategy (mobile/tablet/desktop)
- Error states & empty states
- Accessibility checklist (WCAG 2.1 AA)
- Component decision matrix

**Key Decisions:**
```
✓ shadcn/ui for: Dialog, Tabs, Toast, Form, Select, Sheet
✗ shadcn/ui NOT for: Charts (TradingView LC), Editor (Monaco), Tables (TanStack)
✓ State: Zustand (client) + TanStack Query (server)
✓ Charts: TradingView Lightweight Charts
✓ Editor: Monaco Editor (VS Code engine)
✓ Fonts: Bebas Neue (display), DM Sans (body), JetBrains Mono (code)
✓ Colors: Gold (#C9A84C) + Dark theme
```

#### 2. Backend API Specification
**File:** `artefacts/BACKEND_API_SPECIFICATION.md`

**What it contains:**
- Complete API contracts for all endpoints
- Request/response examples
- Authentication flow
- Error handling patterns
- WebSocket specifications

#### 3. System Architecture
**File:** `artefacts/SYSTEM_ARCHITECTURE.md`

**What it contains:**
- Complete dataflow diagrams
- Component interactions
- Auth flow
- Real-time data flow
- Database schema relationships

#### 4. What You Actually Need
**File:** `artefacts/WHAT_YOU_ACTUALLY_NEED.md`

**What it contains:**
- Pragmatic 16-week implementation checklist
- What NOT to build (MT5 already has it)
- Focus areas: AI EA generation + TradingView webhooks + Multi-broker dashboard
- Cost estimates and break-even analysis

---

## Week 1: Foundation Setup

### Day 1-2: Frontend Foundation

#### Step 1: Initialize Next.js 14 Project
```bash
# Create fresh Next.js project
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir

# Navigate to frontend
cd frontend

# Install core dependencies
pnpm add zustand @tanstack/react-query @tanstack/react-query-devtools
pnpm add @supabase/supabase-js
pnpm add lightweight-charts
pnpm add framer-motion
pnpm add zod react-hook-form @hookform/resolvers
pnpm add nuqs

# Install shadcn/ui CLI
pnpm add -D @shadcn/ui

# Initialize shadcn/ui
npx shadcn-ui@latest init
```

**shadcn/ui configuration:**
```
✓ TypeScript: Yes
✓ Style: Default
✓ Base color: Slate
✓ CSS variables: Yes
✓ Tailwind config: Yes
✓ Components: @/components
✓ Utils: @/lib/utils
✓ React Server Components: Yes
```

#### Step 2: Install shadcn/ui Components
```bash
# Install required components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add select
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add alert-dialog
npx shadcn-ui@latest add tooltip
```

#### Step 3: Create Design System
```bash
# Create styles directory
mkdir -p app/styles

# Create token files
touch app/styles/tokens.css
touch app/styles/shadcn-theme.css
```

**File:** `app/styles/tokens.css`
```css
:root {
  /* Gold Palette */
  --gold:        #C9A84C;
  --gold-lt:     #E8C97A;
  --gold-dim:    #7A6130;
  --gold-glow:   rgba(201,168,76,0.12);
  
  /* Dark Backgrounds */
  --bg-void:     #020509;
  --bg-deep:     #040810;
  --bg-base:     #070D1B;
  --bg-card:     #090F1E;
  --bg-panel:    #0C1525;
  --bg-border:   #131E32;
  --bg-hover:    #111929;
  
  /* Text Colors */
  --text-prime:  #EEF2FF;
  --text-sec:    #8899BB;
  --text-dim:    #3F5070;
  
  /* Semantic Colors */
  --green:       #00E5A0;
  --green-dim:   #003D2B;
  --red:         #FF4560;
  --red-dim:     #3D0F18;
  --blue:        #3D85FF;
  
  /* Typography */
  --font-display: 'Bebas Neue', sans-serif;
  --font-sans:    'DM Sans', sans-serif;
  --font-mono:    'JetBrains Mono', monospace;
  
  /* Layout */
  --sidebar-w:   220px;
  --topbar-h:    54px;
  --radius:      6px;
  --radius-lg:   10px;
}
```

**File:** `app/styles/shadcn-theme.css`
```css
@layer base {
  :root {
    --background:    var(--bg-base);
    --foreground:    var(--text-prime);
    --card:          var(--bg-card);
    --card-foreground: var(--text-prime);
    --primary:       var(--gold);
    --primary-foreground: var(--bg-deep);
    --secondary:     var(--bg-panel);
    --muted:         var(--bg-panel);
    --muted-foreground: var(--text-sec);
    --border:        var(--bg-border);
    --input:         var(--bg-panel);
    --ring:          var(--gold-dim);
    --destructive:   var(--red);
    --radius:        0.375rem;
  }
}
```

#### Step 4: Set Up Folder Structure
```bash
# Create folder structure
mkdir -p app/(auth)/login
mkdir -p app/(auth)/signup
mkdir -p app/onboarding
mkdir -p app/dashboard
mkdir -p components/ui
mkdir -p components/charts
mkdir -p components/layout
mkdir -p components/trading
mkdir -p components/ea
mkdir -p components/shared
mkdir -p lib
mkdir -p hooks
mkdir -p store
```

#### Step 5: Create Zustand Stores
**File:** `store/priceStore.ts`
```typescript
import { create } from 'zustand';

interface Tick {
  bid: number;
  ask: number;
  ts: string;
  flash: 'up' | 'dn' | null;
}

interface PriceState {
  prices: Record<string, Tick>;
  update: (pair: string, tick: Omit<Tick, 'flash'>) => void;
}

export const usePriceStore = create<PriceState>((set) => ({
  prices: {},
  update: (pair, tick) => set((state) => {
    const prev = state.prices[pair];
    const flash = prev ? (tick.bid > prev.bid ? 'up' : tick.bid < prev.bid ? 'dn' : null) : null;
    
    return {
      prices: {
        ...state.prices,
        [pair]: { ...tick, flash }
      }
    };
  }),
}));
```

**File:** `store/uiStore.ts`
```typescript
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
}));
```

#### Step 6: Create API Client
**File:** `lib/api.ts`
```typescript
import { createClient } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(session?.access_token && {
      Authorization: `Bearer ${session.access_token}`,
    }),
    ...options.headers,
  };
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (response.status === 401) {
    // Token refresh logic here
    const { data: { session: newSession } } = await supabase.auth.refreshSession();
    if (newSession) {
      // Retry with new token
      return apiClient(endpoint, options);
    }
    // Redirect to login
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  
  if (response.status === 428) {
    // Onboarding required
    window.location.href = '/onboarding';
    throw new Error('Onboarding required');
  }
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  return response.json();
}
```

**File:** `lib/supabase.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Day 3-4: Backend Foundation

#### Step 1: Initialize FastAPI Project
```bash
# Create backend directory
mkdir backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Create requirements.txt
cat > requirements.txt << EOF
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-dotenv==1.0.0
supabase==2.3.0
pydantic==2.5.3
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
websockets==12.0
redis==5.0.1
httpx==0.26.0
EOF

# Install dependencies
pip install -r requirements.txt
```

#### Step 2: Create Backend Structure
```bash
mkdir -p app/api/routes
mkdir -p app/core
mkdir -p app/services
mkdir -p app/models
mkdir -p app/ws
touch app/__init__.py
touch app/api/__init__.py
touch app/api/routes/__init__.py
touch app/core/__init__.py
touch app/services/__init__.py
touch app/models/__init__.py
touch app/ws/__init__.py
```

#### Step 3: Create Core Configuration
**File:** `app/core/config.py`
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "ForexElite Pro API"
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_JWT_SECRET: str
    
    # GLM-5
    GLM5_API_KEY: str
    GLM5_API_URL: str = "https://open.bigmodel.cn/api/paas/v4"
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

**File:** `app/core/auth.py`
```python
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.config import settings

security = HTTPBearer()

async def verify_token(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> dict:
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

#### Step 4: Create Main Application
**File:** `app/main.py`
```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# WebSocket endpoint placeholder
@app.websocket("/ws/prices/{instrument}")
async def websocket_prices(websocket, instrument: str):
    await websocket.accept()
    # Implementation in Week 2
    await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Day 5: Testing & Integration

#### Test Checklist
```
□ Frontend dev server runs: pnpm dev
□ Backend dev server runs: uvicorn app.main:app --reload
□ Supabase connection works
□ Design tokens applied correctly
□ shadcn/ui components render
□ Zustand stores work
□ API client can make requests
```

---

## Week 2: Onboarding Flow

### Implementation Tasks

#### Frontend: Onboarding Pages
```
□ Create app/onboarding/page.tsx
□ Build 3-step wizard component
□ Implement step indicator
□ Create MT5 connection form
□ Create risk preferences form
□ Create disclaimer form
□ Add form validation (Zod)
□ Add progress persistence
```

#### Backend: Onboarding Endpoints
```
□ POST /api/v1/onboarding/brokers
□ PUT /api/v1/onboarding/preferences
□ GET /api/v1/onboarding/status
□ Add onboarding gate middleware
□ Test MT5 connection (stub)
```

---

## Week 3-4: EA Generator

### Implementation Tasks

#### Frontend: EA Studio
```
□ Create app/dashboard/ea/page.tsx
□ Build 3-tab interface (Generate, Editor, Library)
□ Integrate Monaco Editor
□ Create EA Library grid
□ Implement file locking system
□ Add compile/deploy dialogs
```

#### Backend: GLM-5 Integration
```
□ Create app/services/ea_generator.py
□ POST /api/v1/ea/generate
□ POST /api/v1/ea/projects
□ GET /api/v1/ea/projects
□ POST /api/v1/ea/versions
□ POST /api/v1/ea/versions/{id}/compile
□ POST /api/v1/deployments
```

---

## Implementation Checklist

### Phase 1: Foundation (Week 1)
- [x] Delete all existing implementations
- [x] Consolidate documentation in artefacts/
- [ ] Initialize Next.js 14 project
- [ ] Install shadcn/ui components
- [ ] Create design system (tokens.css)
- [ ] Set up Zustand stores
- [ ] Create API client
- [ ] Initialize FastAPI backend
- [ ] Create core configuration
- [ ] Test end-to-end connection

### Phase 2: Authentication (Week 1-2)
- [ ] Build login page
- [ ] Build signup page
- [ ] Implement Supabase auth
- [ ] Add JWT token handling
- [ ] Test auth flow

### Phase 3: Onboarding (Week 2)
- [ ] Build 3-step wizard
- [ ] Implement MT5 connection
- [ ] Implement risk preferences
- [ ] Implement disclaimer
- [ ] Add onboarding gate
- [ ] Test complete flow

### Phase 4: Dashboard (Week 2-3)
- [ ] Build dashboard layout
- [ ] Add sidebar navigation
- [ ] Add topbar with ticker
- [ ] Create stat cards
- [ ] Integrate TradingView charts
- [ ] Add WebSocket price feed

### Phase 5: EA Generator (Week 3-4)
- [ ] Build EA Studio UI
- [ ] Integrate Monaco Editor
- [ ] Connect GLM-5 API
- [ ] Implement code generation
- [ ] Add compile functionality
- [ ] Add deploy functionality

---

## Next Steps

1. **Start Week 1 Implementation**
   - Initialize Next.js project
   - Install dependencies
   - Create design system

2. **Set Up Development Environment**
   - Install Node.js (if not installed)
   - Install Python 3.11+
   - Set up Supabase project
   - Get GLM-5 API key

3. **Follow This Guide**
   - Complete each week sequentially
   - Test after each major milestone
   - Refer to UI/UX spec for details

---

*This guide is your roadmap. Follow it step by step, and you'll have a production-ready MVP in 8-12 weeks.*
