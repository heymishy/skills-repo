# Spike Output: Zero-build node-graph library feasibility

**Spike:** zero-build-canvas-library
**Parent feature:** 2026-10-10-infinite-canvas
**Discovery artefact:** `artefacts/2026-10-10-infinite-canvas/discovery.md`
**Outcome:** PROCEED
**Output date:** 2026-10-10

---

## Uncertainty addressed

Can a purpose-built node-graph library (Cytoscape.js, or a comparable drawflow.js-class alternative) be served via this platform's proven zero-build integration pattern — real npm dependency, served from `node_modules` via a dedicated runtime-read route, loaded via a plain `<script src>`, no bundler/webpack step — the same pattern already used for mermaid (`csd-s1`)?

---

## Options evaluated

| Option | Description | Pros | Cons | Verdict |
|--------|-------------|------|------|---------|
| Cytoscape.js | General-purpose graph visualization/analysis library | Clean zero-dependency core (425KB), confirmed free-drag + pan/zoom work immediately, widely used/mature | Interactive connection-drawing is NOT built in; the standard extension (`cytoscape-edgehandles`) pulls in 2 CommonJS-only dependencies that fail the zero-build test; a custom connection-drawing implementation hit real event-ordering friction in 4 attempts | ✗ Ruled out (for this MVP's specific scope) |
| drawflow.js | Purpose-built visual flow/node editor | Smaller bundle (46KB), zero dependencies at every layer, interactive connection-drawing built in and confirmed working first-try with zero custom code, visually closer to a flow-editor out of the box | Zoom requires `Ctrl+scroll` by design (minor UX detail, not a blocker); keyboard interaction model not yet tested; has its own small CSS asset to serve alongside the JS | ✓ Recommended |
| Build a fully custom canvas (no library) | Hand-roll positioning/pan/zoom/connections directly on `<canvas>` or SVG | Zero third-party footprint at all | Reimplements a solved problem; the 4 failed connection-drawing attempts against Cytoscape core in this same spike demonstrate this is real, non-trivial engineering effort, not a quick win | ✗ Ruled out |

---

## Recommendation

Proceed to `/definition` using **drawflow.js** as the canvas-rendering library, served via a dedicated runtime-read route mirroring `handleMermaidAsset` exactly (both `drawflow.min.js` and `drawflow.min.css`). This is a narrower, more specific recommendation than `/clarify`'s own "Cytoscape.js or drawflow.js-class" framing — this spike's own direct, equally rigorous side-by-side comparison (built and tested both, not read from documentation) found drawflow is materially the better fit for this MVP's actual scope (node positioning + pan/zoom + interactive node-to-node connections), primarily because connection-drawing — the literal "Miro-like" bar named during `/clarify` — is drawflow's core built-in purpose, not a bolted-on extension with its own dependency problems.

---

## Constraints confirmed

| Constraint | Source | Implication |
|------------|--------|-------------|
| drawflow.js ships a clean, zero-dependency UMD bundle | Direct inspection of `node_modules/drawflow/package.json` + `dist/drawflow.min.js`'s own UMD wrapper | Passes the zero-build npm-relaxation condition from discovery's own Constraints section |
| drawflow's zoom interaction requires `Ctrl+scroll`, not plain scroll | `node_modules/drawflow/README.md` + confirmed live via a synthetic `ctrlKey: true` wheel event (`editor.zoom` 1.0 → 1.1) | `/definition`'s own ACs should name this explicitly rather than assume plain-scroll-to-zoom |
| `cytoscape-edgehandles` (the natural Cytoscape path to this same UX) fails the zero-build test | Direct inspection: its `package.json` lists `lodash.memoize`/`lodash.throttle` as dependencies, and both ship CommonJS-only `index.js` files with no UMD browser build | Confirms the recommendation against Cytoscape.js for this specific use case — worth recording so a future contributor doesn't re-attempt this path |

---

## Discovery fields resolved

| Discovery field | Changed? | Updated value / clarification |
|-----------------|----------|-------------------------------|
| Problem statement | No | |
| Target users | No | |
| MVP scope | No | Library choice doesn't change what's being built |
| Out of scope | No | |
| Assumptions | Yes | The one remaining `/clarify`-unresolved assumption (zero-build feasibility) is now resolved: PROCEED with drawflow.js specifically |
| Known risks | Yes | See Spike Outcome artefact — Cytoscape's extension path ruled out; operator's broader "edit the story map / mermaid diagrams too" desire logged as a genuine but separate future need, not absorbed into this feature |
| Success criteria | No | |
| Technical constraints | Yes | Zoom requires `Ctrl+scroll`; drawflow's own CSS asset also needs a zero-build serving route |

**Discovery re-run needed?**
- [x] No — findings clarify details within the existing framing

---

## Remaining unknowns

- drawflow's keyboard-accessible interaction mode (snap-to-grid, committed via `/clarify` for WCAG 2.1 AA) not yet tested — needs confirming during `/definition`.
- drawflow's node-position data format vs. the planned `position_x`/`position_y` columns on `customer_journey_stages` not yet mapped — straightforward, but not yet done.
- Multi-tenant/ADR-025 scoping untouched by this spike (correctly out of scope — a backend concern, not a library-choice concern).

---

## Decision log reference

`artefacts/2026-10-10-infinite-canvas/decisions.md` — see the new PROCEED/drawflow.js entry.
