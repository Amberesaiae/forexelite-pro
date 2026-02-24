"""MetaApi broker adapter implementation."""

import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

import httpx
from pydantic import BaseModel

from app.brokers.base import (
    BrokerAdapter,
    BrokerType,
    OrderType,
    OrderSide,
    OrderResult,
    CloseResult,
    Position,
    AccountInfo,
)
from app.core.config import settings

logger = logging.getLogger(__name__)


class MetaApiConfig(BaseModel):
    """MetaApi adapter configuration."""
    token: str
    account_id: str


class MetaApiAdapter(BrokerAdapter):
    """
    MetaApi broker adapter for manual trading via MetaApi cloud.
    
    Implements the BrokerAdapter interface for MetaApi broker.
    """
    
    def __init__(self, token: str, account_id: str):
        """
        Initialize MetaApi adapter.
        
        Args:
            token: MetaApi authentication token
            account_id: MetaApi account ID
        """
        self.config = MetaApiConfig(token=token, account_id=account_id)
        self.base_url = "https://cloud.metaapi.io/v1/accounts"
        self._client: Optional[httpx.AsyncClient] = None
    
    @property
    def broker_type(self) -> BrokerType:
        return BrokerType.METAAPI
    
    def _get_headers(self) -> dict:
        """Get headers for API requests."""
        return {
            "Authorization": f"Token {self.config.token}",
            "Content-Type": "application/json",
        }
    
    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client
    
    async def _request(
        self,
        method: str,
        endpoint: str,
        **kwargs
    ) -> dict:
        """Make an API request to MetaApi."""
        client = await self._get_client()
        url = f"{self.base_url}/{self.config.account_id}{endpoint}"
        
        response = await client.request(
            method,
            url,
            headers=self._get_headers(),
            **kwargs
        )
        response.raise_for_status()
        return response.json()
    
    async def place_order(
        self,
        instrument: str,
        order_type: OrderType,
        side: OrderSide,
        quantity: Decimal,
        price: Optional[Decimal] = None,
        sl_pips: Optional[float] = None,
        tp_pips: Optional[float] = None,
        **kwargs
    ) -> OrderResult:
        """
        Place an order with MetaApi.
        
        Args:
            instrument: Trading instrument (e.g., "EURUSD")
            order_type: Type of order
            side: Buy or sell
            quantity: Number of units
            price: Limit price for limit orders
            sl_pips: Stop loss in pips
            tp_pips: Take profit in pips
            
        Returns:
            OrderResult with order status
        """
        try:
            # Build order request
            order_data = {
                "symbol": instrument,
                "actionType": "ORDER_TYPE_" + order_type.value.upper(),
                "volume": float(quantity),
                "side": "ORDER_TYPE_" + side.value.upper(),
            }
            
            if price:
                order_data["price"] = str(price)
            
            # Create order
            result = await self._request(
                "POST",
                "/trade",
                json=order_data
            )
            
            return OrderResult(
                order_id=str(result.get("orderId", "")),
                status="filled" if result.get("done", False) else "pending",
                filled_price=Decimal(result.get("price", 0)) if result.get("price") else None
            )
            
        except httpx.HTTPError as e:
            logger.error(f"MetaApi order failed: {e}")
            return OrderResult(
                order_id="",
                status="rejected",
                error_message=str(e)
            )
    
    async def close_position(
        self,
        position_id: str,
        quantity: Optional[Decimal] = None,
        **kwargs
    ) -> CloseResult:
        """
        Close a position with MetaApi.
        
        Args:
            position_id: The position/trade ID to close
            quantity: Quantity to close (partial close), None for full close
            
        Returns:
            CloseResult with close status and P&L
        """
        try:
            # Close position
            close_data = {}
            if quantity:
                close_data["volume"] = float(quantity)
            
            result = await self._request(
                "POST",
                f"/positions/{position_id}/close",
                json=close_data
            )
            
            return CloseResult(
                order_id=str(result.get("orderId", "")),
                status="closed",
                filled_price=Decimal(result.get("price", 0)) if result.get("price") else None,
                profit_loss=Decimal(result.get("profit", 0)) if result.get("profit") else None
            )
            
        except httpx.HTTPError as e:
            logger.error(f"MetaApi close position failed: {e}")
            return CloseResult(
                order_id="",
                status="failed",
                error_message=str(e)
            )
    
    async def get_positions(self) -> list[Position]:
        """Get all open positions from MetaApi."""
        try:
            result = await self._request("GET", "/positions")
            
            positions = []
            for pos in result or []:
                positions.append(Position(
                    position_id=str(pos.get("id", "")),
                    instrument=pos.get("symbol", ""),
                    side=OrderSide.BUY if pos.get("type", "").startswith("BUY") else OrderSide.SELL,
                    quantity=Decimal(pos.get("volume", 0)),
                    entry_price=Decimal(pos.get("openPrice", 0)),
                    current_price=Decimal(pos.get("currentPrice", 0)),
                    unrealized_pnl=Decimal(pos.get("profit", 0))
                ))
            
            return positions
            
        except httpx.HTTPError as e:
            logger.error(f"MetaApi get positions failed: {e}")
            return []
    
    async def get_account(self) -> AccountInfo:
        """Get account information from MetaApi."""
        try:
            result = await self._request("GET", "")
            
            account = result or {}
            
            return AccountInfo(
                account_id=self.config.account_id,
                balance=Decimal(account.get("balance", 0)),
                equity=Decimal(account.get("equity", 0)),
                margin_used=Decimal(account.get("marginUsed", 0)),
                margin_available=Decimal(account.get("marginFree", 0)),
                margin_ratio=Decimal(account.get("marginLevel", 0)),
                open_positions_count=len(account.get("openPositions", [])),
                pending_orders_count=len(account.get("pendingOrders", []))
            )
            
        except httpx.HTTPError as e:
            logger.error(f"MetaApi get account failed: {e}")
            raise
    
    async def get_current_price(self, instrument: str) -> tuple[Decimal, Decimal]:
        """Get current bid/ask price for an instrument."""
        try:
            result = await self._request(
                "GET",
                f"/symbols/{instrument}/quote"
            )
            
            if result:
                return (
                    Decimal(result.get("bid", 0)),
                    Decimal(result.get("ask", 0))
                )
            
            return (Decimal(0), Decimal(0))
            
        except httpx.HTTPError as e:
            logger.error(f"MetaApi get price failed: {e}")
            return (Decimal(0), Decimal(0))
    
    async def validate_credentials(self) -> bool:
        """Validate MetaApi credentials by making a test API call."""
        try:
            await self._request("GET", "")
            return True
        except httpx.HTTPError:
            return False
    
    async def close(self):
        """Clean up HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None