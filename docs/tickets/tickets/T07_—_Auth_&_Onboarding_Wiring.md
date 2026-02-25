# T07 — Auth & Onboarding Wiring

## Overview

Wire the login, signup, and onboarding pages to the real backend. Currently both pages are fully static — no API calls, no validation, no state management.

**Files to modify:**
- `file:frontend/app/login/page.tsx`
- `file:frontend/app/onboarding/page.tsx`
- `file:frontend/middleware.ts` (fix onboarding redirect)

---

## Part 1 — Login Page (`file:frontend/app/login/page.tsx`)

### Current State
Static HTML form. "SIGN IN" button does nothing.

### Required Changes

**Form state with React Hook Form + Zod:**
```ts
schema: z.object({ email: z.string().email(), password: z.string().min(6) })
```

**Submit handler:**
1. Call `supabase.auth.signInWithPassword({ email, password })`
2. On success: store session in `useAuthStore`, redirect to `/dashboard`
3. On error: show error message below the form, trigger shake animation on the card
4. Loading state: disable button, show spinner inside button

**Shake animation:** CSS keyframe `@keyframes shake` applied to the card div on error. Use Framer Motion `animate` prop.

**Landing page ticker:** Replace hardcoded prices with Twelve Data free WebSocket for EURUSD, GBPUSD, XAUUSD, USDJPY. Show "—" if WebSocket not connected. This solves the "prices before login" open question.

**Signup tab:** Add a tab toggle (Login / Sign Up) on the same page. Signup form: email + password + confirm password. On success with email confirmation: show "Check your email" message. On success without confirmation: redirect to `/onboarding`.

---

## Part 2 — Onboarding Page (`file:frontend/app/onboarding/page.tsx`)

### Current State
Static 3-step wizard. All buttons are no-ops. No API calls.

### Step 1 — Connect MT5 Account

**Form fields:** Broker Name, Account Number, Account Type (Demo/Live), Label (optional)

**"Continue" action:**
1. Validate fields (Zod: broker_name required, account_number required)
2. Call `PUT /onboarding/brokers` with form data
3. On success: advance to Step 2
4. On error: show inline error

**Agent Pairing Panel** (new — below the broker form):
- Call `POST /agents/pair` to generate a pairing key
- Display the key in a monospace box with a "Copy" button
- Show warning: "⚠️ This key is shown only once. Copy it before continuing."
- Show instructions: "Run `python mt5_agent.py --key YOUR_KEY` on your MT5 machine"
- "Test Connection" button: calls `GET /agents/{id}/status` and shows green "Connected ✓" or red "Not connected yet"

### Step 2 — Risk Configuration

**Form fields:** Risk per Trade (%), Max Spread (pips), Max Drawdown (%), Daily Loss Limit (%)

**"Continue" action:**
1. Validate (all numeric, positive, reasonable ranges)
2. Call `PUT /onboarding/preferences` with `risk_percent`, `daily_loss_limit_pct`
3. On success: advance to Step 3

### Step 3 — Risk Disclaimer

**"Complete Setup" action:**
1. Checkbox must be checked (validate)
2. Call `PUT /onboarding/preferences` with `disclaimer_accepted: true`
3. On success: fire `canvas-confetti` burst
4. After 1.5s: redirect to `/dashboard`

### Middleware Fix

`file:frontend/middleware.ts` currently has a comment where the onboarding redirect should be. Fix: after checking session on `/onboarding`, call `GET /onboarding/status` and redirect to `/dashboard` if `onboarded: true`.

---

## Acceptance Criteria

- [ ] Login form validates email format and password length before submitting
- [ ] Invalid credentials show an error message and shake animation
- [ ] Successful login stores session in `useAuthStore` and redirects to `/dashboard`
- [ ] Signup with email confirmation shows "Check your email" message (no crash)
- [ ] Landing page ticker shows live prices from Twelve Data WebSocket
- [ ] Onboarding Step 1 saves broker connection via `PUT /onboarding/brokers`
- [ ] Agent pairing key is displayed once with a copy button and setup instructions
- [ ] "Test Connection" button shows real agent status from `GET /agents/{id}/status`
- [ ] Onboarding Step 2 saves risk preferences via `PUT /onboarding/preferences`
- [ ] Onboarding Step 3 saves `disclaimer_accepted: true` and fires confetti
- [ ] Completing onboarding redirects to `/dashboard`
- [ ] Already-onboarded users visiting `/onboarding` are redirected to `/dashboard`