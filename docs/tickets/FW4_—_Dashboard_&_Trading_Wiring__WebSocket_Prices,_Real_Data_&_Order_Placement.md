# FW4 — Dashboard & Trading Wiring: WebSocket Prices, Real Data & Order Placement

## What

Wire the Overview Dashboard, Live Trading, and Positions pages to real backend data. Replace all mock data with TanStack Query polling and live WebSocket price streaming.

## Scope

**WebSocket singleton (`file:frontend/app/dashboard/layout.tsx`)**
- On mount: connect to `ws://{API_HOST}/ws/prices/EURUSD?token={jwt}`
- On message `{type: "tick", data: {bid, ask, ts}}`: call `priceStore.update(pair, tick)`
- On disconnect: exponential backoff reconnect (1s → 2s → 4s → 8s → max 30s)
- On reconnect: re-subscribe to current active instrument
- "Agent offline" banner: TanStack Query polls `GET /agents/{id}/status` every 30s; show gold banner if `status = "offline"` or `"degraded"`

**Dashboard topbar ticker**
- Replace hardcoded `tickerItems` in `file:frontend/components/dashboard/DashboardLayout.tsx` with `priceStore` data
- Flash animation: green background flash on bid increase, red on decrease (500ms, Framer Motion)

**Overview Dashboard (`file:frontend/app/dashboard/page.tsx`)**
- Replace mock `useAccountStore` with TanStack Query `useQuery(['account'], () => apiGet('/account'), {refetchInterval: 5000})`
- Replace mock `usePositionsStore` with TanStack Query `useQuery(['positions'], () => apiGet('/positions'), {refetchInterval: 1000})`
- Stat cards: show shadcn `Skeleton` while loading
- `PriceChart`: replace mock candle data with `useQuery(['candles', symbol, timeframe], () => apiGet('/candles/{symbol}?timeframe={tf}&count=200'), {staleTime: 30000})`
- Live candle updates: on `priceStore` tick, update the last candle's close price in the chart

**Live Trading page (`file:frontend/app/dashboard/trading/page.tsx`)**
- BID/ASK/SPREAD bar: read from `priceStore.prices[symbol]`; Framer Motion flash on change
- `OrderPanel` wiring:
  - On "EXECUTE BUY/SELL": show shadcn `Dialog` with order summary (pair, side, lots, estimated fill, SL/TP, margin)
  - On confirm: `POST /orders {symbol, side, volume, sl_pips, tp_pips}` → spinner
  - On success: sonner toast "BUY EURUSD 0.01 filled @ 1.08428" + `queryClient.invalidateQueries(['positions'])`
  - On `503 agent_offline`: toast "Agent offline — order not placed"
  - On `503 insufficient_margin`: toast "Insufficient margin"
- Risk calculator: client-side only (no API call) — updates margin/R:R on every lot/SL/TP change

**Positions page (`file:frontend/app/dashboard/positions/page.tsx`)**
- Replace mock positions with TanStack Query `useQuery(['positions'], ..., {refetchInterval: 1000})`
- Live P&L: recalculate client-side on every `priceStore` tick using `useEffect` watching `priceStore.prices`
- P&L cell: Framer Motion flash green/red on value change
- Close position: shadcn `AlertDialog` → `DELETE /positions/{id}` → row slides out (Framer Motion `AnimatePresence`) → toast with final P&L
- "Close All": `Promise.allSettled` loop → summary toast "Closed N positions, total P&L: $X"

## Acceptance Criteria
- Dashboard stat cards show real account data; skeleton shown while loading
- Price chart updates on every WebSocket tick (last candle close updates live)
- BID/ASK/SPREAD bar flashes on price change
- Order placement: confirmation dialog → fill price toast → position appears in table within 2s
- Positions P&L updates every second from `priceStore` ticks
- Close position: row slides out with animation; toast shows final P&L
- "Agent offline" banner appears when heartbeat gap > 10 min
- WebSocket reconnects automatically after disconnect

## Spec References
- `spec:8faa0447-2e35-4cc5-9096-0cbce32ae00a/76c33f97-1068-4ba4-9b1d-7d25ebd911bd` — Flow 4 (Live Trading Dashboard)
- `spec:8faa0447-2e35-4cc5-9096-0cbce32ae00a/ff9b5702-f7bb-4863-b80f-475ca098bc44` — Tech Plan §3 (Frontend Components, TanStack Query polling table, WebSocket Manager)

## Dependencies
`ticket:8faa0447-2e35-4cc5-9096-0cbce32ae00a/BK5`, `ticket:8faa0447-2e35-4cc5-9096-0cbce32ae00a/FW2`