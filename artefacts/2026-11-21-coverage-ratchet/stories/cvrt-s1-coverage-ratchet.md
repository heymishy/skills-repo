## Story: Server code coverage is measured for the unit chain as well as the browser suite, and a pull request cannot lower either number

**Epic reference:** None - short-track (CI/CD improvement from the 2026-11-21 stand-back audit of the E2E suite and pipeline)
**Discovery reference:** None - short-track skips discovery. Evidence, measured on 2026-11-21 from the E2E coverage artefact of CI run 44841481150 (commit `60ee5b2c0`): the browser suite covers 66.42% of statements, 59.73% of branches, 44.96% of functions and 66.42% of lines of `src/web-ui/**` (38,200 of 57,505 statements). That number is informational only (`e2e.yml`, step "Server code coverage report (informational)"): nothing compares it with anything, so it can fall without any signal. The unit chain (890 `tests/check-*.js` files run by `scripts/run-all-tests.js`, 154 s of the PR Checks job) has no coverage measurement at all, so the true coverage of `src/` is unknown. Largest gaps in the browser suite alone: `server.js` (2,449 statements uncovered), `routes/journey.js`, `routes/products.js`, `routes/skills.js`; `routes/settings.js` 36.5%, `adapters/pipeline-state-github-writer.js` 26%, `routes/billing.js` 51%. Earlier in the same session 16 failing browser specs sat unnoticed in a non-blocking job for weeks: a rule that a measured quantity may not get worse is what would have surfaced that, without needing a perfect suite.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [ci] [testing]

## User Story

As **the operator reviewing pull requests on a repository where I am the only merge gate**,
I want **the unit chain's and the browser suite's server coverage to be measured on every pull request and compared with the base branch's recorded floor**,
So that **a change that quietly removes tests or adds untested code is visible (and fails a check) before I merge it, and the next coverage investment is chosen from a real, current number**.

## Benefit Linkage

**Metric moved:** unit-chain coverage goes from unmeasured to measured on every pull request; both suites go from "no floor" to "cannot fall by more than 0.5 percentage points against the base branch's recorded baseline"; the baseline is recorded for both suites on master.
**How:** the unit chain runs under c8 in the PR Checks job; a small script (`scripts/coverage-ratchet.js`) compares each suite's c8 summary with `tests/coverage-baseline.json` read from the base branch and fails when a metric drops below its floor.

## Architecture Constraints

- Change confined to: `scripts/coverage-ratchet.js` (new), `tests/coverage-baseline.json` (new), one new node check, `.github/workflows/pr-checks.yml` (run the unit chain under c8; run the ratchet; upload the summary) and `.github/workflows/e2e.yml` (one added step after the existing c8 report), and artefacts.
- `e2e.yml` keeps exactly one `continue-on-error` (the test run itself) and its job list unchanged: `tests/check-a5-ci-gate-config.js` and `tests/check-b2-ci-gate-config.js` guard both.
- c8 is run through `npx` at the pinned version already used in `e2e.yml` (`c8@10.1.3`); it is not added as a project dependency.
- The baseline is read from the base branch, as the known-failures baseline already is (gic-s1): a pull request cannot lower its own floor; a pull request that raises the baseline in its own copy takes effect after it merges.
- The existing unit-chain regression check (`scripts/ci-test-regression-check.js`) and its inputs are unchanged; coverage never changes which test files run or how their results are judged.
- Workflow and `scripts/` changes go through a pull request (platform change policy). Preserve each file's existing line endings.

## Dependencies

- **Upstream:** lpw-s1 (the browser suite's c8 server coverage), gic-s1 (reading a baseline from the base branch), trr-s1 (per-file test results), a5 and b2 (the e2e workflow guard checks).
- **Downstream:** a later story can merge the two suites' raw coverage into one combined number and set targeted coverage work from it.

## Acceptance Criteria

**AC1:** Given a c8 `json-summary` file and a baseline, When `scripts/coverage-ratchet.js` compares them, Then it exits 0 when every metric (statements, branches, functions, lines) is at least its baseline value minus the 0.5 percentage-point tolerance, and exits 1 naming each metric, its baseline and its measured value when any falls below that floor.
**AC2:** Given the baseline file is read from the base branch, When the base branch has no baseline file yet, Then the ratchet passes and says so; When the baseline file is present but malformed or lacks the suite's entry, Then it fails closed with a message naming the file.
**AC3:** Given the PR Checks job, When it runs, Then the unit chain runs under c8 (include `src/**`, `json-summary` reporter), the existing `test-output.log` and regression check behave exactly as before (same files run, same baseline logic), and the coverage summary is uploaded as an artefact.
**AC4:** Given the E2E job, When its existing c8 report step has produced `coverage-e2e/coverage-summary.json`, Then a new step runs the ratchet for the `e2e` suite against that summary; the job still has exactly one `continue-on-error` and the same jobs.
**AC5:** Given the pull request's CI run, When the PR Checks job and the E2E job finish, Then both coverage summaries exist as artefacts; the baseline for each suite is then recorded in `tests/coverage-baseline.json` from those CI-measured numbers (the second commit), and the PR Checks median wall time stays at or under 5.5 minutes (before: 3.5).
**AC6:** Given the existing checks, When `npm test` runs, Then there is no new failure against the known baseline, and `check-a5-ci-gate-config`, `check-b2-ci-gate-config` and the unit-chain regression check pass.
**AC7:** Given the pull request, When its changed files are listed (and again on master after the merge), Then they are the files named under Architecture Constraints and nothing under `src/`.

## Out of Scope

- Merging the unit and browser raw coverage into one combined percentage (a follow-up once both are measured).
- A target percentage, or writing tests for the largest gaps (a baseline floor, not a goal; targeted tests are separate stories).
- Making the all-specs E2E job blocking, and changing the master ruleset's required checks (the operator's decisions).
- Branch and function thresholds stricter than the 0.5 percentage-point tolerance; per-file thresholds.

## NFRs

- **Cost:** the unit chain under c8 must not push PR Checks past 5.5 minutes median; if it does, the story reports the number and stops for a decision.
- **Safety:** the ratchet fails closed on a malformed baseline and never silently passes on a missing summary for a suite that ran.
- **Backward compatibility:** no test file's pass/fail result depends on whether c8 is attached.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
