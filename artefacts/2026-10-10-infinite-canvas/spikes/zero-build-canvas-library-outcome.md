# Spike Outcome: Zero-build node-graph library feasibility

**Opened:** 2026-10-10 | **Scope:** Standard (up to 6 steps) | **Steps taken:** 6 (core investigation) + extended comparison requested by operator after the done condition was met
**Done condition met:** Yes — all 4 criteria confirmed live in a browser, not inferred from docs
**Artefact path:** `artefacts/2026-10-10-infinite-canvas/spikes/zero-build-canvas-library-outcome.md`

---

## Outcome: PROCEED

### What was found

A real local prototype was built: Cytoscape.js installed in a scratch directory, served via a Node route mirroring `handleMermaidAsset`'s exact pattern (`fs.readFileSync` from `node_modules`, in-memory gzip cache, plain `<script src>`), rendering a 2-node graph in a browser with zero bundler step.

Confirmed live:
1. **Free node positioning** — a node dragged to an arbitrary screen position stayed exactly there, no auto-layout snap-back.
2. **Canvas-level pan/zoom** — scroll-wheel zoom confirmed via `cy.zoom()` changing from `1.0` to `1.71`; drag-to-pan confirmed via `cy.pan()` changing from `{-483.98, -262.86}` to `{-849.98, -308.86}`.
3. **Interactive node-to-node connection** — the underlying mechanism (`cy.add({data:{source,target}})`) works and renders correctly. However, building the *drag-to-connect* gesture directly against Cytoscape core hit real event-ordering friction in 4 separate attempts (naive shift+drag, `ungrabify()` fix, synthetic right-click events on 2 different canvas layers) — none fired reliably. The standard library-level answer, `cytoscape-edgehandles`, was also installed and inspected: its bundle has **2 runtime dependencies (`lodash.memoize`, `lodash.throttle`) published as CommonJS-only** (no browser UMD build) — they fail the zero-build test as published.
4. **Zero-build serving** — Cytoscape core itself: 425KB minified, zero transitive dependencies, proper UMD bundle (`dist/cytoscape.min.js`, also its own `unpkg`/`jsdelivr` entry point) — passes cleanly.

**At the operator's request, drawflow.js (the other candidate named in `/clarify`) was given the identical, equally rigorous test** — this went beyond the spike's own planned scope (6 steps) but was cheap and directly decision-relevant, so it was run rather than deferred. Confirmed live:
1. Free node positioning — confirmed (node moved to exact dragged position, connection line followed dynamically).
2. Canvas pan/zoom — confirmed, though zoom requires `Ctrl+scroll` by the library's own deliberate design (not plain scroll, to avoid accidental zoom during page scroll). `editor.zoom` changed `1.0` → `1.1`; `editor.canvas_x/y` changed `{0,0}` → `{-183,-46}`.
3. **Interactive connection-drawing — built in, first-class.** Worked correctly on the first attempt, zero custom code: visible output/input connector dots render automatically on each node; dragging from one to the other created a real connection and rendered a bezier edge, reported via the library's own `connectionCreated` event.
4. Zero-build serving — confirmed: `dist/drawflow.min.js` (46KB — smaller than Cytoscape's own 425KB), zero transitive dependencies, proper UMD bundle. Also has its own `dist/drawflow.min.css` (a small additional asset Cytoscape doesn't need, since Cytoscape renders purely to canvas).

### Reasoning

Cytoscape.js is a general-purpose graph visualization/analysis library; interactive node-to-node connection-drawing is a secondary concern it delegates to a plugin, and that plugin doesn't meet this platform's own zero-build bar. drawflow.js is a purpose-built visual flow/node editor — connection-drawing between nodes is its literal reason to exist, not a bolted-on feature. The MVP's own scope (sharpened by the operator during `/clarify`: "node positioning + pan/zoom + node-to-node connections") is drawflow's native use case, not Cytoscape's. drawflow also has a smaller, fully self-contained footprint (46KB, zero dependencies at every layer, vs. Cytoscape's clean core but problematic extension path).

---

## If PROCEED

**Unblocked stage:** `/definition` for `2026-10-10-infinite-canvas`.
**Conditions:**
- **Recommended library: drawflow.js**, not Cytoscape.js (the `/clarify`-narrowed field named both as candidates; this spike's own extended comparison, run at the operator's request, found drawflow is the materially better fit for this MVP's specific scope).
- Zoom interaction must use `Ctrl+scroll`, matching drawflow's own built-in convention — this is a minor, confirmed UX detail `/definition` should carry into its own ACs, not an open question.
- drawflow's own `dist/drawflow.min.css` stylesheet must also be served via the same zero-build pattern (a second small asset route, same technique) — not just the JS bundle.

---

## What remains unknown

- drawflow's own snap-to-grid keyboard-accessible interaction mode (committed via `/clarify` for WCAG 2.1 AA) was not tested in this spike — the library's own keyboard support, if any, needs checking during `/definition`; a custom keyboard handler may be needed regardless, matching the already-committed interaction model.
- Node position persistence (the `position_x`/`position_y` columns on `customer_journey_stages`, per `/clarify`) was not exercised against drawflow's own coordinate system/export format — `/definition` should confirm drawflow's node position data maps cleanly to that schema.
- Multi-tenant/ADR-025 scoping of canvas data was not touched by this spike (out of scope, correctly — this is a backend concern, not a library-choice concern).
- Nothing material about the core zero-build feasibility question itself remains unknown — that question is fully answered.

---

## Discovery fields resolved

| Discovery field | Changed? | Updated value / clarification |
|-----------------|----------|-------------------------------|
| Problem statement | No | Unchanged |
| MVP scope | No | Unchanged — library choice doesn't change what's being built, only how |
| Assumptions | Yes | The remaining unresolved `[ASSUMPTION]` from `/clarify` (zero-build library feasibility) is now resolved: PROCEED, with drawflow.js named as the specific library (narrower than `/clarify`'s own "Cytoscape.js or drawflow.js-class" framing) |
| Known risks | Yes | New, scoped-down risk note: the originally-flagged "not every library ships a clean bundle" risk is now resolved favourably for drawflow specifically — but Cytoscape's own extension path (`cytoscape-edgehandles`) is confirmed to NOT meet the zero-build bar, worth recording so a future contributor doesn't re-attempt that path without re-reading this outcome. Also recorded: the operator's broader desire to make `definition-canvas`'s story map and mermaid diagrams more directly editable is a genuine but SEPARATE future need — drawflow is not a good technical fit for either surface (story map's value is structured grid grouping, which a free-form library works against; mermaid is AI-authored/auto-laid-out and drawflow has no auto-layout engine, which would mean building one from scratch — the exact investment `2026-08-29-diagram-validation-and-types` already rejected). Logged in `capture-log.md`, not scoped as a story. |
| Technical constraints | Yes | The npm-relaxation constraint's own stated condition (follow the mermaid/csd-s1 integration pattern) is confirmed achievable for drawflow.js specifically |

**Discovery re-run needed?**
- [x] No — findings clarify details within the existing framing

---

## Decision log reference

See `artefacts/2026-10-10-infinite-canvas/decisions.md` — new entry to be appended recording this PROCEED outcome and the drawflow.js recommendation.
