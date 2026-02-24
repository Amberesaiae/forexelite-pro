# FW2 — Auth & Onboarding Wiring: Supabase Auth, Wizard Backend Integration & Agent Pairing UX

## What

Wire the existing login/signup UI and onboarding wizard to the real backend. Replace all mock interactions with live Supabase auth and API calls.

## Scope

**Login page (`file:frontend/app/login/page.tsx`)**
- Add Zod schema: email format + password min 8 chars
- `react-hook-form` + `zodResolver` for form state
- Submit: disable button + show spinner
- On success: store session via `authStore.setSession(session)` → check `GET /onboarding/status` → redirect to `/dashboard` or `/onboarding`
- On error: shake animation (Framer Motion `x` keyframes: `[0, -8, 8, -8, 8, 0]`) + sonner toast with message
- Toggle between login/signup on same page (animated with Framer Motion `AnimatePresence`)
- Bottom ticker: connect to `priceStore` (static fallback if no prices yet)

**Onboarding wizard (`file:frontend/app/onboarding/page.tsx`)**

- **Step 1 — Connect MT5 + Pair Agent:**
  - Form fields: broker name, account number, account type toggle (Demo/Live), label (optional)
  - "Download Agent" button → links to agent script download (placeholder URL for now)
  - "Generate Pairing Key" button → `POST /agents/pair` → display raw key in monospace box with copy button + warning "This key will not be shown again"
  - After key shown: display only `pairing_key_prefix + "••••••••"` on subsequent renders
  - "Test Connection" button → `PUT /onboarding/brokers` → spinner → success checkmark or inline error
  - Advance to Step 2 only after Test Connection succeeds

- **Step 2 — Risk Configuration:**
  - Risk % slider (shadcn Slider, 0.1–5%, default 1%, step 0.1)
  - Preferred pairs multi-select chips (EURUSD, GBPUSD, XAUUSD, USDJPY, AUDUSD, USDCAD)
  - Daily loss limit % input
  - "Continue" → `PUT /onboarding/preferences` → advance to Step 3

- **Step 3 — Disclaimer:**
  - Scrollable disclaimer text (existing content is fine)
  - "Complete Setup" disabled until: scroll reaches bottom (IntersectionObserver on last paragraph) + both checkboxes checked
  - On complete: `PUT /onboarding/preferences {disclaimer_accepted: true}` → confetti (`canvas-confetti`) → sonner toast "Welcome to ForexElite Pro 🎉" → redirect to `/dashboard`

- Progress persisted: on page load, `GET /onboarding/status` → restore to correct step

## Acceptance Criteria
- Login with valid credentials → JWT stored → redirect to `/dashboard`
- Login with invalid credentials → shake animation + toast error
- Signup creates account → redirect to `/onboarding`
- Onboarding Step 1: "Test Connection" calls `PUT /onboarding/brokers`; success advances step
- Pairing key shown once; subsequent visits show prefix + masked suffix
- Step 3 "Complete Setup" disabled until scrolled + both checkboxes checked
- Confetti plays on completion; user lands on `/dashboard`
- Refreshing mid-onboarding restores correct step

## Spec References
- `spec:8faa0447-2e35-4cc5-9096-0cbce32ae00a/76c33f97-1068-4ba4-9b1d-7d25ebd911bd` — Flow 1 (Authentication), Flow 2 (Onboarding Wizard)
- `spec:8faa0447-2e35-4cc5-9096-0cbce32ae00a/ff9b5702-f7bb-4863-b80f-475ca098bc44` — Tech Plan §3 (Auth Middleware, Agent Pairing)

## Dependencies
`ticket:8faa0447-2e35-4cc5-9096-0cbce32ae00a/BK2`, `ticket:8faa0447-2e35-4cc5-9096-0cbce32ae00a/FW1`