## Story: Add a Triage Summary Strip for Blocked/Warning Counts

**Epic reference:** artefacts/2026-09-02-product-dashboard-triage/epics/dashboard-triage.md
**Discovery reference:** artefacts/2026-09-02-product-dashboard-triage/discovery.md
**Benefit-metric reference:** artefacts/2026-09-02-product-dashboard-triage/benefit-metric.md

## User Story

As a **Platform maintainer / product owner**,
I want a clickable summary strip at the top of the product page showing Blocked and Warning counts,
So that I can identify what needs my attention without scrolling through the full feature list.

## Benefit Linkage

**Metric moved:** Time to First Actionable Content
**How:** The triage strip becomes the very first interactive content on the page, giving an immediate, clickable answer to "what needs attention" before any list-scrolling is needed.

## Architecture Constraints

- Reuses the existing health-computation data (`healthCounts`, already computed server-side in `_renderProductView` via `_productRollup.computeOverallHealthSignal`) — no new computation, only a new rendering block using data already available on the page.
- Must reuse the existing health-filter-chip mechanism already on the page for the strip's own click-through behaviour, rather than building a second, parallel filtering system.
- No new npm dependencies.

## Dependencies

- **Upstream:** None — can be built independently of pdt-s1, though it visually sits above pdt-s1's consolidated list.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a product with at least one Blocked or Warning health item, When the operator loads `/products/:id`, Then a summary strip renders above the feature list showing the Blocked and Warning counts.

**AC2:** Given the summary strip shows a non-zero Blocked count, When the operator clicks it, Then the page filters to show only Blocked items, reusing the existing health-filter-chip mechanism already on the page.

**AC3:** Given a product with zero Blocked and zero Warning items, When the operator loads `/products/:id`, Then the summary strip shows a clear "nothing blocked" state rather than an empty or missing strip.

## Out of Scope

- A "stalled 30+ days" count — requires a staleness computation not currently available server-side; deferred to a future story if warranted.
- A "new this week" count — same reason as above, deferred.

## NFRs

- **Performance:** Negligible — reuses already-computed data, no new query.
- **Security:** None identified.
- **Accessibility:** Strip counts must be real, keyboard-operable links or buttons, not styled `<div>` elements with only a click handler.
- **Audit:** None identified.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

<!-- Populated at /definition-of-ready. -->
