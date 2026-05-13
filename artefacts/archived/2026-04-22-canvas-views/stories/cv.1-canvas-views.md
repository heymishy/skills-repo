# Story: cv.1 — Canvas artefact relationship views

**Story ID:** cv.1
**Feature:** 2026-04-22-canvas-views
**Epic:** Pipeline visualisation
**Status:** DoR signed-off

---

## User story

As a product manager, business analyst, or architect
I want a canvas page with multiple hierarchical and relationship views derived from pipeline-state.json
So that I can understand the sequencing, structure, coverage, and dependencies of pipeline artefacts without manually maintaining any external tool

---

## Acceptance criteria

**AC1 — Canvas page exists:**
`dashboards/canvas.html` exists and is a valid HTML page that loads React 18 + Babel from CDN and loads `pipeline-state.json` using the dual-URL candidate strategy.

**AC2 — View tab bar:**
The page has a tab bar allowing the user to switch between at minimum four named views: Story Map, Artefact Tree, Timeline, and Dependency Graph. The active tab is visually distinguished.

**AC3 — Story Map view (Jeff Patton two-dimensional layout):**
The Story Map view implements a proper Jeff Patton story map structure. The horizontal axis (left → right) represents the narrative sequence of Activities (Features) and Tasks (Epics) — the backbone. The vertical axis (top → bottom) represents priority/release order, divided into three horizontal release-slice bands: Shipped/Released (dodStatus=complete), In Flight (stage ∈ dispatched / inner-loop / definition-of-ready / test-plan / review), and Backlog/Planned (all remaining). Each band is visually separated by a horizontal release line with a colour-coded label. Story cards within each band×epic cell show: story ID, story name, and current stage badge. Clicking a story card opens its artefact in the side reader panel. A legend explains the axes and bands. The view reads data from `pipeline-state.json` only — no hardcoded story data.

**AC4 — Artefact Tree view:**
The Artefact Tree view renders a collapsible tree: Feature → Epic → Story → Artefact files (story.md, test-plan, DoR, DoD). Each artefact leaf shows a presence indicator: ✓ (green) if the file can be fetched, − (amber) if fetch returns 404. Clicking a leaf artefact opens the markdown content in a side reader panel.

**AC5 — Timeline view:**
The Timeline view shows features on the Y axis and pipeline stage columns on the X axis. Each story is rendered as a horizontal bar from its first known stage to its current stage. Bars are colour-coded by story health/status (complete = green, in-progress = blue, blocked = red).

**AC6 — Dependency Graph view:**
The Dependency Graph view renders stories as nodes and upstream/downstream dependency relationships (from story artefact `Dependencies` section) as directed edges. Nodes with unmet upstream dependencies are highlighted. The graph uses an SVG layout (force-directed or hierarchical). No external graph library — pure SVG.

**AC7 — Side reader panel:**
Clicking any story card, tree leaf, or graph node opens a side panel that renders the relevant artefact markdown using `window.renderMarkdown`. The panel has a close button. The same panel is reused across all four views.

**AC8 — ← Pipeline navigation:**
The page includes a "← Pipeline" link back to `index.html` in its header.

**AC9 — Live Server compatible:**
The page works correctly when served via VS Code Live Server from the repo root. All artefact file fetches use relative paths via `ArtefactFetcher`. Pipeline state loads via the dual-URL fallback.

**AC10 — Governance test:**
`tests/check-cv1-canvas-views.js` exists and passes. It verifies: (a) `canvas.html` exists, (b) contains `react@18` CDN tag, (c) contains tab labels for all four views, (d) contains `pipeline-state.json` and `../.github/pipeline-state.json` dual-URL strings, (e) contains `renderMarkdown` call, (f) contains `ArtefactFetcher` or `artefact-fetcher.js` reference, (g) contains the Patton story-map backbone structure markers, (h) contains the filter-bar component.

**AC11 — Filter bar:**
A filter bar appears between the tab strip and the canvas area on every view. It provides three filter levels: All (shows all features, count displayed), Programme (one chip per inferred programme — only shown when 2+ distinct programmes exist; programme is inferred from feature slug pattern `YYYY-MM-DD-<programme>[-phase|v|r<n>]` or from an explicit `feature.programme` field), and Feature (one chip per individual feature, slug displayed without date prefix). The active filter chip is visually highlighted. All four views (Story Map, Artefact Tree, Timeline, Dependency Graph) receive and render only the filtered feature set. Selecting a filter does not navigate away or reset the active view.

**AC12 — Filter state persistence:**
The active filter selection is persisted to `localStorage` under the key `cv-filter` (JSON-serialised). On page load the stored value is read back and used as the initial filter state. If the stored value is absent or malformed, the filter defaults to `{ type: 'all' }`.

**AC13 — Filter overflow dropdown:**
When `features.length > 8`, the feature chip group in the filter bar is replaced with an `<input className="filter-search">` text input for searching by slug and a `<select className="filter-select">` dropdown listing matching features. The programme chip group and the All chip are unaffected by overflow mode.

**AC14 — SidePanel edit with save:**
The SidePanel includes an Edit button that opens a full-screen `MdEditorOverlay` component. The overlay shows the Markdown source editor and preview panes, a Copy button, a Download .md button, and — when `review-server.js` is running and `serverUp` is `true` — a Save button that writes the file to disk via `POST /save`. When the server is offline the overlay opens in view-only edit mode (Save button absent). Closing the overlay with Escape or × applies any edits to the in-memory content without saving to disk.

---

## Out of scope

- Editing artefacts from the canvas page (reading only — editing is `review.html`'s responsibility)
- Drag-and-drop reordering of stories on the story map
- Export to image/PDF
- Real-time collaborative viewing

---

## Technical notes

- All four views are React components rendered in the same page — tab switch is a state change, not a page navigation
- Dependency graph: parse `## Dependencies` section of story markdown for upstream/downstream slugs; render as SVG `<line>` + `<circle>` elements
- Artefact presence check: use `ArtefactFetcher.fetch(path)` — treat non-empty response as present, catch/404 as absent; cache results to avoid repeated fetches
- Stage ordering constant (same as `review.html`): `['discovery', 'benefit-metric', 'definition', 'review', 'test-plan', 'definition-of-ready', 'dispatched', 'inner-loop', 'definition-of-done']`
