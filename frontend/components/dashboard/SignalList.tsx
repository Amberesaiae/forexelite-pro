"use client";

import { useSignalsStore, Signal } from "@/stores";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";

interface SignalListProps {
  compact?: boolean;
}

export function SignalList({ compact = false }: SignalListProps) {
  const { signals } = useSignalsStore();
  const displaySignals = compact ? signals.slice(0, 4) : signals;

  const getConfidenceStyle = (confidence: number) => {
    if (confidence >= 80) return { bg: "rgba(201, 168, 76, 0.1)", color: "#C9A84C" };
    if (confidence >= 60) return { bg: "rgba(61, 133, 255, 0.1)", color: "#3D85FF" };
    return { bg: "rgba(63, 80, 112, 0.1)", color: "#3F5070" };
  };

  const getStatusStyle = (status: Signal["status"]) => {
    const styles = {
      executed: { bg: "rgba(0, 229, 160, 0.1)", color: "#00E5A0" },
      pending: { bg: "rgba(201, 168, 76, 0.1)", color: "#C9A84C", border: "1px solid #7A6130" },
      failed: { bg: "rgba(255, 69, 96, 0.1)", color: "#FF4560" },
    };
    return styles[status];
  };

  return (
    <Card style={{ backgroundColor: "#090F1E", borderColor: "#131E32" }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[10px] font-mono uppercase tracking-[1.5px]" style={{ color: "#3F5070" }}>
            {compact ? "Recent TV Signals" : "Signal History"}
          </CardTitle>
          {compact && (
            <span className="text-[10px] font-mono" style={{ color: "#C9A84C", cursor: "pointer" }}>
              View All
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className={compact ? "space-y-2" : "space-y-2 max-h-[400px] overflow-y-auto"}>
        {displaySignals.map((signal, index) => {
          const confidence = getConfidenceStyle(signal.confidence);
          const status = getStatusStyle(signal.status);
          const isBuy = signal.direction === "BUY";

          return (
            <div
              key={signal.id}
              className="flex items-center gap-3 p-3 rounded-lg transition-colors"
              style={{ backgroundColor: "#0A1128", border: "1px solid rgba(19,30,50,0.6)" }}
            >
              <div
                className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: isBuy ? "rgba(0, 229, 160, 0.1)" : "rgba(255, 69, 96, 0.1)" }}
              >
                {isBuy ? (
                  <TrendingUp className="w-4 h-4" style={{ color: "#00E5A0" }} />
                ) : (
                  <TrendingDown className="w-4 h-4" style={{ color: "#FF4560" }} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[12px] font-semibold" style={{ color: "#EEF2FF" }}>
                    {signal.pair}
                  </span>
                  <span
                    className="inline-flex items-center text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: isBuy ? "rgba(0, 229, 160, 0.1)" : "rgba(255, 69, 96, 0.1)",
                      color: isBuy ? "#00E5A0" : "#FF4560",
                    }}
                  >
                    {signal.direction}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px]" style={{ color: "#3F5070" }}>
                    Entry: {signal.entryMin}-{signal.entryMax}
                  </span>
                  <span className="text-[10px]" style={{ color: "#FF4560" }}>
                    SL: {signal.sl}
                  </span>
                  <span className="text-[10px]" style={{ color: "#00E5A0" }}>
                    TP: {signal.tp}
                  </span>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span
                  className="inline-block text-[9px] font-mono px-1.5 py-0.5 rounded"
                  style={{ ...confidence }}
                >
                  {signal.confidence}%
                </span>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span
                    className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                    style={{ ...status }}
                  >
                    {signal.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
