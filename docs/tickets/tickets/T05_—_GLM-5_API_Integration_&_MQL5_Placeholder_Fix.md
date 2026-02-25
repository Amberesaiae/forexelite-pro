# T05 — GLM-5 API Integration & MQL5 Placeholder Fix

## Overview

The EA generation service has two problems that make it non-functional in production:

1. `GLM5_API_BASE_URL` is set to `https://api.glm5.example.com` — a placeholder that doesn't exist
2. The fallback placeholder code (used when no API key is set) uses **MQL4 syntax** (`OrderSend`, `OP_BUY`, `Ask`, `Bid`) — this is invalid MQL5 and will fail to compile

**File:** `file:backend/app/services/ea_generator.py`

---

## Fix 1 — Real GLM-5 API Endpoint

The correct GLM-5 API is provided by **ZhipuAI** (智谱AI). The real endpoint and model name:

| Setting | Value |
|---|---|
| `GLM5_API_BASE_URL` | `https://open.bigmodel.cn/api/paas/v4` |
| Model name | `glm-4` (GLM-5 is marketed as GLM-4 in the API) |
| Auth header | `Authorization: Bearer {GLM5_API_KEY}` |
| Endpoint | `POST /chat/completions` |

Update `file:backend/app/core/config.py` default: `GLM5_API_BASE_URL: str = "https://open.bigmodel.cn/api/paas/v4"`

Update `file:backend/.env.example` with the correct URL.

---

## Fix 2 — MQL5 Placeholder Code

The current placeholder uses MQL4 functions. Replace with valid MQL5 skeleton:

**Key MQL5 differences from MQL4:**
- Use `MqlTradeRequest` / `MqlTradeResult` + `OrderSend()` (not the old `OrderSend()`)
- Use `SymbolInfoDouble(_Symbol, SYMBOL_ASK)` not `Ask`
- Use `SymbolInfoDouble(_Symbol, SYMBOL_BID)` not `Bid`
- Use `AccountInfoDouble(ACCOUNT_BALANCE)` not `AccountBalance()`
- No `OP_BUY` — use `ORDER_TYPE_BUY`

The placeholder should be a valid, compilable MQL5 EA skeleton that demonstrates the correct structure.

---

## Fix 3 — Retry Logic for GLM-5 API

Add retry with exponential backoff for transient API failures:
- Max 3 attempts
- Backoff: 1s, 2s, 4s
- Retry on: 429 (rate limit), 500, 502, 503, 504
- Do not retry on: 400, 401, 403

---

## Fix 4 — System Prompt Improvement

The current system prompt is generic. Improve it to produce better MQL5 code:
- Explicitly state MQL5 (not MQL4) syntax requirements
- Require `#include <Trade/Trade.mqh>` for order management
- Require `CTrade trade` object usage
- Specify that `OnTick()` must check for new bar using `iTime()`
- Require input parameters for all configurable values

---

## Acceptance Criteria

- [ ] `GLM5_API_BASE_URL` default points to `https://open.bigmodel.cn/api/paas/v4`
- [ ] `file:backend/.env.example` updated with correct URL
- [ ] When `GLM5_API_KEY` is empty, placeholder returns valid MQL5 (not MQL4) code
- [ ] Placeholder code compiles without errors in MetaEditor
- [ ] When API key is set, `POST /ea/generate` calls ZhipuAI and returns real MQL5 code
- [ ] Transient API errors (429, 5xx) are retried up to 3 times with backoff
- [ ] Non-retryable errors (401, 403) fail immediately with a clear error message
- [ ] Generated code does not contain MQL4-only functions (`Ask`, `Bid`, `OrderSend` old style, `OP_BUY`)