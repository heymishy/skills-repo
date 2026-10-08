## Story: Journey list page: index of all journeys for the tenant
**Epic reference:** artefacts/2026-10-05-customer-journey-as-first-class/epics/navigation-entry-points-and-journey-list.md
**Discovery reference:** artefacts/2026-10-05-customer-journey-as-first-class/discovery.md
**Benefit-metric reference:** artefacts/2026-10-05-customer-journey-as-first-class/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Outer loop practitioner (PO / SME / discovery lead)**,
I want **a journey list page at `/journeys` that shows all journeys scoped to my tenant**,
So that **I can navigate to an existing journey or create a new one**.
## Benefit Linkage
M1 — Journey adoption — the list page is the primary entry point for creating and accessing journeys; it is the mechanism by which M1 is measured.
## Architecture Constraints
ADR-025 — all journey records returned must be scoped by `tenantId`; cross-tenant records must never appear. ADR-027 — list page is app code in `src/web-ui/routes/journeys.js`. Design system reference for UI components. No new npm runtime dependencies.
## Dependencies
ep1-s1
## Acceptance Criteria
Given I navigate to `/journeys`,
When the page renders,
Then I see a list of all journeys scoped to my `tenantId`, each showing the journey name, optional description (truncated if long), the associated product name (or "No product" if `product_id` is null), and the count of stages.

Given no journeys exist for my tenant,
When the page renders,
Then I see the empty state message "No journeys yet. Create your first journey." with a prominent "New journey" call to action.

Given I click "New journey",
When the creation form or modal opens,
Then I can enter a journey name (required), optional description, and optionally associate a product from a picker of existing products for my tenant.

Given I submit a valid new journey (name provided),
When the creation completes,
Then the journey record is saved to `customer_journeys` scoped to my `tenantId` and I am redirected to `/journeys/:id`.

Given another tenant's journey ID is used in the request,
When the request is processed,
Then a 403 response is returned and no journey data is returned.
## Out of Scope
Journey deletion (deferred), journey search/filter (deferred for MVP), cross-org journey sharing.
## NFRs
All journey records tenant-scoped per ADR-025. Product picker filtered by `tenantId`. WCAG 2.1 AA. No new npm runtime dependencies.
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
