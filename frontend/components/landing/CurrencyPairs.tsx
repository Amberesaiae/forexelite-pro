"use client";

import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface CurrencyPair {
  pair: string;
  bid: number;
  ask: number;
  spread: number;
  dailyRange: string;
  volatility: "Low" | "Med" | "High";
  signal: "BUY" | "SELL" | "NEUTRAL";
}

const currencyPairs: CurrencyPair[] = [
  { pair: "EUR/USD", bid: 1.08415, ask: 1.08425, spread: 1.0, dailyRange: "65-85", volatility: "Med", signal: "BUY" },
  { pair: "GBP/USD", bid: 1.26538, ask: 1.26558, spread: 2.0, dailyRange: "80-120", volatility: "High", signal: "SELL" },
  { pair: "USD/JPY", bid: 154.325, ask: 154.345, spread: 2.0, dailyRange: "45-65", volatility: "Low", signal: "NEUTRAL" },
  { pair: "USD/CHF", bid: 0.90128, ask: 0.90148, spread: 2.0, dailyRange: "35-55", volatility: "Low", signal: "BUY" },
  { pair: "AUD/USD", bid: 0.65316, ask: 0.65336, spread: 2.0, dailyRange: "55-80", volatility: "Med", signal: "SELL" },
  { pair: "USD/CAD", bid: 1.36815, ask: 1.36835, spread: 2.0, dailyRange: "40-60", volatility: "Low", signal: "NEUTRAL" },
  { pair: "NZD/USD", bid: 0.60128, ask: 0.60148, spread: 2.0, dailyRange: "50-75", volatility: "Med", signal: "BUY" },
  { pair: "EUR/GBP", bid: 0.85678, ask: 0.85698, spread: 2.0, dailyRange: "35-50", volatility: "Low", signal: "SELL" },
  { pair: "EUR/JPY", bid: 167.350, ask: 167.380, spread: 3.0, dailyRange: "70-95", volatility: "Med", signal: "NEUTRAL" },
  { pair: "GBP/JPY", bid: 195.248, ask: 195.288, spread: 4.0, dailyRange: "90-140", volatility: "High", signal: "BUY" },
];

const volatilityColors = {
  Low: "text-[#00E5A0] bg-[rgba(0,229,160,0.1)]",
  Med: "text-[#FFB020] bg-[rgba(255,176,32,0.1)]",
  High: "text-[#FF4560] bg-[rgba(255,69,96,0.1)]",
};

const signalColors = {
  BUY: "bg-[#00E5A0] text-[#04080F]",
  SELL: "bg-[#FF4560] text-[#04080F]",
  NEUTRAL: "bg-[#445577] text-[#EEF2FF]",
};

export function CurrencyPairs() {
  return (
    <TooltipProvider delayDuration={300}>
      <section className="bg-[#0A0A0A] border-t border-b border-[#141414] py-16">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="mb-10">
            <div className="text-[10px] tracking-[3px] uppercase text-[#C9A84C] font-mono mb-2.5">
              // MARKET OVERVIEW
            </div>
            <h2 className="text-[clamp(32px,6vw,64px)] font-['Bebas_Neue'] leading-none tracking-[1px] mb-3.5">
              CURRENCY PAIRS
            </h2>
            <p className="text-[14px] text-[#8899BB] max-w-[560px] leading-[1.7] font-light">
              Real-time forex market data with directional signals powered by our proprietary trading algorithm.
            </p>
          </div>

          <div className="border border-[#141414] rounded-lg overflow-hidden bg-[#080E1A]">
            {/* Table Header */}
            <div className="grid grid-cols-7 gap-4 px-4 py-3 bg-[#141414] border-b border-[#1a1a1a] text-[10px] tracking-[2px] uppercase font-mono text-[#8899BB]">
              <div className="text-[#C9A84C]">Pair</div>
              <div className="text-right text-[#C9A84C]">Bid</div>
              <div className="text-right text-[#C9A84C]">Ask</div>
              <div className="text-right text-[#C9A84C]">Spread</div>
              <div className="text-right text-[#C9A84C]">Daily Range</div>
              <div className="text-center text-[#C9A84C]">Volatility</div>
              <div className="text-center text-[#C9A84C]">Signal</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-[#141414]">
              {currencyPairs.map((item, index) => (
                <div
                  key={item.pair}
                  className={`grid grid-cols-7 gap-4 px-4 py-3.5 items-center text-[13px] font-mono transition-colors hover:bg-[#0C1424] ${
                    index % 2 === 0 ? "bg-[#0A0A0A]" : "bg-[#141414]"
                  }`}
                >
                  <div className="font-semibold text-[#EEF2FF]">{item.pair}</div>
                  <div className="text-right text-[#8899BB]">{item.bid.toFixed(5)}</div>
                  <div className="text-right text-[#8899BB]">{item.ask.toFixed(5)}</div>
                  <div className="text-right text-[#C9A84C]">{item.spread.toFixed(1)} pips</div>
                  <div className="text-right text-[#8899BB]">{item.dailyRange} pips</div>
                  <div className="text-center">
                    <Tooltip>
                      <TooltipTrigger>
                        <span
                          className={`inline-block px-2 py-1 text-[10px] font-semibold tracking-[1px] rounded ${
                            volatilityColors[item.volatility]
                          }`}
                        >
                          {item.volatility.toUpperCase()}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#141414] border border-[#1a1a1a] text-[#8899BB]">
                        <p>Historical volatility level</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="text-center">
                    <Tooltip>
                      <TooltipTrigger>
                        <span
                          className={`inline-block px-3 py-1.5 text-[10px] font-bold tracking-[1.5px] rounded cursor-default ${
                            signalColors[item.signal]
                          }`}
                        >
                          {item.signal}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#141414] border border-[#1a1a1a] text-[#8899BB]">
                        <p>
                          {item.signal === "BUY" && "Strong upward momentum detected"}
                          {item.signal === "SELL" && "Bearish pressure identified"}
                          {item.signal === "NEUTRAL" && "No clear directional bias"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
}

export default CurrencyPairs;
