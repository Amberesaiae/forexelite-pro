'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface EAProject {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface EAVersion {
  id: string;
  ea_project_id: string;
  version_number: number;
  status: string;
  created_at: string;
}

interface EAArtifact {
  id: string;
  ea_version_id: string;
  artifact_type: string;
  storage_path: string;
  file_size: number | null;
  checksum: string | null;
}

export default function EALibraryPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<EAProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<EAProject | null>(null);
  const [versions, setVersions] = useState<EAVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<EAVersion | null>(null);
  const [artifacts, setArtifacts] = useState<EAArtifact[]>([]);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewVersionModal, setShowNewVersionModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: projectData } = await supabase
        .from('ea_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      setProjects(projectData || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async (projectId: string) => {
    const { data: versionData } = await supabase
      .from('ea_versions')
      .select('*')
      .eq('ea_project_id', projectId)
      .order('version_number', { ascending: false });

    setVersions(versionData || []);
    setSelectedProject(projects.find(p => p.id === projectId) || null);
    setSelectedVersion(null);
    setArtifacts([]);
  };

  const fetchArtifacts = async (versionId: string) => {
    const { data: artifactData } = await supabase
      .from('ea_artifacts')
      .select('*')
      .eq('ea_version_id', versionId);

    setArtifacts(artifactData || []);
    setSelectedVersion(versions.find(v => v.id === versionId) || null);
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('ea_projects')
        .insert({
          user_id: user.id,
          name: newProjectName,
          description: newProjectDescription || null,
        });

      if (error) throw error;

      setShowNewProjectModal(false);
      setNewProjectName('');
      setNewProjectDescription('');
      fetchProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedVersion) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('artifact_type', file.name.endsWith('.ex5') ? 'ex5' : 'source');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/ea/versions/${selectedVersion.id}/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: formData,
        }
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) throw new Error('Upload failed');

      fetchArtifacts(selectedVersion.id);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const downloadArtifact = async (artifactId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/ea/artifacts/${artifactId}/download`,
        {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to get download URL');

      const data = await response.json();
      window.open(data.download_url, '_blank');
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-500/20 text-gray-400',
      compiling: 'bg-yellow-500/20 text-yellow-400',
      compiled: 'bg-green-500/20 text-green-400',
      failed: 'bg-red-500/20 text-red-400',
      deployed: 'bg-blue-500/20 text-blue-400',
      running: 'bg-purple-500/20 text-purple-400',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-500/20 text-gray-400'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#f5a623] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">EA Library</h1>
            <p className="text-[#9090a8]">Manage your Expert Advisors and strategies</p>
          </div>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="rounded-xl bg-[#f5a623] px-6 py-3 text-sm font-semibold text-[#0f0f1a] hover:bg-[#e09612] transition-all"
          >
            + New Project
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Projects list */}
          <div className="col-span-1">
            <div className="rounded-xl border border-[#2a2a4a] bg-[#16162a] p-4">
              <h2 className="text-lg font-semibold text-foreground mb-4">Projects</h2>
              
              {projects.length === 0 ? (
                <div className="text-center py-8 text-[#9090a8]">
                  No projects yet. Create your first EA project.
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map(project => (
                    <button
                      key={project.id}
                      onClick={() => fetchVersions(project.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedProject?.id === project.id
                          ? 'bg-[#1e1e3f] border border-[#f5a623]/30'
                          : 'hover:bg-[#1e1e3f]'
                      }`}
                    >
                      <div className="font-medium text-foreground">{project.name}</div>
                      <div className="text-xs text-[#9090a8] mt-1">
                        Updated {new Date(project.updated_at).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Versions and artifacts */}
          <div className="col-span-2">
            {selectedProject ? (
              <div className="space-y-6">
                {/* Project header */}
                <div className="rounded-xl border border-[#2a2a4a] bg-[#16162a] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">{selectedProject.name}</h2>
                      {selectedProject.description && (
                        <p className="text-sm text-[#9090a8] mt-1">{selectedProject.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setShowNewVersionModal(true)}
                      className="rounded-lg border border-[#2a2a4a] bg-[#1e1e3f] px-4 py-2 text-sm text-foreground hover:bg-[#2a2a4a] transition-all"
                    >
                      + New Version
                    </button>
                  </div>
                </div>

                {/* Versions list */}
                <div className="rounded-xl border border-[#2a2a4a] bg-[#16162a] p-4">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Versions</h3>
                  
                  {versions.length === 0 ? (
                    <div className="text-center py-6 text-[#9090a8]">
                      No versions yet. Create your first EA version.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {versions.map(version => (
                        <button
                          key={version.id}
                          onClick={() => fetchArtifacts(version.id)}
                          className={`w-full text-left p-3 rounded-lg transition-all flex items-center justify-between ${
                            selectedVersion?.id === version.id
                              ? 'bg-[#1e1e3f] border border-[#f5a623]/30'
                              : 'hover:bg-[#1e1e3f]'
                          }`}
                        >
                          <div>
                            <div className="font-medium text-foreground">
                              v{version.version_number}
                            </div>
                            <div className="text-xs text-[#9090a8] mt-1">
                              {new Date(version.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          {getStatusBadge(version.status)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Artifacts */}
                {selectedVersion && (
                  <div className="rounded-xl border border-[#2a2a4a] bg-[#16162a] p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        Artifacts (v{selectedVersion.version_number})
                      </h3>
                      <label className="cursor-pointer rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-semibold text-[#0f0f1a] hover:bg-[#e09612] transition-all">
                        {uploading ? 'Uploading...' : 'Upload File'}
                        <input
                          type="file"
                          accept=".mq5,.ex5,.zip"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                    </div>

                    {uploading && (
                      <div className="mb-4">
                        <div className="h-2 bg-[#2a2a4a] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#f5a623] transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <div className="text-xs text-[#9090a8] mt-1">Uploading... {uploadProgress}%</div>
                      </div>
                    )}

                    {artifacts.length === 0 ? (
                      <div className="text-center py-6 text-[#9090a8]">
                        No artifacts. Upload your EA source or compiled file.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {artifacts.map(artifact => (
                          <div
                            key={artifact.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-[#1e1e3f]"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[#2a2a4a] flex items-center justify-center">
                                <span className="text-xs text-[#9090a8]">
                                  {artifact.artifact_type.toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-foreground">
                                  {artifact.storage_path.split('/').pop()}
                                </div>
                                <div className="text-xs text-[#9090a8]">
                                  {artifact.file_size ? `${(artifact.file_size / 1024).toFixed(1)} KB` : 'Unknown size'}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => downloadArtifact(artifact.id)}
                              className="text-sm text-[#f5a623] hover:text-[#ffd700] transition-colors"
                            >
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-[#2a2a4a] bg-[#16162a] p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[#1e1e3f] flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#9090a8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Select a Project</h3>
                <p className="text-[#9090a8]">Choose a project from the list to view its versions and artifacts.</p>
              </div>
            )}
          </div>
        </div>

        {/* New Project Modal */}
        {showNewProjectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="rounded-xl border border-[#2a2a4a] bg-[#16162a] p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-foreground mb-4">New EA Project</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#9090a8] mb-2">Project Name</label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="My Trading EA"
                    className="w-full rounded-lg border border-[#2a2a4a] bg-[#0f0f1a] px-4 py-3 text-foreground placeholder-[#9090a8] focus:border-[#f5a623] focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-[#9090a8] mb-2">Description (optional)</label>
                  <textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Describe your EA strategy..."
                    rows={3}
                    className="w-full rounded-lg border border-[#2a2a4a] bg-[#0f0f1a] px-4 py-3 text-foreground placeholder-[#9090a8] focus:border-[#f5a623] focus:outline-none resize-none"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowNewProjectModal(false)}
                  className="rounded-lg border border-[#2a2a4a] bg-[#1e1e3f] px-4 py-2 text-foreground hover:bg-[#2a2a4a] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={createProject}
                  disabled={!newProjectName.trim()}
                  className="rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-semibold text-[#0f0f1a] hover:bg-[#e09612] transition-all disabled:opacity-50"
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New Version Modal */}
        {showNewVersionModal && selectedProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="rounded-xl border border-[#2a2a4a] bg-[#16162a] p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-foreground mb-4">New EA Version</h2>
              
              <p className="text-[#9090a8] mb-4">
                Generate an EA from a template or upload your own source code.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowNewVersionModal(false);
                    // TODO: Open template generator
                  }}
                  className="w-full rounded-lg border border-[#2a2a4a] bg-[#1e1e3f] p-4 text-left hover:bg-[#2a2a4a] transition-all"
                >
                  <div className="font-medium text-foreground">Generate from Template</div>
                  <div className="text-sm text-[#9090a8] mt-1">Create an EA using a pre-built template</div>
                </button>
                
                <button
                  onClick={() => {
                    setShowNewVersionModal(false);
                    // TODO: Open upload dialog
                  }}
                  className="w-full rounded-lg border border-[#2a2a4a] bg-[#1e1e3f] p-4 text-left hover:bg-[#2a2a4a] transition-all"
                >
                  <div className="font-medium text-foreground">Upload Source Files</div>
                  <div className="text-sm text-[#9090a8] mt-1">Upload your own MQL5 source code</div>
                </button>
              </div>
              
              <button
                onClick={() => setShowNewVersionModal(false)}
                className="w-full mt-4 rounded-lg border border-[#2a2a4a] bg-transparent px-4 py-2 text-[#9090a8] hover:bg-[#1e1e3f] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}