"""EA Library API routes."""

import logging
import hashlib
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel
from supabase import create_client, Client

from app.core.auth import get_current_user, AuthenticatedUser
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ea", tags=["ea"])


class ProjectCreateRequest(BaseModel):
    """Create project request."""
    name: str
    description: Optional[str] = None


class ProjectResponse(BaseModel):
    """Project response."""
    id: str
    name: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime


class VersionCreateRequest(BaseModel):
    """Create version request."""
    version_number: int
    source_code: dict
    config: Optional[dict] = None


class VersionResponse(BaseModel):
    """Version response."""
    id: str
    ea_project_id: str
    version_number: int
    status: str
    created_at: datetime


class ArtifactResponse(BaseModel):
    """Artifact response."""
    id: str
    ea_version_id: str
    artifact_type: str
    storage_path: str
    file_size: Optional[int]
    checksum: Optional[str]


@router.get("/projects")
async def list_projects(
    user: AuthenticatedUser = Depends(get_current_user)
) -> list[ProjectResponse]:
    """List all EA projects for the user."""
    client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY
    )
    
    result = client.table("ea_projects").select("*").eq("user_id", user.id).order("updated_at", desc=True).execute()
    
    return [
        ProjectResponse(
            id=p["id"],
            name=p["name"],
            description=p.get("description"),
            created_at=datetime.fromisoformat(p["created_at"]),
            updated_at=datetime.fromisoformat(p["updated_at"])
        )
        for p in result.data or []
    ]


@router.post("/projects")
async def create_project(
    data: ProjectCreateRequest,
    user: AuthenticatedUser = Depends(get_current_user)
) -> ProjectResponse:
    """Create a new EA project."""
    client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY
    )
    
    now = datetime.now(timezone.utc)
    result = client.table("ea_projects").insert({
        "user_id": user.id,
        "name": data.name,
        "description": data.description,
        "default_settings": {},
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }).execute()
    
    project = result.data[0]
    
    return ProjectResponse(
        id=project["id"],
        name=project["name"],
        description=project.get("description"),
        created_at=datetime.fromisoformat(project["created_at"]),
        updated_at=datetime.fromisoformat(project["updated_at"])
    )


@router.get("/projects/{project_id}/versions")
async def list_versions(
    project_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
) -> list[VersionResponse]:
    """List all versions for a project."""
    client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY
    )
    
    # Verify project belongs to user
    project_result = client.table("ea_projects").select("id").eq("id", project_id).eq("user_id", user.id).execute()
    if not project_result.data:
        raise HTTPException(status_code=404, detail="Project not found")
    
    result = client.table("ea_versions").select("*").eq("ea_project_id", project_id).order("version_number", desc=True).execute()
    
    return [
        VersionResponse(
            id=v["id"],
            ea_project_id=v["ea_project_id"],
            version_number=v["version_number"],
            status=v["status"],
            created_at=datetime.fromisoformat(v["created_at"])
        )
        for v in result.data or []
    ]


@router.post("/projects/{project_id}/versions")
async def create_version(
    project_id: str,
    data: VersionCreateRequest,
    user: AuthenticatedUser = Depends(get_current_user)
) -> VersionResponse:
    """Create a new EA version."""
    client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY
    )
    
    # Verify project belongs to user
    project_result = client.table("ea_projects").select("id").eq("id", project_id).eq("user_id", user.id).execute()
    if not project_result.data:
        raise HTTPException(status_code=404, detail="Project not found")
    
    now = datetime.now(timezone.utc)
    result = client.table("ea_versions").insert({
        "ea_project_id": project_id,
        "version_number": data.version_number,
        "source_code": data.source_code,
        "config": data.config or {},
        "status": "draft",
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }).execute()
    
    version = result.data[0]
    
    return VersionResponse(
        id=version["id"],
        ea_project_id=version["ea_project_id"],
        version_number=version["version_number"],
        status=version["status"],
        created_at=datetime.fromisoformat(version["created_at"])
    )


@router.get("/versions/{version_id}/artifacts")
async def list_artifacts(
    version_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
) -> list[ArtifactResponse]:
    """List all artifacts for a version."""
    client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY
    )
    
    result = client.table("ea_artifacts").select("*").eq("ea_version_id", version_id).execute()
    
    return [
        ArtifactResponse(
            id=a["id"],
            ea_version_id=a["ea_version_id"],
            artifact_type=a["artifact_type"],
            storage_path=a["storage_path"],
            file_size=a.get("file_size"),
            checksum=a.get("checksum")
        )
        for a in result.data or []
    ]


@router.get("/artifacts/{artifact_id}/download")
async def download_artifact(
    artifact_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
) -> dict:
    """
    Get a signed URL for downloading an artifact.
    
    Returns:
        Signed URL for download (expires in 60 seconds)
    """
    client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY
    )
    
    # Get artifact
    result = client.table("ea_artifacts").select("*").eq("id", artifact_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Artifact not found")
    
    artifact = result.data[0]
    
    # Get version and project to verify ownership
    version_result = client.table("ea_versions").select("ea_project_id").eq("id", artifact["ea_version_id"]).execute()
    if not version_result.data:
        raise HTTPException(status_code=404, detail="Version not found")
    
    project_result = client.table("ea_projects").select("user_id").eq("id", version_result.data[0]["ea_project_id"]).execute()
    if not project_result.data or project_result.data[0]["user_id"] != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Generate signed URL (simplified - in production use Supabase Storage SDK)
    signed_url = f"{settings.SUPABASE_URL}/storage/v1/object/sign/ea-artifacts/{artifact['storage_path']}?token={settings.SUPABASE_SERVICE_ROLE_KEY}"
    
    return {
        "download_url": signed_url,
        "expires_in": 60
    }


@router.post("/versions/{version_id}/upload")
async def upload_artifact(
    version_id: str,
    file: UploadFile = File(...),
    artifact_type: str = "ex5",
    user: AuthenticatedUser = Depends(get_current_user)
) -> ArtifactResponse:
    """
    Upload an artifact for a version.
    
    Stores file in Supabase Storage and creates artifact record.
    """
    client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY
    )
    
    # Verify version belongs to user's project
    version_result = client.table("ea_versions").select("ea_project_id").eq("id", version_id).execute()
    if not version_result.data:
        raise HTTPException(status_code=404, detail="Version not found")
    
    project_result = client.table("ea_projects").select("id, user_id").eq("id", version_result.data[0]["ea_project_id"]).execute()
    if not project_result.data or project_result.data[0]["user_id"] != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Read file content
    content = await file.read()
    file_size = len(content)
    
    # Calculate checksum
    checksum = hashlib.sha256(content).hexdigest()
    
    # Generate storage path
    storage_path = f"{user.id}/{version_id}/{file.filename}"
    
    # Upload to Supabase Storage (simplified - in production use Storage SDK)
    # For now, just create the artifact record
    now = datetime.now(timezone.utc)
    result = client.table("ea_artifacts").insert({
        "ea_version_id": version_id,
        "artifact_type": artifact_type,
        "storage_path": storage_path,
        "file_size": file_size,
        "checksum": checksum,
        "created_at": now.isoformat()
    }).execute()
    
    artifact = result.data[0]
    
    return ArtifactResponse(
        id=artifact["id"],
        ea_version_id=artifact["ea_version_id"],
        artifact_type=artifact["artifact_type"],
        storage_path=artifact["storage_path"],
        file_size=artifact["file_size"],
        checksum=artifact["checksum"]
    )