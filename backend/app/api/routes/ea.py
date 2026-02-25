"""
EA Routes
EA Projects, Versions, Generation, Compilation, Import
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel
from app.core.auth import get_current_user, AuthenticatedUser
from app.core.supabase import get_supabase_client
from app.services.ea_generator import generate_mql5


router = APIRouter()


class EAProject(BaseModel):
    id: str
    name: str
    user_id: str
    current_version_id: Optional[str]
    created_at: str


class EAVersion(BaseModel):
    id: str
    project_id: str
    version_number: int
    source_code: str
    status: str  # "draft", "compiling", "compiled", "failed"


class GenerateRequest(BaseModel):
    project_id: str
    description: str


class GenerateResponse(BaseModel):
    version_id: str
    version_number: int
    source_code: str


class CompileResponse(BaseModel):
    job_id: str


class ImportRequest(BaseModel):
    project_name: str


@router.get("/projects")
async def list_projects(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> List[dict]:
    """List user's EA projects."""
    supabase = get_supabase_client()

    response = (
        supabase.table("ea_projects")
        .select("*, ea_versions(count), ea_versions!inner(id, version_number, status)")
        .eq("user_id", current_user.id)
        .execute()
    )

    # Post-process to include projects with no versions
    projects = response.data if response.data else []
    for p in projects:
        if not p.get("ea_versions"):
            p["ea_versions"] = [{"count": 0}]


@router.post("/projects")
async def create_project(
    name: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """Create new EA project."""
    supabase = get_supabase_client()

    response = (
        supabase.table("ea_projects")
        .insert(
            {
                "user_id": current_user.id,
                "name": name,
            }
        )
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create project",
        )

    return response.data[0]


@router.post("/generate")
async def generate_ea(
    request: GenerateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> GenerateResponse:
    """Generate MQL5 code using GLM-5."""
    supabase = get_supabase_client()

    # Get project
    project_response = (
        supabase.table("ea_projects").select("*").eq("id", request.project_id).execute()
    )

    if not project_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    project = project_response.data[0]

    try:
        # Call GLM-5 service
        mql5_code = await generate_mql5(request.description, project["name"])

        # Get next version number
        versions_response = (
            supabase.table("ea_versions")
            .select("version_number")
            .eq("project_id", request.project_id)
            .order("version_number", desc=True)
            .limit(1)
            .execute()
        )

        next_version = 1
        if versions_response.data:
            next_version = versions_response.data[0]["version_number"] + 1

        # Create new version
        version_response = (
            supabase.table("ea_versions")
            .insert(
                {
                    "project_id": request.project_id,
                    "version_number": next_version,
                    "source_code": mql5_code,
                    "status": "draft",
                }
            )
            .execute()
        )

        version = version_response.data[0]

        # Update project's current version
        supabase.table("ea_projects").update(
            {
                "current_version_id": version["id"],
            }
        ).eq("id", request.project_id).execute()

        # Upload to Supabase Storage
        try:
            storage_path = f"ea-artifacts/{current_user.id}/{request.project_id}/v{next_version}.mq5"
            supabase.storage.from_("ea-artifacts").upload(
                path=storage_path,
                file=mql5_code.encode("utf-8"),
                file_options={"content-type": "text/plain"},
            )

            # Insert artifact record
            supabase.table("ea_artifacts").insert(
                {
                    "version_id": version["id"],
                    "artifact_type": "source",
                    "storage_path": storage_path,
                    "file_name": f"v{next_version}.mq5",
                }
            ).execute()
        except Exception as storage_err:
            # Non-fatal - log warning and continue
            import logging

            logging.getLogger(__name__).warning(f"Storage upload failed: {storage_err}")

        return GenerateResponse(
            version_id=version["id"],
            version_number=next_version,
            source_code=mql5_code,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"GLM-5 generation failed: {str(e)}",
        ) from e


@router.patch("/versions/{version_id}")
async def update_version(
    version_id: str,
    source_code: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """Update version source code (auto-save)."""
    supabase = get_supabase_client()

    supabase.table("ea_versions").update(
        {
            "source_code": source_code,
        }
    ).eq("id", version_id).execute()

    return {"updated": True}


@router.post("/versions/{version_id}/compile")
async def compile_version(
    version_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> CompileResponse:
    """Create compile job for version."""
    supabase = get_supabase_client()

    # Get version
    version_response = (
        supabase.table("ea_versions").select("*").eq("id", version_id).execute()
    )

    if not version_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Version not found",
        )

    # Create job
    job_response = (
        supabase.table("jobs")
        .insert(
            {
                "user_id": current_user.id,
                "job_type": "compile",
                "input_data": {
                    "version_id": version_id,
                    "storage_path": f"ea-projects/{current_user.id}/{version_id}",
                },
                "status": "pending",
            }
        )
        .execute()
    )

    # Update version status
    supabase.table("ea_versions").update(
        {
            "status": "compiling",
        }
    ).eq("id", version_id).execute()

    if not job_response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create compile job",
        )

    return CompileResponse(job_id=job_response.data[0]["id"])


@router.get("/versions/{version_id}")
async def get_version(
    version_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """Get version details."""
    supabase = get_supabase_client()

    response = supabase.table("ea_versions").select("*").eq("id", version_id).execute()

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Version not found",
        )

    return response.data[0]


@router.get("/versions/{version_id}/artifacts")
async def get_artifacts(
    version_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """Get version artifacts with signed URLs."""
    supabase = get_supabase_client()

    # Query artifacts for this version
    response = (
        supabase.table("ea_artifacts")
        .select("*")
        .eq("version_id", version_id)
        .execute()
    )

    artifacts = []
    for artifact in response.data:
        # Generate signed URL
        try:
            signed_url_response = supabase.storage.from_(
                "ea-artifacts"
            ).create_signed_url(path=artifact["storage_path"], expires_in=3600)
            # Extract signed URL from response (may vary by client version)
            download_url = signed_url_response.get(
                "signedURL"
            ) or signed_url_response.get("signed_url", "")
        except Exception:
            download_url = ""

        artifacts.append(
            {
                "id": artifact["id"],
                "artifact_type": artifact.get("artifact_type"),
                "file_name": artifact.get("file_name"),
                "storage_path": artifact.get("storage_path"),
                "download_url": download_url,
                "created_at": str(artifact.get("created_at")),
            }
        )

    return {"artifacts": artifacts}


@router.post("/projects/{project_id}/duplicate")
async def duplicate_project(
    project_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """Duplicate a project."""
    supabase = get_supabase_client()

    # Get original project
    original = supabase.table("ea_projects").select("*").eq("id", project_id).execute()

    if not original.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Create new project
    new_project = (
        supabase.table("ea_projects")
        .insert(
            {
                "user_id": current_user.id,
                "name": f"{original.data[0]['name']} (copy)",
            }
        )
        .execute()
    )

    # Copy latest version
    latest = (
        supabase.table("ea_versions")
        .select("*")
        .eq("project_id", project_id)
        .order("version_number", desc=True)
        .limit(1)
        .execute()
    )

    if latest.data:
        supabase.table("ea_versions").insert(
            {
                "project_id": new_project.data[0]["id"],
                "version_number": 1,
                "source_code": latest.data[0]["source_code"],
                "status": "draft",
            }
        ).execute()

    return {"new_project_id": new_project.data[0]["id"]}


@router.patch("/projects/{project_id}")
async def rename_project(
    project_id: str,
    name: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """Rename a project."""
    supabase = get_supabase_client()

    supabase.table("ea_projects").update(
        {
            "name": name,
        }
    ).eq("id", project_id).execute()

    return {"updated": True}


@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """Delete a project."""
    supabase = get_supabase_client()

    # Check for running deployments via ea_versions
    deployments = (
        supabase.table("ea_deployments")
        .select("id, ea_versions!inner(project_id)")
        .eq("ea_versions.project_id", project_id)
        .in_("status", ["running", "starting"])
        .execute()
    )

    if deployments.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="ea_running",
        )

    # Delete (cascade will handle versions)
    supabase.table("ea_projects").delete().eq("id", project_id).execute()

    return {"deleted": True}


@router.post("/import")
async def import_ea(
    file: UploadFile = File(...),
    project_name: str = Form(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """Import EA from .mq5 file."""
    # Read file content
    content = await file.read()
    source_code = content.decode("utf-8")

    supabase = get_supabase_client()

    # Create project
    project_response = (
        supabase.table("ea_projects")
        .insert(
            {
                "user_id": current_user.id,
                "name": project_name,
            }
        )
        .execute()
    )

    project_id = project_response.data[0]["id"]

    # Create version
    version_response = (
        supabase.table("ea_versions")
        .insert(
            {
                "project_id": project_id,
                "version_number": 1,
                "source_code": source_code,
                "status": "draft",
            }
        )
        .execute()
    )

    return {
        "project_id": project_id,
        "version_id": version_response.data[0]["id"],
    }
