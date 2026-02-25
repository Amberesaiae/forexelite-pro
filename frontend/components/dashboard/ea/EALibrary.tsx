"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { useEAStore, type EAProject, type EAVersion } from "@/stores";

interface EALibraryProps {
  onEdit?: (project: EAProject) => void;
  onSelect?: (projectId: string) => void;
}

export function EALibrary({ onEdit, onSelect }: EALibraryProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; projectId: string } | null>(null);
  const { lockState } = useEAStore();

  const { data, isLoading } = useQuery({
    queryKey: ['ea-projects'],
    queryFn: async () => {
      const res = await apiGet<{ projects: EAProject[] }>('/api/v1/ea/projects');
      return res.data ?? { projects: [] };
    },
  });

  const projects = data?.projects ?? [];

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiPost<{ project: EAProject }>('/api/v1/ea/import', formData as unknown as undefined, {
        headers: {},
      });
      return res;
    },
    onSuccess: () => {
      toast.success("EA imported successfully");
      queryClient.invalidateQueries({ queryKey: ['ea-projects'] });
    },
    onError: (err: unknown) => {
      const error = err as { error?: { detail?: string } };
      toast.error(error?.error?.detail ?? "Failed to import EA");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      await apiDelete(`/api/v1/ea/projects/${projectId}`);
    },
    onSuccess: () => {
      toast.success("EA deleted");
      queryClient.invalidateQueries({ queryKey: ['ea-projects'] });
    },
    onError: (err: unknown) => {
      const error = err as { error?: { detail?: string } };
      toast.error(error?.error?.detail ?? "Failed to delete EA");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const res = await apiPost<{ project: EAProject }>(`/api/v1/ea/projects/${projectId}/duplicate`);
      return res;
    },
    onSuccess: () => {
      toast.success("EA duplicated");
      queryClient.invalidateQueries({ queryKey: ['ea-projects'] });
    },
    onError: (err: unknown) => {
      const error = err as { error?: { detail?: string } };
      toast.error(error?.error?.detail ?? "Failed to duplicate EA");
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.mq5')) {
      importMutation.mutate(file);
    } else if (file) {
      toast.error("Please select a .mq5 file");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusStyle = (status?: string) => {
    const styles: Record<string, { bg: string; color: string; border: string }> = {
      compiled: { bg: "rgba(0, 229, 160, 0.1)", color: "#00E5A0", border: "#00E5A0" },
      compiling: { bg: "rgba(201, 168, 76, 0.1)", color: "#C9A84C", border: "#C9A84C" },
      draft: { bg: "rgba(63, 80, 112, 0.1)", color: "#3F5070", border: "#3F5070" },
      failed: { bg: "rgba(255, 69, 96, 0.1)", color: "#FF4560", border: "#FF4560" },
    };
    return styles[status ?? 'draft'] ?? styles.draft;
  };

  const handleContextMenu = (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, projectId });
  };

  const closeContextMenu = () => setContextMenu(null);

  return (
    <>
      {lockState === 'locked' && (
        <div
          className="mb-3 px-3 py-2 rounded text-[11px] font-mono"
          style={{ backgroundColor: "rgba(201,168,76,0.1)", color: "#C9A84C", border: "1px solid #C9A84C" }}
        >
          ⚠️ An EA is currently running. Library operations are restricted.
        </div>
      )}
      <Card style={{ backgroundColor: "#090F1E", borderColor: "#131E32" }}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[10px] font-mono uppercase tracking-[1.5px]" style={{ color: "#3F5070" }}>
              EA Library
            </CardTitle>
            <input
              type="file"
              ref={fileInputRef}
              accept=".mq5"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              size="sm"
              className="h-7 text-[10px]"
              style={{ backgroundColor: "#C9A84C", color: "#040810" }}
              onClick={() => fileInputRef.current?.click()}
              disabled={lockState === 'locked'}
            >
              Import .mq5
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="py-8 text-center">
              <span className="text-[11px]" style={{ color: "#8899BB" }}>Loading...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[11px]" style={{ color: "#8899BB" }}>
                No EAs in library
              </p>
            </div>
          ) : (
            projects.map((project) => {
              const status = getStatusStyle(project.latestStatus);

              return (
                <div
                  key={project.id}
                  className="flex items-center gap-3 p-3 rounded transition-colors cursor-pointer"
                  style={{
                    backgroundColor: "#0C1525",
                    border: "1px solid #131E32",
                    borderLeft: `3px solid ${status.border}`,
                  }}
                  onClick={() => onSelect?.(project.id)}
                  onContextMenu={(e) => handleContextMenu(e, project.id)}
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
                        {project.name}
                      </span>
                      <span
                        className="text-[8px] font-mono px-1.5 py-0.5 rounded capitalize"
                        style={{ ...status }}
                      >
                        {project.latestStatus ?? 'draft'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9.5px] font-mono" style={{ color: "#3F5070" }}>
                        {project.versionCount ?? 0} versions
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      className="text-[9px] font-mono px-2 py-1 rounded border transition-colors"
                      style={{ borderColor: "#131E32", color: "#8899BB", backgroundColor: "transparent" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.(project);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#C9A84C";
                        e.currentTarget.style.color = "#C9A84C";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#131E32";
                        e.currentTarget.style.color = "#8899BB";
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {contextMenu && (
        <>
          <div className="fixed inset-0 z-[4000]" onClick={closeContextMenu} />
          <div
            className="fixed z-[4001] rounded-lg py-1 min-w-[140px]"
            style={{ 
              backgroundColor: "#090F1E", 
              border: "1px solid #131E32",
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            <button
              className="w-full px-3 py-2 text-[10px] text-left hover:bg-[#0C1525]"
              style={{ color: "#EEF2FF" }}
              onClick={() => {
                onEdit?.(projects.find(p => p.id === contextMenu.projectId)!);
                closeContextMenu();
              }}
            >
              Edit
            </button>
            <button
              className="w-full px-3 py-2 text-[10px] text-left hover:bg-[#0C1525]"
              style={{ color: "#EEF2FF" }}
              onClick={() => {
                duplicateMutation.mutate(contextMenu.projectId);
                closeContextMenu();
              }}
            >
              Duplicate
            </button>
            <button
              className="w-full px-3 py-2 text-[10px] text-left hover:bg-[#0C1525]"
              style={{ color: "#EEF2FF" }}
              onClick={() => {
                const project = projects.find(p => p.id === contextMenu.projectId);
                if (project) {
                  const versionsQuery = async () => {
                    const res = await apiGet<{ versions: EAVersion[] }>(`/api/v1/ea/projects/${contextMenu.projectId}/versions`);
                    return res.data?.versions ?? [];
                  };
                  versionsQuery().then(versions => {
                    const latest = versions[0];
                    if (latest) {
                      const blob = new Blob([latest.sourceCode], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${project.name}.mq5`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                  });
                }
                closeContextMenu();
              }}
            >
              Download .mq5
            </button>
            <div className="h-px my-1" style={{ backgroundColor: "#131E32" }} />
            <button
              className="w-full px-3 py-2 text-[10px] text-left hover:bg-[#0C1525]"
              style={{ color: "#FF4560" }}
              onClick={() => {
                deleteMutation.mutate(contextMenu.projectId);
                closeContextMenu();
              }}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </>
  );
}
