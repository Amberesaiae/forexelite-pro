# FW5 — Signals, Deployments, Account & Settings Wiring

## What

Wire the four remaining pages to real backend data: TV Signals (per-strategy webhooks, signal feed, strategy management), Deployments (run/stop/logs), Account (equity ring, profile, broker management), and Settings (debounced save, danger zone).

## Scope

**TV Signals page (`file:frontend/app/dashboard/signals/page.tsx`)**
- Remove old "Copy Webhook URL" + "+ Add Signal" buttons
- Add "+ New Strategy" primary CTA (topbar)
- Signal feed: `useQuery(['signals'], () => apiGet('/signals'), {refetchInterval: 10000})`; new signals slide in from top (Framer Motion)
- Signal row click → shadcn `Sheet` (right): fill price, ticket number, strategy name, raw payload JSON, error message if failed
- Active Strategies panel: `useQuery(['strategies'], () => apiGet('/strategies'))`
  - Per-strategy "Copy URL" button: copies `strategy.webhook_url` to clipboard → "Copied ✓" 2s feedback
  - Enable/Disable toggle → `PATCH /strategies/{id} {is_enabled}`
  - "Edit" → same Sheet form pre-filled
- "+ New Strategy" Sheet form: strategy name, broker account selector (`GET /onboarding/brokers`), risk override % (optional), allowed pairs chips (optional)
  - Submit → `POST /strategies` → toast "Strategy created" → `queryClient.invalidate(['strategies'])`

**Deployments page (`file:frontend/app/dashboard/deployments/page.tsx`)**
- Agent status badge: `useQuery(['agent-status'], () => apiGet('/agents/{id}/status'), {refetchInterval: 30000})`; green pulse / gold pulse / grey based on `status`
- Deployments list: `useQuery(['deployments'], () => apiGet('/deployments'), {refetchInterval: 5000})`
- Stop EA: shadcn `AlertDialog` → `POST /deployments/{id}/stop` → status dot → grey + toast
- Run EA: `POST /deployments/{id}/run` → status dot → green pulse + toast
- Logs Sheet: `useQuery(['logs', deploymentId], () => apiGet('/deployments/{id}/logs'), {refetchInterval: 3000, enabled: logsOpen})`; auto-scroll toggle; monospace log list

**Account page (`file:frontend/app/dashboard/account/page.tsx`)**
- Equity ring: `useQuery(['account'], () => apiGet('/account'), {refetchInterval: 5000})`; SVG ring animates on data change (strokeDashoffset transition 1s)
- Profile section: `useQuery(['profile'], () => apiGet('/profile'), {staleTime: 60000})`; "Edit Profile" → shadcn `Dialog` → `PATCH /profile` → optimistic update
- Connected Brokers: `useQuery(['brokers'], () => apiGet('/onboarding/brokers'))`; "Disconnect" → `AlertDialog` → `DELETE /brokers/{id}`; "+ Connect New" → same Sheet form as onboarding Step 1

**Settings page (`file:frontend/app/dashboard/settings/page.tsx`)**
- Load settings: `useQuery(['preferences'], () => apiGet('/preferences'))`
- All inputs: `onChange` → `setLocalValue` (immediate UI) + debounce 800ms → `PATCH /preferences` → sonner toast "Settings saved" (2s)
- Danger Zone (collapsible `<details>`):
  - "Delete All EAs": type "DELETE" to confirm → `DELETE /ea/projects` (bulk) → toast
  - "Disconnect All Brokers": confirmation → `DELETE /brokers/all`
  - "Delete Account": type email to confirm → `DELETE /account` → `supabase.auth.signOut()` → redirect to `/`

## Acceptance Criteria
- TV Signals: signal feed updates every 10s; new signals slide in; signal detail Sheet shows fill price / error
- Per-strategy "Copy URL" copies correct unique URL; "Copied ✓" feedback shows for 2s
- New Strategy form saves and immediately shows in Active Strategies with Copy URL button
- Deployments: Stop/Run actions update status dot within 5s; Logs Sheet polls every 3s while open
- Account equity ring animates on page load and on equity change
- Settings: changes save with 800ms debounce; "Settings saved" toast appears
- "Delete Account" requires typing email; account fully deleted on confirm

## Spec References
- `spec:8faa0447-2e35-4cc5-9096-0cbce32ae00a/76c33f97-1068-4ba4-9b1d-7d25ebd911bd` — Flow 5 (TradingView Signal Execution), Account + Settings pages
- `spec:8faa0447-2e35-4cc5-9096-0cbce32ae00a/ff9b5702-f7bb-4863-b80f-475ca098bc44` — Tech Plan §3 (TanStack Query polling table)

## Dependencies
`ticket:8faa0447-2e35-4cc5-9096-0cbce32ae00a/BK6`, `ticket:8faa0447-2e35-4cc5-9096-0cbce32ae00a/BK7`, `ticket:8faa0447-2e35-4cc5-9096-0cbce32ae00a/FW2`