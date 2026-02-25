"""
Agent Routes
MT5 Agent management and pairing
"""

import secrets
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from passlib.hash import bcrypt
from app.core.auth import get_current_user, AuthenticatedUser
from app.core.agent_auth import get_current_agent, AgentRecord
from app.core.supabase import get_supabase_client


router = APIRouter()


class PairAgentRequest(BaseModel):
    broker_connection_id: Optional[str] = None


class PairAgentResponse(BaseModel):
    agent_id: str
    pairing_key: str


class HeartbeatRequest(BaseModel):
    status: str
    metrics: dict


class PriceUpdateRequest(BaseModel):
    instrument: dict  # {"EURUSD": {"bid": 1.0845, "ask": 1.0847}}


class AgentStatus(BaseModel):
    agent_id: str
    is_connected: bool
    last_heartbeat: Optional[str]
    status: str  # "online", "degraded", "offline"
    metrics: Optional[dict] = None


class JobResponse(BaseModel):
    job_id: str
    no_jobs: Optional[bool] = None


class JobResultRequest(BaseModel):
    status: str  # "completed" or "failed"
    output_data: Optional[dict] = None
    error_message: Optional[str] = None


@router.post("/pair", response_model=PairAgentResponse)
async def pair_agent(
    request: PairAgentRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> PairAgentResponse:
    """Generate a new agent pairing key."""
    supabase = get_supabase_client()
    user_id = current_user.id

    # Generate raw pairing key
    raw_key = secrets.token_urlsafe(32)

    # Hash the key
    hashed_key = bcrypt.hash(raw_key)

    # Extract prefix (first 8 chars)
    prefix = raw_key[:8]

    # Insert agent record
    agent_data = {
        "user_id": user_id,
        "pairing_key_hash": hashed_key,
        "pairing_key_prefix": prefix,
        "is_connected": False,
        "broker_connection_id": request.broker_connection_id,
    }

    response = supabase.table("mt5_agents").insert(agent_data).execute()

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create agent",
        )

    return PairAgentResponse(
        agent_id=response.data[0]["id"],
        pairing_key=raw_key,  # Only returned once!
    )


@router.post("/{agent_id}/heartbeat")
async def heartbeat(
    agent_id: str,
    request: HeartbeatRequest,
    agent: AgentRecord = Depends(get_current_agent),
) -> dict:
    """Update agent heartbeat and status."""
    supabase = get_supabase_client()

    # Update agent status with proper timestamp
    supabase.table("mt5_agents").update(
        {
            "is_connected": True,
            "last_heartbeat": datetime.now(timezone.utc).isoformat(),
            "status": request.status,
        }
    ).eq("id", agent_id).execute()

    return {"acknowledged": True}


@router.get("/{agent_id}/jobs/next", response_model=JobResponse)
async def get_next_job(
    agent_id: str,
    agent: AgentRecord = Depends(get_current_agent),
) -> dict:
    """Atomic job claim - get next pending job."""
    supabase = get_supabase_client()

    # Use RPC for atomic claim with FOR UPDATE SKIP LOCKED
    response = supabase.rpc(
        "claim_next_job",
        {
            "p_agent_id": agent_id,
        },
    ).execute()

    # RPC returns a SETOF jobs (PostgreSQL) - may be list or single dict
    job = None
    if isinstance(response.data, list) and response.data:
        job = response.data[0]
    elif isinstance(response.data, dict):
        job = response.data

    if job and job.get("id"):
        return {
            "job_id": job["id"],
            "job_type": job.get("job_type"),
            "input_data": job.get("input_data"),
        }

    return {"no_jobs": True}


@router.post("/{agent_id}/jobs/{job_id}/result")
async def submit_job_result(
    agent_id: str,
    job_id: str,
    request: JobResultRequest,
    agent: AgentRecord = Depends(get_current_agent),
) -> dict:
    """Submit job execution result."""
    supabase = get_supabase_client()

    # Update job status
    supabase.table("jobs").update(
        {
            "status": request.status,
            "output_data": request.output_data,
            "error_message": request.error_message,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("id", job_id).execute()

    # Propagate result based on job_type
    job_response = (
        supabase.table("jobs").select("job_type, input_data").eq("id", job_id).execute()
    )

    if job_response.data:
        job_type = job_response.data[0].get("job_type")
        input_data = job_response.data[0].get("input_data", {})

        if job_type == "compile":
            version_id = input_data.get("version_id")
            if version_id:
                supabase.table("ea_versions").update(
                    {
                        "status": "compiled"
                        if request.status == "completed"
                        else "failed",
                    }
                ).eq("id", version_id).execute()

        elif job_type in ["deploy", "run", "stop"]:
            deployment_id = input_data.get("deployment_id")
            if deployment_id:
                status_map = {
                    "deploy": "running" if request.status == "completed" else "error",
                    "run": "running",
                    "stop": "stopped",
                }
                supabase.table("ea_deployments").update(
                    {
                        "status": status_map.get(job_type, "error"),
                    }
                ).eq("id", deployment_id).execute()

        elif job_type == "trade":
            signal_id = input_data.get("signal_id")
            if signal_id:
                supabase.table("tv_signals").update(
                    {
                        "status": "executed"
                        if request.status == "completed"
                        else "failed",
                        "fill_price": request.output_data.get("fill_price")
                        if request.output_data
                        else None,
                        "broker_order_id": request.output_data.get("order_id")
                        if request.output_data
                        else None,
                        "error_message": request.error_message,
                        "resolved_at": datetime.now(timezone.utc).isoformat(),
                    }
                ).eq("id", signal_id).execute()

    return {"acknowledged": True}


@router.post("/{agent_id}/prices")
async def update_prices(
    agent_id: str,
    request: PriceUpdateRequest,
    agent: AgentRecord = Depends(get_current_agent),
) -> dict:
    """Update price data from agent."""
    from app.core.redis import get_redis
    import json

    redis = await get_redis()
    count = 0

    for instrument, data in request.instrument.items():
        price_data = {
            "bid": data.get("bid"),
            "ask": data.get("ask"),
            "ts": datetime.now(timezone.utc).isoformat(),
        }

        # Store in Redis
        await redis.set(f"prices:{instrument}", json.dumps(price_data))
        await redis.publish(f"prices:{instrument}", json.dumps(price_data))
        count += 1

    return {"received": count}


@router.get("/{agent_id}/status", response_model=AgentStatus)
async def get_agent_status(
    agent_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AgentStatus:
    """Get agent connection status."""
    supabase = get_supabase_client()

    response = supabase.table("mt5_agents").select("*").eq("id", agent_id).execute()

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    agent = response.data[0]
    last_heartbeat = agent.get("last_heartbeat")

    # Determine status based on heartbeat
    agent_status = "offline"
    if last_heartbeat:
        # Parse timestamp
        if isinstance(last_heartbeat, str):
            last_hb = datetime.fromisoformat(last_heartbeat.replace("Z", "+00:00"))
        else:
            last_hb = last_heartbeat

        # Use timezone-aware datetime for comparison
        minutes_since = (datetime.now(timezone.utc) - last_hb).total_seconds() / 60

        if minutes_since < 6:
            agent_status = "online"
        elif minutes_since < 10:
            agent_status = "degraded"
        else:
            agent_status = "offline"

    return AgentStatus(
        agent_id=agent["id"],
        is_connected=agent.get("is_connected", False),
        last_heartbeat=str(last_heartbeat) if last_heartbeat else None,
        status=agent_status,
    )
