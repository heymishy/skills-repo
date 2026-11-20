## Test Plan: Creating a feature no longer leaves an untagged placeholder journey on disk that every tenant's dashboard counts

**Story reference:** artefacts/2026-11-21-journey-pending-orphan/stories/jpor-s1-no-orphan-pending-journey.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-21
**Test runner (read from package.json):** `npm test` runs `scripts/run-all-tests.js`, which runs `tests/check-*.js`. New check: `tests/check-jpor-s1-no-orphan-pending-journey.js`, in the chain automatically. The E2E spec `dsa-s2` is not in the chain (ADR-018); run with `NODE_ENV=test E2E_LOCAL_SUITE=true npx playwright test tests/e2e/dsa-s2-dashboard-restyle.spec.js`.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Risk |
|----|-------------|------|-------------|-----|--------|------|
| AC1 | `skipDisk` creates in memory, no disk save; `setJourneyFields` saves once under the real slug | 1 (T1) | - | - | - | 🟢 |
| AC2 | Default `createJourney` still saves once | 1 (T2) | - | - | - | 🟢 |
| AC3 | The features handler never saves a `pending` journey; saves the real one with tenant and product | - | 1 (T3, handler with a fake pool and a recording disk adapter) | - | - | 🟢 |
| AC4 | `dsa-s2` 8 of 8 on a clean journeys root | - | - | existing (8 tests) | M1: local run with an empty `COPILOT_REPO_PATH` | 🟡 |
| AC5 | No new `npm test` failure | existing | existing | - | M2: full run and the regression script | 🟢 |
| AC6 | `dsa-s2` passes in CI; matrix move; CI on the final commit | - | - | CI report | M3: read `pw-report-json`; M5: CI on the final commit | 🟡 |
| AC7 | Changed files as stated, on the pull request and on master | - | - | - | M4: diff check | 🟢 |

## Red first

T1 and T3 must fail on master: the option does not exist, so the placeholder is saved with slug `pending` (T1 sees a save at creation; T3 sees a save with slug `pending`). T2 passes before and after (it pins existing behaviour). On master `dsa-s2` fails 2 of 8 with a clean journeys root only if the orphan exists, so AC4's red result is the measured local run (3 vs 2 and 1 vs 0).

## Manual steps

- **M1:** run `dsa-s2` with `COPILOT_REPO_PATH` set to an empty folder: 8 of 8 pass (already seen on master with the orphan absent; the point after the change is that the spec's own flow creates no orphan, checked by listing the folder afterwards for a `pending` directory).
- **M2:** full `npm test` plus `scripts/ci-test-regression-check.js`: only the two known local-only failures.
- **M3:** after the draft pull request's CI run, read the E2E report: `dsa-s2` 8 of 8.
- **M4:** list changed files on the pull request and again on master after the merge.
- **M5:** confirm a CI run exists on the final commit before the merge is requested.

## Gaps

AC4 locally depends on a clean journeys root (an existing orphan on the machine is not removed by this change); CI is the authoritative measurement.
