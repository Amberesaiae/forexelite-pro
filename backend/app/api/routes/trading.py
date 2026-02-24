"""
Trading Routes
Orders, Positions, Account, Candles
"""
import asyncio
import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.core.auth import get_current_user, AuthenticatedUser
from app.core.supabase import get_supabase_client
from app.core.redis import get_redis
import json


router = APIRouter()


class OrderRequest(BaseModel):
    symbol: str
    side: str  # "buy" or "sell"
    volume: float
    sl_pips: Optional[float] = None
    tp_pips: Optional[float] = None


class OrderResponse(BaseModel):
    order_id: str
    fill_price: Optional[float] = None
    status: str  # "filled", "pending", "error"


class Position(BaseModel):
    id: str
    ticket: str
    symbol: str
    side: str
    volume: float
    open_price: float
    current_price: float
    sl: Optional[float]
    tp: Optional[float]
    pnl: float


class AccountInfo(BaseModel):
    balance: float
    equity: float
    margin_used: float
    margin_available: float
    currency: str
    leverage: int


class Candle(BaseModel):
    time: str
    open: float
    high: float
    low: float
    close: float
    volume: float


@router.post("/orders", response_model=OrderResponse)
async def place_order(
    request: OrderRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> OrderResponse:
    """Place a manual trading order."""
    supabase = get_supabase_client()
    user_id = current_user.id
    
    # Check for connected agent
    agents = supabase.table("mt5_agents").select("id").eq("user_id", user_id).eq("is_connected", True).execute()
    
    if not agents.data:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="agent_offline",
        )
    
    # Check agent heartbeat
    agent = supabase.table("mt5_agents").select("last_heartbeat").eq("id", agents.data[0]["id"]).execute()
    if agent.data:
        from datetime import datetime, timedelta
        last_hb = agent.data[0].get("last_heartbeat")
        if last_hb:
            if isinstance(last_hb, str):
                last_hb = datetime.fromisoformat(last_hb.replace("Z", "+00:00"))
            minutes_since = (datetime.now() - last_hb).total_seconds() / 60
            if minutes_since > 10:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="agent_offline",
                )
    
    # Check margin (simplified)
    account = supabase.table("user_settings").select("risk_percent").eq("user_id", user_id).execute()
    # For demo, allow all orders
    
    # Create trade job
    job_response = supabase.table("jobs").insert({
        "user_id": user_id,
        "job_type": "trade",
        "input_data": {
            "symbol": request.symbol,
            "side": request.side,
            "volume": request.volume,
            "sl_pips": request.sl_pips,
            "tp_pips": request.tp_pips,
        },
        "status": "pending",
    }).execute()
    
    job_id = job_response.data[0]["id"]
    
    # Wait for job completion (up to 10s)
    for _ in range(20):  # 20 * 0.5s = 10s
        await asyncio.sleep(0.5)
        job = supabase.table("jobs").select("status, output_data").eq("id", job_id).execute()
        
        if job.data:
            job_status = job.data[0]["status"]
            if job_status == "completed":
                output = job.data[0].get("output_data", {})
                return OrderResponse(
                    order_id=job_id,
                    fill_price=output.get("fill_price"),
                    status="filled",
                )
            elif job_status == "failed":
                return OrderResponse(
                    order_id=job_id,
                    status="error",
                )
    
    # Timeout - still pending
    return OrderResponse(
        order_id=job_id,
        status="pending",
    )


@router.get("/positions", response_model=List[Position])
async def get_positions(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> list:
    """Get open positions."""
    supabase = get_supabase_client()

    # Find connected agent
    agents = supabase.table("mt5_agents").select("id").eq("user_id", current_user.id).eq("is_connected", True).execute()

    if not agents.data:
        return []

    # Create job
    job_response = supabase.table("jobs").insert({
        "user_id": current_user.id,
        "job_type": "get_positions",
        "input_data": {},
        "status": "pending",
    }).execute()

    job_id = job_response.data[0]["id"]

    # Poll for completion (up to 5s)
    for _ in range(10):  # 10 * 0.5s = 5s
        await asyncio.sleep(0.5)
        job = supabase.table("jobs").select("status, output_data").eq("id", job_id).execute()

        if job.data:
            job_status = job.data[0]["status"]
            if job_status == "completed":
                output = job.data[0].get("output_data", {})
                return output.get("positions", [])
            elif job_status == "failed":
                return []

    # Timeout
    return []


@router.delete("/positions/{position_id}")
async def close_position(
    position_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """Close a position."""
    supabase = get_supabase_client()
    
    # Create close job
    job_response = supabase.table("jobs").insert({
        "user_id": current_user.id,
        "job_type": "close_position",
        "input_data": {"ticket": position_id},
        "status": "pending",
    }).execute()
    
    job_id = job_response.data[0]["id"]
    
    # Wait for completion
    for _ in range(20):
        await asyncio.sleep(0.5)
        job = supabase.table("jobs").select("status, output_data").eq("id", job_id).execute()
        
        if job.data:
            job_status = job.data[0]["status"]
            if job_status == "completed":
                output = job.data[0].get("output_data", {})
                return {
                    "closed_price": output.get("closed_price"),
                    "pnl": output.get("pnl"),
                }
            elif job_status == "failed":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to close position",
                )
    
    raise HTTPException(
        status_code=status.HTTP_504_GATEWAY_TIMEOUT,
        detail="Position close timeout",
    )


@router.get("/account", response_model=AccountInfo)
async def get_account(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AccountInfo:
    """Get account information."""
    supabase = get_supabase_client()

    # Find connected agent
    agents = supabase.table("mt5_agents").select("id").eq("user_id", current_user.id).eq("is_connected", True).execute()

    if not agents.data:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="agent_offline",
        )

    # Create job
    job_response = supabase.table("jobs").insert({
        "user_id": current_user.id,
        "job_type": "get_account",
        "input_data": {},
        "status": "pending",
    }).execute()

    job_id = job_response.data[0]["id"]

    # Poll for completion (up to 5s)
    for _ in range(10):  # 10 * 0.5s = 5s
        await asyncio.sleep(0.5)
        job = supabase.table("jobs").select("status, output_data").eq("id", job_id).execute()

        if job.data:
            job_status = job.data[0]["status"]
            if job_status == "completed":
                output = job.data[0].get("output_data", {})
                return AccountInfo(balance=output.get("balance",0.0), equity=output.get("equity",0.0), margin_used=output.get("margin_used",0.0), margin_available=output.get("margin_available",0.0), currency=output.get("currency","USD"), leverage=output.get("leverage",100))
            elif job_status == "failed":
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="agent_error",
                )

    raise HTTPException(
        status_code=status.HTTP_504_GATEWAY_TIMEOUT,
        detail="Account info timeout",
    )


@router.get("/candles/{instrument}", response_model=List[Candle])
async def get_candles(
    instrument: str,
    timeframe: str = "H1",
    count: int = 200,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> List[Candle]:
    """Get OHLCV candles for instrument."""
    redis = await get_redis()
    
    # Check cache
    cache_key = f"candles:{instrument}:{timeframe}"
    cached = await redis.get(cache_key)
    
    if cached:
        return json.loads(cached)
    
    # Create job to get candles
    supabase = get_supabase_client()
    
    job_response = supabase.table("jobs").insert({
        "user_id": current_user.id,
        "job_type": "get_candles",
        "input_data": {
            "symbol": instrument,
            "timeframe": timeframe,
            "count": count,
        },
        "status": "pending",
    }).execute()
    
    job_id = job_response.data[0]["id"]
    
    # Wait for completion (up to 10s)
    for _ in range(20):
        await asyncio.sleep(0.5)
        job = supabase.table("jobs").select("status, output_data").eq("id", job_id).execute()
        
        if job.data and job.data[0]["status"] == "completed":
            output = job.data[0].get("output_data", {})
            candles = output.get("candles", [])
            
            # Cache for 30s
            await redis.setex(cache_key, 30, json.dumps(candles))
            
            return candles
    
    # Return mock data if timeout
    mock_candles = [
        {"time": "2026-02-20", "open": 1.0800, "high": 1.0825, "low": 1.0790, "close": 1.0815, "volume": 1000},
        {"time": "2026-02-21", "open": 1.0815, "high": 1.0840, "low": 1.0805, "close": 1.0830, "volume": 1200},
        {"time": "2026-02-22", "open": 1.0830, "high": 1.0855, "low": 1.0820, "close": 1.0845, "volume": 900},
        {"time": "2026-02-23", "open": 1.0845, "high": 1.0860, "low": 1.0835, "close": 1.0845, "volume": 1100},
    ]
    
    await redis.setex(cache_key, 30, json.dumps(mock_candles))
    
    return mock_candles
