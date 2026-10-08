## Story: Feature-to-stage mapping: save mapping with metric key selection
**Epic reference:** artefacts/2026-10-05-customer-journey-as-first-class/epics/feature-mapping-and-delivery-view.md
**Discovery reference:** artefacts/2026-10-05-customer-journey-as-first-class/discovery.md
**Benefit-metric reference:** artefacts/2026-10-05-customer-journey-as-first-class/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Outer loop practitioner (PO / SME / discovery lead)**,
I want **to select a feature from the picker, optionally choose metric keys from that feature's DoD record, and save the mapping**,
So that **a stage reflects which features contribute to it and which metrics are relevant**.
## Benefit Linkage
M2 — Feature-to-stage mapping adoption — this story creates the `feature_customer_journey_stage_mappings` record that M2 counts. M3 — Journey-level metric coverage — metric key selection is the mechanism that populates stage-level metric data.
## Architecture Constraints
ADR-025 — `tenantId` set on every `feature_customer_journey_stage_mappings` insert. ADR-016 — `pipeline-state.json` read-only (metric keys sourced from DoD record, not written back). No new npm runtime dependencies.
## Dependencies
ep2-s1, ep5-s1
## Acceptance Criteria
**AC1:** Given I select a feature in the feature picker modal,
When the feature is selected,
Then a metric key picker is shown listing available DoD metric keys from that feature's record in `pipeline-state.json` (or "No metrics recorded" if none exist).

**AC2:** Given I select one or more metric keys and confirm,
When the mapping is saved,
Then a `feature_customer_journey_stage_mappings` record is inserted with `journey_stage_id`, `journey_id`, `tenant_id`, `feature_slug`, `metric_keys` (JSONB array of selected keys), `created_at`.

**AC3:** Given I confirm without selecting any metric keys,
When the mapping is saved,
Then a `feature_customer_journey_stage_mappings` record is inserted with `metric_keys: []` — a feature can be mapped without metric keys.

**AC4:** Given I map the same feature to the same stage a second time (a mapping already exists for this feature + stage combination),
When the save completes,
Then the stage shows exactly one mapping for that feature — not two — and its saved metric keys reflect the most recent selection.

**AC5:** Given a cross-tenant `journey_stage_id` is used in the request,
When the insert is processed,
Then a 403 response is returned and no record is inserted.

## Out of Scope
Removing a mapping (deferred), editing metric keys after initial save (deferred for MVP), Delivery view annotation rendering (ep2-s3).
## NFRs
Upsert on `journey_stage_id` + `feature_slug`. `tenantId` guard on all inserts (ADR-025). Injectable adapter for Postgres calls (D37). No new npm runtime dependencies.
## Complexity Rating
**Rating:** 2
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
