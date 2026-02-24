"""OANDA price streaming service."""

import asyncio
import json
import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

import httpx
import redis

from app.core.config import settings
from app.ws.price_stream import broadcast_price_update, price_connection_manager

logger = logging.getLogger(__name__)


class PriceStreamService:
    """Service for streaming prices from OANDA to Redis and WebSocket clients."""
    
    def __init__(self):
        """Initialize price stream service."""
        self._redis_client: Optional[redis.Redis] = None
        self._http_client: Optional[httpx.AsyncClient] = None
        self._running = False
        self._reconnect_delay = 1.0  # Start with 1 second
        self._max_reconnect_delay = 30.0  # Max 30 seconds
        self._stream_task: Optional[asyncio.Task] = None
        self._instruments = [
            "EUR_USD", "GBP_USD", "USD_JPY", "AUD_USD", "USD_CAD", "NZD_USD",
            "XAU_USD", "XAG_USD", "US30_USD", "NAS100_USD", "SPX500_USD"
        ]
    
    def _get_redis(self) -> redis.Redis:
        """Get or create Redis client."""
        if self._redis_client is None:
            self._redis_client = redis.from_url(settings.UPSTASH_REDIS_URL)
        return self._redis_client
    
    async def _get_http_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(timeout=60.0)
        return self._http_client
    
    async def start(self):
        """Start the price streaming service."""
        if self._running:
            logger.warning("Price stream service already running")
            return
        
        self._running = True
        logger.info("Starting price stream service")
        
        # Start the stream in background
        self._stream_task = asyncio.create_task(self._run_stream())
    
    async def stop(self):
        """Stop the price streaming service."""
        self._running = False
        
        if self._stream_task:
            self._stream_task.cancel()
            try:
                await self._stream_task
            except asyncio.CancelledError:
                pass
        
        if self._http_client:
            await self._http_client.aclose()
            self._http_client = None
        
        logger.info("Price stream service stopped")
    
    async def _run_stream(self):
        """Main streaming loop with automatic reconnection."""
        while self._running:
            try:
                await self._connect_to_oanda_stream()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Stream error: {e}")
                if self._running:
                    logger.info(f"Reconnecting in {self._reconnect_delay} seconds...")
                    await asyncio.sleep(self._reconnect_delay)
                    self._reconnect_delay = min(self._reconnect_delay * 2, self._max_reconnect_delay)
    
    async def _connect_to_oanda_stream(self):
        """Connect to OANDA streaming API."""
        api_key = settings.OANDA_STREAM_API_KEY
        account_id = settings.OANDA_STREAM_ACCOUNT_ID
        environment = settings.OANDA_STREAM_ENV
        
        # Set base URL based on environment
        if environment == "practice":
            stream_url = "https://stream-fxpractice.oanda.com/v3"
        else:
            stream_url = "https://stream-fxtrade.oanda.com/v3"
        
        # Build instrument list
        instruments = ",".join(self._instruments)
        
        client = await self._get_http_client()
        
        async with client.stream(
            "GET",
            f"{stream_url}/accounts/{account_id}/pricing/stream",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Accept": "application/json"
            },
            params={
                "instruments": instruments,
                "snapshot": "true"  # Get initial snapshot
            }
        ) as response:
            response.raise_for_status()
            
            # Reset reconnect delay on successful connection
            self._reconnect_delay = 1.0
            
            logger.info("Connected to OANDA price stream")
            
            # Broadcast reconnection message
            await price_connection_manager.broadcast_reconnecting("all")
            
            async for line in response.aiter_lines():
                if not self._running:
                    break
                
                try:
                    await self._process_tick(line)
                except Exception as e:
                    logger.error(f"Error processing tick: {e}")
    
    async def _process_tick(self, line: str):
        """Process a single tick from OANDA."""
        if not line.strip():
            return
        
        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            return
        
        # Handle different message types
        msg_type = data.get("type", "")
        
        if msg_type == "PRICE":
            await self._handle_price(data)
        elif msg_type == "HEARTBEAT":
            # Just log heartbeat, no action needed
            logger.debug("Received heartbeat from OANDA")
        elif msg_type == "ERROR":
            logger.error(f"OANDA stream error: {data.get('errorMessage', 'Unknown error')}")
    
    async def _handle_price(self, data: dict):
        """Handle a price message."""
        instrument = data.get("instrument", "")
        if not instrument:
            return
        
        # Extract bid/ask
        bids = data.get("bids", [])
        asks = data.get("asks", [])
        
        bid = Decimal(bids[0].get("price", "0")) if bids else Decimal("0")
        ask = Decimal(asks[0].get("price", "0")) if asks else Decimal("0")
        
        # Get timestamp
        time_str = data.get("time", datetime.now(timezone.utc).isoformat())
        timestamp = datetime.fromisoformat(time_str.replace("Z", "+00:00"))
        
        # Broadcast to WebSocket clients
        await broadcast_price_update(instrument, bid, ask, timestamp)
        
        logger.debug(f"Price update: {instrument} {bid}/{ask}")
    
    async def get_cached_price(self, instrument: str) -> Optional[dict]:
        """
        Get the last cached price for an instrument.
        
        Args:
            instrument: Trading instrument
            
        Returns:
            Price data dict or None if not cached
        """
        try:
            r = self._get_redis()
            price_key = f"price:{instrument}"
            data = r.get(price_key)
            
            if data:
                return json.loads(data)
        except Exception as e:
            logger.error(f"Failed to get cached price: {e}")
        
        return None
    
    async def cache_price(self, instrument: str, bid: Decimal, ask: Decimal, timestamp: datetime):
        """
        Cache a price in Redis.
        
        Args:
            instrument: Trading instrument
            bid: Bid price
            ask: Ask price
            timestamp: Price timestamp
        """
        try:
            r = self._get_redis()
            price_key = f"price:{instrument}"
            
            price_data = {
                "instrument": instrument,
                "bid": str(bid),
                "ask": str(ask),
                "time": timestamp.isoformat()
            }
            
            # Store with 10 second TTL
            r.setex(price_key, 10, json.dumps(price_data))
            
        except Exception as e:
            logger.error(f"Failed to cache price: {e}")
    
    def get_connection_stats(self) -> dict:
        """
        Get connection statistics.
        
        Returns:
            Dict with connection stats
        """
        return {
            "running": self._running,
            "total_connections": price_connection_manager.get_total_connections(),
            "instruments": {
                inst: price_connection_manager.get_connection_count(inst)
                for inst in self._instruments
            }
        }


# Global price stream service instance
price_stream_service = PriceStreamService()


async def start_price_stream():
    """Start the global price stream service."""
    await price_stream_service.start()


async def stop_price_stream():
    """Stop the global price stream service."""
    await price_stream_service.stop()


def get_price_service() -> PriceStreamService:
    """Get the global price stream service."""
    return price_stream_service