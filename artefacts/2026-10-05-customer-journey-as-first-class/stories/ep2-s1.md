## Story: Feature picker: read pipeline-state.json and render feature list in modal
**Epic reference:** artefacts/2026-10-05-customer-journey-as-first-class/epics/feature-mapping-and-delivery-view.md
**Discovery reference:** artefacts/2026-10-05-customer-journey-as-first-class/discovery.md
**Benefit-metric reference:** artefacts/2026-10-05-customer-journey-as-first-class/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Outer loop practitioner (PO / SME / discovery lead)**,
I want **a feature picker modal that reads `pipeline-state.json` at request time and presents a filterable list of features**,
So that **I can select features to map to a journey stage**.
## Benefit Linkage
M2 — Feature-to-stage mapping adoption — the feature picker is the mechanism that enables mappings; without it M2 cannot be measured.
## Architecture Constraints
ADR-016 (two-file state authority) — `pipeline-state.json` is read-only here; no write path. ADR-029 (local filesystem is canonical for artefact content) — read `pipeline-state.json` from the local checkout via `fs.readFileSync`; do not cache or duplicate feature metadata in Postgres. No new npm runtime dependencies.
## Dependencies
ep1-s2, ep5-s1
## Acceptance Criteria
Given I click "Map feature" on a stage card or in the Delivery view,
When the feature picker modal opens,
Then it displays a list of features from `pipeline-state.json` (all features for the tenant's repo), each showing the feature name and slug.

Given the feature list is long,
When the modal renders,
Then a filter/search input is available to narrow features by name or slug.

Given `pipeline-state.json` cannot be read (file not found or parse error),
When the modal attempts to load,
Then an error state is shown: "Features could not be loaded. Check that pipeline-state.json exists." — no modal crash.

Given I close the modal without selecting a feature,
When the modal closes,
Then no mapping is created and the canvas is unchanged.
## Out of Scope
Metric key selection (ep2-s2), saving the mapping (ep2-s2), Delivery view annotation rows (ep2-s3).
## NFRs
Read `pipeline-state.json` via `fs.readFileSync` (ADR-029). No Postgres write in this story. No new npm runtime dependencies. Modal keyboard-accessible (WCAG 2.1 AA).
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
