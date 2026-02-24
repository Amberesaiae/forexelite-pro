"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { SignalList } from "@/components/dashboard/SignalList";
import { EALibrary } from "@/components/dashboard/ea/EALibrary";
import { useSignalsStore } from "@/stores";

export default function SignalsPage() {
  const { signals } = useSignalsStore();

  const executedCount = signals.filter(s => s.status === "executed").length;
  const failedCount = signals.filter(s => s.status === "failed").length;
  const signalsToday = signals.length;
  const winRate = 68;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[26px] font-bold tracking-[2px]" style={{ color: "#EEF2FF", fontFamily: "Bebas Neue, sans-serif" }}>
            TV SIGNALS
          </h1>
          <p className="text-[12px] font-mono mt-1" style={{ color: "#8899BB" }}>
            TRADINGVIEW WEBHOOK AUTOMATION
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 text-[11px] font-mono rounded border" style={{ borderColor: "#131E32", color: "#8899BB" }}>
            Copy Webhook URL
          </button>
          <button className="px-3 py-2 text-[11px] font-mono font-bold rounded" style={{ backgroundColor: "#C9A84C", color: "#040810" }}>
            + Add Signal
          </button>
        </div>
      </div>

      {/* Stats */}
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
          value={3}
          accentColor="#3D85FF"
          subtitle="all running"
        />
      </div>

      {/* Signals + Strategies */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <SignalList />
        <div>
          <div style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }} className="mb-3">
            <div className="text-[10px] font-mono uppercase tracking-[1.5px] mb-3" style={{ color: "#3F5070" }}>
              Active Strategies
            </div>
            {[
              { name: "Trend-EMA", status: "running" },
              { name: "SMC-Liquidity", status: "running" },
              { name: "Gold-MA", status: "running" },
            ].map((strategy, i) => (
              <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid #131E32" }}>
                <span className="text-[12px]" style={{ color: "#EEF2FF" }}>{strategy.name}</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(0,229,160,0.1)", color: "#00E5A0" }}>
                  {strategy.status}
                </span>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
            <div className="text-[10px] font-mono uppercase tracking-[1.5px] mb-3" style={{ color: "#3F5070" }}>
              Webhook Endpoint
            </div>
            <div className="p-2.5 rounded font-mono text-[10.5px] break-all" style={{ backgroundColor: "#020509", border: "1px solid #131E32", color: "#8899BB" }}>
              https://api.forexelite.pro/api/v1/webhooks/tradingview?key=wh_live_<span style={{ color: "#C9A84C" }}>7f3a9c...</span>
            </div>
            <p className="text-[9.5px] font-mono mt-2" style={{ color: "#3F5070" }}>
              Paste this URL in your TradingView alert webhook field.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
