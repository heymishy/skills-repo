# Decision Log: infinite-canvas

**Feature:** Infinite Canvas — Reusable Free-Form Spatial Canvas Primitive
**Discovery reference:** artefacts/2026-10-10-infinite-canvas/discovery.md
**Last updated:** 2026-10-10

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-10-10 | ASSUMPTION | /clarify**
**Decision:** The canvas library candidate field is narrowed to purpose-built node-graph libraries (e.g. Cytoscape.js, drawflow.js-class) rather than general 2D canvas-drawing libraries (Konva.js, Fabric.js-class). Final library selection still requires a dedicated spike before `/definition`.
**Alternatives considered:** (B) Leave the field fully open, let the spike evaluate both graph-libs and generic canvas-libs from scratch. (C) Name a specific library now and skip the spike entirely.
**Rationale:** The MVP's own scope is specifically node positioning + pan/zoom + node-to-node connections, with freehand drawing explicitly out of scope — exactly the use case purpose-built graph libraries are built for. A general canvas-drawing library would need node/edge interaction built on top from scratch, a materially larger implementation surface for no corresponding benefit given the MVP's own bounds.
**Made by:** Hamish King — Platform Owner (via /clarify)
**Revisit trigger:** If the dedicated spike finds no purpose-built graph-library candidate passes the zero-build serving test (see next entry), re-open the field to general canvas-drawing libraries.
---

**2026-10-10 | ASSUMPTION | /clarify**
**Decision:** The MVP's keyboard-accessible interaction model for WCAG 2.1 AA is snap-to-grid discrete movement — arrow keys move a selected node by a fixed step. Mouse/touch interaction remains truly freehand (continuous drag, no snapping).
**Alternatives considered:** (B) Attempt full continuous freehand dragging via keyboard too. (C) RISK-ACCEPT: ship mouse/touch-only for MVP, defer keyboard freehand as a known gap.
**Rationale:** Continuous freehand positioning via keyboard-only operation is an industry-wide unsolved UX problem (even Miro has known accessibility gaps here). Snap-to-grid extends `ep1-s4`'s own proven, already-shipped, already-accessible up/down-reorder precedent to two dimensions, rather than attempting a materially harder, novel interaction pattern with no existing precedent in this codebase to build on.
**Made by:** Hamish King — Platform Owner (via /clarify)
**Revisit trigger:** If an accessibility audit or real keyboard-only usage finds snap-to-grid itself fails AA in practice, or if the eventually-chosen library makes continuous keyboard drag genuinely tractable without custom implementation.
---

**2026-10-10 | ASSUMPTION | /clarify**
**Decision:** Node x/y coordinates are persisted as new `position_x`/`position_y` columns directly on `customer_journey_stages`, not in a separate generic `(entity_type, entity_id)`-keyed positions table.
**Alternatives considered:** (B) A separate generic `canvas_node_positions` table keyed by entity type and id — more work now, reusable across future entities without a schema migration. (C) Defer the schema decision to `/definition`, once the chosen library's own data model is known.
**Rationale:** No second concrete use case for the canvas primitive exists yet — this discovery's own MVP scope names exactly one real application (journeys). Building a generic polymorphic positions table now pre-solves a multi-entity reuse problem that doesn't exist yet, repeating the exact speculative-generality pattern `2026-08-29-diagram-validation-and-types` already identified and warned against for this platform. "Reusable" in this discovery refers to the client rendering module (confirmed in MVP Scope), not the persistence schema. If a second real use case materialises later, extracting a generic table from this simple start is a low-risk, mechanical refactor at that point — the reverse (discovering an early generic abstraction was wrong) wastes more.
**Made by:** Hamish King — Platform Owner (via /clarify, on Claude's recommendation)
**Revisit trigger:** When a second real, concrete use case for the canvas primitive (e.g. the `definition-canvas` story-map replacement) is named and scoped as its own feature.
---

---

## Architecture Decision Records

<!-- None yet — these 3 decisions are lightweight, reversible log entries, not structural ADRs. An ADR may be warranted once the zero-build spike confirms a specific library and the integration pattern is locked. -->
