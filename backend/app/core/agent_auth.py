"""
MT5 Agent Authentication
Verifies agent pairing keys via X-Agent-Key header
"""
from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from pydantic import BaseModel
from app.core.config import get_settings
from app.core.supabase import get_supabase_client


class AgentRecord(BaseModel):
    """MT5 Agent record."""
    id: str
    user_id: str
    pairing_key_hash: str
    pairing_key_prefix: str
    is_connected: bool


async def verify_agent_key(
    x_agent_key: str = Header(..., alias="X-Agent-Key"),
    agent_id: Optional[str] = None,
) -> AgentRecord:
    """
    Verify agent key from X-Agent-Key header.
    
    Looks up the agent by agent_id (if provided) and verifies the key
    using bcrypt hash comparison.
    """
    from passlib.hash import bcrypt
    
    supabase = get_supabase_client()
    settings = get_settings()
    
    # If agent_id provided, look up directly
    if agent_id:
        response = supabase.table("mt5_agents").select("*").eq("id", agent_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found",
            )
        
        agent = response.data[0]
        
        # Verify the key matches (support both raw key and hash for backward compat)
        stored_hash = agent.get("pairing_key_hash", "")
        
        # Try bcrypt verification first
        try:
            if bcrypt.verify(x_agent_key, stored_hash):
                return AgentRecord(**agent)
        except Exception:
            pass
        
        # Fallback: plain text comparison (temporary, remove after migration)
        if stored_hash == x_agent_key:
            return AgentRecord(**agent)
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid agent key",
        )
    
    # If no agent_id, we need to find the agent by key prefix
    # This is used for initial pairing - search all agents
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Agent ID required",
    )


async def get_current_agent(
    x_agent_key: str = Header(..., alias="X-Agent-Key"),
    x_agent_id: Optional[str] = Header(None, alias="X-Agent-Id"),
) -> AgentRecord:
    """FastAPI dependency to get current authenticated agent."""
    return await verify_agent_key(x_agent_key, x_agent_id)
