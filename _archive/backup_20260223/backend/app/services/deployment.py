"""EA Deployment service for deploying expert advisors to MT5 agents."""

import logging
from datetime import datetime, timezone
from typing import Optional

from supabase import create_client

from app.core.config import settings

logger = logging.getLogger(__name__)


class DeploymentService:
    """Service for deploying EA versions to MT5 agents."""
    
    def __init__(self):
        """Initialize deployment service."""
        self.client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )
    
    async def deploy_version(
        self,
        version_id: str,
        agent_id: str,
        user_id: str,
        runtime_config: Optional[dict] = None
    ) -> dict:
        """
        Deploy an EA version to an MT5 agent.
        
        Args:
            version_id: The EA version ID
            agent_id: The MT5 agent ID
            user_id: The user ID
            runtime_config: Optional runtime configuration
            
        Returns:
            Deployment result
        """
        # Get version
        version_result = self.client.table("ea_versions").select("*").eq("id", version_id).execute()
        if not version_result.data:
            raise ValueError(f"Version not found: {version_id}")
        
        version = version_result.data[0]
        
        if version["status"] != "compiled":
            raise ValueError(f"Version must be compiled before deployment. Current status: {version['status']}")
        
        # Verify agent belongs to user
        agent_result = self.client.table("mt5_agents").select("id").eq("id", agent_id).eq("user_id", user_id).execute()
        if not agent_result.data:
            raise ValueError(f"Agent not found: {agent_id}")
        
        # Create deployment record
        now = datetime.now(timezone.utc)
        deployment_result = self.client.table("ea_deployments").insert({
            "ea_version_id": version_id,
            "mt5_agent_id": agent_id,
            "status": "pending",
            "runtime_config": runtime_config or {},
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }).execute()
        
        deployment_id = deployment_result.data[0]["id"]
        
        # Create deploy job
        job_result = self.client.table("jobs").insert({
            "user_id": user_id,
            "job_type": "deploy",
            "status": "pending",
            "entity_type": "ea_deployment",
            "entity_id": deployment_id,
            "input_data": {
                "version_id": version_id,
                "agent_id": agent_id,
                "deployment_id": deployment_id,
                "action": "deploy"
            },
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }).execute()
        
        return {
            "deployment_id": deployment_id,
            "job_id": job_result.data[0]["id"],
            "status": "pending"
        }
    
    async def run_deployment(
        self,
        deployment_id: str,
        user_id: str
    ) -> dict:
        """
        Start running a deployed EA.
        
        Args:
            deployment_id: The deployment ID
            user_id: The user ID
            
        Returns:
            Run result
        """
        # Verify deployment belongs to user
        deployment_result = self.client.table("ea_deployments").select("*").eq("id", deployment_id).execute()
        if not deployment_result.data:
            raise ValueError(f"Deployment not found: {deployment_id}")
        
        deployment = deployment_result.data[0]
        
        if deployment["status"] not in ["deployed", "stopped"]:
            raise ValueError(f"Deployment must be deployed before running. Current status: {deployment['status']}")
        
        # Create run job
        now = datetime.now(timezone.utc)
        job_result = self.client.table("jobs").insert({
            "user_id": user_id,
            "job_type": "run",
            "status": "pending",
            "entity_type": "ea_deployment",
            "entity_id": deployment_id,
            "input_data": {
                "deployment_id": deployment_id,
                "action": "run"
            },
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }).execute()
        
        # Update deployment status
        self.client.table("ea_deployments").update({
            "status": "running",
            "updated_at": now.isoformat()
        }).eq("id", deployment_id).execute()
        
        return {
            "job_id": job_result.data[0]["id"],
            "status": "running"
        }
    
    async def stop_deployment(
        self,
        deployment_id: str,
        user_id: str
    ) -> dict:
        """
        Stop a running EA.
        
        Args:
            deployment_id: The deployment ID
            user_id: The user ID
            
        Returns:
            Stop result
        """
        # Verify deployment belongs to user
        deployment_result = self.client.table("ea_deployments").select("*").eq("id", deployment_id).execute()
        if not deployment_result.data:
            raise ValueError(f"Deployment not found: {deployment_id}")
        
        deployment = deployment_result.data[0]
        
        if deployment["status"] != "running":
            raise ValueError(f"Deployment must be running to stop. Current status: {deployment['status']}")
        
        # Create stop job
        now = datetime.now(timezone.utc)
        job_result = self.client.table("jobs").insert({
            "user_id": user_id,
            "job_type": "stop",
            "status": "pending",
            "entity_type": "ea_deployment",
            "entity_id": deployment_id,
            "input_data": {
                "deployment_id": deployment_id,
                "action": "stop"
            },
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }).execute()
        
        # Update deployment status
        self.client.table("ea_deployments").update({
            "status": "stopped",
            "stopped_at": now.isoformat(),
            "updated_at": now.isoformat()
        }).eq("id", deployment_id).execute()
        
        return {
            "job_id": job_result.data[0]["id"],
            "status": "stopped"
        }
    
    async def get_deployment_status(self, deployment_id: str) -> dict:
        """
        Get deployment status including agent online state.
        
        Args:
            deployment_id: The deployment ID
            
        Returns:
            Deployment status
        """
        deployment_result = self.client.table("ea_deployments").select("*").eq("id", deployment_id).execute()
        if not deployment_result.data:
            raise ValueError(f"Deployment not found: {deployment_id}")
        
        deployment = deployment_result.data[0]
        
        # Get agent status if available
        agent_status = {"is_online": False, "last_seen_at": None}
        
        if deployment.get("mt5_agent_id"):
            agent_result = self.client.table("mt5_agents").select("is_connected, last_heartbeat").eq("id", deployment["mt5_agent_id"]).execute()
            if agent_result.data:
                agent = agent_result.data[0]
                agent_status = {
                    "is_online": agent.get("is_connected", False),
                    "last_seen_at": agent.get("last_heartbeat")
                }
        
        return {
            "deployment_id": deployment_id,
            "status": deployment["status"],
            "agent_status": agent_status,
            "deployed_at": deployment.get("deployed_at"),
            "stopped_at": deployment.get("stopped_at"),
            "error_message": deployment.get("error_message")
        }
    
    async def get_deployment_logs(
        self,
        deployment_id: str,
        user_id: str
    ) -> list[dict]:
        """
        Get logs for a deployment.
        
        Args:
            deployment_id: The deployment ID
            user_id: The user ID
            
        Returns:
            List of log entries
        """
        # Get jobs for this deployment
        job_result = self.client.table("jobs").select("*").eq("user_id", user_id).eq("entity_id", deployment_id).order("created_at", desc=True).execute()
        
        logs = []
        for job in job_result.data or []:
            logs.append({
                "job_id": job["id"],
                "job_type": job["job_type"],
                "status": job["status"],
                "output_data": job.get("output_data", {}),
                "error_message": job.get("error_message"),
                "created_at": job["created_at"],
                "completed_at": job.get("completed_at")
            })
        
        return logs