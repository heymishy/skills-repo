# fhc-s1 Definition of Done

Date: 2026-11-19. Story: production declares a Fly health check on /health. Pull request #1159 merged 2026-11-19 (`549955f50`). No issue.

## Result: COMPLETE, with one manual check outstanding (the first promotion that carries it)

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 (`fly.toml` declares a `[[http_service.checks]]` entry with `GET /health`) | ✅ | T1 in `tests/check-fhc-s1-fly-health-check.js` | automated | none |
| AC2 (grace period at least 60 seconds, interval 10 to 30 seconds, timeout under the interval) | ✅ | T2 (60s, 15s, 5s) | automated | none |
| AC3 (`app` and the other `[http_service]` settings unchanged) | ✅ | T3 (baseline) | automated | none |
| AC4 (`/health` answers 200 `{"status":"ok"}` with no session and reads no database) | ✅ | T4 (baseline) | automated | none |
| AC5 (`fly.staging.toml` declares no health check) | ✅ | T5 (baseline) | automated | none |

Red first: T1 and T2 (6 assertions) failed before the change; T3, T4 and T5 passed as baselines. Green after: 15 passed, 0 failed.

## Observations and follow-ups

- **Manual check outstanding: after the first production promotion that carries this change,** run `flyctl status -a skills-framework` and confirm the health check is passing. The interaction with `auto_stop_machines = 'suspend'` cannot be tested in CI. Until a promotion is approved, production does not have the check.
- **Production runs one machine,** so a failing check means a 503 rather than a broken page. Accepted in the story.
- **The pull request first failed on two tests unrelated to it** (`check-coha-s3` and `check-bkn-s1`, caused by a change in the live advisory database). That was repaired as cvt-s1 (pull request 1160) and master merged into the branch.

## Scope Deviations

- None.
