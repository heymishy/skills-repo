# dgn-s1 Definition of Done

Date: 2026-11-20. Story: the staging purge reports which delete is slow or failing, how many tenants each chunk removed, and where it was when it timed out. Pull request #1165 merged 2026-11-20 (`65e72915f`). No issue.

## Result: COMPLETE. The first real log named the cause; the fix needs the operator's go-ahead.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | one event per query, with table, elapsed ms, row count and chunk. Evidence: T1 in `tests/check-dgn-s1-purge-reports-where-time-goes.js` (4 find events, 33 purge events over 3 chunks, 37 start events) | automated | none |
| AC2 | ✅ | a failing delete is reported with its message, the purge continues, nothing throws. Evidence: T2 (the journeys delete raises the staging foreign key error; the nine later tables still run) | automated | none |
| AC3 | ✅ | the summary aggregates per table and prints the first error once; the CLI prints it and exits 0. Evidence: T3, and T6 which runs the real CLI as a child process against an unreachable database | automated | none |
| AC4 | ✅ | the failure message names the chunk, table and tenants through completed chunks. Evidence: T4, and the real message in the AC7 log below | automated | none |
| AC5 | ✅ | the same queries and parameters, in the same order, with no hook, a recording hook and a throwing hook. Evidence: T5 (37 queries each, deep-equal) | automated | none |
| AC6 | ✅ | the three existing purge tests pass unchanged. Evidence: T7 (pebd-s1, alrf-s11, stcs-s1), plus the 22 other test files that mention the purge script or `staging-deploy.yml` | automated | none |
| AC7 | ✅ | the next staging deploy's purge log contains the summary block. Evidence: Staging Deploy run 44592470706 (merge `65e72915f`), smoke-test job, purge step 18:55:48 to 18:57:20; the log is reproduced below | manual (CI evidence) | none |

Red first: the reporting functions did not exist before the change (T3 crashed on `createPurgeReport`). All 26 assertions pass after. The purge step still exits 0 and does not fail the job, as before.

## AC7 evidence: the first real purge log

`purge-e2e-tenants failed (non-blocking), found 8437 tenant(s) but did not finish purging them: purgeE2eTenants timed out after 90000ms (in chunk 35 of 43, table products; 6800 tenant(s) through completed chunks)`

| Statement | Calls | Total ms | Rows deleted | Errors |
|---|---|---|---|---|
| find credits / team_memberships / users | 1 each | 156 to 162 | 7, 7, 8 | 0 |
| find journeys | 1 | 935 | 8,435 | 0 |
| purge artefacts | 35 | 5,554 | 28 | 0 |
| purge journeys | 35 | 5,431 | 0 | 35 |
| purge products | 34 | 36,155 | 6 | 0 |
| each of the other eight tables | 34 each | 5,146 to 5,175 | 0 to 7 | 0 |

First error: `update or delete on table "journeys" violates foreign key constraint "session_turns_journey_id_fkey" on table "session_turns"` (35 of 35 journeys deletes).

## What the log shows (and what it corrects)

- **Cause of the backlog:** the purge never deletes `session_turns`, so every chunk's journeys delete fails. About 8,430 of the 8,437 tenants exist only as `journeys` rows and are found again on every run. This corrects the earlier reading (diagnosis note section 1) that the purge made zero progress: it does run through 34 of 43 chunks, but nearly all of that work is wasted.
- **Cause of the 92 s:** about 152 ms per statement (network round trip from the runner to the staging database) times 11 statements per chunk, plus about 1.06 s per chunk for the `products` delete, is about 2.6 s per chunk; 43 chunks need about 112 s against the 90 s guard.
- **The fix is small:** clear `session_turns` before `journeys` in `purgeTenantsBatch` (and `purgeTenant`), ideally from the shared `JOURNEY_CHILD_TABLES` list added in vdp-s2. `tests/check-pebd-s1-purge-e2e-tenants-batch-delete.js` pins the exact query list and would be updated deliberately. Predicted effect: the backlog clears over a few deploys and the two purge steps fall from 92 s to a few seconds each, about 3 minutes per deploy. This is a prediction.

## Observations and follow-ups

- **Needs the operator's go-ahead: the fix story (working name `pts-s1`).** The first successful run deletes the journeys and session history of about 8,430 `e2e-test-` tenants from the staging database. That is what the script is for and the rows are test data, but it is a large staging delete that the agent will not ship unasked.
- **The same gap exists in two scripts:** `scripts/clean-e2e-staging-data.js` (lines 52 to 53) and `scripts/cleanup-e2e-staging-data.js` (lines 123 to 124 and 182). To be covered by the fix story, or left; the operator's call.
- **`products` delete is slow for what it removes** (about 1.06 s per chunk, 6 rows in total). Possibly an unindexed `tenant_id` or a cascade; not investigated, and it matters only until the backlog is gone.
- **Chunk size is 200** and each chunk costs 11 round trips; larger chunks would cut the latency cost. Not part of the fix unless wanted.
- **The 19 failing E2E smoke specs** are unchanged and still hidden by `continue-on-error` (see the diagnosis note, section 2).

## Scope Deviations

- None.
