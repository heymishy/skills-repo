# Test Plan (Short-track): Fix local-Postgres SSL block (ncdv-s2)

**Story reference:** short-track infra fix (pre-existing cross-feature E2E blocker)
**Date:** 2026-10-13

---

## Root cause

`src/web-ui/adapters/journey-store-pg.js`'s own `_getPool()` hardcoded `ssl: { rejectUnauthorized: false }` unconditionally on every `pg.Pool` it creates. A plain local Postgres (the only realistic local E2E target — Neon/staging/production are never pointed at from a developer machine) rejects an SSL handshake outright ("The server does not support SSL connections"). Root-caused during `ic-s4`'s own DoD (`workspace/learnings.md`, 2026-10-11) and left as a tracked, unfixed gap since — blocking local execution of `ep1-s3`/`ic-s2`/`ic-s3`/`ic-s4`/`jcx-s3`'s own E2E specs for the entire session.

**Fix:** skip the explicit `ssl` override only when `DATABASE_URL`'s own hostname is `localhost`/`127.0.0.1`/`::1` — every real Neon/staging/production connection string keeps its exact existing SSL behavior untouched.

---

## Verification

| Check | Method | Result |
|-------|--------|--------|
| `_isLocalHost` correctly classifies local vs. real hosts | `node tests/check-ncdv-s2-local-postgres-ssl.js` | 2/2 pass |
| Real connection to a local, non-SSL Postgres succeeds (not just pattern-matched) | Spun up a disposable `postgres:16-alpine` Docker container, ran `journey-store-pg.js`'s real `migrateSchema()`/`listJourneys()` against it with `DATABASE_URL` pointed at `localhost:15432` | Succeeded — no SSL error (previously: `The server does not support SSL connections`) |
| A real E2E spec gets further than before | `NODE_ENV=test DATABASE_URL=postgres://...@localhost:15432/testdb npx playwright test tests/e2e/ep1-s3-stage-panel-focus-management.spec.js` | SSL error gone; spec now fails at a DIFFERENT, already-known, separate gap (the dashboard's shared page shell embeds no CSRF token) — confirms this fix closes the SSL blocker specifically, not a false claim of full E2E unblocking |
| Full repo suite, no regressions | `npm test` | Run in progress at time of writing — see commit for confirmed result |

**Known residual gap, logged not fixed here:** the dashboard's shared page shell (`html-shell.js`'s `renderShell`) embeds no page-wide CSRF token, which still blocks full local E2E execution for the same 5 specs (confirmed by directly re-running `ep1-s3-stage-panel-focus-management.spec.js` after this fix — it now fails on the CSRF gap specifically, not SSL). This is separate, larger-scoped work (touches a shared template every page uses) — deliberately not attempted in this short-track fix; tracked as its own pending action.
