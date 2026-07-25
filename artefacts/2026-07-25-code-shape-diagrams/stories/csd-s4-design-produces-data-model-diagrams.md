# Story: `/design`/`/definition` produce Data Model diagrams

**Epic reference:** artefacts/2026-07-25-code-shape-diagrams/epics/csd-e1-code-shape-diagrams.md
**Discovery reference:** artefacts/2026-07-25-code-shape-diagrams/discovery.md
**Benefit-metric reference:** artefacts/2026-07-25-code-shape-diagrams/benefit-metric.md

## User Story

As a **Developer/engineer**,
I want **`/design` and/or `/definition` to generate a Data Model diagram (entities, relationships, schema) as part of the artefact**,
So that **the drift risk I'm most worried about — data model divergence — has an as-designed reference to compare against**.

## Benefit Linkage

**Metric moved:** P1 — Time-to-drift-determination; P3 — Diverged-flag true-positive rate; M1 — Drift caught before it became a problem.
**How:** P3's target depends on having a real, accurate as-designed Data Model to compare the as-built diagram against — without it, the drift check in csd-s6 has nothing to check against for the diagram type discovery names as the highest priority.

## Architecture Constraints

- ADR-026: reuse an existing entity's shape rather than proposing a new one — this story's own generation step must prompt that check (see AC4), not just document the outcome after the fact.
- ADR-027: skill-governed work, distinct from csd-s2's app-code rendering.

## Dependencies

- **Upstream:** csd-s2.
- **Downstream:** csd-s6.

## Acceptance Criteria

**AC1:** Given a `/design` or `/definition` session where new tables, columns, or relationships are proposed, When the operator completes that section, Then a diagram content-block (type `data-model`) is generated showing the proposed schema shape.

**AC2:** Given a feature that reuses existing tables without schema changes, When the Data Model diagram is generated, Then it still shows the relevant existing entities and relationships being touched — not just new ones — so drift can be checked against the full picture, not just deltas.

**AC3:** Given the Data Model diagram generation step, When the operator reviews it, Then entity and relationship names match the actual naming convention used in this repo's migration files — not generic placeholder names — so the as-designed diagram is directly comparable to the as-built one later.

**AC4:** Given the diagram shows a new entity, When the diagram is generated, Then the generation step surfaces an explicit prompt asking whether an existing entity's shape already covers the new concept (mirroring ADR-026's own convention) before the diagram is finalised — this is the earliest point non-optimal design could be caught, before implementation even starts.

## Out of Scope

- As-built Data Model diagrams — that is csd-s5.
- Live-database schema introspection — discovery's own out-of-scope item; static migration-file parsing only.

## NFRs

- **Performance:** None identified beyond the general context-window note already covered in csd-s3.
- **Security:** Diagram content must not surface real tenant data — only schema structure (table/column/relationship names), consistent with discovery's resolved "no cross-tenant exposure risk" reasoning (structure only, never row-level data).
- **Accessibility:** Inherits csd-s2's accessibility properties.
- **Audit:** None identified.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
