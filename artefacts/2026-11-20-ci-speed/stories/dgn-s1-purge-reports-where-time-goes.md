## Story: The staging purge reports which delete is slow or failing, how many tenants each chunk removed, and where it was when it timed out

**Epic reference:** None - short-track (CI diagnosis)
**Discovery reference:** None - short-track skips discovery. Evidence: `artefacts/2026-11-20-ci-speed/reference/purge-and-e2e-tail-diagnosis-2026-11-20.md` section 1. In every one of the last 10 deploys (20 jobs) the purge step logged "found N tenant(s) but did not finish purging them: timed out after 90000ms", found about 8,400 tenants, and removed none. It costs 92 s in each of two serial jobs per deploy, and every delete error is swallowed by `.catch(() => {})`.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [ci] [staging]

## User Story

As **the operator who waits on staging deploys**,
I want **the purge step to say which delete is slow or failing and how far it got**,
So that **the cause of an 8,400-tenant backlog that is never cleared, costing 3 minutes per deploy, can be read from one real run instead of guessed**.

## Benefit Linkage

**Metric moved:** from "unknown cause" to "cause named in the next deploy's log". It enables the fix story that removes about 3 minutes from the roughly 8.5-minute path between a merge and a promotion being approvable.
**How:** the script gains an optional `report` hook. Every query in the find step and the purge chunks is timed; the CLI aggregates per table (calls, total milliseconds, rows deleted, error count, first error message) and prints one summary block, both when the purge finishes and when the 90 s guard fires, together with the chunk and table it was in. What is deleted, in what order, and the exit code do not change.

## Architecture Constraints

- Change confined to `scripts/purge-e2e-tenants.js`, one new test and artefacts. `scripts/` changes go through a pull request (platform change policy).
- **No behaviour change:** the same queries, in the same order, with the same parameters; the same 90 s default guard; the CLI still exits 0 in every case; errors stay non-fatal. `tests/check-pebd-s1-purge-e2e-tenants-batch-delete.js` pins the exact query list and must pass unchanged. No query is added, removed or reordered, including no `session_turns` delete.
- `report` is optional and defaults to a no-op, so existing callers and tests that pass two arguments are unaffected. It is called with plain data and must never throw into the purge (a throwing hook is caught).
- The step in `staging-deploy.yml` and `e2e.yml` is not changed; `tests/check-bri-s2.6-smoke-test-promote-gate.js` asserts it has no error-tolerance flag.
- Log lines contain table names, counts, milliseconds and database error messages only; no tenant id and no connection string is printed beyond what the script prints today (the existing summary prints tenant ids on success).
- No staging or production data is read or changed by development of this story; tests use fake database objects.

## Dependencies

- **Upstream:** alrf-s11 (the purge script), pebd-s1 (batched deletes), stcs-s1 (cold start and timeout).
- **Downstream:** a fix story, written after the first real log, for the purge itself and for the cleanup scripts with the same `session_turns` gap (`clean-e2e-staging-data.js`, `cleanup-e2e-staging-data.js`).

## Acceptance Criteria

**AC1:** Given a fake database and a `report` hook, When `purgeE2eTenants` runs, Then `report` receives one event per query (the four find queries and the eleven deletes per chunk) with the table name, the elapsed milliseconds, the row count and the chunk number.
**AC2:** Given a delete that fails (for example the journeys delete raising a foreign key error), When the purge runs, Then the error is reported through `report` with its message, the purge still continues with the next table, and no error is thrown.
**AC3:** Given the CLI aggregator, When it has received events, Then its summary lists each table with calls, total milliseconds, rows deleted and error count, and shows the first error message per table once (not once per chunk).
**AC4:** Given the 90 s guard fires part-way, When the failure message is built, Then it names the chunk (for example "chunk 3 of 43") and table in progress and how many tenants had been through completed chunks, as well as the found count.
**AC5:** Given the same fake database with and without a `report` hook, When the purge runs, Then the sequence of queries and parameters is identical (no query added, removed or reordered), the result is identical, and a `report` hook that throws changes neither.
**AC6:** Given `tests/check-pebd-s1-purge-e2e-tenants-batch-delete.js`, `check-alrf-s11-purge-e2e-tenants.js` and `check-stcs-s1-purge-e2e-tenants-cold-start-and-schedule.js`, When they run, Then they pass unchanged.
**AC7 (manual, recorded in the DoD):** Given this change is merged, When the next Staging Deploy runs, Then the purge step's log contains the summary block, and the DoD records which table is slow or failing and the next step that follows from it.

## Out of Scope

- Any change to what the purge deletes, including adding `session_turns` (the fix story, after the log).
- The two cleanup scripts and any deletion of the existing 8,400-tenant backlog.
- Lowering the 90 s guard or skipping the step. This is tempting, since the step does nothing today, but the fix story may make it work and changing the guard first would hide the evidence; revisit with the log in hand.
- The 19 failing E2E specs (`reference/purge-and-e2e-tail-diagnosis-2026-11-20.md` section 2); separate stories.

## NFRs

- **Safety:** read-only change in effect; no new write, no new query.
- **Reliability:** the reporting can never fail or slow the step materially (a few string operations per query); the 90 s guard and exit code are untouched.
- **Observability:** the summary prints even on timeout, so a stuck query is visible.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
