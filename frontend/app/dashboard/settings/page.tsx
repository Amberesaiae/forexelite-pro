"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut } from "@/lib/api";
import { useState, useRef } from "react";
import { Loader2, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface UserPreferences {
  risk_per_trade: number;
  daily_loss_limit: number;
  max_spread: number;
  default_lot_size: number;
  default_sl_pips: number;
  default_tp_pips: number;
  trade_alerts: boolean;
  signal_notifications: boolean;
  ea_status_updates: boolean;
}

function DeleteAccountDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setDeleting(false);
    toast.success("Account deletion requested");
    onClose();
    setConfirmText("");
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-[#090F1E] border border-[#131E32] rounded-lg p-6 w-full max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6" style={{ color: "#FF4560" }} />
            <h2 className="text-[18px] font-bold" style={{ color: "#FF4560" }}>Delete Account</h2>
          </div>
          <p className="text-[12px] mb-4" style={{ color: "#8899BB" }}>
            This action cannot be undone. All your data, including trading history, strategies, and deployments will be permanently deleted.
          </p>
          <div className="mb-4">
            <label className="text-[11px] font-mono uppercase" style={{ color: "#8899BB" }}>
              Type DELETE to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full mt-1 px-3 py-2 rounded bg-[#0C1525] border border-[#131E32] text-[12px] text-[#EEF2FF] placeholder:text-[#3F5070]"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 text-[11px] font-mono rounded border"
              style={{ borderColor: "#131E32", color: "#8899BB" }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={confirmText !== "DELETE" || deleting}
              className="flex-1 px-3 py-2 text-[11px] font-mono font-bold rounded"
              style={{ 
                backgroundColor: confirmText === "DELETE" ? "#FF4560" : "#3F5070", 
                color: "#fff",
                opacity: confirmText === "DELETE" ? 1 : 0.5,
              }}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Delete Account"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [showSaved, setShowSaved] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: prefsData, isLoading, error } = useQuery({
    queryKey: ["preferences"],
    queryFn: () => apiGet<{ preferences: UserPreferences }>("/api/v1/onboarding/preferences"),
    retry: 1,
  });

  const preferences = prefsData?.data?.preferences;

  // Show default preferences if not logged in or error
  const defaultPreferences: UserPreferences = {
    risk_per_trade: 1.0,
    daily_loss_limit: 5.0,
    max_spread: 30,
    default_lot_size: 0.01,
    default_sl_pips: 50,
    default_tp_pips: 100,
    trade_alerts: true,
    signal_notifications: true,
    ea_status_updates: true,
  };

  const displayPrefs = preferences || defaultPreferences;

  const saveMutation = useMutation({
    mutationFn: (data: Partial<UserPreferences>) => 
      apiPut("/api/v1/onboarding/preferences", data),
    onSuccess: () => {
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
      queryClient.invalidateQueries({ queryKey: ["preferences"] });
    },
    onError: () => {
      toast.error("Failed to save preferences");
    },
  });

  const handleChange = (field: keyof UserPreferences, value: number | boolean) => {
    if (!displayPrefs) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveMutation.mutate({ [field]: value });
    }, 1000);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#C9A84C" }} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[26px] font-bold tracking-[2px]" style={{ color: "#EEF2FF", fontFamily: "Bebas Neue, sans-serif" }}>
            SETTINGS
          </h1>
          <p className="text-[12px] font-mono mt-1" style={{ color: "#8899BB" }}>
            CONFIGURE YOUR PREFERENCES
          </p>
        </div>
        {showSaved && (
          <div className="flex items-center gap-2 px-3 py-1 rounded" style={{ backgroundColor: "rgba(0,229,160,0.1)", color: "#00E5A0" }}>
            <Check className="w-4 h-4" />
            <span className="text-[11px] font-mono">Saved ✓</span>
          </div>
        )}
      </div>

      <div className="space-y-3 max-w-2xl">
        <div style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
          <div className="text-[10px] font-mono uppercase tracking-[1.5px] mb-4" style={{ color: "#3F5070" }}>
            Risk Management
          </div>
          {[
            { label: "Risk per Trade", key: "risk_per_trade" as const, suffix: "%", step: 0.1, min: 0.1, max: 10 },
            { label: "Daily Loss Limit", key: "daily_loss_limit" as const, suffix: "%", step: 0.5, min: 1, max: 50 },
            { label: "Max Spread", key: "max_spread" as const, suffix: " pips", step: 1, min: 1, max: 100 },
          ].map((item, i) => (
            <div key={item.key} className="flex items-center justify-between py-3" style={{ borderBottom: i < 2 ? "1px solid #131E32" : "none" }}>
              <span className="text-[12px]" style={{ color: "#8899BB" }}>{item.label}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step={item.step}
                  min={item.min}
                  max={item.max}
                  defaultValue={displayPrefs[item.key]}
                  onChange={(e) => handleChange(item.key, parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-1 rounded bg-[#0C1525] border border-[#131E32] text-[12px] font-mono text-right text-[#EEF2FF]"
                />
                <span className="text-[12px] font-mono w-8" style={{ color: "#3F5070" }}>{item.suffix}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
          <div className="text-[10px] font-mono uppercase tracking-[1.5px] mb-4" style={{ color: "#3F5070" }}>
            Trading Settings
          </div>
          {[
            { label: "Default Lot Size", key: "default_lot_size" as const, step: 0.01, min: 0.01, max: 100 },
            { label: "Default SL (pips)", key: "default_sl_pips" as const, step: 1, min: 1, max: 500 },
            { label: "Default TP (pips)", key: "default_tp_pips" as const, step: 1, min: 1, max: 1000 },
          ].map((item, i) => (
            <div key={item.key} className="flex items-center justify-between py-3" style={{ borderBottom: i < 2 ? "1px solid #131E32" : "none" }}>
              <span className="text-[12px]" style={{ color: "#8899BB" }}>{item.label}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step={item.step}
                  min={item.min}
                  max={item.max}
                  defaultValue={displayPrefs[item.key]}
                  onChange={(e) => handleChange(item.key, parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 rounded bg-[#0C1525] border border-[#131E32] text-[12px] font-mono text-right text-[#EEF2FF]"
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
          <div className="text-[10px] font-mono uppercase tracking-[1.5px] mb-4" style={{ color: "#3F5070" }}>
            Notifications
          </div>
          {[
            { label: "Trade Alerts", key: "trade_alerts" as const },
            { label: "Signal Notifications", key: "signal_notifications" as const },
            { label: "EA Status Updates", key: "ea_status_updates" as const },
          ].map((item, i) => (
            <div key={item.key} className="flex items-center justify-between py-3" style={{ borderBottom: i < 2 ? "1px solid #131E32" : "none" }}>
              <span className="text-[12px]" style={{ color: "#8899BB" }}>{item.label}</span>
              <button
                onClick={() => handleChange(item.key, !displayPrefs[item.key])}
                className="relative w-12 h-6 rounded-full transition-colors"
                style={{ 
                  backgroundColor: displayPrefs[item.key] ? "#00E5A0" : "#131E32",
                }}
              >
                <span
                  className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
                  style={{ 
                    left: displayPrefs[item.key] ? "26px" : "4px",
                  }}
                />
              </button>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
          <div className="text-[10px] font-mono uppercase tracking-[1.5px] mb-4" style={{ color: "#3F5070" }}>
            Danger Zone
          </div>
          <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid #131E32" }}>
            <div>
              <div className="text-[12px]" style={{ color: "#EEF2FF" }}>Delete Account</div>
              <div className="text-[10px]" style={{ color: "#3F5070" }}>Permanently delete your account and all data</div>
            </div>
            <button 
              onClick={() => setShowDeleteDialog(true)}
              className="px-3 py-2 text-[11px] font-mono rounded border"
              style={{ borderColor: "#FF4560", color: "#FF4560" }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <DeleteAccountDialog 
        open={showDeleteDialog} 
        onClose={() => setShowDeleteDialog(false)} 
      />
    </DashboardLayout>
  );
}
