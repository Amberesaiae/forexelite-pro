"""Deployment API routes for EA compile/deploy/run."""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from supabase import create_client

from app.core.auth import get_current_user, AuthenticatedUser
from app.core.config import settings
from app.services.compilation import CompilationService
from app.services.deployment import DeploymentService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ea", tags=["deployment"])


class CompileRequest(BaseModel):
    """Compile request."""
    version_id: str


class CompileResponse(BaseModel):
    """Compile response."""
    success: bool
    job_id: Optional[str] = None
    logs: Optional[str] = None
    error: Optional[str] = None


class DeployRequest(BaseModel):
    """Deploy request."""
    version_id: str
    agent_id: str
    runtime_config: Optional[dict] = None


class DeployResponse(BaseModel):
    """Deploy response."""
    deployment_id: str
    job_id: str
    status: str


class RunStopResponse(BaseModel):
    """Run/stop response."""
    job_id: str
    status: str


class DeploymentStatusResponse(BaseModel):
    """Deployment status response."""
    deployment_id: str
    status: str
    agent_status: dict
    deployed_at: Optional[str]
    stopped_at: Optional[str]
    error_message: Optional[str]


@router.post("/versions/{version_id}/compile")
async def compile_version(
    version_id: str,
    request: CompileRequest,
    user: AuthenticatedUser = Depends(get_current_user)
) -> CompileResponse:
    """
    Compile an EA version.
    
    Creates a compilation job (agent-based for uploaded source,
    sandbox for platform templates).
    """
    try:
        service = CompilationService()
        
        # Determine if this is a template or uploaded source
        client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )
        
        version_result = client.table("ea_versions").select("source_code").eq("id", version_id).execute()
        if not version_result.data:
            raise HTTPException(status_code=404, detail="Version not found")
        
        source_code = version_result.data[0].get("source_code", {})
        is_template = source_code.get("template") is not None
        
        result = await service.compile_version(version_id, user.id, is_template)
        
        return CompileResponse(
            success=result.get("success", False),
            job_id=result.get("job_id"),
            logs=result.get("logs"),
            error=result.get("error")
        )
        
    except Exception as e:
        logger.error(f"Compile failed: {e}")
        return CompileResponse(success=False, error=str(e))


@router.get("/versions/{version_id}/compile-status")
async def get_compile_status(
    version_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
) -> dict:
    """
    Get compilation status for a version.
    """
    service = CompilationService()
    return await service.get_compilation_status(version_id)


@router.post("/deployments")
async def deploy_version(
    request: DeployRequest,
    user: AuthenticatedUser = Depends(get_current_user)
) -> DeployResponse:
    """
    Deploy an EA version to an MT5 agent.
    """
    try:
        service = DeploymentService()
        result = await service.deploy_version(
            version_id=request.version_id,
            agent_id=request.agent_id,
            user_id=user.id,
            runtime_config=request.runtime_config
        )
        
        return DeployResponse(
            deployment_id=result["deployment_id"],
            job_id=result["job_id"],
            status=result["status"]
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Deploy failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/deployments/{deployment_id}/run")
async def run_deployment(
    deployment_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
) -> RunStopResponse:
    """
    Start running a deployed EA.
    """
    try:
        service = DeploymentService()
        result = await service.run_deployment(deployment_id, user.id)
        
        return RunStopResponse(
            job_id=result["job_id"],
            status=result["status"]
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Run failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/deployments/{deployment_id}/stop")
async def stop_deployment(
    deployment_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
) -> RunStopResponse:
    """
    Stop a running EA.
    """
    try:
        service = DeploymentService()
        result = await service.stop_deployment(deployment_id, user.id)
        
        return RunStopResponse(
            job_id=result["job_id"],
            status=result["status"]
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Stop failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/deployments/{deployment_id}/status")
async def get_deployment_status(
    deployment_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
) -> DeploymentStatusResponse:
    """
    Get deployment status including agent online state.
    """
    service = DeploymentService()
    result = await service.get_deployment_status(deployment_id)
    
    return DeploymentStatusResponse(**result)


@router.get("/deployments/{deployment_id}/logs")
async def get_deployment_logs(
    deployment_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
) -> list[dict]:
    """
    Get logs for a deployment.
    """
    service = DeploymentService()
    return await service.get_deployment_logs(deployment_id, user.id)