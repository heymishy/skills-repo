# Epic: psh-e4 — Kanban Boards

**Feature:** 2026-07-05-product-stds-hierarchy
**Epic slug:** psh-e4-kanban-boards
**Status:** Not started
**Slicing strategy:** User journey — after products and features exist, operator views progress via kanban. Per-product board first, then org-level aggregation.
**Guardrails availability:** Architecture guardrails checked. Relevant constraints: ADR-018 (CSS-layout-dependent ACs need Playwright E2E tests or RISK-ACCEPT at DoR), MC-A11Y-01 (keyboard-accessible interactive elements), MC-A11Y-02 (colour not sole status indicator), ADR-003 (any new pipeline-state.json fields in schema first), MC-SEC-01 (no user content in innerHTML without sanitisation).
**Human oversight level:** Medium

## Rationale

The org and product kanban boards give the operator a high-level view of delivery status. Per-product board shows all features for that product grouped by pipeline stage with health indicators. Org-level board aggregates across all products with a product filter. These boards must render correctly (M3a: 100% correctness) and be used regularly (M3b: ≥50% weekly views).

## Stories

| Story | Title | Complexity |
|-------|-------|------------|
| psh-s6 | Per-product kanban board | 2 |
| psh-s7 | Org-level kanban with product grouping and filter | 2 |

## Out of scope for this epic

- Sprint or milestone grouping within a kanban — post-MVP
- Drag-and-drop reordering of features — post-MVP
- Filtering by story health within a product — post-MVP
- Kanban board export or sharing — post-MVP

## Metric linkage

- **M3a** (Kanban render correctness): psh-s6 and psh-s7 are the sole stories moving this metric
- **M3b** (Kanban weekly view rate): PostHog `kanban_viewed` events emitted in psh-s6 and psh-s7
