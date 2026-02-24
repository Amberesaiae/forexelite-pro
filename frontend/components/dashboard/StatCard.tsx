import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  accentColor?: string;
  unit?: string;
  sparkline?: ReactNode;
  subtitle?: string;
}

export function StatCard({
  label,
  value,
  change,
  changeType = "neutral",
  accentColor = "#C9A84C",
  unit,
  sparkline,
  subtitle,
}: StatCardProps) {
  const changeColors = {
    up: { bg: "rgba(0, 229, 160, 0.1)", text: "#00E5A0" },
    down: { bg: "rgba(255, 69, 96, 0.1)", text: "#FF4560" },
    neutral: { bg: "rgba(201, 168, 76, 0.1)", text: "#C9A84C" },
  };

  const colors = changeColors[changeType];

  return (
    <Card
      className="relative overflow-hidden"
      style={{
        backgroundColor: "#090F1E",
        borderColor: "#131E32",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        }}
      />
      <CardContent className="p-4">
        <div
          className="text-[9.5px] font-mono uppercase tracking-[1.5px] mb-2.5"
          style={{ color: "#3F5070" }}
        >
          {label}
        </div>
        <div className="font-mono text-[26px] font-semibold leading-none" style={{ color: "#EEF2FF" }}>
          {typeof value === "number" && unit ? (
            <>
              <span className="text-[14px] mr-0.5">{unit}</span>
              {value.toLocaleString()}
            </>
          ) : (
            value
          )}
        </div>
        {(change || subtitle) && (
          <div className="flex items-center gap-1.5 mt-2">
            {change && (
              <span
                className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                style={{ backgroundColor: colors.bg, color: colors.text }}
              >
                {change}
              </span>
            )}
            {subtitle && (
              <span className="text-[10.5px]" style={{ color: "#3F5070" }}>
                {subtitle}
              </span>
            )}
          </div>
        )}
        {sparkline && <div className="mt-3">{sparkline}</div>}
      </CardContent>
    </Card>
  );
}
