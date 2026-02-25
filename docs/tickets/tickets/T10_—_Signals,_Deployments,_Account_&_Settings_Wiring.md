# T10 — Signals, Deployments, Account & Settings Wiring

## Overview

Wire the remaining 4 dashboard pages to real backend data. Also fix the TV Signals page which still has the old single-webhook-URL model instead of the per-strategy model.

**Files to modify:**
- `file:frontend/app/dashboard/signals/page.tsx`
- `file:frontend/app/dashboard/deployments/page.tsx`
- `file:frontend/app/dashboard/account/page.tsx`
- `file:frontend/app/dashboard/settings/page.tsx`

---

## Part 1 — TV Signals Page (`file:frontend/app/dashboard/signals/page.tsx`)

### Current Issues
- Uses mock `useSignalsStore`
- Still has old "Copy Webhook URL" + "+ Add Signal" buttons (not per-strategy model)
- Strategies list is hardcoded

### Required Changes

**Signal feed:** Replace mock store with `useQuery(() => apiGet('/api/v1/signals?limit=50'), { refetchInterval: 5000 })`. Each row shows: direction badge, pair, action, strategy name, status pill (executed/pending/failed/discarded), timestamp.

**Signal detail Sheet:** Clicking any signal row opens a `<Sheet>` (slide-in panel) showing:
- Full signal details: symbol, action, volume, fill price, broker order ID
- Status with color coding
- Error message (if failed/discarded)
- Raw payload (collapsible JSON block)
- Timestamps: received at, resolved at

**Strategies panel:** Replace hardcoded list with `useQuery(() => apiGet('/api/v1/strategies'))`. Each strategy card shows:
- Name, enabled/disabled toggle
- **"Copy URL" button** — copies the strategy's unique `webhook_url` to clipboard (per-strategy model)
- ⋯ menu: Edit, Disable/Enable, Delete

**"+ New Strategy" button** (replaces both old buttons): Opens a `<Dialog>` with:
- Strategy name (required)
- Broker account selector (from `GET /onboarding/brokers` or broker connections)
- Risk override % (optional, placeholder text: "Inherits from global settings")
- Allowed pairs (optional multi-select or comma-separated input)
- Submit → `POST /api/v1/strategies`

**Stat cards:** Wire to real signal counts from the signals query.

---

## Part 2 — Deployments Page (`file:frontend/app/dashboard/deployments/page.tsx`)

### Current Issues
- Uses `useOldEAStore` (mock data)
- MT5 connection info is hardcoded
- No real run/stop/logs functionality

### Required Changes

**Deployments list:** Replace `useOldEAStore` with `useQuery(() => apiGet('/api/v1/deployments'), { refetchInterval: 10000 })`.

Each deployment card shows:
- EA name + version, symbol, timeframe, magic number
- Status indicator (running = green pulse, stopped = grey, error = red)
- Run/Stop button → `POST /deployments/{id}/run` or `POST /deployments/{id}/stop`
- "Logs" button → opens `<Sheet>` with deployment logs

**Logs Sheet:** Calls `GET /deployments/{id}/logs` and polls every 3 seconds while open. Shows a scrollable list of job entries: type, status, timestamp, output/error.

**Agent Health panel:** Replace hardcoded "Connected to Exness-Demo" with real data from `GET /agents/{id}/status`. Show:
- Online/Offline/Degraded status with color
- Last heartbeat timestamp
- "Pair New Agent" button → calls `POST /agents/pair` and shows the pairing key in a dialog

**"+ New Deployment" button:** Opens a dialog with:
- EA version selector (compiled versions only, from `GET /ea/projects`)
- Broker account selector
- Symbol input
- Timeframe selector
- Magic number input (default: 12345)
- Submit → `POST /deployments`

---

## Part 3 — Account Page (`file:frontend/app/dashboard/account/page.tsx`)

### Current Issues
- Uses mock `useAccountStore`
- Plan details hardcoded

### Required Changes

**Account overview:** Replace mock store with `useQuery(() => apiGet('/api/v1/trading/account'), { refetchInterval: 30000 })`. Show real balance, equity, margin, leverage, currency.

**Broker connections:** Add a section showing all broker connections from `GET /onboarding/brokers` (or a new `GET /broker-connections` endpoint). Each connection shows broker name, account number, account type, with a "Remove" button.

**Profile section:** Show user email from `useAuthStore().user.email`. Add "Change Password" button → calls `supabase.auth.updateUser({ password: newPassword })`.

**Plan details:** Keep as static for MVP (Pro plan hardcoded). Real subscription management is out of scope.

---

## Part 4 — Settings Page (`file:frontend/app/dashboard/settings/page.tsx`)

### Current State
Fully static — no API calls.

### Required Changes

**Load settings:** `useQuery(() => apiGet('/api/v1/onboarding/preferences'))` on mount. Populate form fields with current values.

**Save settings:** Debounced auto-save (1000ms) on any field change → `PUT /onboarding/preferences`. Show "Saved ✓" indicator that fades after 2 seconds.

**Settings sections:**
- Risk Management: Risk per Trade %, Daily Loss Limit %, Max Spread
- Notifications: (static toggles for MVP — no backend)
- Danger Zone: "Delete Account" button → confirmation dialog → `supabase.auth.admin.deleteUser()` (or show "Contact support to delete your account" for MVP)

---

## Acceptance Criteria

- [ ] Signals feed shows real signals from backend, refreshes every 5s
- [ ] Clicking a signal row opens detail Sheet with full info including raw payload
- [ ] Strategies panel shows real strategies with per-strategy "Copy URL" buttons
- [ ] "+ New Strategy" dialog creates a strategy via `POST /strategies`
- [ ] Strategy enable/disable toggle calls `PATCH /strategies/{id}`
- [ ] Deployments list shows real deployments from backend, refreshes every 10s
- [ ] Run/Stop buttons call correct endpoints and update status
- [ ] Logs Sheet polls every 3s and shows real job history
- [ ] Agent health panel shows real online/offline status
- [ ] Account page shows real balance, equity, margin from backend
- [ ] Settings page loads current preferences and auto-saves on change
- [ ] No pages import from mock stores (`useOldEAStore`, `useAccountStore`, etc.)