"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePriceStore } from "@/stores";

interface OrderPanelProps {
  onSubmit?: (order: OrderData) => void;
  isLoading?: boolean;
}

export interface OrderData {
  side: "BUY" | "SELL";
  symbol: string;
  volume: number;
  slPips: number;
  tpPips: number;
}

const symbols = ["EURUSD", "GBPUSD", "XAUUSD", "USDJPY", "GBPJPY"];
const contractSize = 100000;
const marginRequirement: Record<string, number> = {
  EURUSD: 0.02,
  GBPUSD: 0.02,
  XAUUSD: 0.01,
  USDJPY: 0.02,
  GBPJPY: 0.02,
};

export function OrderPanel({ onSubmit, isLoading = false }: OrderPanelProps) {
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [symbol, setSymbol] = useState("EURUSD");
  const [volume, setVolume] = useState(0.01);
  const [slPips, setSlPips] = useState(20);
  const [tpPips, setTpPips] = useState(40);

  const prices = usePriceStore((s) => s.prices);
  const currentTick = prices[symbol];
  const currentPrice = currentTick?.bid || 0;

  const pipValue = useMemo(() => {
    const pipSizes: Record<string, number> = {
      EURUSD: 0.0001,
      GBPUSD: 0.0001,
      XAUUSD: 0.01,
      USDJPY: 0.01,
      GBPJPY: 0.01,
    };
    return volume * contractSize * pipSizes[symbol];
  }, [symbol, volume]);

  const estimatedMargin = useMemo(() => {
    return volume * contractSize * marginRequirement[symbol];
  }, [symbol, volume]);

  const riskPercent = useMemo(() => {
    const pipSizes: Record<string, number> = {
      EURUSD: 0.0001,
      GBPUSD: 0.0001,
      XAUUSD: 0.01,
      USDJPY: 0.01,
      GBPJPY: 0.01,
    };
    const riskAmount = slPips * pipSizes[symbol] * pipValue;
    return (riskAmount / 10000) * 100;
  }, [symbol, slPips, pipValue]);

  const rrRatio = tpPips / slPips;

  const handleSubmit = () => {
    onSubmit?.({ side, symbol, volume, slPips, tpPips });
  };

  return (
    <Card style={{ backgroundColor: "#090F1E", borderColor: "#131E32" }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[10px] font-mono uppercase tracking-[1.5px]" style={{ color: "#3F5070" }}>
            Place Order
          </CardTitle>
          <span
            className="text-[9px] font-mono px-1.5 py-0.5 rounded"
            style={{ backgroundColor: "rgba(201, 168, 76, 0.12)", color: "#C9A84C" }}
          >
            MARKET
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => setSide("BUY")}
            className="py-2 text-[11px] font-mono font-bold rounded transition-colors"
            style={{
              backgroundColor: side === "BUY" ? "rgba(0, 229, 160, 0.15)" : "#0C1525",
              border: `1px solid ${side === "BUY" ? "rgba(0,229,160,0.3)" : "#131E32"}`,
              color: side === "BUY" ? "#00E5A0" : "#3F5070",
            }}
          >
            BUY
          </button>
          <button
            onClick={() => setSide("SELL")}
            className="py-2 text-[11px] font-mono font-bold rounded transition-colors"
            style={{
              backgroundColor: side === "SELL" ? "rgba(255, 69, 96, 0.15)" : "#0C1525",
              border: `1px solid ${side === "SELL" ? "rgba(255,69,96,0.3)" : "#131E32"}`,
              color: side === "SELL" ? "#FF4560" : "#3F5070",
            }}
          >
            SELL
          </button>
        </div>

        <div>
          <Label className="text-[9.5px] font-mono uppercase" style={{ color: "#3F5070" }}>
            Instrument
          </Label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full mt-1 bg-[#0C1525] border border-[#131E32] rounded px-3 py-2 text-[13px] font-mono"
            style={{ color: "#EEF2FF" }}
          >
            {symbols.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-[9.5px] font-mono uppercase" style={{ color: "#3F5070" }}>
            Lot Size
          </Label>
          <div className="relative mt-1">
            <Input
              type="number"
              min={0.01}
              max={100}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value) || 0.01)}
              className="font-mono pr-10"
              style={{ backgroundColor: "#0C1525", borderColor: "#131E32", color: "#EEF2FF" }}
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono"
              style={{ color: "#3F5070" }}
            >
              LOTS
            </span>
          </div>
          <div className="mt-1.5">
            <div className="h-1 bg-[#131E32] rounded overflow-hidden">
              <div
                className="h-full rounded"
                style={{
                  width: `${Math.min((volume / 1) * 100, 100)}%`,
                  background: "linear-gradient(90deg, #00E5A0, #C9A84C)",
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono mt-1" style={{ color: "#3F5070" }}>
              <span>Risk:</span>
              <span>~{riskPercent.toFixed(2)}% equity</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[9.5px] font-mono uppercase" style={{ color: "#3F5070" }}>
              Stop Loss (pips)
            </Label>
            <Input
              type="number"
              min={0}
              value={slPips}
              onChange={(e) => setSlPips(parseInt(e.target.value) || 0)}
              className="mt-1 font-mono"
              style={{ backgroundColor: "#0C1525", borderColor: "#131E32", color: "#EEF2FF" }}
            />
          </div>
          <div>
            <Label className="text-[9.5px] font-mono uppercase" style={{ color: "#3F5070" }}>
              Take Profit (pips)
            </Label>
            <Input
              type="number"
              min={0}
              value={tpPips}
              onChange={(e) => setTpPips(parseInt(e.target.value) || 0)}
              className="mt-1 font-mono"
              style={{ backgroundColor: "#0C1525", borderColor: "#131E32", color: "#EEF2FF" }}
            />
          </div>
        </div>

        <div className="h-px bg-[#131E32]" />

        <div className="space-y-1">
          {[
            ["Est. Margin", `$${estimatedMargin.toFixed(2)}`],
            ["Pip Value", `$${pipValue.toFixed(2)}`],
            ["R:R Ratio", `1:${rrRatio.toFixed(1)}`],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-[10px] font-mono">
              <span style={{ color: "#3F5070" }}>{label}</span>
              <span style={{ color: "#8899BB" }}>{value}</span>
            </div>
          ))}
        </div>

        <div className="h-px bg-[#131E32]" />

        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full py-2.5 text-[12px] font-mono font-bold tracking-[1.5px]"
          style={{
            backgroundColor: side === "BUY" ? "#00E5A0" : "#FF4560",
            color: side === "BUY" ? "#040810" : "white",
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? "PROCESSING..." : `EXECUTE ${side}`}
        </Button>

        <p className="text-[9px] font-mono text-center" style={{ color: "#3F5070" }}>
          Orders execute at market price via MT5 Agent
        </p>
      </CardContent>
    </Card>
  );
}
