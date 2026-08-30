## Test Plan: csdl-s1 — temporary CSRF guard diagnostic logging

**Story reference:** artefacts/2026-08-30-csrf-guard-diagnostic-logging/stories/csdl-s1-add-temporary-csrf-guard-diagnostic-logging.md

## Coverage table

| AC | Test | File |
|----|------|------|
| AC1 | `generateCsrfToken` emits a `csrf_token_generate` log line with sessionIdPrefix/machineId/tokenPrefix/wasNew on both first-mint and reuse | `tests/check-csdl-s1-csrf-diagnostic-logging.js` |
| AC2 | `csrfGuard` emits a `csrf_guard_check` log line with sessionIdPrefix/machineId/submittedPrefix/expectedPrefix/match, on both match and mismatch | `tests/check-csdl-s1-csrf-diagnostic-logging.js` |
| AC3 | Existing `tests/check-cpr-s1-csrf-persist-race.js` re-run, all assertions still pass | Run directly, no new file |
| AC4 | Full suite (`node scripts/run-all-tests.js`) re-run, no new failures | Run directly, no new file |

## New test file: `tests/check-csdl-s1-csrf-diagnostic-logging.js`

Spies on `console.info` (save/restore the original), calls `generateCsrfToken`/`csrfGuard` against a fake req/res built the same way `check-cpr-s1-csrf-persist-race.js` already does, and asserts:
- AC1a: first call on a token-less session logs `wasNew: true` and a `tokenPrefix` matching the returned token's first 8 chars.
- AC1b: second call on the same session (token already present) logs `wasNew: false` with the same `tokenPrefix` as before.
- AC2a: a matching submit logs `match: true`.
- AC2b: a missing/mismatched submit logs `match: false` and `expectedPrefix`/`submittedPrefix` reflecting the actual (truncated) values, or `'(empty)'` when either side is falsy.
- No test asserts on full token or full session id values appearing in any logged line (a negative assertion, guarding AC's "never log the full value" constraint).

## Coverage gaps

None.
