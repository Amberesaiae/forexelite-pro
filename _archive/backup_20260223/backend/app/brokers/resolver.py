"""Multi-tenant broker credential resolver."""

import logging
from typing import Optional

from fastapi import HTTPException, status, Depends
from supabase import create_client, Client

from app.core.config import settings
from app.core.auth import get_current_user, AuthenticatedUser
from app.brokers.base import BrokerAdapter, BrokerType
from app.brokers.oanda import OANDAAdapter
from app.brokers.mt5_agent import MT5AgentAdapter
from app.brokers.metaapi import MetaApiAdapter

logger = logging.getLogger(__name__)


class BrokerResolver:
    """Resolves broker connections to adapter instances."""
    
    def __init__(self):
        """Initialize Supabase client."""
        self._client: Optional[Client] = None
    
    def _get_client(self) -> Client:
        """Get or create Supabase client."""
        if self._client is None:
            self._client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_ROLE_KEY
            )
        return self._client
    
    async def get_broker_adapter(
        self,
        broker_connection_id: str,
        user_id: str
    ) -> BrokerAdapter:
        """
        Get a broker adapter for a specific connection.
        
        Args:
            broker_connection_id: The broker connection ID
            user_id: The authenticated user ID
            
        Returns:
            BrokerAdapter instance for the connection
            
        Raises:
            HTTPException: If connection not found or belongs to another user
        """
        client = self._get_client()
        
        # Fetch broker connection
        result = client.table("broker_connections").select("*").eq("id", broker_connection_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Broker connection not found"
            )
        
        connection = result.data[0]
        
        # Verify ownership
        if connection["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this broker connection"
            )
        
        # Check if connection is active
        if not connection.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Broker connection is not active"
            )
        
        # Create appropriate adapter
        credentials = connection.get("credentials", {})
        broker_type = connection["broker_type"]
        
        if broker_type == "OANDA":
            return OANDAAdapter(
                api_key=credentials.get("api_key", ""),
                account_id=credentials.get("account_id", ""),
                environment=credentials.get("environment", "practice")
            )
        
        elif broker_type == "MT5_AGENT":
            return MT5AgentAdapter(
                agent_id=connection["id"],
                credentials=credentials
            )
        
        elif broker_type == "METAAPI":
            return MetaApiAdapter(
                token=credentials.get("token", ""),
                account_id=credentials.get("account_id", "")
            )
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown broker type: {broker_type}"
            )
    
    async def get_user_connections(
        self,
        user_id: str,
        broker_type: Optional[BrokerType] = None
    ) -> list[dict]:
        """
        Get all broker connections for a user.
        
        Args:
            user_id: The user ID
            broker_type: Optional filter by broker type
            
        Returns:
            List of broker connection records
        """
        client = self._get_client()
        
        query = client.table("broker_connections").select("*").eq("user_id", user_id)
        
        if broker_type:
            query = query.eq("broker_type", broker_type.value)
        
        result = query.eq("is_active", True).execute()
        
        return result.data or []


# Global resolver instance
broker_resolver = BrokerResolver()


async def get_broker_adapter(
    broker_connection_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
) -> BrokerAdapter:
    """
    FastAPI dependency to get a broker adapter.
    
    Args:
        broker_connection_id: The broker connection ID from request
        user: Current authenticated user
        
    Returns:
        BrokerAdapter instance
    """
    return await broker_resolver.get_broker_adapter(broker_connection_id, user.id)


async def get_user_connections(
    user: AuthenticatedUser = Depends(get_current_user),
    broker_type: Optional[BrokerType] = None
) -> list[dict]:
    """
    FastAPI dependency to get user's broker connections.
    
    Args:
        user: Current authenticated user
        broker_type: Optional broker type filter
        
    Returns:
        List of broker connection records
    """
    return await broker_resolver.get_user_connections(user.id, broker_type)