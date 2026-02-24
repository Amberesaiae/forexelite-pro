"use client";

import { usePositionsStore, Position } from "@/stores";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PositionsTableProps {
  compact?: boolean;
  onClosePosition?: (ticket: string) => void;
}

export function PositionsTable({ compact = false, onClosePosition }: PositionsTableProps) {
  const { positions, removePosition } = usePositionsStore();

  const handleClose = (ticket: string) => {
    removePosition(ticket);
    onClosePosition?.(ticket);
  };

  const formatPrice = (price: number, pair: string): string => {
    if (pair.includes("JPY")) return price.toFixed(3);
    return price.toFixed(5);
  };

  const columns = compact
    ? ["Pair", "Side", "Lots", "Open", "P&L"]
    : ["Ticket", "Instrument", "Side", "Volume", "Open Price", "Current", "SL", "TP", "P&L", "Action"];

  return (
    <Card style={{ backgroundColor: "#090F1E", borderColor: "#131E32" }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[10px] font-mono uppercase tracking-[1.5px]" style={{ color: "#3F5070" }}>
            {compact ? "Open Positions" : "Open Positions"}
          </CardTitle>
          {!compact && (
            <span
              className="text-[9px] font-mono"
              style={{ color: "#3F5070" }}
            >
              {positions.length} positions
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="text-[9.5px] font-mono uppercase tracking-[1.5px] text-left px-3 py-2"
                    style={{ color: "#3F5070", borderBottom: "1px solid #131E32" }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(compact ? positions.slice(0, 5) : positions).map((pos) => (
                <tr
                  key={pos.ticket}
                  className="transition-colors hover:bg-[#111929]"
                  style={{ borderBottom: "1px solid rgba(19,30,50,0.6)" }}
                >
                  {!compact && (
                    <td className="px-3 py-2.5 text-[12px] font-mono" style={{ color: "#8899BB" }}>
                      {pos.ticket}
                    </td>
                  )}
                  <td className="px-3 py-2.5 text-[12px] font-mono font-semibold" style={{ color: "#EEF2FF" }}>
                    {pos.pair}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className="text-[9px] font-mono font-bold px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: pos.side === "BUY" ? "rgba(0, 229, 160, 0.1)" : "rgba(255, 69, 96, 0.1)",
                        color: pos.side === "BUY" ? "#00E5A0" : "#FF4560",
                      }}
                    >
                      {pos.side}
                    </span>
                  </td>
                  {!compact && (
                    <>
                      <td className="px-3 py-2.5 text-[12px] font-mono" style={{ color: "#EEF2FF" }}>
                        {pos.volume}
                      </td>
                      <td className="px-3 py-2.5 text-[12px] font-mono" style={{ color: "#EEF2FF" }}>
                        {formatPrice(pos.openPrice, pos.pair)}
                      </td>
                    </>
                  )}
                  <td className="px-3 py-2.5 text-[12px] font-mono" style={{ color: "#EEF2FF" }}>
                    {formatPrice(pos.currentPrice, pos.pair)}
                  </td>
                  {!compact && (
                    <>
                      <td className="px-3 py-2.5 text-[12px] font-mono" style={{ color: "#FF4560" }}>
                        {formatPrice(pos.sl, pos.pair)}
                      </td>
                      <td className="px-3 py-2.5 text-[12px] font-mono" style={{ color: "#00E5A0" }}>
                        {formatPrice(pos.tp, pos.pair)}
                      </td>
                    </>
                  )}
                  <td
                    className="px-3 py-2.5 text-[12px] font-mono font-semibold text-right"
                    style={{ color: pos.pnl >= 0 ? "#00E5A0" : "#FF4560" }}
                  >
                    {pos.pnl >= 0 ? "+" : ""}${pos.pnl.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => handleClose(pos.ticket)}
                      className="text-[9px] font-mono px-2 py-1 rounded border transition-colors"
                      style={{
                        borderColor: "#131E32",
                        color: "#3F5070",
                        backgroundColor: "transparent",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#FF4560";
                        e.currentTarget.style.color = "#FF4560";
                        e.currentTarget.style.backgroundColor = "rgba(255, 69, 96, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#131E32";
                        e.currentTarget.style.color = "#3F5070";
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      Close
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {positions.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-[12px]" style={{ color: "#8899BB" }}>
              No open positions
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
