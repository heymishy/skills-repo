# Story: dr.1 — Pipeline review page for non-technical stakeholders

**Story ID:** dr.1
**Feature:** 2026-04-22-dashboard-review
**Epic:** Non-technical stakeholder tooling
**Status:** DoD complete

---

## User story

As a product manager or business analyst
I want a dedicated review page in the pipeline dashboard
So that I can read artefacts, verify stage readiness, and advance features through stages without editing files or using developer tooling

---

## Acceptance criteria

**AC1 — Two-column layout:**
The page renders a left panel (feature/document tree) and a right panel (markdown reader). Selecting a document from the left opens it in the right panel.

**AC2 — Pipeline state loading:**
The page loads `pipeline-state.json` using a dual-URL candidate strategy (same-directory copy first, then `../.github/pipeline-state.json`) so it works on both GitHub Pages and Live Server.

**AC3 — Feature and document tree:**
Each feature card in the left panel shows: slug, name, stage badge, collapse/expand toggle. Under each feature: links to Discovery, Benefit metric, and NFR Profile. Under each story: links to Story `.md`, Test plan, DoR, and DoD artefacts.

**AC4 — Markdown reader:**
Clicking a document renders it using `window.renderMarkdown` in the right panel with the same typographic styles as `index.html` (Source Serif 4 serif, correct heading hierarchy, table, code block, blockquote styles).

**AC5 — Edit overlay:**
An "Edit" button in the reader header opens `MdEditorOverlay` (split source/preview, copy, download). Closing the overlay retains any edits in the reader state. When `review-server.js` is running (server online), a "Save" button is visible in the overlay toolbar that writes the edited content back to disk via `POST /save`. The Save button shows transient labels: "Saving…" while in-flight, "Saved ✓" on success (2 s), "Error" on failure (2.5 s). When the server is offline the Save button is hidden; copy and download remain available.

**AC6 — Advance stage button:**
Each feature with a next stage shows an "Advance → {next stage}" button. When `review-server.js` is running (server online), clicking it `POST`s to `http://localhost:3131/advance` and reloads the state on success. When the server is offline, it shows an `AdvanceModal` with exact edit instructions and a copy-to-clipboard fallback.

**AC7 — Server health badge:**
A badge in the page header shows "server online" or "server offline". It polls `GET /health` on `review-server.js` every 10 seconds and updates without page reload.

**AC8 — companion server exists:**
`scripts/review-server.js` exists and is a valid Node.js script (no external dependencies). It exposes `GET /health`, `POST /advance`, `POST /save`, and `GET /*` static serving from the repo root.

**AC9 — Atomic state write:**
`review-server.js` writes to `pipeline-state.json` atomically: writes to a `.tmp` file then calls `fs.renameSync` to replace the target. A partial write must not corrupt the state file.

**AC10 — Path traversal protection:**
`review-server.js` static file handler rejects any request whose resolved file path does not start with `REPO_ROOT`. Requests outside the repo root return 403.

**AC11 — Save artefact to disk:**
`POST /save` in `review-server.js` accepts `{ filePath, content }` and writes the file. Security constraints: only files under `artefacts/` may be written; only `.md` extension is accepted; the parent directory must already exist; paths that fail the `artefacts/` prefix check return 403. The write is atomic (temp file → `renameSync`). `review.html` calls this endpoint via `callSave(filePath, content)` and the result is reflected immediately in the reader view.

**AC12 — Site-wide navigation bar:**
All four dashboard pages (`index.html`, `pipeline.html`, `review.html`, `canvas.html`) include a consistent `<nav className="site-nav">` navigation bar. The bar uses CSS class `.site-nav` (defined in `extra-views.css` and inline in `review.html`). The current page's link carries the `active` class. All four pages link to each other: Pipeline (index.html), Feature (pipeline.html), Review (review.html), Canvas (canvas.html).

---

## Out of scope

- Bulk stage advance for multiple features at once
- Mobile-optimised layout (responsive CSS is sufficient for now)

---

## Technical notes

- Uses React 18 + Babel standalone (no build step) — same pattern as `index.html` and `pipeline.html`
- `review-server.js` uses only Node.js `http`, `fs`, and `path` — zero npm dependencies
- CORS headers (`Access-Control-Allow-Origin: *`) required on all server responses so Live Server (port 5500) can call `localhost:3131`
