"use client";

import { useOldEAStore, EA } from "@/stores";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EALibraryProps {
  onEdit?: (ea: EA) => void;
}

export function EALibrary({ onEdit }: EALibraryProps) {
  const { eas, updateEAStatus, deleteEA } = useOldEAStore();

  const getStatusStyle = (status: EA["status"]) => {
    const styles = {
      running: { bg: "rgba(0, 229, 160, 0.1)", color: "#00E5A0", border: "#00E5A0" },
      paused: { bg: "rgba(201, 168, 76, 0.1)", color: "#C9A84C", border: "#C9A84C" },
      draft: { bg: "rgba(63, 80, 112, 0.1)", color: "#3F5070", border: "#3F5070" },
    };
    return styles[status];
  };

  return (
    <Card style={{ backgroundColor: "#090F1E", borderColor: "#131E32" }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-[10px] font-mono uppercase tracking-[1.5px]" style={{ color: "#3F5070" }}>
          EA Library
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {eas.map((ea) => {
          const status = getStatusStyle(ea.status);

          return (
            <div
              key={ea.id}
              className="flex items-center gap-3 p-3 rounded transition-colors"
              style={{
                backgroundColor: "#0C1525",
                border: "1px solid #131E32",
                borderLeft: `3px solid ${status.border}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(201, 168, 76, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#131E32";
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold truncate" style={{ color: "#EEF2FF" }}>
                    {ea.name}
                  </span>
                  <span
                    className="text-[8px] font-mono px-1.5 py-0.5 rounded capitalize"
                    style={{ ...status }}
                  >
                    {ea.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[9.5px] font-mono" style={{ color: "#3F5070" }}>
                    {ea.pair} • {ea.timeframe}
                  </span>
                  <span className="text-[9.5px] font-mono" style={{ color: "#3F5070" }}>
                    {ea.lastModified}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  className="text-[9px] font-mono px-2 py-1 rounded border transition-colors"
                  style={{ borderColor: "#131E32", color: "#8899BB", backgroundColor: "transparent" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#C9A84C";
                    e.currentTarget.style.color = "#C9A84C";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#131E32";
                    e.currentTarget.style.color = "#8899BB";
                  }}
                  onClick={() => onEdit?.(ea)}
                >
                  Edit
                </button>
                {ea.status === "running" ? (
                  <button
                    className="text-[9px] font-mono px-2 py-1 rounded border transition-colors"
                    style={{ borderColor: "#FF4560", color: "#FF4560", backgroundColor: "rgba(255,69,96,0.1)" }}
                    onClick={() => updateEAStatus(ea.id, "paused")}
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    className="text-[9px] font-mono px-2 py-1 rounded border transition-colors"
                    style={{ borderColor: "#00E5A0", color: "#00E5A0", backgroundColor: "rgba(0,229,160,0.1)" }}
                    onClick={() => updateEAStatus(ea.id, "running")}
                  >
                    Run
                  </button>
                )}
                <button
                  className="text-[9px] font-mono px-2 py-1 rounded border transition-colors"
                  style={{ borderColor: "#131E32", color: "#3F5070", backgroundColor: "transparent" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#FF4560";
                    e.currentTarget.style.color = "#FF4560";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#131E32";
                    e.currentTarget.style.color = "#3F5070";
                  }}
                  onClick={() => deleteEA(ea.id)}
                >
                  Del
                </button>
              </div>
            </div>
          );
        })}

        {eas.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-[11px]" style={{ color: "#8899BB" }}>
              No EAs in library
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
