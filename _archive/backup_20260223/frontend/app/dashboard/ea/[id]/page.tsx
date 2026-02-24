'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface EAVersion {
  id: string;
  ea_project_id: string;
  version_number: number;
  status: string;
  compilation_error: string | null;
  created_at: string;
}

interface Deployment {
  id: string;
  ea_version_id: string;
  mt5_agent_id: string;
  status: string;
  agent_status: { is_online: boolean; last_seen_at: string | null };
  deployed_at: string | null;
  stopped_at: string | null;
}

interface LogEntry {
  job_id: string;
  job_type: string;
  status: string;
  output_data: any;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export default function EADetailPage() {
  const router = useRouter();
  const params = useParams();
  const versionId = params.id as string;
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState<EAVersion | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [compiling, setCompiling] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [agents, setAgents] = useState<any[]>([]);
  const [compileLogs, setCompileLogs] = useState<string>('');

  useEffect(() => {
    if (versionId) {
      fetchVersion();
      fetchDeployments();
      fetchAgents();
    }
  }, [versionId]);

  const fetchVersion = async () => {
    try {
      const { data } = await supabase
        .from('ea_versions')
        .select('*')
        .eq('id', versionId)
        .single();
      
      setVersion(data);
    } catch (error) {
      console.error('Failed to fetch version:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeployments = async () => {
    try {
      const { data } = await supabase
        .from('ea_deployments')
        .select('*')
        .eq('ea_version_id', versionId);
      
      setDeployments(data || []);
    } catch (error) {
      console.error('Failed to fetch deployments:', error);
    }
  };

  const fetchAgents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('mt5_agents')
        .select('id, agent_name, is_connected, last_heartbeat')
        .eq('user_id', user.id);
      
      setAgents(data || []);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const handleCompile = async () => {
    setCompiling(true);
    setCompileLogs('');
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/ea/versions/${versionId}/compile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ version_id: versionId }),
        }
      );
      
      const data = await response.json();
      
      if (data.logs) {
        setCompileLogs(data.logs);
      }
      
      if (data.success) {
        fetchVersion();
      }
    } catch (error) {
      console.error('Compile failed:', error);
      setCompileLogs('Error: Compilation failed');
    } finally {
      setCompiling(false);
    }
  };

  const handleDeploy = async () => {
    if (!selectedAgent) return;
    
    setDeploying(true);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/ea/deployments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            version_id: versionId,
            agent_id: selectedAgent,
          }),
        }
      );
      
      if (response.ok) {
        setShowDeployModal(false);
        fetchDeployments();
      }
    } catch (error) {
      console.error('Deploy failed:', error);
    } finally {
      setDeploying(false);
    }
  };

  const handleRun = async (deploymentId: string) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/ea/deployments/${deploymentId}/run`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      );
      
      fetchDeployments();
    } catch (error) {
      console.error('Run failed:', error);
    }
  };

  const handleStop = async (deploymentId: string) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/ea/deployments/${deploymentId}/stop`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      );
      
      fetchDeployments();
    } catch (error) {
      console.error('Stop failed:', error);
    }
  };

  const handleViewLogs = async (deploymentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/ea/deployments/${deploymentId}/logs`,
        {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      );
      
      const logsData = await response.json();
      setLogs(logsData);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-500/20 text-gray-400',
      compiling: 'bg-yellow-500/20 text-yellow-400',
      compiled: 'bg-green-500/20 text-green-400',
      failed: 'bg-red-500/20 text-red-400',
      pending: 'bg-blue-500/20 text-blue-400',
      deploying: 'bg-yellow-500/20 text-yellow-400',
      deployed: 'bg-blue-500/20 text-blue-400',
      running: 'bg-purple-500/20 text-purple-400',
      stopped: 'bg-gray-500/20 text-gray-400',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-500/20 text-gray-400'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#f5a623] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!version) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="text-[#9090a8]">Version not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="text-[#9090a8] hover:text-foreground transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">EA Version v{version.version_number}</h1>
            <p className="text-[#9090a8]">Compile, deploy, and manage your Expert Advisor</p>
          </div>
          {getStatusBadge(version.status)}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Compile section */}
          <div className="rounded-xl border border-[#2a2a4a] bg-[#16162a] p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Compilation</h2>
            
            <button
              onClick={handleCompile}
              disabled={compiling || version.status === 'compiled'}
              className="w-full rounded-xl bg-[#f5a623] py-3 text-sm font-semibold text-[#0f0f1a] hover:bg-[#e09612] transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {compiling ? 'Compiling...' : version.status === 'compiled' ? 'Already Compiled' : 'Compile EA'}
            </button>

            {compileLogs && (
              <div className="rounded-lg bg-[#0f0f1a] p-4 font-mono text-sm">
                <div className="text-xs text-[#9090a8] mb-2">Compile Output:</div>
                <pre className="text-[#22c55e] whitespace-pre-wrap">{compileLogs}</pre>
              </div>
            )}

            {version.status === 'failed' && version.compilation_error && (
              <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 p-4">
                <div className="text-xs text-[#9090a8] mb-2">Compilation Error:</div>
                <pre className="text-red-400 text-sm whitespace-pre-wrap">{version.compilation_error}</pre>
              </div>
            )}
          </div>

          {/* Deploy section */}
          <div className="rounded-xl border border-[#2a2a4a] bg-[#16162a] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Deployments</h2>
              <button
                onClick={() => setShowDeployModal(true)}
                disabled={version.status !== 'compiled' || agents.length === 0}
                className="rounded-lg bg-[#22c55e] px-4 py-2 text-sm font-semibold text-[#0f0f1a] hover:bg-[#16a34a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Deploy
              </button>
            </div>

            {deployments.length === 0 ? (
              <div className="text-center py-8 text-[#9090a8]">
                No deployments yet. Compile your EA first, then deploy to an agent.
              </div>
            ) : (
              <div className="space-y-3">
                {deployments.map(deployment => (
                  <div key={deployment.id} className="rounded-lg bg-[#1e1e3f] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(deployment.status)}
                        <span className={`w-2 h-2 rounded-full ${deployment.agent_status?.is_online ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`} />
                        <span className="text-xs text-[#9090a8]">
                          {deployment.agent_status?.is_online ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {deployment.status === 'deployed' && (
                          <button
                            onClick={() => handleRun(deployment.id)}
                            className="text-xs text-[#22c55e] hover:text-[#16a34a] transition-colors"
                          >
                            Run
                          </button>
                        )}
                        {deployment.status === 'running' && (
                          <button
                            onClick={() => handleStop(deployment.id)}
                            className="text-xs text-[#ef4444] hover:text-[#dc2626] transition-colors"
                          >
                            Stop
                          </button>
                        )}
                        <button
                          onClick={() => handleViewLogs(deployment.id)}
                          className="text-xs text-[#9090a8] hover:text-foreground transition-colors"
                        >
                          Logs
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-[#9090a8]">
                      Deployed: {deployment.deployed_at ? new Date(deployment.deployed_at).toLocaleString() : 'Pending'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Logs section */}
        {logs.length > 0 && (
          <div className="mt-6 rounded-xl border border-[#2a2a4a] bg-[#16162a] p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Deployment Logs</h2>
            <div className="rounded-lg bg-[#0f0f1a] p-4 font-mono text-sm max-h-64 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-2 pb-2 border-b border-[#2a2a4a] last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#f5a623]">{log.job_type.toUpperCase()}</span>
                    <span className="text-[#9090a8]">{new Date(log.created_at).toLocaleString()}</span>
                    {getStatusBadge(log.status)}
                  </div>
                  {log.error_message && (
                    <div className="text-red-400 text-xs">{log.error_message}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deploy Modal */}
        {showDeployModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="rounded-xl border border-[#2a2a4a] bg-[#16162a] p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-foreground mb-4">Deploy to Agent</h2>
              
              <div className="mb-4">
                <label className="block text-sm text-[#9090a8] mb-2">Select Agent</label>
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full rounded-lg border border-[#2a2a4a] bg-[#0f0f1a] px-4 py-3 text-foreground focus:border-[#f5a623] focus:outline-none"
                >
                  <option value="">Choose an agent...</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.agent_name} ({agent.is_connected ? 'Online' : 'Offline'})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeployModal(false)}
                  className="rounded-lg border border-[#2a2a4a] bg-[#1e1e3f] px-4 py-2 text-foreground hover:bg-[#2a2a4a] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeploy}
                  disabled={!selectedAgent || deploying}
                  className="rounded-lg bg-[#22c55e] px-4 py-2 text-sm font-semibold text-[#0f0f1a] hover:bg-[#16a34a] transition-all disabled:opacity-50"
                >
                  {deploying ? 'Deploying...' : 'Deploy'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}