# sep-s1 Definition of Done

Date: 2026-11-17. Story: Scenario A and B end-to-end tests run against the pull request's own build before merge, and against the deployed staging before production. PR #1134, merged to master on 2026-11-16 at 18:42 UTC (`9bf581ab2`). The change is workflow files, guard tests and a new workflow-text test only; no application source or spec file changed.

## Result: COMPLETE

AC1 to AC4 (Acceptance Criteria 1 to 4) were verified by 4 automated tests (`tests/check-sep-s1-scenarios-on-pr-build.js`) and the reversed guards before merge. AC5 and AC6 are CI evidence on the PR. AC7 was observed live on the merge's own Staging Deploy.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | T1: both jobs keep their names, start the PR's server with the mock gateway, a throwaway Postgres with ssl on and a per-run stub secret, at `http://localhost:3000` | automated | the story named a Postgres service container and `127.0.0.1`; CI forced a `docker run` Postgres with ssl on and `localhost` (recorded in `decisions.md`) |
| AC2 | ✅ | T2: no staging secret, no `deploy-group`, Scenario B has no `needs` | automated | none |
| AC3 | ✅ | T3: spec lists and `context.yml` flags unchanged; no spec file edited | automated | none |
| AC4 | ✅ | T4 and the guards: `promote-to-prod` needs `smoke-test` and `post-deploy-e2e-confirm`, no `if:` override | automated | `cif-s1`, `cif-s2`, `fhff-s2`, `pmec-s1` U3 and U4 reversed with dated comments (they encoded the old design) |
| AC5 | ✅ | PR run 43927295257: three greens in a row, Scenario A 1m28s to 2m33s, Scenario B 1m49s to 2m21s | CI evidence | none |
| AC6 | ✅ | broken sign-in stub route (`5ee86a87a`) turned Scenario A red (run 43929296446), reverted in `8d1a39293`, all green again | CI evidence | Scenario B stayed green (it signs in by email); the AC needs at least one job to fail |
| AC7 | ✅ | Staging Deploy run 43931659823 for the merge commit: deploy, smoke test, post-deploy real-staging E2E all succeeded; `Promote to production` started one second after the post-deploy run finished and is parked at its manual approval | production-observed | none |

## Source Issue Closure

No source issue.

## Observations and follow-ups

- Two defects the new environment exposed (in `decisions.md`, not fixed here): a fresh database does not boot cleanly (startup migrations race and run out of order; three boots to settle), and `session_turns` (durable chat) is created only by the manual script `scripts/migrate-schema-pg.js`. One story could fix both.
- Scenarios A and B do not run on production itself after promotion, and `promote-to-prod` builds its own image from the same commit. A read-only post-promotion check (`/health`, `/version`, deployed commit) is a possible follow-up.
- Operator ruleset cleanups offered: rename the two required checks (suggested `Scenario A E2E (PR build)` and `Scenario B E2E (PR build)`) and optionally require `Lint, typecheck, test, build`.
- The older Staging Deploy run 43921309471 (pws-s1) is still in "waiting" for production approval and is superseded.

## Scope Deviations

None.
