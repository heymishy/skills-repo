# Discovery: Dashboard full-screen markdown editor

**Feature slug:** 2026-04-22-dashboard-md-editor
**Discovery date:** 2026-04-22
**Status:** Approved — proceeding to short-track

---

## Problem

Non-technical stakeholders (product managers, business analysts, auditors) need to read and edit pipeline artefact documents. The current dashboard renders artefacts in a 520px-wide side drawer. This is adequate for quick reference but cramped for serious reading or editing. Opening VS Code to edit markdown is a barrier for non-engineers — the interface is unfamiliar and the file-system structure is opaque.

A full-screen markdown editor in the browser removes this barrier: the same artefact documents can be read comfortably and edited without leaving the browser or touching VS Code.

## Users

- **Non-technical stakeholder** — reads and comments on discovery, story, and DoR artefacts as they are produced. Currently redirected to VS Code or raw GitHub file views.
- **Platform operator** — occasionally edits a discovery or decision doc mid-session without switching windows.

## MVP scope

- A full-screen overlay editor triggered from the existing `ArtefactDrawer` in `dashboards/pipeline.html`
- Left pane: editable `<textarea>` with the markdown source (monospace, comfortable)
- Right pane: live-rendered preview (re-renders on every keystroke with a short debounce)
- Toolbar: filename breadcrumb, Copy (copies current markdown to clipboard), Download (saves as `.md` file), close (× button and Escape key)
- No backend required — save is copy-to-clipboard or browser download; this is a read-mostly tool for a static GitHub Pages site

## Constraints

- No external dependencies — uses the existing `window.renderMarkdown` from `md-renderer.js`
- No save-to-server functionality (static site — copy/download are the export paths)
- Must pass all existing governance checks (`npm test`)

## Short-track rationale

Dashboard behavioural change as defined in ADR-011. Artefact-first rule applies — artefact chain committed before implementation. Short-track appropriate: single story, clear ACs, no unknowns.
