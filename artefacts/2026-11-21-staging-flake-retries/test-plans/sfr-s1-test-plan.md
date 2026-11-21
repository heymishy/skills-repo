## Test Plan: A single transient failure in the staging smoke or post-deploy confirmation steps no longer blocks the promotion to production

**Story reference:** artefacts/2026-11-21-staging-flake-retries/stories/sfr-s1-staging-steps-retry-once.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-21
**Test runner (read from package.json):** `npm test` runs `scripts/run-all-tests.js`, which runs `tests/check-*.js`. New check: `tests/check-sfr-s1-staging-flake-retries.js` (6 tests, S1 to S6), in the chain automatically. It reads the workflow, the Playwright config, the policy and the ledger as files, and runs the real `scripts/flake-check.js` (`--check` and `--report`) on a Playwright-shaped report built in a temporary folder. The staging steps themselves only run on CI after a merge to master, so what a real retry does is observed on the next staging deploy (M3).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Risk |
|----|-------------|------|-------------|-----|--------|------|
| AC1 | Smoke command has `--retries=1 --reporter=list,json`, still `--grep "@mocked" --workers=1`, and a report file name | 1 (S1: workflow text) | - | - | - | 🟢 |
| AC2 | Both post-deploy commands keep their specs and `--workers=1`, gain `--retries=1 --reporter=list,json` and their own report names | 1 (S2) | - | - | - | 🟢 |
| AC3 | `--retries` appears only on those three commands; no `retries` in `playwright.config.js` | 1 (S3: every workflow file and the config) | - | - | - | 🟢 |
| AC4 | Each of the three steps is followed by an `if: always()` flake report, no `--strict` | 1 (S4) | - | - | - | 🟢 |
| AC5 | Ledger has exactly the two entries with the required fields; `flake-check --check` passes; a report marking both tests flaky lists both as tracked and `--strict` exits 0 | - | 1 (S5: real `flake-check`, `--check`, then `--report --strict` on a synthetic report) | - | - | 🟢 |
| AC6 | Policy text names the three steps, keeps its rules; `check-flk-s1` passes | 1 (S6) | existing (`check-flk-s1`, 6 tests) | - | - | 🟢 |
| AC7 | Existing guard checks and CI green | existing | existing | - | M1: run the eight named checks and the full chain; M2: CI on the final commit | 🟢 |

## Red first

Expected on master before any change: S1 to S4 fail (no retries, no report steps), S5 fails (the ledger is empty), S6 fails (the policy still says retries are off everywhere). Measured before any implementation.

## Manual steps

- **M1:** run the eight checks named in AC7 and the full `npm test` plus `scripts/ci-test-regression-check.js`.
- **M2:** after the draft pull request's CI run, read the checks on the final commit; verify the remote head after every push; check master after the merge.
- **M3 (observation, not a gate):** after the merge, the next `Staging Deploy` run shows the three report steps. A flaky test, if one occurs, appears in the step summary as tracked (#1181) and the run still passes; a non-flaky failure still fails the run.
- **M4:** the ledger's review date is 2026-12-05; from 2026-12-06 `check-flk-s1` T6 fails unless the entries are reviewed or re-dated. The operator is told in the pull request and the DoD.

## Gaps

What a real retry does on staging is not exercised before the merge (the steps run only after a merge to master, against the real staging app); the check proves the command lines, the report wiring and the ledger names, and `flake-check` is exercised on a report shaped like Playwright's. The entries' names are verified against the format `flake-check --report` prints, built from the same file and title strings the specs declare.
