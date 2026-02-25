# MT5 Agent for ForexElite Pro

The MT5 Agent is a Python script that connects your MetaTrader 5 terminal to the ForexElite Pro platform. It enables real-time price streaming, trade execution, EA compilation, and deployment directly from the web interface.

## Prerequisites

- **Windows PC or VPS** (Windows 10/11 or Windows Server 2016+)
- **MetaTrader 5** installed and logged into your broker account
- **Python 3.8+** installed

## Installation

1. Download the `mt5_agent` folder
2. Open a command prompt in the folder
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

## First Run

Get your pairing key from the ForexElite Pro onboarding wizard, then run:

```
python mt5_agent.py --agent-id YOUR_AGENT_ID --key YOUR_PAIRING_KEY --api-url https://api.forexelite.pro
```

Or create a `.env` file:
```
AGENT_ID=your-agent-id
AGENT_KEY=your-pairing-key
API_URL=https://api.forexelite.pro
```

Then run:
```
python mt5_agent.py
```

The agent will save your configuration to `config.json` for future runs.

## What It Does

- **Price Streaming**: Sends bid/ask prices every second for real-time charts
- **Trade Execution**: Executes market orders from the web interface
- **Position Management**: Reports open positions and allows closing them
- **Account Info**: Streams balance, equity, and margin data
- **EA Compilation**: Compiles MQL5 expert advisors
- **EA Deployment**: Deploys and manages EAs on charts
- **Heartbeat**: Reports status every 5 minutes

## Running as a Service

### Windows Task Scheduler

1. Open Task Scheduler (taskschd.msc)
2. Create Basic Task
3. Set trigger: "At startup"
4. Action: "Start a program"
5. Program: `python`
6. Arguments: `C:\path\to\mt5_agent.py`
7. Check "Run whether user is logged on or not" (if desired)

### NSSM (Non-Sucking Service Manager)

```
nssm install ForexEliteMT5 "C:\Python\python.exe" "C:\path\to\mt5_agent.py"
nssm set ForexEliteMT5 AppDirectory "C:\path\to\mt5_agent"
nssm start ForexEliteMT5
```

## Troubleshooting

### "MT5 initialize failed"
- Ensure MT5 terminal is running and logged in
- Check Windows Task Manager for MT5.exe

### "Invalid pairing key"
- Re-run onboarding in ForexElite Pro to get a new key
- Delete `config.json` and re-run with new key

### "No price for symbol"
- The market may be closed
- Check that the symbol is available in your MT5 Market Watch

### Agent shows as "offline"
- Check your internet connection
- Check the API URL is correct
- Review console for error messages

## Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| AGENT_ID | UUID from onboarding | abc123... |
| AGENT_KEY | Pairing key (shown once) | xK9mP2... |
| API_URL | Backend URL | https://api.forexelite.pro |
| MT5_PATH | Path to MT5 terminal | C:\Program Files\MetaTrader 5 |
| LOG_LEVEL | INFO or DEBUG | INFO |

## Support

For issues, check the console output or contact support through the ForexElite Pro dashboard.
