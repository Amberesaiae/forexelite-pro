"""MT5 Agent management API routes."""

import logging
import secrets
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from supabase import create_client

from app.core.auth import get_current_user, AuthenticatedUser
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/agents", tags=["agents"])


class PairAgentRequest(BaseModel):
    """Agent pairing request."""

    agent_name: str
    terminal_server: str
    login: str
    password_encrypted: str


class PairAgentResponse(BaseModel):
    """Agent pairing response."""

    agent_id: str
    pairing_key: str
    message: str


class HeartbeatResponse(BaseModel):
    """Heartbeat response."""

    status: str
    last_seen_at: datetime


class JobResponse(BaseModel):
    """Job response for agent polling."""

    job_id: str
    job_type: str
    payload: dict
    signature: str


class JobResultRequest(BaseModel):
    """Job result submission request."""

    job_id: str
    status: str  # completed, failed
    result: Optional[dict] = None
    error_message: Optional[str] = None


@router.post("/pair")
async def pair_agent(
    data: PairAgentRequest, user: AuthenticatedUser = Depends(get_current_user)
) -> PairAgentResponse:
    """
    Pair a new MT5 agent with the user's account.

    Returns:
        Agent ID and pairing key
    """
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    # Generate pairing key
    pairing_key = secrets.token_urlsafe(32)

    # Create agent record
    result = (
        client.table("mt5_agents")
        .insert(
            {
                "user_id": user.id,
                "agent_name": data.agent_name,
                "terminal_server": data.terminal_server,
                "login": data.login,
                "password_encrypted": data.password_encrypted,
                "is_connected": False,
                "last_heartbeat": None,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        .execute()
    )

    agent_id = result.data[0]["id"]

    return PairAgentResponse(
        agent_id=agent_id,
        pairing_key=pairing_key,
        message="Agent paired successfully. Use the pairing key to connect.",
    )


@router.post("/{agent_id}/heartbeat")
async def heartbeat(
    agent_id: str, user: AuthenticatedUser = Depends(get_current_user)
) -> HeartbeatResponse:
    """
    Agent heartbeat endpoint.

    Updates the agent's last_seen_at timestamp.
    """
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    # Verify agent belongs to user
    result = (
        client.table("mt5_agents")
        .select("id")
        .eq("id", agent_id)
        .eq("user_id", user.id)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found"
        )

    # Update heartbeat
    now = datetime.now(timezone.utc)
    client.table("mt5_agents").update(
        {
            "is_connected": True,
            "last_heartbeat": now.isoformat(),
            "updated_at": now.isoformat(),
        }
    ).eq("id", agent_id).execute()

    return HeartbeatResponse(status="ok", last_seen_at=now)


@router.get("/{agent_id}/jobs/next")
async def get_next_job(
    agent_id: str,
    pairing_key: str = Query(...),
    user: AuthenticatedUser = Depends(get_current_user),
) -> Optional[JobResponse]:
    """
    Agent polls for the next pending job.

    Returns:
        Next pending job or null if none
    """
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    # Verify agent belongs to user
    result = (
        client.table("mt5_agents")
        .select("id")
        .eq("id", agent_id)
        .eq("user_id", user.id)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found"
        )

    # Get next pending job
    job_result = (
        client.table("jobs")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", desc=False)
        .limit(1)
        .execute()
    )

    if not job_result.data:
        return None

    job = job_result.data[0]

    # Sign job payload
    import hmac
    import hashlib

    payload = job.get("input_data", {})
    signature = hmac.new(
        pairing_key.encode(), str(payload).encode(), hashlib.sha256
    ).hexdigest()

    return JobResponse(
        job_id=job["id"], job_type=job["job_type"], payload=payload, signature=signature
    )


@router.post("/{agent_id}/jobs/{job_id}/result")
async def submit_job_result(
    agent_id: str,
    job_id: str,
    result: JobResultRequest,
    user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """
    Agent submits job result.

    Updates the job status and stores the result.
    """
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    # Verify job belongs to user
    job_result = (
        client.table("jobs")
        .select("id, status")
        .eq("id", job_id)
        .eq("user_id", user.id)
        .execute()
    )

    if not job_result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )

    job = job_result.data[0]

    if job["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job is not in pending status",
        )

    # Update job with result
    now = datetime.now(timezone.utc)
    client.table("jobs").update(
        {
            "status": result.status,
            "output_data": result.result or {},
            "error_message": result.error_message,
            "completed_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }
    ).eq("id", job_id).execute()

    return {"message": "Job result submitted successfully"}


@router.get("/{agent_id}/status")
async def get_agent_status(
    agent_id: str, user: AuthenticatedUser = Depends(get_current_user)
) -> dict:
    """
    Get agent status including online/offline state.

    Returns:
        Agent status with last_seen_at timestamp
    """
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    # Get agent
    result = (
        client.table("mt5_agents")
        .select("*")
        .eq("id", agent_id)
        .eq("user_id", user.id)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found"
        )

    agent = result.data[0]

    # Check if agent is online (last_seen within 60 seconds)
    last_seen = agent.get("last_heartbeat")
    is_online = False

    if last_seen:
        last_seen_dt = datetime.fromisoformat(last_seen.replace("Z", "+00:00"))
        is_online = (datetime.now(timezone.utc) - last_seen_dt).total_seconds() < 60

    return {
        "agent_id": agent_id,
        "agent_name": agent.get("agent_name"),
        "is_online": is_online,
        "last_seen_at": last_seen,
        "status": "online" if is_online else "offline",
    }
