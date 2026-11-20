# pts-s1 Definition of Done

Date: 2026-11-20. Story: the e2e purge and cleanup scripts clear session history before journeys, so the staging backlog clears and the purge step stops costing 92 s. Pull request #1166 merged 2026-11-20 (`0054a8f07`). No issue.

## Result: COMPLETE. The backlog is cleared and each purge step now takes 4 s instead of 92 s.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | a batch purge deletes a chunk whose journey has session turns, with no error, against a fake database that enforces both foreign keys with no cascade. Evidence: T1 in `tests/check-pts-s1-purge-clears-session-turns.js` (red first: it raised the exact staging error `session_turns_journey_id_fkey`) | automated | none |
| AC2 | ✅ | the single-tenant `purgeTenant` clears the same tables in the same order. Evidence: T2 | automated | none |
| AC3 | ✅ | the statements run in the order `session_turns`, `artefacts`, `journeys`, then the nine existing tables; the `artefacts` statement and the nine later statements are byte-identical to master. Evidence: T3 | automated | none |
| AC4 | ✅ | `clean-e2e-staging-data.js` with `confirm` deletes session turns, artefacts, then journeys; without `confirm` it issues no delete. Evidence: T4 | automated | none |
| AC5 | ✅ | `cleanup-e2e-staging-data.js` clears the child tables before a journey and before a product's journeys. Evidence: T5 and T6 | automated | none |
| AC6 | ✅ | a guard scans every `DELETE FROM journeys` site under `src/` and `scripts/` and fails for any that does not handle the listed child tables, with a fixture that proves it can fail. Evidence: T7 and T8 | automated | none |
| AC7 | ✅ | a failing child delete stays non-fatal (no throw, exit 0, the error is reported) and the reporting shows 12 purge tables per chunk. Evidence: T9, and the updated `check-dgn-s1` (12 tables, 36 purge events, 40 queries) | automated | none |
| AC8 | ✅ | the staging purge summaries show `purge journeys` with 0 errors and the step falling from 92 s to 4 s. Evidence: Staging Deploy runs 44622879661 and 44685953879, recorded below | manual (CI evidence) | none |

Red first: T1 to T7 and T9 failed before the change. All 17 assertions in the new test pass after, and the three tests that pin the old statement lists (`check-pebd-s1` 12 deletes per chunk, `check-dgn-s1` 12 tables, `check-b3` fake accepts the new statement shapes) were updated deliberately and listed in the pull request. No script was run against staging by the agent; neither cleanup script was run at all.

## AC8 evidence: what the staging purge did, deploy by deploy

| Staging Deploy | Job | Tenants found | Chunks | `purge journeys` errors | Step duration |
|---|---|---|---|---|---|
| Before the fix (run 44592470706) | smoke | 8,437 | stopped by the 90 s guard in chunk 35 of 43 | 35 of 35 | 92 s |
| Run 44622879661 (merge `0054a8f07`) | smoke | 8,451 | stopped by the 90 s guard in chunk 34 of 43, 6,600 tenants through | 0 of 34 | 92 s |
| Run 44622879661 | post-deploy E2E | about 1,850 left | no summary printed | not shown | 17 s (21:57:03 to 21:57:20) |
| Run 44685953879 (merge of the next change, `357181141`) | smoke | 7 | 1 of 1 | 0 | 4 s (06:13:46 to 06:13:50) |
| Run 44685953879 | post-deploy E2E | 15 | 1 of 1 | 0 | 4 s (06:15:08 to 06:15:12) |

- **First deploy after the merge:** in the smoke job the purge worked: `purge journeys` deleted 6,799 journey rows with 0 errors, `session_turns` removed 18,380 rows in 9.9 s, and the 90 s guard still fired at chunk 34 of 43 because the backlog was still large. This is the case the DoR (W2) warned about. The post-deploy job's purge took 17 s and printed no summary; that was read at the time as having cleared the rest of the backlog (a 17 s step fits about 1,850 tenants), and the next deploy confirms it.
- **Second deploy after the merge:** the backlog is gone. Each purge step found only the tenants its own run created (7 and 15), finished in one chunk, had 0 errors in every table, and took 4 s.
- **Saving:** each of the two purge steps fell from 92 s to 4 s, about 88 s each, so about 176 s (about 3 minutes) per Staging Deploy, as predicted in the story.
- **Data removed from staging:** the journeys, artefacts and session history of about 8,430 `e2e-test-` tenants, as approved by the operator on 2026-11-20 ("ok 1 yes and 2 yes"). All were test data selected by the exact `e2e-test-` prefix rules, which did not change.

## Observations and follow-ups

- **Nothing was run by the agent against staging apart from the normal CI purge step.** `clean-e2e-staging-data.js` and `cleanup-e2e-staging-data.js` were fixed but never run; running them is the operator's call.
- **`products` delete was slow** (about 1.06 s per chunk) only while the backlog existed; at 1 chunk per run it no longer matters. Chunk size (200) is unchanged and also no longer matters at this volume.
- **`session_turns_archive`** keeps rows for deleted journeys (no foreign key); harmless, not cleaned.
- **The 90 s guard is unchanged.** It no longer fires; it remains the safety net if the backlog ever builds up again, and the dgn-s1 summary would show it immediately.
- **The 19 failing E2E smoke specs** are triaged in `reference/e2e-failing-specs-triage-2026-11-20.md`; separate stories.

## Scope Deviations

- None.
