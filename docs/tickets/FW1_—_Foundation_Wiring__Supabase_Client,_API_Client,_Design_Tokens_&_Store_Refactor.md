# FW1 — Foundation Wiring: Supabase Client, API Client, Design Tokens & Store Refactor

## What

Wire up the frontend infrastructure layer: Supabase client, authenticated API client, design tokens, fonts, TanStack Query provider, and refactor Zustand stores to remove all mock data and adopt the correct shapes.

## Scope

**Install missing dependencies**
- `@supabase/ssr` — SSR-compatible Supabase client
- `@monaco-editor/react` — Monaco Editor (used in FW3)
- `canvas-confetti` + `@types/canvas-confetti` — onboarding completion animation (used in FW2)

**Supabase client (`file:frontend/lib/supabase.ts`)**
- Browser client: `createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)`
- Server client factory: `createServerClient(...)` for Next.js middleware
- Export `supabase` singleton for client-side use

**Authenticated API client (`file:frontend/lib/api.ts`)**
- Base URL from `NEXT_PUBLIC_API_URL` env var
- `apiFetch(path, options)` — attaches `Authorization: Bearer <supabase_access_token>` on every request
- On `401` response: attempt token refresh via `supabase.auth.refreshSession()`, retry once
- On `428` response: redirect to `/onboarding` (using `next/navigation` router)
- Typed helpers: `apiGet<T>`, `apiPost<T>`, `apiPatch<T>`, `apiDelete<T>`

**Design tokens (`file:frontend/app/globals.css`)**
- CSS custom properties: `--color-gold: #C9A84C`, `--color-bg-base: #070D1B`, `--color-bg-surface: #090F1E`, `--color-bg-elevated: #0C1525`, `--color-border: #131E32`, `--color-text-primary: #EEF2FF`, `--color-text-muted: #8899BB`, `--color-text-dim: #3F5070`, `--color-green: #00E5A0`, `--color-red: #FF4560`
- Font variables: `--font-display` (Bebas Neue), `--font-body` (DM Sans), `--font-mono` (JetBrains Mono)

**Font setup (`file:frontend/app/layout.tsx`)**
- Load Bebas Neue, DM Sans, JetBrains Mono via `next/font/google`
- Apply font variables to `<html>` element

**TanStack Query provider**
- Wrap `app/layout.tsx` with `QueryClientProvider`
- `QueryClient` config: `staleTime: 30_000`, `retry: 1`
- Include `ReactQueryDevtools` in development only

**Zustand store refactor (`file:frontend/stores/`)**

Split `stores/index.ts` into focused files:

- `stores/authStore.ts` — `{user, session, setSession, clearSession}` — no mock data
- `stores/priceStore.ts` — `{prices: Record<string, {bid, ask, ts, flash: "up"|"dn"|null}>, update(pair, tick)}` — `update()` computes flash by comparing to previous bid; flash resets after 500ms
- `stores/eaStore.ts` — `{activeProjectId, activeVersionId, editorContent, isDirty, lockState: "locked"|"unlocked", setProject, setVersion, setContent, setDirty, setLock}` — no mock data
- `stores/uiStore.ts` — `{sidebarOpen, toggleSidebar}` — no mock data, no hardcoded notifications
- Remove `AccountStore`, `PositionsStore`, `SignalsStore`, `EAStore`, `TickerStore` mock data — these will be populated by TanStack Query from real API

**Next.js middleware (`file:frontend/middleware.ts`)**
- Protect `/dashboard/*` routes: redirect to `/login` if no valid Supabase session
- Protect `/onboarding` route: redirect to `/dashboard` if already onboarded

## Acceptance Criteria
- `pnpm dev` starts without errors after dependency install
- `apiFetch` attaches JWT header; 401 triggers refresh + retry; 428 redirects to `/onboarding`
- Design tokens render correctly: gold buttons, dark backgrounds, correct fonts
- `priceStore.update()` sets `flash: "up"` when bid increases, `"dn"` when decreases, resets after 500ms
- `eaStore` initialises with all fields null/empty (no mock data)
- TanStack Query DevTools visible in development

## Spec References
- `spec:8faa0447-2e35-4cc5-9096-0cbce32ae00a/ff9b5702-f7bb-4863-b80f-475ca098bc44` — Tech Plan §1 (Tech stack), §3 (Frontend Components, TanStack Query polling table)
- `spec:8faa0447-2e35-4cc5-9096-0cbce32ae00a/f1b63c35-3e67-41cd-b522-be038b972831` — Epic Brief (design system: colors, fonts)

## Dependencies
`ticket:8faa0447-2e35-4cc5-9096-0cbce32ae00a/BK1` (env vars must be known to document in `.env.local.example`)