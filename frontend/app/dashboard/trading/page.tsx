"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { OrderPanel } from "@/components/dashboard/trading/OrderPanel";
import { apiGet, apiPost } from "@/lib/api";
import { usePriceStore } from "@/stores";
import { Button } from "@/components/ui/button";

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface OrderRequest {
  side: "BUY" | "SELL";
  symbol: string;
  volume: number;
  sl_pips: number;
  tp_pips: number;
}

interface OrderResponse {
  status: "filled" | "pending" | "error";
  ticket?: string;
  fill_price?: number;
  detail?: string;
}

export default function TradingPage() {
  const [symbol, setSymbol] = useState("EURUSD");
  const [timeframe, setTimeframe] = useState("H1");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<OrderRequest | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);
  
  const queryClient = useQueryClient();
  const prices = usePriceStore((s) => s.prices);
  const currentTick = prices[symbol];

  const { data: candles = [], isLoading: candlesLoading } = useQuery<Candle[]>({
    queryKey: ["candles", symbol, timeframe],
    queryFn: async () => {
      const res = await apiGet<Candle[]>(`/api/v1/trading/candles/${symbol}?timeframe=${timeframe}&count=200`);
      if (res.error) throw new Error(res.error.detail);
      return res.data || [];
    },
    refetchInterval: 30000,
  });

  const orderMutation = useMutation<OrderResponse, Error, OrderRequest>({
    mutationFn: async (order) => {
      const res = await apiPost<OrderResponse>("/api/v1/trading/orders", order);
      if (res.error) {
        const errorDetail = res.error.detail || "Order failed";
        if (errorDetail.includes("offline")) {
          throw new Error("agent_offline");
        }
        throw new Error(errorDetail);
      }
      return res.data!;
    },
    onSuccess: (data) => {
      setShowConfirm(false);
      setPendingOrder(null);
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      
      if (data.status === "filled") {
        setToast({ type: "success", message: `Order filled at ${data.fill_price}` });
      } else if (data.status === "pending") {
        setToast({ type: "warning", message: "Order pending" });
      } else if (data.status === "error") {
        setToast({ type: "error", message: data.detail || "Order error" });
      }
      
      setTimeout(() => setToast(null), 5000);
    },
    onError: (error) => {
      setShowConfirm(false);
      setPendingOrder(null);
      
      if (error.message === "agent_offline") {
        setToast({ type: "error", message: "MT5 Agent is offline" });
      } else {
        setToast({ type: "error", message: error.message });
      }
      
      setTimeout(() => setToast(null), 5000);
    },
  });

  const handleOrder = useCallback((order: { side: "BUY" | "SELL"; symbol: string; volume: number; slPips: number; tpPips: number }) => {
    setPendingOrder({
      side: order.side,
      symbol: order.symbol,
      volume: order.volume,
      sl_pips: order.slPips,
      tp_pips: order.tpPips,
    });
    setShowConfirm(true);
  }, []);

  const confirmOrder = useCallback(() => {
    if (pendingOrder) {
      orderMutation.mutate(pendingOrder);
    }
  }, [pendingOrder, orderMutation]);

  const cancelOrder = useCallback(() => {
    setShowConfirm(false);
    setPendingOrder(null);
  }, []);

  const bidPrice = currentTick?.bid || 0;
  const askPrice = currentTick?.ask || 0;
  const spread = ((askPrice - bidPrice) * 10000).toFixed(1);

  const priceFlash = currentTick?.flash;

  return (
    <DashboardLayout>
      {toast && (
        <div
          className="fixed top-16 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-[12px] font-mono font-bold"
          style={{
            backgroundColor: toast.type === "success" ? "#00E5A0" : toast.type === "warning" ? "#C9A84C" : "#FF4560",
            color: toast.type === "success" ? "#040810" : "white",
          }}
        >
          {toast.message}
        </div>
      )}

      {showConfirm && pendingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#090F1E] border border-[#131E32] rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-[14px] font-mono font-bold text-[#EEF2FF] mb-4">Confirm Order</h3>
            <p className="text-[12px] text-[#8899BB] mb-6">
              Place {pendingOrder.side} {pendingOrder.volume} lots {pendingOrder.symbol} at market?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={cancelOrder}
                className="flex-1"
                style={{ borderColor: "#131E32", color: "#8899BB" }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmOrder}
                disabled={orderMutation.isPending}
                className="flex-1"
                style={{
                  backgroundColor: pendingOrder.side === "BUY" ? "#00E5A0" : "#FF4560",
                  color: pendingOrder.side === "BUY" ? "#040810" : "white",
                }}
              >
                {orderMutation.isPending ? "Processing..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-5">
        <h1 className="text-[26px] font-bold tracking-[2px]" style={{ color: "#EEF2FF", fontFamily: "Bebas Neue, sans-serif" }}>
          LIVE TRADING
        </h1>
        <p className="text-[12px] font-mono mt-1" style={{ color: "#8899BB" }}>
          PLACE ORDERS — REAL-TIME EXECUTION VIA MT5 AGENT
        </p>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <div>
          <PriceChart
            symbol={symbol}
            timeframe={timeframe}
            onSymbolChange={setSymbol}
            onTimeframeChange={setTimeframe}
            candles={candles}
            isLoading={candlesLoading}
            isEmpty={candles.length === 0}
          />

          <div className="flex items-center gap-4 mt-3" style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
            <div>
              <div className="text-[9px] font-mono uppercase tracking-[1px]" style={{ color: "#3F5070" }}>BID</div>
              <div
                className="text-[18px] font-mono font-semibold transition-colors"
                style={{
                  color: priceFlash === "dn" ? "#FF4560" : priceFlash === "up" ? "#00E5A0" : "#FF4560",
                }}
              >
                {bidPrice.toFixed(5)}
              </div>
            </div>
            <div className="w-px h-[30px]" style={{ backgroundColor: "#131E32" }} />
            <div>
              <div className="text-[9px] font-mono uppercase tracking-[1px]" style={{ color: "#3F5070" }}>ASK</div>
              <div
                className="text-[18px] font-mono font-semibold transition-colors"
                style={{
                  color: priceFlash === "up" ? "#00E5A0" : priceFlash === "dn" ? "#FF4560" : "#00E5A0",
                }}
              >
                {askPrice.toFixed(5)}
              </div>
            </div>
            <div className="w-px h-[30px]" style={{ backgroundColor: "#131E32" }} />
            <div>
              <div className="text-[9px] font-mono uppercase tracking-[1px]" style={{ color: "#3F5070" }}>SPREAD</div>
              <div className="text-[18px] font-mono font-semibold" style={{ color: "#8899BB" }}>{spread}</div>
            </div>
          </div>
        </div>

        <OrderPanel onSubmit={handleOrder} isLoading={orderMutation.isPending} />
      </div>
    </DashboardLayout>
  );
}
