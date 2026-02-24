"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="mb-5">
        <h1 className="text-[26px] font-bold tracking-[2px]" style={{ color: "#EEF2FF", fontFamily: "Bebas Neue, sans-serif" }}>
          SETTINGS
        </h1>
        <p className="text-[12px] font-mono mt-1" style={{ color: "#8899BB" }}>
          CONFIGURE YOUR PREFERENCES
        </p>
      </div>

      <div className="space-y-3 max-w-2xl">
        {[
          {
            title: "Trading Settings",
            items: [
              { label: "Default Lot Size", value: "0.01" },
              { label: "Default SL (pips)", value: "20" },
              { label: "Default TP (pips)", value: "40" },
              { label: "Max Spread", value: "30" },
            ]
          },
          {
            title: "Risk Management",
            items: [
              { label: "Max Risk per Trade", value: "1.0%" },
              { label: "Daily Loss Limit", value: "5.0%" },
              { label: "Max Drawdown", value: "20.0%" },
            ]
          },
          {
            title: "Notifications",
            items: [
              { label: "Trade Alerts", value: "Enabled" },
              { label: "Signal Notifications", value: "Enabled" },
              { label: "EA Status Updates", value: "Enabled" },
            ]
          }
        ].map((section, idx) => (
          <div key={idx} style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
            <div className="text-[10px] font-mono uppercase tracking-[1.5px] mb-4" style={{ color: "#3F5070" }}>
              {section.title}
            </div>
            {section.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: i < section.items.length - 1 ? "1px solid #131E32" : "none" }}>
                <span className="text-[12px]" style={{ color: "#8899BB" }}>{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-mono" style={{ color: "#EEF2FF" }}>{item.value}</span>
                  <button className="text-[9px] font-mono px-2 py-1 rounded border" style={{ borderColor: "#131E32", color: "#8899BB" }}>
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

        <div style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
          <div className="text-[10px] font-mono uppercase tracking-[1.5px] mb-4" style={{ color: "#3F5070" }}>
            Danger Zone
          </div>
          <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid #131E32" }}>
            <div>
              <div className="text-[12px]" style={{ color: "#EEF2FF" }}>Reset All Settings</div>
              <div className="text-[10px]" style={{ color: "#3F5070" }}>Reset to default values</div>
            </div>
            <button className="px-3 py-2 text-[11px] font-mono rounded border" style={{ borderColor: "#FF4560", color: "#FF4560" }}>
              Reset
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
