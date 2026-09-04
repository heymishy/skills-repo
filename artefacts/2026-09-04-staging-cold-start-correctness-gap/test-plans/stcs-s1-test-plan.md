# Test Plan: purge-e2e-tenants tolerates Neon cold-start and gets a scheduled backstop

**Story reference:** artefacts/2026-09-04-staging-cold-start-correctness-gap/stories/stcs-s1-purge-e2e-tenants-cold-start-retry-and-scheduled-backstop.md
**Date:** 2026-09-04

---

## Test approach

AC1-AC3 are script-level logic, fully testable locally with an injectable fake DB adapter (matching this file's own existing convention -- `setDbConnection`, `makeFakeDb`). AC4 is a new GitHub Actions scheduled workflow's existence and shape -- testable via static YAML assertion (cron syntax present, correct script invoked, correct app/DB target) but its actual on-schedule execution cannot be verified locally, RISK-ACCEPTed with post-merge observation (first scheduled run confirmed manually or via `gh run list`), matching this repo's own established B2/`sdsb-s1`/`cpco-s1` precedent for GitHub-native-behaviour-dependent ACs. AC5/AC6 are existing regression-guard suites/wiring run/inspected directly.

## Tests

| # | AC | Test | Type |
|---|----|------|------|
| T1 | AC1 | A fake `Pool`-like connect function that fails twice then succeeds on the 3rd attempt results in a successful purge, not an immediate failure | Automated (new) |
| T2 | AC1 (regression) | A fake connect function that fails all 3 attempts still fails gracefully (non-blocking exit code 0, error logged) after exhausting retries, not hanging indefinitely | Automated (new) |
| T3 | AC2 | `withTimeout`'s deadline defaults to 90000ms when `PURGE_E2E_TENANTS_TIMEOUT_MS` is unset | Automated (new) |
| T4 | AC2 | `withTimeout`'s deadline honours `PURGE_E2E_TENANTS_TIMEOUT_MS` when set (e.g. set to `5000`, confirm a deliberately-slow fake operation times out at ~5s, not 90s) | Automated (new) |
| T5 | AC3 | On a timeout with tenant ids already found, the logged error message includes the found count, not just the generic "timed out after Nms" string | Automated (new) |
| T6 | AC3 (regression) | On a timeout with zero tenant ids found yet (find step itself still in flight), the logged message does not falsely claim a tenant count of 0 as if the find step had completed | Automated (new) |
| T7 | AC4 | `.github/workflows/purge-e2e-tenants-scheduled.yml` exists, has a `schedule: cron:` trigger, and invokes `node scripts/purge-e2e-tenants.js` against the staging `DATABASE_URL` secret (same secret name as the existing CI wiring) | Automated (new) |
| T8 | AC5 | `tests/check-alrf-s11-purge-e2e-tenants.js` (11 tests) still passes unmodified | Automated (existing, regression) |
| T9 | AC6 | Direct inspection: the existing purge step invocations in `staging-deploy.yml`/`e2e.yml` are byte-for-byte unchanged by this story (only `scripts/purge-e2e-tenants.js` and the one new workflow file are touched) | Manual (diff review, part of DoD) |
| T10 | AC4 | Manual: after merge, confirm (via `gh run list --workflow purge-e2e-tenants-scheduled.yml`) that the first scheduled run actually fires and completes | Manual (verification script) |

**Total logical tests:** 10 (T1-T10).

## Gaps

Real Neon cold-start timing and real GitHub Actions `schedule:` trigger firing cannot be exercised in this local test environment. T10's manual verification is the closest available confirmation, matching this repo's own established precedent for GitHub-native-behaviour-dependent ACs.
