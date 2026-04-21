# Story: me.1 — Dashboard full-screen markdown editor

**Story ID:** me.1
**Feature:** 2026-04-22-dashboard-md-editor
**Epic:** Dashboard non-technical access
**Status:** DoR signed-off

---

## User story

As a non-technical stakeholder
I want a full-screen markdown editor in the pipeline dashboard
So that I can read and edit artefact documents comfortably in the browser without opening VS Code

---

## Acceptance criteria

**AC1 — Editor trigger button:**
An "Edit" button (or icon) is present in the `ArtefactDrawer` header whenever a markdown artefact is loaded. Clicking it opens the full-screen editor overlay.

**AC2 — Full-screen overlay:**
The editor opens as a `position:fixed` overlay covering the full viewport (`inset:0`) with a `z-index` above all other dashboard elements.

**AC3 — Edit / Preview panes:**
The overlay shows two panes side-by-side on desktop: left pane is a `<textarea>` containing the raw markdown source; right pane shows the live-rendered HTML preview. On narrow viewports (< 700 px) the panes stack vertically.

**AC4 — Live preview:**
Typing in the textarea updates the rendered preview in real time (debounced ≤ 300 ms).

**AC5 — Copy button:**
A "Copy" button in the editor toolbar copies the current textarea content to the clipboard via `navigator.clipboard.writeText`. On success the button label changes to "Copied!" for 1.5 s.

**AC6 — Download button:**
A "Download .md" button in the editor toolbar triggers a browser download of the current textarea content as a `.md` file with the artefact filename (e.g. `discovery.md`).

**AC7 — Close without data loss:**
Pressing the × close button or the Escape key closes the overlay and returns focus to the drawer. The markdown content in the textarea at close time is retained in the drawer's `md` state so the drawer still shows the artefact (potentially with edits applied to the rendered view).

**AC8 — File path label:**
The editor toolbar displays the artefact file path (the relative path used to fetch the file, e.g. `2026-04-22-dashboard-md-editor/discovery.md`) so the user knows which file they are viewing/editing.

**AC9 — Accessible close:**
The Escape key closes the editor overlay (keyboard-accessible).

**AC10 — Governance test:**
`tests/check-me1-dashboard-editor.js` exists and passes. It checks: (1) the pipeline.html file contains the editor overlay element marker, (2) the file contains "Copy" button text, (3) the file contains "Download" button text, (4) the file contains the Escape key handler, (5) the extra-views.css file contains `md-editor-overlay` style rule.

---

## Out of scope

- Saving changes back to the GitHub repository (requires a backend or GitHub API integration — deferred)
- Syntax highlighting in the textarea (external library dependency — deferred)
- Mobile-specific toolbar layout (CSS responsive stacking is sufficient for now)

---

## Technical notes

- Implemented as a React functional component `MdEditorOverlay` inside `dashboards/pipeline.html` (inline Babel transpiled, no build step)
- `ArtefactDrawer` gains a local `useState` for `editorOpen` (boolean) and `editorMd` (current content)
- On open: `editorMd` is seeded from the drawer's current `md` state
- On close: if `editorMd` !== original `md`, the drawer `md` state is updated so the rendered view reflects any edits
- CSS in `dashboards/extra-views.css` under `.md-editor-overlay`
- Download uses `URL.createObjectURL` + `<a download>` pattern (no external lib)
