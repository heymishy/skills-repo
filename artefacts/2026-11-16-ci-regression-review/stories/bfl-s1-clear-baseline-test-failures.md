## Story: Shrink the CI known-failures baseline from 70 files to the 3 that actually fail, and stop it going stale

**Status:** Ready for build (DoR signed off 2026-11-16). Rewritten 2026-11-16 after reading a real CI log and the first `test-results.json` artefact; the three real failures are fixed in `bfl-s2`.
**Epic reference:** None - short-track
**Discovery reference:** None. Evidence: CI run 43806886880 and run 43811318391 (PR Checks, unit chain): `ci-test-regression-check` reports "3 file(s) currently failing, 70 in known baseline (recorded 2026-07-16)" and "67 baseline file(s) now pass". The per-file artefact from run 43811318391 (867 files, 864 passed, 3 failed) confirms the three: `scripts/check-pipeline-state-integrity.js`, `tests/check-gpa-sc06-source-path-guard.js`, `tests/run-gpa-tests.js`.
**Benefit-metric reference:** None - short-track
**Domain:** [ci, tests]

## User Story

As **the operator relying on CI to catch regressions**,
I want **the known-failures baseline to list only files that really fail, and to stay that way**,
So that **a regression in any of the other 67 files turns CI red instead of being excused as "already known"**.

## Benefit Linkage

**Metric moved:** None formal. Closes a silent hole: today 67 files that pass are on the tolerated list, so a break in any of them still ends with "no new regressions".
**How:** set `tests/known-baseline-failures.json` to the three files that really fail in CI, and make `scripts/ci-test-regression-check.js` fail when a baseline entry no longer fails (today it only prints "consider removing"), so the list can only shrink and never silently rots again.

## Architecture Constraints

- **Derived from CI, not a laptop.** The three files come from the CI artefact named above. On a Windows machine without a working `bash`, other files fail locally (`check-p4-enf-second-line`, `check-rtvap-s1-archived-test-plan-coverage`, sometimes `check-p3.5-validate-trace`); they pass in CI and must not be added.
- **Stale entries fail the check.** If a baseline file is not in the current failing set, the checker prints `stale baseline entry` for each and exits 1. When `bfl-s2` fixes a file it removes the entry in the same PR. The existing exit-0 behaviour for "all failures are baseline" is kept.
- **Flake caution:** only deterministic failures belong in the baseline. The three are deterministic (a data value, and a platform-specific vector list). A flaky file must be fixed or quarantined by its own story, never added here.
- **Existing tests** `tests/check-ci-test-regression-check.js` and `tests/check-tst-s1-baseline-triage.js` are updated only where they asserted the old "now passing is fine" behaviour or the old list size; each edit is listed in the evidence.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain; platform change policy applies (changes under `scripts/` and test config merge via a pull request, the operator merges); no other Active ADR engaged. Zero new npm dependencies.

## Acceptance Criteria

**AC1:** Given the baseline file, When this story merges, Then `files` lists exactly the three files that fail in CI, with `recordedAt` and `note` updated (the note names `bfl-s1` and `bfl-s2`).

**AC2:** Given a CI log in which one of the previously tolerated 67 files fails, When `ci-test-regression-check` runs, Then it exits 1 and names it as a NEW regression.

**AC3:** Given a CI log in which a baseline file does not fail, When `ci-test-regression-check` runs, Then it exits 1 and prints `stale baseline entry: <file>` for it.

**AC4:** Given a CI log whose failures are exactly the baseline, When it runs, Then it exits 0 and says so.

**AC5:** Given the two existing checker tests, When run, Then they pass, with only the assertions that encoded the old behaviour changed and listed.

**AC6 (live):** Given the next PR run after merge, When "Unit test chain" ends, Then the log shows "3 file(s) currently failing, 3 in known baseline" and the step passes. Operator-observed (read from the run log).

## Out of Scope

- Fixing the three failures (`bfl-s2`); removing the baseline mechanism; adding or removing any test.

## NFRs

Reliability: the baseline is data derived from CI, not from one machine. Safety: no test is deleted or skipped.

## Complexity Rating

**Rating:** 1. **Scope stability:** Stable.
