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
    strategy_response = (
        supabase.table("tv_strategies")
        .select("*")
        .eq("webhook_secret", webhook_secret)
        .execute()
    )

    # Silently return 200 even if not found (avoid information leakage)
    if not strategy_response.data:
        return {"status": "ok"}

    strategy = strategy_response.data[0]
    user_id = strategy["user_id"]

    # Check if strategy is enabled
    if not strategy.get("is_enabled", True):
        # Log as discarded
        supabase.table("tv_signals").insert(
            {
                "user_id": user_id,
                "strategy_id": strategy["id"],
                "status": "discarded",
                "raw_payload": {},
            }
        ).execute()
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
    # Get user's daily loss limit and cached balance from user_settings
    settings_response = (
        supabase.table("user_settings")
        .select("daily_loss_limit_pct, cached_balance")
        .eq("user_id", user_id)
        .execute()
    )

    daily_loss_limit_pct = 5.0  # default
    cached_balance = 10000.0  # default fallback balance
    if settings_response.data:
        settings = settings_response.data[0]
        daily_loss_limit_pct = settings.get("daily_loss_limit_pct", 5.0)
        cached_balance = settings.get("cached_balance", 10000.0)

    # Calculate today's realized P&L from trade_events
    from datetime import datetime, timezone

    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    pnl_response = (
        supabase.table("trade_events")
        .select("profit_loss")
        .eq("user_id", user_id)
        .gte("created_at", today_start.isoformat())
        .execute()
    )

    total_pnl = sum(
        (event.get("profit_loss", 0) or 0) for event in (pnl_response.data or [])
    )

    # Check if daily loss limit would be breached - compute percentage properly
    if cached_balance and cached_balance > 0:
        loss_percentage = abs(total_pnl) / cached_balance * 100
        if total_pnl < 0 and loss_percentage >= daily_loss_limit_pct:
            # Log as discarded due to daily loss limit
            supabase.table("tv_signals").insert(
                {
                    "user_id": user_id,
                    "strategy_id": strategy["id"],
                    "symbol": symbol,
                    "action": action,
                    "status": "discarded",
                    "error_message": "daily_loss_limit_reached",
                    "raw_payload": payload,
                }
            ).execute()
            return {"status": "ok"}

    # Create signal
    signal_response = (
        supabase.table("tv_signals")
        .insert(
            {
                "user_id": user_id,
                "strategy_id": strategy["id"],
                "status": "pending",
                "symbol": symbol,
                "action": action,
                "volume": volume,
                "raw_payload": payload,
            }
        )
        .execute()
    )

    signal_id = signal_response.data[0]["id"]

    # Create trade job
    supabase.table("jobs").insert(
        {
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
        }
    ).execute()

    return {"status": "ok"}
