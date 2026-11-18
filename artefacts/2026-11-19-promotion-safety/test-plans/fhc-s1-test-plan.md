## Test Plan: Production declares a Fly health check on /health

**Story reference:** artefacts/2026-11-19-promotion-safety/stories/fhc-s1-fly-health-check.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-19
**Test runner (read from package.json):** `npm test` runs `scripts/run-all-tests.js`, which runs `tests/check-*.js`. New file: `tests/check-fhc-s1-fly-health-check.js`, plain Node, reading `fly.toml` and `fly.staging.toml` as text and calling the existing health handler with a fake response.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `[[http_service.checks]]` with GET /health | 1 (T1) | - | - | - | - | 🟢 |
| AC2 | grace_period >= 60 s, interval 10 to 30 s, timeout < interval | 1 (T2) | - | - | - | - | 🟢 |
| AC3 | app and the other `[http_service]` settings unchanged | 1 (T3, baseline) | - | - | - | - | 🟢 |
| AC4 | `/health` handler answers 200 `{"status":"ok"}` with no session and no database | 1 (T4, baseline) | - | - | - | - | 🟢 |
| AC5 | `fly.staging.toml` declares no health check | 1 (T5, baseline) | - | - | - | - | 🟢 |

## Red-first plan

T1 and T2 fail on the current `fly.toml` (no check). T3, T4 and T5 pass before and after and guard existing behaviour.

## Manual step

The interaction between a failing check and `auto_stop_machines = 'suspend'` cannot be tested in CI. After the first promotion that carries this change the operator runs `flyctl status -a skills-framework` and confirms the check is passing. Recorded in the DoD.
