"""OANDA broker adapter implementation."""

import logging
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
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


class OANDAEnvironment(str, Enum):
    """OANDA environment."""

    PRACTICE = "practice"
    LIVE = "trade"


class OANDAConfig(BaseModel):
    """OANDA adapter configuration."""

    api_key: str
    account_id: str
    environment: OANDAEnvironment = OANDAEnvironment.PRACTICE


class OANDAAdapter(BrokerAdapter):
    """
    OANDA broker adapter using v20 REST API.

    Implements the BrokerAdapter interface for OANDA broker.
    """

    def __init__(self, api_key: str, account_id: str, environment: str = "practice"):
        """
        Initialize OANDA adapter.

        Args:
            api_key: OANDA API key
            account_id: OANDA account ID
            environment: "practice" or "live"
        """
        self.config = OANDAConfig(
            api_key=api_key,
            account_id=account_id,
            environment=OANDAEnvironment(environment),
        )
        self._client: Optional[httpx.AsyncClient] = None

        # Set base URL based on environment
        if self.config.environment == OANDAEnvironment.PRACTICE:
            self.base_url = "https://api-fxpractice.oanda.com/v3"
        else:
            self.base_url = "https://api-fxtrade.oanda.com/v3"

    @property
    def broker_type(self) -> BrokerType:
        return BrokerType.OANDA

    def _get_headers(self) -> dict:
        """Get headers for API requests."""
        return {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json",
            "Accept-Datetime-Format": "UNIX",
        }

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client

    async def _request(self, method: str, endpoint: str, **kwargs) -> dict:
        """Make an API request to OANDA."""
        client = await self._get_client()
        url = f"{self.base_url}{endpoint}"

        response = await client.request(
            method, url, headers=self._get_headers(), **kwargs
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
        **kwargs,
    ) -> OrderResult:
        """
        Place an order with OANDA.

        Args:
            instrument: Trading instrument (e.g., "EUR_USD")
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
                "order": {
                    "type": order_type.value.upper(),
                    "instrument": instrument,
                    "units": str(int(quantity))
                    if side == OrderSide.BUY
                    else str(-int(quantity)),
                    "timeInForce": "FOK",  # Fill or Kill for market orders
                }
            }

            # Add price for limit orders
            if order_type == OrderType.LIMIT and price:
                order_data["order"]["price"] = str(price)

            # Add stop loss and take profit
            if sl_pips is not None or tp_pips is not None:
                order_data["order"]["stopLossOnFill"] = {}
                order_data["order"]["takeProfitOnFill"] = {}

                if sl_pips is not None:
                    # Calculate SL price based on side
                    # This is simplified - actual implementation needs pip size
                    order_data["order"]["stopLossOnFill"]["price"] = str(sl_pips)

                if tp_pips is not None:
                    order_data["order"]["takeProfitOnFill"]["price"] = str(tp_pips)

            # Create order
            result = await self._request(
                "POST", f"/accounts/{self.config.account_id}/orders", json=order_data
            )

            order = result.get("orderCreateTransaction", {})

            return OrderResult(
                order_id=order.get("id", ""),
                status="filled" if order.get("status") == "FILLED" else "pending",
                filled_price=Decimal(order.get("price", 0)),
                filled_at=datetime.fromtimestamp(
                    order.get("filledTime", 0) / 1000, tz=timezone.utc
                )
                if order.get("filledTime")
                else None,
            )

        except httpx.HTTPError as e:
            logger.error(f"OANDA order failed: {e}")
            return OrderResult(order_id="", status="rejected", error_message=str(e))

    async def close_position(
        self, position_id: str, quantity: Optional[Decimal] = None, **kwargs
    ) -> CloseResult:
        """
        Close a position with OANDA.

        Args:
            position_id: The position/trade ID to close
            quantity: Quantity to close (partial close), None for full close

        Returns:
            CloseResult with close status and P&L
        """
        try:
            # Get position details first
            positions = await self._request(
                "GET", f"/accounts/{self.config.account_id}/positions"
            )

            position = None
            for p in positions.get("positions", []):
                if p.get("trade", {}).get("id") == position_id:
                    position = p
                    break

            if not position:
                return CloseResult(
                    order_id="",
                    status="failed",
                    error_message=f"Position {position_id} not found",
                )

            # Build close request
            close_data = {}
            if quantity:
                close_data["units"] = str(int(quantity))

            # Close position
            result = await self._request(
                "PUT",
                f"/accounts/{self.config.account_id}/positions/{position_id}/close",
                json=close_data,
            )

            order = result.get("orderFillTransaction", {})

            return CloseResult(
                order_id=order.get("id", ""),
                status="closed",
                filled_price=Decimal(order.get("price", 0)),
                filled_at=datetime.fromtimestamp(
                    order.get("time", 0) / 1000, tz=timezone.utc
                )
                if order.get("time")
                else None,
                profit_loss=Decimal(order.get("pl", 0)),
            )

        except httpx.HTTPError as e:
            logger.error(f"OANDA close position failed: {e}")
            return CloseResult(order_id="", status="failed", error_message=str(e))

    async def get_positions(self) -> list[Position]:
        """Get all open positions from OANDA."""
        try:
            result = await self._request(
                "GET", f"/accounts/{self.config.account_id}/positions"
            )

            positions = []
            for pos in result.get("positions", []):
                instrument = pos.get("instrument", "")

                for trade in pos.get("long", {}).get("tradeIDs", []):
                    positions.append(
                        Position(
                            position_id=trade,
                            instrument=instrument,
                            side=OrderSide.BUY,
                            quantity=Decimal(pos.get("long", {}).get("units", 0)),
                            entry_price=Decimal(0),  # Would need to fetch trade details
                            current_price=Decimal(
                                pos.get("long", {}).get("price", {}).get("value", 0)
                            ),
                            unrealized_pnl=Decimal(
                                pos.get("long", {}).get("unrealizedPL", 0)
                            ),
                        )
                    )

                for trade in pos.get("short", {}).get("tradeIDs", []):
                    positions.append(
                        Position(
                            position_id=trade,
                            instrument=instrument,
                            side=OrderSide.SELL,
                            quantity=Decimal(pos.get("short", {}).get("units", 0)),
                            entry_price=Decimal(0),
                            current_price=Decimal(
                                pos.get("short", {}).get("price", {}).get("value", 0)
                            ),
                            unrealized_pnl=Decimal(
                                pos.get("short", {}).get("unrealizedPL", 0)
                            ),
                        )
                    )

            return positions

        except httpx.HTTPError as e:
            logger.error(f"OANDA get positions failed: {e}")
            return []

    async def get_account(self) -> AccountInfo:
        """Get account information from OANDA."""
        try:
            result = await self._request("GET", f"/accounts/{self.config.account_id}")

            account = result.get("account", {})

            return AccountInfo(
                account_id=account.get("id", ""),
                balance=Decimal(account.get("balance", 0)),
                equity=Decimal(account.get("equity", 0)),
                margin_used=Decimal(account.get("marginUsed", 0)),
                margin_available=Decimal(account.get("marginAvailable", 0)),
                margin_ratio=Decimal(account.get("marginRatio", 0)),
                open_positions_count=len(account.get("openPositionCount", 0)),
                pending_orders_count=len(account.get("pendingOrderCount", 0)),
            )

        except httpx.HTTPError as e:
            logger.error(f"OANDA get account failed: {e}")
            raise

    async def get_current_price(self, instrument: str) -> tuple[Decimal, Decimal]:
        """Get current bid/ask price for an instrument."""
        try:
            result = await self._request(
                "GET",
                f"/accounts/{self.config.account_id}/pricing?instruments={instrument}",
            )

            prices = result.get("prices", [])
            if prices:
                price = prices[0]
                return (
                    Decimal(price.get("bids", [{}])[0].get("price", 0)),
                    Decimal(price.get("asks", [{}])[0].get("price", 0)),
                )

            return (Decimal(0), Decimal(0))

        except httpx.HTTPError as e:
            logger.error(f"OANDA get price failed: {e}")
            return (Decimal(0), Decimal(0))

    async def validate_credentials(self) -> bool:
        """Validate OANDA credentials by making a test API call."""
        try:
            await self._request("GET", f"/accounts/{self.config.account_id}")
            return True
        except httpx.HTTPError:
            return False

    async def close(self):
        """Clean up HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None
