"""Abstract broker adapter interface."""

from abc import ABC, abstractmethod
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class OrderType(str, Enum):
    """Order type enumeration."""
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"


class OrderSide(str, Enum):
    """Order side enumeration."""
    BUY = "buy"
    SELL = "sell"


class PositionStatus(str, Enum):
    """Position status enumeration."""
    OPEN = "open"
    CLOSED = "closed"


class BrokerType(str, Enum):
    """Broker type enumeration."""
    OANDA = "OANDA"
    MT5_AGENT = "MT5_AGENT"
    METAAPI = "METAAPI"


class OrderResult(BaseModel):
    """Result of an order placement."""
    order_id: str
    status: str
    filled_price: Optional[Decimal] = None
    filled_at: Optional[datetime] = None
    error_message: Optional[str] = None


class CloseResult(BaseModel):
    """Result of a position close."""
    order_id: str
    status: str
    filled_price: Optional[Decimal] = None
    filled_at: Optional[datetime] = None
    profit_loss: Optional[Decimal] = None
    error_message: Optional[str] = None


class Position(BaseModel):
    """Open position information."""
    position_id: str
    instrument: str
    side: OrderSide
    quantity: Decimal
    entry_price: Decimal
    current_price: Optional[Decimal] = None
    unrealized_pnl: Optional[Decimal] = None
    margin_used: Optional[Decimal] = None
    open_at: Optional[datetime] = None


class AccountInfo(BaseModel):
    """Account information."""
    account_id: str
    balance: Decimal
    equity: Decimal
    margin_used: Decimal
    margin_available: Decimal
    margin_ratio: Decimal
    open_positions_count: int
    pending_orders_count: int


class BrokerAdapter(ABC):
    """
    Abstract base class for broker adapters.
    
    All broker implementations must inherit from this class
    and implement the required methods.
    """
    
    @property
    @abstractmethod
    def broker_type(self) -> BrokerType:
        """Return the broker type identifier."""
        pass
    
    @abstractmethod
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
        Place an order.
        
        Args:
            instrument: Trading instrument (e.g., "EUR_USD")
            order_type: Type of order (market, limit, stop)
            side: Buy or sell
            quantity: Number of units
            price: Limit price for limit orders
            sl_pips: Stop loss in pips
            tp_pips: Take profit in pips
            
        Returns:
            OrderResult with order status
        """
        pass
    
    @abstractmethod
    async def close_position(
        self,
        position_id: str,
        quantity: Optional[Decimal] = None,
        **kwargs
    ) -> CloseResult:
        """
        Close a position.
        
        Args:
            position_id: The position/trade ID to close
            quantity: Quantity to close (partial close), None for full close
            
        Returns:
            CloseResult with close status and P&L
        """
        pass
    
    @abstractmethod
    async def get_positions(self) -> list[Position]:
        """
        Get all open positions.
        
        Returns:
            List of open positions
        """
        pass
    
    @abstractmethod
    async def get_account(self) -> AccountInfo:
        """
        Get account information.
        
        Returns:
            AccountInfo with balance, equity, margin
        """
        pass
    
    @abstractmethod
    async def get_current_price(self, instrument: str) -> tuple[Decimal, Decimal]:
        """
        Get current bid/ask price for an instrument.
        
        Args:
            instrument: Trading instrument
            
        Returns:
            Tuple of (bid, ask) prices
        """
        pass
    
    async def validate_credentials(self) -> bool:
        """
        Validate broker credentials.
        
        Default implementation returns True.
        Override for brokers that support credential validation.
        
        Returns:
            True if credentials are valid
        """
        return True
    
    async def close(self):
        """Clean up resources. Override if needed."""
        pass