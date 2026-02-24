# Backend API Specification

**Last Updated**: February 23, 2026  
**Purpose**: Complete API contracts with request/response examples

---

## Table of Contents

1. [Authentication](#authentication)
2. [Onboarding](#onboarding)
3. [Trading](#trading)
4. [Market Data](#market-data)
5. [EA Management](#ea-management)
6. [Deployment](#deployment)
7. [MT5 Agent](#mt5-agent)

---

## Base URL

```
Production:  https://api.forexelite.pro/api/v1
Development: http://localhost:8000/api/v1
```

---

## Authentication

All authenticated endpoints require JWT in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

### POST /auth/login

**Description:** Login with email and password (proxies to Supabase)

**Request:**
```json
{
  "email": "trader@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "trader@example.com",
    "created_at": "2026-02-23T10:00:00Z"
  }
}
```

**Errors:**
- `400 Bad Request` - Invalid email/password format
- `401 Unauthorized` - Invalid credentials



### POST /auth/signup

**Description:** Create new user account

**Request:**
```json
{
  "email": "newtrader@example.com",
  "password": "SecurePass123!",
  "name": "John Trader"
}
```

**Response:** `201 Created`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "newtrader@example.com",
    "created_at": "2026-02-23T10:00:00Z"
  }
}
```

**Errors:**
- `400 Bad Request` - Email already exists or password too weak

### POST /auth/refresh

**Description:** Refresh access token

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

---

## Onboarding

### GET /onboarding/status

**Description:** Check if user has completed onboarding

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "onboarded": false,
  "missing": ["broker_connection", "disclaimer_accepted"]
}
```

### PUT /onboarding/brokers

**Description:** Connect MT5 broker account

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request:**
```json
{
  "broker_name": "Exness Global",
  "account_number": "12345678",
  "account_type": "demo",
  "label": "My Demo Account"
}
```

**Response:** `201 Created`
```json
{
  "broker_connection_id": "660e8400-e29b-41d4-a716-446655440000",
  "status": "connected",
  "created_at": "2026-02-23T10:00:00Z"
}
```

**Errors:**
- `400 Bad Request` - Invalid credentials
- `503 Service Unavailable` - MT5 Agent offline

### PUT /onboarding/preferences

**Description:** Set risk preferences and accept disclaimer

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request:**
```json
{
  "risk_percent": 1.0,
  "disclaimer_accepted": true,
  "preferred_pairs": ["EURUSD", "GBPUSD", "XAUUSD"]
}
```

**Response:** `200 OK`
```json
{
  "success": true
}
```

---

## Trading

### POST /orders

**Description:** Place market order

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request:**
```json
{
  "broker_connection_id": "660e8400-e29b-41d4-a716-446655440000",
  "instrument": "EURUSD",
  "side": "BUY",
  "units": 1000,
  "stop_loss_pips": 20,
  "take_profit_pips": 40
}
```

**Response:** `201 Created`
```json
{
  "order_id": "770e8400-e29b-41d4-a716-446655440000",
  "broker_order_id": "MT5-123456",
  "fill_price": 1.08428,
  "timestamp": "2026-02-23T10:00:00Z",
  "status": "filled"
}
```

**Errors:**
- `400 Bad Request` - Insufficient margin
- `428 Precondition Required` - Onboarding not complete
- `503 Service Unavailable` - Broker unavailable

### GET /positions

**Description:** Get open positions

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
```
?broker_connection_id=660e8400-e29b-41d4-a716-446655440000
```

**Response:** `200 OK`
```json
{
  "positions": [
    {
      "position_id": "880e8400-e29b-41d4-a716-446655440000",
      "broker_position_id": "MT5-789012",
      "instrument": "EURUSD",
      "side": "BUY",
      "units": 1000,
      "open_price": 1.08310,
      "current_price": 1.08428,
      "pnl": 11.80,
      "pnl_percent": 0.11,
      "opened_at": "2026-02-23T09:30:00Z"
    }
  ]
}
```

### DELETE /positions/{position_id}

**Description:** Close position

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
```
?broker_connection_id=660e8400-e29b-41d4-a716-446655440000
```

**Response:** `200 OK`
```json
{
  "closed_price": 1.08428,
  "pnl": 11.80,
  "closed_at": "2026-02-23T10:00:00Z"
}
```

### GET /account

**Description:** Get account balance and equity

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
```
?broker_connection_id=660e8400-e29b-41d4-a716-446655440000
```

**Response:** `200 OK`
```json
{
  "balance": 10000.00,
  "equity": 10043.20,
  "margin_used": 108.43,
  "margin_available": 9891.57,
  "currency": "USD"
}
```

---

## Market Data

### GET /candles/{instrument}

**Description:** Get historical candles

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
```
?timeframe=H1&count=100
```

**Response:** `200 OK`
```json
{
  "candles": [
    {
      "time": "2026-02-23T09:00:00Z",
      "open": 1.08310,
      "high": 1.08450,
      "low": 1.08280,
      "close": 1.08428,
      "volume": 1250
    }
  ]
}
```

### WebSocket: /ws/prices/{instrument}

**Description:** Real-time price stream

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/prices/EURUSD')

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log(data)
  // { bid: 1.08421, ask: 1.08428, timestamp: "2026-02-23T10:00:00Z" }
}
```

---

## EA Management

### GET /ea/projects

**Description:** List EA projects

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "projects": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440000",
      "name": "Scalping Bot v1",
      "strategy_id": null,
      "created_at": "2026-02-20T10:00:00Z",
      "latest_version": {
        "version_number": 2,
        "status": "compiled"
      }
    }
  ]
}
```

### POST /ea/projects

**Description:** Create EA project

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request:**
```json
{
  "name": "My Scalping EA",
  "strategy_id": null
}
```

**Response:** `201 Created`
```json
{
  "project_id": "990e8400-e29b-41d4-a716-446655440000",
  "name": "My Scalping EA",
  "created_at": "2026-02-23T10:00:00Z"
}
```

### POST /ea/generate

**Description:** Generate EA code using GLM-5

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request:**
```json
{
  "project_id": "990e8400-e29b-41d4-a716-446655440000",
  "strategy_description": "Create a scalping EA that trades EURUSD on M15 timeframe. Use 10 and 20 period moving average crossover. Risk 1% per trade with 20 pip stop loss and 40 pip take profit."
}
```

**Response:** `201 Created`
```json
{
  "version_id": "aa0e8400-e29b-41d4-a716-446655440000",
  "version_number": 1,
  "source_code": "//+------------------------------------------------------------------+\n//| Scalping EA - Generated by ForexElite Pro\n...",
  "status": "draft",
  "created_at": "2026-02-23T10:00:00Z"
}
```

**Errors:**
- `400 Bad Request` - Invalid strategy description
- `503 Service Unavailable` - GLM-5 API unavailable

### POST /ea/versions/{version_id}/compile

**Description:** Compile EA (creates job for MT5 Agent)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `202 Accepted`
```json
{
  "job_id": "bb0e8400-e29b-41d4-a716-446655440000",
  "status": "pending"
}
```

### GET /ea/versions/{version_id}/artifacts

**Description:** Get EA artifacts (source, compiled)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "artifacts": [
    {
      "artifact_id": "cc0e8400-e29b-41d4-a716-446655440000",
      "kind": "MQ5",
      "download_url": "https://storage.supabase.co/...",
      "size_bytes": 12450,
      "created_at": "2026-02-23T10:00:00Z"
    },
    {
      "artifact_id": "dd0e8400-e29b-41d4-a716-446655440000",
      "kind": "EX5",
      "download_url": "https://storage.supabase.co/...",
      "size_bytes": 8920,
      "created_at": "2026-02-23T10:05:00Z"
    }
  ]
}
```

---

## Deployment

### POST /deployments

**Description:** Deploy EA to MT5

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request:**
```json
{
  "version_id": "aa0e8400-e29b-41d4-a716-446655440000",
  "agent_id": "ee0e8400-e29b-41d4-a716-446655440000",
  "broker_connection_id": "660e8400-e29b-41d4-a716-446655440000",
  "symbol": "EURUSD"
}
```

**Response:** `201 Created`
```json
{
  "deployment_id": "ff0e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "created_at": "2026-02-23T10:00:00Z"
}
```

### POST /deployments/{deployment_id}/run

**Description:** Start EA

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "status": "running",
  "started_at": "2026-02-23T10:00:00Z"
}
```

### POST /deployments/{deployment_id}/stop

**Description:** Stop EA

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "status": "stopped",
  "stopped_at": "2026-02-23T10:00:00Z"
}
```

### GET /deployments/{deployment_id}/logs

**Description:** Get EA logs

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "logs": [
    {
      "timestamp": "2026-02-23T10:00:00Z",
      "level": "INFO",
      "message": "EA started on EURUSD"
    },
    {
      "timestamp": "2026-02-23T10:05:00Z",
      "level": "INFO",
      "message": "Order placed: BUY 0.1 lots at 1.08428"
    }
  ]
}
```

---

## MT5 Agent

### POST /agents/pair

**Description:** Pair new MT5 Agent

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request:**
```json
{
  "agent_name": "My VPS Agent"
}
```

**Response:** `201 Created`
```json
{
  "agent_id": "ee0e8400-e29b-41d4-a716-446655440000",
  "pairing_key": "pk_live_1234567890abcdef",
  "created_at": "2026-02-23T10:00:00Z"
}
```

### POST /agents/{agent_id}/heartbeat

**Description:** Agent heartbeat (called by agent every 5 minutes)

**Headers:**
```
X-Agent-Key: pk_live_1234567890abcdef
```

**Request:**
```json
{
  "status": "online",
  "metrics": {
    "cpu_percent": 15.2,
    "memory_percent": 42.8,
    "active_eas": 3
  }
}
```

**Response:** `200 OK`
```json
{
  "acknowledged": true
}
```

### GET /agents/{agent_id}/jobs/next

**Description:** Poll for next job (called by agent every 30 seconds)

**Headers:**
```
X-Agent-Key: pk_live_1234567890abcdef
```

**Response:** `200 OK` (job available)
```json
{
  "job_id": "bb0e8400-e29b-41d4-a716-446655440000",
  "type": "compile",
  "payload": {
    "version_id": "aa0e8400-e29b-41d4-a716-446655440000",
    "source_url": "https://storage.supabase.co/..."
  }
}
```

**Response:** `200 OK` (no jobs)
```json
{
  "no_jobs": true
}
```

### POST /agents/{agent_id}/jobs/{job_id}/result

**Description:** Submit job result

**Headers:**
```
X-Agent-Key: pk_live_1234567890abcdef
```

**Request:**
```json
{
  "status": "completed",
  "result": {
    "artifact_url": "https://storage.supabase.co/...",
    "compilation_time_ms": 1250
  },
  "logs": "Compilation successful\nNo errors\nNo warnings"
}
```

**Response:** `200 OK`
```json
{
  "acknowledged": true
}
```

---

## Error Response Format

All errors follow this format:

```json
{
  "detail": "Human-readable error message",
  "code": "ERROR_CODE",
  "field": "field_name"  // optional, for validation errors
}
```

### Common Error Codes

- `INVALID_JWT` - JWT token invalid or expired
- `ONBOARDING_INCOMPLETE` - User must complete onboarding
- `BROKER_UNAVAILABLE` - Broker API unavailable
- `INSUFFICIENT_MARGIN` - Not enough margin for order
- `AGENT_OFFLINE` - MT5 Agent offline
- `INVALID_INPUT` - Validation error
- `RESOURCE_NOT_FOUND` - Resource doesn't exist
- `RATE_LIMIT_EXCEEDED` - Too many requests

---

## Rate Limits

- **API Requests:** 100 requests/minute per user
- **WebSocket Connections:** 10 concurrent connections per user
- **EA Generation:** 20 generations/hour per user

---

## Pagination

List endpoints support pagination:

**Query Parameters:**
```
?page=1&page_size=50
```

**Response:**
```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "page_size": 50,
  "total_pages": 3
}
```

