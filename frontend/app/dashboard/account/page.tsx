"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useAuthStore } from "@/stores";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Key, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface TradingAccount {
  balance: number;
  equity: number;
  margin: number;
  free_margin: number;
  margin_level: number;
  leverage: number;
  currency: string;
  broker: string;
  account_number: string;
  account_type: string;
  server: string;
}

interface BrokerConnection {
  id: string;
  name: string;
  broker: string;
  account_number: string;
  status: "connected" | "disconnected";
  account_type: string;
}

export default function AccountPage() {
  const { user } = useAuthStore();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const { data: accountData, isLoading: accountLoading } = useQuery({
    queryKey: ["trading-account"],
    queryFn: () => apiGet<{ account: TradingAccount }>("/api/v1/trading/account"),
    refetchInterval: 30000,
  });

  const { data: brokersData } = useQuery({
    queryKey: ["broker-connections"],
    queryFn: () => apiGet<{ brokers: BrokerConnection[] }>("/api/v1/onboarding/brokers"),
  });

  const account = accountData?.data?.account;
  const brokers = brokersData?.data?.brokers || [];

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);

    if (error) {
      toast.error(error.message || "Failed to change password");
    } else {
      toast.success("Password changed successfully");
      setShowPasswordDialog(false);
      setNewPassword("");
      setConfirmPassword("");
    }
  };

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
          
          {accountLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#C9A84C" }} />
            </div>
          ) : account ? (
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              {[
                { label: "Account Number", value: account.account_number },
                { label: "Broker", value: account.broker },
                { label: "Account Type", value: account.account_type, color: account.account_type === "Demo" ? "#C9A84C" : "#00E5A0" },
                { label: "Server", value: account.server },
                { label: "Leverage", value: `1:${account.leverage}` },
                { label: "Currency", value: account.currency },
                { label: "Balance", value: `$${account.balance.toFixed(2)}`, color: "#EEF2FF" },
                { label: "Equity", value: `$${account.equity.toFixed(2)}`, color: "#00E5A0" },
                { label: "Margin", value: `$${account.margin.toFixed(2)}`, color: "#FF4560" },
                { label: "Free Margin", value: `$${account.free_margin.toFixed(2)}`, color: "#00E5A0" },
                { label: "Margin Level", value: `${account.margin_level}%`, color: account.margin_level < 100 ? "#FF4560" : "#00E5A0" },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded" style={{ backgroundColor: "#0C1525" }}>
                  <div className="text-[9.5px] font-mono uppercase" style={{ color: "#3F5070" }}>{item.label}</div>
                  <div className="text-[14px] font-semibold mt-1" style={{ color: item.color || "#EEF2FF" }}>{item.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 gap-2">
              <AlertCircle className="w-5 h-5" style={{ color: "#C9A84C" }} />
              <span className="text-[12px]" style={{ color: "#C9A84C" }}>No trading account connected</span>
            </div>
          )}
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

      <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
          <div className="text-[10px] font-mono uppercase tracking-[1.5px] mb-4" style={{ color: "#3F5070" }}>
            Profile
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[9.5px] font-mono uppercase" style={{ color: "#3F5070" }}>Email</div>
              <div className="text-[12px] mt-1" style={{ color: "#EEF2FF" }}>{user?.email || "Not logged in"}</div>
            </div>
            <button
              onClick={() => setShowPasswordDialog(true)}
              className="flex items-center gap-2 px-3 py-2 text-[11px] font-mono rounded border mt-2"
              style={{ borderColor: "#131E32", color: "#8899BB" }}
            >
              <Key className="w-3 h-3" />
              Change Password
            </button>
          </div>
        </div>

        <div style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
          <div className="text-[10px] font-mono uppercase tracking-[1.5px] mb-4" style={{ color: "#3F5070" }}>
            Broker Connections
          </div>
          {brokers.length === 0 ? (
            <div className="flex items-center justify-center py-4 gap-2">
              <AlertCircle className="w-4 h-4" style={{ color: "#C9A84C" }} />
              <span className="text-[11px]" style={{ color: "#C9A84C" }}>No brokers connected</span>
            </div>
          ) : (
            brokers.map((broker, i) => (
              <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid #131E32" }}>
                <div>
                  <div className="text-[12px]" style={{ color: "#EEF2FF" }}>{broker.broker}</div>
                  <div className="text-[10px]" style={{ color: "#3F5070" }}>{broker.account_number}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ 
                      backgroundColor: broker.status === "connected" ? "#00E5A0" : "#3F5070",
                      boxShadow: broker.status === "connected" ? "0 0 6px #00E5A0" : "none",
                    }} 
                  />
                  <span className="text-[10px]" style={{ color: broker.status === "connected" ? "#00E5A0" : "#3F5070" }}>
                    {broker.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showPasswordDialog && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowPasswordDialog(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-[#090F1E] border border-[#131E32] rounded-lg p-6 w-full max-w-md">
              <h2 className="text-[18px] font-bold mb-4" style={{ color: "#EEF2FF" }}>Change Password</h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="text-[11px] font-mono uppercase" style={{ color: "#8899BB" }}>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full mt-1 px-3 py-2 rounded bg-[#0C1525] border border-[#131E32] text-[12px] text-[#EEF2FF] placeholder:text-[#3F5070]"
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono uppercase" style={{ color: "#8899BB" }}>Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full mt-1 px-3 py-2 rounded bg-[#0C1525] border border-[#131E32] text-[12px] text-[#EEF2FF] placeholder:text-[#3F5070]"
                    required
                    minLength={8}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordDialog(false)}
                    className="flex-1 px-3 py-2 text-[11px] font-mono rounded border"
                    style={{ borderColor: "#131E32", color: "#8899BB" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="flex-1 px-3 py-2 text-[11px] font-mono font-bold rounded"
                    style={{ backgroundColor: "#C9A84C", color: "#040810" }}
                  >
                    {changingPassword ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Change Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
