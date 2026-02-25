"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { PositionsTable } from "@/components/dashboard/trading/PositionsTable";
import { apiGet, apiDelete } from "@/lib/api";
import { usePriceStore } from "@/stores";

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

interface Account {
  balance: number;
  equity: number;
  margin: number;
  free_margin: number;
}

export default function PositionsPage() {
  const [showCloseConfirm, setShowCloseConfirm] = useState<string | null>(null);
  const [showCloseAllConfirm, setShowCloseAllConfirm] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  const queryClient = useQueryClient();
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

  const { data: positions = [], isLoading } = useQuery<Position[]>({
    queryKey: ["positions"],
    queryFn: async () => {
      const res = await apiGet<Position[]>("/api/v1/trading/positions");
      if (res.error) throw new Error(res.error.detail);
      return res.data || [];
    },
    refetchInterval: 10000,
  });

  const closeMutation = useMutation({
    mutationFn: async (ticket: string) => {
      const res = await apiDelete(`/api/v1/trading/positions/${ticket}`);
      if (res.error) throw new Error(res.error.detail);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["account"] });
      setShowCloseConfirm(null);
      setToast({ type: "success", message: "Position closed" });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error) => {
      setShowCloseConfirm(null);
      setToast({ type: "error", message: error.message });
      setTimeout(() => setToast(null), 3000);
    },
  });

  const closeAllMutation = useMutation({
    mutationFn: async () => {
      for (const pos of positions) {
        await apiDelete(`/api/v1/trading/positions/${pos.ticket}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["account"] });
      setShowCloseAllConfirm(false);
      setToast({ type: "success", message: "All positions closed" });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error) => {
      setShowCloseAllConfirm(false);
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      setToast({ type: "error", message: error.message });
      setTimeout(() => setToast(null), 3000);
    },
  });

  const handleClosePosition = useCallback((ticket: string) => {
    setShowCloseConfirm(ticket);
  }, []);

  const confirmClose = useCallback(() => {
    if (showCloseConfirm) {
      closeMutation.mutate(showCloseConfirm);
    }
  }, [showCloseConfirm, closeMutation]);

  const confirmCloseAll = useCallback(() => {
    closeAllMutation.mutate();
  }, [closeAllMutation]);

  const livePositions = positions.map((p) => {
    const currentPrice = prices[p.pair]?.bid || p.current_price;
    const pipMultiplier = p.pair.includes("JPY") ? 100 : 10000;
    const priceDiff = p.side === "BUY"
      ? currentPrice - p.open_price
      : p.open_price - currentPrice;
    const pnl = Math.round(priceDiff * pipMultiplier * p.volume * 10) / 10;
    return {
      ...p,
      currentPrice,
      pnl,
    };
  });

  const totalPnL = livePositions.reduce((sum, p) => sum + p.pnl, 0);
  const marginUtilization = accountData ? (accountData.margin / accountData.balance) * 100 : 0;
  const floatingSwap = positions.reduce((sum, p) => sum + p.swap, 0);

  const account = accountData || {
    balance: 10000,
    equity: 10043.20,
    margin: 108.43,
  };

  return (
    <DashboardLayout>
      {toast && (
        <div
          className="fixed top-16 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-[12px] font-mono font-bold"
          style={{
            backgroundColor: toast.type === "success" ? "#00E5A0" : "#FF4560",
            color: toast.type === "success" ? "#040810" : "white",
          }}
        >
          {toast.message}
        </div>
      )}

      {showCloseConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#090F1E] border border-[#131E32] rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-[14px] font-mono font-bold text-[#EEF2FF] mb-4">Confirm Close</h3>
            <p className="text-[12px] text-[#8899BB] mb-6">
              Close position #{showCloseConfirm}?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseConfirm(null)}
                className="flex-1 py-2 px-4 text-[11px] font-mono rounded border"
                style={{ borderColor: "#131E32", color: "#8899BB" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmClose}
                disabled={closeMutation.isPending}
                className="flex-1 py-2 px-4 text-[11px] font-mono font-bold rounded"
                style={{ backgroundColor: "#FF4560", color: "white", opacity: closeMutation.isPending ? 0.6 : 1 }}
              >
                {closeMutation.isPending ? "Closing..." : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCloseAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#090F1E] border border-[#131E32] rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-[14px] font-mono font-bold text-[#EEF2FF] mb-4">Confirm Close All</h3>
            <p className="text-[12px] text-[#8899BB] mb-6">
              Close all {positions.length} positions?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseAllConfirm(false)}
                className="flex-1 py-2 px-4 text-[11px] font-mono rounded border"
                style={{ borderColor: "#131E32", color: "#8899BB" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmCloseAll}
                disabled={closeAllMutation.isPending}
                className="flex-1 py-2 px-4 text-[11px] font-mono font-bold rounded"
                style={{ backgroundColor: "#FF4560", color: "white", opacity: closeAllMutation.isPending ? 0.6 : 1 }}
              >
                {closeAllMutation.isPending ? "Closing..." : "Close All"}
              </button>
            </div>
          </div>
        </div>
      )}

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
            onClick={() => setShowCloseAllConfirm(true)}
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
              {isLoading ? "Loading..." : "Last sync: just now"}
            </span>
          </div>
        </div>
        <PositionsTable
          positions={livePositions}
          onClosePosition={handleClosePosition}
        />
      </div>
    </DashboardLayout>
  );
}
