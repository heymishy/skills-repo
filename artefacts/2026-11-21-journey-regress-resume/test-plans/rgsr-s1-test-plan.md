## Test Plan: Resuming a journey lands on the stage the journey is on, so a regressed journey no longer drops the user into a discovery session

**Story reference:** artefacts/2026-11-21-journey-regress-resume/stories/rgsr-s1-resume-lands-on-regressed-stage.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-21
**Test runner (read from package.json):** `npm test` runs `scripts/run-all-tests.js`, which runs `tests/check-*.js`. New check: `tests/check-rgsr-s1-resume-lands-on-regressed-stage.js`, in the chain automatically. The E2E spec `ep3-s1` is not in the chain (ADR-018); run with `NODE_ENV=test E2E_LOCAL_SUITE=true npx playwright test tests/e2e/ep3-s1-regression.spec.js`, with `COPILOT_REPO_PATH` set to a native (backslash) path on Windows.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Risk |
|----|-------------|------|-------------|-----|--------|------|
| AC1 | Regressed journey resumes at a `definition` session | - | 1 (T1: real store, real disk adapter, real resume handler) | existing (`ep3-s1`) | - | 🟢 |
| AC2 | Store-saved journey, not regressed, resumes at its active stage | - | 1 (T2) | - | - | 🟢 |
| AC3 | Fallback to disk `currentStage`, then `discovery`, unchanged | - | 1 (T3, two assertions) | - | - | 🟢 |
| AC4 | `ep3-s1` passes on a fresh root, 3 of 3 | - | - | existing (1 test) | M1: run on master (fails) and after (passes) | 🟡 |
| AC5 | No new `npm test` failure; neighbouring resume checks pass | existing | existing | - | M2: full run and the regression script | 🟢 |
| AC6 | `ep3-s1` passes in CI; matrix move; CI on the final commit; issue closes | - | - | CI report | M3: read `pw-report-json`; M5: CI on the final commit; M6: `closingIssuesReferences` | 🟡 |
| AC7 | Changed files as stated, on the pull request and on master | - | - | - | M4: diff check | 🟢 |

## Red first

On master, before the change: T1 fails (Location is `/skills/discovery/...`), T2 fails (same), T3 passes (it pins the fallback that must not change). `ep3-s1` fails 2 of 2 on a fresh root. All measured 2026-11-21. T3's disk-native record is built so the store never rewrites it (a test-setup mistake in the first draft rewrote the record without `currentStage` and made T3 look red; fixed before the fix was applied).

## Manual steps

- **M1:** run `ep3-s1` on master (2 failures) and after the change (3 passes), each on a fresh journeys root.
- **M2:** full `npm test` plus `scripts/ci-test-regression-check.js`: only the two known local-only failures (`check-pcr-s1-test-runner`, `check-p3.5-validate-trace`).
- **M3:** after the draft pull request's CI run, read the E2E report: `ep3-s1` 1 of 1, total failing 0.
- **M4:** list changed files on the pull request and on master after the merge.
- **M5:** confirm a CI run exists on the final commit before the merge is requested.
- **M6:** read `closingIssuesReferences` on the pull request: issue #1042.

## Gaps

The E2E result locally depends on a native Windows `COPILOT_REPO_PATH` (a forward-slash root makes the regress handler's path guard return 400, an unrelated local effect); CI is the authoritative measurement.
