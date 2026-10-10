## Epic: Operators can spatially position and view journey stages on a free-form canvas

**Discovery reference:** artefacts/2026-10-10-infinite-canvas/discovery.md
**Benefit-metric reference:** artefacts/2026-10-10-infinite-canvas/benefit-metric.md
**Slicing strategy:** Walking skeleton — ic-s1 establishes the thinnest possible end-to-end path (serve the library, render real stage data as nodes, preserve every existing per-stage action), with subsequent stories adding free positioning + persistence, pan/zoom, and keyboard accessibility on top of that proven skeleton. Chosen because this is a new architecture integration (the first client-side npm dependency this platform has ever shipped) needing proof before detail — exactly the scenario walking skeleton is built for.

---

## Goal

A journey's stages render as freely positionable, connected nodes on a real spatial canvas (drawflow.js, per `decisions.md` ADR-001), replacing the current linear card list on the journey canvas page's "Canvas" tab. Stages connect automatically in their existing sequence order; operators can drag a node to a new position (mouse/touch) or move it via arrow keys (keyboard, WCAG 2.1 AA), with the chosen position persisted across reloads. The canvas can be panned and zoomed. Every existing per-stage action — Edit stage, Map feature, health indicator, moment-of-truth flag — continues to work exactly as it does today; only the spatial rendering and positioning interaction are new. The underlying journey data model, health computation, and the Customer experience / Delivery tabs are completely unchanged.

---CANVAS-JSON: {"type":"program-design","title":"As designed: Program design","content":{"mermaid":"flowchart LR\n    SERVER[server.js]\n    PUBLIC[routes/public.js]\n    JOURNEYS[routes/journeys.js]\n    CLIENT[drawflow canvas client script]\n    VENDOR[/vendor/drawflow.min.js + .css/]\n    DB[(customer_journey_stages)]\n    SERVER --> PUBLIC\n    SERVER --> JOURNEYS\n    PUBLIC -->|serves, read from node_modules at request time| VENDOR\n    JOURNEYS -->|renders handleGetJourneyCanvas| CLIENT\n    CLIENT -->|loads via plain script src| VENDOR\n    CLIENT -->|drag or arrow-key move| JOURNEYS\n    JOURNEYS -->|PATCH position_x/position_y| DB"}}---

---

## Out of Scope

- **Manual connection-drawing exposed to the operator.** The canvas module supports interactive node-to-node connections at the primitive level (confirmed in the spike), but journey stages already have a real sequential order (the existing `position` field) — exposing manual, operator-driven connection-drawing for journeys would let an operator restructure a journey into an arbitrary non-linear graph, which nobody asked for and has no named product need. Connections between stage nodes are auto-rendered from the existing sequence, not manually drawn.
- **Replacing `definition-canvas`'s story map or the mermaid-rendered design/architecture diagrams.** Explicitly gated future work per discovery's own MVP Scope section — this epic proves the canvas on journeys first; nothing here unlocks or commits to the other two surfaces.
- **Real-time multi-user collaborative editing, freehand drawing/sketching tools, cross-org canvas sharing.** All explicitly out of scope per the parent discovery.
- **Any change to the journey data model, health-computation logic, or the Customer experience/Delivery tabs.** This epic changes how stages are rendered and spatially arranged on the Canvas tab only.

---

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| M1 — Spatial layout actually used | 0 (capability doesn't exist) | ≥1 stage node repositioned and persisted within 2 weeks of release | ic-s1 ships the rendering; ic-s2 ships persisted free positioning — the mechanism the metric directly measures |
| M2 — Operator CX judgment vs. the list view | N/A (nothing to compare yet) | Operator judges the canvas as genuinely better after 2–4 weeks of real use | All four stories together constitute the real artefact the operator forms this judgment against — ic-s1's non-regression of every existing per-stage action is specifically what prevents the judgment from being dragged down by a feature regression rather than a genuine canvas-vs-list comparison |

---

## Stories in This Epic

- [ ] Render journey stages as connected nodes on a drawflow canvas, replacing the linear list — ic-s1
- [ ] Free node positioning persisted across reloads — ic-s2
- [ ] Canvas pan and zoom — ic-s3
- [ ] Keyboard-accessible node movement (WCAG 2.1 AA) — ic-s4

---

## Human Oversight Level

**Oversight:** Medium
**Rationale:** This is the first client-side npm dependency this platform has ever shipped, and a structural rendering change to a customer-facing page — warrants PR-level human review, not full autonomy. Not High: the core technical risk (does a zero-build canvas library actually work here) was already substantially de-risked by a completed spike with working, live-tested prototypes (`spikes/zero-build-canvas-library-outcome.md`, ADR-001) before any of these stories were written, unlike a genuinely open-ended architectural unknown.

---

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable — MVP boundaries were tightly scoped across discovery, clarify, and the spike, with explicit out-of-scope items agreed before story-writing began.
