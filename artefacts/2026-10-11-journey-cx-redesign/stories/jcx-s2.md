## Story: Placeholder mapping auto-converts to linked once its triggered discovery is approved

**Epic reference:** artefacts/2026-10-11-journey-cx-redesign/epics/journey-map-and-placeholder-trigger.md
**Discovery reference:** artefacts/2026-10-11-journey-cx-redesign/discovery.md
**Benefit-metric reference:** artefacts/2026-10-11-journey-cx-redesign/benefit-metric.md
**Domain:** [web-ui]

## User Story

As an **outer loop practitioner (PO / SME / discovery lead)**,
I want **a placeholder feature's mapping to automatically become a real, linked mapping once the discovery it triggered is approved**,
So that **the journey map always reflects real pipeline state, without me having to manually re-map it later**.

## Benefit Linkage

**Metric moved:** M2 — Placeholder-feature trigger actually used
**How:** M2's own target is "≥1 placeholder feature triggered **and reaching `/discovery` approval**" — this story is what makes the second half of that measurable; without it, M2 could only ever measure the trigger-click, not the full lifecycle `/clarify` confirmed the operator wants.

## Architecture Constraints

- **ADR-025** — the conversion write must be tenant-scoped and ownership-checked, same as `jcx-s1`.
- Reuses `jcx-s1`'s own `mapping_state` column — this story does not introduce a new column, only a new write path that transitions its value.

## Dependencies

- **Upstream:** `jcx-s1` must be DoD-complete — this story consumes the `mapping_state` column and the trigger-provenance record `jcx-s1` creates.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a placeholder mapping whose triggered discovery has just been approved (`discovery.md`'s own `Status: Approved`), When the approval is recorded, Then the mapping's `mapping_state` transitions from `placeholder` to `linked`, and `feature_slug` updates from the placeholder name to the real, approved feature's own slug.

**AC2:** Given a placeholder mapping whose triggered discovery has NOT yet been approved, When the operator views the journey stage, Then the mapping remains visibly in `placeholder` state — no premature conversion.

**AC3:** Given two different placeholder mappings on two different stages, both triggering their own separate discoveries, When one discovery is approved and the other is not, Then only the approved one's mapping converts — conversions are independent per mapping, not batched or cross-contaminating.

**AC4:** Given a placeholder mapping whose triggered discovery is later abandoned (never approved, `/discovery` session simply not continued), When the operator views the stage, Then the mapping remains in `placeholder` state indefinitely — no automatic cleanup or expiry (explicitly out of scope, see below).

## Out of Scope

- Automatic cleanup or expiry of a placeholder whose triggered discovery is abandoned — per `discovery.md`'s own Out of Scope section, downstream lifecycle beyond the placeholder→linked conversion is a follow-up question.
- Bidirectional sync if the resulting feature is later renamed or its slug changes after conversion — out of scope for this story.

## NFRs

- **Performance:** None beyond `jcx-s1`'s own bounds — this is a single-row state transition, not a bulk operation.
- **Security:** Same tenant-scoping/ownership-check pattern as `jcx-s1` (D13/ADR-025).
- **Accessibility:** The visual distinction between `placeholder` and `linked` states must meet WCAG 2.1 AA — not conveyed by color alone (product/constraints.md #9).
- **Audit:** The conversion event is traceable — when and which discovery approval triggered it.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

---CANVAS-JSON: {"type":"data-model","title":"Data model","content":{"mermaid":"erDiagram\n    FEATURE_CUSTOMER_JOURNEY_STAGE_MAPPINGS {\n        uuid id PK\n        uuid journey_stage_id FK\n        uuid journey_id FK\n        text tenant_id\n        text feature_slug\n        jsonb metric_keys\n        text mapping_state\n    }"}}---

<!-- No schema change in this story -- reuses jcx-s1's own mapping_state column, transitioning its value from 'placeholder' to 'linked'. Shown per csd-s4's own rule that reuse without a schema change still requires the diagram marker. -->
