"""Unit tests for broker adapters."""

import pytest
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

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
from app.brokers.oanda import OANDAAdapter


class TestBrokerAdapterAbstract:
    """Test that BrokerAdapter is properly abstract."""
    
    def test_cannot_instantiate_broker_adapter_directly(self):
        """BrokerAdapter should be abstract and not instantiable."""
        with pytest.raises(TypeError):
            BrokerAdapter()


class TestOANDAAdapter:
    """Test OANDA broker adapter."""
    
    @pytest.fixture
    def oanda_adapter(self):
        """Create a test OANDA adapter."""
        return OANDAAdapter(
            api_key="test_api_key",
            account_id="test_account_id",
            environment="practice"
        )
    
    @pytest.fixture
    def mock_response(self):
        """Create a mock API response."""
        return {
            "orderCreateTransaction": {
                "id": "test_order_123",
                "status": "FILLED",
                "price": "1.0850",
                "filledTime": "1700000000000"
            }
        }
    
    @pytest.mark.asyncio
    async def test_place_order_success(self, oanda_adapter, mock_response):
        """Test successful order placement."""
        with patch.object(oanda_adapter, '_request', new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            
            result = await oanda_adapter.place_order(
                instrument="EUR_USD",
                order_type=OrderType.MARKET,
                side=OrderSide.BUY,
                quantity=Decimal("1.0")
            )
            
            assert result.order_id == "test_order_123"
            assert result.status == "filled"
            assert result.filled_price == Decimal("1.0850")
    
    @pytest.mark.asyncio
    async def test_place_order_error(self, oanda_adapter):
        """Test order placement error handling."""
        with patch.object(oanda_adapter, '_request', new_callable=AsyncMock) as mock_request:
            import httpx
            mock_request.side_effect = httpx.HTTPError("API error")
            
            result = await oanda_adapter.place_order(
                instrument="EUR_USD",
                order_type=OrderType.MARKET,
                side=OrderSide.BUY,
                quantity=Decimal("1.0")
            )
            
            assert result.status == "rejected"
            assert result.error_message == "API error"
    
    @pytest.mark.asyncio
    async def test_get_positions(self, oanda_adapter):
        """Test getting open positions."""
        mock_response = {
            "positions": [
                {
                    "instrument": "EUR_USD",
                    "long": {
                        "tradeIDs": ["trade_1"],
                        "units": "10000",
                        "price": {"value": "1.0850"},
                        "unrealizedPL": "50.00"
                    },
                    "short": {"tradeIDs": [], "units": "0"}
                }
            ]
        }
        
        with patch.object(oanda_adapter, '_request', new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            
            positions = await oanda_adapter.get_positions()
            
            assert len(positions) == 1
            assert positions[0].position_id == "trade_1"
            assert positions[0].instrument == "EUR_USD"
            assert positions[0].side == OrderSide.BUY
            assert positions[0].quantity == Decimal("10000")
    
    @pytest.mark.asyncio
    async def test_get_account(self, oanda_adapter):
        """Test getting account information."""
        mock_response = {
            "account": {
                "id": "test_account_123",
                "balance": "100000.00",
                "equity": "98500.00",
                "marginUsed": "1500.00",
                "marginAvailable": "98500.00",
                "marginRatio": "5.5",
                "openPositionCount": 2,
                "pendingOrderCount": 1
            }
        }
        
        with patch.object(oanda_adapter, '_request', new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            
            account = await oanda_adapter.get_account()
            
            assert account.account_id == "test_account_123"
            assert account.balance == Decimal("100000.00")
            assert account.equity == Decimal("98500.00")
            assert account.margin_used == Decimal("1500.00")
            assert account.open_positions_count == 2
    
    @pytest.mark.asyncio
    async def test_get_current_price(self, oanda_adapter):
        """Test getting current price."""
        mock_response = {
            "prices": [
                {
                    "bids": [{"price": "1.0849"}],
                    "asks": [{"price": "1.0851"}]
                }
            ]
        }
        
        with patch.object(oanda_adapter, '_request', new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            
            bid, ask = await oanda_adapter.get_current_price("EUR_USD")
            
            assert bid == Decimal("1.0849")
            assert ask == Decimal("1.0851")
    
    @pytest.mark.asyncio
    async def test_validate_credentials_success(self, oanda_adapter):
        """Test credential validation success."""
        with patch.object(oanda_adapter, '_request', new_callable=AsyncMock) as mock_request:
            mock_request.return_value = {"account": {"id": "test"}}
            
            is_valid = await oanda_adapter.validate_credentials()
            
            assert is_valid is True
    
    @pytest.mark.asyncio
    async def test_validate_credentials_failure(self, oanda_adapter):
        """Test credential validation failure."""
        with patch.object(oanda_adapter, '_request', new_callable=AsyncMock) as mock_request:
            import httpx
            mock_request.side_effect = httpx.HTTPError("Invalid credentials")
            
            is_valid = await oanda_adapter.validate_credentials()
            
            assert is_valid is False
    
    def test_broker_type(self, oanda_adapter):
        """Test broker type property."""
        assert oanda_adapter.broker_type == BrokerType.OANDA
    
    def test_environment_practice(self, oanda_adapter):
        """Test practice environment URL."""
        assert oanda_adapter.base_url == "https://api-fxpractice.oanda.com/v3"
    
    def test_environment_live(self):
        """Test live environment URL."""
        adapter = OANDAAdapter(
            api_key="test",
            account_id="test",
            environment="live"
        )
        assert adapter.base_url == "https://api-fxtrade.oanda.com/v3"


class TestOrderModels:
    """Test Pydantic models for orders."""
    
    def test_order_result(self):
        """Test OrderResult model."""
        result = OrderResult(
            order_id="order_123",
            status="filled",
            filled_price=Decimal("1.0850")
        )
        
        assert result.order_id == "order_123"
        assert result.status == "filled"
        assert result.filled_price == Decimal("1.0850")
    
    def test_position(self):
        """Test Position model."""
        position = Position(
            position_id="trade_123",
            instrument="EUR_USD",
            side=OrderSide.BUY,
            quantity=Decimal("1.0"),
            entry_price=Decimal("1.0800"),
            current_price=Decimal("1.0850"),
            unrealized_pnl=Decimal("50.00")
        )
        
        assert position.position_id == "trade_123"
        assert position.side == OrderSide.BUY
        assert position.unrealized_pnl == Decimal("50.00")
    
    def test_account_info(self):
        """Test AccountInfo model."""
        account = AccountInfo(
            account_id="acc_123",
            balance=Decimal("100000.00"),
            equity=Decimal("98500.00"),
            margin_used=Decimal("1500.00"),
            margin_available=Decimal("97000.00"),
            margin_ratio=Decimal("65.67"),
            open_positions_count=2,
            pending_orders_count=1
        )
        
        assert account.balance == Decimal("100000.00")
        assert account.open_positions_count == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])