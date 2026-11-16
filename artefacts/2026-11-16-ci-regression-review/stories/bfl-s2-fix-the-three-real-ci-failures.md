## Story: Fix the three test files that really fail in CI, then empty the baseline

**Status:** DRAFT for operator review. Depends on `bfl-s1` (the baseline lists only these three).
**Epic reference:** None - short-track
**Discovery reference:** None. Evidence: the per-file CI artefact from run 43811318391.
**Benefit-metric reference:** None - short-track
**Domain:** [ci, tests]

## User Story

As **the operator**,
I want **the last three failing test files fixed**,
So that **CI is fully green and the known-failures baseline is empty**.

## Benefit Linkage

**Metric moved:** None formal. Removes the last tolerated failures; a red result then always means something new.

## Root causes found so far

1. **`scripts/check-pipeline-state-integrity.js`, check C3:** feature `2026-10-30-test-fixture-hardening-continuation`, story `tfhc-s1` has `prStatus: merged` with `testPlan.passing` 4 below `totalTests` 5. A data fix: confirm five tests really pass for that story, then `node bin/skills advance 2026-10-30-test-fixture-hardening-continuation tfhc-s1 testPlan.passing=5`. If only four pass, the plan or the count is corrected with the reason recorded.
2. **`tests/check-gpa-sc06-source-path-guard.js` and `tests/run-gpa-tests.js` (same T2):** the six adversarial vectors include two Windows-style paths (`..\..\.\Windows\System32\config\SAM` and `C:\Windows\System32\config\SAM`). `sourceIntegrity` in `scripts/ci-audit-comment.js` checks `path.resolve(sourcePath).startsWith(repoRoot + path.sep)`. On Linux (CI, and production) a backslash is not a path separator, so those two are ordinary filenames inside the repo and are not flagged, so T2 fails there; on Windows the same vectors are flagged and the tests pass. The guard is correct on Linux (no real traversal); the test is platform-specific. Two options, the second is my recommendation: (a) make the test assert the Windows-style vectors only when `path.sep` is a backslash; (b) do (a) and also normalise backslashes to `/` inside the guard (defence in depth, flags those two on every platform), with a test for each. Also note the guard resolves against the current directory, not `repoRoot`, which fails closed (false positives) when run from another directory.

## Architecture Constraints

- One root cause per pull request if the fixes are independent; retiring a check needs the reason recorded and operator approval.
- When a file is fixed its entry is removed from `tests/known-baseline-failures.json` in the same PR (the `bfl-s1` stale-entry check enforces this).
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain; platform change policy (scripts via pull request); no other Active ADR engaged. Zero new npm dependencies.

## Acceptance Criteria

**AC1:** Given `check-pipeline-state-integrity`, When run, Then C3 passes and no other check is affected.

**AC2:** Given the gpa path-guard tests, When run on Linux (CI) and on Windows, Then both pass, and the two Windows-style vectors are asserted according to the chosen option.

**AC3:** Given the baseline, When this story merges, Then `files` is empty and CI reports "0 file(s) currently failing".

**AC4:** Given the guard (if option b), When called with the six vectors plus a valid in-repo path from any working directory, Then the six are flagged and the valid path is not.

## Out of Scope

- Any other test; the baseline mechanism itself.

## Open questions

1. Option (a) test-only or (b) test plus guard hardening? Agent recommends (b).

## Complexity Rating

**Rating:** 1 to 2. **Scope stability:** Stable once the option is chosen.
