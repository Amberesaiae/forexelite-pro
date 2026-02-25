"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEAStore, type EAVersion } from "@/stores";
import { apiGet, apiPatch, apiPost } from "@/lib/api";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface EAEditorProps {
  projectId?: string | null;
  versionId?: string | null;
  onVersionChange?: (versionId: string) => void;
}

export function EAEditor({ projectId, versionId, onVersionChange }: EAEditorProps) {
  const queryClient = useQueryClient();
  const { 
    generatedCode, 
    setGeneratedCode, 
    editorContent, 
    setContent, 
    isDirty, 
    setDirty,
    lockState,
    setLock,
    activeProjectId,
    activeVersionId,
    setVersion 
  } = useEAStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isFullPage, setIsFullPage] = useState(false);
  const [showDirtyConfirm, setShowDirtyConfirm] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentProjectId = projectId ?? activeProjectId;
  const currentVersionId = versionId ?? activeVersionId;

  const { data: versionsData } = useQuery({
    queryKey: ['ea-versions', currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) return { versions: [] };
      const res = await apiGet<{ versions: EAVersion[] }>(`/api/v1/ea/projects/${currentProjectId}/versions`);
      return res.data ?? { versions: [] };
    },
    enabled: !!currentProjectId,
  });

  const versions = versionsData?.versions ?? [];

  const { data: currentVersion } = useQuery({
    queryKey: ['ea-version', currentVersionId],
    queryFn: async () => {
      if (!currentVersionId) return null;
      const res = await apiGet<EAVersion>(`/api/v1/ea/versions/${currentVersionId}`);
      return res.data ?? null;
    },
    enabled: !!currentVersionId,
  });

  const saveMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!currentVersionId) return;
      await apiPatch(`/api/v1/ea/versions/${currentVersionId}`, { source_code: content });
    },
    onSuccess: () => {
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ['ea-version', currentVersionId] });
    },
    onError: () => {
      toast.error("Failed to save");
    },
  });

  const handleEditorChange = useCallback((value: string | undefined) => {
    const newContent = value ?? '';
    setContent(newContent);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    if (currentVersionId) {
      saveTimeoutRef.current = setTimeout(() => {
        saveMutation.mutate(newContent);
      }, 800);
    }
  }, [currentVersionId, setContent, saveMutation]);

  useEffect(() => {
    if (currentVersion?.sourceCode && !isDirty) {
      setContent(currentVersion.sourceCode);
      setGeneratedCode(currentVersion.sourceCode);
    }
  }, [currentVersion, isDirty, setContent, setGeneratedCode]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullPage) {
        if (isDirty) {
          setPendingClose(true);
          setShowDirtyConfirm(true);
        } else {
          setIsFullPage(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullPage, isDirty]);

  const handleCloseFullPage = () => {
    if (isDirty) {
      setPendingClose(true);
      setShowDirtyConfirm(true);
    } else {
      setIsFullPage(false);
    }
  };

  const confirmClose = () => {
    setDirty(false);
    setShowDirtyConfirm(false);
    if (pendingClose) {
      setIsFullPage(false);
      setPendingClose(false);
    }
  };

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

  const displayCode = editorContent || generatedCode || sampleCode;
  const currentVersionNumber = currentVersion?.versionNumber;

  return (
    <>
      <Card style={{ backgroundColor: "#090F1E", borderColor: "#131E32" }}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-[10px] font-mono uppercase tracking-[1.5px]" style={{ color: "#3F5070" }}>
                MQL5 Code
              </CardTitle>
              {!displayCode && (
                <span className="text-[9px] font-mono" style={{ color: "#3F5070" }}>
                  — empty
                </span>
              )}
              {currentVersionNumber && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(201,168,76,0.12)", color: "#C9A84C" }}>
                  v{currentVersionNumber}
                </span>
              )}
              {isDirty && (
                <span className="text-[9px] font-mono" style={{ color: "#C9A84C" }}>●</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {versions.length > 0 && (
                <select
                  value={currentVersionId ?? ''}
                  onChange={(e) => {
                    setVersion(e.target.value);
                    onVersionChange?.(e.target.value);
                  }}
                  className="text-[9px] font-mono px-2 py-1 rounded"
                  style={{ backgroundColor: "#0C1525", border: "1px solid #131E32", color: "#EEF2FF" }}
                >
                  <option value="">Select version</option>
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      v{v.versionNumber} ({v.status})
                    </option>
                  ))}
                </select>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px]"
                style={{ color: "#8899BB", border: "1px solid #131E32" }}
                onClick={() => {
                  const blob = new Blob([displayCode], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'ea.mq5';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                ↓ .mq5
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px]"
                style={{ color: "#8899BB", border: "1px solid #131E32" }}
                onClick={() => setIsFullPage(true)}
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
                onClick={() => {
                  if (currentVersionId) {
                    saveMutation.mutate(editorContent);
                  }
                }}
                disabled={!isDirty || saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Saving...' : '💾 Save'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[9px]"
                style={{ color: lockState === 'locked' ? "#FF4560" : "#00E5A0" }}
                onClick={() => setLock(lockState === 'locked' ? 'unlocked' : 'locked')}
              >
                {lockState === 'locked' ? "🔓 Unlocked" : "🔒 Locked"}
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

            {lockState === 'locked' && (
              <div
                className="px-3 py-1.5 text-[9.5px] font-mono"
                style={{ backgroundColor: "rgba(255, 69, 96, 0.1)", color: "#FF4560", borderBottom: "1px solid #FF4560" }}
              >
                🔒 FILE LOCKED — unlock to make changes
              </div>
            )}

            <div style={{ height: '220px' }}>
              <MonacoEditor
                height="100%"
                language="cpp"
                theme="vs-dark"
                value={displayCode}
                onChange={handleEditorChange}
                options={{
                  minimap: { enabled: false },
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 13,
                  readOnly: lockState === 'locked',
                  automaticLayout: true,
                }}
              />
            </div>

            <div
              className="flex items-center gap-2 px-3 py-1.5 text-[9px] font-mono"
              style={{ backgroundColor: "#090F1E", borderTop: "1px solid #131E32", color: "#3F5070" }}
            >
              <span>Ln 1, Col 1</span>
              <span>MQL5</span>
              <span>UTF-8</span>
              {isDirty && <span className="text-[#C9A84C]">Unsaved changes</span>}
            </div>
          </div>

          <CompileButton versionId={currentVersionId} />
        </CardContent>
      </Card>

      {isFullPage && (
        <div className="fixed inset-0 z-[5000] bg-[#040810]">
          <div className="flex items-center justify-between px-4 py-2" style={{ backgroundColor: "#090F1E", borderBottom: "1px solid #131E32" }}>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono uppercase tracking-[1.5px]" style={{ color: "#3F5070" }}>
                MQL5 Editor
              </span>
              {currentVersionNumber && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(201,168,76,0.12)", color: "#C9A84C" }}>
                  v{currentVersionNumber}
                </span>
              )}
              {isDirty && <span className="text-[9px] font-mono" style={{ color: "#C9A84C" }}>● Unsaved</span>}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[10px]"
              style={{ color: "#8899BB" }}
              onClick={handleCloseFullPage}
            >
              ✕ Close (Esc)
            </Button>
          </div>
          <div style={{ height: 'calc(100vh - 48px)' }}>
            <MonacoEditor
              height="100%"
              language="cpp"
              theme="vs-dark"
              value={displayCode}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 14,
                readOnly: lockState === 'locked',
                automaticLayout: true,
              }}
            />
          </div>
        </div>
      )}

      {showDirtyConfirm && (
        <div className="fixed inset-0 z-[5001] flex items-center justify-center bg-black/50">
          <div className="rounded-lg p-6" style={{ backgroundColor: "#090F1E", border: "1px solid #131E32" }}>
            <h3 className="text-[14px] font-semibold mb-2" style={{ color: "#EEF2FF" }}>
              Unsaved Changes
            </h3>
            <p className="text-[12px] mb-4" style={{ color: "#8899BB" }}>
              You have unsaved changes. Do you want to discard them?
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDirtyConfirm(false)}
                style={{ color: "#8899BB" }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={confirmClose}
                style={{ backgroundColor: "#FF4560", color: "#fff" }}
              >
                Discard
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CompileButton({ versionId }: { versionId: string | null | undefined }) {
  const queryClient = useQueryClient();

  const { data: version } = useQuery({
    queryKey: ['ea-version', versionId],
    queryFn: async () => {
      if (!versionId) return null;
      const res = await apiGet<EAVersion>(`/api/v1/ea/versions/${versionId}`);
      return res.data ?? null;
    },
    enabled: !!versionId,
  });

  const isCompiling = version?.status === 'compiling';

  const compileMutation = useMutation({
    mutationFn: async () => {
      if (!versionId) return;
      await apiPost(`/api/v1/ea/versions/${versionId}/compile`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ea-version', versionId] });
    },
    onError: (err: unknown) => {
      const error = err as { error?: { detail?: string } };
      toast.error(error?.error?.detail ?? "Compilation failed");
    },
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCompiling && versionId) {
      interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['ea-version', versionId] });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isCompiling, versionId, queryClient]);

  const isCompiled = version?.status === 'compiled';
  const isFailed = version?.status === 'failed';

  return (
    <div className="flex items-center gap-2 mt-3">
      <Button
        className="h-8 text-[10px]"
        style={{ backgroundColor: isCompiling ? "#131E32" : "#C9A84C", color: isCompiling ? "#8899BB" : "#040810" }}
        disabled={!versionId || isCompiling || isCompiled}
        onClick={() => compileMutation.mutate()}
      >
        {isCompiling ? (
          <>
            <span className="animate-spin mr-2">⟳</span>
            Compiling...
          </>
        ) : isCompiled ? (
          '✓ Compiled'
        ) : isFailed ? (
          'Compilation Failed'
        ) : (
          'Compile .ex5'
        )}
      </Button>
      <Button
        className="h-8 text-[10px]"
        style={{ backgroundColor: "#131E32", color: isCompiled ? "#00E5A0" : "#8899BB", opacity: isCompiled ? 1 : 0.4 }}
        disabled={!isCompiled}
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
  );
}
