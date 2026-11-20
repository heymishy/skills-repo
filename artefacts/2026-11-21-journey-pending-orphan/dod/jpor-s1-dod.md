# jpor-s1 Definition of Done

Date: 2026-11-21. Story: creating a feature no longer leaves an untagged placeholder journey on disk that every tenant's dashboard counts. Pull request #1174 merged 2026-11-21 (`aca396d93`). No issue.

## Result: COMPLETE. All 7 acceptance criteria met. CI ran on the pull request's final commit (`3cb423c47`, the same commit the merge took), and the changed files were checked on master after the merge.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | `tests/check-jpor-s1-no-orphan-pending-journey.js` T1: with `skipDisk` the disk adapter saves nothing at creation, and `setJourneyFields` then saves once under the real slug, tenant and product. Red first: T1 failed before the change, 3 of 3 pass after (re-run on master: 3 passed, 0 failed) | automated | none |
| AC2 | ✅ | same check, T2: without the option, `saveJourney` is called once, as before. T2 passed both before and after the change | automated | none |
| AC3 | ✅ | same check, T3 runs the real `handlePostProductFeature` with a recording disk adapter and a fake pool: no journey named `pending` is ever saved, and the real one is saved with the tenant and product id. Red first: T3 failed before the change | automated | none |
| AC4 | ✅ | locally, one worker, a fresh journeys root (`COPILOT_REPO_PATH` at an empty folder): `bmau-s1` then `dsa-s2` ended 7 passed and 2 failed on master, 9 of 9 with the change, and the fresh root no longer ends up with a `pending` directory. In CI, `dsa-s2` is 8 passed, 0 failed | automated | none |
| AC5 | ✅ | `check-das-s2-require-connected-repo` and `check-jrf-s2-register-product-feature-journeys` pass unchanged; `npm test` plus the CI regression script showed only the two known local-only failures (`check-pcr-s1-test-runner`, `check-p3.5-validate-trace`), which also fail on the master checkout. The new check is picked up by the runner's `check-*.js` discovery, so no `package.json` change was needed | automated | none |
| AC6 | ✅ | E2E report from the CI run on the final commit `3cb423c47` (PR head and CI commit matched): `dsa-s2` 8 passed, 0 failed; E2E total 272 passed, 2 failed (`ep3-s1`, `fpd-s4`). The matrix entry moved from `quarantined` to `extended` in that final commit, with a rewritten reason; master shows `dsa-s2` as `extended` | automated (CI report) + master check | none |
| AC7 | ✅ | the merge commit changed 4 files: `src/web-ui/modules/journey-store.js`, `src/web-ui/routes/products.js`, `tests/check-jpor-s1-no-orphan-pending-journey.js` and `tests/e2e/capability-matrix.json` (146 insertions, 8 deletions). Under `src/` only the two named files | manual (diff check on master) | none |

## CI evidence

All 9 checks passed on the final commit `3cb423c47`, including `Lint, typecheck, test, build`. The `Playwright E2E smoke tests` job is `continue-on-error`, so a green job does not prove the specs passed; the evidence above is the `pw-report-json` artefact, read directly.

## Observations and follow-ups

- **W1: existing orphan directories are not cleaned.** The fix stops new `workspace/journeys/pending` directories from being created. A machine that already has one keeps it, and a local `dsa-s2` run there still fails until its owner deletes the folder. CI starts from a clean checkout, so CI is the authoritative measurement. The main checkout has one, untracked; deleting it is the operator's call.
- **Dashboard rule left alone.** The dashboard still shows journeys with no tenant to every tenant (`routes/dashboard.js`). That is a wider decision and was out of scope.
- **The disk adapter is wired only when `DATABASE_URL` is unset**, so this defect showed up in local development and the E2E harness, not in a Postgres deployment.
- **Specs still quarantined:** `ep3-s1` (product bug, issue #1042) and `fpd-s4` (needs a playback fixture that does not exist).
- **Moving any extended spec to the blocking `core` lane** stays the operator's decision.
- **Process held:** CI was confirmed on the final commit before the merge was requested, and master was checked after the merge.

## Scope Deviations

None.
