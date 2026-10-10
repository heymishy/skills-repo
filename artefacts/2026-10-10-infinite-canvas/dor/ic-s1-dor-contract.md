# DoR Contract: Render journey stages as connected nodes on a drawflow canvas, replacing the linear list

**Story:** artefacts/2026-10-10-infinite-canvas/stories/ic-s1.md
**Date:** 2026-10-10

---

## What will be built

- New `/vendor/drawflow.min.js` and `/vendor/drawflow.min.css` GET routes in `src/web-ui/routes/public.js`, mirroring `handleMermaidAsset()`: read from `node_modules/drawflow/dist/` at request time, gzip + in-memory cache, serve with `Content-Type`/`Cache-Control` headers matching the mermaid route exactly.
- `drawflow` added as a real `package.json` dependency (ADR-001, `decisions.md`).
- `handleGetJourneyCanvas` in `src/web-ui/routes/journeys.js` modified: the Canvas tab's current linear stage-card list is replaced with a `<div id="drawflow">` container plus a `<script>` block that initializes a `Drawflow` editor instance, adds one node per stage (left-to-right by `position`), auto-creates connections between sequential stages, and embeds each node's "Edit stage" link, "Map feature" button, health indicator, and moment-of-truth badge in its HTML content — reusing the exact existing markup/handlers for those four elements, not reimplementing them.
- A `window.Drawflow` load guard in the client script, matching `csd-s1`'s own `window.mermaid` guard pattern (visible failure if the asset didn't load).
- Zero-stage empty state ("No stages yet. Add your first stage.") preserved unchanged.

## What will NOT be built

- Free node dragging or position persistence — `ic-s2`.
- Pan/zoom — `ic-s3`.
- Keyboard-accessible movement — `ic-s4`.
- Manual connection-drawing exposed to the operator — never in scope for this feature.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Mock-pool render test asserting 3 nodes in position order with 2 auto-connections | Unit |
| AC2 | Mock-pool render test asserting Edit-stage/Map-feature/health-indicator markup present per node | Unit (3 tests) |
| AC3 | Mock-pool render test asserting 🚩 badge on the flagged stage only | Unit |
| AC4 | Mock-pool render test with 0 stages, asserting the unchanged empty-state message | Unit |
| AC5 | Direct handler call asserting 200/correct headers/gzip for both new asset routes | Integration (2 tests) |
| AC6 | Extracted `<script>` source inspected for the load-guard pattern | Unit |

## Assumptions

- `handleGetJourneyCanvas`'s own existing per-stage HTML snippets (Edit-stage link, Map-feature button, health indicator, moment-of-truth badge) can be reused as-is inside each drawflow node's HTML content, without needing to be rewritten — they're already self-contained markup fragments.
- Initial node x/y positions use a simple deterministic formula (e.g. `x = index * fixedSpacing`), not a layout algorithm — `ic-s2` will later persist real positions that override this default.

## Estimated touch points

**Files:** `src/web-ui/routes/public.js`, `src/web-ui/routes/journeys.js`, `package.json`, `package-lock.json`, `tests/check-ic-s1-canvas-render.js` (new)
**Services:** None
**APIs:** `GET /vendor/drawflow.min.js` (new, unauthenticated), `GET /vendor/drawflow.min.css` (new, unauthenticated)
