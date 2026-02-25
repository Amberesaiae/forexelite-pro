"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { useState } from "react";
import { Plus, X, Loader2, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Deployment {
  id: string;
  ea_name: string;
  ea_version: string;
  symbol: string;
  timeframe: string;
  magic_number: number;
  status: "running" | "stopped" | "error";
  broker_account_id: string;
  created_at: string;
}

interface AgentStatus {
  id: string;
  status: "healthy" | "unhealthy" | "starting";
  cpu_usage: number;
  memory_usage: number;
  last_heartbeat: string;
  active_deployments: number;
}

interface BrokerAccount {
  id: string;
  name: string;
  broker: string;
  account_number: string;
}

interface EAVersion {
  id: string;
  name: string;
  version: string;
}

function DeploymentLogsSheet({ deploymentId, open, onClose }: { deploymentId: string | null; open: boolean; onClose: () => void }) {
  const { data: logsData, isLoading } = useQuery({
    queryKey: ["deployment-logs", deploymentId],
    queryFn: () => apiGet<{ logs: string[] }>(`/api/v1/deployments/${deploymentId}/logs`),
    refetchInterval: open ? 3000 : false,
    enabled: !!deploymentId && open,
  });

  if (!open || !deploymentId) return null;

  const logs = logsData?.data?.logs || [];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg z-50 bg-[#090F1E] border-l border-[#131E32] p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-bold" style={{ color: "#EEF2FF" }}>Deployment Logs</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[#131E32]">
            <X className="w-5 h-5" style={{ color: "#8899BB" }} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#C9A84C" }} />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-[12px]" style={{ color: "#3F5070" }}>
            No logs available
          </div>
        ) : (
          <div className="space-y-2 font-mono text-[10px] p-3 rounded" style={{ backgroundColor: "#020509", border: "1px solid #131E32", maxHeight: "70vh", overflow: "auto" }}>
            {logs.map((log, i) => (
              <div key={i} style={{ color: "#8899BB" }}>{log}</div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function NewDeploymentDialog({ open, onClose, brokerAccounts, eaVersions }: { 
  open: boolean; 
  onClose: () => void; 
  brokerAccounts: BrokerAccount[];
  eaVersions: EAVersion[];
}) {
  const [eaVersionId, setEaVersionId] = useState("");
  const [brokerAccountId, setBrokerAccountId] = useState("");
  const [symbol, setSymbol] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [magicNumber, setMagicNumber] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const result = await apiPost("/api/v1/deployments", {
      ea_version_id: eaVersionId,
      broker_account_id: brokerAccountId,
      symbol,
      timeframe,
      magic_number: parseInt(magicNumber) || 0,
    });

    setSaving(false);
    
    if (result.error) {
      toast.error(result.error.detail || "Failed to create deployment");
    } else {
      toast.success("Deployment created successfully");
      setEaVersionId("");
      setBrokerAccountId("");
      setSymbol("");
      setTimeframe("");
      setMagicNumber("");
      onClose();
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-[#090F1E] border border-[#131E32] rounded-lg p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-bold" style={{ color: "#EEF2FF" }}>New Deployment</h2>
            <button onClick={onClose} className="p-1 rounded hover:bg-[#131E32]">
              <X className="w-5 h-5" style={{ color: "#8899BB" }} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-mono uppercase" style={{ color: "#8899BB" }}>EA Version</label>
              <select
                value={eaVersionId}
                onChange={(e) => setEaVersionId(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded bg-[#0C1525] border border-[#131E32] text-[12px] text-[#EEF2FF]"
                required
              >
                <option value="">Select EA</option>
                {eaVersions.map((ea) => (
                  <option key={ea.id} value={ea.id}>
                    {ea.name} v{ea.version}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase" style={{ color: "#8899BB" }}>Broker Account</label>
              <select
                value={brokerAccountId}
                onChange={(e) => setBrokerAccountId(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded bg-[#0C1525] border border-[#131E32] text-[12px] text-[#EEF2FF]"
                required
              >
                <option value="">Select account</option>
                {brokerAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} - {acc.broker} ({acc.account_number})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase" style={{ color: "#8899BB" }}>Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="e.g., EURUSD"
                className="w-full mt-1 px-3 py-2 rounded bg-[#0C1525] border border-[#131E32] text-[12px] text-[#EEF2FF] placeholder:text-[#3F5070]"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase" style={{ color: "#8899BB" }}>Timeframe</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded bg-[#0C1525] border border-[#131E32] text-[12px] text-[#EEF2FF]"
                required
              >
                <option value="">Select timeframe</option>
                <option value="M1">M1</option>
                <option value="M5">M5</option>
                <option value="M15">M15</option>
                <option value="M30">M30</option>
                <option value="H1">H1</option>
                <option value="H4">H4</option>
                <option value="D1">D1</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase" style={{ color: "#8899BB" }}>Magic Number</label>
              <input
                type="number"
                value={magicNumber}
                onChange={(e) => setMagicNumber(e.target.value)}
                placeholder="e.g., 123456"
                className="w-full mt-1 px-3 py-2 rounded bg-[#0C1525] border border-[#131E32] text-[12px] text-[#EEF2FF] placeholder:text-[#3F5070]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-3 py-2 text-[11px] font-mono rounded border"
                style={{ borderColor: "#131E32", color: "#8899BB" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-3 py-2 text-[11px] font-mono font-bold rounded"
                style={{ backgroundColor: "#C9A84C", color: "#040810" }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Create Deployment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function DeploymentsPage() {
  const [showNewDeployment, setShowNewDeployment] = useState(false);
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<string | null>(null);

  const { data: deploymentsData, isLoading: deploymentsLoading, refetch: refetchDeployments } = useQuery({
    queryKey: ["deployments"],
    queryFn: () => apiGet<{ deployments: Deployment[] }>("/api/v1/deployments"),
    refetchInterval: 10000,
  });

  const { data: brokersData } = useQuery({
    queryKey: ["brokers"],
    queryFn: () => apiGet<{ accounts: BrokerAccount[] }>("/api/v1/onboarding/brokers"),
  });

  const { data: eaVersionsData } = useQuery({
    queryKey: ["ea-versions"],
    queryFn: () => apiGet<{ versions: EAVersion[] }>("/api/v1/ea/versions"),
  });

  const { data: agentData } = useQuery({
    queryKey: ["agent-status"],
    queryFn: () => apiGet<{ agent: AgentStatus }>("/agents/status"),
  });

  const deployments = deploymentsData?.data?.deployments || [];
  const brokerAccounts = brokersData?.data?.accounts || [];
  const eaVersions = eaVersionsData?.data?.versions || [];
  const agent = agentData?.data?.agent;

  const running = deployments.filter(d => d.status === "running").length;
  const stopped = deployments.filter(d => d.status === "stopped").length;
  const errors = deployments.filter(d => d.status === "error").length;

  const handleRunStop = async (deploymentId: string, currentStatus: string) => {
    const action = currentStatus === "running" ? "stop" : "run";
    const result = await apiPost(`/api/v1/deployments/${deploymentId}/${action}`);
    if (!result.error) {
      refetchDeployments();
      toast.success(`Deployment ${action === "run" ? "started" : "stopped"}`);
    } else {
      toast.error(result.error.detail || "Failed to update deployment");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[26px] font-bold tracking-[2px]" style={{ color: "#EEF2FF", fontFamily: "Bebas Neue, sans-serif" }}>
            DEPLOYMENTS
          </h1>
          <p className="text-[12px] font-mono mt-1" style={{ color: "#8899BB" }}>
            MANAGE YOUR RUNNING EXPERT ADVISORS
          </p>
        </div>
        <button 
          onClick={() => setShowNewDeployment(true)}
          className="px-3 py-2 text-[11px] font-mono font-bold rounded flex items-center gap-2"
          style={{ backgroundColor: "#C9A84C", color: "#040810" }}
        >
          <Plus className="w-3 h-3" />
          + New Deployment
        </button>
      </div>

      <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="p-4 rounded-lg" style={{ backgroundColor: "#090F1E", border: "1px solid #131E32" }}>
          <div className="text-[10px] font-mono uppercase" style={{ color: "#3F5070" }}>Running</div>
          <div className="text-[24px] font-bold mt-1" style={{ color: "#00E5A0" }}>{running}</div>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: "#090F1E", border: "1px solid #131E32" }}>
          <div className="text-[10px] font-mono uppercase" style={{ color: "#3F5070" }}>Stopped</div>
          <div className="text-[24px] font-bold mt-1" style={{ color: "#8899BB" }}>{stopped}</div>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: "#090F1E", border: "1px solid #131E32" }}>
          <div className="text-[10px] font-mono uppercase" style={{ color: "#3F5070" }}>Errors</div>
          <div className="text-[24px] font-bold mt-1" style={{ color: "#FF4560" }}>{errors}</div>
        </div>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div>
          <div style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
            <div className="text-[10px] font-mono uppercase tracking-[1.5px] mb-3" style={{ color: "#3F5070" }}>
              Active Deployments
            </div>
            {deploymentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#C9A84C" }} />
              </div>
            ) : deployments.length === 0 ? (
              <div className="text-center py-8 text-[12px]" style={{ color: "#3F5070" }}>
                No deployments yet
              </div>
            ) : (
              deployments.map((deployment) => (
                <div
                  key={deployment.id}
                  className="flex items-center gap-3 p-3 rounded mb-2"
                  style={{ backgroundColor: "#0C1525", border: "1px solid #131E32" }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: deployment.status === "running" ? "#00E5A0" : deployment.status === "error" ? "#FF4560" : "#3F5070",
                      boxShadow: deployment.status === "running" ? "0 0 6px #00E5A0" : "none",
                      animation: deployment.status === "running" ? "pulse 2s infinite" : "none",
                    }}
                  />
                  <div className="flex-1">
                    <div className="text-[12px] font-semibold" style={{ color: "#EEF2FF" }}>
                      {deployment.ea_name} v{deployment.ea_version}
                    </div>
                    <div className="text-[9.5px] font-mono" style={{ color: "#3F5070" }}>
                      {deployment.symbol} • {deployment.timeframe} • Magic: {deployment.magic_number}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedDeploymentId(deployment.id)}
                      className="text-[9px] font-mono px-2 py-1 rounded border flex items-center gap-1"
                      style={{ borderColor: "#3D85FF", color: "#3D85FF" }}
                    >
                      <FileText className="w-3 h-3" /> Logs
                    </button>
                    {deployment.status === "running" ? (
                      <button
                        onClick={() => handleRunStop(deployment.id, "running")}
                        className="text-[9px] font-mono px-2 py-1 rounded border"
                        style={{ borderColor: "#FF4560", color: "#FF4560" }}
                      >
                        Stop
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRunStop(deployment.id, "stopped")}
                        className="text-[9px] font-mono px-2 py-1 rounded border"
                        style={{ borderColor: "#00E5A0", color: "#00E5A0" }}
                      >
                        Run
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
          <div className="text-[10px] font-mono uppercase tracking-[1.5px] mb-3" style={{ color: "#3F5070" }}>
            Agent Health
          </div>
          {agent ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ 
                    backgroundColor: agent.status === "healthy" ? "#00E5A0" : agent.status === "starting" ? "#C9A84C" : "#FF4560",
                    boxShadow: agent.status === "healthy" ? "0 0 6px #00E5A0" : "none",
                  }} 
                />
                <span className="text-[12px]" style={{ color: agent.status === "healthy" ? "#00E5A0" : agent.status === "starting" ? "#C9A84C" : "#FF4560" }}>
                  {agent.status === "healthy" ? "Healthy" : agent.status === "starting" ? "Starting" : "Unhealthy"}
                </span>
              </div>
              {[
                { label: "CPU Usage", value: `${agent.cpu_usage}%` },
                { label: "Memory Usage", value: `${agent.memory_usage}%` },
                { label: "Active Deployments", value: agent.active_deployments },
                { label: "Last Heartbeat", value: new Date(agent.last_heartbeat).toLocaleTimeString() },
              ].map((item, i) => (
                <div key={i} className="flex justify-between py-2" style={{ borderBottom: "1px solid #131E32" }}>
                  <span className="text-[11.5px]" style={{ color: "#8899BB" }}>{item.label}</span>
                  <span className="text-[12px] font-mono" style={{ color: "#EEF2FF" }}>{item.value}</span>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-8 text-[12px]" style={{ color: "#3F5070" }}>
              Agent status unavailable
            </div>
          )}

          <div className="text-[10px] font-mono uppercase tracking-[1.5px] mt-6 mb-3" style={{ color: "#3F5070" }}>
            MT5 Connection
          </div>
          {brokerAccounts.length > 0 ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-[#00E5A0]" style={{ boxShadow: "0 0 6px #00E5A0" }} />
                <span className="text-[12px]" style={{ color: "#00E5A0" }}>Connected</span>
              </div>
              {brokerAccounts.slice(0, 1).map((acc, i) => (
                <div key={i}>
                  {[
                    { label: "Account", value: acc.account_number },
                    { label: "Broker", value: acc.broker },
                    { label: "Status", value: "Online", color: "#00E5A0" },
                    { label: "Last Sync", value: "Just now" },
                  ].map((item, j) => (
                    <div key={j} className="flex justify-between py-2" style={{ borderBottom: "1px solid #131E32" }}>
                      <span className="text-[11.5px]" style={{ color: "#8899BB" }}>{item.label}</span>
                      <span className="text-[12px] font-mono" style={{ color: item.color || "#EEF2FF" }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              ))}
            </>
          ) : (
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4" style={{ color: "#C9A84C" }} />
              <span className="text-[12px]" style={{ color: "#C9A84C" }}>No broker connected</span>
            </div>
          )}
        </div>
      </div>

      <NewDeploymentDialog 
        open={showNewDeployment} 
        onClose={() => setShowNewDeployment(false)}
        brokerAccounts={brokerAccounts}
        eaVersions={eaVersions}
      />

      <DeploymentLogsSheet 
        deploymentId={selectedDeploymentId} 
        open={!!selectedDeploymentId} 
        onClose={() => setSelectedDeploymentId(null)} 
      />
    </DashboardLayout>
  );
}
