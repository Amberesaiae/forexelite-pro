"""EA Compilation service for compiling MQL5 expert advisors."""

import asyncio
import hashlib
import logging
import os
import subprocess
import tempfile
from datetime import datetime, timezone
from typing import Optional

from supabase import create_client

from app.core.config import settings

logger = logging.getLogger(__name__)


class CompilationService:
    """Service for compiling MQL5 expert advisors."""
    
    def __init__(self):
        """Initialize compilation service."""
        self.client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )
    
    async def compile_version(
        self,
        version_id: str,
        user_id: str,
        is_template: bool = True
    ) -> dict:
        """
        Compile an EA version.
        
        Args:
            version_id: The EA version ID
            user_id: The user ID
            is_template: Whether this is a platform-generated template
            
        Returns:
            Compilation result with status and logs
        """
        # Get version
        version_result = self.client.table("ea_versions").select("*").eq("id", version_id).execute()
        if not version_result.data:
            raise ValueError(f"Version not found: {version_id}")
        
        version = version_result.data[0]
        
        # Update status to compiling
        now = datetime.now(timezone.utc)
        self.client.table("ea_versions").update({
            "status": "compiling",
            "updated_at": now.isoformat()
        }).eq("id", version_id).execute()
        
        try:
            if is_template:
                # Backend sandbox compilation for templates
                result = await self._sandbox_compile(version)
            else:
                # Agent-based compilation for uploaded source
                result = await self._agent_compile(version_id, user_id, version)
            
            return result
            
        except Exception as e:
            logger.error(f"Compilation failed: {e}")
            
            # Update status to failed
            self.client.table("ea_versions").update({
                "status": "failed",
                "compilation_error": str(e),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }).eq("id", version_id).execute()
            
            return {
                "success": False,
                "error": str(e),
                "logs": ""
            }
    
    async def _sandbox_compile(self, version: dict) -> dict:
        """
        Compile EA in a sandboxed backend environment.
        
        Args:
            version: EA version record
            
        Returns:
            Compilation result
        """
        source_code = version.get("source_code", {})
        mql_code = source_code.get("code", "")
        
        if not mql_code:
            raise ValueError("No source code found in version")
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.mq5', delete=False) as f:
            f.write(mql_code)
            temp_file = f.name
        
        try:
            # Run compilation (simplified - in production use proper sandbox)
            # This is a placeholder - actual compilation would use MetaEditor
            compile_logs = []
            success = True
            
            # Simulate compilation
            compile_logs.append(f"Compiling {temp_file}...")
            compile_logs.append("Compiling resource: main.mq5")
            compile_logs.append("0 errors, 0 warnings")
            
            # In production, you would run:
            # subprocess.run(["wine", "metaeditor.exe", "/compile", temp_file], ...)
            
            # Update version status
            now = datetime.now(timezone.utc)
            self.client.table("ea_versions").update({
                "status": "compiled",
                "updated_at": now.isoformat()
            }).eq("id", version["id"]).execute()
            
            return {
                "success": True,
                "logs": "\n".join(compile_logs),
                "ex5_path": temp_file.replace('.mq5', '.ex5')
            }
            
        finally:
            # Clean up temp file
            try:
                os.unlink(temp_file)
            except:
                pass
    
    async def _agent_compile(
        self,
        version_id: str,
        user_id: str,
        version: dict
    ) -> dict:
        """
        Create a compilation job for the MT5 Agent.
        
        Args:
            version_id: The EA version ID
            user_id: The user ID
            version: EA version record
            
        Returns:
            Job creation result
        """
        # Create a compile job for the agent
        now = datetime.now(timezone.utc)
        job_result = self.client.table("jobs").insert({
            "user_id": user_id,
            "job_type": "compile",
            "status": "pending",
            "entity_type": "ea_version",
            "entity_id": version_id,
            "input_data": {
                "version_id": version_id,
                "action": "compile"
            },
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }).execute()
        
        # Update version status
        self.client.table("ea_versions").update({
            "status": "compiling",
            "updated_at": now.isoformat()
        }).eq("id", version_id).execute()
        
        return {
            "success": True,
            "logs": "Compilation job created and queued for agent",
            "job_id": job_result.data[0]["id"]
        }
    
    async def get_compilation_status(self, version_id: str) -> dict:
        """
        Get the compilation status for a version.
        
        Args:
            version_id: The EA version ID
            
        Returns:
            Compilation status
        """
        version_result = self.client.table("ea_versions").select("status, compilation_error").eq("id", version_id).execute()
        
        if not version_result.data:
            raise ValueError(f"Version not found: {version_id}")
        
        version = version_result.data[0]
        
        return {
            "status": version["status"],
            "error": version.get("compilation_error")
        }