## Story: Stage 3 design lens in `/implementation-review`
**Epic reference:** artefacts/2026-09-30-refactoring-and-product-health/epics/receipt-readers.md
**Discovery reference:** artefacts/2026-09-30-refactoring-and-product-health/discovery.md
**Benefit-metric reference:** artefacts/2026-09-30-refactoring-and-product-health/benefit-metric.md
**Domain:** software-engineering
## User Story
As a **Tech lead / squad lead**,
I want **`/implementation-review` to include a Stage 3 that reads refactor receipts from `pipeline-state.json` and examines the task batch for cross-task duplication, emerging abstractions, and receipt coherence**,
So that **cross-task design findings are surfaced before a PR merges (design lens findings per feature ≥1 per feature)**.
## Benefit Linkage
Design lens findings per feature (Metric 3 — count of distinct findings produced by Stage 3 per feature) — this story is the sole driver of this metric.
## Architecture Constraints
ADR-011 (artefact-first: SKILL.md behavioural change requires story chain); Platform change policy (SKILL.md changes via PR with tech lead review); PAT-07 (Stage 3 is a distinct exit point in `/implementation-review` — grouped as one story because all Stage 3 instruction text lands at the same exit sequence).
## Dependencies
ep1-s1 (schema must declare `refactorReceipt`); ep1-s2 (receipts must be writable so Stage 3 has data to read)
## Acceptance Criteria
Given an agent or tech lead runs `/implementation-review` on a task batch where at least one task has a `refactorReceipt` in `pipeline-state.json`,
When Stage 3 executes,
Then the review reads the `refactorReceipt` entries for all tasks in the batch and examines: cross-task duplication, emerging abstractions named across receipts, `changes[]` coherence against the actual diff, and `diffScope` patterns.

Given Stage 3 identifies at least one design finding,
When the review artefact is written,
Then the finding is recorded in a Stage 3 section of the artefact with a description, the affected task(s), and a recommended action (advisory — does not block the review from proceeding).

Given Stage 3 finds no design issues,
When the review artefact is written,
Then Stage 3 records "No design findings" explicitly — the stage must run and record its conclusion whether or not findings exist.

Given a task batch where no tasks have any `refactorReceipt` entry (e.g. first feature under the new protocol, or ep1-s2 not yet merged),
When Stage 3 executes,
Then it records "No receipts available for this batch — Stage 3 cannot assess receipt coherence" and proceeds without error.
## Out of Scope
- Automated diff parsing or static analysis (Stage 3 is an instruction-level review, not a code tool)
- Any changes to the DoD gate (that is ep2-s2)
- Any changes to `/improve` or `/workflow` (those are ep2-s3)
## NFRs
Stage 1 and Stage 2 behaviour in `/implementation-review` must be unchanged; Stage 3 is purely additive.
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
