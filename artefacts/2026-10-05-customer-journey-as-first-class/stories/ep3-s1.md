## Story: Customer experience view: emotion, pain points, opportunities annotation rows
**Epic reference:** artefacts/2026-10-05-customer-journey-as-first-class/epics/journey-health-and-customer-experience-views.md
**Discovery reference:** artefacts/2026-10-05-customer-journey-as-first-class/discovery.md
**Benefit-metric reference:** artefacts/2026-10-05-customer-journey-as-first-class/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Outer loop practitioner (PO / SME / discovery lead)**,
I want **a Customer experience view that shows emotion, pain points, and opportunities as annotation rows below each stage card**,
So that **I can review the customer experience dimension of each stage alongside delivery context**.
## Benefit Linkage
M1 — Journey adoption — a richer canvas with multiple view modes makes journeys more valuable to practitioners, supporting sustained adoption beyond initial creation.
## Architecture Constraints
View toggle is client-side (no server round-trip). Emotion display must use colour chip + text label (MC-A11Y-02 — not colour alone). No new npm runtime dependencies.
## Dependencies
ep1-s3, ep2-s3
## Acceptance Criteria
Given I switch to the Customer experience view on the journey canvas,
When the view renders,
Then each stage card shows annotation rows for: emotion (chip/badge using the stage's `emotion` enum value, or "Not set"), pain points (text or "Not set"), and opportunities (text or "Not set").

Given a stage has no emotion, pain points, or opportunities set,
When the Customer experience view renders for that stage,
Then all three annotation rows show "Not set" — no rows are hidden or omitted.

Given I switch between Canvas, Customer experience, and Delivery views,
When the view toggle is activated,
Then annotation rows show or hide via CSS class without a server round-trip, consistent with ep2-s3 view toggle behaviour.

Given an emotion value is displayed,
When the annotation row renders,
Then the emotion is shown using both a colour chip and a text label (not colour alone, per MC-A11Y-02).
## Out of Scope
Health state indicators (ep3-s2), Delivery view annotation rows (ep2-s3), editing stage attributes from the canvas view (editing is via the side panel per ep1-s3).
## NFRs
View toggle client-side (no server round-trip). Emotion display: colour chip + text label (MC-A11Y-02). WCAG 2.1 AA. No new npm runtime dependencies.
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
