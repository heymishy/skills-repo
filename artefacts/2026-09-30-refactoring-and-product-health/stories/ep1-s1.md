## Story: Schema co-evolution and `advance` JSON-object write verification
**Epic reference:** artefacts/2026-09-30-refactoring-and-product-health/epics/receipt-foundation.md
**Discovery reference:** artefacts/2026-09-30-refactoring-and-product-health/discovery.md
**Benefit-metric reference:** artefacts/2026-09-30-refactoring-and-product-health/benefit-metric.md
**Domain:** software-engineering
## User Story
As a **Platform maintainer**,
I want **`pipeline-state.schema.json` to declare the `refactorReceipt` and `designHealth` fields, and `bin/skills advance` to support JSON-object values via dot-notation**,
So that **receipt data can be written atomically and read consistently by all downstream skills**.
## Benefit Linkage
Receipt coverage rate (Metric 1 — percentage of tasks with a receipt or explicit skip reason) — without a writable, schema-valid receipt field, no coverage can be measured.
## Architecture Constraints
ADR-003 (schema-first: fields declared before use); ADR-011 (artefact-first: this story is the artefact chain for the schema change).
## Dependencies
None
## Acceptance Criteria
Given `pipeline-state.schema.json` is updated to declare `tddState.refactorReceipt` as an object with required fields (`status`, `changes`, `testResult`, `diffScope`, `notes`, `reason`) and `feature.designHealth` as an object,
When a schema validation tool runs against a `pipeline-state.json` containing a completed receipt or a skip receipt,
Then validation passes with zero errors.

Given the `bin/skills advance` CLI is invoked with a dot-notation path and a JSON-string value (e.g. `tddState.refactorReceipt='{"status":"completed","changes":["..."],"testResult":"pass","diffScope":"internal"}'`),
When the advance command processes the argument,
Then the nested object is written correctly to `pipeline-state.json` at the specified path (not stored as a raw string).

Given `bin/skills advance` is invoked with an invalid JSON string as the value,
When the advance command processes the argument,
Then it exits with a non-zero code and a descriptive error message, and `pipeline-state.json` is not modified.
## Out of Scope
- Any skill instruction changes (those are ep1-s2)
- The `designHealth` computation logic (that is ep2-s2)
- Any CI enforcement of receipt presence
## NFRs
The advance command must not break existing scalar writes when the JSON-object extension is added.
## Complexity Rating
**Rating:** 2
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
