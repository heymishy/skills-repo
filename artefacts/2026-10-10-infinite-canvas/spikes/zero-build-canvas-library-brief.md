# Spike Brief: Zero-build node-graph library feasibility

**Feature:** 2026-10-10-infinite-canvas
**Discovery reference:** artefacts/2026-10-10-infinite-canvas/discovery.md
**Date:** 2026-10-10
**Confirmed by:** Hamish King — Platform Owner

---

## Parent discovery context

- **Problem statement:** No free-form, Miro-style spatial canvas exists anywhere in this platform — every existing "canvas" either auto-lays-out from AI-generated mermaid text, or constrains placement to a fixed grid.
- **Assumption this spike tests:** "The chosen library can be served using the exact same zero-build pattern mermaid uses (real npm dependency, served via a dedicated runtime-read route, loaded via a plain `<script src>`, no webpack/bundler step) — unconfirmed. This is the single biggest technical risk."
- **Known risk this spike may resolve or confirm:** The original journey discovery (`2026-10-05-customer-journey-as-first-class/discovery.md`) named "the visual journey canvas" as this platform's single highest-complexity UI risk. Revisiting it with a free-form canvas is a harder problem than what shipped instead.
- **Open question the discovery/clarify author flagged:** Library candidate field was narrowed via `/clarify` to purpose-built node-graph libraries (Cytoscape.js / drawflow.js-class), but final selection was explicitly deferred to this spike.

---

## Spike question

Can a purpose-built node-graph library (Cytoscape.js, or a comparable drawflow.js-class alternative) be served via this platform's proven zero-build integration pattern — real npm dependency, served from `node_modules` via a dedicated runtime-read route, loaded via a plain `<script src>`, no bundler/webpack step — the same pattern already used for mermaid (`csd-s1`)?

## Blocking

`/definition` for `2026-10-10-infinite-canvas` — cannot write concrete node/connection interaction ACs without knowing the library's real API, and cannot lock the npm-relaxation constraint (discovery's own Constraints section) without confirming its one stated condition actually holds.

## Type

1 — Technical feasibility

## Scope

**Standard** (up to 6 steps) — a real local prototype, not documentation review alone:
1. Install the candidate library in a scratch directory (not this repo's `package.json` — that's `/definition`'s own implementation step if this spike proceeds)
2. Confirm it ships a pre-built browser bundle (inspect the installed package's `dist`/equivalent)
3. Write a minimal Node route mirroring `handleMermaidAsset`'s exact pattern (`fs.readFileSync` from `node_modules`, in-memory cache, gzip)
4. Write a minimal HTML page loading the bundle via a plain `<script src>`, with a 2-node, 1-edge graph
5. Serve it locally and open it
6. Verify the done condition's 4 criteria live in a browser

## Done condition

A working local proof demonstrating all of the following, live in a browser — not inferred from docs:
1. Two nodes can each be **dragged to an arbitrary free position** (no auto-layout snapping them back)
2. The **whole canvas** can be **panned and zoomed** (not just individual nodes moving)
3. A **connection between the two nodes can be drawn interactively** by dragging from one node to the other (not just pre-declared in config) — the actual "Miro-like" bar, distinct from a static auto-laid-out diagram like mermaid
4. All of the above loads via the library's pre-built bundle served through a route mirroring `handleMermaidAsset` exactly, loaded with a plain `<script src>`, zero bundler step

## Out of scope

Freehand connection-drawing/sketching UX beyond node-to-node edges (already out of scope in the parent discovery), persistence/backend wiring, final visual styling, or a deep drawflow.js comparison unless Cytoscape.js itself fails the zero-build test.

## Outcome options

- **PROCEED:** Library confirmed — name it in discovery/decisions as the chosen library, clear to start `/definition`.
- **REDESIGN:** Zero-build fails but a workaround exists (a different library, or a one-time build step after all).
- **DEFER:** No viable library found within scope — park the feature.
