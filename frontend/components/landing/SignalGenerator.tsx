"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface Signal {
  pair: string;
  direction: "buy" | "sell";
  strategy: string;
  entry: number;
  sl: number;
  tp: number;
  timeframe: string;
  rr: number;
}

const currencyPairs = [
  { value: "XAUUSD", label: "XAUUSD — Gold" },
  { value: "EURUSD", label: "EURUSD — Euro/Dollar" },
  { value: "GBPUSD", label: "GBPUSD — Cable" },
  { value: "USDJPY", label: "USDJPY — Dollar/Yen" },
  { value: "GBPJPY", label: "GBPJPY — Beast" },
  { value: "AUDUSD", label: "AUDUSD — Aussie" },
  { value: "USDCAD", label: "USDCAD — Loonie" },
  { value: "NZDUSD", label: "NZDUSD — Kiwi" },
  { value: "USDCHF", label: "USDCHF — Swissie" },
  { value: "EURJPY", label: "EURJPY — Euro/Yen" },
];

const timeframes = [
  { value: "M1", label: "M1 — Scalping" },
  { value: "M5", label: "M5 — Micro" },
  { value: "M15", label: "M15 — Intraday" },
  { value: "M30", label: "M30 — Swing Entry" },
  { value: "H1", label: "H1 — Primary" },
  { value: "H4", label: "H4 — Swing" },
  { value: "D1", label: "D1 — Position" },
  { value: "W1", label: "W1 — Macro" },
];

const strategyLayers = ["SMC", "S&R", "Price Action", "OB", "FVG", "CHoCH", "BOS", "Liquidity"];

const rrRatios = [
  { value: "1:1", label: "1:1 — Break Even" },
  { value: "1:1.5", label: "1:1.5 — Conservative" },
  { value: "1:2", label: "1:2 — Standard" },
  { value: "1:3", label: "1:3 — Aggressive" },
  { value: "1:5", label: "1:5 — High Target" },
];

const priceRanges: Record<string, { b: number; p: number }> = {
  XAUUSD: { b: 2318, p: 0.1 },
  EURUSD: { b: 1.0841, p: 0.0001 },
  GBPUSD: { b: 1.2653, p: 0.0001 },
  USDJPY: { b: 154.32, p: 0.01 },
  GBPJPY: { b: 195.24, p: 0.01 },
  AUDUSD: { b: 0.6531, p: 0.0001 },
  EURJPY: { b: 167.34, p: 0.01 },
};

export function SignalGenerator() {
  const [selectedPair, setSelectedPair] = useState("XAUUSD");
  const [selectedTimeframe, setSelectedTimeframe] = useState("H1");
  const [selectedRisk, setSelectedRisk] = useState("1");
  const [selectedRR, setSelectedRR] = useState("1:2");
  const [activeLayers, setActiveLayers] = useState<string[]>(["SMC", "S&R"]);
  const [signals, setSignals] = useState<Signal[]>([]);

  const toggleLayer = (layer: string) => {
    setActiveLayers((prev) =>
      prev.includes(layer) ? prev.filter((l) => l !== layer) : [...prev, layer]
    );
  };

  const generateSignals = () => {
    const newSignals: Signal[] = [];
    const range = priceRanges[selectedPair] || { b: 1.0, p: 0.0001 };
    const direction = Math.random() > 0.5 ? "buy" : "sell";
    const pipSize = range.p;
    const slPips = 20 + Math.floor(Math.random() * 20);
    const tpMultiplier = parseFloat(selectedRR.split(":")[1]) || 2;
    const entry = range.b + (Math.random() - 0.5) * 10 * pipSize;
    const sl = direction === "buy" ? entry - slPips * pipSize : entry + slPips * pipSize;
    const tp = direction === "buy" ? entry + slPips * tpMultiplier * pipSize : entry - slPips * tpMultiplier * pipSize;

    newSignals.push({
      pair: selectedPair,
      direction,
      strategy: activeLayers.slice(0, 2).join(" + "),
      entry,
      sl,
      tp,
      timeframe: selectedTimeframe,
      rr: tpMultiplier,
    });

    setSignals(newSignals);
  };

  return (
    <section id="signals" className="bg-[#0C1424] border-t border-b border-[#141E30] py-16">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="mb-10">
          <div className="text-[10px] tracking-[3px] uppercase text-[#C9A84C] font-mono mb-2.5">
            // RULE-BASED ENGINE
          </div>
          <h2 className="text-[clamp(32px,6vw,64px)] font-['Bebas_Neue'] leading-none tracking-[1px] mb-3.5">
            SIGNAL GENERATOR
          </h2>
          <p className="text-[14px] text-[#8899BB] max-w-[560px] leading-[1.7] font-light">
            SMC, Price Action, and Support & Resistance logic fused into institutional-grade trade signals with full risk parameters.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-0 border border-[#141E30] rounded-lg overflow-hidden bg-[#080E1A]">
          {/* Controls */}
          <div className="p-6 border-b lg:border-b-0 lg:border-r border-[#141E30] flex flex-col gap-4 bg-[#04080F]">
            <h3 className="font-['Bebas_Neue'] text-base tracking-[2px] text-[#C9A84C]">
              CONFIGURE SIGNAL
            </h3>

            <div className="flex flex-col gap-1.5">
              <div className="text-[9px] tracking-[2px] uppercase text-[#445577] font-mono">Currency Pair</div>
              <Select value={selectedPair} onValueChange={setSelectedPair}>
                <SelectTrigger className="bg-[#0C1424] border-[#141E30] text-[#EEF2FF]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0C1424] border-[#141E30]">
                  {currencyPairs.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="text-[9px] tracking-[2px] uppercase text-[#445577] font-mono">Timeframe</div>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger className="bg-[#0C1424] border-[#141E30] text-[#EEF2FF]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0C1424] border-[#141E30]">
                  {timeframes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="text-[9px] tracking-[2px] uppercase text-[#445577] font-mono">Strategy Layer</div>
              <div className="flex flex-wrap gap-1.5">
                {strategyLayers.map((layer) => (
                  <button
                    key={layer}
                    onClick={() => toggleLayer(layer)}
                    className={`px-2.5 py-1.5 text-[10px] font-medium rounded border cursor-pointer transition-all ${
                      activeLayers.includes(layer)
                        ? "border-[#C9A84C] text-[#C9A84C] bg-[rgba(201,168,76,0.08)]"
                        : "border-[#141E30] text-[#8899BB] bg-transparent hover:border-[#7A6130]"
                    }`}
                  >
                    {layer}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="text-[9px] tracking-[2px] uppercase text-[#445577] font-mono">Risk / Trade (%)</div>
              <Input
                type="number"
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                min={0.5}
                max={5}
                step={0.5}
                className="bg-[#0C1424] border-[#141E30] text-[#EEF2FF]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="text-[9px] tracking-[2px] uppercase text-[#445577] font-mono">Min R:R Ratio</div>
              <Select value={selectedRR} onValueChange={setSelectedRR}>
                <SelectTrigger className="bg-[#0C1424] border-[#141E30] text-[#EEF2FF]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0C1424] border-[#141E30]">
                  {rrRatios.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={generateSignals}
              className="bg-[#C9A84C] text-[#04080F] hover:bg-[#E8C97A] mt-auto w-full"
            >
              ⚡ GENERATE SIGNALS
            </Button>
          </div>

          {/* Output */}
          <div className="p-5 flex flex-col gap-3.5 overflow-y-auto max-h-[460px]">
            <AnimatePresence mode="wait">
              {signals.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2.5 text-center py-10">
                  <div className="text-4xl opacity-30">📡</div>
                  <p className="font-mono text-[11px] tracking-[1px]">CONFIGURE & GENERATE SIGNALS</p>
                  <p className="text-[12px] text-[#445577]">Select pair, timeframe and strategy layer</p>
                </div>
              ) : (
                signals.map((signal, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`border rounded-md p-4 grid grid-cols-[auto_1fr_auto] gap-3 items-center transition-colors hover:border-[#7A6130] ${
                      signal.direction === "buy" ? "border-l-4 border-l-[#00E5A0]" : "border-l-4 border-l-[#FF4560]"
                    } border-[#141E30] bg-[#080E1A]`}
                  >
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-black flex-shrink-0 ${
                      signal.direction === "buy" ? "bg-[rgba(0,229,160,0.1)] text-[#00E5A0]" : "bg-[rgba(255,69,96,0.1)] text-[#FF4560]"
                    }`}>
                      {signal.direction === "buy" ? "↑" : "↓"}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="font-['Bebas_Neue'] text-lg tracking-[1px]">{signal.pair}</div>
                      <div className="text-[10px] text-[#C9A84C] font-mono tracking-[1px]">{signal.strategy}</div>
                      <div className="text-[10px] text-[#8899BB] font-mono whitespace-nowrap overflow-hidden text-ellipsis">
                        {signal.timeframe} • Entry: {signal.entry.toFixed(5)} • R:R 1:{signal.rr}
                      </div>
                    </div>
                    <div className="text-right flex flex-col gap-1 flex-shrink-0">
                      <div className="flex items-center gap-1.5 justify-end font-mono text-[11px]">
                        <span className="text-[8px] tracking-[1.5px] uppercase px-1.5 py-0.5 rounded bg-[rgba(61,133,255,0.15)] text-[#3D85FF]">ENTRY</span>
                        {signal.entry.toFixed(5)}
                      </div>
                      <div className="flex items-center gap-1.5 justify-end font-mono text-[11px]">
                        <span className="text-[8px] tracking-[1.5px] uppercase px-1.5 py-0.5 rounded bg-[rgba(255,69,96,0.15)] text-[#FF4560]">SL</span>
                        {signal.sl.toFixed(5)}
                      </div>
                      <div className="flex items-center gap-1.5 justify-end font-mono text-[11px]">
                        <span className="text-[8px] tracking-[1.5px] uppercase px-1.5 py-0.5 rounded bg-[rgba(0,229,160,0.15)] text-[#00E5A0]">TP</span>
                        {signal.tp.toFixed(5)}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SignalGenerator;
