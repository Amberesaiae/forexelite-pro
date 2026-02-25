# T08 — EA Studio Wiring: Monaco Editor, GLM-5 Generation & Library

## Overview

Wire the EA Studio page to the real backend. Currently the page uses a `<textarea>`, generates placeholder code locally, and has no project/version management.

**Files to modify:**
- `file:frontend/app/dashboard/ea-studio/page.tsx`
- `file:frontend/components/dashboard/ea/EAEditor.tsx`
- `file:frontend/components/dashboard/ea/EALibrary.tsx`

---

## Part 1 — Replace `<textarea>` with Monaco Editor

**In `file:frontend/components/dashboard/ea/EAEditor.tsx`:**

Replace the `<textarea>` with `@monaco-editor/react`:
```tsx
import dynamic from 'next/dynamic';
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
```

Configuration:
- Language: `cpp` (closest to MQL5 syntax highlighting)
- Theme: `vs-dark`
- Font: JetBrains Mono, 13px
- Options: `minimap: { enabled: false }`, `wordWrap: 'on'`, `scrollBeyondLastLine: false`

**Full-page overlay:** The "⛶ Full Page" button in the Editor tab opens a `fixed inset-0 z-[5000]` overlay with the Monaco editor filling the viewport. `Escape` key closes it. If `isDirty` is true, show a confirmation before closing.

---

## Part 2 — Generate Tab Wiring

**Project selector:** Dropdown at the top of the Generate tab showing all projects from `GET /ea/projects`. "New Project" option creates a project via `POST /ea/projects`.

**Generate button flow:**
1. Validate description is not empty
2. Show 7-step progress indicator (Analyzing → Designing → Generating → Optimizing → Validating → Formatting → Complete)
3. Call `POST /ea/generate` with `{ project_id, description }`
4. On success: populate Monaco editor with returned `source_code`, update `eaStore.activeVersionId`, show version badge (e.g. "v2")
5. On error: show toast with error message

**Version dropdown:** In the editor toolbar, show a `<select>` with all versions for the active project (fetched from `GET /ea/projects` which includes version list). Switching versions loads that version's `source_code` into the editor.

**Auto-save:** 800ms debounce after any editor change → `PATCH /ea/versions/{id}` with current content. Show unsaved dot (●) in the tab title when `isDirty`. Clear dot on successful save.

**Unsaved changes guard:** `beforeunload` event listener when `isDirty` is true. Show browser confirmation dialog on page navigation.

---

## Part 3 — Compile Button

In the Editor tab toolbar:
1. "Compile" button calls `POST /ea/versions/{id}/compile`
2. Button shows spinner and "Compiling…" text
3. Poll `GET /ea/versions/{id}` every 2 seconds until `status` is `"compiled"` or `"failed"`
4. On `"compiled"`: show green toast "Compiled successfully ✓", enable "Deploy" button
5. On `"failed"`: show red toast with error message from job output

---

## Part 4 — Library Tab Wiring

**`file:frontend/components/dashboard/ea/EALibrary.tsx`:**

Replace mock data with `useQuery(() => apiGet('/api/v1/ea/projects'))`.

**Each library card shows:**
- EA name, version count, latest status badge (draft/compiled/running)
- ⋯ context menu with: Edit, Duplicate, Download `.mq5`, Delete

**Context menu actions:**
- **Edit:** Load version source code into Editor tab, switch to Editor tab. If `isDirty`, show warning dialog first.
- **Duplicate:** Call `POST /ea/projects/{id}/duplicate`, refetch list, show toast "Duplicated as '{name} (copy)'"
- **Download:** Call `GET /ea/versions/{id}/artifacts`, open signed URL in new tab
- **Delete:** Confirmation dialog → `DELETE /ea/projects/{id}`. If `ea_running` error: show "Stop the running EA before deleting"

**Import .mq5 button:** File input (`.mq5` only) → `POST /ea/import` (multipart form). On success: refetch library, show toast.

**Running EA warning banner:** If `lockState === 'locked'` (set when the active project has a running deployment), show a gold banner: "⚠️ This EA is currently running. Changes will create a new version and won't affect the running deployment."

---

## Acceptance Criteria

- [ ] Monaco Editor renders with MQL5-like syntax highlighting (cpp mode)
- [ ] Full-page overlay opens on "⛶ Full Page" and closes on Escape
- [ ] Generate tab shows project selector and creates new projects
- [ ] GLM-5 generation shows 7-step progress and populates editor on success
- [ ] Version dropdown shows all versions; switching loads correct source code
- [ ] Auto-save fires 800ms after typing stops; unsaved dot appears/disappears correctly
- [ ] Page navigation with unsaved changes shows browser confirmation
- [ ] Compile button polls until done and shows success/failure toast
- [ ] Library tab shows real projects from backend (not mock data)
- [ ] ⋯ menu: Edit, Duplicate, Download, Delete all work correctly
- [ ] Import .mq5 uploads file and adds to library
- [ ] Running EA warning banner appears when `lockState === 'locked'`