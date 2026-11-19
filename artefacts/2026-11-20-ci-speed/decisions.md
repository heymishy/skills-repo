# Decisions: CI and test speed

## D1. Drop `--with-deps` from test-only Playwright installs instead of fixing the apt cache (2026-11-20)

**Context:** the install step takes a median of 212 s on AWS-hosted runners and 16 s on Azure-hosted ones, because `--with-deps` downloads 32.1 MB of fonts from a mirror that serves about 72 kB/s on AWS.
**Decision:** run `npx playwright install chromium` without `--with-deps` in the eight test-only install steps, and remove the apt cache steps.
**Rationale:** `--with-deps` installs only nine font packages and upgrades four Mesa libraries that are already present; Chromium's shared libraries are already on the `ubuntu-24.04` image. The `rcfx-s1` apt cache never prevented the download (fixed key, so stale `.deb` files; saves fail to reserve). Fixing the cache would keep a network dependency that fails slowly; removing the dependency removes the failure mode.
**Alternatives rejected:** a self-refreshing apt cache keyed by week (more moving parts, still downloads weekly); the `mcr.microsoft.com/playwright` container (large change to jobs that start their own Postgres and server); pointing apt at another mirror (cloud-specific, brittle).
**Revisit if:** a runner image drops a library Chromium needs. The failure is loud (shared-library error at browser launch), and the fix is `npx playwright install-deps <library>` for that one library.

## D2. `ppc-capture-worker.yml` keeps `--with-deps` (2026-11-20)

**Context:** that workflow renders the screenshots and videos shown to users as playback evidence.
**Decision:** leave it unchanged and pin that with a test (T4).
**Rationale:** the fonts it installs can change what users see; the speed gain there is not worth a visible change. It is dispatched on demand, not run on every pull request.

## D3. Three stories, one at a time, in this order (2026-11-20)

1. `pwi-s1` Playwright install (this one): largest saving, smallest change.
2. `utp-s1` unit chain: isolate the heaviest test files in a parallel job, then reconsider the pool size.
3. `dgn-s1` diagnose the 92 s staging purge step and the E2E smoke tail before changing them.

## Delivery log: pwi-s1 (2026-11-20)

**Change:** `npx playwright install --with-deps chromium` became `npx playwright install chromium` in 8 install steps (e2e.yml 3, core-browser-tests.yml 1, staging-deploy.yml 2, bri-s3.4-cross-tenant-repeat-gate.yml 1, playwright-spec-coverage.yml 1). 7 "Cache apt packages for Playwright browser deps" steps and their rcfx-s1 comments were removed; one pwi-s1 comment per file at the first install step explains why. `.github/architecture-guardrails.md` rule 3 now says not to use `--with-deps` in test-only CI jobs and why. 6 files changed, 24 lines added, 88 removed. Browser cache steps, `if:` conditions, `continue-on-error`, permissions and job order are unchanged; every file keeps its CRLF line endings (0 bare-LF lines).

**Test:** `tests/check-pwi-s1-playwright-install-without-apt.js` (T1 to T5, 20 assertions). Red first: 3 passed, 17 failed before the change (T4 passes by design because it pins the capture worker keeping `--with-deps`); 20 passed, 0 failed after. T1 and T2 ignore comment lines.

**Regression check:** the 43 existing `tests/check-*.js` files that mention any edited workflow (or the guardrails file) all pass; all five workflows parse as YAML and contain 8 install steps with no `--with-deps` in total.

**Not yet verified (AC6):** that the install step is under 60 s on both an Azure-hosted and an AWS-hosted runner. This needs the pull request's own CI run and, because GitHub picks the cloud, possibly re-runs. To be recorded in the DoD with run ids and the "Cloud:" line of each log.

**Scope note:** the same-named failure mode exists in `ppc-capture-worker.yml` (on-demand, user-facing output). It is deliberately unchanged (D2).

## D4. dgn-s1 goes before utp-s1, and dgn-s1 is diagnosis-first (2026-11-20)

**Context:** after pwi-s1 the pull request critical path is the unit chain (3m23s) against the E2E smoke job (3m17s), so speeding up only the unit chain saves about 10 seconds; the pool phase is already within 2 s of its ideal for 2 slots (162 s against 160 s); and fhff-s1 (2026-11-01) measured 16 real runs and found `rb-s3` failing every time above 3 slots, so the cap of `ceil(cpus / 3)` is deliberate. The staging deploy path (deploy, smoke, post-deploy confirm, in series) spends about 3 minutes in two purge steps that have deleted nothing in the last 10 deploys.
**Decision:** do `dgn-s1` next and defer `utp-s1`. `dgn-s1` adds reporting to `scripts/purge-e2e-tenants.js` and changes nothing it deletes, because the cause of the zero progress cannot be read from the code and only a real staging run with per-table timings will show it. The fix is a later story.
**Rationale:** a guessed fix (lower the guard, add `session_turns`, skip the step) risks hiding the evidence or deleting 8,400 tenants of staging data on the first successful run without anyone having looked at it. One deploy with the report answers the question.
**Alternatives rejected:** lowering the 90 s guard now (saves about 140 s per deploy but would also stop any partial progress and hides the cause); adding `session_turns` to the purge now (a behaviour change that may unleash an 8,400-tenant delete on staging, deserves a separate look); working on `utp-s1` first (about 10 seconds on a pull request).
**Also found, not in scope:** 19 UI specs fail on every E2E smoke run and the `continue-on-error` job hides them (`reference/purge-and-e2e-tail-diagnosis-2026-11-20.md` section 2); each is a separate story and the operator should decide how to triage them.

## Delivery log: dgn-s1 (2026-11-20)

**Change:** `scripts/purge-e2e-tenants.js` only. New optional `report(event)` hook (default none; a throwing hook is caught) through `findE2eTenantIds(db, report)`, `purgeTenantsBatch(db, tenantIds, report, chunkInfo)` and `purgeE2eTenants(db, { report })`; every query is timed through one `timedQuery` helper that announces `start` and `done` (with ms, rowCount and the error message). New exported `createPurgeReport()` aggregates per table (calls, total ms, rows, errors, first error once) and tracks the query in progress and tenants through completed chunks; `formatPurgeFailureMessage(err, found, progress)` appends chunk, table and tenants-done when progress is given. The CLI prints the summary on success and, after the failure line, on timeout. 106 lines added, 26 removed, CRLF preserved. All 22 `DELETE` literals and the 4 find queries are byte-identical to master; no `session_turns` query was added; the 90 s guard and exit code are untouched. One side effect: `timedQuery` is an async function, so a `db.query` that throws synchronously is now swallowed like a rejection (the real pg pool only rejects).

**Test:** `tests/check-dgn-s1-purge-reports-where-time-goes.js` (T1 to T7, 26 assertions). Red first: the new functions did not exist (T3 crashed on `createPurgeReport`); after the change 26 passed, 0 failed. T5 records every (SQL, parameters) pair for a 450-tenant run (37 queries, 3 chunks) with no hook, a recording hook and a throwing hook and asserts all three are identical; T6 runs the CLI as a child process against an unreachable port and checks the exit code is 0 and the summary block is printed. The three existing purge tests (pebd-s1, alrf-s11, stcs-s1) pass unchanged, as do the 22 other test files that mention the purge script or `staging-deploy.yml`.

**Not yet verified (AC7):** the first real log. After the merge, the next Staging Deploy prints the summary block in both purge steps; the DoD records which table is slow or failing and what the fix story should be (candidates, none confirmed: a slow `artefacts` delete over large tables, the swallowed `session_turns` foreign key error on `journeys`, or a mix).
