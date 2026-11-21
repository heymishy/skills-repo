## Definition of Ready: Server code coverage is measured for the unit chain as well as the browser suite, and a pull request cannot lower either number

**Story reference:** artefacts/2026-11-21-coverage-ratchet/stories/cvrt-s1-coverage-ratchet.md
**Test plan reference:** artefacts/2026-11-21-coverage-ratchet/test-plans/cvrt-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-21
**Track:** short

## Contract Proposal
- `scripts/coverage-ratchet.js` (AC1, AC2): a pure comparison function plus a CLI (`node scripts/coverage-ratchet.js <suite> <summary.json> [baseline.json]`), tolerance 0.5 percentage points, fail closed on a malformed baseline, pass with a notice when the baseline file is absent.
- `tests/check-cvrt-s1-coverage-ratchet.js` (T1 to T10).
- `.github/workflows/pr-checks.yml` (AC3): the unit chain runs under `npx --yes c8@10.1.3` with `--include="src/**"`, `json-summary` reporter, reports to `coverage-unit/`; the baseline file is read from the base branch as the known-failures baseline is; the summary is uploaded as an artefact; the regression check keeps its arguments.
- `.github/workflows/e2e.yml` (AC4): one added step after "Server code coverage report (informational)" that runs the ratchet for suite `e2e`; no other change.
- `tests/coverage-baseline.json` (AC5): written in the second commit from CI-measured numbers for both suites.
- `decisions.md` and a DoD.
- Not built: no combined coverage number, no target percentage, no per-file thresholds, no new test for any uncovered file, no ruleset change, no `src/` change, no change to which test files run.

## Contract Review
Contract review passed. All 7 acceptance criteria map to a named test, an existing check, or a recorded manual step. `.github/workflows/pr-checks.yml` and `.github/workflows/e2e.yml` are required touchpoints (AC3, AC4) and appear in no exclusion list; the existing guard checks `check-a5-ci-gate-config` and `check-b2-ci-gate-config` constrain `e2e.yml` and AC4 is written to keep them passing.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied. Workflow and `scripts/` changes go through a pull request.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | the operator as the only merge gate |
| H2 | At least 3 ACs in Given / When / Then | Pass | 7 ACs |
| H3 | Every AC has a test | Pass | AC3 to AC5 combine a text check with a CI read |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | |
| H6 | Complexity rated | Pass | 2, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | no pipeline-state schema change |
| H9 | Architecture Constraints populated | Pass | |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | no layout AC |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | cost and fail-closed stated |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | no adapter |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | no UI |

**Hard blocks: all passed.**

## Warnings
| # | Status | Note |
|---|--------|------|
| W1 | Accepted | The workflow changes only run on CI (Linux); locally the agent tests the script and the workflow text, and reads the real behaviour from the pull request's CI run. |
| W2 | Accepted | The first enforced comparison is on the first pull request after this one merges, because the baseline must exist on the base branch before it can be read from there. Stated in the DoD. |
| W3 | Accepted | If the unit chain under c8 takes PR Checks past 5.5 minutes, the agent reports the measured cost and stops for the operator's decision instead of merging a slower pipeline. |
| W4 | Accepted | c8 attaches through `NODE_V8_COVERAGE`, which the test runner's child processes inherit (it spawns without an `env` override); if a check spawns its own server with a scrubbed environment, its coverage is simply not counted, a conservative floor. |
| W5 | Accepted | The agent registers the feature on master before cutting the branch (the assurance gate looks the feature up in the branch's own `pipeline-state.json`), confirms CI ran on the final commit before asking for the merge, checks master after it, and stages exact paths only. |
| W6 | Accepted | Local runs create real `artefacts/*e2e*` and `workspace/journeys` entries; the agent works in a worktree and removes it afterwards (junction first). |

## Oversight level
**Medium** - CI workflow changes affect every future pull request. The operator reviews the pull request and merges.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-21-coverage-ratchet/stories/cvrt-s1-coverage-ratchet.md
Test plan: artefacts/2026-11-21-coverage-ratchet/test-plans/cvrt-s1-test-plan.md
Goal: write the node check first and confirm T1 to T10 fail on master; then add scripts/coverage-ratchet.js, the two workflow changes and the unit-chain coverage upload; run the new check, check-a5, check-b2, the full npm test with the regression script; open a draft pull request; read the CI run's two coverage summaries and duration; record both baselines in tests/coverage-baseline.json (second commit); wait for CI on the final commit.
Constraints: the files named in the contract only; e2e.yml keeps one continue-on-error and its job list; no change to which tests run; preserve line endings; stage exact paths; report the PR Checks duration and stop if it exceeds 5.5 minutes.
```
