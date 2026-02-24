# FW3 — EA Studio Wiring: Monaco Editor, GLM-5 Generation, Versioning & Library Management

## What

Replace the textarea-based EA editor with Monaco Editor, wire the Generate tab to the real GLM-5 backend, implement version history, and wire all library management actions (rename, duplicate, import, delete).

## Scope

**Monaco Editor integration**
- Replace `<textarea>` in `file:frontend/components/dashboard/ea/EAEditor.tsx` with `@monaco-editor/react`
- Dynamic import with `next/dynamic` (`ssr: false`) to avoid SSR issues
- Language: `cpp` (closest MQL5 approximation), theme: `vs-dark`
- Editor options: `minimap: {enabled: false}`, `fontSize: 12`, `lineNumbers: "on"`, `scrollBeyondLastLine: false`
- On change: call `eaStore.setContent(value)` + `eaStore.setDirty(true)` + debounce 800ms → `PATCH /ea/versions/{activeVersionId}` (auto-save)
- Unsaved dot: show `●` in tab title when `eaStore.isDirty`

**Full-page editor overlay**
- "⛶ Full Page" button in Editor tab toolbar → renders Monaco in `position: fixed, inset: 0, z-index: 5000, bg: #020509`
- Same toolbar (file name, Edit/Save/Lock/Close) + action row (Compile, Deploy, Download, Save to Library)
- `Escape` key closes overlay; warns if unsaved changes

**Generate tab wiring**
- On "Generate MQL5" click:
  1. Disable button + show 7-step animated progress overlay (steps: Parsing strategy → Designing logic → Writing indicators → Building entry rules → Adding risk management → Optimising code → Finalising MQL5)
  2. `POST /ea/generate {project_id, description}` (60s timeout)
  3. On success: set `eaStore.setVersion(version_id)` + `setContent(source_code)` + `setDirty(false)` + update version dropdown
  4. On error: dismiss overlay + sonner toast with error
- Version dropdown in toolbar: `GET /ea/projects/{id}` → list versions → switching version loads that version's `source_code`
- Regenerating auto-creates new version (v1 → v2); old version accessible in dropdown

**Compile button wiring**
- "Compile .ex5" → `POST /ea/versions/{id}/compile` → returns `{job_id}`
- Poll `GET /ea/versions/{id}` every 2s until `status = "compiled"` or `"failed"` (max 5 min)
- While polling: button shows spinner + "Compiling…"
- On `compiled`: button turns green + "✓ Compiled" for 3s → re-enables
- On `failed`: shadcn Dialog with compiler error output from `jobs.error_message`

**Running EA warning banner**
- When `eaStore.lockState = "locked"` and active version has a running deployment: show gold banner "This EA is running live. Saving creates a new version — running deployment unaffected."

**Library tab wiring**
- `GET /ea/projects` → render real EA cards (replace mock data)
- ⋯ dropdown actions:
  - **Rename**: inline edit on card name → `PATCH /ea/projects/{id} {name}` → `queryClient.invalidate(['ea-projects'])`
  - **Duplicate**: `POST /ea/projects/{id}/duplicate` → toast "Duplicated as '{name} (copy)'" → open in Editor tab
  - **Download .mq5**: `GET /ea/versions/{id}/artifacts` → signed URL → `window.open(url)`
  - **Delete**: shadcn AlertDialog "Delete '{name}'? This cannot be undone." → `DELETE /ea/projects/{id}` → remove card with slide-out animation; if 409 → toast "Stop the running EA before deleting"
- **Import .mq5**: file input (accept `.mq5`) → `POST /ea/import` (multipart) → toast "Imported successfully" → card appears in library

**Page navigation guard**
- `useBeforeUnload` hook: if `eaStore.isDirty`, show browser "Leave site?" dialog

## Acceptance Criteria
- Monaco Editor renders with MQL5 syntax highlighting (cpp approximation)
- Auto-save fires 800ms after last keystroke; unsaved dot appears immediately on edit
- Generate tab: 7-step progress overlay plays; real MQL5 code appears in editor on success
- Version dropdown shows all versions; switching loads correct source code
- Compile button polls until done; compiler error dialog shows on failure
- Library: all 4 ⋯ actions work; import adds card to library
- Full-page overlay opens/closes; Escape key closes with unsaved-changes warning

## Spec References
- `spec:8faa0447-2e35-4cc5-9096-0cbce32ae00a/76c33f97-1068-4ba4-9b1d-7d25ebd911bd` — Flow 3 (EA Generation), Flow 3b (EA Library Management)
- `spec:8faa0447-2e35-4cc5-9096-0cbce32ae00a/ff9b5702-f7bb-4863-b80f-475ca098bc44` — Tech Plan §3 (EA Studio State, GLM-5 Service)

## Dependencies
`ticket:8faa0447-2e35-4cc5-9096-0cbce32ae00a/BK4`, `ticket:8faa0447-2e35-4cc5-9096-0cbce32ae00a/FW2`