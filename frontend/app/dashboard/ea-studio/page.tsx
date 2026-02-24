"use client";

import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { EAEditor } from "@/components/dashboard/ea/EAEditor";
import { TemplateGrid } from "@/components/dashboard/ea/TemplateGrid";
import { EALibrary } from "@/components/dashboard/ea/EALibrary";
import { useEAStore } from "@/stores";

const templates: Record<string, string> = {
  "ma-cross": "Create a trend following EA using 10/20 EMA crossover on M15. Risk 1%, 20 pip SL, 40 pip TP.",
  "rsi-rev": "Build mean reversion strategy with RSI oversold/overbought on H1. Enter at RSI 30/70, 15 pip SL, 30 pip TP.",
  "bb-squeeze": "Implement Bollinger Bands squeeze breakout on M5. Trade breakout with 25 pip SL and 50 pip TP.",
  "breakout": "Create range breakout EA tracking yesterday's high/low. Enter on breakout, 30 pip SL, 60 pip TP.",
  "scalp-m1": "Build M1 scalper using EMA 9/21 with fast entries. Risk 0.5%, 10 pip SL, 20 pip TP.",
  "grid": "Implement grid system with 20 pip spacing. Average down up to 5 levels, close all at profit.",
};

export default function EAStudioPage() {
  const [activeTab, setActiveTab] = useState<"generate" | "editor" | "library">("generate");
  const { setGeneratedCode } = useEAStore();

  const handleTemplateSelect = (templateId: string) => {
    const description = templates[templateId];
    if (description) {
      const textarea = document.getElementById("eaStratDesc") as HTMLTextAreaElement;
      if (textarea) {
        textarea.value = description;
      }
    }
  };

  const handleGenerate = () => {
    const textarea = document.getElementById("eaStratDesc") as HTMLTextAreaElement;
    if (textarea?.value) {
      setGeneratedCode(`// Generated EA based on: ${textarea.value.slice(0, 50)}...
// This is a placeholder - integrate with GLM-5 API for real code generation

#property copyright "ForexElite Pro 2026"
#property version   "1.00"
#property strict

input double InpLots = 0.01;
input int    InpMagic = 12345;
input int    InpSlippage = 3;

int OnInit() { return(INIT_SUCCEEDED); }
void OnDeinit(const int reason) {}
void OnTick() { 
  // Strategy implementation
}` + "\n");
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[26px] font-bold tracking-[2px]" style={{ color: "#EEF2FF", fontFamily: "Bebas Neue, sans-serif" }}>
              EA STUDIO
            </h1>
            <p className="text-[12px] font-mono mt-1" style={{ color: "#8899BB" }}>
              MQL5 EDITOR · LIBRARY · AI GENERATION — POWERED BY GLM-5
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono px-2 py-1 rounded" style={{ backgroundColor: "rgba(201,168,76,0.12)", color: "#C9A84C" }}>
              GLM-5
            </span>
            <button className="px-3 py-2 text-[11px] font-mono font-bold rounded" style={{ backgroundColor: "#C9A84C", color: "#040810" }}>
              + New EA
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-3" style={{ borderBottom: "1px solid #131E32", paddingBottom: "10px" }}>
        {[
          { id: "generate", label: "⚡ Generate" },
          { id: "editor", label: "📝 Editor" },
          { id: "library", label: "📦 EA Library" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className="text-[10px] font-mono px-3 py-2 rounded transition-colors"
            style={{
              backgroundColor: activeTab === tab.id ? "rgba(201, 168, 76, 0.12)" : "transparent",
              border: `1px solid ${activeTab === tab.id ? "#7A6130" : "transparent"}`,
              color: activeTab === tab.id ? "#C9A84C" : "#3F5070",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "generate" && (
        <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="space-y-3">
            <div style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase tracking-[1.5px]" style={{ color: "#3F5070" }}>
                  Strategy Description
                </span>
                <span className="text-[9px] font-mono" style={{ color: "#C9A84C" }}>GLM-5</span>
              </div>
              <textarea
                id="eaStratDesc"
                className="w-full h-[110px] p-3 rounded text-[13px] resize-none"
                style={{ backgroundColor: "#0C1525", border: "1px solid #131E32", color: "#EEF2FF" }}
                placeholder="Describe your trading strategy in plain English..."
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-[9.5px] font-mono" style={{ color: "#3F5070" }}>0 / 2000 chars</span>
                <button
                  onClick={handleGenerate}
                  className="px-4 py-2 text-[11px] font-mono font-bold rounded"
                  style={{ backgroundColor: "#C9A84C", color: "#040810" }}
                >
                  Generate MQL5
                </button>
              </div>
            </div>
            <TemplateGrid onSelect={handleTemplateSelect} />
          </div>
          <EAEditor />
        </div>
      )}

      {activeTab === "editor" && (
        <div style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
          <div className="flex items-center justify-between mb-3">
            <input
              type="text"
              value="Untitled_EA.mq5"
              className="text-[11px] font-mono px-2 py-1 rounded"
              style={{ backgroundColor: "#0C1525", border: "1px solid #131E32", color: "#EEF2FF", minWidth: "160px" }}
            />
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-[10px] font-mono rounded border" style={{ borderColor: "#131E32", color: "#8899BB" }}>✎ Edit</button>
              <button className="px-3 py-1.5 text-[10px] font-mono rounded border" style={{ borderColor: "#131E32", color: "#8899BB" }}>💾 Save</button>
              <button className="px-3 py-1.5 text-[10px] font-mono rounded" style={{ backgroundColor: "#C9A84C", color: "#040810" }}>⛶ Full Page</button>
            </div>
          </div>
          <textarea
            className="w-full h-[400px] p-4 font-mono text-[12px] rounded"
            style={{ backgroundColor: "#020509", border: "1px solid #131E32", color: "#EEF2FF", resize: "none" }}
            placeholder="// Open a file from the EA Library or paste code here..."
          />
        </div>
      )}

      {activeTab === "library" && (
        <EALibrary />
      )}
    </DashboardLayout>
  );
}
