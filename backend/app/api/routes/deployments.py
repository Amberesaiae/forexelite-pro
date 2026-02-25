"""
Deployment Routes
EA Deployments Management
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.core.auth import get_current_user, AuthenticatedUser
from app.core.supabase import get_supabase_client


router = APIRouter()


class Deployment(BaseModel):
    id: str
    ea_version_id: str
    broker_connection_id: str
    symbol: str
    timeframe: str
    status: str  # "deploying", "running", "stopping", "stopped", "error"
    magic_number: int


class CreateDeploymentRequest(BaseModel):
    ea_version_id: str
    broker_connection_id: str
    symbol: str
    timeframe: str
    magic_number: int = 12345


class DeploymentStatus(BaseModel):
    status: str


@router.get("", response_model=List[dict])
async def list_deployments(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> List[dict]:
    """List user's deployments."""
    supabase = get_supabase_client()

    # Join through ea_versions to get ea_projects.name (not ea_versions.name)
    response = (
        supabase.table("ea_deployments")
        .select(
            "*, ea_versions(ea_projects(name), version_number), broker_connections(name)"
        )
        .eq("user_id", current_user.id)
        .execute()
    )

    deployments = []
    for d in response.data:
        # ea_projects is nested inside ea_versions
        ea_versions_data = d.get("ea_versions", {})
        ea_projects_data = (
            ea_versions_data.get("ea_projects", {})
            if isinstance(ea_versions_data, dict)
            else {}
        )

        broker_data = d.get("broker_connections", {})

        deployments.append(
            {
                "id": d["id"],
                "ea_name": ea_projects_data.get("name", "Unknown"),
                "version": ea_versions_data.get("version_number", 1)
                if isinstance(ea_versions_data, dict)
                else 1,
                "symbol": d.get("symbol"),
                "timeframe": d.get("timeframe"),
                "status": d.get("status"),
                "magic_number": d.get("magic_number"),
                "broker": broker_data.get("name", "Unknown")
                if isinstance(broker_data, dict)
                else "Unknown",
            }
        )

    return deployments


@router.post("")
async def create_deployment(
    request: CreateDeploymentRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """Create a new deployment."""
    supabase = get_supabase_client()

    # Check version is compiled
    version_response = (
        supabase.table("ea_versions")
        .select("status")
        .eq("id", request.ea_version_id)
        .execute()
    )

    if not version_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Version not found",
        )

    if version_response.data[0]["status"] != "compiled":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="ea_not_compiled",
        )

    # Create deployment
    deployment_data = {
        "user_id": current_user.id,
        "ea_version_id": request.ea_version_id,
        "broker_connection_id": request.broker_connection_id,
        "symbol": request.symbol,
        "timeframe": request.timeframe,
        "magic_number": request.magic_number,
        "status": "deploying",
    }

    deployment_response = (
        supabase.table("ea_deployments").insert(deployment_data).execute()
    )

    if not deployment_response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create deployment",
        )

    deployment_id = deployment_response.data[0]["id"]

    # Create deploy job
    job_response = (
        supabase.table("jobs")
        .insert(
            {
                "user_id": current_user.id,
                "job_type": "deploy",
                "input_data": {
                    "deployment_id": deployment_id,
                    "symbol": request.symbol,
                    "timeframe": request.timeframe,
                },
                "status": "pending",
            }
        )
        .execute()
    )

    return {
        "deployment_id": deployment_id,
        "job_id": job_response.data[0]["id"],
    }


@router.post("/{deployment_id}/run", response_model=DeploymentStatus)
async def run_deployment(
    deployment_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> DeploymentStatus:
    """Start a stopped deployment."""
    supabase = get_supabase_client()

    # Create run job
    supabase.table("jobs").insert(
        {
            "user_id": current_user.id,
            "job_type": "run",
            "input_data": {"deployment_id": deployment_id},
            "status": "pending",
        }
    ).execute()

    # Update status
    supabase.table("ea_deployments").update(
        {
            "status": "starting",
        }
    ).eq("id", deployment_id).execute()

    return DeploymentStatus(status="starting")


@router.post("/{deployment_id}/stop", response_model=DeploymentStatus)
async def stop_deployment(
    deployment_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> DeploymentStatus:
    """Stop a running deployment."""
    supabase = get_supabase_client()

    # Create stop job
    supabase.table("jobs").insert(
        {
            "user_id": current_user.id,
            "job_type": "stop",
            "input_data": {"deployment_id": deployment_id},
            "status": "pending",
        }
    ).execute()

    # Update status
    supabase.table("ea_deployments").update(
        {
            "status": "stopping",
        }
    ).eq("id", deployment_id).execute()

    return DeploymentStatus(status="stopping")


@router.get("/{deployment_id}/logs")
async def get_deployment_logs(
    deployment_id: str,
    limit: int = 100,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """Get deployment logs."""
    supabase = get_supabase_client()

    # Get jobs for this deployment (filtered by deployment_id in input_data)
    response = (
        supabase.table("jobs")
        .select(
            "id, job_type, status, output_data, error_message, created_at, completed_at, claimed_at"
        )
        .eq("user_id", current_user.id)
        .filter("input_data->>deployment_id", "eq", deployment_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )

    logs = []
    for job in response.data:
        logs.append(
            {
                "id": job["id"],
                "type": job.get("job_type"),
                "status": job.get("status"),
                "output": job.get("output_data"),
                "error": job.get("error_message"),
                "created_at": str(job.get("created_at")),
                "completed_at": str(job.get("completed_at"))
                if job.get("completed_at")
                else None,
                "claimed_at": str(job.get("claimed_at"))
                if job.get("claimed_at")
                else None,
            }
        )

    return {"logs": logs}
