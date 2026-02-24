import { create } from 'zustand';

export interface EAProject {
  id: string;
  name: string;
  currentVersionId?: string;
  versionCount?: number;
  latestStatus?: string;
}

export interface EAVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  sourceCode: string;
  status: 'draft' | 'compiling' | 'compiled' | 'failed';
}

export interface EAStore {
  activeProjectId: string | null;
  activeVersionId: string | null;
  editorContent: string;
  isDirty: boolean;
  lockState: 'locked' | 'unlocked';
  generatedCode: string;
  
  setProject: (projectId: string | null) => void;
  setVersion: (versionId: string | null) => void;
  setContent: (content: string) => void;
  setDirty: (dirty: boolean) => void;
  setLock: (lock: 'locked' | 'unlocked') => void;
  setGeneratedCode: (code: string) => void;
}

export const useEAStore = create<EAStore>()((set) => ({
  activeProjectId: null,
  activeVersionId: null,
  editorContent: '',
  isDirty: false,
  lockState: 'unlocked',
  generatedCode: '',
  
  setProject: (projectId) => set({ activeProjectId: projectId }),
  setVersion: (versionId) => set({ activeVersionId: versionId }),
  setContent: (content) => set({ editorContent: content, isDirty: true }),
  setDirty: (dirty) => set({ isDirty: dirty }),
  setLock: (lockState) => set({ lockState }),
  setGeneratedCode: (code) => set({ generatedCode: code }),
}));
