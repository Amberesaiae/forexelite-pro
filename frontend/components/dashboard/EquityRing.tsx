import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EquityRingProps {
  balance: number;
  equity: number;
  marginUsed: number;
  freeMargin: number;
  leverage: number;
}

export function EquityRing({ balance, equity, marginUsed, freeMargin, leverage }: EquityRingProps) {
  const circumference = 2 * Math.PI * 44;
  const usedPercent = (marginUsed / balance) * 100;
  const offset = circumference - (usedPercent / 100) * circumference;

  return (
    <Card style={{ backgroundColor: "#090F1E", borderColor: "#131E32" }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[10px] font-mono uppercase tracking-[1.5px]" style={{ color: "#3F5070" }}>
            Account
          </CardTitle>
          <span
            className="text-[9px] font-mono px-1.5 py-0.5 rounded"
            style={{ backgroundColor: "rgba(201, 168, 76, 0.12)", color: "#C9A84C" }}
          >
            DEMO
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center py-2">
        <div className="relative">
          <svg width="110" height="110" className="rotate-[-90deg]">
            <circle
              cx="55"
              cy="55"
              r="44"
              fill="none"
              stroke="#131E32"
              strokeWidth="8"
            />
            <defs>
              <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#C9A84C" />
                <stop offset="100%" stopColor="#00E5A0" />
              </linearGradient>
            </defs>
            <circle
              cx="55"
              cy="55"
              r="44"
              fill="none"
              stroke="url(#ringGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-500"
            />
          </svg>
        </div>

        <div className="w-full mt-2">
          <div className="flex justify-between text-[9px] font-mono" style={{ color: "#3F5070" }}>
            <span>MARGIN USED</span>
            <span style={{ color: "#8899BB" }}>
              ${marginUsed.toFixed(2)} / ${freeMargin.toFixed(2)}
            </span>
          </div>
          <div className="h-px bg-[#131E32] my-2" />

          <div className="space-y-1.5">
            {[
              { label: "Balance", value: `$${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
              { label: "Equity", value: `$${equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: "#00E5A0" },
              { label: "Margin Used", value: `$${marginUsed.toFixed(2)}` },
              { label: "Free Margin", value: `$${freeMargin.toFixed(2)}` },
              { label: "Leverage", value: `1:${leverage}` },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-[11.5px]">
                <span style={{ color: "#8899BB" }}>{item.label}</span>
                <span className="font-mono text-[12px]" style={{ color: item.color || "#EEF2FF" }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
