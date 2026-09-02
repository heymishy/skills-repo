## Story: Consolidate the Epic/Phase List — Remove the Duplicate Static Dump, Default Groups to Collapsed

**Epic reference:** artefacts/2026-09-02-product-dashboard-triage/epics/dashboard-triage.md
**Discovery reference:** artefacts/2026-09-02-product-dashboard-triage/discovery.md
**Benefit-metric reference:** artefacts/2026-09-02-product-dashboard-triage/benefit-metric.md

## User Story

As a **Platform maintainer / product owner**,
I want the product page's epic/phase groups to appear once, collapsed by default,
So that I can scan a 40-group product in one screenful instead of scrolling past both a static dump and a fully-expanded interactive list.

## Benefit Linkage

**Metric moved:** Time to First Actionable Content
**How:** Removing the ~40-screen static duplicate list and collapsing the remaining interactive groups means the first interactive content (search, health filters) appears immediately instead of after dozens of screens of static text.

## Architecture Constraints

- Confirmed via discovery-time code investigation: `_renderConsolidatedFeaturesSection` and `_renderProductView` (`src/web-ui/routes/products.js`) are the generic functions producing both the static list and the interactive By Module/By Phase/All tabs — this story removes the static rendering path and changes only the default expand/collapse state of the interactive one.
- Must not alter the underlying By Module/By Phase/All tab data-fetching, health-computation, search, or the module editor's own functionality — rendering/default-state change only.
- No new npm dependencies.

## Dependencies

- **Upstream:** None.
- **Downstream:** Story pdt-s2 (triage strip) renders visually above this story's consolidated list — not a hard blocking dependency, but implementing this story first gives pdt-s2 a cleaner page to land on.

## Acceptance Criteria

**AC1:** Given a product with N epic/phase groups, When the operator loads `/products/:id`, Then each group renders exactly once — the static, non-interactive text rendering is removed, leaving only the interactive grouped list.

**AC2:** Given a product with any epic/phase group, When the page first loads, Then that group's individual story rows are NOT rendered until the operator clicks the group header — the group shows only its title, item count, and a rolled-up status indicator.

**AC3:** Given a collapsed group, When the operator clicks its header, Then the group expands to show its individual story rows, displaying the same data as today's fully-expanded view (story ID, name, health, percentage).

**AC4:** Given a product with zero epic/phase groups (e.g. a brand-new product with no features yet), When the operator loads `/products/:id`, Then the page shows a clear empty-state message in the groups section, not a broken or blank area.

## Out of Scope

- Changing which stories belong to which group — only default expand/collapse state and duplicate-list removal are in scope; grouping assignment logic is untouched.
- Persisting collapse/expand state across page reloads (e.g. via `localStorage`) — every page load resets to fully collapsed for this story.

## NFRs

- **Performance:** Page load should not regress — removing a duplicate rendering pass should, if anything, reduce response size and render time.
- **Security:** None identified beyond the existing page's posture.
- **Accessibility:** The collapse/expand toggle must be keyboard-operable (Enter/Space on a focused group header) and expose `aria-expanded` state for screen readers.
- **Audit:** None identified — this is a pure rendering change with no new data write.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

<!-- Populated at /definition-of-ready. -->
