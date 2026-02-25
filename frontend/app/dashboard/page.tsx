"use client";

import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { EquityRing } from "@/components/dashboard/EquityRing";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { PositionsTable } from "@/components/dashboard/trading/PositionsTable";
import { SignalList } from "@/components/dashboard/SignalList";
import { apiGet } from "@/lib/api";
import { usePriceStore } from "@/stores";

interface Account {
  balance: number;
  equity: number;
  margin: number;
  free_margin: number;
  margin_level: number;
  leverage: number;
  broker: string;
  account_number: string;
  account_type: "Demo" | "Live";
  server: string;
}

interface Position {
  ticket: string;
  pair: string;
  side: "BUY" | "SELL";
  volume: number;
  open_price: number;
  current_price: number;
  sl: number;
  tp: number;
  pnl: number;
  swap: number;
  open_time: string;
}

interface Deployment {
  id: string;
  name: string;
  status: "running" | "paused" | "draft";
  pair: string;
}

interface AgentStatus {
  id: string;
  status: string;
  connected: boolean;
}

export default function DashboardPage() {
  const prices = usePriceStore((s) => s.prices);

  const { data: accountData } = useQuery<Account>({
    queryKey: ["account"],
    queryFn: async () => {
      const res = await apiGet<Account>("/api/v1/trading/account");
      if (res.error) throw new Error(res.error.detail);
      return res.data!;
    },
    refetchInterval: 30000,
  });

  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ["positions"],
    queryFn: async () => {
      const res = await apiGet<Position[]>("/api/v1/trading/positions");
      if (res.error) throw new Error(res.error.detail);
      return res.data || [];
    },
    refetchInterval: 10000,
  });

  const { data: deployments = [] } = useQuery<Deployment[]>({
    queryKey: ["deployments"],
    queryFn: async () => {
      const res = await apiGet<Deployment[]>("/api/v1/deployments");
      if (res.error) throw new Error(res.error.detail);
      return res.data || [];
    },
    refetchInterval: 30000,
  });

  const { data: agentStatus } = useQuery<AgentStatus>({
    queryKey: ["agent-status"],
    queryFn: async () => {
      const res = await apiGet<AgentStatus>("/api/v1/agents/default/status");
      if (res.error) throw new Error(res.error.detail);
      return res.data!;
    },
    refetchInterval: 30000,
  });

  const runningEAs = deployments.filter((d) => d.status === "running").slice(0, 3);

  const livePositions = positions.map((p) => ({
    ...p,
    currentPrice: prices[p.pair]?.bid || p.current_price,
  }));

  const totalPnL = livePositions.reduce((sum, p) => {
    const pipMultiplier = p.pair.includes("JPY") ? 100 : 10000;
    const priceDiff = p.side === "BUY"
      ? (prices[p.pair]?.bid || p.current_price) - p.open_price
      : p.open_price - (prices[p.pair]?.bid || p.current_price);
    return sum + Math.round(priceDiff * pipMultiplier * p.volume * 10) / 10;
  }, 0);

  const todayPnL = totalPnL;
  const winRate = 72;
  const dailyDrawdown = 1.2;

  const account = accountData || {
    balance: 10000,
    equity: 10043.20,
    margin: 108.43,
    free_margin: 9891.57,
    leverage: 500,
  };

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
          freeMargin={account.free_margin}
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
          {runningEAs.length > 0 ? (
            runningEAs.map((ea) => (
              <div key={ea.id} className="flex items-center gap-3 p-2.5 rounded mb-2" style={{ backgroundColor: "#0C1525" }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ea.status === "running" ? "#00E5A0" : "#C9A84C", boxShadow: ea.status === "running" ? "0 0 6px #00E5A0" : "none" }} />
                <div className="flex-1">
                  <div className="text-[12px] font-semibold" style={{ color: "#EEF2FF" }}>{ea.name}</div>
                  <div className="text-[9.5px] font-mono" style={{ color: "#3F5070" }}>{ea.pair}</div>
                </div>
                <button className="text-[9px] font-mono px-2 py-1 rounded border" style={{ borderColor: "#131E32", color: "#8899BB" }}>
                  Log
                </button>
              </div>
            ))
          ) : (
            <div className="text-[11px]" style={{ color: "#3F5070" }}>No running EAs</div>
          )}
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
