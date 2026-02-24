"""WebSocket price streaming handler."""

import json
import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, Set

from fastapi import WebSocket, WebSocketDisconnect

from app.core.config import settings

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for price streaming."""
    
    def __init__(self):
        """Initialize connection manager."""
        # Map of instrument -> set of WebSocket connections
        self.active_connections: dict[str, Set[WebSocket]] = {}
        # Map of connection -> set of subscribed instruments
        self.connection_instruments: dict[WebSocket, Set[str]] = {}
    
    async def connect(
        self,
        websocket: WebSocket,
        instrument: str
    ):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        
        if instrument not in self.active_connections:
            self.active_connections[instrument] = set()
        
        self.active_connections[instrument].add(websocket)
        
        if websocket not in self.connection_instruments:
            self.connection_instruments[websocket] = set()
        
        self.connection_instruments[websocket].add(instrument)
        
        logger.info(f"Client connected to {instrument} stream. Total: {len(self.active_connections[instrument])}")
    
    def disconnect(
        self,
        websocket: WebSocket,
        instrument: str
    ):
        """Unregister a WebSocket connection."""
        if instrument in self.active_connections:
            self.active_connections[instrument].discard(websocket)
            
            if not self.active_connections[instrument]:
                del self.active_connections[instrument]
        
        if websocket in self.connection_instruments:
            self.connection_instruments[websocket].discard(instrument)
            
            if not self.connection_instruments[websocket]:
                del self.connection_instruments[websocket]
        
        logger.info(f"Client disconnected from {instrument} stream")
    
    async def broadcast(
        self,
        instrument: str,
        price_data: dict
    ):
        """Broadcast price data to all connected clients for an instrument."""
        if instrument not in self.active_connections:
            return
        
        message = json.dumps({
            "type": "tick",
            "data": price_data
        })
        
        disconnected = []
        
        for connection in self.active_connections[instrument]:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Failed to send to client: {e}")
                disconnected.append(connection)
        
        # Clean up disconnected clients
        for connection in disconnected:
            self.disconnect(connection, instrument)
    
    async def broadcast_reconnecting(self, instrument: str):
        """Broadcast reconnection message to all clients for an instrument."""
        if instrument not in self.active_connections:
            return
        
        message = json.dumps({
            "type": "reconnecting",
            "message": "Connection lost, attempting to reconnect..."
        })
        
        for connection in self.active_connections[instrument]:
            try:
                await connection.send_text(message)
            except Exception:
                pass
    
    def get_connection_count(self, instrument: str) -> int:
        """Get the number of active connections for an instrument."""
        return len(self.active_connections.get(instrument, set()))
    
    def get_total_connections(self) -> int:
        """Get total number of active connections."""
        return sum(len(connections) for connections in self.active_connections.values())


# Global connection manager
price_connection_manager = ConnectionManager()


async def handle_price_websocket(
    websocket: WebSocket,
    instrument: str
):
    """
    Handle WebSocket connection for price streaming.
    
    Args:
        websocket: The WebSocket connection
        instrument: The instrument to stream (e.g., "EUR_USD")
    """
    # Validate instrument format
    if not instrument or len(instrument) < 6:
        await websocket.close(code=4004)
        return
    
    # Connect to the price stream
    await price_connection_manager.connect(websocket, instrument)
    
    try:
        # Send initial price if available
        from app.core.config import settings
        import redis
        
        try:
            r = redis.from_url(settings.UPSTASH_REDIS_URL)
            price_key = f"price:{instrument}"
            price_data = r.get(price_key)
            
            if price_data:
                data = json.loads(price_data)
                await websocket.send_json({
                    "type": "tick",
                    "data": data
                })
        except Exception as e:
            logger.warning(f"Failed to get initial price: {e}")
        
        # Keep connection alive and handle messages
        while True:
            try:
                # Wait for client messages (ping/pong, etc.)
                data = await websocket.receive_text()
                
                # Handle ping
                if data == "ping":
                    await websocket.send_text("pong")
                    
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
                break
    
    finally:
        price_connection_manager.disconnect(websocket, instrument)


async def broadcast_price_update(
    instrument: str,
    bid: Decimal,
    ask: Decimal,
    timestamp: datetime
):
    """
    Broadcast a price update to all connected clients.
    
    Args:
        instrument: Trading instrument
        bid: Bid price
        ask: Ask price
        timestamp: Price timestamp
    """
    price_data = {
        "instrument": instrument,
        "bid": str(bid),
        "ask": str(ask),
        "time": timestamp.isoformat()
    }
    
    # Store in Redis
    try:
        import redis
        
        r = redis.from_url(settings.UPSTASH_REDIS_URL)
        price_key = f"price:{instrument}"
        r.setex(price_key, 10, json.dumps(price_data))  # 10 second TTL
    except Exception as e:
        logger.warning(f"Failed to cache price in Redis: {e}")
    
    # Broadcast to WebSocket clients
    await price_connection_manager.broadcast(instrument, price_data)