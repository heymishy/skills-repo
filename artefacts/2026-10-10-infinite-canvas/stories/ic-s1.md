## Story: Render journey stages as connected nodes on a drawflow canvas, replacing the linear list

**Epic reference:** artefacts/2026-10-10-infinite-canvas/epics/canvas-replacement-for-journey-stages.md
**Discovery reference:** artefacts/2026-10-10-infinite-canvas/discovery.md
**Benefit-metric reference:** artefacts/2026-10-10-infinite-canvas/benefit-metric.md
**Domain:** [web-ui]

## User Story

As an **outer loop practitioner (PO / SME / discovery lead)**,
I want **the journey canvas's Canvas tab to render my journey's stages as spatially-arranged, connected nodes instead of a linear list**,
So that **I have a real spatial artefact to work from and judge, rather than a prose description of what a canvas would look like**.

## Benefit Linkage

**Metric moved:** M2 — Operator CX judgment vs. the list view
**How:** This story is the first concrete, real artefact the operator can actually see and use — without it, there is nothing to form a CX judgment against. It also establishes the rendering foundation M1 (spatial layout usage) depends on in ic-s2.

## Architecture Constraints

- **ADR-001** (`decisions.md`): use drawflow.js, served via a dedicated route mirroring `handleMermaidAsset()` in `src/web-ui/routes/public.js` — real `package.json` dependency, read from `node_modules` at request time, gzip + in-memory cache, no bundler. This story is what ADR-001 materializes into real code.
- The `/vendor/drawflow.min.js` and `/vendor/drawflow.min.css` routes are unauthenticated static assets — same trust level as the existing `/vendor/mermaid.min.js` route (`csd-s1`), no session/tenant data involved.
- **ADR-025**: no new tenant-scoping concern introduced here — this story only changes rendering of data `handleGetJourneyCanvas` already fetches tenant-scoped.

## Dependencies

- **Upstream:** None — first story in the epic (walking skeleton's own thinnest end-to-end slice).
- **Downstream:** ic-s2 (free positioning), ic-s3 (pan/zoom), ic-s4 (keyboard movement) all build directly on this story's rendering.

## Acceptance Criteria

**AC1:** Given a journey with 3 stages, When the operator opens the Canvas tab, Then each stage renders as a drawflow node (not a list row), initially positioned left-to-right in the stage's existing `position` order, with a connecting line auto-drawn from each stage to the next in sequence.

**AC2:** Given a stage node, When the operator views it, Then it displays the stage's name, an "Edit stage" link, a "Map feature" button, and its health indicator (✅ / ⚠️ / ❌, per `ep3-s2`) exactly as the prior linear-list view did — no existing per-stage action is missing, relocated in a way that breaks it, or behaves differently.

**AC3:** Given a stage flagged `moment_of_truth`, When its node renders, Then the 🚩 Moment of truth badge still appears on the node, matching today's behaviour.

**AC4:** Given a journey with 0 stages, When the operator opens the Canvas tab, Then it shows "No stages yet. Add your first stage." (unchanged from today) rather than an empty or broken canvas.

**AC5:** Given a request to `/vendor/drawflow.min.js` or `/vendor/drawflow.min.css`, When the server receives it, Then it responds 200 with the asset read directly from `node_modules/drawflow/dist/` at request time (gzip-encoded when the client advertises support, in-memory cached thereafter), mirroring `handleMermaidAsset()`'s exact pattern — zero bundler or build step anywhere in the response path.

**AC6:** Given the canvas has rendered, When the browser loads the page, Then `window.Drawflow` is confirmed defined before any node-rendering code runs (fail loudly, not silently, if the asset failed to load) — matching this repo's own existing mermaid-load-guard convention (`csd-s1`'s `window.mermaid` check in `skills.js`).

## Out of Scope

- **Free node dragging/repositioning** — nodes render at a fixed, deterministic initial layout in this story; dragging and position persistence are `ic-s2`.
- **Canvas pan/zoom** — `ic-s3`.
- **Keyboard-accessible node movement** — `ic-s4`.
- **Manual connection-drawing** — epic-level out of scope; connections are always auto-derived from stage sequence, never operator-drawn.

## NFRs

- **Performance:** Rendering a journey with up to 20 stages (a generous upper bound given no journey in this codebase today has more than a handful) completes within the same perceived load time as the current list view — no added network round-trip beyond the one-time `/vendor/` asset fetches, which are cached after first load.
- **Security:** No new input surface — this story only changes rendering of already-fetched, already-tenant-scoped data. The `/vendor/` asset routes carry no session or tenant data.
- **Accessibility:** Each node's existing actions (Edit stage, Map feature) remain reachable and labelled exactly as today — this story does not regress any existing accessibility property of the list view. Full keyboard operability of node *positioning* specifically is `ic-s4`'s own scope, not this story's.
- **Audit:** None — no new mutating action in this story.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
