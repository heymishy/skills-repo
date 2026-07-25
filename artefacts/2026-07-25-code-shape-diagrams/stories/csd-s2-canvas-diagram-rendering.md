# Story: Canvas rendering of the diagram content-block type

**Epic reference:** artefacts/2026-07-25-code-shape-diagrams/epics/csd-e1-code-shape-diagrams.md
**Discovery reference:** artefacts/2026-07-25-code-shape-diagrams/discovery.md
**Benefit-metric reference:** artefacts/2026-07-25-code-shape-diagrams/benefit-metric.md

## User Story

As a **Developer/engineer**,
I want to **have the diagram content-block type as a fully production-ready rendering mechanism supporting all three diagram types (System Architecture, Program Design, Data Model), not just the single Data Model fixture from csd-s1**,
So that **any diagram content a skill produces later (csd-s3, csd-s4, csd-s5) can be rendered reliably in canvas**.

## Benefit Linkage

**Metric moved:** P2 — Diagram completion rate
**How:** Like csd-s1, this story is honestly foundational — flagged as such rather than dressed up as direct operator value (per `/review` finding 1-M2). It contributes to P2 indirectly, by completing the rendering mechanism for all three diagram types and both as-designed/as-built variants — the foundation the 100% completion target depends on. Stories csd-s3 through csd-s6 are where the operator-facing value actually lands.

## Architecture Constraints

- ADR-026: extends the same content-block mechanism proven in csd-s1 — no parallel rendering path per diagram type.
- ADR-027: ordinary application code in `src/web-ui/`.
- `MC-SEC-01` (mandatory constraint, guardrails registry): "No user-supplied content in innerHTML without sanitisation" — this story is where the mermaid security-level configuration (see NFRs) is finalised for production, across all three diagram types.

## Dependencies

- **Upstream:** csd-s1 (proves the mechanism and mermaid fidelity).
- **Downstream:** csd-s3, csd-s4, csd-s5 depend on this being production-ready before they can produce real diagram content.

## Acceptance Criteria

**AC1:** Given a diagram content-block with type `system-architecture`, `program-design`, or `data-model`, When rendered in canvas, Then each type renders correctly with a visible type label distinguishing them.

**AC2:** Given a diagram content-block with malformed or invalid mermaid syntax, When rendered in canvas, Then a labelled error message box is shown in place of the diagram — naming the diagram type and "failed to render," visually distinct from a successfully-rendered diagram — not a blank space and not a raw error stack or stack trace.

**AC3:** Given multiple diagram blocks in the same canvas payload (e.g. both an as-designed and an as-built diagram of the same type), When rendered, Then each renders independently and is visually distinguishable, e.g. labelled "As Designed" vs "As Built".

**AC4:** Given the canvas's existing accessibility and keyboard-navigation behaviour for other block types, When a diagram block is present, Then it does not break existing keyboard navigation or focus order.

## Out of Scope

- The drift / match-diverged visual signal itself — that is csd-s6. This story only renders diagrams; it does not compare them.
- Editable or interactive diagrams (zoom, pan, click-to-expand) — static rendering only for this MVP.

## NFRs

- **Performance:** Rendering multiple diagram blocks in one canvas payload does not introduce more than a small, unnoticeable delay relative to a single block (no fixed numeric target — no baseline exists yet).
- **Security:** Same mermaid security-level configuration as csd-s1, applied consistently across all three diagram types.
- **Accessibility:** Text-alternative fallback for all three diagram types, not just Data Model.
- **Audit:** None identified.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
