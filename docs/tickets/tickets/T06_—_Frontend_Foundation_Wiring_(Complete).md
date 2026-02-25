# T06 — Frontend Foundation Wiring (Complete)

## Status: ✅ Done

This ticket documents what has already been built and verified in the frontend codebase. No implementation work required.

### What Was Built

**`file:frontend/lib/supabase.ts`**
- `createBrowserClient` from `@supabase/ssr` — correct for Next.js App Router
- Reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**`file:frontend/lib/api.ts`**
- `apiFetch<T>()` — attaches Supabase JWT as `Authorization: Bearer` header
- 401 handler: refreshes session and retries once; redirects to `/login` on second 401
- 428 handler: redirects to `/onboarding` if not already there
- `apiGet`, `apiPost`, `apiPatch`, `apiDelete` convenience wrappers

**`file:frontend/middleware.ts`**
- `createServerClient` from `@supabase/ssr` for server-side session check
- Redirects unauthenticated users from `/dashboard/*` to `/login`

**`file:frontend/stores/authStore.ts`** — `user`, `session`, `setSession`, `clearSession`

**`file:frontend/stores/priceStore.ts`** — `prices` map with `bid`, `ask`, `ts`, `flash` state; `update()` with 500ms flash timeout

**`file:frontend/stores/eaStore.ts`** — `activeProjectId`, `activeVersionId`, `editorContent`, `isDirty`, `lockState`, `generatedCode` with correct setters

**`file:frontend/stores/uiStore.ts`** — `sidebarOpen`, `toggleSidebar`

**`file:frontend/components/Providers.tsx`** — TanStack Query `QueryClientProvider` wrapping the app

**Dependencies installed:** `@supabase/ssr`, `@monaco-editor/react`, `canvas-confetti`, `@tanstack/react-query`, `zod`, `react-hook-form`, `@hookform/resolvers`

**Design tokens:** Gold `#C9A84C`, dark `#070D1B`, green `#00E5A0`, red `#FF4560` in `file:frontend/app/globals.css`

**Fonts:** Bebas Neue (display), DM Sans (body), JetBrains Mono (prices/code) loaded via `next/font`

### Acceptance Criteria (All Met)
- [x] `lib/supabase.ts` exports a working browser Supabase client
- [x] `lib/api.ts` attaches JWT, handles 401 refresh, handles 428 redirect
- [x] `middleware.ts` protects `/dashboard/*` routes
- [x] All 4 new Zustand stores exported from `stores/`
- [x] TanStack Query provider wraps the app
- [x] All required npm packages installed