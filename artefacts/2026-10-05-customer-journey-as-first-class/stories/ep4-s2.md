## Story: Navigation and entry points: "Journeys" nav link and product page link
**Epic reference:** artefacts/2026-10-05-customer-journey-as-first-class/epics/navigation-entry-points-and-journey-list.md
**Discovery reference:** artefacts/2026-10-05-customer-journey-as-first-class/discovery.md
**Benefit-metric reference:** artefacts/2026-10-05-customer-journey-as-first-class/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Outer loop practitioner (PO / SME / discovery lead)**,
I want **a "Journeys" link in the main navigation and a "View journey" link on the product detail page when a journey is associated with that product**,
So that **I can reach the journey canvas from natural points in the product UI**.
## Benefit Linkage
M1 — Journey adoption — discoverability of the journey canvas drives the adoption metric; without visible entry points, M1 cannot reach its target.
## Architecture Constraints
Design system reference (`artefacts/2026-09-18-design-system-adoption/reference/DESIGN.md`) must be consulted before adding nav items. No new npm runtime dependencies. **Route note (see decisions.md D8):** the "Journeys" nav link targets `/customer-journeys` (the list page from `ep4-s1`), not `/journeys` — that plain path is already owned by an unrelated, live platform feature.
## Dependencies
ep4-s1
## Acceptance Criteria
**AC1:** Given I am on any page in the web UI,
When the main navigation renders,
Then a "Journeys" link is visible and navigates to `/customer-journeys`.

**AC2:** Given I am on a product detail page and that product has at least one associated journey,
When the product detail page renders,
Then a "View journey" link is displayed that navigates to `/journeys/:id` for the first associated journey (ordered by `created_at` ascending).

**AC3:** Given I am on a product detail page and that product has no associated journeys,
When the product detail page renders,
Then no "View journey" link is shown (no broken link, no empty placeholder).

**AC4:** Given the "Journeys" nav link is rendered,
When a keyboard user navigates the main nav,
Then the "Journeys" link is reachable and activatable via keyboard alone (WCAG 2.1 AA).

## Out of Scope
Multiple journey links on a product page (only first journey linked in MVP), journey creation from the product detail page.
## NFRs
Nav link and product page link follow design system reference. WCAG 2.1 AA. No new npm runtime dependencies.
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
