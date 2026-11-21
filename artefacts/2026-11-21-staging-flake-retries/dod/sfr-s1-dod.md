# sfr-s1 Definition of Done

Date: 2026-11-21. Story: a single transient failure in the staging smoke or post-deploy confirmation steps no longer blocks the promotion to production. Pull request #1182 merged 2026-11-21 (`23aed6fbe`). Tracking issue #1181 (created with the operator's approval).

## Result: COMPLETE. All 7 acceptance criteria met. CI ran on the pull request's final commit (`292430bb7`, the same commit the merge took; the pull request head, the local head and the CI runs were compared), the changed files and checks were re-run on master after the merge, and **the change was proven live on its first real run**: `Staging Deploy` run 44880044029 retried a failed `bri-s3.3` test, passed, and the production promotion then succeeded.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | `tests/check-sfr-s1-staging-flake-retries.js` S1: the smoke command is `npx playwright test --grep "@mocked" --workers=1 --retries=1 --reporter=list,json` with `PLAYWRIGHT_JSON_OUTPUT_NAME` set. Red first: 0 of 6 passed before the change; 6 of 6 after (re-run on master: 6 passed, 0 failed) | automated | none |
| AC2 | ✅ | S2: the Scenario A command keeps its five specs and `--workers=1`, and Scenario B keeps `b1` and `--workers=1`; both gain `--retries=1 --reporter=list,json` with three distinct report files | automated | none |
| AC3 | ✅ | S3: exactly three `--retries` in `staging-deploy.yml`, none in any other workflow (the pull request Scenario A and B jobs are unchanged), no `retries` in `playwright.config.js` | automated | none |
| AC4 | ✅ | S4: each of the three steps is followed by an `if: always()` step that appends `scripts/flake-check.js --report <its file>` to the step summary, and `--strict` is not used. Live: in run 44880044029 all three "Flaky tests this run (flake ledger)" steps ran and succeeded | automated + live | none |
| AC5 | ✅ | S5: the ledger has exactly the two entries (names built from the specs' own titles), owner `heymishy`, issue #1181, first seen 2026-11-21, review by 2026-12-05; `flake-check --check` passes; a Playwright-shaped report marking both flaky lists both as tracked and exits 0 under `--strict` | automated | none |
| AC6 | ✅ | S6: the policy sentence says retries are off except for the three staging steps and that the report is not enforced; `check-flk-s1` passes (8 of 8) | automated | none |
| AC7 | ✅ | the eight guard checks pass on master (`bri-s2.5` 7, `bri-s2.6` 10, `cif-s1` 4, `cif-s2` 4, `dsn-s1` 8, `bkn-s1` 5, `flk-s1` 8, `sfr-s1` 6; `cpco-s1` all pass); CI was green on the final commit (9 of 9 checks, both coverage ratchet steps "at or above the floor") | automated | none |

## Live evidence (the first real run)

`Staging Deploy` run 44880044029 (commit `23aed6fbe`): the smoke step reported "1 flaky, 23 passed". The flaky test was `bri-s3.3` AC1, which failed its first attempt at line 160 (`expect(aliceAdminRes.status()).toBe(200)`: alice's `GET /admin/credits` was not 200) and passed on the retry. Without this change that run would have failed the smoke step and blocked the promotion, as four of the five earlier completed deploys did. The operator then approved "Promote to production" (07:38 UTC): the promote job succeeded in 63 s and "Verify production" in 9 s. This is the third attributed occurrence of the same `bri-s3.3` AC1 flake in three days (2026-11-19, 2026-11-20 and now 2026-11-21; a further failure of the same job on 2026-11-19 could not be attributed to a test); the first attempt's actual status code was not printed (a follow-up, `sfx-s1`, records it).

## Observations and follow-ups

- **A date to remember:** from 2026-12-06 `check-flk-s1` T6 fails (and the unit chain goes red on every pull request) unless the two ledger entries are fixed, removed, or renewed (`firstSeen` and `reviewBy` both moved, history in `note`; moving only `reviewBy` fails the check because the policy caps it at 14 days after `firstSeen`). Review by 2026-12-05.
- **The step summary shows the flaky list only in the GitHub run page** (it is appended to `$GITHUB_STEP_SUMMARY`, not echoed to the log), so it cannot be compiled from the API later; the live run's log did print Playwright's own "1 flaky" line. A one-line follow-up could echo the report to the log as well.
- **The pull request Scenario A and B jobs** (required checks) run the same specs against staging with no retries and could see the same flakes; deliberately unchanged.
- **Follow-up in progress:** `sfx-s1` fixes `a1` AC1's cold-start timing budget and records the elapsed time and tenant count of the `/admin/credits` call, so the next `bri-s3.3` flake is evidence. A possible later story batches the per-tenant plan lookups in `/admin/credits` (N+1 queries over every tenant on the shared staging database), a hypothesis, not a proven cause.
- **Process held:** the story was registered on master before the branch was cut, the remote head was verified after every push, CI was confirmed on the final commit, the guard fix and this DoD were held until the promotion was approved, and master was checked after the merge.

## Scope Deviations

None.
