## Story: Stage side panel: edit all optional attributes
**Epic reference:** artefacts/2026-10-05-customer-journey-as-first-class/epics/journey-entity-and-stage-management.md
**Discovery reference:** artefacts/2026-10-05-customer-journey-as-first-class/discovery.md
**Benefit-metric reference:** artefacts/2026-10-05-customer-journey-as-first-class/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Outer loop practitioner (PO / SME / discovery lead)**,
I want **a side panel that opens when I click a stage card and lets me edit all optional stage attributes with autosave on blur**,
So that **I can enrich a stage beyond its name**.
## Benefit Linkage
M3 — Journey-level metric coverage — pain points, opportunities, and emotion attributes are surfaced in health views; richer stages support more meaningful metric attribution.
## Architecture Constraints
ADR-025 — all `customer_journey_stages` updates scoped to `tenantId`. Side panel must trap focus when open; Escape closes it (WCAG 2.1 AA). Design system reference (`artefacts/2026-09-18-design-system-adoption/reference/DESIGN.md`) must be consulted before implementing the side panel component.
## Dependencies
ep1-s2
## Acceptance Criteria
**AC1:** Given I click a stage card,
When the side panel opens,
Then the panel displays editable fields for: description (textarea), customer actions (textarea), touchpoints (textarea), channel (select: web, mobile, in-person, phone, email, other), emotion (select: positive, neutral, negative, mixed), pain points (textarea), opportunities (textarea), moment of truth (toggle/checkbox).

**AC2:** Given I edit a field and move focus away (blur),
When autosave fires,
Then a PATCH request updates the `customer_journey_stages` record for that field and a success indicator is shown briefly.

**AC3:** Given I toggle "moment of truth" on,
When the stage card re-renders,
Then a visible moment-of-truth indicator (icon + label) appears on the stage card.

**AC4:** Given the side panel is open,
When I press Escape,
Then the side panel closes and focus returns to the stage card that opened it.

**AC5:** Given the side panel is open,
When a keyboard user navigates within the panel,
Then focus is trapped inside the panel until it is closed (WCAG 2.1 AA focus management).

## Out of Scope
View mode annotation rows (ep3-s1 and ep2-s3), health indicators (ep3-s2), feature mapping from the side panel (ep2-s2).
## NFRs
WCAG 2.1 AA focus management. Autosave on blur (no explicit save button required, but save button optional). Design system component patterns. No new npm runtime dependencies.
## Complexity Rating
**Rating:** 2
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
