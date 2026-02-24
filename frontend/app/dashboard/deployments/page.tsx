"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useOldEAStore } from "@/stores";

export default function DeploymentsPage() {
  const { eas, updateEAStatus } = useOldEAStore();

  const running = eas.filter(e => e.status === "running").length;

  return (
    <DashboardLayout>
      <div className="mb-5">
        <h1 className="text-[26px] font-bold tracking-[2px]" style={{ color: "#EEF2FF", fontFamily: "Bebas Neue, sans-serif" }}>
          DEPLOYMENTS
        </h1>
        <p className="text-[12px] font-mono mt-1" style={{ color: "#8899BB" }}>
          MANAGE YOUR RUNNING EXPERT ADVISORS
        </p>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div>
          <div style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
            <div className="text-[10px] font-mono uppercase tracking-[1.5px] mb-3" style={{ color: "#3F5070" }}>
              Active Deployments
            </div>
            {eas.map((ea) => (
              <div
                key={ea.id}
                className="flex items-center gap-3 p-3 rounded mb-2"
                style={{ backgroundColor: "#0C1525", border: "1px solid #131E32" }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ea.status === "running" ? "#00E5A0" : ea.status === "paused" ? "#C9A84C" : "#3F5070",
                    boxShadow: ea.status === "running" ? "0 0 6px #00E5A0" : "none",
                  }}
                />
                <div className="flex-1">
                  <div className="text-[12px] font-semibold" style={{ color: "#EEF2FF" }}>{ea.name}</div>
                  <div className="text-[9.5px] font-mono" style={{ color: "#3F5070" }}>{ea.pair} • {ea.timeframe}</div>
                </div>
                <div className="flex gap-1">
                  {ea.status === "running" ? (
                    <button
                      onClick={() => updateEAStatus(ea.id, "paused")}
                      className="text-[9px] font-mono px-2 py-1 rounded border"
                      style={{ borderColor: "#FF4560", color: "#FF4560" }}
                    >
                      Stop
                    </button>
                  ) : (
                    <button
                      onClick={() => updateEAStatus(ea.id, "running")}
                      className="text-[9px] font-mono px-2 py-1 rounded border"
                      style={{ borderColor: "#00E5A0", color: "#00E5A0" }}
                    >
                      Run
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
          <div className="text-[10px] font-mono uppercase tracking-[1.5px] mb-3" style={{ color: "#3F5070" }}>
            MT5 Connection
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-[#00E5A0]" style={{ boxShadow: "0 0 6px #00E5A0" }} />
            <span className="text-[12px]" style={{ color: "#00E5A0" }}>Connected to Exness-Demo</span>
          </div>
          {[
            { label: "Account", value: "26489175" },
            { label: "Server", value: "Exness-Demo" },
            { label: "Status", value: "Online", color: "#00E5A0" },
            { label: "Last Sync", value: "Just now" },
          ].map((item, i) => (
            <div key={i} className="flex justify-between py-2" style={{ borderBottom: "1px solid #131E32" }}>
              <span className="text-[11.5px]" style={{ color: "#8899BB" }}>{item.label}</span>
              <span className="text-[12px] font-mono" style={{ color: item.color || "#EEF2FF" }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
