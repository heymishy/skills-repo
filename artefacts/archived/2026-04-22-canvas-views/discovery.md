# Discovery: Canvas artefact relationship views

**Feature slug:** 2026-04-22-canvas-views
**Discovery date:** 2026-04-22
**Status:** Approved — proceeding to short-track

---

## Problem

The pipeline dashboard presents features as flat cards. This is useful for status at a glance but hides the hierarchical and sequential structure that product managers, BAs, and architects care about. Three types of question are regularly asked that the current dashboard cannot answer visually:

1. **Sequencing** — "What order do stories deliver value? Which ones unlock others?" (story map, timeline)
2. **Hierarchy** — "How do epics, stories, ACs, test plans, and DoR documents nest inside a feature?" (tree view)
3. **Dependencies and relationships** — "Which artefacts exist / are missing? Which stories are blocked by upstream work?" (dependency graph / coverage matrix)

Existing PM tools (Jira, Miro) require manual re-entry of pipeline data. Because pipeline-state.json already contains the authoritative structure, these views can be derived automatically with no manual maintenance burden.

## Users

- **Product manager** — needs story map and timeline to communicate delivery sequencing to stakeholders and executives
- **Business analyst** — needs tree view to verify artefact completeness: "has every story got a test plan and a DoR?"
- **Architect / tech lead** — needs dependency view to understand which stories can run in parallel vs which must sequence
- **Platform operator** — needs coverage matrix to spot missing artefacts before a sprint starts

## MVP scope (four views, one canvas page)

### View 1 — Story Map (swimlane)
User activities (epics) as horizontal swimlane headers. Stories within each epic arranged left-to-right by pipeline stage. Cards show story slug, name, stage badge, and DoD status. Inspired by Jeff Patton story map model. Read from `pipeline-state.json`.

### View 2 — Artefact Tree
Collapsible tree: Feature → Epic → Story → Artefacts (story.md, test-plan, DoR, DoD). Each leaf node shows whether the artefact exists (green tick) or is missing (amber dash). Clicking a leaf opens the document in a drawer/reader panel.

### View 3 — Timeline / Sequencing
Horizontal timeline with features on the Y axis and pipeline stages as columns. Stories plotted as horizontal bars spanning from their first stage to their current stage. Colour-coded by health/status. Shows velocity at a glance.

### View 4 — Dependency Graph
Force-directed or hierarchical graph where nodes are stories and edges are upstream/downstream dependencies declared in the story artefact. Blocked nodes highlighted in red. Shows which stories can start now vs are waiting.

### Shell: `dashboards/canvas.html`
- Single page with a tab bar switching between the four views
- Loads `pipeline-state.json` using the same dual-URL pattern as `review.html`
- Clicking any story card or tree node opens a side panel reading the artefact markdown (reusing `ArtefactFetcher` and `md-renderer.js`)
- No external charting libraries — pure SVG/CSS layout

## Constraints

- No external npm dependencies — pure browser HTML/CSS/JS with React 18 + Babel standalone from CDN
- Must work on Live Server and GitHub Pages (relative fetch paths)
- SVG layout computed in-browser from pipeline-state.json data — no server-side rendering
- Must pass all existing governance tests (`npm test`)

## Short-track rationale

Dashboard extension. Clear ACs, no unknowns, no external dependencies. ADR-011 governs dashboard behavioural changes. Artefact chain committed before implementation.
