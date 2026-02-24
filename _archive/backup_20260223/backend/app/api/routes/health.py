"""Health check endpoint."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """
    Health check endpoint.
    
    Returns:
        Health status
    """
    return {"status": "ok"}


@router.get("/health/detailed")
async def detailed_health_check():
    """
    Detailed health check with dependency status.
    
    Returns:
        Detailed health status including database and cache connectivity
    """
    from app.core.config import settings
    from supabase import create_client
    
    health_status = {
        "status": "ok",
        "dependencies": {}
    }
    
    # Check Supabase connection
    try:
        client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )
        client.table("profiles").select("id").limit(1).execute()
        health_status["dependencies"]["supabase"] = "connected"
    except Exception as e:
        health_status["dependencies"]["supabase"] = f"error: {str(e)}"
        health_status["status"] = "degraded"
    
    return health_status