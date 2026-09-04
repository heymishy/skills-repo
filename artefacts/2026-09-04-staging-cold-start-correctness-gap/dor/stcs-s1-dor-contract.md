# DoR Contract: purge-e2e-tenants tolerates Neon cold-start and gets a scheduled backstop

**Story reference:** artefacts/2026-09-04-staging-cold-start-correctness-gap/stories/stcs-s1-purge-e2e-tenants-cold-start-retry-and-scheduled-backstop.md
**Test plan:** artefacts/2026-09-04-staging-cold-start-correctness-gap/test-plans/stcs-s1-test-plan.md
**Date:** 2026-09-04

---

## Scope

**MUST touch:**
- `scripts/purge-e2e-tenants.js` (retry logic on connection, configurable overall deadline, improved timeout log message)
- `.github/workflows/purge-e2e-tenants-scheduled.yml` (new)
- `tests/check-stcs-s1-purge-e2e-tenants-cold-start-and-schedule.js` (new)

**MUST NOT touch:**
- `tests/check-alrf-s11-purge-e2e-tenants.js` -- regression guard (AC5), confirmed to pass unmodified, not edited.
- The purge step's own existing invocations inside `staging-deploy.yml` (line ~192) and `e2e.yml` (line ~318) -- confirmed by direct reading that both already pass `DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}` and have their own job-step `timeout-minutes: 2`; this story's script-level changes are backward-compatible with that existing wiring (same env var name, same non-blocking exit-code-0 behaviour on failure) and require zero wiring changes.
- `scripts/deploy-staging.js`, `scripts/seed-staging.js` -- out of scope per the story's own scope section.

## Assumptions verified before sign-off

1. **The existing CI wiring's job-step `timeout-minutes: 2` (120000ms) is a SEPARATE, outer timeout from the script's own internal `withTimeout` deadline** -- confirmed by reading both `staging-deploy.yml` (line ~191) and `e2e.yml` (line ~317) directly. This is why AC2's new default (90000ms) is deliberately set below 120000ms, not equal to or above it -- so the script's own graceful timeout/cleanup path (which still runs `pool.end()` and exits 0) always fires before the step-level kill, which does not guarantee graceful cleanup.
2. **`secrets.STAGING_DATABASE_URL` is the correct, already-used secret name** for the new scheduled workflow to reference -- confirmed identical in both existing purge-step call sites.
3. **`improvement-agent-schedule.yml` is a valid, already-working precedent for a `schedule: cron:` trigger in this repo** -- confirmed by reading it in full; the new workflow follows the same `cron:` + `workflow_dispatch:` (for manual on-demand runs) pattern.
4. **`tests/check-alrf-s11-purge-e2e-tenants.js`'s own 11 tests exercise `findE2eTenantIds`/`purgeTenant`/`purgeE2eTenants`/`setDbConnection` via a fake DB adapter, never the CLI entrypoint's own connection-retry or `withTimeout` logic** -- confirmed by reading the file in full; zero collision risk with this story's changes, which are scoped to the CLI entrypoint block (`if (require.main === module)`) plus the exported `withTimeout` helper's own signature (must remain backward compatible -- same `(promise, ms, label)` shape, only the call site changes what `ms` value it passes).

## Risk

**Rating: 2** (the retry/timeout logic is self-contained and independently testable via a fake DB adapter matching this file's existing test convention; the one real risk is the new scheduled workflow's actual on-schedule firing, which cannot be verified locally).

**RISK-ACCEPT:** AC4's actual on-schedule execution (T10) cannot be verified by a local automated test -- accepted via post-merge observation (`gh run list --workflow purge-e2e-tenants-scheduled.yml` after the first scheduled window passes, or a manual `workflow_dispatch` trigger immediately after merge to confirm the workflow itself is valid and runs successfully without waiting for the cron window). Logged in this feature's own `decisions.md`.

## Coding Agent Instructions

1. Add connection retry (up to 3 attempts, exponential backoff 2s/4s/8s) to the CLI entrypoint's `Pool` connection, and make the overall deadline configurable via `PURGE_E2E_TENANTS_TIMEOUT_MS` (default `90000`).
2. Improve the timeout catch block's log message to include the tenant count if `findE2eTenantIds` had already completed before the timeout (track this via a variable set right after that call, checked in the catch block).
3. Write `.github/workflows/purge-e2e-tenants-scheduled.yml`, following `improvement-agent-schedule.yml`'s own `schedule:`/`workflow_dispatch:` pattern, invoking `node scripts/purge-e2e-tenants.js` with `DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}`.
4. Write `tests/check-stcs-s1-purge-e2e-tenants-cold-start-and-schedule.js` covering T1-T7, using a fake connect function/DB adapter matching `check-alrf-s11-purge-e2e-tenants.js`'s own existing convention.
5. Run `tests/check-alrf-s11-purge-e2e-tenants.js` directly to confirm T8 passes unmodified.
6. Run the full suite (`npm test`) before considering the task complete.
7. TDD RED-state verification: stash the `purge-e2e-tenants.js` changes, re-run the new test file, confirm it fails against pre-fix code, then restore.

## Proceed: Yes
