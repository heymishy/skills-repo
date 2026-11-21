## Test Plan: Server code coverage is measured for the unit chain as well as the browser suite, and a pull request cannot lower either number

**Story reference:** artefacts/2026-11-21-coverage-ratchet/stories/cvrt-s1-coverage-ratchet.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-21
**Test runner (read from package.json):** `npm test` runs `scripts/run-all-tests.js`, which runs `tests/check-*.js`. New check: `tests/check-cvrt-s1-coverage-ratchet.js`, in the chain automatically. The workflow changes cannot run locally; they are verified by the pull request's own CI run (M2, M3).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Risk |
|----|-------------|------|-------------|-----|--------|------|
| AC1 | Ratchet passes at or above the floor, fails below it, naming metric, baseline and measured value | 4 (T1 to T4: all equal, within tolerance, one metric below, all four below) | - | - | - | 🟢 |
| AC2 | Baseline from the base branch: missing passes with a notice; malformed or no entry for the suite fails closed | 3 (T5 to T7) plus 1 (T8: the CLI reads the baseline from a path argument and the exit code matches) | - | - | - | 🟢 |
| AC3 | Unit chain under c8, regression check unchanged, summary uploaded | 1 (T9: the PR Checks workflow text runs the unit chain through c8 pinned at `10.1.3`, still writes `test-output.log` and still calls `ci-test-regression-check.js` with the same arguments) | - | - | M2: read the CI run | 🟡 |
| AC4 | E2E job runs the ratchet; one `continue-on-error`; same jobs | 1 (T10: step present after the c8 report step; exactly one `continue-on-error: true` in the job) | - | - | M3: read the CI run | 🟢 |
| AC5 | Both summaries exist as artefacts; baselines recorded from CI numbers; PR Checks median <= 5.5 min | - | - | - | M2, M3, M4: download both artefacts; record the baseline; read durations | 🟡 |
| AC6 | No new `npm test` failure; guard checks pass | existing (`check-a5`, `check-b2`, regression check) | - | - | M1: full run and the regression script | 🟢 |
| AC7 | Changed files as stated, on the pull request and on master | - | - | - | M5: diff check | 🟢 |

## Red first

T1 to T8 fail on master because `scripts/coverage-ratchet.js` does not exist (the check requires it and exercises the real script). T9 and T10 fail on master because the workflows do not contain the new steps. Both are measured before any implementation.

## Manual steps

- **M1:** full `npm test` plus `scripts/ci-test-regression-check.js`: only the two known local-only failures (`check-pcr-s1-test-runner`, `check-p3.5-validate-trace`).
- **M2:** after the draft pull request's CI run, read the PR Checks job: the unit chain ran under c8, the summary artefact exists, the regression check outcome is the same as on master, and the job duration.
- **M3:** read the E2E job: the ratchet step ran (first PR: no baseline on the base branch, so it passes with the notice).
- **M4:** download both coverage summaries from the CI run; write `tests/coverage-baseline.json` from them (second commit); CI then runs the ratchet against the base branch's still-absent baseline, so the first real comparison happens on the next pull request, which is checked by a local dry run of the script against the recorded file and the CI summaries (pass at equal numbers).
- **M5:** list changed files on the pull request and on master after the merge.
- **M6:** confirm a CI run exists on the final commit before the merge is requested.

## Gaps

The unit chain's coverage under c8 on the CI runner (Linux) is not reproducible exactly on the developer machine (Windows), so the baseline is taken from CI, never from a local run. A real regression comparison needs the baseline on the base branch, so the first enforced comparison is on the first pull request after this one merges; this is stated in the DoD.
