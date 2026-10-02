## Story: `/tdd` REFACTOR step receipt protocol
**Epic reference:** artefacts/2026-09-30-refactoring-and-product-health/epics/receipt-foundation.md
**Discovery reference:** artefacts/2026-09-30-refactoring-and-product-health/discovery.md
**Benefit-metric reference:** artefacts/2026-09-30-refactoring-and-product-health/benefit-metric.md
**Domain:** software-engineering
## User Story
As a **Developer / engineer**,
I want **zero silent skips), I need the `/tdd` REFACTOR step to require a structured receipt or an explicit skip reason, and the `/verify-completion` scope-creep check to allow structural-only file rewrites that are already in the DoR contract**,
So that **refactor discipline is visible and measurable (receipt coverage rate ≥80%**.
## Benefit Linkage
Receipt coverage rate (Metric 1 — percentage of tasks with a receipt or explicit skip reason) and skipped-without-reason rate (Metric 2 — percentage of tasks with neither a receipt nor an explicit skip reason) — this story is the primary driver of both.
## Architecture Constraints
ADR-011 (artefact-first: SKILL.md behavioural change requires story chain); Platform change policy (SKILL.md changes via PR with tech lead review); PAT-07 (group instruction-text-only changes at the same exit point — the `/tdd` REFACTOR exit and the `/verify-completion` refactor carve-out are co-located concerns grouped here).
## Dependencies
ep1-s1 (schema and `advance` JSON-object write must be in place)
## Acceptance Criteria
Given an agent has completed the GREEN step and the full test suite is passing,
When the agent reaches the REFACTOR step in `/tdd`,
Then the SKILL.md instructs the agent to either (a) apply structural improvements and produce a completed receipt with `changes[]`, `testResult`, and `diffScope`, or (b) write an explicit skip receipt with a `reason` — and a silent skip (no receipt field) is explicitly named as a protocol violation.

Given the agent writes a completed receipt after a successful refactor,
When `bin/skills advance` is invoked with the receipt as a JSON-object value,
Then `pipeline-state.json` records the receipt at `tddState.refactorReceipt` with all required fields present.

Given the agent writes a skip receipt,
When `bin/skills advance` is invoked with `status: "skipped"` and a non-empty `reason`,
Then `pipeline-state.json` records the skip receipt and the task is considered complete.

Given a refactor step results in a test failure (`testResult: "fail"`),
When the agent records the receipt,
Then the SKILL.md instructs the agent to revert the refactor, record the `fail` receipt as evidence (not overwrite it), and write a follow-up skip receipt with `reason: "refactor caused test failure — reverted"`.

Given a `/verify-completion` scope-creep check runs on a task that applied a refactor,
When the diff touches files already listed in the DoR contract and the test suite is green,
Then the scope-creep check does not flag structural-only rewrites of those files as scope violations.
## Out of Scope
- Automated detection of whether a diff is structural-only (advisory instruction only, not a code check)
- Any changes to Stage 3 design lens (that is ep2-s1)
- Any changes to `/workflow` silent-skip warnings (that is ep2-s3)
## NFRs
SKILL.md changes must preserve all existing RED and GREEN step behaviour; no existing TDD workflow instruction is removed or weakened.
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
