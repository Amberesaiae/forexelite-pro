# TradingView Integration Research

## Executive Summary

TradingView can be integrated with ForexElite Pro through **webhook-based alert systems**. When a Pine Script strategy generates a signal, it sends a JSON webhook to a bridge service, which then executes trades on MT5 via broker APIs or Expert Advisors.

**Key Requirements:**
- TradingView Pro subscription ($14.95/month minimum) for webhook alerts
- Webhook receiver endpoint (custom or third-party)
- MT5 EA or broker API integration
- Pine Script strategy with alert configuration

---

## How TradingView Webhooks Work

### 1. Signal Generation Flow

```
Pine Script Strategy → Alert Triggered → Webhook Sent → Bridge Service → MT5/Broker API → Trade Executed
```

### 2. Webhook Payload Structure

TradingView sends POST requests with JSON payloads:

```json
{
  "ticker": "EURUSD",
  "action": "buy",
  "price": 1.0850,
  "quantity": 0.1,
  "timestamp": "2026-02-22T10:30:00Z",
  "strategy": "MA_Crossover",
  "comment": "Golden cross detected"
}
```

### 3. Pine Script Alert Configuration

```pine
strategy("My Strategy", overlay=true)

// Strategy logic
longCondition = ta.crossover(ta.sma(close, 50), ta.sma(close, 200))
if (longCondition)
    strategy.entry("Long", strategy.long)
    alert('{"action":"buy","ticker":"{{ticker}}","price":{{close}},"quantity":0.1}', alert.freq_once_per_bar)
```

---

## Integration Architecture Options

### Option 1: Custom Webhook Receiver (Recommended for ForexElite Pro)

**Architecture:**
```
TradingView Alert → ForexElite Backend API → Broker Adapter → MT5/OANDA
```

**Advantages:**
- Full control over signal processing
- No third-party fees
- Seamless integration with existing broker adapters
- Custom risk management and position sizing
- Signal history and analytics

**Implementation:**
- Add webhook endpoint to FastAPI backend
- Parse TradingView JSON payload
- Validate and transform to broker format
- Execute via existing broker adapters (OANDA, MT5 Agent, MetaApi)

**Cost:** $0 (only TradingView Pro required)

---

### Option 2: Third-Party Bridge Services

#### A. PineConnector
- **Website:** pineconnector.com
- **Cost:** $47-97/month
- **Features:**
  - Direct MT4/MT5 integration
  - Risk management tools
  - Multi-account support
  - No coding required
- **Limitations:**
  - Requires EA installation on MT5
  - Additional monthly cost
  - Less customization

#### B. TradersPost
- **Website:** traderspost.io
- **Cost:** $29-99/month
- **Features:**
  - Multi-broker support (Alpaca, TradeStation, Interactive Brokers)
  - Webhook receiver
  - Strategy backtesting
  - Paper trading
- **Limitations:**
  - Limited MT5 support
  - Forex broker support unclear
  - Additional subscription cost

#### C. MetaConnector
- **Cost:** One-time $97
- **Features:**
  - MT4/MT5 webhook receiver EA
  - JSON parsing
  - Risk management
- **Limitations:**
  - Requires EA installation
  - One-time purchase but limited updates

---

## Recommended Implementation for ForexElite Pro

### Phase 1: Custom Webhook Receiver (MVP)

**Backend Changes:**

1. **New API Endpoint** (`backend/app/api/routes/tradingview.py`):
```python
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.auth import verify_webhook_signature
from app.brokers.resolver import get_broker_adapter

router = APIRouter()

class TradingViewAlert(BaseModel):
    ticker: str
    action: str  # "buy", "sell", "close"
    price: float
    quantity: float
    strategy: str
    timestamp: str
    user_id: str  # Added by webhook URL parameter

@router.post("/webhook/{user_id}/{broker_id}")
async def receive_tradingview_alert(
    user_id: str,
    broker_id: str,
    alert: TradingViewAlert,
    signature: str = Depends(verify_webhook_signature)
):
    # Validate user and broker
    broker = await get_broker_adapter(user_id, broker_id)
    
    # Transform to broker format
    order = {
        "symbol": alert.ticker,
        "type": "market",
        "side": alert.action,
        "volume": alert.quantity,
        "comment": f"TV:{alert.strategy}"
    }
    
    # Execute trade
    result = await broker.place_order(order)
    
    # Log signal
    await log_tradingview_signal(user_id, alert, result)
    
    return {"status": "success", "order_id": result.order_id}
```

2. **Database Schema** (add to Supabase):
```sql
CREATE TABLE tradingview_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    broker_id UUID REFERENCES broker_connections(id),
    strategy_name TEXT NOT NULL,
    ticker TEXT NOT NULL,
    action TEXT NOT NULL,
    price DECIMAL(10, 5),
    quantity DECIMAL(10, 2),
    order_id TEXT,
    status TEXT, -- 'success', 'failed', 'rejected'
    error_message TEXT,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    executed_at TIMESTAMPTZ
);

CREATE INDEX idx_tv_signals_user ON tradingview_signals(user_id);
CREATE INDEX idx_tv_signals_strategy ON tradingview_signals(strategy_name);
```

3. **Security: Webhook Signature Verification**:
```python
import hmac
import hashlib

def verify_webhook_signature(signature: str, payload: bytes, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)
```

---

### Phase 2: Frontend Integration

**Dashboard Features:**

1. **TradingView Webhook Setup Page**:
   - Generate unique webhook URL per broker connection
   - Display webhook secret for signature verification
   - Show example Pine Script alert code
   - Test webhook endpoint

2. **Signal History Table**:
   - List all received TradingView signals
   - Show execution status (success/failed)
   - Filter by strategy, ticker, date range
   - Performance analytics per strategy

3. **Strategy Management**:
   - Enable/disable strategies
   - Set risk limits per strategy
   - Configure position sizing rules
   - Pause/resume signal execution

---

## TradingView Setup Guide (For Users)

### Step 1: Upgrade to TradingView Pro
- Minimum: Pro plan ($14.95/month) for webhook alerts
- Premium/Ultimate for more alerts and features

### Step 2: Create Pine Script Strategy
```pine
//@version=5
strategy("ForexElite Signal", overlay=true)

// Strategy parameters
fastMA = input.int(10, "Fast MA")
slowMA = input.int(30, "Slow MA")
lotSize = input.float(0.1, "Lot Size")

// Calculate indicators
fast = ta.sma(close, fastMA)
slow = ta.sma(close, slowMA)

// Entry conditions
longCondition = ta.crossover(fast, slow)
shortCondition = ta.crossunder(fast, slow)

// Execute trades
if (longCondition)
    strategy.entry("Long", strategy.long)
    alert('{"action":"buy","ticker":"' + syminfo.ticker + '","price":' + str.tostring(close) + ',"quantity":' + str.tostring(lotSize) + ',"strategy":"ForexElite Signal"}', alert.freq_once_per_bar)

if (shortCondition)
    strategy.entry("Short", strategy.short)
    alert('{"action":"sell","ticker":"' + syminfo.ticker + '","price":' + str.tostring(close) + ',"quantity":' + str.tostring(lotSize) + ',"strategy":"ForexElite Signal"}', alert.freq_once_per_bar)

// Plot indicators
plot(fast, color=color.green)
plot(slow, color=color.red)
```

### Step 3: Configure Alert
1. Right-click chart → "Add Alert"
2. Condition: Select your strategy
3. Alert actions: Check "Webhook URL"
4. Webhook URL: `https://api.forexelite.pro/tradingview/webhook/{user_id}/{broker_id}`
5. Message: Use JSON format from Pine Script
6. Save alert

### Step 4: Monitor Execution
- Check ForexElite Pro dashboard for signal history
- Verify trades executed on MT5
- Review performance analytics

---

## Cost Analysis

### Option 1: Custom Implementation (Recommended)
| Item | Cost |
|------|------|
| TradingView Pro | $14.95/month |
| ForexElite Pro Development | $0 (in-house) |
| Hosting (webhook endpoint) | Included in backend |
| **Total Monthly** | **$14.95** |

### Option 2: PineConnector
| Item | Cost |
|------|------|
| TradingView Pro | $14.95/month |
| PineConnector | $47-97/month |
| **Total Monthly** | **$61.95-111.95** |

### Option 3: TradersPost
| Item | Cost |
|------|------|
| TradingView Pro | $14.95/month |
| TradersPost | $29-99/month |
| **Total Monthly** | **$43.95-113.95** |

**Recommendation:** Custom implementation saves $29-97/month per user and provides better integration.

---

## Risk Management Considerations

### 1. Signal Validation
- Verify ticker symbol matches broker's symbol format
- Check market hours (Forex sessions)
- Validate lot size against account balance
- Prevent duplicate signals (debouncing)

### 2. Position Sizing
- Calculate lot size based on account equity
- Apply risk percentage limits (e.g., 2% per trade)
- Check margin requirements
- Respect max open positions

### 3. Error Handling
- Retry failed webhook deliveries (TradingView retries 3 times)
- Log all signals for audit trail
- Alert user on execution failures
- Implement circuit breaker for repeated failures

### 4. Security
- Use HTTPS for webhook endpoint
- Implement signature verification
- Rate limiting (prevent spam)
- IP whitelist (TradingView IPs)
- User authentication via URL parameters

---

## Comparison: TradingView vs Built-in EA Generator

| Feature | TradingView Signals | ForexElite EA Generator |
|---------|-------------------|------------------------|
| **Strategy Creation** | Pine Script (visual) | Code generation (AI) |
| **Backtesting** | Built-in (TradingView) | MT5 Strategy Tester |
| **Indicators** | 100+ built-in | Custom MQL5 code |
| **Execution** | Cloud-based (webhook) | Local (MT5 EA) |
| **Latency** | Higher (webhook delay) | Lower (direct MT5) |
| **Cost** | $14.95/month | $0 (after setup) |
| **Ease of Use** | Easier (no coding) | Requires MQL5 knowledge |
| **Customization** | Limited to Pine Script | Full MQL5 flexibility |

**Use Cases:**
- **TradingView:** Quick strategy testing, visual analysis, community strategies
- **EA Generator:** Complex logic, low-latency execution, custom indicators

---

## Implementation Priority

### MVP (Week 1-2)
1. ✅ Webhook endpoint (`/api/tradingview/webhook`)
2. ✅ Signal parsing and validation
3. ✅ Integration with existing broker adapters
4. ✅ Basic signal logging (database)

### Phase 2 (Week 3-4)
1. Frontend webhook setup page
2. Signal history dashboard
3. Strategy enable/disable controls
4. Webhook signature verification

### Phase 3 (Month 2)
1. Advanced risk management
2. Position sizing calculator
3. Strategy performance analytics
4. Multi-strategy portfolio management

### Future Enhancements
1. Pine Script template library
2. Signal marketplace (share strategies)
3. Copy trading (follow other users' signals)
4. Backtesting integration (TradingView → MT5)

---

## Technical Specifications

### Webhook Endpoint Requirements
- **Protocol:** HTTPS (TLS 1.2+)
- **Method:** POST
- **Content-Type:** application/json
- **Timeout:** 5 seconds (TradingView requirement)
- **Response:** 200 OK with JSON body
- **Rate Limit:** 100 requests/minute per user

### TradingView Webhook Behavior
- **Retries:** 3 attempts with exponential backoff
- **Timeout:** 5 seconds per attempt
- **IP Addresses:** Dynamic (cannot whitelist)
- **Headers:** Standard HTTP headers (no custom auth)

### Broker Compatibility
| Broker Type | Webhook Support | Notes |
|-------------|----------------|-------|
| OANDA | ✅ Full | REST API integration |
| MT5 Agent | ✅ Full | Via broker adapter |
| MetaApi | ✅ Full | Cloud MT5 API |
| Any MT5 Broker | ✅ Full | Universal support |

---

## Conclusion

**Recommended Approach:** Build custom webhook receiver into ForexElite Pro backend.

**Rationale:**
1. **Cost-effective:** Saves $29-97/month per user vs third-party services
2. **Seamless integration:** Works with existing broker adapters
3. **Full control:** Custom risk management and analytics
4. **Scalable:** No per-user licensing fees
5. **Competitive advantage:** Unique feature vs competitors

**Next Steps:**
1. Implement webhook endpoint in FastAPI backend
2. Add database schema for signal logging
3. Create frontend webhook setup page
4. Write user documentation and Pine Script templates
5. Test with demo accounts before production release

**Estimated Development Time:** 2-3 weeks for MVP, 4-6 weeks for full feature set.
