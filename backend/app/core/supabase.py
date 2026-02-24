"""
Supabase Client
Service role and anon key clients
"""
from typing import Optional
from supabase import create_client, Client
from app.core.config import get_settings


_supabase_service_client: Optional[Client] = None
_supabase_anon_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Get Supabase service role client for backend operations.
    Uses service role key which bypasses RLS.
    """
    global _supabase_service_client
    
    if _supabase_service_client is None:
        settings = get_settings()
        _supabase_service_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
        )
    
    return _supabase_service_client


def get_supabase_anon_client() -> Client:
    """
    Get Supabase anon key client for client-side operations.
    Respects RLS policies.
    """
    global _supabase_anon_client
    
    if _supabase_anon_client is None:
        settings = get_settings()
        _supabase_anon_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_ANON_KEY,
        )
    
    return _supabase_anon_client
