# MT5 Connection Guide - ForexElite Pro

## Your MT5 Account Details
- **Name**: Amber Isaiah
- **Server**: MetaQuotes-Demo
- **Type**: Forex Hedged USD
- **Login**: 103583974
- **Password**: A_LuMfE0

## Current Status
✅ Backend server running on http://localhost:8000
✅ Frontend running on http://localhost:3000
✅ User authenticated (testuser@forexelite.com)
⚠️ Onboarding pairing endpoint hanging (needs investigation)
❌ MT5 Agent not running

## Issue Identified
The `/api/v1/agents/pair` endpoint is hanging when trying to generate a pairing key. This needs to be fixed before MT5 connection can proceed.

## Next Steps

### 1. Fix the Agents Pairing Endpoint
The backend is hanging on the pairing key generation. Need to:
- Check `forexelite-pro/backend/app/api/routes/agents.py`
- Identify why the endpoint is blocking
- Fix the async/database issue causing the hang

### 2. Complete Onboarding Flow
Once the pairing endpoint is fixed:
1. Navigate to http://localhost:3000/onboarding
2. Fill in MT5 details:
   - Broker Name: MetaQuotes-Demo
   - Account Number: 103583974
   - Account Type: Demo
   - Label: Amber Isaiah
3. Click "Generate Pairing Key"
4. Copy the generated key
5. Complete risk configuration
6. Accept disclaimer

### 3. Install MT5 Agent
On the Windows PC where MetaTrader 5 is installed:

```cmd
cd C:\New folder\dir\forexelite-pro\mt5_agent
pip install -r requirements.txt
```

Create `.env` file in `mt5_agent/`:
```
AGENT_ID=<from-onboarding>
AGENT_KEY=<pairing-key-from-onboarding>
API_URL=http://localhost:8000
MT5_PATH=C:\Program Files\MetaTrader 5
```

### 4. Run MT5 Agent
```cmd
python mt5_agent.py
```

The agent will:
- Connect to your MT5 terminal (must be running and logged in)
- Stream real-time prices to the backend
- Enable trade execution from the web interface
- Report account balance, equity, and positions

### 5. Verify Connection
Once the agent is running:
- Dashboard should show "MT5 Agent Connected"
- Real-time prices should appear on charts
- Trading panel should be enabled
- Account info should display correctly

## Troubleshooting

### Backend Hanging Issue
The current issue is that the pairing endpoint is blocking. This could be:
- Database query hanging
- Missing async/await
- Supabase connection issue
- Missing table or permissions

### MT5 Agent Issues
If the agent fails to connect:
- Ensure MT5 terminal is running and logged in
- Check that Python can access MT5 (run as administrator if needed)
- Verify the API_URL is correct
- Check firewall settings

## Architecture
```
Frontend (Next.js) → Backend (FastAPI) → Supabase (Database)
                           ↓
                     MT5 Agent (Python)
                           ↓
                  MetaTrader 5 Terminal
```

## Files to Check
- `forexelite-pro/backend/app/api/routes/agents.py` - Pairing endpoint
- `forexelite-pro/mt5_agent/mt5_agent.py` - Agent script
- `forexelite-pro/backend/.env.local` - Backend config
- `forexelite-pro/mt5_agent/.env` - Agent config (create this)

## Test Credentials
- **Web Login**: testuser@forexelite.com / TestPass123!@#
- **MT5 Login**: 103583974 / A_LuMfE0
- **MT5 Server**: MetaQuotes-Demo
