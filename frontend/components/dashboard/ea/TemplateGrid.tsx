"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TemplateGridProps {
  onSelect?: (template: string) => void;
}

const templates = [
  { id: "ma-cross", category: "Trend", name: "MA Crossover" },
  { id: "rsi-rev", category: "Mean Rev", name: "RSI Reversal" },
  { id: "bb-squeeze", category: "Volatility", name: "BB Squeeze" },
  { id: "breakout", category: "Breakout", name: "Range Break" },
  { id: "scalp-m1", category: "Scalping", name: "M1 Scalper" },
  { id: "grid", category: "Grid", name: "Grid System" },
];

export function TemplateGrid({ onSelect }: TemplateGridProps) {
  return (
    <Card style={{ backgroundColor: "#090F1E", borderColor: "#131E32" }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-[10px] font-mono uppercase tracking-[1.5px]" style={{ color: "#3F5070" }}>
          Quick Templates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}
        >
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelect?.(template.id)}
              className="text-left p-2.5 rounded transition-colors"
              style={{
                backgroundColor: "#0C1525",
                border: "1px solid #131E32",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#7A6130";
                e.currentTarget.style.color = "#C9A84C";
                e.currentTarget.style.backgroundColor = "rgba(201, 168, 76, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#131E32";
                e.currentTarget.style.color = "#8899BB";
                e.currentTarget.style.backgroundColor = "#0C1525";
              }}
            >
              <span
                className="text-[9px] font-mono block mb-1"
                style={{ color: "#3F5070", letterSpacing: "1px" }}
              >
                {template.category}
              </span>
              <span className="text-[11px] font-medium">{template.name}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
