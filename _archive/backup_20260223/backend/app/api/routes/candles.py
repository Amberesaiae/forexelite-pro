"""Candles API for historical price data."""

import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/candles", tags=["candles"])


class CandleData(BaseModel):
    """Single candle data point."""
    time: int  # Unix timestamp
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: int


class CandlesResponse(BaseModel):
    """Candles response."""
    instrument: str
    granularity: str
    candles: list[CandleData]


@router.get("/{instrument}")
async def get_candles(
    instrument: str,
    granularity: str = Query(default="M1", description="Candle granularity (M1, M5, M15, H1, H4, D, W, M)"),
    count: int = Query(default=200, ge=1, le=5000, description="Number of candles to return"),
    user_id: Optional[str] = None  # Optional for future auth
) -> CandlesResponse:
    """
    Get historical OHLCV candles for an instrument.
    
    Args:
        instrument: Trading instrument (e.g., "EUR_USD")
        granularity: Candle timeframe
        count: Number of candles to fetch
        user_id: Optional user ID for future auth
        
    Returns:
        List of OHLCV candles
    """
    # Validate granularity
    valid_granularities = ["M1", "M5", "M15", "M30", "H1", "H2", "H4", "H8", "D", "W", "M"]
    if granularity not in valid_granularities:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid granularity. Must be one of: {', '.join(valid_granularities)}"
        )
    
    # Get OANDA credentials from environment
    api_key = settings.OANDA_STREAM_API_KEY
    account_id = settings.OANDA_STREAM_ACCOUNT_ID
    environment = settings.OANDA_STREAM_ENV
    
    # Set base URL based on environment
    if environment == "practice":
        base_url = "https://api-fxpractice.oanda.com/v3"
    else:
        base_url = "https://api-fxtrade.oanda.com/v3"
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{base_url}/accounts/{account_id}/instruments/{instrument}/candles",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                params={
                    "granularity": granularity,
                    "count": count,
                    "price": "MBA"  # Mid, Bid, Ask
                }
            )
            
            response.raise_for_status()
            data = response.json()
            
            candles = []
            for c in data.get("candles", []):
                if c.get("complete", False):  # Only complete candles
                    mid = c.get("mid", {})
                    candles.append(CandleData(
                        time=c.get("time", 0),
                        open=Decimal(mid.get("o", 0)),
                        high=Decimal(mid.get("h", 0)),
                        low=Decimal(mid.get("l", 0)),
                        close=Decimal(mid.get("c", 0)),
                        volume=c.get("volume", 0)
                    ))
            
            return CandlesResponse(
                instrument=instrument,
                granularity=granularity,
                candles=candles
            )
    
    except httpx.HTTPError as e:
        logger.error(f"Failed to fetch candles from OANDA: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to fetch candles from data provider"
        )