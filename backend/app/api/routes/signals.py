"""
Signal Routes
TradingView Signal History
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.core.auth import get_current_user, AuthenticatedUser
from app.core.supabase import get_supabase_client


router = APIRouter()


class Signal(BaseModel):
    id: str
    strategy_name: str
    symbol: str
    action: str
    status: str
    fill_price: float
    broker_order_id: str
    error_message: str
    raw_payload: dict
    created_at: str
    resolved_at: str


@router.get("", response_model=List[dict])
async def list_signals(
    limit: int = 50,
    offset: int = 0,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> List[dict]:
    """List user's signals."""
    supabase = get_supabase_client()
    
    # Get signals with strategy name
    response = supabase.table("tv_signals").select(
        "*, tv_strategies(name)"
    ).eq("user_id", current_user.id).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    
    signals = []
    for s in response.data:
        strategy_name = s.get("tv_strategies", {}).get("name", "Unknown") if isinstance(s.get("tv_strategies"), dict) else "Unknown"
        signals.append({
            "id": s["id"],
            "strategy_name": strategy_name,
            "symbol": s.get("symbol"),
            "action": s.get("action"),
            "status": s.get("status"),
            "fill_price": s.get("fill_price"),
            "broker_order_id": s.get("broker_order_id"),
            "error_message": s.get("error_message"),
            "raw_payload": s.get("raw_payload"),
            "created_at": str(s.get("created_at")),
            "resolved_at": str(s.get("resolved_at")) if s.get("resolved_at") else None,
        })
    
    return signals


@router.get("/{signal_id}")
async def get_signal(
    signal_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """Get signal details."""
    supabase = get_supabase_client()
    
    response = supabase.table("tv_signals").select(
        "*, tv_strategies(name)"
    ).eq("id", signal_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Signal not found",
        )
    
    s = response.data[0]
    return {
        "id": s["id"],
        "strategy_name": s.get("tv_strategies", {}).get("name", "Unknown"),
        "symbol": s.get("symbol"),
        "action": s.get("action"),
        "status": s.get("status"),
        "fill_price": s.get("fill_price"),
        "broker_order_id": s.get("broker_order_id"),
        "error_message": s.get("error_message"),
        "raw_payload": s.get("raw_payload"),
        "created_at": str(s.get("created_at")),
        "resolved_at": str(s.get("resolved_at")) if s.get("resolved_at") else None,
    }
