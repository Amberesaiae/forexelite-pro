"use client";

const tickerPairs = [
  { pair: "XAUUSD", price: "2318.45", change: "+0.42%", up: true },
  { pair: "EURUSD", price: "1.08415", change: "-0.18%", up: false },
  { pair: "GBPUSD", price: "1.26538", change: "+0.31%", up: true },
  { pair: "USDJPY", price: "154.325", change: "+0.22%", up: true },
  { pair: "GBPJPY", price: "195.248", change: "+0.55%", up: true },
  { pair: "AUDUSD", price: "0.65316", change: "-0.12%", up: false },
  { pair: "USDCAD", price: "1.36815", change: "+0.08%", up: true },
  { pair: "NZDUSD", price: "0.60128", change: "-0.25%", up: false },
  { pair: "EURJPY", price: "167.350", change: "+0.41%", up: true },
  { pair: "USDCHF", price: "0.90128", change: "-0.05%", up: false },
];

export function Ticker() {
  return (
    <div className="bg-[#0C1424] border-t border-b border-[#141E30] overflow-hidden py-2.5">
      <div className="flex gap-10 animate-ticker whitespace-nowrap">
        {[...tickerPairs, ...tickerPairs].map((t, i) => (
          <div key={i} className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-[#EEF2FF] font-semibold">{t.pair}</span>
            <span className="text-[#8899BB]">{t.price}</span>
            <span className={t.up ? "text-[#00E5A0]" : "text-[#FF4560]"}>{t.change}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Ticker;
