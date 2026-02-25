"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { useQuery } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { useState } from "react";
import { Copy, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Signal {
  id: string;
  pair: string;
  direction: "BUY" | "SELL";
  entry_min: number;
  entry_max: number;
  sl: number;
  tp: number;
  confidence: number;
  status: "executed" | "pending" | "failed";
  strategy_name: string;
  action: string;
  created_at: string;
}

interface Strategy {
  id: string;
  name: string;
  enabled: boolean;
  webhook_url: string;
  broker_account_id: string;
  risk_override: number | null;
  allowed_pairs: string[];
}

interface BrokerAccount {
  id: string;
  name: string;
  broker: string;
  account_number: string;
}

function SignalDetailSheet({ signal, open, onClose }: { signal: Signal | null; open: boolean; onClose: () => void }) {
  if (!signal || !open) return null;

  const isBuy = signal.direction === "BUY";

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-[#090F1E] border-l border-[#131E32] p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[18px] font-bold" style={{ color: "#EEF2FF" }}>Signal Details</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[#131E32]">
            <X className="w-5 h-5" style={{ color: "#8899BB" }} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg" style={{ backgroundColor: "#0C1525", border: "1px solid #131E32" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[24px] font-bold" style={{ color: "#EEF2FF" }}>{signal.pair}</span>
              <span
                className="text-[12px] font-bold px-3 py-1 rounded"
                style={{
                  backgroundColor: isBuy ? "rgba(0, 229, 160, 0.1)" : "rgba(255, 69, 96, 0.1)",
                  color: isBuy ? "#00E5A0" : "#FF4560",
                }}
              >
                {signal.direction}
              </span>
            </div>
            <div className="text-[12px] font-mono" style={{ color: "#8899BB" }}>
              Action: {signal.action}
            </div>
          </div>

          <div style={{ backgroundColor: "#0C1525", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
            <div className="text-[10px] font-mono uppercase tracking-[1.5px] mb-3" style={{ color: "#3F5070" }}>
              Entry Levels
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-[9.5px] font-mono uppercase" style={{ color: "#3F5070" }}>Entry Min</div>
                <div className="text-[14px] font-semibold" style={{ color: "#EEF2FF" }}>{signal.entry_min}</div>
              </div>
              <div>
                <div className="text-[9.5px] font-mono uppercase" style={{ color: "#3F5070" }}>Entry Max</div>
                <div className="text-[14px] font-semibold" style={{ color: "#EEF2FF" }}>{signal.entry_max}</div>
              </div>
              <div>
                <div className="text-[9.5px] font-mono uppercase" style={{ color: "#3F5070" }}>Confidence</div>
                <div className="text-[14px] font-semibold" style={{ color: "#C9A84C" }}>{signal.confidence}%</div>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: "#0C1525", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
            <div className="text-[10px] font-mono uppercase tracking-[1.5px] mb-3" style={{ color: "#3F5070" }}>
              Stop Loss & Take Profit
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[9.5px] font-mono uppercase" style={{ color: "#3F5070" }}>Stop Loss</div>
                <div className="text-[16px] font-bold" style={{ color: "#FF4560" }}>{signal.sl}</div>
              </div>
              <div>
                <div className="text-[9.5px] font-mono uppercase" style={{ color: "#3F5070" }}>Take Profit</div>
                <div className="text-[16px] font-bold" style={{ color: "#00E5A0" }}>{signal.tp}</div>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: "#0C1525", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
            <div className="text-[10px] font-mono uppercase tracking-[1.5px] mb-3" style={{ color: "#3F5070" }}>
              Metadata
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[11.5px]" style={{ color: "#8899BB" }}>Strategy</span>
                <span className="text-[12px]" style={{ color: "#EEF2FF" }}>{signal.strategy_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[11.5px]" style={{ color: "#8899BB" }}>Status</span>
                <span
                  className="text-[11px] font-mono px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: signal.status === "executed" ? "rgba(0,229,160,0.1)" : signal.status === "pending" ? "rgba(201,168,76,0.1)" : "rgba(255,69,96,0.1)",
                    color: signal.status === "executed" ? "#00E5A0" : signal.status === "pending" ? "#C9A84C" : "#FF4560",
                  }}
                >
                  {signal.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[11.5px]" style={{ color: "#8899BB" }}>Received</span>
                <span className="text-[12px] font-mono" style={{ color: "#EEF2FF" }}>
                  {new Date(signal.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function NewStrategyDialog({ open, onClose, brokerAccounts }: { open: boolean; onClose: () => void; brokerAccounts: BrokerAccount[] }) {
  const [name, setName] = useState("");
  const [brokerAccountId, setBrokerAccountId] = useState("");
  const [riskOverride, setRiskOverride] = useState("");
  const [allowedPairs, setAllowedPairs] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const result = await apiPost("/api/v1/strategies", {
      name,
      broker_account_id: brokerAccountId || null,
      risk_override: riskOverride ? parseFloat(riskOverride) : null,
      allowed_pairs: allowedPairs.split(",").map(p => p.trim()).filter(Boolean),
    });

    setSaving(false);
    
    if (result.error) {
      toast.error(result.error.detail || "Failed to create strategy");
    } else {
      toast.success("Strategy created successfully");
      setName("");
      setBrokerAccountId("");
      setRiskOverride("");
      setAllowedPairs("");
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
            <h2 className="text-[18px] font-bold" style={{ color: "#EEF2FF" }}>New Strategy</h2>
            <button onClick={onClose} className="p-1 rounded hover:bg-[#131E32]">
              <X className="w-5 h-5" style={{ color: "#8899BB" }} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-mono uppercase" style={{ color: "#8899BB" }}>Strategy Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Trend-EMA"
                className="w-full mt-1 px-3 py-2 rounded bg-[#0C1525] border border-[#131E32] text-[12px] text-[#EEF2FF] placeholder:text-[#3F5070]"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase" style={{ color: "#8899BB" }}>Broker Account</label>
              <select
                value={brokerAccountId}
                onChange={(e) => setBrokerAccountId(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded bg-[#0C1525] border border-[#131E32] text-[12px] text-[#EEF2FF]"
              >
                <option value="">Select account (optional)</option>
                {brokerAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} - {acc.broker} ({acc.account_number})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase" style={{ color: "#8899BB" }}>Risk Override %</label>
              <input
                type="number"
                step="0.1"
                value={riskOverride}
                onChange={(e) => setRiskOverride(e.target.value)}
                placeholder="e.g., 2.0"
                className="w-full mt-1 px-3 py-2 rounded bg-[#0C1525] border border-[#131E32] text-[12px] text-[#EEF2FF] placeholder:text-[#3F5070]"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase" style={{ color: "#8899BB" }}>Allowed Pairs</label>
              <input
                type="text"
                value={allowedPairs}
                onChange={(e) => setAllowedPairs(e.target.value)}
                placeholder="EURUSD, GBPUSD, XAUUSD"
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
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Create Strategy"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function SignalsPage() {
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [showNewStrategy, setShowNewStrategy] = useState(false);

  const { data: signalsData, isLoading: signalsLoading } = useQuery({
    queryKey: ["signals"],
    queryFn: () => apiGet<{ signals: Signal[] }>("/api/v1/signals?limit=50"),
    refetchInterval: 5000,
  });

  const { data: strategiesData, isLoading: strategiesLoading, refetch: refetchStrategies } = useQuery({
    queryKey: ["strategies"],
    queryFn: () => apiGet<{ strategies: Strategy[] }>("/api/v1/strategies"),
  });

  const { data: brokersData } = useQuery({
    queryKey: ["brokers"],
    queryFn: () => apiGet<{ accounts: BrokerAccount[] }>("/api/v1/onboarding/brokers"),
  });

  const signals = signalsData?.data?.signals || [];
  const strategies = strategiesData?.data?.strategies || [];
  const brokerAccounts = brokersData?.data?.accounts || [];

  const executedCount = signals.filter(s => s.status === "executed").length;
  const failedCount = signals.filter(s => s.status === "failed").length;
  const signalsToday = signals.length;
  const winRate = 68;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleToggleStrategy = async (strategyId: string, enabled: boolean) => {
    const result = await apiPost(`/api/v1/strategies/${strategyId}/toggle`, { enabled });
    if (!result.error) {
      refetchStrategies();
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[26pxpx] font-bold tracking-[2px]" style={{ color: "#EEF2FF", fontFamily: "Bebas Neue, sans-serif" }}>
            TV SIGNALS
          </h1>
          <p className="text-[12px] font-mono mt-1" style={{ color: "#8899BB" }}>
            TRADINGVIEW WEBHOOK AUTOMATION
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => copyToClipboard("https://api.forexelite.pro/api/v1/webhooks/tradingview")}
            className="px-3 py-2 text-[11px] font-mono rounded border flex items-center gap-2"
            style={{ borderColor: "#131E32", color: "#8899BB" }}
          >
            <Copy className="w-3 h-3" />
            Copy Webhook URL
          </button>
          <button 
            onClick={() => setShowNewStrategy(true)}
            className="px-3 py-2 text-[11px] font-mono font-bold rounded flex items-center gap-2"
            style={{ backgroundColor: "#C9A84C", color: "#040810" }}
          >
            <Plus className="w-3 h-3" />
            + New Strategy
          </button>
        </div>
      </div>

      <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <StatCard
          label="Signals Today"
          value={signalsToday}
          change={`${executedCount} executed`}
          changeType="up"
          accentColor="#00E5A0"
          subtitle={`${failedCount} failed`}
        />
        <StatCard
          label="Signal Win Rate"
          value={winRate}
          accentColor="#C9A84C"
          unit="%"
          subtitle="last 30 days"
        />
        <StatCard
          label="Active Strategies"
          value={strategies.filter(s => s.enabled).length}
          accentColor="#3D85FF"
          subtitle={strategies.length > 0 ? `${strategies.length} total` : "all running"}
        />
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div>
          <div style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
            <div className="text-[10px] font-mono uppercase tracking-[1.5px] mb-3" style={{ color: "#3F5070" }}>
              Recent TV Signals
            </div>
            {signalsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#C9A84C" }} />
              </div>
            ) : signals.length === 0 ? (
              <div className="text-center py-8 text-[12px]" style={{ color: "#3F5070" }}>
                No signals received yet
              </div>
            ) : (
              signals.slice(0, 10).map((signal) => {
                const isBuy = signal.direction === "BUY";
                return (
                  <div
                    key={signal.id}
                    onClick={() => setSelectedSignal(signal)}
                    className="flex items-center gap-3 p-3 rounded mb-2 cursor-pointer transition-colors hover:bg-[#0C1525]"
                    style={{ backgroundColor: "#0A1128", border: "1px solid rgba(19,30,50,0.6)" }}
                  >
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: isBuy ? "rgba(0, 229, 160, 0.1)" : "rgba(255, 69, 96, 0.1)" }}
                    >
                      <span className="text-[10px] font-bold" style={{ color: isBuy ? "#00E5A0" : "#FF4560" }}>
                        {signal.direction}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12px] font-semibold" style={{ color: "#EEF2FF" }}>
                          {signal.pair}
                        </span>
                        <span className="text-[10px]" style={{ color: "#3F5070" }}>
                          {signal.action}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px]" style={{ color: "#3F5070" }}>
                          {signal.strategy_name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className="inline-block text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: signal.status === "executed" ? "rgba(0,229,160,0.1)" : signal.status === "pending" ? "rgba(201,168,76,0.1)" : "rgba(255,69,96,0.1)",
                          color: signal.status === "executed" ? "#00E5A0" : signal.status === "pending" ? "#C9A84C" : "#FF4560",
                        }}
                      >
                        {signal.status}
                      </span>
                      <div className="text-[8px] font-mono mt-1" style={{ color: "#3F5070" }}>
                        {signal.confidence}%
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div>
          <div style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }} className="mb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-mono uppercase tracking-[1.5px]" style={{ color: "#3F5070" }}>
                Strategies
              </div>
              <button
                onClick={() => setShowNewStrategy(true)}
                className="text-[10px] font-mono flex items-center gap-1"
                style={{ color: "#C9A84C" }}
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            {strategiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#C9A84C" }} />
              </div>
            ) : strategies.length === 0 ? (
              <div className="text-center py-8 text-[12px]" style={{ color: "#3F5070" }}>
                No strategies configured
              </div>
            ) : (
              strategies.map((strategy) => (
                <div key={strategy.id} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid #131E32" }}>
                  <div>
                    <span className="text-[12px]" style={{ color: "#EEF2FF" }}>{strategy.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => copyToClipboard(strategy.webhook_url)}
                        className="text-[9px] font-mono flex items-center gap-1"
                        style={{ color: "#3D85FF" }}
                      >
                        <Copy className="w-3 h-3" /> Copy URL
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="text-[9px] font-mono px-2 py-0.5 rounded" 
                      style={{ 
                        backgroundColor: strategy.enabled ? "rgba(0,229,160,0.1)" : "rgba(63,80,112,0.2)", 
                        color: strategy.enabled ? "#00E5A0" : "#3F5070" 
                      }}
                    >
                      {strategy.enabled ? "running" : "disabled"}
                    </span>
                    <button
                      onClick={() => handleToggleStrategy(strategy.id, !strategy.enabled)}
                      className="text-[9px] font-mono px-2 py-0.5 rounded border"
                      style={{ 
                        borderColor: strategy.enabled ? "#FF4560" : "#00E5A0", 
                        color: strategy.enabled ? "#FF4560" : "#00E5A0" 
                      }}
                    >
                      {strategy.enabled ? "Disable" : "Enable"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
            <div className="text-[10px] font-mono uppercase tracking-[1.5px] mb-3" style={{ color: "#3F5070" }}>
              Webhook Endpoint
            </div>
            <div className="p-2.5 rounded font-mono text-[10.5px] break-all" style={{ backgroundColor: "#020509", border: "1px solid #131E32", color: "#8899BB" }}>
              https://api.forexelite.pro/api/v1/webhooks/tradingview?key=wh_live_<span style={{ color: "#C9A84C" }}>••••••</span>
            </div>
            <p className="text-[9.5px] font-mono mt-2" style={{ color: "#3F5070" }}>
              Paste this URL in your TradingView alert webhook field.
            </p>
          </div>
        </div>
      </div>

      <SignalDetailSheet 
        signal={selectedSignal} 
        open={!!selectedSignal} 
        onClose={() => setSelectedSignal(null)} 
      />

      <NewStrategyDialog 
        open={showNewStrategy} 
        onClose={() => setShowNewStrategy(false)}
        brokerAccounts={brokerAccounts}
      />
    </DashboardLayout>
  );
}
