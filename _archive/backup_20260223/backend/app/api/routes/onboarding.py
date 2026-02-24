"""Onboarding API routes."""

import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from supabase import create_client

from app.core.auth import get_current_user, AuthenticatedUser
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/onboarding", tags=["onboarding"])


class BrokerConnectionRequest(BaseModel):
    """Broker connection request."""
    broker_type: str  # OANDA, MT5_AGENT, METAAPI
    name: str
    credentials: dict


class BrokerValidationResult(BaseModel):
    """Broker validation result."""
    broker_type: str
    success: bool
    message: str


class OnboardingPreferencesRequest(BaseModel):
    """Onboarding preferences request."""
    risk_percent: float = 1.0
    account_currency: str = "USD"
    preferred_pairs: list[str] = []
    disclaimer_accepted: bool


class OnboardingStatusResponse(BaseModel):
    """Onboarding status response."""
    onboarded: bool
    has_broker_connection: bool
    disclaimer_accepted: bool


@router.get("/status")
async def get_onboarding_status(
    user: AuthenticatedUser = Depends(get_current_user)
) -> OnboardingStatusResponse:
    """
    Get current onboarding status for the user.
    
    Returns:
        Onboarding status including broker connection and disclaimer acceptance
    """
    client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY
    )
    
    # Check for broker connections
    broker_result = client.table("broker_connections").select("id").eq("user_id", user.id).eq("is_active", True).execute()
    has_broker = len(broker_result.data) > 0
    
    # Check for disclaimer acceptance
    settings_result = client.table("user_settings").select("disclaimer_accepted").eq("user_id", user.id).execute()
    disclaimer_accepted = False
    if settings_result.data:
        disclaimer_accepted = settings_result.data[0].get("disclaimer_accepted", False)
    
    return OnboardingStatusResponse(
        onboarded=has_broker and disclaimer_accepted,
        has_broker_connection=has_broker,
        disclaimer_accepted=disclaimer_accepted
    )


@router.put("/brokers")
async def save_broker_connections(
    brokers: list[BrokerConnectionRequest],
    user: AuthenticatedUser = Depends(get_current_user)
) -> list[BrokerValidationResult]:
    """
    Save broker connections and validate credentials.
    
    Args:
        brokers: List of broker connections to save
        user: Current authenticated user
        
    Returns:
        Validation results for each broker
    """
    client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY
    )
    
    results = []
    
    for broker in brokers:
        validation_result = BrokerValidationResult(
            broker_type=broker.broker_type,
            success=False,
            message=""
        )
        
        try:
            # Validate credentials based on broker type
            if broker.broker_type == "OANDA":
                from app.brokers.oanda import OANDAAdapter
                adapter = OANDAAdapter(
                    api_key=broker.credentials.get("api_key", ""),
                    account_id=broker.credentials.get("account_id", ""),
                    environment=broker.credentials.get("environment", "practice")
                )
                is_valid = await adapter.validate_credentials()
                if is_valid:
                    validation_result.success = True
                    validation_result.message = "OANDA credentials validated"
                else:
                    validation_result.message = "Invalid OANDA credentials"
            
            elif broker.broker_type == "MT5_AGENT":
                # MT5 Agent pairing is validated separately
                validation_result.success = True
                validation_result.message = "MT5 Agent connection saved"
            
            elif broker.broker_type == "METAAPI":
                from app.brokers.metaapi import MetaApiAdapter
                adapter = MetaApiAdapter(
                    token=broker.credentials.get("token", ""),
                    account_id=broker.credentials.get("account_id", "")
                )
                is_valid = await adapter.validate_credentials()
                if is_valid:
                    validation_result.success = True
                    validation_result.message = "MetaApi credentials validated"
                else:
                    validation_result.message = "Invalid MetaApi credentials"
            
            # Save broker connection if valid
            if validation_result.success:
                client.table("broker_connections").insert({
                    "user_id": user.id,
                    "broker_type": broker.broker_type,
                    "name": broker.name,
                    "credentials": broker.credentials,
                    "is_active": True,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }).execute()
            
        except Exception as e:
            validation_result.message = f"Error: {str(e)}"
        
        results.append(validation_result)
    
    return results


@router.put("/preferences")
async def save_preferences(
    preferences: OnboardingPreferencesRequest,
    user: AuthenticatedUser = Depends(get_current_user)
) -> dict:
    """
    Save onboarding preferences and accept disclaimer.
    
    Args:
        preferences: User preferences
        user: Current authenticated user
        
    Returns:
        Success message
    """
    if not preferences.disclaimer_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trading disclaimer must be accepted"
        )
    
    client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY
    )
    
    # Update user settings
    client.table("user_settings").update({
        "risk_percent": preferences.risk_percent,
        "account_currency": preferences.account_currency,
        "preferred_pairs": preferences.preferred_pairs,
        "disclaimer_accepted": True,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("user_id", user.id).execute()
    
    return {"message": "Preferences saved successfully"}


def check_onboarding_complete(user_id: str) -> bool:
    """
    Check if user has completed onboarding.
    
    Args:
        user_id: The user ID
        
    Returns:
        True if onboarding is complete
    """
    client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY
    )
    
    # Check for broker connections
    broker_result = client.table("broker_connections").select("id").eq("user_id", user_id).eq("is_active", True).execute()
    if len(broker_result.data) == 0:
        return False
    
    # Check for disclaimer acceptance
    settings_result = client.table("user_settings").select("disclaimer_accepted").eq("user_id", user_id).execute()
    if not settings_result.data or not settings_result.data[0].get("disclaimer_accepted", False):
        return False
    
    return True