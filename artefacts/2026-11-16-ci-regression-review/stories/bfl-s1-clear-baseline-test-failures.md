## Story: Fix or retire the five permanently failing test files so a clean suite run is possible

**Status:** DRAFT for operator review.
**Epic reference:** None - short-track
**Discovery reference:** None. Evidence: every full local run shows the same failures, which CI tolerates through a stored-baseline "no new failures" comparison: `scripts/check-pipeline-state-integrity.js` (C3: tfhc-s1 merged with `testPlan.passing` 4 below `totalTests` 5), `tests/check-pcr-s1-test-runner.js`, `tests/check-p3.5-validate-trace.js`, `tests/check-rtvap-s1-archived-test-plan-coverage.js`, `tests/check-p4-enf-second-line.js` (passes alone, fails in the full run).
**Benefit-metric reference:** None - short-track
**Domain:** [ci, tests]

## User Story

As **the operator**,
I want **the suite to pass cleanly**,
So that **any red result is a real signal and the baseline comparison is no longer needed to hide old failures**.

## Benefit Linkage

**Metric moved:** None formal. Removes the need for a failure baseline and ends the habit of reading past known failures.

## Architecture Constraints

- **One failing file at a time, root cause first.** For each file the agent determines why it fails and picks one outcome with the evidence: fix the test, fix the code or data, or retire the check with a reason recorded in `decisions.md`. No file is deleted without that evidence and without operator approval for retirement.
- **tfhc-s1 (C3):** the data fix is `node bin/skills advance ... testPlan.passing=5` if five tests really pass; the agent verifies that before writing it.
- **p4-enf-second-line:** passes alone and fails in the full run, so it has a hidden dependency on shared state or timing; find it rather than excluding the file.
- **When all five are fixed or retired,** the CI baseline mechanism is not removed in this story (a follow-up), but the baseline file is emptied and a check asserts it stays empty.
- Changes under `scripts/` and CI config merge through a pull request.

## Acceptance Criteria

**AC1:** Given each of the five files, When run in the full suite, Then it passes or has been retired with a recorded reason and operator approval.

**AC2:** Given the full suite, When run on master after the story, Then it reports zero failures.

**AC3:** Given the CI baseline, When the story merges, Then the baseline list is empty and a test fails if a file is added to it without a story id.

## Out of Scope

- Removing the baseline mechanism itself; adding tests.

## Complexity Rating

**Rating:** 2 (five independent root causes). **Scope stability:** Unstable until each cause is known; may split into one story per file.
