"""Trading API routes."""

import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from supabase import create_client

from app.core.auth import get_current_user, AuthenticatedUser
from app.core.config import settings
from app.brokers.base import OrderType, OrderSide
from app.brokers.resolver import broker_resolver

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/trading", tags=["trading"])


class OrderRequest(BaseModel):
    """Order request."""
    broker_connection_id: str
    instrument: str
    order_type: str  # market, limit, stop
    side: str  # buy, sell
    quantity: Decimal
    price: Optional[Decimal] = None
    sl_pips: Optional[float] = None
    tp_pips: Optional[float] = None


class OrderResponse(BaseModel):
    """Order response."""
    order_id: str
    status: str
    filled_price: Optional[Decimal] = None
    filled_at: Optional[datetime] = None
    error_message: Optional[str] = None


class PositionResponse(BaseModel):
    """Position response."""
    position_id: str
    instrument: str
    side: str
    quantity: Decimal
    entry_price: Decimal
    current_price: Optional[Decimal] = None
    unrealized_pnl: Optional[Decimal] = None


class AccountResponse(BaseModel):
    """Account response."""
    account_id: str
    balance: Decimal
    equity: Decimal
    margin_used: Decimal
    margin_available: Decimal
    margin_ratio: Decimal
    open_positions_count: int
    pending_orders_count: int


class ClosePositionRequest(BaseModel):
    """Close position request."""
    quantity: Optional[Decimal] = None


@router.post("/orders")
async def place_order(
    order: OrderRequest,
    user: AuthenticatedUser = Depends(get_current_user)
) -> OrderResponse:
    """
    Place a new order.
    
    Args:
        order: Order details
        user: Current authenticated user
        
    Returns:
        Order result
    """
    try:
        # Get broker adapter
        adapter = await broker_resolver.get_broker_adapter(
            order.broker_connection_id,
            user.id
        )
        
        # Place order
        result = await adapter.place_order(
            instrument=order.instrument,
            order_type=OrderType(order.order_type),
            side=OrderSide(order.side),
            quantity=order.quantity,
            price=order.price,
            sl_pips=order.sl_pips,
            tp_pips=order.tp_pips
        )
        
        # Record trade event
        client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )
        
        client.table("trade_events").insert({
            "user_id": user.id,
            "broker_connection_id": order.broker_connection_id,
            "event_type": "order_placed",
            "pair": order.instrument,
            "direction": order.side.upper(),
            "quantity": float(order.quantity),
            "external_order_id": result.order_id,
            "metadata": {
                "order_type": order.order_type,
                "sl_pips": order.sl_pips,
                "tp_pips": order.tp_pips
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        
        return OrderResponse(
            order_id=result.order_id,
            status=result.status,
            filled_price=result.filled_price,
            filled_at=result.filled_at,
            error_message=result.error_message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Place order failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/positions/{position_id}")
async def close_position(
    position_id: str,
    broker_connection_id: str = Query(...),
    quantity: Optional[Decimal] = None,
    user: AuthenticatedUser = Depends(get_current_user)
) -> dict:
    """
    Close a position.
    
    Args:
        position_id: Position ID to close
        broker_connection_id: Broker connection ID
        quantity: Quantity to close (partial close)
        user: Current authenticated user
        
    Returns:
        Close result
    """
    try:
        # Get broker adapter
        adapter = await broker_resolver.get_broker_adapter(
            broker_connection_id,
            user.id
        )
        
        # Close position
        result = await adapter.close_position(position_id, quantity)
        
        # Record trade event
        client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )
        
        client.table("trade_events").insert({
            "user_id": user.id,
            "broker_connection_id": broker_connection_id,
            "event_type": "order_closed",
            "external_position_id": position_id,
            "external_order_id": result.order_id,
            "exit_price": float(result.filled_price) if result.filled_price else None,
            "profit_loss": float(result.profit_loss) if result.profit_loss else None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        
        return {
            "order_id": result.order_id,
            "status": result.status,
            "filled_price": result.filled_price,
            "profit_loss": result.profit_loss,
            "error_message": result.error_message
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Close position failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/positions")
async def get_positions(
    broker_connection_id: str = Query(...),
    user: AuthenticatedUser = Depends(get_current_user)
) -> list[PositionResponse]:
    """
    Get all open positions for a broker connection.
    
    Args:
        broker_connection_id: Broker connection ID
        user: Current authenticated user
        
    Returns:
        List of open positions
    """
    try:
        adapter = await broker_resolver.get_broker_adapter(
            broker_connection_id,
            user.id
        )
        
        positions = await adapter.get_positions()
        
        return [
            PositionResponse(
                position_id=p.position_id,
                instrument=p.instrument,
                side=p.side.value,
                quantity=p.quantity,
                entry_price=p.entry_price,
                current_price=p.current_price,
                unrealized_pnl=p.unrealized_pnl
            )
            for p in positions
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get positions failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/account")
async def get_account(
    broker_connection_id: str = Query(...),
    user: AuthenticatedUser = Depends(get_current_user)
) -> AccountResponse:
    """
    Get account information for a broker connection.
    
    Args:
        broker_connection_id: Broker connection ID
        user: Current authenticated user
        
    Returns:
        Account information
    """
    try:
        adapter = await broker_resolver.get_broker_adapter(
            broker_connection_id,
            user.id
        )
        
        account = await adapter.get_account()
        
        return AccountResponse(
            account_id=account.account_id,
            balance=account.balance,
            equity=account.equity,
            margin_used=account.margin_used,
            margin_available=account.margin_available,
            margin_ratio=account.margin_ratio,
            open_positions_count=account.open_positions_count,
            pending_orders_count=account.pending_orders_count
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get account failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )