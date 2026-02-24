# Epic Brief — ForexElite Pro Full MVP

## Summary

ForexElite Pro is an AI-powered forex trading platform built for retail traders who use MetaTrader 5 (MT5) brokers. The platform solves three interconnected problems: the high technical barrier to automating trading strategies (requiring MQL5 programming expertise), the lack of a bridge between TradingView signal alerts and MT5 trade execution, and the absence of a unified dashboard for monitoring multiple MT5 accounts. The MVP is a full-stack rebuild — both frontend (Next.js 14) and backend (FastAPI) — following canonical specifications already defined in `file:artefacts/`. The rebuild is scoped to 8 weeks and delivers a production-ready freemium SaaS product.

---

## Context & Problem

### Who Is Affected

**Primary user:** Retail forex traders who already use MT5 brokers (Exness, IC Markets, XM, Pepperstone, etc.) and want to automate their strategies without writing code from scratch.

**Secondary user:** TradingView strategy authors who want their Pine Script alerts to automatically execute real trades on MT5 — a workflow that currently requires custom infrastructure.

### Where in the Product

This Epic covers the entire product from zero — there is no existing implementation. All prior code was deleted on February 23, 2026 because it deviated from the canonical UI/UX spec. The `file:artefacts/` folder contains the complete, agreed-upon specifications (1,591-line UI/UX spec, backend API contracts, system architecture, database schema) that this rebuild must follow precisely.

### The Core Problems

1. **EA creation barrier:** Writing a working MQL5 Expert Advisor requires deep programming knowledge. Traders with valid strategies cannot act on them without hiring a developer or spending weeks learning MQL5.

2. **TradingView → MT5 gap:** TradingView can send webhook alerts when a strategy fires, but there is no standard, user-friendly bridge to execute those signals as real orders on MT5. Traders either miss entries or rely on fragile DIY scripts.

3. **Fragmented account monitoring:** Traders running multiple MT5 accounts (across brokers or account types) have no single view of their aggregate positions, equity, and P&L. They switch between MT5 terminals manually.

### Why Now

The canonical specs are complete and agreed upon. The previous implementation was discarded precisely because it didn't follow them. This Epic is the clean, correct rebuild — the right time to build it properly.

---

## Scope

| Phase | Weeks | Core Deliverable |
|---|---|---|
| Foundation | 1 | Dev environment running, auth working, design system applied |
| Onboarding | 2 | User can connect MT5 account and complete 3-step wizard |
| EA Generator | 3–4 | User can describe a strategy, receive MQL5 code via GLM-5, edit it, compile it |
| Dashboard & Trading | 5–6 | Real-time prices, open positions, manual order placement |
| TradingView & Deployments | 7–8 | Webhook signal execution, EA deployment monitoring, account & settings |

**Not in scope:** Demo accounts, backtesting engine, signals marketplace, mobile app, chart analysis tools — MT5 already provides all of these.

---

## Success Criteria

- A user can sign up, connect an MT5 account, and reach the dashboard in under 5 minutes
- A user can describe a trading strategy in plain English and receive compilable MQL5 code
- A TradingView alert fires and executes a real trade on MT5 within seconds
- All 10 pages match the design system defined in `file:artefacts/FOREXELITE_UIUX_SPEC.md`
- Both frontend and backend servers run cleanly from a fresh clone