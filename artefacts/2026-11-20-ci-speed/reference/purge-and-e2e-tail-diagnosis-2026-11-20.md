# Diagnosis: the 92 s staging purge step and the E2E smoke tail, 2026-11-20

Read-only, from GitHub Actions job logs and the repository. No staging data was read or changed; no credentials were used.

## 1. The staging purge step is a no-op that costs 92 s, twice per deploy

`scripts/purge-e2e-tenants.js` runs as the last step of both `smoke-test` and `post-deploy-e2e-confirm` in `staging-deploy.yml`. Those jobs run in series (`deploy-staging`, then `smoke-test`, then `post-deploy-e2e-confirm`, then `promote-to-prod`), so both purges are on the critical path: about 3 of the roughly 8.5 minutes between a merge and a promotion being approvable.

Every one of the last 10 deploys (20 jobs) logged the same line: `purge-e2e-tenants failed (non-blocking), found N tenant(s) but did not finish purging them: purgeE2eTenants timed out after 90000ms`. The step lasts 91 to 92 s because the script's own guard (`DEFAULT_TIMEOUT_MS = 90000`) fires, plus about 2 s for the connection check.

| Job (run id) | Tenants found |
|---|---|
| smoke, 44251457322 | 8,273 |
| confirm, 44251457322 | 8,287 |
| smoke, 44257708795 | 8,287 |
| confirm, 44257708795 | 8,301 |
| smoke, 44583265861 | 8,414 |
| confirm, 44583265861 | 8,432 |

The count rises by 14 per job (the tenants the tests just created) and never falls. A job's count equals the previous job's count plus 14, so nothing is deleted. The backlog is about 8,400 tenants and growing by about 28 per deploy.

**Why nothing is deleted is not yet known.** What the code shows:

- `findE2eTenantIds` completes (it reports N), so the first purge chunk is where the 90 s goes. With `BATCH_SIZE = 200` that is about 43 chunks of 11 queries; with no progress at all, a single early query is probably slow or blocked (for example the `DELETE FROM artefacts ... IN (SELECT ... journeys WHERE tenant_id = ANY(...))` over large tables), but that is a hypothesis.
- Every delete in `purgeTenantsBatch` ends in `.catch(() => {})`, so no error is ever visible. One error is certain to be swallowed for any tenant whose journeys have `session_turns`: `DELETE FROM journeys` fails on `session_turns_journey_id_fkey` (the defect fixed for the app in vdp-s2). That alone would keep such tenants in the backlog forever, but it would not explain zero progress in 90 s for all 8,400.
- The script never reports which query it was in when the guard fired.

So the next step is instrumentation, not a fix: `dgn-s1` adds per-table timing, row counts and the first error per table to the log, without changing what is deleted. A fix story follows once one real staging run has produced that log.

## 2. The E2E smoke "tail" is failing tests, and 19 specs fail on every run

The "Run E2E tests" step has a median of about 165 s and a p90 of 887 s. Over 25 runs, the step's duration tracks the number of failing tests:

| Date | Failing tests | Step duration |
|---|---|---|
| 2026-11-17 (first runs) | 56 to 59 | 884 to 902 s |
| 2026-11-17 | 44 | 784 to 790 s |
| 2026-11-17 | 29 to 35 | 310 to 663 s |
| 2026-11-18 to 19 | 17 to 19 | 137 to 171 s |

Failing tests burn their timeouts (30 s for a test, 5 s per assertion, with "retrying click action"). The tail of 884 to 902 s was one period with 56 to 59 failures that has since been fixed down. It has not gone to zero: the most recent run (44475721583) shows 247 passed, 19 failed, 22 skipped, 3 did not run, in 2.6 minutes.

The 19 failing specs in that run, by file: `bmau-s1-bulk-assign-rerender`, `bri-s3.6-auth-journey` (AC1), `dsa-s1-artefact-viewer-restyle` (AC8), `dsa-s2-dashboard-restyle` (2), `ep1-s2-product-default-pod`, `ep1-s3-stage-panel-focus-management`, `ep1-s4-stage-selector`, `ep3-s1-regression`, `fpd-s4-caption-sync`, `fpux.1-visual-consistency-theme` (2), `frsr-s1-feature-row-session-resume` (2), `jcx-s6-swimlane-grid`, `pnfc-s1-new-feature-choice` (2), `spdr-s2-metric1-timing`, `wuce18-keyboard-nav`.

The "Playwright E2E smoke tests" job has `continue-on-error: true` on the test step, so these failures never turn a pull request red. About 19 UI behaviours are untested in practice, and each failure costs time. Whether each is a real UI defect or test rot has not been investigated. This is a finding for the operator, separate from speed; it is not in scope for `dgn-s1`.
