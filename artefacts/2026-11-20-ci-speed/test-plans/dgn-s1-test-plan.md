## Test Plan: The staging purge reports which delete is slow or failing, how many tenants each chunk removed, and where it was when it timed out

**Story reference:** artefacts/2026-11-20-ci-speed/stories/dgn-s1-purge-reports-where-time-goes.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-20
**Test runner (read from package.json):** `npm test` runs `scripts/run-all-tests.js`, which runs `tests/check-*.js`. New file: `tests/check-dgn-s1-purge-reports-where-time-goes.js`, plain Node, fake database objects, no network and no staging access. Modelled on `tests/check-pebd-s1-purge-e2e-tenants-batch-delete.js`.

**Report event shape (the contract the tests pin):** `{ status: 'start' | 'done' | 'chunk-done', phase: 'find' | 'purge', table, ms, rowCount, error, chunk, chunks, chunkSize }`. `start` is sent before each query and `done` after it (with `ms`, `rowCount` and, on failure, `error`); `chunk-done` is sent after each chunk. `chunk` and `chunks` are 1-based and only on purge events.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | One event per query: 4 find, 11 per chunk, with table, ms, rowCount, chunk | 1 (T1) | - | - | - | - | 🟢 |
| AC2 | A failing delete is reported with its message; the purge continues; nothing throws | 1 (T2) | - | - | - | - | 🟢 |
| AC3 | Aggregated summary: per-table calls, ms, rows, errors; first error once; the CLI prints it and still exits 0 | 2 (T3, T6) | - | - | - | - | 🟢 |
| AC4 | Timeout message names chunk, table and tenants through completed chunks | 1 (T4) | - | - | - | - | 🟢 |
| AC5 | Identical queries and result with and without `report`; throwing hook changes nothing | 1 (T5) | - | - | - | - | 🟢 |
| AC6 | The three existing purge tests pass unchanged | 1 (T7, runs them as child processes) | - | - | - | - | 🟢 |
| AC7 | The next staging deploy's purge log contains the summary block | - | - | - | 1 (M1) | Needs a real staging run | 🟡 |

## Red-first plan

T1 to T4 and T6 fail before the change because `report`, `createPurgeReport` and the progress argument do not exist (T6 runs the CLI as a child process against an unreachable local port and looks for the summary block in its output, so the wiring is checked by behaviour). T5 (baseline: the query sequence with no hook) and T7 (the existing tests) pass before and after by design; they are the regression guards for "no behaviour change". T5 records the full ordered list of (SQL, parameters) a fake database receives for a 450-tenant find result (3 chunks), once with no hook and once with a recording hook, and asserts the lists are deep-equal; the exact-query-list test in pebd-s1 independently pins the queries themselves.

T2 uses a fake that throws a foreign key error text (`session_turns_journey_id_fkey`) on the journeys delete, so the story's own motivating failure is the failing case, and asserts the later tables (`products` through `users`) still ran.

## Manual step (AC7)

After the merge, the next Staging Deploy's "Purge e2e-test- tenants created by this run" step logs the summary block (find timings, per-table totals, errors, and where it stopped). The DoD records which table dominates or fails and what the fix story should be. No staging data is touched by the agent; the step runs as it does today.
