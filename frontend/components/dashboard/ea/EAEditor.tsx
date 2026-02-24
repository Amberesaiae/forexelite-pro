"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEAStore } from "@/stores";

interface EAEditorProps {
  onGenerate?: (description: string) => void;
}

export function EAEditor({ onGenerate }: EAEditorProps) {
  const { generatedCode, setGeneratedCode } = useEAStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLocked, setIsLocked] = useState(true);

  const sampleCode = `// ForexElite Pro — EA Studio
// Generated EA will appear here
// Powered by GLM-5

#property copyright "ForexElite Pro 2026"
#property version   "1.00"
#property strict

// Input parameters
input double Lots = 0.01;
input int    MagicNumber = 12345;
input int    Slippage = 3;

// Your generated EA code here...`;

  const displayCode = generatedCode || sampleCode;

  return (
    <Card style={{ backgroundColor: "#090F1E", borderColor: "#131E32" }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-[10px] font-mono uppercase tracking-[1.5px]" style={{ color: "#3F5070" }}>
              MQL5 Code
            </CardTitle>
            {!generatedCode && (
              <span className="text-[9px] font-mono" style={{ color: "#3F5070" }}>
                — empty
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[10px]"
              style={{ color: "#8899BB", border: "1px solid #131E32" }}
              onClick={() => {}}
            >
              ↓ .mq5
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[10px]"
              style={{ color: "#8899BB", border: "1px solid #131E32" }}
              onClick={() => {}}
            >
              ⛶ Full Editor
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          className="relative"
          style={{
            backgroundColor: "#020509",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ backgroundColor: "#090F1E", borderBottom: "1px solid #131E32" }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[9px]"
              style={{ color: isEditing ? "#C9A84C" : "#8899BB" }}
              onClick={() => setIsEditing(!isEditing)}
            >
              ✎ Edit Mode
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[9px]"
              style={{ color: "#8899BB" }}
              onClick={() => {}}
            >
              💾 Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[9px]"
              style={{ color: isLocked ? "#FF4560" : "#00E5A0" }}
              onClick={() => setIsLocked(!isLocked)}
            >
              {isLocked ? "🔓 Unlocked" : "🔒 Locked"}
            </Button>
            <div className="h-4 w-px" style={{ backgroundColor: "#131E32" }} />
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[9px] ml-auto"
              style={{ color: "#8899BB" }}
              onClick={() => navigator.clipboard.writeText(displayCode)}
            >
              Copy
            </Button>
          </div>

          {isLocked && (
            <div
              className="px-3 py-1.5 text-[9.5px] font-mono"
              style={{ backgroundColor: "rgba(255, 69, 96, 0.1)", color: "#FF4560", borderBottom: "1px solid #FF4560" }}
            >
              🔒 FILE LOCKED — unlock to make changes
            </div>
          )}

          <pre
            className="p-4 font-mono text-[11.5px] leading-relaxed overflow-x-auto"
            style={{
              color: isLocked ? "#8899BB" : "#EEF2FF",
              minHeight: "220px",
              maxHeight: "320px",
              overflowY: "auto",
            }}
            contentEditable={!isLocked}
            suppressContentEditableWarning
          >
            {displayCode}
          </pre>

          <div
            className="flex items-center gap-2 px-3 py-1.5 text-[9px] font-mono"
            style={{ backgroundColor: "#090F1E", borderTop: "1px solid #131E32", color: "#3F5070" }}
          >
            <span>Ln 1, Col 1</span>
            <span>MQL5</span>
            <span>UTF-8</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Button
            className="h-8 text-[10px]"
            style={{ backgroundColor: "#131E32", color: "#8899BB", opacity: 0.4 }}
            disabled
          >
            Compile .ex5
          </Button>
          <Button
            className="h-8 text-[10px]"
            style={{ backgroundColor: "#131E32", color: "#8899BB", opacity: 0.4 }}
            disabled
          >
            Deploy to MT5
          </Button>
          <Button
            className="h-8 text-[10px]"
            style={{ backgroundColor: "#131E32", color: "#8899BB", opacity: 0.4 }}
            disabled
          >
            Save to Library
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
