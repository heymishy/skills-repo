## Epic: Delivery view becomes a traceability grid, matching the Customer-experience tab's own already-shipped structure

**Discovery reference:** artefacts/2026-10-14-journey-authoring-experience/discovery.md
**Benefit-metric reference:** artefacts/2026-10-14-journey-authoring-experience/benefit-metric.md
**Slicing strategy:** User journey

## Goal

When this epic is complete, the Delivery view no longer renders a per-stage vertical stack of cards (stage name, health badge, moment-of-truth badge, reorder controls, Edit stage/Map feature/Add placeholder, followed by a separate delivery-annotations block). Instead it renders a swimlane grid — one column per stage, with Map feature and Add placeholder living inside each stage's Mapped features cell (`decisions.md`, 2026-10-15).

**Per ADR-028** ("a derived structure needs exactly one canonical builder — every consumer reads from it, none re-derive it"), the shared grid-shell mechanics (`gridTemplateColumns` formula, the `buildDataRow` cell/track/pinned-label wrapper, the focusable header-cell pattern, the visually-hidden accessible-list pattern) are extracted from `buildCustomerExperienceSwimlaneGrid` into one canonical builder both the existing CX grid and the new Delivery grid call — not re-derived a second time. This is a behaviour-preserving refactor: `buildCustomerExperienceSwimlaneGrid`'s own rendered output and existing test suite are unchanged; only its internals are reorganised to share mechanics with the new `buildDeliverySwimlaneGrid`.

---CANVAS-JSON: {"type":"program-design","title":"As designed: Program design","content":{"mermaid":"flowchart LR\n    SHELL[New canonical builder: buildSwimlaneGridShell per ADR-028]\n    CX[buildCustomerExperienceSwimlaneGrid - refactored to call SHELL]\n    DELIVERY[New: buildDeliverySwimlaneGrid - calls SHELL]\n    ROUTE[routes/journeys.js]\n    CX -->|column template, data-row, a11y-list mechanics| SHELL\n    DELIVERY -->|same shared mechanics, different row content| SHELL\n    ROUTE -->|jcx-s6 content unchanged| CX\n    ROUTE -->|this epic, new content| DELIVERY"}}---

## Out of Scope

- **Any OBSERVABLE change to the Customer-experience tab's own grid** — its rendered output and existing test suite are unchanged. Its internals ARE touched, by design, per ADR-028: the shared grid-shell mechanics it already implements are extracted into one canonical builder this epic's new Delivery grid also calls, rather than re-derived a second time. This is a mandated refactor, not new CX functionality.
- **Any change to Canvas view's drawflow nodes** — covered separately by `spikes/canvas-node-styling-outcome.md`, not this epic.
- **A new, independent grid/table mechanism** — explicitly rejected by `delivery-view-design-outcome.md`'s own "Not recommended" section and by ADR-028; this epic shares the existing mechanism via one canonical builder, not a second parallel one.
- **Changing the health-badge concept or its existing icon/colour treatment** (`Covered`/`Needs metrics`/`No coverage`) — confirmed sound by the spike's own research; only its container (card → grid cell) changes.
- **Reordering mechanics** (`sw-stage-move`, drag) — unchanged in behaviour; this epic only relocates where the controls render (into the header cell, matching the Customer-experience grid's own existing `.sw-stage-edit`-in-header-cell convention).

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| M3 — Operator CX judgment of the authoring flow | Operator-stated gap, 2026-10-14, originally scoped to the pre-first-save authoring flow (`jae-s1`–`jae-s3`) | Operator judges the whole authoring experience — including reviewing delivery coverage, not just creating a stage — as no longer clunky | This epic was triggered by the `whole-journey-experience-across-views` spike's own cross-view framing ("the plan," not just "the form"); M3 is read broadly here to cover that same framing, consistent with how `jcx-s6`/`jcx-s7` shipped structural/visual consistency work under the parent `journey-cx-redesign` feature without opening a dedicated metric. Flagged for the operator as a judgment call, not a mechanical fit — no numeric baseline exists for the Delivery view specifically. |

## Stories in This Epic

- [ ] Restructure the Delivery view from a per-stage card stack into a swimlane grid — `jae-s5`

## Human Oversight Level

**Oversight:** Medium
**Rationale:** The Delivery-view build itself is low-risk reuse (no new data flow, no new adapter, no new route beyond what already exists for `Map feature`/`Add placeholder`). Raised from Low to Medium because this epic also refactors `buildCustomerExperienceSwimlaneGrid` — already-shipped, already-reviewed, already-live code — to extract a canonical builder per ADR-028. That refactor must be verified not to change the CX grid's own observable behaviour (its existing test suite must pass unchanged), which is a real regression surface `jae-s1`–`jae-s3` never touched.

## Complexity Rating

**Rating:** 2
**Scope Stability:** Stable
