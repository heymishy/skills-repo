## Story: Record per-test-file results in CI so the next audit can use test history

**Status:** Ready for build (DoR signed off 2026-11-16); AC6 (live artefact check) added at test-plan time.
**Epic reference:** None - short-track
**Discovery reference:** None. Evidence: `ci-regression-scenarios-audit.md` limits: no per-test history exists, so which test files have never failed, which flake, which are slowest and which duplicate each other (about 30 files re-implement the same turn request mocks) cannot be answered.
**Benefit-metric reference:** None - short-track
**Domain:** [ci, tests]

## User Story

As **the operator planning what to cut or speed up**,
I want **every CI run to save each test file's pass/fail, duration and failing line**,
So that **the next review is based on weeks of data, not on a few days of run summaries**.

## Benefit Linkage

**Metric moved:** None formal. Enables evidence-based pruning, impact-based test selection and flake tracking.

## Architecture Constraints

- **Output:** `scripts/run-all-tests.js` already runs each file; it additionally writes `test-results.json` (file, status, duration in ms, first failing line, exit code) and the CI job uploads it as a workflow artefact with a retention of 90 days. No change to what runs or to pass/fail semantics.
- **No secrets or test output bodies** are stored beyond the first failing assertion line, truncated to 300 characters.
- **Aggregation (follow-up, not in this story):** a small script that downloads recent artefacts and prints never-failed, flaky (pass after fail on the same commit), slowest and duplicate-looking files.
- Changes under `scripts/` merge through a pull request.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain; the platform change policy (scripts and workflows merge via pull request, the operator merges) applies; no other Active ADR engaged. Zero new npm dependencies.

## Acceptance Criteria

**AC1:** Given a full suite run, When it ends, Then `test-results.json` lists every file run with status and duration, and its counts equal the runner's own summary line.

**AC2:** Given a failing file, When the run ends, Then its entry carries the exit code and the first failing assertion line, truncated.

**AC3:** Given CI, When a PR run ends, Then the file is uploaded as an artefact named for the run, kept 90 days.

**AC4:** Given the runner, When the results file cannot be written, Then the suite's outcome is unchanged and a warning is logged.

**AC5:** Given the existing runner tests, When run, Then they pass unchanged.

## Out of Scope

- The aggregation script; test selection; removing any test.

## Complexity Rating

**Rating:** 1. **Scope stability:** Stable.
