"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { PositionsTable } from "@/components/dashboard/trading/PositionsTable";
import { usePositionsStore, useAccountStore } from "@/stores";

export default function PositionsPage() {
  const { positions, closeAll } = usePositionsStore();
  const account = useAccountStore();

  const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0);
  const marginUtilization = (account.margin / account.balance) * 100;
  const floatingSwap = positions.reduce((sum, p) => sum + p.swap, 0);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[26px] font-bold tracking-[2px]" style={{ color: "#EEF2FF", fontFamily: "Bebas Neue, sans-serif" }}>
            POSITIONS
          </h1>
          <p className="text-[12px] font-mono mt-1" style={{ color: "#8899BB" }}>
            LIVE P&L — UPDATES EVERY SECOND
          </p>
        </div>
        {positions.length > 0 && (
          <button
            onClick={closeAll}
            className="px-4 py-2 text-[11px] font-mono font-bold rounded transition-colors"
            style={{ backgroundColor: "#C9A84C", color: "#040810" }}
          >
            Close All
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <StatCard
          label="Total Open P&L"
          value={totalPnL.toFixed(2)}
          change={`+${((totalPnL / account.balance) * 100).toFixed(2)}%`}
          changeType={totalPnL >= 0 ? "up" : "down"}
          accentColor="#00E5A0"
          unit="$"
          subtitle={`${positions.length} positions`}
        />
        <StatCard
          label="Margin Utilization"
          value={marginUtilization.toFixed(2)}
          accentColor="#3D85FF"
          unit="%"
          subtitle={`$${account.margin.toFixed(0)} / $${account.balance.toFixed(0)}`}
        />
        <StatCard
          label="Floating Swap"
          value={floatingSwap.toFixed(2)}
          accentColor="#FF4560"
          unit="$"
          subtitle="overnight holding cost"
        />
      </div>

      {/* Positions Table */}
      <div style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono uppercase tracking-[1.5px]" style={{ color: "#3F5070" }}>
            Open Positions
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono" style={{ color: "#C9A84C" }}>
              MT5 EXNESS DEMO
            </span>
            <span className="text-[10px] font-mono" style={{ color: "#3F5070" }}>
              Last sync: just now
            </span>
          </div>
        </div>
        <PositionsTable />
      </div>
    </DashboardLayout>
  );
}
