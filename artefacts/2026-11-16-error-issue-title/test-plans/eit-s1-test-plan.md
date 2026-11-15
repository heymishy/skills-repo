## Test Plan: Put the error type and route in the issue title, and keep the real error code

**Story reference:** artefacts/2026-11-16-error-issue-title/stories/eit-s1-error-issue-title.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-eit-s1-issue-title.js`, using the real `scrubEvent` from `src/web-ui/modules/error-capture.js`, the real bridge handler `handlePostErrorBridge` from `src/web-ui/routes/error-bridge.js` (with a fake GitHub adapter and store pool, shaped from its own tests) and `codeProblem` / `normaliseEvent` from `scripts/lib/error-issue-incident.js`. Existing assertions in `tests/check-coha-s5-error-capture.js` that expect the value to equal the bare code are edited (listed below).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Value is `<code>: <Type> at <route>` | 1 (T1) | - | - | - | - | 🟢 |
| AC2 | Allow-listed fixed message unchanged | 1 (T2) | - | - | - | - | 🟢 |
| AC3 | `http_5xx` and `unhandled_rejection` kept; unknown code still rewritten | 1 (T3) | - | - | - | - | 🟢 |
| AC4 | No canary text anywhere in the output | 1 (T4) | - | - | - | - | 🟢 |
| AC5 | Longest value accepted by the bridge and the incident script | - | 1 (T5) | - | - | - | 🟢 |
| AC6 | Fingerprint unchanged | 1 (T6) | - | - | - | - | 🟢 |
| AC7 | Live: the ecf-s1 request's issue has the new title | - | - | - | 1 | Live-only | 🟡 |
| NFR | Value built without throwing; no new input-derived text | 1 (T4) | - | - | - | - | 🟢 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Needs the deployed app and the live PostHog alert | AC7 | Live-only | Verification scenario 7; `production-observed` |

No AC depends on CSS layout; no B2 classification needed.

## Test Data Strategy

**Source:** Synthetic events shaped like the existing coha-s5 `sdkEvent`, and the real route labeller. The webhook payload for T5 is built exactly as the PostHog destination's body template builds it (`code` from the exception value, `schema` `coha-s6/v1`, `first_seen`, `environment`, `posthog_issue_id`, `posthog_issue_url`), read from the destination configuration on 2026-11-16. **PCI/sensitivity:** No. **Owner:** self-contained.

## Unit Tests (new file `tests/check-eit-s1-issue-title.js`)

- **T1 (AC1).** An event with code `request_error`, type `URIError`, route `/journey/<uuid>/stage/x`: value is `request_error: URIError at /journey/:p/:p/:p`. A type outside the allow-list becomes `Error`. A missing route becomes `/process` and the value uses it. Fails today (value is `request_error`).
- **T2 (AC2).** `tenant_admin_bootstrap_failed` message: value exactly `tenant_admin_bootstrap_failed`.
- **T3 (AC3).** `code: 'http_5xx'` and `code: 'unhandled_rejection'` are preserved in `properties.code`; `code: 'made_up'` becomes `unhandled_exception`. Fails today (both known codes are rewritten).
- **T4 (AC4, NFR).** Canaries in the message, the route (tenant slug, uuid, `@`-address, query), frame names and extra properties: none appears in `JSON.stringify` of the scrubbed event; scrubbing a malformed event drops it (returns null) without throwing.
- **T6 (AC6).** For the same code and route the fingerprint is `<environment>|<code>|<route>` and equal to the value computed by the previous formula (asserted literally).

## Integration Tests

- **T5 - bridge and incident script accept the longest title (AC5).** Build the longest value (the longest allowed code, `AggregateError`, a route of eight segments plus `/...`); post it as the webhook `code` to `handlePostErrorBridge` with a valid secret, a fake store and a recording GitHub adapter: status 200 and one issue created with exactly that title; `codeProblem(value)` returns `null`; `normaliseEvent` accepts an issue with that title.

## Existing assertions edited

- `tests/check-coha-s5-error-capture.js`: the assertions on `$exception_list[0].value` that expect the bare code (lines near 556 and 689, expecting `unhandled_exception` for the uncaught-exception and unhandled-rejection sink tests) now expect `unhandled_exception: Error at /process`; line 672 (`B_CODE`) and line 45 are checked and edited only if they are affected. No other assertion changes.

## NFR Tests
- Privacy: T4. Reliability: T4 (never throws). Performance: none.

## Test Gaps and Risks
| Gap | Reason | Mitigation |
|-----|--------|------------|
| The live PostHog destination template cannot be run locally | External | T5 reproduces its payload shape from the retrieved configuration; AC7 proves it live |

**Total automated tests:** 6 new (T1 to T6) plus the edited existing assertions.
