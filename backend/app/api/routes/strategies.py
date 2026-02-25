"""
Strategy Routes
TradingView Strategy Management
"""

import secrets
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.core.auth import get_current_user, AuthenticatedUser
from app.core.supabase import get_supabase_client
from app.core.config import get_settings


router = APIRouter()


class Strategy(BaseModel):
    id: str
    name: str
    user_id: str
    broker_connection_id: Optional[str]
    webhook_secret: str
    webhook_url: str
    risk_override_pct: Optional[float]
    allowed_pairs: Optional[List[str]]
    is_enabled: bool


class CreateStrategyRequest(BaseModel):
    name: str
    broker_connection_id: Optional[str] = None
    risk_override_pct: Optional[float] = None
    allowed_pairs: Optional[List[str]] = None


class UpdateStrategyRequest(BaseModel):
    name: Optional[str] = None
    risk_override_pct: Optional[float] = None
    allowed_pairs: Optional[List[str]] = None
    is_enabled: Optional[bool] = None


@router.get("", response_model=List[dict])
async def list_strategies(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> List[dict]:
    """List user's trading strategies."""
    supabase = get_supabase_client()
    settings = get_settings()

    response = (
        supabase.table("tv_strategies")
        .select("*")
        .eq("user_id", current_user.id)
        .execute()
    )

    # Add webhook URLs
    strategies = []
    for s in response.data:
        s["webhook_url"] = (
            f"{settings.BASE_URL}/api/v1/webhooks/tv/{s['webhook_secret']}"
        )
        strategies.append(s)

    return strategies


@router.post("")
async def create_strategy(
    request: CreateStrategyRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """Create a new TradingView strategy."""
    supabase = get_supabase_client()
    settings = get_settings()

    # Generate unique webhook secret
    webhook_secret = secrets.token_urlsafe(32)

    strategy_data = {
        "user_id": current_user.id,
        "name": request.name,
        "broker_connection_id": request.broker_connection_id,
        "webhook_secret": webhook_secret,
        "risk_override_pct": request.risk_override_pct,
        "allowed_pairs": request.allowed_pairs,
        "is_enabled": True,
    }

    response = supabase.table("tv_strategies").insert(strategy_data).execute()

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create strategy",
        )

    strategy = response.data[0]
    strategy["webhook_url"] = f"{settings.BASE_URL}/api/v1/webhooks/tv/{webhook_secret}"

    return strategy


@router.patch("/{strategy_id}")
async def update_strategy(
    strategy_id: str,
    request: UpdateStrategyRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """Update a strategy."""
    supabase = get_supabase_client()

    # Build update payload
    update_data = {}
    if request.name is not None:
        update_data["name"] = request.name
    if request.risk_override_pct is not None:
        update_data["risk_override_pct"] = request.risk_override_pct
    if request.allowed_pairs is not None:
        update_data["allowed_pairs"] = request.allowed_pairs
    if request.is_enabled is not None:
        update_data["is_enabled"] = request.is_enabled

    if not update_data:
        return {"updated": True}

    # Verify ownership and update
    response = (
        supabase.table("tv_strategies")
        .update(update_data)
        .eq("id", strategy_id)
        .eq("user_id", current_user.id)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Strategy not found",
        )

    return {"updated": True}


@router.delete("/{strategy_id}")
async def delete_strategy(
    strategy_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """Delete a strategy."""
    supabase = get_supabase_client()

    # Verify ownership before delete
    response = (
        supabase.table("tv_strategies")
        .delete()
        .eq("id", strategy_id)
        .eq("user_id", current_user.id)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Strategy not found",
        )

    return {"deleted": True}
