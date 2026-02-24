"""Artifact storage service for EA files."""

import hashlib
import logging
from datetime import datetime, timezone
from typing import Optional, BinaryIO

from supabase import create_client, Client

from app.core.config import settings

logger = logging.getLogger(__name__)


class ArtifactStorageService:
    """Service for managing EA artifacts in Supabase Storage."""
    
    def __init__(self):
        """Initialize storage service."""
        self._client: Optional[Client] = None
        self._bucket_name = "ea-artifacts"
    
    def _get_client(self) -> Client:
        """Get or create Supabase client."""
        if self._client is None:
            self._client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_ROLE_KEY
            )
        return self._client
    
    async def upload_artifact(
        self,
        user_id: str,
        version_id: str,
        file: BinaryIO,
        filename: str,
        artifact_type: str
    ) -> dict:
        """
        Upload an artifact file to Supabase Storage.
        
        Args:
            user_id: The user ID
            version_id: The EA version ID
            file: File-like object to upload
            filename: Original filename
            artifact_type: Type of artifact (ex4, ex5, log, config)
            
        Returns:
            Dict with artifact info including checksum
        """
        client = self._get_client()
        
        # Read file content
        content = file.read()
        file_size = len(content)
        
        # Calculate SHA-256 checksum
        checksum = hashlib.sha256(content).hexdigest()
        
        # Generate storage path
        storage_path = f"{user_id}/{version_id}/{filename}"
        
        try:
            # Upload to Supabase Storage
            client.storage.from_(self._bucket_name).upload(
                storage_path,
                content,
                {"content-type": self._get_content_type(filename)}
            )
            
            # Create artifact record
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
            
            return {
                "id": artifact["id"],
                "storage_path": storage_path,
                "file_size": file_size,
                "checksum": checksum,
                "artifact_type": artifact_type
            }
            
        except Exception as e:
            logger.error(f"Failed to upload artifact: {e}")
            raise
    
    async def get_signed_download_url(
        self,
        artifact_id: str,
        user_id: str
    ) -> dict:
        """
        Get a signed URL for downloading an artifact.
        
        Args:
            artifact_id: The artifact ID
            user_id: The user ID requesting access
            
        Returns:
            Dict with signed URL and expiry
        """
        client = self._get_client()
        
        # Get artifact info
        result = client.table("ea_artifacts").select("*").eq("id", artifact_id).execute()
        if not result.data:
            raise ValueError(f"Artifact not found: {artifact_id}")
        
        artifact = result.data[0]
        
        # Verify ownership via version -> project -> user
        version_result = client.table("ea_versions").select("ea_project_id").eq("id", artifact["ea_version_id"]).execute()
        if not version_result.data:
            raise ValueError("Version not found")
        
        project_result = client.table("ea_projects").select("user_id").eq("id", version_result.data[0]["ea_project_id"]).execute()
        if not project_result.data or project_result.data[0]["user_id"] != user_id:
            raise PermissionError("Access denied to this artifact")
        
        # Generate signed URL (60 second expiry)
        try:
            signed_url = client.storage.from_(self._bucket_name).create_signed_url(
                artifact["storage_path"],
                60  # 60 seconds
            )
            
            return {
                "download_url": signed_url,
                "expires_in": 60,
                "artifact_id": artifact_id
            }
            
        except Exception as e:
            logger.error(f"Failed to generate signed URL: {e}")
            raise
    
    async def verify_checksum(self, artifact_id: str, expected_checksum: str) -> bool:
        """
        Verify artifact checksum.
        
        Args:
            artifact_id: The artifact ID
            expected_checksum: Expected SHA-256 checksum
            
        Returns:
            True if checksum matches
        """
        client = self._get_client()
        
        # Get stored checksum
        result = client.table("ea_artifacts").select("checksum").eq("id", artifact_id).execute()
        if not result.data:
            raise ValueError(f"Artifact not found: {artifact_id}")
        
        stored_checksum = result.data[0]["checksum"]
        
        return stored_checksum == expected_checksum
    
    async def delete_artifact(self, artifact_id: str, user_id: str) -> bool:
        """
        Delete an artifact.
        
        Args:
            artifact_id: The artifact ID
            user_id: The user ID requesting deletion
            
        Returns:
            True if deleted successfully
        """
        client = self._get_client()
        
        # Get artifact with ownership verification
        result = client.table("ea_artifacts").select("*").eq("id", artifact_id).execute()
        if not result.data:
            raise ValueError(f"Artifact not found: {artifact_id}")
        
        artifact = result.data[0]
        
        # Verify ownership
        version_result = client.table("ea_versions").select("ea_project_id").eq("id", artifact["ea_version_id"]).execute()
        if not version_result.data:
            raise ValueError("Version not found")
        
        project_result = client.table("ea_projects").select("user_id").eq("id", version_result.data[0]["ea_project_id"]).execute()
        if not project_result.data or project_result.data[0]["user_id"] != user_id:
            raise PermissionError("Access denied to this artifact")
        
        # Delete from storage
        try:
            client.storage.from_(self._bucket_name).remove([artifact["storage_path"]])
        except Exception as e:
            logger.warning(f"Failed to delete from storage: {e}")
        
        # Delete record
        client.table("ea_artifacts").delete().eq("id", artifact_id).execute()
        
        return True
    
    def _get_content_type(self, filename: str) -> str:
        """Get content type based on filename."""
        ext = filename.lower().split('.')[-1]
        
        content_types = {
            "mq5": "text/x-mql5",
            "ex5": "application/octet-stream",
            "ex4": "application/octet-stream",
            "zip": "application/zip",
            "json": "application/json",
            "log": "text/plain",
        }
        
        return content_types.get(ext, "application/octet-stream")
    
    async def list_version_artifacts(
        self,
        version_id: str,
        user_id: str
    ) -> list[dict]:
        """
        List all artifacts for a version.
        
        Args:
            version_id: The EA version ID
            user_id: The user ID
            
        Returns:
            List of artifact records
        """
        client = self._get_client()
        
        # Verify ownership
        version_result = client.table("ea_versions").select("ea_project_id").eq("id", version_id).execute()
        if not version_result.data:
            raise ValueError("Version not found")
        
        project_result = client.table("ea_projects").select("user_id").eq("id", version_result.data[0]["ea_project_id"]).execute()
        if not project_result.data or project_result.data[0]["user_id"] != user_id:
            raise PermissionError("Access denied")
        
        # Get artifacts
        result = client.table("ea_artifacts").select("*").eq("ea_version_id", version_id).execute()
        
        return result.data or []


# Global storage service instance
artifact_storage = ArtifactStorageService()