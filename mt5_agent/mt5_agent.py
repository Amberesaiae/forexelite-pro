#!/usr/bin/env python3
"""
MT5 Agent - ForexElite Pro Bridge to MetaTrader 5

This script connects the user's MT5 terminal to the ForexElite Pro backend.
It handles price streaming, job execution, and heartbeat reporting.

Usage:
    python mt5_agent.py --agent-id <UUID> --key <pairing_key> --api-url <URL>
    python mt5_agent.py  # Reads from .env if config.json exists
"""

import argparse
import json
import logging
import os
import sys
import time
import threading
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import MetaTrader5 as mt5
import requests
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)-8s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


class MT5Agent:
    """MT5 Agent - bridges MetaTrader 5 to ForexElite Pro backend."""

    def __init__(self, agent_id: str, agent_key: str, api_url: str):
        self.agent_id = agent_id
        self.agent_key = agent_key
        self.api_url = api_url.rstrip("/")
        self.headers = {
            "X-Agent-Id": agent_id,
            "X-Agent-Key": agent_key,
            "Content-Type": "application/json",
        }
        self.running = False
        self.mt5_connected = False
        self.subscribed_symbols = [
            "EURUSD",
            "GBPUSD",
            "XAUUSD",
            "USDJPY",
            "AUDUSD",
            "USDCAD",
        ]
        self.jobs_processed = 0

    def _api_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Make authenticated API request with exponential backoff."""
        url = f"{self.api_url}{endpoint}"
        backoff = 5

        while True:
            try:
                response = requests.request(method, url, headers=self.headers, **kwargs)
                if response.status_code == 401:
                    logger.error("Invalid pairing key - please re-pair your agent")
                    sys.exit(1)
                return response
            except requests.exceptions.RequestException as e:
                logger.warning(f"API request failed: {e}, retrying in {backoff}s")
                time.sleep(backoff)
                backoff = min(backoff * 2, 300)

    def connect_mt5(self) -> bool:
        """Initialize MT5 connection."""
        if not mt5.initialize():
            logger.error(f"MT5 initialize failed: {mt5.last_error()}")
            return False

        account_info = mt5.account_info()
        if account_info is None:
            logger.error("Failed to get account info")
            mt5.shutdown()
            return False

        logger.info(f"Connected to MT5: {account_info.login} ({account_info.server})")
        self.mt5_connected = True

        symbols = mt5.symbols_get()
        available = [s.name for s in symbols]
        self.subscribed_symbols = [s for s in self.subscribed_symbols if s in available]
        logger.info(f"Subscribed symbols: {', '.join(self.subscribed_symbols)}")
        return True

    def reconnect_mt5(self):
        """Reconnect to MT5 after disconnection."""
        logger.info("Attempting to reconnect to MT5...")
        while self.running:
            if self.connect_mt5():
                return
            logger.warning("MT5 reconnect failed, retrying in 60s")
            time.sleep(60)

    def push_prices(self):
        """Push current bid/ask prices to backend every 1 second."""
        while self.running:
            if not self.mt5_connected:
                time.sleep(1)
                continue

            prices = {}
            for symbol in self.subscribed_symbols:
                tick = mt5.symbol_info_tick(symbol)
                if tick:
                    prices[symbol] = {
                        "bid": float(tick.bid),
                        "ask": float(tick.ask),
                        "time": datetime.now().isoformat(),
                    }

            if prices:
                try:
                    self._api_request(
                        "POST", f"/agents/{self.agent_id}/prices", json=prices
                    )
                except Exception as e:
                    logger.debug(f"Price push failed: {e}")

            time.sleep(1)

    def send_heartbeat(self):
        """Send heartbeat with system metrics every 5 minutes."""
        while self.running:
            try:
                try:
                    import psutil

                    cpu = psutil.cpu_percent()
                    mem = psutil.virtual_memory().percent
                except ImportError:
                    cpu = mem = 0

                mt5_info = mt5.terminal_info() if self.mt5_connected else None
                mt5_connected = mt5_info.connected if mt5_info else False

                payload = {
                    "status": "online",
                    "metrics": {
                        "mt5_connected": mt5_connected,
                        "symbols_tracked": len(self.subscribed_symbols),
                        "jobs_processed": self.jobs_processed,
                        "cpu_percent": cpu,
                        "memory_percent": mem,
                    },
                }

                self._api_request(
                    "POST", f"/agents/{self.agent_id}/heartbeat", json=payload
                )
                logger.info(
                    f"Heartbeat sent - MT5: {mt5_connected}, Jobs: {self.jobs_processed}"
                )
            except Exception as e:
                logger.warning(f"Heartbeat failed: {e}")

            time.sleep(300)

    def poll_jobs(self):
        """Poll for and execute jobs every 30 seconds."""
        while self.running:
            try:
                response = self._api_request(
                    "GET", f"/agents/{self.agent_id}/jobs/next"
                )
                if response.status_code == 204:
                    time.sleep(30)
                    continue

                job = response.json()
                logger.info(f"Job claimed: {job.get('job_type')} (id: {job.get('id')})")

                result = self._execute_job(job)
                self.jobs_processed += 1

                self._api_request(
                    "POST",
                    f"/agents/{self.agent_id}/jobs/{job['id']}/result",
                    json=result,
                )
                logger.info(f"Job result posted: {result.get('status')}")

            except Exception as e:
                logger.warning(f"Job poll failed: {e}")

            time.sleep(30)

    def _execute_job(self, job: dict) -> dict:
        """Execute a job based on job_type."""
        job_type = job.get("job_type")
        input_data = job.get("input_data", {})

        try:
            if job_type == "trade":
                return self._execute_trade(input_data)
            elif job_type == "close_position":
                return self._close_position(input_data)
            elif job_type == "get_positions":
                return self._get_positions()
            elif job_type == "get_account":
                return self._get_account()
            elif job_type == "get_candles":
                return self._get_candles(input_data)
            elif job_type == "compile":
                return self._compile_ea(input_data)
            elif job_type == "deploy":
                return self._deploy_ea(input_data)
            elif job_type == "run":
                return {"status": "completed", "running": True}
            elif job_type == "stop":
                return {"status": "completed", "stopped": True}
            else:
                return {
                    "status": "failed",
                    "error_message": f"Unknown job type: {job_type}",
                }
        except Exception as e:
            logger.exception(f"Job execution failed: {e}")
            return {"status": "failed", "error_message": str(e)}

    def _execute_trade(self, data: dict) -> dict:
        """Execute a trade order."""
        symbol = data["symbol"]
        side = data["side"]
        volume = data["volume"]
        sl_pips = data.get("sl_pips")
        tp_pips = data.get("tp_pips")

        tick = mt5.symbol_info_tick(symbol)
        if not tick:
            return {"status": "failed", "error_message": f"No price for {symbol}"}

        point = mt5.symbol_info(symbol).point
        price = tick.ask if side == "buy" else tick.bid

        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": volume,
            "type": mt5.ORDER_TYPE_BUY if side == "buy" else mt5.ORDER_TYPE_SELL,
            "price": price,
            "deviation": 20,
            "magic": 234000,
            "comment": "ForexElite Pro",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }

        if sl_pips:
            request["sl"] = (
                price - (sl_pips * point)
                if side == "buy"
                else price + (sl_pips * point)
            )
        if tp_pips:
            request["tp"] = (
                price + (tp_pips * point)
                if side == "buy"
                else price - (tp_pips * point)
            )

        result = mt5.order_send(request)
        if result.retcode != mt5.TRADE_RETCODE_DONE:
            return {"status": "failed", "error_message": f"MT5 error: {result.retcode}"}

        return {
            "status": "completed",
            "fill_price": float(result.price),
            "ticket": result.order,
            "order_id": str(result.order),
        }

    def _close_position(self, data: dict) -> dict:
        """Close a position."""
        ticket = data["ticket"]
        positions = mt5.positions_get(ticket=ticket)
        if not positions:
            return {"status": "failed", "error_message": f"Position {ticket} not found"}

        pos = positions[0]
        close_request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": pos.symbol,
            "volume": pos.volume,
            "type": mt5.ORDER_TYPE_SELL if pos.type == 0 else mt5.ORDER_TYPE_BUY,
            "position": ticket,
            "price": mt5.symbol_info_tick(pos.symbol).ask
            if pos.type == 0
            else mt5.symbol_info_tick(pos.symbol).bid,
            "deviation": 20,
            "magic": 234000,
            "comment": "ForexElite Pro close",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }

        result = mt5.order_send(close_request)
        if result.retcode != mt5.TRADE_RETCODE_DONE:
            return {
                "status": "failed",
                "error_message": f"Close failed: {result.retcode}",
            }

        return {
            "status": "completed",
            "closed_price": float(result.price),
            "pnl": float(result.profit),
        }

    def _get_positions(self) -> dict:
        """Get all open positions."""
        positions = mt5.positions_get()
        if not positions:
            return {"status": "completed", "positions": []}

        result = []
        for pos in positions:
            result.append(
                {
                    "id": str(pos.ticket),
                    "ticket": str(pos.ticket),
                    "symbol": pos.symbol,
                    "side": "buy" if pos.type == 0 else "sell",
                    "volume": float(pos.volume),
                    "open_price": float(pos.price_open),
                    "current_price": float(pos.price_current),
                    "sl": float(pos.sl) if pos.sl else None,
                    "tp": float(pos.tp) if pos.tp else None,
                    "pnl": float(pos.profit),
                }
            )

        return {"status": "completed", "positions": result}

    def _get_account(self) -> dict:
        """Get account info."""
        info = mt5.account_info()
        return {
            "status": "completed",
            "balance": float(info.balance),
            "equity": float(info.equity),
            "margin_used": float(info.margin),
            "margin_available": float(info.margin_free),
            "currency": info.currency,
            "leverage": info.leverage,
        }

    def _get_candles(self, data: dict) -> dict:
        """Get OHLCV candles."""
        symbol = data["symbol"]
        timeframe_map = {
            "M1": mt5.TIMEFRAME_M1,
            "M5": mt5.TIMEFRAME_M5,
            "M15": mt5.TIMEFRAME_M15,
            "H1": mt5.TIMEFRAME_H1,
            "H4": mt5.TIMEFRAME_H4,
            "D1": mt5.TIMEFRAME_D1,
        }
        timeframe = timeframe_map.get(data.get("timeframe", "H1"), mt5.TIMEFRAME_H1)
        count = data.get("count", 200)

        rates = mt5.copy_rates_from_pos(symbol, timeframe, 0, count)
        if rates is None:
            return {
                "status": "failed",
                "error_message": f"Failed to get candles for {symbol}",
            }

        candles = []
        for r in rates:
            candles.append(
                {
                    "time": datetime.fromtimestamp(r[0]).isoformat(),
                    "open": float(r[1]),
                    "high": float(r[2]),
                    "low": float(r[3]),
                    "close": float(r[4]),
                    "volume": int(r[5]),
                }
            )

        return {"status": "completed", "candles": candles}

    def _compile_ea(self, data: dict) -> dict:
        """Compile EA from source."""
        version_id = data.get("version_id")
        storage_path = data.get("storage_path")

        artifacts_resp = self._api_request(
            "GET", f"/ea/versions/{version_id}/artifacts"
        )
        if artifacts_resp.status_code != 200:
            return {"status": "failed", "error_message": "Failed to get artifact URL"}

        artifacts = artifacts_resp.json().get("artifacts", [])
        if not artifacts:
            return {"status": "failed", "error_message": "No artifacts found"}

        download_url = artifacts[0].get("download_url")
        if not download_url:
            return {"status": "failed", "error_message": "No download URL"}

        mq5_response = requests.get(download_url)
        if mq5_response.status_code != 200:
            return {"status": "failed", "error_message": "Failed to download source"}

        mql5_dir = (
            Path(os.getenv("APPDATA", ""))
            / "MetaQuotes"
            / "Terminal"
            / "Common"
            / "Files"
            / "MQL5"
            / "Experts"
        )
        mql5_dir.mkdir(parents=True, exist_ok=True)
        mq5_path = mql5_dir / "ForexElite" / f"{version_id}.mq5"
        mq5_path.parent.mkdir(parents=True, exist_ok=True)
        mq5_path.write_bytes(mq5_response.content)

        metaeditor_path = (
            Path(os.getenv("PROGRAMFILES", "C:\\Program Files"))
            / "MetaTrader 5"
            / "metaeditor64.exe"
        )
        if metaeditor_path.exists():
            import subprocess

            result = subprocess.run(
                [str(metaeditor_path), "/compile", str(mq5_path), "/log"],
                capture_output=True,
                text=True,
            )
            compiled = result.returncode == 0
            errors = result.stdout + result.stderr
        else:
            compiled = True
            errors = "MetaEditor not found, skipping compilation"

        return {
            "status": "completed" if compiled else "failed",
            "compiled": compiled,
            "errors": errors if not compiled else None,
        }

    def _deploy_ea(self, data: dict) -> dict:
        """Deploy EA to chart."""
        symbol = data.get("symbol")
        timeframe = data.get("timeframe", "H1")

        timeframe_map = {
            "M1": mt5.TIMEFRAME_M1,
            "M5": mt5.TIMEFRAME_M5,
            "M15": mt5.TIMEFRAME_M15,
            "H1": mt5.TIMEFRAME_H1,
            "H4": mt5.TIMEFRAME_H4,
            "D1": mt5.TIMEFRAME_D1,
        }
        tf = timeframe_map.get(timeframe, mt5.TIMEFRAME_H1)

        chart_id = mt5.chart_open(symbol, tf)
        if not chart_id:
            return {
                "status": "failed",
                "error_message": f"Failed to open chart {symbol}",
            }

        return {"status": "completed", "deployed": True, "chart_id": chart_id}

    def start(self):
        """Start all agent loops."""
        self.running = True

        if not self.connect_mt5():
            logger.error("Failed to connect to MT5")
            sys.exit(1)

        threading.Thread(target=self.push_prices, daemon=True).start()
        threading.Thread(target=self.send_heartbeat, daemon=True).start()
        threading.Thread(target=self.poll_jobs, daemon=True).start()

        logger.info("MT5 Agent started successfully")
        logger.info(f"Agent ID: {self.agent_id}")
        logger.info(f"API URL: {self.api_url}")

        try:
            while self.running:
                if not self.mt5_connected:
                    self.reconnect_mt5()
                time.sleep(10)
        except KeyboardInterrupt:
            logger.info("Shutting down...")
            self.running = False
            mt5.shutdown()


def load_config() -> tuple:
    """Load config from .env or config.json."""
    load_dotenv()

    parser = argparse.ArgumentParser(description="MT5 Agent for ForexElite Pro")
    parser.add_argument("--agent-id", default=os.getenv("AGENT_ID"))
    parser.add_argument("--key", "--agent-key", default=os.getenv("AGENT_KEY"))
    parser.add_argument(
        "--api-url", default=os.getenv("API_URL", "https://api.forexelite.pro")
    )

    args = parser.parse_args()

    if not args.agent_id or not args.key:
        config_path = Path(__file__).parent / "config.json"
        if config_path.exists():
            with open(config_path) as f:
                config = json.load(f)
                return (
                    config.get("agent_id"),
                    config.get("agent_key"),
                    config.get("api_url"),
                )

        logger.error("Missing --agent-id or --key. Run with --help for usage.")
        sys.exit(1)

    return args.agent_id, args.key, args.api_url


def save_config(agent_id: str, agent_key: str, api_url: str):
    """Save config to config.json."""
    config_path = Path(__file__).parent / "config.json"
    config = {"agent_id": agent_id, "agent_key": agent_key, "api_url": api_url}
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)
    logger.info(f"Config saved to {config_path}")


if __name__ == "__main__":
    agent_id, agent_key, api_url = load_config()

    if agent_id and agent_key:
        save_config(agent_id, agent_key, api_url)

    agent = MT5Agent(agent_id, agent_key, api_url)
    agent.start()
