## Story: De-emphasize Unknown Health Visually

**Epic reference:** artefacts/2026-09-02-product-dashboard-triage/epics/dashboard-triage.md
**Discovery reference:** artefacts/2026-09-02-product-dashboard-triage/discovery.md
**Benefit-metric reference:** artefacts/2026-09-02-product-dashboard-triage/benefit-metric.md

## User Story

As a **Tech lead / squad lead**,
I want items with Unknown health to render in quiet, recessive styling rather than a competing colored badge,
So that real Warning and Blocked signals are the only visually loud health indicators on the page.

## Benefit Linkage

**Metric moved:** Health-Signal Trustworthiness
**How:** Restyling `Unknown` from a colored badge to quiet grey text directly reduces the proportion of competing-weight badges from 51% to 0% — the metric's exact target.

## Architecture Constraints

- Pure styling/rendering change to the `HEALTH_COLORS`/`HEALTH_LABELS` mapping and badge markup in `_renderProductView`/`_renderConsolidatedFeaturesSection` (`src/web-ui/routes/products.js`) — confirmed via discovery-time investigation that `computeHealthCounts` (the underlying health-computation logic) is out of scope and untouched.
- No new npm dependencies.

## Dependencies

- **Upstream:** None.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given an item with Unknown health, When it renders in the By Module/By Phase/All list, Then it displays in quiet grey text without a colored badge background.

**AC2:** Given an item with real Healthy, Warning, or Blocked health, When it renders alongside Unknown items, Then its existing colored badge styling is unchanged from today.

**AC3:** Given the top-level "Overall" health summary line on the product page, When the product's own overall computed signal is itself `unknown` (e.g. no rollup data exists at all), Then that overall line also uses the same de-emphasized treatment, not a competing colored badge.

## Out of Scope

- Computing real health for items currently showing Unknown — a separate, materially larger initiative per the discovery's own Out of Scope (extending health computation to story-level granularity).

## NFRs

- **Performance:** None — pure styling change.
- **Security:** None identified.
- **Accessibility:** The de-emphasized treatment must remain readable — sufficient contrast against the page background to meet WCAG 2.1 AA, not so faint it becomes illegible.
- **Audit:** None identified.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

<!-- Populated at /definition-of-ready. -->
