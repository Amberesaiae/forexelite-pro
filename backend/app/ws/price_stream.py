"""
WebSocket Price Streaming
"""
import asyncio
from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect
from app.core.auth import verify_supabase_jwt
from app.core.redis import get_redis
import json


class WebSocketManager:
    """Manages WebSocket connections for price streaming."""
    
    def __init__(self):
        self.connections: Dict[str, Set[WebSocket]] = {}
        self._redis_subscriber = None
    
    async def connect(self, websocket: WebSocket, instrument: str):
        """Add a WebSocket connection for an instrument."""
        await websocket.accept()
        
        if instrument not in self.connections:
            self.connections[instrument] = set()
        
        self.connections[instrument].add(websocket)
    
    def disconnect(self, websocket: WebSocket, instrument: str):
        """Remove a WebSocket connection."""
        if instrument in self.connections:
            self.connections[instrument].discard(websocket)
            
            if not self.connections[instrument]:
                del self.connections[instrument]
    
    async def broadcast(self, instrument: str, data: dict):
        """Broadcast price data to all connections for an instrument."""
        if instrument in self.connections:
            message = json.dumps({"type": "tick", "data": data})

            # Copy set to avoid modification during iteration
            for websocket in list(self.connections[instrument]):
                try:
                    await websocket.send_text(message)
                except Exception:
                    # Remove dead connections
                    self.disconnect(websocket, instrument)

    async def start_redis_subscriber(self):
        """Start Redis pub/sub listener for all price channels."""
        redis = await get_redis()
        pubsub = redis.pubsub()
        await pubsub.psubscribe("prices:*")

        try:
            async for message in pubsub.listen():
                if message["type"] == "pmessage":
                    # Extract instrument name from channel pattern
                    channel = message.get("channel", "")
                    if channel.startswith("prices:"):
                        instrument = channel[7:]  # Remove "prices:" prefix
                        data = json.loads(message["data"])
                        await self.broadcast(instrument, data)
        except asyncio.CancelledError:
            await pubsub.punsubscribe("prices:*")
            raise
        except Exception:
            # Keep background task alive
            pass


# Singleton instance
ws_manager = WebSocketManager()


async def handle_price_websocket(websocket: WebSocket, instrument: str, token: str):
    """Handle WebSocket connection for price streaming."""
    # Verify JWT token
    try:
        verify_supabase_jwt(token)
    except Exception:
        await websocket.close(code=4001)
        return
    
    # Connect to WebSocket manager
    await ws_manager.connect(websocket, instrument)
    
    # Send last known price from Redis
    redis = await get_redis()
    cached = await redis.get(f"prices:{instrument}")

    if cached:
        price_data = json.loads(cached)
        await websocket.send_text(json.dumps({
            "type": "tick",
            "data": price_data
        }))

    # Keep connection alive while the shared subscriber delivers via broadcast
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        pass
    finally:
        ws_manager.disconnect(websocket, instrument)
