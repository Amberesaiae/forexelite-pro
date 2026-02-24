"""
Onboarding Routes
Broker connection, preferences, onboarding status
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.core.auth import get_current_user, AuthenticatedUser
from app.core.supabase import get_supabase_client


router = APIRouter()


class OnboardingStatus(BaseModel):
    onboarded: bool
    missing: List[str]


class BrokerConnectionRequest(BaseModel):
    broker_name: str
    account_number: str
    account_type: str  # "demo" or "live"
    label: Optional[str] = None


class BrokerConnectionResponse(BaseModel):
    broker_connection_id: str


class PreferencesRequest(BaseModel):
    risk_percent: Optional[float] = None
    daily_loss_limit_pct: Optional[float] = None
    preferred_pairs: Optional[List[str]] = None
    disclaimer_accepted: Optional[bool] = None


class PreferencesResponse(BaseModel):
    updated: bool


@router.get("/status", response_model=OnboardingStatus)
async def get_onboarding_status(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> OnboardingStatus:
    """Get current onboarding status for the user."""
    supabase = get_supabase_client()
    user_id = current_user.id
    
    # Check broker connections
    broker_response = supabase.table("broker_connections").select(
        "id", count="exact"
    ).eq("user_id", user_id).execute()
    
    has_broker = (broker_response.count or 0) > 0
    
    # Check user settings / disclaimer
    settings_response = supabase.table("user_settings").select(
        "disclaimer_accepted"
    ).eq("user_id", user_id).execute()
    
    has_disclaimer = False
    if settings_response.data:
        has_disclaimer = settings_response.data[0].get("disclaimer_accepted", False) or False
    
    # Determine missing steps
    missing = []
    if not has_broker:
        missing.append("broker")
    if not has_disclaimer:
        missing.append("disclaimer")
    
    return OnboardingStatus(
        onboarded=len(missing) == 0,
        missing=missing,
    )


@router.put("/brokers", response_model=BrokerConnectionResponse)
async def connect_broker(
    request: BrokerConnectionRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> BrokerConnectionResponse:
    """Connect a new broker account."""
    supabase = get_supabase_client()
    user_id = current_user.id
    
    response = supabase.table("broker_connections").insert({
        "user_id": user_id,
        "broker_name": request.broker_name,
        "account_number": request.account_number,
        "account_type": request.account_type,
        "label": request.label,
    }).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to connect broker",
        )
    
    return BrokerConnectionResponse(
        broker_connection_id=response.data[0]["id"]
    )


@router.put("/preferences", response_model=PreferencesResponse)
async def update_preferences(
    request: PreferencesRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> PreferencesResponse:
    """Update user preferences and settings."""
    supabase = get_supabase_client()
    user_id = current_user.id
    
    # Build update payload
    update_data = {}
    if request.risk_percent is not None:
        update_data["risk_percent"] = request.risk_percent
    if request.daily_loss_limit_pct is not None:
        update_data["daily_loss_limit_pct"] = request.daily_loss_limit_pct
    if request.preferred_pairs is not None:
        update_data["preferred_pairs"] = request.preferred_pairs
    if request.disclaimer_accepted is not None:
        update_data["disclaimer_accepted"] = request.disclaimer_accepted
    
    if not update_data:
        return PreferencesResponse(updated=True)
    
    # Upsert user settings
    update_data["user_id"] = user_id
    
    supabase.table("user_settings").upsert(
        update_data,
        on_conflict="user_id",
    ).execute()
    
    return PreferencesResponse(updated=True)
