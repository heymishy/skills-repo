## Epic: Delivery view becomes a traceability grid, matching the Customer-experience tab's own already-shipped structure

**Discovery reference:** artefacts/2026-10-14-journey-authoring-experience/discovery.md
**Benefit-metric reference:** artefacts/2026-10-14-journey-authoring-experience/benefit-metric.md
**Slicing strategy:** User journey

## Goal

When this epic is complete, the Delivery view no longer renders a per-stage vertical stack of cards (stage name, health badge, moment-of-truth badge, reorder controls, Edit stage/Map feature/Add placeholder, followed by a separate delivery-annotations block). Instead it renders a swimlane grid — one column per stage, reusing `jcx-s6`'s own `.sw-cx-grid-*` mechanism (`buildDataRow`, shared `gridTemplateColumns`, horizontal scroll with a pinned label column, muted empty-state cells) per ADR-026 — with Map feature and Add placeholder living inside each stage's Mapped features cell (`decisions.md`, 2026-10-15). No new grid mechanism is built; this is a second, namespaced application of an already-validated one.

---CANVAS-JSON: {"type":"program-design","title":"As designed: Program design","content":{"mermaid":"flowchart LR\n    GRID[Existing: buildCustomerExperienceSwimlaneGrid]\n    NEWGRID[New: buildDeliverySwimlaneGrid]\n    ROUTE[routes/journeys.js]\n    ROUTE -->|jcx-s6, unchanged| GRID\n    ROUTE -->|this epic, reuses .sw-cx-grid-* CSS/JS per ADR-026| NEWGRID"}}---

## Out of Scope

- **Any change to the Customer-experience tab's own grid** — `buildCustomerExperienceSwimlaneGrid` and its CSS/JS are read as the reuse source, not modified.
- **Any change to Canvas view's drawflow nodes** — covered separately by `spikes/canvas-node-styling-outcome.md`, not this epic.
- **A new grid/table mechanism** — explicitly rejected by `delivery-view-design-outcome.md`'s own "Not recommended" section; this epic is namespacing and reusing the existing mechanism, not inventing a second one.
- **Changing the health-badge concept or its existing icon/colour treatment** (`Covered`/`Needs metrics`/`No coverage`) — confirmed sound by the spike's own research; only its container (card → grid cell) changes.
- **Reordering mechanics** (`sw-stage-move`, drag) — unchanged in behaviour; this epic only relocates where the controls render (into the header cell, matching the Customer-experience grid's own existing `.sw-stage-edit`-in-header-cell convention).

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| M3 — Operator CX judgment of the authoring flow | Operator-stated gap, 2026-10-14, originally scoped to the pre-first-save authoring flow (`jae-s1`–`jae-s3`) | Operator judges the whole authoring experience — including reviewing delivery coverage, not just creating a stage — as no longer clunky | This epic was triggered by the `whole-journey-experience-across-views` spike's own cross-view framing ("the plan," not just "the form"); M3 is read broadly here to cover that same framing, consistent with how `jcx-s6`/`jcx-s7` shipped structural/visual consistency work under the parent `journey-cx-redesign` feature without opening a dedicated metric. Flagged for the operator as a judgment call, not a mechanical fit — no numeric baseline exists for the Delivery view specifically. |

## Stories in This Epic

- [ ] Restructure the Delivery view from a per-stage card stack into a swimlane grid — `jae-s5`

## Human Oversight Level

**Oversight:** Low
**Rationale:** Pure reuse of an already-shipped, already-reviewed grid mechanism (`jcx-s6`) with a CSS/markup restructure and no new data flow, no new adapter, no new route beyond what already exists for `Map feature`/`Add placeholder` (`sw-feature-picker`, `sw-placeholder-add-form` — unchanged). Matches the Low oversight rationale already used for `jae-s1`–`jae-s3`.

## Complexity Rating

**Rating:** 1
**Scope Stability:** Stable
