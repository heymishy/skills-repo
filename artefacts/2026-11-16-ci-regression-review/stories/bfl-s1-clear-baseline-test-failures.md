## Story: Shrink the CI known-failures baseline from 70 files to the 3 that actually fail, and fix those 3

**Status:** DRAFT for operator review. **Rewritten 2026-11-16** after reading a real CI log (it replaces the earlier "five permanent failures" framing, which was based on a local Windows run).
**Epic reference:** None - short-track
**Discovery reference:** None. Evidence: CI run 43806886880 (PR Checks, unit chain): `ci-test-regression-check` reports "3 file(s) currently failing, 70 in known baseline (recorded 2026-07-16)" and "67 baseline file(s) now pass (consider removing from the baseline list)". The three still failing in CI are `scripts/check-pipeline-state-integrity.js` (C3: tfhc-s1 merged with `testPlan.passing` 4 below `totalTests` 5), `tests/check-gpa-sc06-source-path-guard.js` and `tests/run-gpa-tests.js`.
**Benefit-metric reference:** None - short-track
**Domain:** [ci, tests]

## User Story

As **the operator relying on CI to catch regressions**,
I want **the known-failures baseline to list only files that really fail**,
So that **a regression in any of the other 67 files turns CI red instead of being excused as "already known"**.

## Benefit Linkage

**Metric moved:** None formal. Closes a silent hole: today 67 files that pass are on the tolerated list, so if any of them breaks the check still says "no new regressions". That is a larger risk than the three real failures.
**How:** shrink `tests/known-baseline-failures.json` to the three files that really fail, then fix each of the three so the baseline can be emptied.

## Architecture Constraints

- **Step 1, tighten (the valuable part, small):** set `files` in `tests/known-baseline-failures.json` to exactly the files that fail in CI on the current master, derived from a real CI run or a local Linux run (not from a Windows run, where some files fail for environment reasons: on this operator's Windows machine `check-p4-enf-second-line`, `check-rtvap-s1-archived-test-plan-coverage` and sometimes `check-p3.5-validate-trace` fail because `bash` and `sh` do not work, and they pass in CI). `recordedAt` and `note` updated. A check asserts the list never contains a file that currently passes in the latest recorded results (so it cannot go stale again): `trr-s1`'s `test-results.json` artefact is the intended data source once it exists.
- **Step 2, fix the three (separate PRs if causes differ):** `check-pipeline-state-integrity.js` C3 is a data fix (`node bin/skills advance 2026-10-30-test-fixture-hardening-continuation tfhc-s1 testPlan.passing=5` after confirming five tests really pass); the two `gpa` files need a root cause first.
- **Retiring a check** needs the reason recorded in `decisions.md` and operator approval; nothing is deleted without them.
- **Local-environment note (not a CI defect):** a documented note that the suite on Windows needs a working `bash` (WSL or Git Bash on PATH) for the trace-validation tests, so local failures there are not repo failures.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain; platform change policy applies (changes under `scripts/` and test config via PR). No other Active ADR engaged. Zero new npm dependencies.

## Acceptance Criteria

**AC1:** Given the baseline file, When the story merges, Then it lists only files that fail in CI on master, and `ci-test-regression-check` no longer prints "baseline file(s) now pass".

**AC2:** Given one of the 67 formerly tolerated files, When it is deliberately broken in a test branch, Then CI reports a new regression and fails (verified once, then reverted).

**AC3:** Given each of the three real failures, When fixed or retired with a recorded reason, Then it passes in CI and is removed from the baseline.

**AC4:** Given the baseline list is empty, When a test file is added to it without a story id in the note, Then a check fails.

## Out of Scope

- Removing the baseline mechanism itself; adding tests; performance.

## NFRs

Reliability: derive the baseline from CI data, not from one developer machine. Safety: no test is deleted or skipped without recorded approval.

## Complexity Rating

**Rating:** 1 for step 1, 2 for step 2. **Scope stability:** Stable for step 1.

## Open questions

1. Do you want step 1 shipped first as its own PR (my recommendation: it removes the biggest risk in one small change) with step 2 following per file?
