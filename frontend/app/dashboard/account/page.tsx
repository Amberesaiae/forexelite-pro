"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAccountStore } from "@/stores";

export default function AccountPage() {
  const account = useAccountStore();

  return (
    <DashboardLayout>
      <div className="mb-5">
        <h1 className="text-[26px] font-bold tracking-[2px]" style={{ color: "#EEF2FF", fontFamily: "Bebas Neue, sans-serif" }}>
          ACCOUNT
        </h1>
        <p className="text-[12px] font-mono mt-1" style={{ color: "#8899BB" }}>
          YOUR TRADING ACCOUNT DETAILS
        </p>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <div style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
          <div className="text-[10px] font-mono uppercase tracking-[1.5px] mb-4" style={{ color: "#3F5070" }}>
            Account Overview
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            {[
              { label: "Account Number", value: account.accountNumber },
              { label: "Broker", value: account.broker },
              { label: "Account Type", value: account.accountType, color: account.accountType === "Demo" ? "#C9A84C" : "#00E5A0" },
              { label: "Server", value: account.server },
              { label: "Leverage", value: `1:${account.leverage}` },
              { label: "Currency", value: "USD" },
              { label: "Balance", value: `$${account.balance.toFixed(2)}`, color: "#EEF2FF" },
              { label: "Equity", value: `$${account.equity.toFixed(2)}`, color: "#00E5A0" },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded" style={{ backgroundColor: "#0C1525" }}>
                <div className="text-[9.5px] font-mono uppercase" style={{ color: "#3F5070" }}>{item.label}</div>
                <div className="text-[14px] font-semibold mt-1" style={{ color: item.color || "#EEF2FF" }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
          <div className="text-[10px] font-mono uppercase tracking-[1.5px] mb-4" style={{ color: "#3F5070" }}>
            Plan Details
          </div>
          <div className="p-4 rounded text-center mb-4" style={{ backgroundColor: "rgba(201,168,76,0.1)", border: "1px solid #7A6130" }}>
            <div className="text-[18px] font-bold" style={{ color: "#C9A84C" }}>PRO PLAN</div>
            <div className="text-[10px] font-mono mt-1" style={{ color: "#3F5070" }}>Active</div>
          </div>
          {[
            { label: "Unlimited Signals", value: "✓" },
            { label: "EA Generator", value: "✓" },
            { label: "Priority Support", value: "✓" },
            { label: "API Access", value: "✓" },
          ].map((feature, i) => (
            <div key={i} className="flex justify-between py-2" style={{ borderBottom: "1px solid #131E32" }}>
              <span className="text-[11.5px]" style={{ color: "#8899BB" }}>{feature.label}</span>
              <span className="text-[12px]" style={{ color: "#00E5A0" }}>{feature.value}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
