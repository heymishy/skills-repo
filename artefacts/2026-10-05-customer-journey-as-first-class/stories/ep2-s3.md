## Story: Delivery view: feature and metric annotation rows on stage cards
**Epic reference:** artefacts/2026-10-05-customer-journey-as-first-class/epics/feature-mapping-and-delivery-view.md
**Discovery reference:** artefacts/2026-10-05-customer-journey-as-first-class/discovery.md
**Benefit-metric reference:** artefacts/2026-10-05-customer-journey-as-first-class/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Tech lead / squad lead**,
I want **a Delivery view on the canvas that shows feature names and metric values as annotation rows below each stage card**,
So that **I can see at a glance which features and metrics are attached to each stage**.
## Benefit Linkage
M2 — Feature-to-stage mapping adoption — the Delivery view surfaces existing mappings, making the M2 metric visible. M3 — Journey-level metric coverage — metric values are displayed at the stage where they are relevant.
## Architecture Constraints
View toggle is client-side (no server round-trip) per the design decision in `design.md`. No new npm runtime dependencies.
## Dependencies
ep2-s2
## Acceptance Criteria
**AC1:** Given I switch to the Delivery view on the journey canvas,
When the view renders,
Then each stage card shows annotation rows listing: the names and slugs of all mapped features (or "No features mapped" if none), and for each feature the selected metric keys and their values from `pipeline-state.json` (or "No metrics selected" if `metric_keys` is empty).

**AC2:** Given a mapped feature no longer exists in `pipeline-state.json`,
When the Delivery view renders that stage,
Then the feature is shown as "⚠️ Feature not found (slug)" with a remove affordance — no crash, no silent omission.

**AC3:** Given I switch between Canvas, Customer experience, and Delivery views,
When the view toggle is activated,
Then annotation rows show or hide via CSS class without a server round-trip.

**AC4:** Given the Delivery view renders metric values,
When a metric key has no recorded value in `pipeline-state.json`,
Then the metric row shows "No value recorded" — not blank, not an error.

## Out of Scope
Editing mappings from the Delivery view (deferred), removing mappings (deferred for MVP), health indicators (ep3-s2), customer experience annotation rows (ep3-s1).
## NFRs
View toggle client-side. Feature-not-found case handled gracefully. No new npm runtime dependencies. WCAG 2.1 AA — annotation rows readable by screen reader.
## Complexity Rating
**Rating:** 2
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
