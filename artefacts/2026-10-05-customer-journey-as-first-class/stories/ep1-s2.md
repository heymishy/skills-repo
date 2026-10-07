## Story: Add and name stages: POST route, inline name entry, and stage card rendering
**Epic reference:** artefacts/2026-10-05-customer-journey-as-first-class/epics/journey-entity-and-stage-management.md
**Discovery reference:** artefacts/2026-10-05-customer-journey-as-first-class/discovery.md
**Benefit-metric reference:** artefacts/2026-10-05-customer-journey-as-first-class/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Outer loop practitioner (PO / SME / discovery lead)**,
I want **to add stages via an "+ Add stage" control that inserts a new stage card at the end of the linear sequence with an inline name field**,
So that **I can build out the skeleton of a journey**.
## Benefit Linkage
M1 — Journey adoption — stages are the substance of a journey; without stages a journey is an empty shell with no M2 or M3 signal.
## Architecture Constraints
ADR-025 — `tenantId` set on every `journey_stages` insert. Stage `position` column is an integer ordinal; new stages are appended at `max(position) + 1`. No new npm runtime dependencies.
## Dependencies
ep1-s1, ep5-s1
## Acceptance Criteria
Given I click "+ Add stage" on the journey canvas,
When the new stage card renders,
Then a new stage card appears at the end of the sequence with an inline name field in focus.

Given I type a name and submit (Enter or blur),
When the POST handler saves the stage,
Then a `journey_stages` record is inserted with `journey_id`, `tenant_id`, `name`, `position` (appended at end), `created_at`, `updated_at`, and the stage card renders with the saved name.

Given I submit with no name (blank),
When the handler processes the request,
Then a 400 response is returned, no record is inserted, and the inline field shows an error state.

Given the stage is saved,
When the canvas re-renders,
Then the stage card shows the stage name and a "Edit stage" affordance.
## Out of Scope
Stage attribute editing beyond name (ep1-s3), drag-and-drop reorder (ep1-s4), health indicators (ep3-s2), feature mapping (ep2-s2).
## NFRs
Injectable adapter for Postgres calls (D37). WCAG 2.1 AA — inline name field keyboard-accessible. No new npm runtime dependencies.
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
