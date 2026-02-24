"use client";

import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { OrderPanel } from "@/components/dashboard/trading/OrderPanel";
import { usePositionsStore } from "@/stores";

export default function TradingPage() {
  const [symbol, setSymbol] = useState("EURUSD");
  const [timeframe, setTimeframe] = useState("H1");
  const { addPosition } = usePositionsStore();

  const handleOrder = (order: { side: "BUY" | "SELL"; symbol: string; volume: number; slPips: number; tpPips: number }) => {
    const prices: Record<string, number> = {
      EURUSD: 1.08428,
      GBPUSD: 1.26910,
      XAUUSD: 2034.5,
      USDJPY: 149.82,
      GBPJPY: 188.45,
    };
    const currentPrice = prices[order.symbol] || 1.0;
    const pipSize = order.symbol.includes("JPY") ? 0.01 : 0.0001;
    const sl = order.side === "BUY" ? currentPrice - order.slPips * pipSize : currentPrice + order.slPips * pipSize;
    const tp = order.side === "BUY" ? currentPrice + order.tpPips * pipSize : currentPrice - order.tpPips * pipSize;

    addPosition({
      ticket: String(Date.now()),
      pair: order.symbol,
      side: order.side,
      volume: order.volume,
      openPrice: currentPrice,
      currentPrice,
      sl,
      tp,
      pnl: 0,
      swap: 0,
      openTime: new Date().toISOString(),
    });
  };

  const bidPrice = 1.08421;
  const askPrice = 1.08428;
  const spread = ((askPrice - bidPrice) * 10000).toFixed(1);

  return (
    <DashboardLayout>
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
          />

          <div className="flex items-center gap-4 mt-3" style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
            <div>
              <div className="text-[9px] font-mono uppercase tracking-[1px]" style={{ color: "#3F5070" }}>BID</div>
              <div className="text-[18px] font-mono font-semibold" style={{ color: "#FF4560" }}>{bidPrice.toFixed(5)}</div>
            </div>
            <div className="w-px h-[30px]" style={{ backgroundColor: "#131E32" }} />
            <div>
              <div className="text-[9px] font-mono uppercase tracking-[1px]" style={{ color: "#3F5070" }}>ASK</div>
              <div className="text-[18px] font-mono font-semibold" style={{ color: "#00E5A0" }}>{askPrice.toFixed(5)}</div>
            </div>
            <div className="w-px h-[30px]" style={{ backgroundColor: "#131E32" }} />
            <div>
              <div className="text-[9px] font-mono uppercase tracking-[1px]" style={{ color: "#3F5070" }}>SPREAD</div>
              <div className="text-[18px] font-mono font-semibold" style={{ color: "#8899BB" }}>{spread}</div>
            </div>
          </div>
        </div>

        <OrderPanel onSubmit={handleOrder} />
      </div>
    </DashboardLayout>
  );
}
