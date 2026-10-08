## Story: Drag-and-drop stage reorder with keyboard alternative
**Epic reference:** artefacts/2026-10-05-customer-journey-as-first-class/epics/journey-entity-and-stage-management.md
**Discovery reference:** artefacts/2026-10-05-customer-journey-as-first-class/discovery.md
**Benefit-metric reference:** artefacts/2026-10-05-customer-journey-as-first-class/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Outer loop practitioner (PO / SME / discovery lead)**,
I want **to reorder stage cards by dragging them and also via a keyboard-accessible alternative**,
So that **I can arrange stages in the correct customer sequence**.
## Benefit Linkage
M1 — Journey adoption — stage ordering is essential for a journey to be meaningful; without it practitioners cannot represent their intended customer flow.
## Architecture Constraints
No new npm runtime dependencies — drag-and-drop must be implemented using the browser's native HTML5 drag-and-drop API or an equivalent zero-dependency approach. Position rebalancing on drop: update all affected `position` values in a single transaction. WCAG 2.1 AA — keyboard alternative required (up/down controls or reorder via side panel).
## Dependencies
ep1-s2
## Acceptance Criteria
**AC1:** Given I drag a stage card to a new position in the sequence,
When I drop it,
Then a PATCH request updates the `position` values of all affected stages in a single Postgres transaction, and the canvas re-renders the stages in the new order.

**AC2:** Given a drop fails (network error),
When the error response is received,
Then the stage cards revert to their pre-drag order (optimistic UI rollback) and a toast error "Stage order not saved — please try again" is shown.

**AC3:** Given I want to reorder stages without drag-and-drop,
When I use the keyboard alternative (e.g. up/down controls on the stage card or reorder controls in the side panel),
Then I can move a stage earlier or later in the sequence and the order is persisted.

**AC4:** Given the reorder is complete,
When the canvas re-renders,
Then the updated stage sequence is reflected in the stage cards' visual order.

## Out of Scope
Parallel stage structures (deferred per design decisions), undoing a reorder beyond the rollback-on-error behaviour.
## NFRs
No new npm runtime dependencies — native HTML5 drag-and-drop or zero-dependency equivalent. WCAG 2.1 AA keyboard alternative. Position updates in a single Postgres transaction. No colour-only indicators.
## Complexity Rating
**Rating:** 2
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
