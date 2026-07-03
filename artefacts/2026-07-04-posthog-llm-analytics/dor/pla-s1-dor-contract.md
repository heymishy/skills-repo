# DoR Contract: pla-s1 — Extend posthog-server.js with identify, groupIdentify, captureException, and $groups support

**Date:** 2026-07-04
**Status:** Approved

---

## What will be built

`src/web-ui/modules/posthog-server.js` — add three new exported functions:
- `identify(distinctId, { $set: { login, tenantId, role } })` — sends `$identify` HTTP POST to PostHog `/capture/`
- `groupIdentify(groupType, groupKey, props)` — sends `$groupidentify` HTTP POST with `$group_type`, `$group_key`, `$group_set`
- `captureException(err, distinctId, extraProps)` — sends `$exception` HTTP POST with `$exception_type`, `$exception_message`, `$exception_stack_trace_raw`, and merged extra props

Update existing `capture(distinctId, event, properties, groups?)`:
- Accept optional 4th `groups` argument; when present, merge as `"$groups": groups` into request body
- When `groups` is absent, no `$groups` key is added (backward-compatible)

Add module-level constant:
- `const PRIVACY_MODE = process.env.POSTHOG_PRIVACY_MODE === 'true'`
- Export as `module.exports.PRIVACY_MODE`

`tests/check-pla-s1-posthog-module.js` — new test file (16 tests) added to `npm test` chain in `package.json`.

## What will NOT be built

- No calls to `identify()`, `groupIdentify()`, or `captureException()` from any route handler — all call-site wiring is pla-s2.
- No changes to `skills.js`, `journey.js`, `server.js`, or any other file.
- No new npm packages.
- No changes to the existing `capture()` implementation beyond adding the optional `groups` parameter.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1: identify() → HTTP POST with $identify + $set | Unit A1, A2: https mock via require cache; assert event, distinct_id, properties.$set | unit |
| AC2: groupIdentify() → $groupidentify + group fields | Unit B1, B2: https mock; assert $group_type, $group_key, $group_set | unit |
| AC3: captureException() → $exception + stack + merged props | Unit C1, C2, C3: https mock; assert exception type, message, stack, merged props | unit |
| AC4: capture() with groups → body includes $groups | Unit D1: call with 4th arg; assert $groups in body | unit |
| AC5: capture() without groups → no $groups | Unit E1: call with 3 args; assert $groups absent | unit |
| AC6: PRIVACY_MODE constant truthy when env='true' | Unit F1, F2: set/unset env; fresh require; assert exported value | unit |
| AC7: POSTHOG_KEY absent → all methods no-op | Unit G1–G4: delete POSTHOG_KEY; assert 0 https.request calls | unit |
| NFR-PERF: fire-and-forget | N1: https error event does not throw to caller | nfr |
| NFR-SEC: key not logged | N2: key value absent from any log call on error | nfr |

## Assumptions

- `posthog-server.js` currently has no pino import; captureException does not need a logger.
- `PRIVACY_MODE` exported directly as property (not getter).
- The `$lib: 'posthog-node-manual'` property preserved on all new methods (same as existing `capture()`).
- All new methods follow the identical fire-and-forget pattern used by the existing `capture()` — same hostname, same path, same `req.on('error', function() {})` no-op.

## Estimated touch points

- **Files:** `src/web-ui/modules/posthog-server.js`, `tests/check-pla-s1-posthog-module.js`, `package.json`
- **Services:** None
- **APIs:** None (all PostHog calls mocked in tests)

## schemaDepends

Not applicable — story Dependencies block is "None" (H8-ext: skip).
