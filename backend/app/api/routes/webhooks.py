"""
Webhook Routes
TradingView Webhook Receiver
"""
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel
from app.core.supabase import get_supabase_client


router = APIRouter()


@router.post("/tv/{webhook_secret}")
async def receive_tv_webhook(webhook_secret: str, request: Request):
    """Receive TradingView webhook alerts."""
    supabase = get_supabase_client()
    
    # Look up strategy by webhook_secret
    strategy_response = supabase.table("tv_strategies").select("*").eq("webhook_secret", webhook_secret).execute()
    
    # Silently return 200 even if not found (avoid information leakage)
    if not strategy_response.data:
        return {"status": "ok"}
    
    strategy = strategy_response.data[0]
    user_id = strategy["user_id"]
    
    # Check if strategy is enabled
    if not strategy.get("is_enabled", True):
        # Log as discarded
        supabase.table("tv_signals").insert({
            "user_id": user_id,
            "strategy_id": strategy["id"],
            "status": "discarded",
            "raw_payload": {},
        }).execute()
        return {"status": "ok"}
    
    # Parse payload
    try:
        payload = await request.json()
    except Exception:
        payload = {}
    
    symbol = payload.get("symbol")
    action = payload.get("action", "").lower()
    volume = payload.get("volume")
    
    if not symbol:
        return {"status": "ok"}
    
    # Risk gate - check daily loss limit
    # Simplified - would check today's realized P&L
    
    # Create signal
    signal_response = supabase.table("tv_signals").insert({
        "user_id": user_id,
        "strategy_id": strategy["id"],
        "status": "pending",
        "symbol": symbol,
        "action": action,
        "volume": volume,
        "raw_payload": payload,
    }).execute()
    
    signal_id = signal_response.data[0]["id"]
    
    # Create trade job
    supabase.table("jobs").insert({
        "user_id": user_id,
        "job_type": "trade",
        "input_data": {
            "symbol": symbol,
            "side": action,
            "volume": volume,
            "source": "tv_signal",
            "signal_id": signal_id,
        },
        "status": "pending",
    }).execute()
    
    return {"status": "ok"}
