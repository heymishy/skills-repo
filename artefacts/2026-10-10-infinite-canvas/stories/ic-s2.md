## Story: Free node positioning persisted across reloads

**Epic reference:** artefacts/2026-10-10-infinite-canvas/epics/canvas-replacement-for-journey-stages.md
**Discovery reference:** artefacts/2026-10-10-infinite-canvas/discovery.md
**Benefit-metric reference:** artefacts/2026-10-10-infinite-canvas/benefit-metric.md
**Domain:** [web-ui]

## User Story

As an **outer loop practitioner (PO / SME / discovery lead)**,
I want **to drag a stage node to wherever I want it on the canvas, and have it stay there**,
So that **I can spatially organise a journey the way I actually think about it, not the way a fixed list forces me to**.

## Benefit Linkage

**Metric moved:** M1 — Spatial layout actually used
**How:** This story is the literal mechanism M1 measures — without persistence, any repositioning would be lost on reload and would never register as "used" in the sense the metric defines (a node moved away from its default position and kept there).

## Architecture Constraints

- **`decisions.md` D13** (404-not-403 cross-tenant convention): the new position-update route must check stage ownership before any mutation, returning 404 — not 403 — for a cross-tenant stage id, matching every other mutating route in `journeys.js`.
- **`decisions.md` D6**: single-statement update, no transaction needed — this is a single-row update, matching this file's own convention of only wrapping multi-row writes in `BEGIN`/`COMMIT`.
- **ADR-026** (reuse an existing entity's shape rather than inventing a new one): positions are added as columns on the existing `customer_journey_stages` table, not a new table — already decided and logged as `decisions.md`'s own ASSUMPTION entry from `/clarify`.

## Dependencies

- **Upstream:** `ic-s1` — nodes must render before there is anything to drag.
- **Downstream:** `ic-s3` (pan/zoom) and `ic-s4` (keyboard movement) both read/write the same `position_x`/`position_y` fields this story establishes.

---CANVAS-JSON: {"type":"data-model","title":"Data model","content":{"mermaid":"erDiagram\n    CUSTOMER_JOURNEY_STAGES {\n        uuid id PK\n        uuid journey_id FK\n        text tenant_id\n        text name\n        integer position\n        text description\n        text customer_actions\n        text touchpoints\n        text channel\n        text emotion\n        text pain_points\n        text opportunities\n        boolean moment_of_truth\n        double position_x\n        double position_y\n        timestamptz created_at\n        timestamptz updated_at\n    }"}}---

## Acceptance Criteria

**AC1:** Given a canvas node, When the operator drags it to a new screen position and releases, Then the new coordinates are saved via a request to the stage's own position-update route, and reloading the page renders the node at that same saved position rather than the default auto-layout position.

**AC2:** Given a journey stage with no stored position yet (`position_x`/`position_y` both `NULL` — true for every stage that existed before this story shipped, and any new stage until first dragged), When the canvas renders, Then it falls back to the same deterministic auto-layout from `ic-s1` (left-to-right in `position` order) rather than stacking nodes at `(0, 0)` or erroring.

**AC3:** Given a request to update a stage's position using a stage id that belongs to a different tenant, When the request is processed, Then it returns 404 (not 403) and the stage's position is not modified — directly mirroring the adversarial test pattern `ep5-s2` already established for every other mutating route in this file.

**AC4:** Given the migration that adds `position_x`/`position_y` to `customer_journey_stages`, When it runs against a database that already has the table, Then it completes successfully without error (idempotent `ADD COLUMN IF NOT EXISTS` pattern, matching every other `scripts/migrate-schema-*.js` file's own convention) and every existing row's new columns default to `NULL`, requiring no backfill.

**AC5:** Given two different stages on the same journey, When one is dragged and its position saved, Then the other stage's own position (whether set or still `NULL`/auto-layout) is completely unaffected.

## Out of Scope

- **Canvas pan/zoom** — `ic-s3`.
- **Keyboard-accessible movement** — `ic-s4` (though this story's own persistence route is reused by it).
- **Manual connection-drawing or restructuring stage sequence via the canvas** — epic-level out of scope; dragging changes visual position only, never the underlying `position` (sequence-order) field.
- **Migrating/backfilling positions for existing stages** — explicitly not needed per AC2/AC4; existing stages simply keep using auto-layout until an operator chooses to drag them.

## NFRs

- **Performance:** Position-save requests complete without a perceptible delay to the drag gesture — fire-and-forget is acceptable (no blocking spinner), matching the autosave pattern already established by `ep1-s3`'s stage side panel.
- **Security:** Position-update route follows the same ownership-check-before-mutation / 404-not-403 pattern as every other mutating route in `journeys.js` (D13) — AC3 directly tests this.
- **Accessibility:** N/A for this story specifically — the keyboard-equivalent interaction is `ic-s4`'s own scope.
- **Audit:** None — position is a presentation-layer detail, not an auditable business event, consistent with how this file treats other cosmetic fields.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
