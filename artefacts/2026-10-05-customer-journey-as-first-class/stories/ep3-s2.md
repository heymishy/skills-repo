## Story: Journey health indicators: per-stage health state and summary bar
**Epic reference:** artefacts/2026-10-05-customer-journey-as-first-class/epics/journey-health-and-customer-experience-views.md
**Discovery reference:** artefacts/2026-10-05-customer-journey-as-first-class/discovery.md
**Benefit-metric reference:** artefacts/2026-10-05-customer-journey-as-first-class/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Tech lead / squad lead**,
I want **per-stage health state indicators on the canvas and a summary bar showing overall journey metric coverage**,
So that **I can assess where a journey has metric coverage gaps and where delivery work is missing**.
## Benefit Linkage
M3 — Journey-level metric coverage — health indicators make M3 visible and actionable on the canvas.
## Architecture Constraints
Health state indicators must use icon + label, not colour alone (MC-A11Y-02). Health computation is server-side at render time (no separate background job). No new npm runtime dependencies.
## Dependencies
ep2-s2, ep3-s1
## Acceptance Criteria
Given a stage has at least one mapped feature AND at least one metric key selected across its mappings,
When the canvas renders,
Then the stage card displays a ✅ health indicator with an accessible label.

Given a stage has mapped features but no metric keys selected across any of its mappings,
When the canvas renders,
Then the stage card displays a ⚠️ health indicator with an accessible label.

Given a stage has no mapped features and no metric keys,
When the canvas renders,
Then the stage card displays a ❌ health indicator with an accessible label.

Given the journey canvas loads,
When the summary bar renders,
Then it displays "X of Y stages have metric coverage" where X is the count of ✅ stages and Y is the total stage count.

Given health state indicators are displayed,
When a screen reader or keyboard user focuses a stage card,
Then the health state is communicated via both a visual icon and an accessible label (not colour alone, per MC-A11Y-02).

Given health state is computed,
When the underlying feature mappings or metric keys change (add, remove, update),
Then the health state indicator updates to reflect the current state without requiring a full page reload.
## Out of Scope
PostHog-derived health signals (out of scope per discovery), journey-level aggregated health score across multiple journeys, automated alerts when health degrades.
## NFRs
Health state indicators: icon + label (MC-A11Y-02). Health computation server-side at render time. WCAG 2.1 AA. No new npm runtime dependencies.
## Complexity Rating
**Rating:** 2
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
