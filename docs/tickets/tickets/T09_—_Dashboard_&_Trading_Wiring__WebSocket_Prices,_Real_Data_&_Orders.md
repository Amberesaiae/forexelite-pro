# T09 — Dashboard & Trading Wiring: WebSocket Prices, Real Data & Orders

## Overview

Wire the Overview Dashboard, Live Trading, and Positions pages to real backend data. Replace all mock Zustand stores with TanStack Query + WebSocket. This is the most complex frontend ticket.

**Files to modify:**
- `file:frontend/components/dashboard/DashboardLayout.tsx`
- `file:frontend/app/dashboard/page.tsx`
- `file:frontend/app/dashboard/trading/page.tsx`
- `file:frontend/app/dashboard/positions/page.tsx`
- `file:frontend/components/dashboard/PriceChart.tsx`
- `file:frontend/components/dashboard/trading/OrderPanel.tsx`
- `file:frontend/components/dashboard/trading/PositionsTable.tsx`
- `file:frontend/stores/index.ts` (remove mock stores from exports)

---

## Part 1 — WebSocket Singleton in DashboardLayout

**`file:frontend/components/dashboard/DashboardLayout.tsx`:**

Add a WebSocket connection that lives for the entire dashboard session:

```ts
// Connect on mount, disconnect on unmount
const ws = new WebSocket(`${WS_BASE_URL}/ws/prices/EURUSD?token=${accessToken}`)
ws.onmessage = (e) => {
  const { type, data } = JSON.parse(e.data)
  if (type === 'tick') usePriceStore.getState().update('EURUSD', data)
}
```

- Connect to all 6 default pairs (EURUSD, GBPUSD, XAUUSD, USDJPY, AUDUSD, USDCAD) — one WebSocket per pair
- Exponential backoff reconnection: 1s, 2s, 4s, 8s, max 30s
- **Agent Offline Banner:** If no price tick received for >10 seconds, show a gold banner at the top of the layout: "⚠️ MT5 Agent offline — prices unavailable. [Setup Agent →]"

---

## Part 2 — Overview Dashboard (`file:frontend/app/dashboard/page.tsx`)

Replace mock store reads with TanStack Query:

| Data | Query | Refresh |
|---|---|---|
| Account info | `GET /api/v1/trading/account` | Every 30s |
| Open positions | `GET /api/v1/trading/positions` | Every 10s |
| Agent status | `GET /api/v1/agents/{id}/status` | Every 30s |

**Stat cards:** Wire to real `account.balance`, `account.equity`, `account.margin_used`

**Open P&L stat card:** Sum `pnl` from positions query. Update live as prices change in `priceStore`.

**EA Activity panel:** Replace hardcoded EAs with `GET /api/v1/deployments` (show top 3 running deployments)

**Performance chart (7D):** Keep as visual placeholder for MVP — real performance data requires a `trade_events` table query that is out of scope for this ticket.

**Risk Metrics panel:** Keep as visual placeholder for MVP.

---

## Part 3 — Live Trading Page (`file:frontend/app/dashboard/trading/page.tsx`)

**BID/ASK/SPREAD display:** Read from `usePriceStore().prices[symbol]`. Flash green on price up, red on price down (already implemented in `priceStore`).

**PriceChart:** Wire to `GET /api/v1/trading/candles/{instrument}?timeframe={tf}&count=200`. Show loading skeleton while fetching. Show "Agent offline" empty state if response is `[]`.

**OrderPanel (`file:frontend/components/dashboard/trading/OrderPanel.tsx`):**
1. Replace `onSubmit` prop handler with direct `POST /api/v1/trading/orders` call
2. Show confirmation dialog before submitting: "Place {side} {volume} lots {symbol} at market?"
3. Loading state: disable button, show spinner
4. On `status: "filled"`: show green toast "Order filled at {fill_price}"
5. On `status: "error"`: show red toast with error detail
6. On `status: "pending"` (timeout): show amber toast "Order pending — check MT5"
7. On `detail: "agent_offline"`: show "MT5 Agent is offline. Start your agent to trade."

---

## Part 4 — Positions Page (`file:frontend/app/dashboard/positions/page.tsx`)

**PositionsTable (`file:frontend/components/dashboard/trading/PositionsTable.tsx`):**
- Replace mock `usePositionsStore` with `useQuery(() => apiGet('/api/v1/trading/positions'), { refetchInterval: 10000 })`
- Live P&L: for each position, compute `pnl` using current price from `usePriceStore().prices[position.symbol]` — update in real time as prices tick
- "Close" button per row: calls `DELETE /api/v1/trading/positions/{ticket}`, shows confirmation dialog, shows fill price toast on success
- "Close All" button: calls `DELETE` for each position in sequence, shows progress

**Stat cards:** Wire to real positions data (total P&L, margin utilization from account query)

---

## Part 5 — Clean Up Mock Stores

In `file:frontend/stores/index.ts`:
- Remove `useAccountStore`, `usePositionsStore`, `useSignalsStore`, `useOldEAStore`, `useTickerStore` exports and their implementations
- These are replaced by TanStack Query hooks in each page
- Keep only the 4 new stores: `useAuthStore`, `usePriceStore`, `useEAStore`, `useUIStore`

---

## Acceptance Criteria

- [ ] WebSocket connects on dashboard load and feeds `priceStore` with live ticks
- [ ] BID/ASK/SPREAD on trading page update in real time with flash animation
- [ ] "Agent offline" banner appears when no ticks received for 10+ seconds
- [ ] Overview dashboard stat cards show real account balance, equity, margin
- [ ] Open P&L stat card updates live as prices change
- [ ] PriceChart loads real candles from backend; shows empty state when agent offline
- [ ] Order placement calls `POST /orders`, shows confirmation dialog, fill price toast
- [ ] Positions table shows real positions from backend, refreshes every 10s
- [ ] Live P&L per position updates as prices tick in `priceStore`
- [ ] Close position calls `DELETE /positions/{ticket}` with confirmation
- [ ] Mock stores (`useAccountStore`, `usePositionsStore`, etc.) removed from `stores/index.ts`
- [ ] No TypeScript errors after mock store removal