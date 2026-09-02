## Story: Fix the Story-Detail Dead End With a Breadcrumb and Back Link

**Epic reference:** artefacts/2026-09-02-product-dashboard-triage/epics/dashboard-triage.md
**Discovery reference:** artefacts/2026-09-02-product-dashboard-triage/discovery.md
**Benefit-metric reference:** artefacts/2026-09-02-product-dashboard-triage/benefit-metric.md

## User Story

As a **Platform maintainer / product owner**,
I want a story's detail page to show a breadcrumb back to its product and phase/epic,
So that clicking into a story never leaves me at a dead end with no way back.

## Benefit Linkage

**Metric moved:** Time to First Actionable Content
**How:** A dead-end detail page with no way back costs an operator real time re-navigating (browser back, re-finding the product, re-scrolling to the same item) — the same "time to reach actionable content" the metric already tracks, measured after a click rather than before one. Confirmed live: clicking a story today can land on a bare `/features/dic.5` page reading only "No artefacts found for this feature," with no context at all.

## Architecture Constraints

- The `/features/:id` route handler needs to resolve and pass through the story's parent product/phase/epic context. This data is already available server-side — the story is always reached FROM a product-scoped list that already knows this context — this story threads it through to the detail page rather than computing anything new.
- No new npm dependencies.

## Dependencies

- **Upstream:** None.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given an operator clicks into a story from the product page, When the story detail page loads, Then it shows a breadcrumb reading "Product Name › Phase/Epic Name › Story ID".

**AC2:** Given the breadcrumb is showing, When the operator clicks the product name in it, Then they are taken back to that product's page.

**AC3:** Given a story genuinely has no artefacts yet, When its detail page loads, Then it still shows the breadcrumb and an honest "No artefacts found for this feature yet" message — never a bare, context-free page as it does today.

## Out of Scope

- Redesigning the artefact-content display itself once a story does have real artefacts to show — only the missing breadcrumb/back-link and the bare-dead-end case are in scope.

## NFRs

- **Performance:** None identified — the parent context is already resolved upstream of this route.
- **Security:** None — no new data is exposed beyond what's already shown on the product page this story was reached from.
- **Accessibility:** Breadcrumb links must be keyboard-navigable, with clear focus states.
- **Audit:** None identified.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

<!-- Populated at /definition-of-ready. -->
