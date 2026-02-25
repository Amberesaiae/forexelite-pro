"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { EAEditor } from "@/components/dashboard/ea/EAEditor";
import { TemplateGrid } from "@/components/dashboard/ea/TemplateGrid";
import { EALibrary } from "@/components/dashboard/ea/EALibrary";
import { useEAStore, type EAProject, type EAVersion } from "@/stores";
import { apiGet, apiPost } from "@/lib/api";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const templates: Record<string, string> = {
  "ma-cross": "Create a trend following EA using 10/20 EMA crossover on M15. Risk 1%, 20 pip SL, 40 pip TP.",
  "rsi-rev": "Build mean reversion strategy with RSI oversold/overbought on H1. Enter at RSI 30/70, 15 pip SL, 30 pip TP.",
  "bb-squeeze": "Implement Bollinger Bands squeeze breakout on M5. Trade breakout with 25 pip SL and 50 pip TP.",
  "breakout": "Create range breakout EA tracking yesterday's high/low. Enter on breakout, 30 pip SL, 60 pip TP.",
  "scalp-m1": "Build M1 scalper using EMA 9/21 with fast entries. Risk 0.5%, 10 pip SL, 20 pip TP.",
  "grid": "Implement grid system with 20 pip spacing. Average down up to 5 levels, close all at profit.",
};

const GENERATION_STEPS = [
  { key: 'analyzing', label: 'Analyzing', icon: '🔍' },
  { key: 'designing', label: 'Designing', icon: '📐' },
  { key: 'generating', label: 'Generating', icon: '⚡' },
  { key: 'optimizing', label: 'Optimizing', icon: '🎯' },
  { key: 'validating', label: 'Validating', icon: '✓' },
  { key: 'formatting', label: 'Formatting', icon: '📝' },
  { key: 'complete', label: 'Complete', icon: '✅' },
];

export default function EAStudioPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"generate" | "editor" | "library">("generate");
  const [description, setDescription] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [generationStep, setGenerationStep] = useState(-1);
  
  const { 
    setGeneratedCode, 
    setProject, 
    setVersion, 
    activeProjectId, 
    activeVersionId,
    editorContent,
    isDirty,
    lockState 
  } = useEAStore();

  const { data: projectsData } = useQuery({
    queryKey: ['ea-projects'],
    queryFn: async () => {
      const res = await apiGet<{ projects: EAProject[] }>('/api/v1/ea/projects');
      return res.data ?? { projects: [] };
    },
  });

  const projects = projectsData?.projects ?? [];

  const createProjectMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiPost<{ project: EAProject }>('/api/v1/ea/projects', { name });
      return res;
    },
    onSuccess: (res) => {
      if (res.data?.project) {
        setSelectedProjectId(res.data.project.id);
        setProject(res.data.project.id);
        toast.success("Project created");
      }
      setShowNewProject(false);
      setNewProjectName("");
      queryClient.invalidateQueries({ queryKey: ['ea-projects'] });
    },
    onError: (err: unknown) => {
      const error = err as { error?: { detail?: string } };
      toast.error(error?.error?.detail ?? "Failed to create project");
    },
  });

  const generateMutation = useMutation({
    mutationFn: async ({ projectId, description }: { projectId: string; description: string }) => {
      const res = await apiPost<{ version: EAVersion }>('/api/v1/ea/generate', { project_id: projectId, description });
      return res;
    },
    onSuccess: (res) => {
      if (res.data?.version) {
        setGeneratedCode(res.data.version.sourceCode);
        setVersion(res.data.version.id);
        setActiveTab("editor");
        toast.success(`Generated successfully! (v${res.data.version.versionNumber})`);
      }
    },
    onError: (err: unknown) => {
      const error = err as { error?: { detail?: string } };
      toast.error(error?.error?.detail ?? "Generation failed");
    },
  });

  const handleTemplateSelect = (templateId: string) => {
    const templateDesc = templates[templateId];
    if (templateDesc) {
      setDescription(templateDesc);
    }
  };

  const handleGenerate = () => {
    if (!description.trim()) {
      toast.error("Please enter a strategy description");
      return;
    }

    let projectId = selectedProjectId || activeProjectId;
    
    if (!projectId) {
      if (projects.length > 0) {
        projectId = projects[0].id;
      } else {
        toast.error("Please create a project first");
        return;
      }
    }

    setProject(projectId);
    setGenerationStep(0);

    const stepInterval = setInterval(() => {
      setGenerationStep(prev => {
        if (prev < GENERATION_STEPS.length - 1) {
          return prev + 1;
        }
        clearInterval(stepInterval);
        return prev;
      });
    }, 1200);

    generateMutation.mutate(
      { projectId, description },
      {
        onSettled: () => {
          clearInterval(stepInterval);
          setGenerationStep(-1);
        },
      }
    );
  };

  const handleProjectChange = (projectId: string) => {
    if (projectId === "new") {
      setShowNewProject(true);
    } else {
      setSelectedProjectId(projectId);
      setProject(projectId);
    }
  };

  const handleLibrarySelect = (projectId: string) => {
    setProject(projectId);
    setActiveTab("editor");
  };

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProjectMutation.mutate(newProjectName.trim());
    }
  };

  const getStepProgress = () => {
    if (generationStep < 0) return 0;
    return ((generationStep + 1) / GENERATION_STEPS.length) * 100;
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
            <button 
              className="px-3 py-2 text-[11px] font-mono font-bold rounded" 
              style={{ backgroundColor: "#C9A84C", color: "#040810" }}
              onClick={() => {
                setShowNewProject(true);
              }}
            >
              + New EA
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-3" style={{ borderBottom: "1px solid #131E32", paddingBottom: "10px" }}>
        {[
          { id: "generate", label: activeTab === "generate" && isDirty ? "⚡ Generate ●" : "⚡ Generate" },
          { id: "editor", label: activeTab === "editor" && isDirty ? "📝 Editor ●" : "📝 Editor" },
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
                  Project
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedProjectId || activeProjectId || ""}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="flex-1 text-[11px] font-mono px-3 py-2 rounded"
                  style={{ backgroundColor: "#0C1525", border: "1px solid #131E32", color: "#EEF2FF" }}
                >
                  <option value="">Select project...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                  <option value="new">+ New Project</option>
                </select>
              </div>

              {showNewProject && (
                <div className="mt-3 p-3 rounded" style={{ backgroundColor: "#0C1525", border: "1px solid #131E32" }}>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Project name..."
                    className="w-full text-[11px] font-mono px-3 py-2 rounded mb-2"
                    style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", color: "#EEF2FF" }}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateProject}
                      className="px-3 py-1 text-[10px] font-mono rounded"
                      style={{ backgroundColor: "#C9A84C", color: "#040810" }}
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setShowNewProject(false);
                        setNewProjectName("");
                      }}
                      className="px-3 py-1 text-[10px] font-mono rounded border"
                      style={{ borderColor: "#131E32", color: "#8899BB" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-4 mb-3">
                <span className="text-[10px] font-mono uppercase tracking-[1.5px]" style={{ color: "#3F5070" }}>
                  Strategy Description
                </span>
                <span className="text-[9px] font-mono" style={{ color: "#C9A84C" }}>GLM-5</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-[110px] p-3 rounded text-[13px] resize-none"
                style={{ backgroundColor: "#0C1525", border: "1px solid #131E32", color: "#EEF2FF" }}
                placeholder="Describe your trading strategy in plain English..."
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-[9.5px] font-mono" style={{ color: "#3F5070" }}>{description.length} / 2000 chars</span>
                <button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  className="px-4 py-2 text-[11px] font-mono font-bold rounded"
                  style={{ backgroundColor: generateMutation.isPending ? "#7A6130" : "#C9A84C", color: "#040810" }}
                >
                  {generateMutation.isPending ? 'Generating...' : 'Generate MQL5'}
                </button>
              </div>

              {generationStep >= 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    {GENERATION_STEPS.map((step, idx) => (
                      <div
                        key={step.key}
                        className="flex flex-col items-center"
                        style={{ opacity: idx <= generationStep ? 1 : 0.3 }}
                      >
                        <span className="text-[14px]">{step.icon}</span>
                        <span className="text-[7px] font-mono mt-1" style={{ color: idx === generationStep ? "#C9A84C" : "#3F5070" }}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="h-1 rounded-full" style={{ backgroundColor: "#131E32" }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        backgroundColor: "#C9A84C",
                        width: `${getStepProgress()}%` 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            <TemplateGrid onSelect={handleTemplateSelect} />
          </div>
          <EAEditor projectId={activeProjectId} versionId={activeVersionId} />
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
          <div style={{ height: '400px' }}>
            <MonacoEditor
              height="100%"
              language="cpp"
              theme="vs-dark"
              value={editorContent}
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
        </div>
      )}

      {activeTab === "library" && (
        <EALibrary onSelect={handleLibrarySelect} />
      )}
    </DashboardLayout>
  );
}
