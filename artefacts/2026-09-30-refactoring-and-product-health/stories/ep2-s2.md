## Story: Design health dimension at DoD and `/improve`
**Epic reference:** artefacts/2026-09-30-refactoring-and-product-health/epics/receipt-readers.md
**Discovery reference:** artefacts/2026-09-30-refactoring-and-product-health/discovery.md
**Benefit-metric reference:** artefacts/2026-09-30-refactoring-and-product-health/benefit-metric.md
**Domain:** software-engineering
## User Story
As a **Tech lead / squad lead**,
I want **`/definition-of-done` to confirm and record the design dimension status, and `/improve` to compute Metrics 1–4 and snapshot the design dimension time series**,
So that **the design dimension is present in the health roll-up for every feature run under the new protocol (health model design dimension coverage = 100%)**.
## Benefit Linkage
Health model design dimension coverage (Metric 5 — percentage of features run under the new protocol that have a design dimension status at DoD) — primary driver; also surfaces receipt coverage rate (Metric 1), skipped-without-reason rate (Metric 2), and refactor-caused test failures (Metric 4 — count of test suite failures caused directly by a refactor step) in the `/improve` summary.
## Architecture Constraints
ADR-003 (schema-first: `designHealth` object must be declared in schema before DoD or `/improve` writes it — covered by ep1-s1); ADR-011 (artefact-first: SKILL.md behavioural changes require story chain); Platform change policy.
## Dependencies
ep1-s1 (schema must declare `designHealth`); ep1-s2 (receipts must be writable)
## Acceptance Criteria
Given a feature has completed all stories and `/definition-of-done` is running,
When the DoD skill reads `pipeline-state.json` for the feature,
Then it computes `designHealth` from the feature's task-level `refactorReceipt` entries using the v0 formula: `receiptCoverageRate`, `silentSkipRate`, `refactorCausedFailures`, `designLensFindingsCount`, and `status` (`green | amber | not-computed`).

Given the computed `designHealth.status` is `green` or `amber`,
When DoD writes the artefact,
Then the design dimension is recorded in the DoD artefact with all five fields and the feature's `pipeline-state.json` is updated with the `designHealth` object via `bin/skills advance`.

Given the computed `designHealth.status` is `not-computed` (no tasks have any `refactorReceipt` field),
When DoD writes the artefact,
Then DoD records "Design dimension: not-computed — no receipts found" as a DoD finding (acknowledged, not a hard block), and `pipeline-state.json` is updated accordingly.

Given `/improve` runs on a feature that has a `designHealth` object in `pipeline-state.json`,
When the improve skill computes its rolling summary,
Then it includes Metrics 1–4 values for the feature and appends a `designHealth` snapshot entry to the time series in the improve artefact.

Given `/improve` runs on a feature with no `designHealth` object (pre-protocol feature),
When the improve skill computes its rolling summary,
Then it skips the design dimension for that feature and notes "Design dimension not available for pre-protocol features."
## Out of Scope
- The design dimension ever becoming a hard block (advisory only in v0)
- `/workflow` silent-skip warnings (that is ep2-s3)
- Static-analysis metrics (deferred to Phase 5+)
## NFRs
All existing DoD gate checks and `/improve` reporting are unchanged; design dimension is purely additive.
## Complexity Rating
**Rating:** 2
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
