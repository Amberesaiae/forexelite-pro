"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { EquityRing } from "@/components/dashboard/EquityRing";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { PositionsTable } from "@/components/dashboard/trading/PositionsTable";
import { SignalList } from "@/components/dashboard/SignalList";
import { useAccountStore, usePositionsStore } from "@/stores";

export default function DashboardPage() {
  const account = useAccountStore();
  const { positions } = usePositionsStore();

  const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0);
  const todayPnL = totalPnL;
  const winRate = 72;
  const dailyDrawdown = 1.2;

  return (
    <DashboardLayout>
      <div className="mb-5">
        <h1 className="text-[26px] font-bold tracking-[2px]" style={{ color: "#EEF2FF", fontFamily: "Bebas Neue, sans-serif" }}>
          OVERVIEW
        </h1>
        <p className="text-[12px] font-mono mt-1" style={{ color: "#8899BB" }}>
          MONDAY 23 FEB 2026 — LONDON SESSION OPEN
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <StatCard
          label="Total Equity"
          value={account.equity.toFixed(2)}
          change="+$43.20"
          changeType="up"
          accentColor="#C9A84C"
          unit="$"
          subtitle="+0.43% today"
        />
        <StatCard
          label="Open P&L"
          value={totalPnL.toFixed(2)}
          change={`${positions.length} positions`}
          changeType={totalPnL >= 0 ? "up" : "down"}
          accentColor="#00E5A0"
          unit="$"
          subtitle="live"
        />
        <StatCard
          label="Win Rate"
          value={winRate}
          change="+3.1%"
          changeType="up"
          accentColor="#3D85FF"
          unit="%"
          subtitle="vs last week"
        />
        <StatCard
          label="Daily Drawdown"
          value={dailyDrawdown}
          change="3% limit"
          changeType="down"
          accentColor="#FF4560"
          unit="%"
          subtitle="safe"
        />
      </div>

      {/* Main Grid */}
      <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: "3fr 1fr" }}>
        <PriceChart symbol="EURUSD" timeframe="H1" />
        <EquityRing
          balance={account.balance}
          equity={account.equity}
          marginUsed={account.margin}
          freeMargin={account.freeMargin}
          leverage={account.leverage}
        />
      </div>

      {/* Positions + Signals */}
      <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <PositionsTable compact />
        <SignalList compact />
      </div>

      {/* EA Activity + Performance + Risk */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-[1.5px]" style={{ color: "#3F5070" }}>
              EA Activity
            </span>
            <span className="text-[10px] font-mono" style={{ color: "#C9A84C", cursor: "pointer" }}>
              Manage
            </span>
          </div>
          {[
            { name: "Scalping Bot v2", status: "running", pair: "EURUSD" },
            { name: "Trend Follower", status: "paused", pair: "GBPUSD" },
          ].map((ea, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded mb-2" style={{ backgroundColor: "#0C1525" }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ea.status === "running" ? "#00E5A0" : "#C9A84C", boxShadow: ea.status === "running" ? "0 0 6px #00E5A0" : "none" }} />
              <div className="flex-1">
                <div className="text-[12px] font-semibold" style={{ color: "#EEF2FF" }}>{ea.name}</div>
                <div className="text-[9.5px] font-mono" style={{ color: "#3F5070" }}>{ea.pair}</div>
              </div>
              <button className="text-[9px] font-mono px-2 py-1 rounded border" style={{ borderColor: "#131E32", color: "#8899BB" }}>
                Log
              </button>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
          <div className="text-[10px] font-mono uppercase tracking-[1.5px] mb-3" style={{ color: "#3F5070" }}>
            Performance (7D)
          </div>
          <div className="h-[130px] flex items-end justify-around gap-1">
            {[65, 80, 45, 90, 70, 85, 95].map((h, i) => (
              <div key={i} className="w-full rounded-t" style={{ height: `${h}%`, backgroundColor: i === 6 ? "#C9A84C" : "#131E32" }} />
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
          <div className="text-[10px] font-mono uppercase tracking-[1.5px] mb-3" style={{ color: "#3F5070" }}>
            Risk Metrics
          </div>
          {[
            { label: "Consecutive Losses", value: "0" },
            { label: "Max Drawdown (7D)", value: "-2.1%", color: "#FF4560" },
            { label: "Avg Risk/Trade", value: "0.95%" },
            { label: "Profit Factor", value: "2.41", color: "#00E5A0" },
            { label: "Sharpe Ratio", value: "1.87" },
          ].map((metric, i) => (
            <div key={i} className="flex justify-between py-2" style={{ borderBottom: i < 4 ? "1px solid #131E32" : "none" }}>
              <span className="text-[11.5px]" style={{ color: "#8899BB" }}>{metric.label}</span>
              <span className="text-[12px] font-mono font-medium" style={{ color: metric.color || "#EEF2FF" }}>
                {metric.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
