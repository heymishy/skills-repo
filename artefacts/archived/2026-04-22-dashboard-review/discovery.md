# Discovery: Pipeline review dashboard for non-technical stakeholders

**Feature slug:** 2026-04-22-dashboard-review
**Discovery date:** 2026-04-22
**Status:** Approved — proceeding to short-track

---

## Problem

Product managers, business analysts, and other non-technical stakeholders need to review pipeline artefacts and advance features through pipeline stages without opening VS Code or editing JSON files directly. The current dashboard (`pipeline.html`) is read-only and presents a flat card grid — there is no way to browse artefacts by story, read full markdown documents, or trigger a stage transition without a developer making a manual file edit.

The gap is especially visible at stage gates: a PM should be able to open a review page, read the story and DoR artefacts, confirm they look right, and advance the feature to the next stage — all from a browser tab, with no tooling knowledge required.

## Users

- **Product manager** — reads stories, DoR documents, and test plans before sign-off. Currently redirected to VS Code or raw GitHub file views.
- **Business analyst / auditor** — spot-checks artefacts at key stage gates (review, DoR, DoD). Needs a stable URL they can bookmark or share.
- **Platform operator** — occasionally uses the review page to trigger a stage advance during a live session without switching to a terminal.

## MVP scope

- A standalone `dashboards/review.html` page that loads `pipeline-state.json` and presents a two-column layout: left panel = feature and document tree; right panel = markdown reader
- Per-feature: stage badge, collapse/expand, links to Discovery, Benefit metric, NFR Profile docs
- Per-story: links to Story `.md`, Test plan, DoR, and DoD artefacts
- Markdown reader: renders the selected document using `md-renderer.js`; includes an Edit button that opens `MdEditorOverlay` (copy/download only — no server write)
- Advance stage: "Advance → {next stage}" button that `POST`s to `http://localhost:3131/advance` when `review-server.js` is running; falls back to a manual-instructions modal with copy-to-clipboard when the server is offline
- Companion `scripts/review-server.js`: pure Node.js `http` server, port 3131, `GET /health`, `POST /advance` (atomic JSON write), `GET /*` static file serving from repo root, CORS headers for Live Server compatibility
- Server health badge: polls `GET /health` every 10 seconds; displays "server online/offline"
- Dark/light theme toggle respecting `prefers-color-scheme`
- Works on Live Server without the companion server (read-only mode)

## Constraints

- No external runtime dependencies for the companion server — pure Node.js built-in modules only
- Dashboard page must work on Live Server (relative fetch paths, dual-URL pipeline-state loader)
- `review-server.js` must guard against directory traversal (`path.startsWith(REPO_ROOT)`)
- Atomic write: temp file + `fs.renameSync` to avoid partial writes on the state JSON

## Short-track rationale

Dashboard feature with clear ACs, no unknowns, no external dependencies. Artefact-first rule applies — chain committed before or alongside implementation. ADR-011 governs dashboard behavioural changes.
