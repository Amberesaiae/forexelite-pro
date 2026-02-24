# ForexElite Pro — UI/UX Architecture Specification
**Version 2.0 · February 2026 · Next.js 14 + TypeScript + Tailwind CSS**

---

## Table of Contents

1. [Technology Decision — Should We Use shadcn/ui?](#1-technology-decision)
2. [Design System](#2-design-system)
3. [Application Architecture](#3-application-architecture)
4. [Global Data Layer & State](#4-global-data-layer--state)
5. [Page 00 — Auth (Login / Signup)](#5-page-00--auth)
6. [Page 01 — Onboarding Wizard](#6-page-01--onboarding-wizard)
7. [Page 02 — Overview Dashboard](#7-page-02--overview-dashboard)
8. [Page 03 — Live Trading](#8-page-03--live-trading)
9. [Page 04 — Positions](#9-page-04--positions)
10. [Page 05 — TV Signals](#10-page-05--tv-signals)
11. [Page 06 — EA Studio](#11-page-06--ea-studio)
12. [Page 07 — Deployments](#12-page-07--deployments)
13. [Page 08 — Account](#13-page-08--account)
14. [Page 09 — Settings](#14-page-09--settings)
15. [Animation & Motion System](#15-animation--motion-system)
16. [Responsive Strategy](#16-responsive-strategy)
17. [Error States & Empty States](#17-error-states--empty-states)
18. [Accessibility](#18-accessibility)

---

## 1. Technology Decision

### Should We Use shadcn/ui?

**Yes — with selective adoption.** Here is the canonical reasoning.

#### What shadcn/ui Actually Is

shadcn/ui is not a component library in the traditional sense. It is a **code-ownership model**: you run `npx shadcn-ui add button` and the source code is copied directly into your `components/ui/` directory. You own it. No runtime dependency, no version lock-in, no bundle bloat from unused components.

```
Traditional library:          shadcn/ui model:
  node_modules/radix-ui         src/components/ui/button.tsx  ← you own it
  node_modules/mui              src/components/ui/dialog.tsx  ← customise freely
  node_modules/chakra           src/components/ui/table.tsx   ← zero abstraction cost
       ↓                                 ↓
  runtime overhead              zero runtime overhead
  version conflicts             no version conflicts
  limited customisation         infinite customisation
```

#### The Case FOR shadcn/ui in This Project

| Concern | Answer |
|---|---|
| **Radix UI primitives** | Dialogs, dropdowns, tooltips, popovers are notoriously hard to build accessibly. shadcn gives you battle-tested Radix primitives free. |
| **Design token alignment** | shadcn uses CSS variables natively — maps perfectly to our gold/dark token system. |
| **Tailwind native** | No separate styling system to reconcile. |
| **Trading-specific components** | The raw unstyled parts (Select, Dialog, Tabs, Tooltip) are exactly what a trading dashboard needs. |
| **Custom aesthetic** | Because you own the source, every component can be restyled to our dark/gold theme precisely. |

#### The Case AGAINST (and our mitigation)

| Risk | Mitigation |
|---|---|
| **Generic default look** | We will restyle every component via CSS variables on install. Default shadcn aesthetics will not survive theming. |
| **Chart / canvas components** | shadcn has none. We use **TradingView Lightweight Charts** for candlesticks and custom Canvas for sparklines. |
| **Code editor (EA Studio)** | shadcn has nothing for this. We use **Monaco Editor** (VS Code's engine). |
| **Real-time tables** | shadcn Table is a static layout. We wrap it in a TanStack Virtual scroll layer. |

#### Verdict: Selective Adoption

```
USE shadcn/ui for:                    DO NOT use shadcn/ui for:
  ├── Dialog / Modal                    ├── Candlestick charts → TradingView LC
  ├── DropdownMenu                      ├── Sparklines → Canvas API
  ├── Tabs (EA Studio, Order panel)     ├── Code editor → Monaco Editor
  ├── Tooltip (price hover)             ├── Real-time tables → TanStack Table
  ├── Select (instruments, TF)          ├── WebSocket ticker → raw DOM updates
  ├── Sheet (mobile sidebar)            └── SVG equity ring → hand-rolled
  ├── Toast (order confirmations)
  ├── Badge (status pills)
  ├── Skeleton (loading states)
  ├── Form + Input + Label
  └── Command (search/palette)
```

---

## 2. Design System

### Token Architecture

```
src/styles/tokens.css
│
├── Colour Palette
│   ├── --gold:        #C9A84C    ← primary accent, CTAs, active states
│   ├── --gold-lt:     #E8C97A    ← hover on gold elements
│   ├── --gold-dim:    #7A6130    ← borders, subtle gold
│   ├── --gold-glow:   rgba(201,168,76,0.12)
│   │
│   ├── --bg-void:     #020509    ← deepest background (fullscreen editor)
│   ├── --bg-deep:     #040810    ← topbar, sidebar backgrounds
│   ├── --bg-base:     #070D1B    ← page background
│   ├── --bg-card:     #090F1E    ← card backgrounds
│   ├── --bg-panel:    #0C1525    ← inputs, nested panels
│   ├── --bg-border:   #131E32    ← all borders
│   ├── --bg-hover:    #111929    ← interactive hover state
│   │
│   ├── --text-prime:  #EEF2FF    ← primary text
│   ├── --text-sec:    #8899BB    ← secondary text
│   ├── --text-dim:    #3F5070    ← disabled, placeholder
│   │
│   ├── --green:       #00E5A0    ← buy, profit, success
│   ├── --green-dim:   #003D2B    ← green backgrounds
│   ├── --red:         #FF4560    ← sell, loss, error
│   ├── --red-dim:     #3D0F18    ← red backgrounds
│   └── --blue:        #3D85FF    ← informational, neutral metrics
│
├── Typography
│   ├── --font-display: 'Bebas Neue'      ← page titles, hero numbers
│   ├── --font-sans:    'DM Sans'         ← body text, UI labels
│   └── --font-mono:    'JetBrains Mono'  ← prices, code, timestamps
│
├── Spacing Scale (4px base)
│   └── 4 · 8 · 12 · 14 · 16 · 20 · 24 · 32 · 48
│
├── Border Radius
│   ├── --radius:    6px   ← buttons, inputs, badges
│   └── --radius-lg: 10px  ← cards, panels, modals
│
└── Layout
    ├── --sidebar-w:  220px
    └── --topbar-h:   54px
```

### shadcn Theme Override

```css
/* src/styles/shadcn-theme.css — applied on top of shadcn defaults */
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
  --radius:        0.375rem; /* 6px */
}
```

### Component Anatomy — Card

```
┌─────────────────────────────────────────────┐  ← bg-card, border-bg-border
│  ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔  │  ← 2px gradient top bar (accent)
│                                             │
│  LABEL TEXT          [action / badge]       │  ← card-header: mono 9px + action
│  ─────────────────────────────────────────  │
│                                             │
│  [  CONTENT AREA  ]                         │
│                                             │
└─────────────────────────────────────────────┘
     hover: border → rgba(gold, 0.2)
     hover: ::after shimmer overlay
```

---

## 3. Application Architecture

### Folder Structure

```
src/
├── app/                          ← Next.js 14 App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── onboarding/
│   │   └── page.tsx
│   └── dashboard/
│       ├── layout.tsx            ← Shell: Sidebar + Topbar
│       ├── page.tsx              ← Overview
│       ├── trading/page.tsx
│       ├── positions/page.tsx
│       ├── signals/page.tsx
│       ├── ea/page.tsx
│       ├── deployments/page.tsx
│       ├── account/page.tsx
│       └── settings/page.tsx
│
├── components/
│   ├── ui/                       ← shadcn installed components (you own these)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── tabs.tsx
│   │   ├── toast.tsx
│   │   ├── skeleton.tsx
│   │   └── ...
│   ├── charts/                   ← Custom chart components
│   │   ├── CandleChart.tsx       ← TradingView Lightweight Charts
│   │   ├── Sparkline.tsx         ← Canvas API
│   │   ├── EquityRing.tsx        ← SVG animated ring
│   │   └── PerfBar.tsx           ← Bar chart canvas
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── TickerStrip.tsx
│   ├── trading/
│   │   ├── OrderPanel.tsx
│   │   ├── PositionsTable.tsx
│   │   └── OrderModal.tsx
│   ├── ea/
│   │   ├── EAStudio.tsx
│   │   ├── MonacoEditor.tsx      ← dynamic import (SSR: false)
│   │   ├── EALibrary.tsx
│   │   └── GeneratorPanel.tsx
│   └── shared/
│       ├── StatCard.tsx
│       ├── StatusPill.tsx
│       └── LiveDot.tsx
│
├── lib/
│   ├── api.ts                    ← typed fetch wrapper + JWT injection
│   ├── ws.ts                     ← WebSocket singleton manager
│   └── supabase.ts               ← Supabase client
│
├── hooks/
│   ├── usePrices.ts              ← WS /ws/prices/:instrument
│   ├── usePositions.ts           ← polling GET /positions every 1s
│   ├── useAccount.ts             ← polling GET /account every 5s
│   └── useAuth.ts                ← Supabase session + JWT
│
├── store/
│   ├── priceStore.ts             ← Zustand: live prices keyed by pair
│   ├── positionStore.ts          ← Zustand: open positions array
│   └── uiStore.ts                ← Zustand: sidebar open, active modals
│
└── styles/
    ├── globals.css
    ├── tokens.css
    └── shadcn-theme.css
```

### State Management

```
┌─────────────────── State Architecture ───────────────────────┐
│                                                              │
│   SERVER STATE (TanStack Query)    CLIENT STATE (Zustand)    │
│   ─────────────────────────────    ──────────────────────    │
│   • /positions         ← 1s poll   • priceStore             │
│   • /account           ← 5s poll   • positionStore (cache)  │
│   • /signals           ← 10s poll  • uiStore                │
│   • /ea/projects       ← manual    • orderStore             │
│   • /deployments       ← 5s poll   • selectedBroker         │
│                                                              │
│   REAL-TIME (WebSocket)             URL STATE (nuqs)         │
│   ─────────────────────             ─────────────────────    │
│   • WS /ws/prices/EURUSD           • ?tab=generate           │
│   • WS /ws/prices/XAUUSD           • ?pair=EURUSD            │
│   • WS /ws/prices/GBPUSD           • ?tf=H1                  │
│   • (multiplexed, one per pair)                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Request Flow — Authenticated API Call

```
Component
    │
    ▼
useSomeHook()          ← TanStack Query useQuery / useMutation
    │
    ▼
lib/api.ts             ← typed fetch wrapper
    │  injects Authorization: Bearer <jwt>
    │  handles 401 → refresh → retry
    │  handles network errors → toast
    ▼
FastAPI /api/v1/...
    │
    ├── 200 → QueryClient.setQueryData() → re-render
    ├── 401 → POST /auth/refresh → retry original
    ├── 428 → redirect('/onboarding')
    └── 503 → toast("Service unavailable — retrying")
```

### WebSocket Data Flow

```
ws.ts singleton
    │
    ├── connect('EURUSD') → WebSocket wss://api.forexelite.pro/ws/prices/EURUSD
    ├── connect('XAUUSD') → WebSocket wss://...XAUUSD
    │
    │   onmessage: { bid, ask, timestamp }
    │       ↓
    │   priceStore.update(pair, { bid, ask })
    │       ↓
    │   All subscribed components re-render via Zustand selector
    │       ↓
    │   TickerStrip  ← flashes price colour (green/red 500ms)
    │   CandleChart  ← appends tick to live candle
    │   OrderPanel   ← updates bid/ask display
    │   PositionsTable ← recalculates live P&L per position
    │
    └── reconnect on disconnect with exponential backoff (1s → 2s → 4s → max 30s)
```

---

## 4. Global Data Layer & State

### Zustand — priceStore

```typescript
interface PriceState {
  prices: Record<string, { bid: number; ask: number; ts: string; flash: 'up' | 'dn' | null }>;
  update: (pair: string, tick: Tick) => void;
}
// Selector usage: const eurusd = usePriceStore(s => s.prices['EURUSD']);
```

### TanStack Query — Key Conventions

```
queryKey                      staleTime   refetchInterval
─────────────────────────     ─────────   ───────────────
['positions', brokerId]       0           1000ms (live P&L)
['account',  brokerId]        5000        5000ms
['signals']                   10000       10000ms
['deployments']               5000        5000ms
['ea', 'projects']            60000       manual only
['candles', pair, tf]         30000       manual (TF change)
```

---

## 5. Page 00 — Auth

### Purpose
Gate the application. Unauthenticated users cannot reach `/dashboard`. Onboarding-incomplete users cannot reach trading features.

### Layout

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│   [noise texture overlay — full viewport]              │
│                                                        │
│         ●●● grid pattern bg (subtle gold lines)        │
│                                                        │
│   ┌──────────────────────────────────┐                 │
│   │  FOREXELITE  [PRO]               │                 │
│   │                                  │                 │
│   │  WELCOME BACK                    │  ← Bebas Neue   │
│   │  Sign in to your trading desk    │  ← DM Sans      │
│   │                                  │                 │
│   │  [Email ________________________]│                 │
│   │  [Password _____________________]│                 │
│   │                                  │                 │
│   │  [  ●  SIGN IN  ───────────────] │  ← gold button  │
│   │                                  │                 │
│   │  Don't have an account? Sign up  │                 │
│   └──────────────────────────────────┘                 │
│                                                        │
│   [EURUSD] [GBPUSD] [XAUUSD] [USDJPY]   ← live ticker │
│   (animated marquee, no interaction required)          │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Data Flow

```
User submits form
       │
       ▼
POST /api/v1/auth/login
  { email, password }
       │
  ┌────┴────────────────────────────┐
  │ 200                             │ 401
  ▼                                 ▼
Store JWT in                  shadcn Toast:
httpOnly cookie               "Invalid credentials"
(via Next.js route handler)   shake animation on form
       │
       ▼
GET /api/v1/onboarding/status
       │
  ┌────┴─────────────┐
  │ onboarded: true  │ onboarded: false
  ▼                  ▼
/dashboard        /onboarding
```

### Components Used

- `shadcn/ui Form` + `Input` + `Label` — form with Zod validation
- `shadcn/ui Button` — primary gold variant
- `shadcn/ui Toast` — error feedback
- Custom `TickerMarquee` — CSS animation, public prices only (no auth required)

### Micro-interactions

```
Input focus:   border transitions from bg-border → gold-dim (150ms)
Button hover:  translateY(-1px) + box-shadow gold glow (150ms ease)
Form error:    shake animation (400ms) + red border + error text below input
Submit:        button shows spinner (replaces text), disabled during request
Success:       button → green checkmark → fade, then router.push('/dashboard')
```

---

## 6. Page 01 — Onboarding Wizard

### Purpose
Three-step linear flow before any trading access is granted. Backend enforces this via `428 Precondition Required` on all trading endpoints.

### Layout

```
┌────────────────────────────────────────────────────────────┐
│  FOREXELITE [PRO]                              Step 2 of 3 │  ← topbar
├────────────────────────────────────────────────────────────┤
│                                                            │
│   ●────────────────●────────────────○                      │
│  [1] Connect MT5  [2] Risk Config  [3] Disclaimer          │  ← step indicator
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │   CONNECT YOUR MT5 ACCOUNT                           │  │
│  │   Link your MetaTrader 5 broker account              │  │
│  │                                                      │  │
│  │   [Broker Name ________________________________]      │  │
│  │   [Account Number ______________________________]    │  │
│  │   [ ○ Demo  ● Live ]   Account Type                  │  │
│  │   [Custom Label _____________________________]       │  │
│  │                                                      │  │
│  │   [Test Connection]        [Continue →]              │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Step 1 — Connect MT5

```
Data flow:
User fills form → [Test Connection]
       │
       ▼
PUT /api/v1/onboarding/brokers
  { broker_name, account_number, account_type, label }
       │
  ┌────┴──────────────────────────────────┐
  │ 201                                   │ 503
  ▼                                       ▼
broker_connection_id stored         "MT5 Agent offline"
progress bar → step 2               retry button shown
```

### Step 2 — Risk Preferences

```
┌──────────────────────────────────────────────────────────┐
│  RISK CONFIGURATION                                      │
│                                                          │
│  Max Risk Per Trade                                      │
│  [────────●──────────────────────] 1.0%                  │  ← range slider
│  $0.00             $100.00 per trade                     │
│                                                          │
│  Preferred Pairs (optional)                              │
│  [EURUSD ×] [XAUUSD ×] [+ Add]                          │  ← multi-select chips
│                                                          │
│  Daily Loss Limit                                        │
│  [________] % of equity  ← guard rail                   │
│                                                          │
│  [← Back]                          [Continue →]         │
└──────────────────────────────────────────────────────────┘
```

### Step 3 — Disclaimer

```
┌──────────────────────────────────────────────────────────┐
│  RISK DISCLAIMER                                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Trading foreign exchange and CFDs carries a       │  │
│  │  significant risk of loss. ForexElite Pro is a     │  │  ← scrollable
│  │  tool that automates execution — not financial     │  │    legal text
│  │  advice. You may lose more than your deposit.      │  │
│  │  Past performance does not guarantee future        │  │
│  │  results. Ensure you understand the risks...       │  │
│  └────────────────────────────────────────────────────┘  │
│  (scroll to enable checkbox)                             │
│                                                          │
│  [✓] I have read and accept the risk disclaimer          │
│  [✓] I confirm I am trading my own funds                 │
│                                                          │
│  [← Back]                 [Complete Setup →] (disabled)  │
└──────────────────────────────────────────────────────────┘
```

```
Final step data flow:
PUT /api/v1/onboarding/preferences
  { risk_percent, disclaimer_accepted: true, preferred_pairs }
       │
       ▼
  200 { success: true }
       │
       ▼
router.push('/dashboard')
  + confetti animation (canvas-confetti, 1.5s)
  + "Welcome to ForexElite Pro" toast
```

---

## 7. Page 02 — Overview Dashboard

### Layout (1440px)

```
┌─[SIDEBAR 220px]──┬─[MAIN CONTENT]────────────────────────────────────────────┐
│                  │ ┌─[TOPBAR 54px]────────────────────────────────────────┐  │
│ FOREX ELITE PRO  │ │ EURUSD 1.08428 +0.04%  │ XAUUSD...  │ [●CONNECTED]  │  │
│                  │ └─────────────────────────────────────────────────────┘  │
│ ── PLATFORM ──   │                                                            │
│ ◼ Overview  ●    │ OVERVIEW                                                   │
│   Trading        │ MONDAY 23 FEB 2026 — LONDON SESSION OPEN                  │
│   Positions [5]  │                                                            │
│   TV Signals     │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│                  │ │ EQUITY   │ │ OPEN P&L │ │ WIN RATE │ │ DAILY DD     │  │
│ ── DEV ──        │ │ $10,043  │ │ +$127.40 │ │    72%   │ │   1.2%       │  │
│   EA Studio      │ │+$43 ↑   │ │ 5 pos ↑  │ │+3.1% ↑  │ │ max 3% limit │  │
│   Deployments    │ │ [spark] │ │ [spark] │ │ [bar]   │ │ [bar]        │  │
│                  │ └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│ ── ACCOUNT ──    │                                                            │
│   Account        │ ┌──────────────────────────────────┐ ┌─────────────────┐  │
│   Settings       │ │ PRICE CHART            [EURUSD ▼]│ │  OPEN POSITIONS │  │
│                  │ │ 1.08428 ▲ +0.04%                 │ │  ─────────────  │  │
│ ┌──────────────┐ │ │ [M5][M15][H1●][H4]               │ │  EURUSD BUY    │  │
│ │ JT           │ │ │                                   │ │  +$23.60 ↑     │  │
│ │ John Trader  │ │ │  ╭─╮  ╭─╮ ╭╮ ╭──╮               │ │                 │  │
│ │ PRO PLAN   > │ │ │ ─╯ ╰──╯ ╰─╯╰─╯  ╰──             │ │  XAUUSD BUY    │  │
│ └──────────────┘ │ │ [candlestick chart, live]         │ │  +$64.00 ↑     │  │
│                  │ └──────────────────────────────────┘ │                 │  │
│                  │                                       │  GBPUSD SELL   │  │
│                  │ ┌───────────────────┐ ┌────────────┐ │  +$7.00 ↑      │  │
│                  │ │ WEEKLY P&L        │ │ EA ACTIVITY│ │                 │  │
│                  │ │ [bar chart M-Su]  │ │ EMA Scalpv3│ │  [View All →]   │  │
│                  │ │ Mon +$38          │ │ ● running  │ └─────────────────┘  │
│                  │ │ ...Sun +$127      │ │ Gold MA v1 │                      │
│                  │ └───────────────────┘ │ ● running  │                      │
│                  │                       └────────────┘                      │
└──────────────────┴───────────────────────────────────────────────────────────┘
```

### Data Flow

```
Component mounts
       │
       ├── useAccount(brokerId)
       │     TanStack: GET /account → { balance, equity, margin_used }
       │     refetchInterval: 5000ms
       │     → StatCard: equity, margin
       │
       ├── usePositions(brokerId)
       │     TanStack: GET /positions → { positions[] }
       │     refetchInterval: 1000ms
       │     → PositionsTable (mini), totalPnL stat card
       │
       ├── usePriceStore() (Zustand selector)
       │     ← fed by WebSocket singleton (started in layout)
       │     → CandleChart (appends ticks), TickerStrip
       │
       ├── GET /candles/EURUSD?timeframe=H1&count=100
       │     TanStack: staleTime: 30s
       │     → Initial CandleChart render
       │
       └── GET /deployments
             TanStack: refetchInterval: 5000ms
             → EA Activity panel

Real-time price update path:
  WebSocket tick → priceStore.update() → Zustand notify
  → TickerStrip re-renders (price flash green/red)
  → CandleChart.appendTick() (updates last candle)
  → BidAsk component updates
```

### Stat Cards — StatCard Component

```typescript
// props
interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'dn' | 'neutral';
  accentColor?: string;       // CSS variable for top gradient bar
  sparklineData?: number[];   // renders Canvas sparkline if provided
  progressValue?: number;     // renders progress bar if provided
  skeleton?: boolean;         // shows Skeleton from shadcn while loading
}
```

### Chart Interaction Map

```
CandleChart (TradingView Lightweight Charts)
│
├── Pair selector dropdown [EURUSD ▼]
│     onChange → GET /candles/{newPair}?tf=H1 → chart.setData()
│
├── Timeframe tabs [M5][M15][H1][H4]
│     onClick → GET /candles/EURUSD?tf={selected} → chart.setData()
│
├── Hover crosshair
│     → custom tooltip: OHLCV + time (shadcn Tooltip wrapping a chart overlay)
│
└── WebSocket live ticks
      → chart.update(lastCandle) every tick
      → price badge animates colour flash
```

---

## 8. Page 03 — Live Trading

### Layout (1440px)

```
┌─[SIDEBAR]──┬─[MAIN]──────────────────────────────────────────────────────────┐
│            │ LIVE TRADING                          [Exness Demo ▼] [EURUSD ▼]│
│            ├─────────────────────────────────────────────────────────────────┤
│            │                                                                 │
│            │  ┌─────────────────────────────────────────────┐ ┌───────────┐ │
│            │  │                                             │ │PLACE ORDER│ │
│            │  │  1.08428  ▲ +0.04%                         │ │           │ │
│            │  │  [M5][M15][H1●][H4]                        │ │ [BUY][SEL]│ │
│            │  │                                             │ │           │ │
│            │  │                                             │ │Instrument │ │
│            │  │  ████ candlestick chart — full width        │ │[EURUSD  ▼]│ │
│            │  │                                             │ │           │ │
│            │  │  (300px height, live updating)              │ │ Lot Size  │ │
│            │  │                                             │ │[0.01  LOT]│ │
│            │  │                                             │ │ ▓░░░░ 1%  │ │
│            │  │                                             │ │           │ │
│            │  │                                             │ │ SL    TP  │ │
│            │  │                                             │ │[20 pip][40]│ │
│            │  │─────────────────────────────────────────── │ │           │ │
│            │  │ BID 1.08421    ASK 1.08428    SPREAD 0.7   │ │─── ─── ───│ │
│            │  └─────────────────────────────────────────────┘ │Est $10.85 │ │
│            │                                                   │R:R 1:2.0  │ │
│            │                                                   │           │ │
│            │                                                   │[EXECUTE   │ │
│            │                                                   │  BUY    ] │ │
│            │                                                   └───────────┘ │
└────────────┴─────────────────────────────────────────────────────────────────┘
```

### Order Panel — Data Flow

```
User adjusts lot / SL / TP inputs
       │
       ▼
updateOrderCalc() [client-side only, no API call]
  margin  = lots × 10000 × price / leverage
  riskPct = lots × pipValue × SL / balance × 100
  rr      = TP / SL
       │
       ▼
UI updates: EstMargin, R:R display, risk bar fill width

User clicks [EXECUTE BUY / SELL]
       │
       ▼
shadcn Dialog opens (OrderConfirmModal)
  Shows: pair, side, lots, fillPrice, SL level, TP level, margin
       │
User clicks [Confirm]
       │
       ▼
useMutation → POST /api/v1/orders
  { broker_connection_id, instrument, side, units, stop_loss_pips, take_profit_pips }
       │
  ┌────┴────────────────────────┐
  │ 201                         │ 400/503
  ▼                             ▼
Dialog closes               Dialog shows error
Toast: "BUY EURUSD          Toast: "Insufficient margin"
0.01 lot — Filled           or "Agent offline"
@ 1.08428"
queryClient.invalidate
  (['positions'])
```

### BidAsk Component — Real-time Feed

```
WebSocket: wss://api.forexelite.pro/ws/prices/EURUSD
  onmessage → priceStore.update('EURUSD', { bid, ask })
       │
       ▼
BidAsk component reads priceStore via Zustand selector
  bid display → text flashes red  (500ms)
  ask display → text flashes green (500ms)
  spread      = (ask - bid) × 10000 → formatted to 1 decimal

CSS flash:
  @keyframes priceFlash-up { 0% { color: green } 100% { color: inherit } }
  @keyframes priceFlash-dn { 0% { color: red   } 100% { color: inherit } }
```

---

## 9. Page 04 — Positions

### Layout

```
┌─[SIDEBAR]──┬─[MAIN]────────────────────────────────────────────────────────┐
│            │ POSITIONS                               [Close All]            │
│            ├───────────────────────────────────────────────────────────────┤
│            │                                                               │
│            │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│            │  │ TOTAL P&L    │  │ MARGIN USED  │  │ FLOATING SWAP    │   │
│            │  │ +$127.40     │  │ 1.08%        │  │ -$2.40           │   │
│            │  │ 5 positions  │  │ $108/$10,000 │  │ overnight cost   │   │
│            │  └──────────────┘  └──────────────┘  └──────────────────┘   │
│            │                                                               │
│            │  ┌──────────────────────────────────────────────────────┐    │
│            │  │ OPEN POSITIONS    [MT5 EXNESS DEMO] [Last sync: now] │    │
│            │  ├──────────┬────────┬──────┬──────┬──────┬──────┬─────┤    │
│            │  │ TICKET   │ PAIR   │ SIDE │ VOL  │ OPEN │ CUR  │ P&L │    │
│            │  ├──────────┼────────┼──────┼──────┼──────┼──────┼─────┤    │
│            │  │ MT5-7819 │ EURUSD │ BUY  │ 0.02 │1.083 │1.084 │+$24 │ ×  │
│            │  │ MT5-7818 │ GBPUSD │ SELL │ 0.01 │1.269 │1.268 │ +$7 │ ×  │
│            │  │ MT5-7816 │ XAUUSD │ BUY  │ 0.01 │2028  │2034  │+$64 │ ×  │
│            │  └──────────┴────────┴──────┴──────┴──────┴──────┴─────┘    │
│            └───────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Page mounts
       │
       ▼
usePositions(brokerId)
  TanStack: GET /positions?broker_connection_id={id}
  refetchInterval: 1000ms (live P&L)
       │
       ▼
priceStore subscription (Zustand)
  On each price tick → recalculate P&L per position:
    pnl = (currentPrice - openPrice) × units × (side === 'BUY' ? 1 : -1)
  → position row animates: green flash on pnl increase, red on decrease

User clicks [×] on a position row
       │
       ▼
shadcn AlertDialog: "Close MT5-7819? This will execute at market price."
       │
User confirms
       │
       ▼
useMutation → DELETE /positions/{position_id}?broker_connection_id={id}
       │
  ┌────┴──────────────────────────────┐
  │ 200                               │ 503
  ▼                                   ▼
Remove row with                   Toast: "Agent unavailable"
  fade+slideLeft animation (300ms)
queryClient.invalidate(['positions'])
queryClient.invalidate(['account'])
Toast: "Position closed — P&L: +$23.60"

User clicks [Close All]
       │
       ▼
shadcn AlertDialog: "Close all 5 positions? This cannot be undone."
       │
  → loop DELETE for each open position
  → Promise.allSettled (don't fail on partial)
  → show summary toast
```

### P&L Row Colour Logic

```
P&L column colour rules:
  pnl > 0 → var(--green) + green-dim background on hover
  pnl < 0 → var(--red)   + red-dim background on hover
  pnl changes on tick:
    pnl increased → brief green row flash (300ms)
    pnl decreased → brief red row flash (300ms)
```

---

## 10. Page 05 — TV Signals

### Layout

```
┌─[SIDEBAR]──┬─[MAIN]────────────────────────────────────────────────────────┐
│            │ TV SIGNALS          [Copy Webhook URL]  [+ Add Signal]        │
│            ├───────────────────────────────────────────────────────────────┤
│            │                                                               │
│            │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐    │
│            │  │ SIGNALS TODAY │  │ SIGNAL WIN RATE│  │ ACTIVE STRATS │    │
│            │  │     12        │  │     68%        │  │       3       │    │
│            │  │ 11 exec 1 fail│  │ last 30 days   │  │               │    │
│            │  └───────────────┘  └───────────────┘  └───────────────┘    │
│            │                                                               │
│            │  ┌──────────────────────────────────────────────────────┐    │
│            │  │ SIGNAL FEED                         [All▼][+Filter]  │    │
│            │  │                                                      │    │
│            │  │ ┌─[↑]─┐  EURUSD  BUY    EMA-Cross-Strategy          │    │
│            │  │ │green│  executed                          14:01     │    │
│            │  │ └─────┘                                              │    │
│            │  │                                                      │    │
│            │  │ ┌─[↓]─┐  XAUUSD  SELL   Gold-MA-200                 │    │
│            │  │ │ red │  executed                          13:48     │    │
│            │  │ └─────┘                                              │    │
│            │  │                                                      │    │
│            │  │ ┌─[↑]─┐  GBPUSD  BUY    EMA-Cross-Strategy          │    │
│            │  │ │green│  FAILED                            13:30     │    │
│            │  │ └─────┘                                              │    │
│            │  └──────────────────────────────────────────────────────┘    │
│            │                                                               │
│            │  ┌──────────────────────────────────────────────────────┐    │
│            │  │ ACTIVE STRATEGIES    [+ New Strategy]                │    │
│            │  │ ● EMA Cross Strategy    EURUSD, GBPUSD    [Disable]  │    │
│            │  │ ● Gold MA-200          XAUUSD             [Disable]  │    │
│            │  │ ○ RSI Mean Reversion   EURUSD             [Enable]   │    │
│            │  └──────────────────────────────────────────────────────┘    │
└────────────┴───────────────────────────────────────────────────────────────┘
```

### Webhook Integration Flow

```
TradingView (external)
       │
       │  POST to webhook URL:
       │  https://api.forexelite.pro/api/v1/webhooks/tradingview
       │  { "secret": "...", "symbol": "EURUSD", "action": "buy",
       │    "price": 1.08428, "strategy": "EMA-Cross" }
       ▼
FastAPI POST /webhooks/tradingview
  1. Validate HMAC signature (user secret)
  2. Look up broker_connection by user
  3. Risk check: account margin, daily loss limit
  4. Create MT5 Agent job
  5. Insert into trade_signals table
       │
       ▼
MT5 Agent polls GET /agents/{id}/jobs/next
  → type: "trade", payload: { symbol, side, units, sl, tp }
       │
       ▼
MT5 Agent executes on MetaTrader 5 terminal
       │
       ▼
POST /agents/{id}/jobs/{job_id}/result
  { status: "completed", result: { fill_price, broker_order_id } }
       │
       ▼
Backend updates trade_signals: status → "executed"
WebSocket pushes update to frontend

Frontend:
  useSignals() polling GET /signals (refetchInterval: 10000)
  Signal card status pill updates: pending → executed (green) / failed (red)
  New signal appears with slideIn animation
```

### Webhook URL Copy Flow

```
User clicks [Copy Webhook URL]
       │
       ▼
Construct URL: https://api.forexelite.pro/webhooks/tv/{user.webhook_secret}
navigator.clipboard.writeText(url)
Toast: "Webhook URL copied — paste into TradingView alert"
Button text changes to "Copied ✓" for 2s then reverts
```

---

## 11. Page 06 — EA Studio

### Tab Architecture

```
┌─[SIDEBAR]──┬─[MAIN]────────────────────────────────────────────────────────┐
│            │ EA STUDIO     [GLM-5]  [+ New EA]                             │
│            ├───────────────────────────────────────────────────────────────┤
│            │  [⚡ Generate ●] [📝 Editor] [📦 Library]                     │
│            ├───────────────────────────────────────────────────────────────┤
│            │                                                               │
│            │  [TAB CONTENT — see below]                                    │
│            │                                                               │
└────────────┴───────────────────────────────────────────────────────────────┘
```

### Tab 1 — Generate

```
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│ STRATEGY DESCRIPTION         [GLM-5] │  │ MQL5 CODE              [●]   │
│                                      │  │ [✎ Edit][💾 Save][🔒 Unlock] │
│ ┌──────────────────────────────────┐ │  │                              │
│ │ Describe your trading strategy   │ │  │ ┌──────────────────────────┐ │
│ │ in plain English...              │ │  │ │ // EMA Cross Scalper     │ │
│ │                                  │ │  │ │ // Generated by FEP     │ │
│ │                                  │ │  │ │                          │ │
│ └──────────────────────────────────┘ │  │ │ #property strict        │ │
│ 0 / 2000 chars        [Generate MQL5]│  │ │ input int FastEMA = 10; │ │
│                                      │  │ │ ...                      │ │
│ QUICK TEMPLATES                      │  │ └──────────────────────────┘ │
│ [Trend: MA Cross ] [MeanRev: RSI Rev]│  │ Ln 1, Col 1 · MQL5 · UTF-8  │
│ [Volatility: BB  ] [Breakout: Range ]│  │                              │
│ [Scalping: M1    ] [Grid: Grid Sys  ]│  │ [Compile .ex5] [Deploy MT5]  │
└──────────────────────────────────────┘  │ [Save to Library]            │
                                          └──────────────────────────────┘
```

### Generate — Data Flow

```
User writes strategy description (textarea)
Character count updates live: "142 / 2000 chars"
       │
User clicks [Generate MQL5]
       │
       ▼
Validate: length >= 20 chars (client-side Zod)
       │
       ▼
useMutation → POST /api/v1/ea/projects (if no active project)
  → POST /api/v1/ea/generate
  { project_id, strategy_description }
       │
Mini-editor enters "generating" state:
  Progress overlay visible with spinner
  7-step status messages animate in sequence:
    "Initialising GLM-5..."
    "Parsing strategy parameters..."
    "Generating indicator logic..."
    "Writing entry conditions..."
    "Adding risk management..."
    "Applying position sizing..."
    "Finalising MQL5 output..."
       │
  ┌────┴────────────────────────────────┐
  │ 201                                 │ 503
  ▼                                     ▼
source_code returned              "GLM-5 temporarily
  → populate Monaco mini-editor    unavailable — retry"
  → enable Compile / Deploy        shadcn Toast (destructive)
  → unsaved-dot appears (gold ●)
  → version label: "v1 — draft"
```

### Generate — Editor Modes

```
State machine for mini-editor:

  LOCKED (default after generation)
       │ click "✎ Edit Mode"
       ▼
  EDIT MODE
    contenteditable="true"
    border: gold
    lock banner: hidden
    unsaved-dot: visible on any change
       │ click "🔓 Lock"
       ▼
  LOCKED EDIT (changes saved, then locked)
    contenteditable="false"
    lock banner visible: "🔒 FILE LOCKED — unlock to edit"
    cursor: not-allowed
       │
  [💾 Save] at any point:
    if no project → create project
    stores code in component state
    saves to Supabase via POST /ea/versions
    unsaved-dot hides
    save-indicator: "✓ Saved" (green, 3s then hide)
    showSaveFeedback toast
```

### Tab 2 — Editor (Standalone)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ EA EDITOR  [MyScalper.mq5 ________________] [●]                         │
│            [✎ Edit] [💾 Save] [🔓 Lock] [⛶ Full Page]                   │
├──────────────────────────────────────────────────────────────────────────┤
│ 🔒 FILE LOCKED — click Unlock to edit                ← red banner        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  // Open a file from the EA Library or paste code here...               │
│  // Monaco Editor renders here (dynamic import, SSR: false)             │
│                                                                          │
│  (min-height: 500px — expands with content)                             │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ Ln 1, Col 1 · MQL5 · ✓ Saved                                            │
├──────────────────────────────────────────────────────────────────────────┤
│ [Compile .ex5] [Deploy to MT5] [↓ Download .mq5] [Save to Library →]   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Tab 3 — EA Library

```
┌──────────────────────────────────────────────────────────────────────────┐
│ EA LIBRARY   [Search EAs...         ] [All Status ▼]                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │▌ EMA Cross Scalp │  │▌ RSI Mean Rev    │  │▐ BB Squeeze      │      │
│  │ v1.2             │  │ v2.0             │  │ v1.1             │      │
│  │ EURUSD · M15     │  │ GBPUSD · H1      │  │ USDJPY · M30     │      │
│  │ ● RUNNING        │  │ ● PAUSED         │  │ ○ DRAFT          │      │
│  │ Edited: Feb 22   │  │ Edited: Feb 20   │  │ Edited: Feb 18   │      │
│  │[Edit][Full][⬇][⏸]│  │[Edit][Full][⬇][▶]│  │[Edit][Full][⬇]  │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│   green left bar          gold left bar         grey left bar           │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Library Card — Status System

```
Status   Left bar colour   Dot        Run/Pause btn
───────  ───────────────   ────────   ─────────────
running  var(--green)      ● animate  [⏸ Pause]
paused   var(--gold)       ◐ static   [▶ Run]
draft    var(--text-dim)   ○ empty    [▶ Run] (grayed)
error    var(--red)        ✕ red      [⟳ Retry]
```

### Full-Page Editor (Overlay)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ⌨ EA STUDIO │ [MyScalper.mq5 ______] [✎ Edit][💾 Save][🔓 Lock]        │
│ ────────────────────────────────────────────────────── [Compile][Deploy]│
│             │ [↓ Download][Save to Library][✕ Close]                    │
├──────┬──────────────────────────────────────────────────────────────────┤
│   1  │  //+---------------------------------------------------+         │
│   2  │  //| EMA Cross Scalper — Generated by ForexElite Pro  |         │
│   3  │  //| Powered by GLM-5                                  |         │
│   4  │  //+---------------------------------------------------+         │
│   5  │                                                                  │
│   6  │  #property copyright "ForexElite Pro 2026"                       │
│   7  │  #property version   "1.20"                                      │
│   8  │  #property strict                                                │
│   9  │                                                                  │
│  10  │  input int    FastEMA     = 10;                                  │
│  ... │  ...                                                             │
│      │                                                                  │
├──────┴──────────────────────────────────────────────────────────────────┤
│ ● Unlocked  Ln 10, Col 24  MQL5  UTF-8           Saved 14:32           │
└─────────────────────────────────────────────────────────────────────────┘
  position: fixed, inset: 0, z-index: 5000
  background: var(--bg-void)
  Monaco Editor: language: 'cpp' (closest to MQL5)
                 theme: 'vs-dark' (custom styled)
```

### EA Studio — Compile & Deploy Flow

```
[Compile .ex5]
       │
       ▼
POST /ea/versions/{version_id}/compile
  → 202 { job_id, status: "pending" }
       │
Button state: "Compiling..." (spinner)
Poll GET /ea/versions/{version_id}
  until status ∈ { "compiled", "compile_failed" }
  polling interval: 2000ms, max: 60s
       │
  ┌────┴──────────────────────────────────────┐
  │ "compiled"                                │ "compile_failed"
  ▼                                           ▼
Toast: "Compilation success"           Toast: "Compilation failed"
[Deploy to MT5] button enables         shadcn Dialog: show compiler errors
version label: "v1 — compiled"         link to logs

[Deploy to MT5]
       │
       ▼
shadcn Dialog: "Deploy Configuration"
  ├── Agent selector: [My VPS Agent ▼]
  ├── Symbol: [EURUSD ▼]
  └── [Confirm Deploy]
       │
       ▼
POST /deployments
  { version_id, agent_id, broker_connection_id, symbol }
       │
  → 201 → navigate to Deployments page
  → toast: "EA deploying to EMA_Scalper.ex5..."
```

---

## 12. Page 07 — Deployments

### Layout

```
┌─[SIDEBAR]──┬─[MAIN]────────────────────────────────────────────────────────┐
│            │ DEPLOYMENTS    [VPS: My Agent ● Online] [+ Deploy EA]        │
│            ├───────────────────────────────────────────────────────────────┤
│            │                                                               │
│            │  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐       │
│            │  │ ACTIVE   │  │ TOTAL TRADES │  │ TOTAL EA P&L     │       │
│            │  │ EAs: 3   │  │   47 today   │  │  +$37.40 today   │       │
│            │  └──────────┘  └──────────────┘  └──────────────────┘       │
│            │                                                               │
│            │  ┌──────────────────────────────────────────────────────┐    │
│            │  │ DEPLOYED EAs                           [All▼][Filter]│    │
│            │  │                                                      │    │
│            │  │ ● EMA Scalper v3    EURUSD · Exness Demo             │    │
│            │  │   31 trades · +$18.40        [Stop] [Logs] [Config]  │    │
│            │  │                                                      │    │
│            │  │ ● Gold MA Strategy  XAUUSD · Exness Demo             │    │
│            │  │   12 trades · +$24.80        [Stop] [Logs] [Config]  │    │
│            │  │                                                      │    │
│            │  │ ● BB Squeeze Bot    GBPJPY · Exness Demo             │    │
│            │  │   4 trades  · -$5.20         [Stop] [Logs] [Config]  │    │
│            │  └──────────────────────────────────────────────────────┘    │
│            │                                                               │
│            │  ┌──────────────────────────────────────────────────────┐    │
│            │  │ AGENT LOG — EMA Scalper v3                [Auto-scroll]    │
│            │  │ [2026-02-23 14:05:00] INFO  Heartbeat — CPU 14.2%   │    │
│            │  │ [2026-02-23 14:04:30] EXEC  BUY 0.01 EURUSD @1.084  │    │
│            │  │ [2026-02-23 14:00:00] INFO  EA started on EURUSD    │    │
│            │  └──────────────────────────────────────────────────────┘    │
└────────────┴───────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Page mounts
       │
       ├── useDeployments()
       │     GET /deployments (refetchInterval: 5000ms)
       │     → render deployment cards
       │
       ├── useAgentStatus(agentId)
       │     GET /agents/{id}/heartbeat (last seen)
       │     → topbar badge: ● Online / ○ Offline / ⚠ Degraded
       │
       └── [Logs] click
             → shadcn Sheet opens from right
             → GET /deployments/{id}/logs
             → render in monospace list
             → [Auto-scroll] toggle: scrollIntoView on new log entries
             → Poll GET /logs every 3s while sheet open

Stop EA:
  [Stop] button → shadcn AlertDialog confirmation
  POST /deployments/{id}/stop
  → status dot → grey (stopped)
  → toast: "EMA Scalper v3 stopped"
  → invalidate ['deployments']

Run EA:
  [Run] button (on stopped deployment)
  POST /deployments/{id}/run
  → status dot → green (running, animate pulse)
  → toast: "EA started"
```

### Agent Status Indicator

```
Agent heartbeat last_seen logic (client-side):
  diff = now - last_seen (seconds)

  diff < 360s  → ● Online  (green pulse)
  diff < 600s  → ⚠ Degraded (gold pulse, "Last seen Xm ago")
  diff >= 600s → ○ Offline  (grey, static, alert banner on page)
```

---

## 13. Page 08 — Account

### Layout

```
┌─[SIDEBAR]──┬─[MAIN]────────────────────────────────────────────────────────┐
│            │ ACCOUNT                                                       │
│            ├───────────────────────────────────────────────────────────────┤
│            │                                                               │
│            │  ┌──────────────────────────────┐  ┌───────────────────────┐ │
│            │  │           ╭──────╮            │  │ ACCOUNT METRICS       │ │
│            │  │          ╱ 68.2% ╲            │  │ ─────────────────     │ │
│            │  │         │  $6,820 │           │  │ Balance    $10,000    │ │
│            │  │          ╲ equity╱            │  │ Equity     $10,043    │ │
│            │  │           ╰──────╯            │  │ Margin     $108.43    │ │
│            │  │    [SVG animated ring]         │  │ Free Margin $9,891    │ │
│            │  │                               │  │ Leverage    1:500     │ │
│            │  │ EQUITY UTILISATION            │  │ Currency    USD       │ │
│            │  └──────────────────────────────┘  └───────────────────────┘ │
│            │                                                               │
│            │  ┌──────────────────────────────────────────────────────┐    │
│            │  │ PROFILE                                [Edit Profile] │    │
│            │  │ Name:   John Trader                                  │    │
│            │  │ Email:  john@forexelite.pro                          │    │
│            │  │ Plan:   PRO — $29/month                  [Upgrade]   │    │
│            │  │ Since:  Feb 2026                                     │    │
│            │  └──────────────────────────────────────────────────────┘    │
│            │                                                               │
│            │  ┌──────────────────────────────────────────────────────┐    │
│            │  │ CONNECTED BROKERS                    [+ Connect New]  │    │
│            │  │ ● Exness Demo   MT5-781411   Demo   [Disconnect]     │    │
│            │  │ ○ IC Markets    MT5-882500   Live   [Disconnect]     │    │
│            │  └──────────────────────────────────────────────────────┘    │
└────────────┴───────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Page mounts
       │
       ├── useAccount(brokerId)
       │     GET /account → { balance, equity, margin_used, margin_available }
       │     refetchInterval: 5000
       │     → EquityRing animation: strokeDashoffset = circ × (1 - equity/balance)
       │
       └── GET /profile (Supabase user table)
             → name, email, plan, created_at

Edit Profile:
  shadcn Dialog opens with pre-filled Form
  PATCH /profile { name, email }
  → optimistic update → toast "Profile updated"

Connect New Broker:
  shadcn Sheet opens with the same form as Onboarding Step 1
  PUT /onboarding/brokers { broker_name, account_number, account_type }
  → new broker card appears with slideDown animation

Equity Ring:
  Uses SVG with CSS transition on strokeDashoffset (1s cubic-bezier)
  ring colour → gold gradient (url(#ringGrad))
  Animated on first mount with 400ms delay
  Re-animates whenever equity/balance changes by >0.1%
```

---

## 14. Page 09 — Settings

### Layout

```
┌─[SIDEBAR]──┬─[MAIN]────────────────────────────────────────────────────────┐
│            │ SETTINGS                                                      │
│            ├───────────────────────────────────────────────────────────────┤
│            │                                                               │
│            │  ┌──────────────────────────────────────────────────────┐    │
│            │  │ RISK MANAGEMENT                                       │    │
│            │  │ Max Risk Per Trade    [────●──────] 1.0%              │    │
│            │  │ Daily Loss Limit      [──●────────] 3.0%              │    │
│            │  │ Max Open Positions    [4 ____________]                 │    │
│            │  │ Auto-close on limit   [  ●  ] ON                      │    │
│            │  └──────────────────────────────────────────────────────┘    │
│            │                                                               │
│            │  ┌──────────────────────────────────────────────────────┐    │
│            │  │ NOTIFICATIONS                                         │    │
│            │  │ Trade executed        [  ●  ] ON                      │    │
│            │  │ Signal received       [  ●  ] ON                      │    │
│            │  │ EA error              [  ●  ] ON                      │    │
│            │  │ Daily P&L summary     [  ○  ] OFF                     │    │
│            │  └──────────────────────────────────────────────────────┘    │
│            │                                                               │
│            │  ┌──────────────────────────────────────────────────────┐    │
│            │  │ APPEARANCE                                            │    │
│            │  │ Theme            [● Dark] [○ System]                  │    │
│            │  │ Chart Style      [● Candles] [○ Line] [○ Bars]        │    │
│            │  │ Default Pair     [EURUSD ▼]                           │    │
│            │  └──────────────────────────────────────────────────────┘    │
│            │                                                               │
│            │  ┌──────────────────────────────────────────────────────┐    │
│            │  │ DANGER ZONE                               ▸ Collapse  │    │
│            │  │ [Delete All EAs] [Disconnect All Brokers]             │    │
│            │  │ [Delete Account — this cannot be undone]              │    │
│            │  └──────────────────────────────────────────────────────┘    │
└────────────┴───────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Page mounts
       │
       ▼
GET /profile + GET /preferences (Supabase)
  → pre-populate all form fields with React Hook Form defaultValues

Each setting change:
  onChange → debounce 800ms
  → PATCH /preferences { changed_field: new_value }
  → optimistic UI (no spinner, immediate feedback)
  → shadcn Toast: "Settings saved" (green, subtle, 2s)

Danger Zone actions:
  [Delete All EAs] → shadcn AlertDialog (type "DELETE" to confirm)
  [Delete Account] → shadcn AlertDialog + email confirmation step
    "Type your email address to confirm:"
    DELETE /account
    → supabase.auth.signOut()
    → redirect('/login') + clear all caches
```

---

## 15. Animation & Motion System

### Principles (from skill guidance)

```
1. PURPOSE — every animation must communicate state, not decorate
2. PERFORMANCE — CSS transforms only (no layout-triggering properties)
3. STAGGER — page entrance: 45ms between cards (max 8 cards = 360ms total)
4. SPRING — use cubic-bezier(.22,1,.36,1) for entrances (natural deceleration)
5. INSTANT — interactions < 150ms feel immediate; > 400ms feel sluggish
```

### Keyframe Library

```css
/* Page entrance */
@keyframes pageIn    { from { opacity:0; transform:translateY(8px) }  to { opacity:1; transform:none } }

/* Card stagger (JS-driven, CSS just defines the transition) */
/* card.style.transition = `opacity .3s ease ${i * 45}ms, transform .35s cubic-bezier(.22,1,.36,1) ${i * 45}ms` */

/* Price flash */
@keyframes priceUp   { 0% { color:var(--green) }  100% { color:inherit } }
@keyframes priceDn   { 0% { color:var(--red)   }  100% { color:inherit } }

/* Status indicators */
@keyframes livePulse { 0%,100% { box-shadow:0 0 6px var(--green),0 0 12px rgba(0,229,160,.3) }
                       50%     { box-shadow:0 0 3px var(--green) } }

/* Modals */
@keyframes modalIn   { from { opacity:0; transform:scale(.94) translateY(10px) }
                       to   { opacity:1; transform:none } }

/* Toasts */
@keyframes toastUp   { from { opacity:0; transform:translateY(12px) }
                       to   { opacity:1; transform:none } }

/* Rows (new order / new signal) */
@keyframes rowIn     { from { opacity:0; transform:translateX(-8px) }
                       to   { opacity:1; transform:none } }
@keyframes rowFlash  { 0%   { background:rgba(201,168,76,.12) }
                       100% { background:transparent } }
```

### Duration Reference

```
Interaction         Duration   Easing
────────────────    ────────   ─────────────────────────────
Button hover        150ms      ease
Input focus         150ms      ease
Card hover          200ms      ease
Nav item active     150ms      ease
Page transition     250ms      cubic-bezier(.22,1,.36,1)
Card entrance       350ms      cubic-bezier(.22,1,.36,1) + stagger
Modal open          250ms      cubic-bezier(.34,1.56,.64,1)  ← spring
Modal close         150ms      ease-in
Toast appear        300ms      cubic-bezier(.22,1,.36,1)
Toast dismiss       200ms      ease-in
Price flash         500ms      ease
Equity ring         1000ms     cubic-bezier(.4,0,.2,1)
Stat counter        900ms      ease-out cubic (JS-driven)
Chart data update   300ms      ease (TradingView handles this)
Sidebar slide       300ms      cubic-bezier(.4,0,.2,1)
```

---

## 16. Responsive Strategy

### Breakpoints

```
sm:   640px   → single column stat cards
md:   768px   → sidebar collapses to Sheet (shadcn), hamburger appears
lg:   1024px  → two-column layouts
xl:   1280px  → full three-column layouts
2xl:  1536px  → max-width content (cap at 1440px with padding)
```

### Layout Transforms by Breakpoint

```
Desktop 1440px                    Tablet 768px                 Mobile 375px
──────────────────                ────────────────────         ──────────────
[Sidebar | Main]                  [Main + Sheet Sidebar]       [Main + Drawer]
 4-column stat grid                2-column stat grid           1-column grid
 3fr+1fr chart+order               1fr chart / 1fr order        stacked
 Side-by-side panels               stacked panels               stacked
 Full positions table              scrollable table              card list
 Multi-column EA library           2-column EA library          1-column list
```

### Mobile Sidebar (shadcn Sheet)

```
Mobile sidebar implementation:
  shadcn Sheet: side="left", open controlled by uiStore.sidebarOpen
  Trigger: hamburger button in topbar (visible only at < 768px via Tailwind md:hidden)
  Overlay: Sheet's built-in overlay (backdrop-filter: blur(4px))
  Close on nav: sheet closes when nav item clicked (navigate + closeSidebar())
  Close on outside: Sheet's default behaviour
```

---

## 17. Error States & Empty States

### Empty State Template

```
┌────────────────────────────────────┐
│                                    │
│           [icon — 32px]            │
│                                    │
│      NO OPEN POSITIONS             │  ← mono, text-sec
│   Place your first trade to see    │  ← 11px, text-dim
│   live P&L here                    │
│                                    │
│      [+ Place Order]               │  ← optional CTA
│                                    │
└────────────────────────────────────┘
```

### Error State Patterns

```
API Error Type           UI Treatment
──────────────────────   ─────────────────────────────────────────────
Network error            Inline banner: "Connection lost — retrying"
                         + auto-retry with exponential backoff
                         (never shows raw error to user)

401 Unauthorized         Silent token refresh → retry
                         If refresh fails → redirect('/login')

403 Forbidden            shadcn Toast (destructive): "Access denied"

428 Onboarding           Redirect to /onboarding with context:
                         "Complete setup to access trading features"

400 Validation           Inline field errors (shadcn Form)
                         Zod schema runs client-side first to prevent
                         most 400s from ever reaching the server

503 Upstream             shadcn Toast: "MT5 Agent offline — check VPS"
                         Retry button in Toast after 5s

Rate limit (429)         shadcn Toast: "Too many requests — wait 60s"
                         Auto-dismiss, no retry button (avoid hammering)
```

### Loading States (Skeleton)

```
Component         Skeleton strategy
─────────────     ─────────────────────────────────────────────────
Stat cards        shadcn Skeleton (same dimensions as value text)
Positions table   3 skeleton rows, shimmer animation
Chart             Skeleton placeholder (chart height × full width)
EA Library        6 skeleton cards (grid, same size as real cards)
Signal feed       4 skeleton signal-card rows
Profile           Skeleton avatar circle + 2 text lines
```

---

## 18. Accessibility

### Standards Target

**WCAG 2.1 AA** minimum. Financial applications must meet this to be deployable in regulated jurisdictions.

### Implementation Checklist

```
Focus Management
  ├── All interactive elements keyboard-navigable (Tab / Shift+Tab)
  ├── Modal opens → focus trapped inside (shadcn Dialog does this natively)
  ├── Modal closes → focus returns to trigger element
  └── Skip-nav link: "Skip to main content" (visible on focus, sr-only otherwise)

Colour Contrast
  ├── text-prime (#EEF2FF) on bg-card (#090F1E) → ratio: 15:1 ✓
  ├── text-sec  (#8899BB) on bg-card (#090F1E) → ratio: 4.8:1 ✓
  ├── gold      (#C9A84C) on bg-base (#070D1B) → ratio: 5.2:1 ✓
  └── green/red pills: background + foreground both styled, not colour-only

Screen Reader
  ├── Price flash: aria-live="polite" on price displays
  ├── P&L changes: aria-live="assertive" on critical values (trade fills)
  ├── Status dots: aria-label="Running" / "Stopped" (not colour-only)
  ├── Chart: aria-label="Candlestick chart for EURUSD H1"
  │          + tabular summary in sr-only div (OHLCV last 5 candles)
  └── Loading: aria-busy="true" on containers while skeleton shows

Reduced Motion
  @media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important; }
    /* Exceptions: progress indicators remain visible */
  }

Semantic HTML
  ├── nav elements for sidebar and topbar
  ├── main element wrapping page content
  ├── table + thead + tbody for positions (not divs)
  ├── button not div for all clickable elements
  └── form + fieldset + label for all inputs
```

---

## Appendix — Component Decision Matrix

```
Need                          Solution              Reason
────────────────────────────  ────────────────────  ──────────────────────────────
Dropdown (pair, TF select)    shadcn Select         Accessible, keyboard nav
Modal (confirm order)         shadcn AlertDialog    Focus trap, escape key
Side drawer (mobile nav)      shadcn Sheet          Gesture-friendly, a11y
Toasts (order fills, errors)  shadcn Sonner         Stacking, auto-dismiss
Form validation               RHF + Zod             Type-safe, no re-renders
Tabs (EA Studio)              shadcn Tabs           Keyboard roving tabindex
Candlestick chart             TradingView LC        10ms render, WS native
Sparkline                     Canvas API            Zero deps, 1KB
Code editor                   Monaco Editor         Syntax highlight, undo stack
Real-time table               TanStack Table        Virtualised rows, live sort
Global state                  Zustand               No boilerplate, selectors
Server state                  TanStack Query        Caching, background refresh
URL state                     nuqs                  Typesafe searchParams
Animations                    CSS + Framer Motion   CSS for simple, FM for complex
```

---

*Document maintained by: ForexElite Pro Engineering*
*Review cycle: Every sprint. Architecture changes require ADR.*
