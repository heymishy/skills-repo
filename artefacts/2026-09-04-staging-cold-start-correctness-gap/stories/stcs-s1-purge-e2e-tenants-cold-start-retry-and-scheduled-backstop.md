# Story: purge-e2e-tenants tolerates Neon cold-start and gets a scheduled backstop

**Slug:** stcs-s1
**Track:** Short-track (bugs, small fixes, bounded refactors)
**Date:** 2026-09-04

---

## Problem

A CI-triggered run of `scripts/purge-e2e-tenants.js` (the "Purge e2e-test- tenants" cleanup step that runs after every staging smoke-test/E2E job) failed today with `purgeE2eTenants timed out after 60000ms` -- non-blocking (the step is deliberately `continue-on-error`/`if: always()`-gated so it never fails the job that ran the real tests), but silent beyond a console.error line.

A performance deep-dive investigating this (2026-09-04) found the likely root cause: staging's Postgres is a Neon serverless branch (`bri-s2.2-neon-staging-branch`, per this repo's own `decisions.md`), which has its own independent serverless autosuspend -- separate from, and in addition to, the already-documented Fly-app auto-suspend pattern (`workspace/capture-log.md`, 2026-08-31, observed cycling started->suspended in as little as ~6 minutes of inactivity). `purgeE2eTenants` connects directly via `pg.Pool` against `DATABASE_URL`, not via HTTP to the Fly app, so a cold Neon compute spin-up is a highly plausible explanation: the script's own connection step has no retry (a single attempt, `connectionTimeoutMillis: 10000`), and the overall operation is wrapped in a single fixed 60000ms deadline (`scripts/purge-e2e-tenants.js`'s own `withTimeout` helper, added 2026-07-26 after an earlier, different incident -- an unreachable-DB hang).

This is not purely a performance nuisance. Because the timeout failure is silently swallowed (by design, so it never fails CI) and there is no other mechanism that runs this cleanup, a repeated cold-start timeout means `e2e-test-*` tenant rows are never actually purged that run. Since every CI-triggered purge attempt races against the same cold-start risk, repeated timeouts let orphaned E2E test data accumulate unbounded in the staging database over time -- a slow-burn data-hygiene/correctness gap hiding behind what looks like "just slow."

## As a / I want / So that

As the operator running this pipeline
I want the E2E-tenant purge to tolerate a genuine Neon cold start and to run on a schedule independent of any single CI job's own timeout budget
So that orphaned `e2e-test-*` tenant data in staging cannot accumulate unbounded just because CI-triggered purge attempts keep racing a cold database

## Acceptance Criteria

- **AC1:** `purgeE2eTenants`'s CLI entrypoint retries the initial `pg.Pool` connection up to 3 times with exponential backoff (2s, 4s, 8s) before giving up, specifically to tolerate a Neon cold-start reactivation rather than failing on the very first attempt.
- **AC2:** The overall operation deadline (currently a fixed `60000ms` passed to `withTimeout`) is increased to `90000ms` by default, configurable via a `PURGE_E2E_TENANTS_TIMEOUT_MS` environment variable, to account for both a cold-start connection retry sequence and a realistic backlog of tenants to delete -- deliberately kept below the CI step's own existing `timeout-minutes: 2` (120000ms) job-level kill, so the script's own graceful timeout/cleanup path always fires first and the step-level kill remains a true last-resort backstop, never the normal path.
- **AC3:** On a timeout, the logged error message includes how many tenant ids were found (if `findE2eTenantIds` completed before the timeout) versus the fixed generic message today -- so a human reading CI logs can distinguish "cold start, nothing found yet" from "found N tenants, timed out partway through purging them."
- **AC4:** A new scheduled workflow (`.github/workflows/purge-e2e-tenants-scheduled.yml`, cron-triggered daily, following this repo's own existing `improvement-agent-schedule.yml` cron precedent) runs `purge-e2e-tenants.js` against staging independently of any push/PR/deploy event, so accumulation is bounded even if every CI-triggered purge attempt times out on the same day.
- **AC5 (regression guard):** `tests/check-alrf-s11-purge-e2e-tenants.js` (11 existing tests) still passes unmodified.
- **AC6 (regression guard):** The existing CI wiring of the purge step inside `staging-deploy.yml`/`e2e.yml` (non-blocking, `continue-on-error`/`if: always()`) is untouched -- this story only changes the script's own internal retry/timeout/logging logic and adds one new, independent scheduled workflow.

## Out of scope

- The `cpco-s1` install/cache optimization story (a different root cause -- install-time waste, not cold-start correctness). Deliberately not bundled, per that story's own DoR.
- Any change to the Fly-app auto-suspend config itself (`fly.staging.toml`, `fly.toml`) -- disabling auto-suspend has real cost implications and is an operator decision outside this story's scope, matching the same deferral already made for production's own identical config (`workspace/capture-log.md`, 2026-08-31).
- Any change to `deploy-staging.js`/`seed-staging.js`'s own DB connection handling -- narrowly scoped to `purge-e2e-tenants.js` only.
- Alerting/dashboarding on repeated purge timeouts -- AC3's improved log message is the extent of this story's diagnostic-visibility scope; a dedicated alerting mechanism would be a separate, larger story if the sharper logging turns out not to be enough.

## Benefit linkage

Closes a real, evidenced correctness gap (unbounded orphaned E2E test data accumulation in staging) that was hiding behind what first looked like a pure performance issue. No formal benefit-metric artefact -- short-track story, consistent with every other short-track delivery this session.
