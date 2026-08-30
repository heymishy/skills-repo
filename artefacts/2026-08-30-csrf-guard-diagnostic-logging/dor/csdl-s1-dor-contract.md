# Contract Proposal: Temporary CSRF guard diagnostic logging

**Story reference:** artefacts/2026-08-30-csrf-guard-diagnostic-logging/stories/csdl-s1-add-temporary-csrf-guard-diagnostic-logging.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-30

---

## What will be built

- In `src/web-ui/middleware/csrf.js`: `generateCsrfToken` gains one `console.info(JSON.stringify({...}))` line emitting `event: 'csrf_token_generate'`, `sessionIdPrefix`, `machineId`, `tokenPrefix`, `wasNew`.
- `csrfGuard` gains one `console.info(JSON.stringify({...}))` line emitting `event: 'csrf_guard_check'`, `sessionIdPrefix`, `machineId`, `submittedPrefix`, `expectedPrefix`, `match`.
- A small internal helper (`_prefix8(value)`) to consistently truncate to 8 hex chars or return `'(empty)'` for a falsy value, used by both log sites.

## What will NOT be built

- No change to `csrfGuard`'s pass/fail return value or the 403 response shape.
- No fix for the underlying mismatch — diagnostic only, per `decisions.md`.
- No removal of this logging in this story — tracked as a required follow-up.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Spy on `console.info`; call `generateCsrfToken` on a token-less then token-bearing session; assert both log shapes and `wasNew` values | Unit |
| AC2 | Spy on `console.info`; call `csrfGuard` with matching and mismatched/missing submissions; assert both log shapes and `match` values, including `'(empty)'` handling | Unit |
| AC3 | Re-run `tests/check-cpr-s1-csrf-persist-race.js` | Integration (existing) |
| AC4 | Re-run `node scripts/run-all-tests.js` | Integration (existing) |

## Assumptions

- `process.env.FLY_MACHINE_ID` is set by Fly's runtime on every machine; falls back to `'unknown'` locally/in tests (unverified in this environment directly, but documented Fly platform behaviour — low risk, and the fallback makes an incorrect assumption harmless either way).

## Estimated touch points

Files: `src/web-ui/middleware/csrf.js` only. Services: none. APIs: none.
