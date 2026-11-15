## Test Plan: Report every server error to the error chain, not only the ones the router catches

**Story reference:** artefacts/2026-11-15-error-capture-coverage/stories/ecg-s1-capture-all-server-5xx.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-15
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-ecg-s1-capture-all-5xx.js`, using the seams the coha-s5 (error capture) tests already use: `createApp({ router })` in server.js, and `initErrorCapture(env, vars, { PostHogClient })` with a recording client class so each `captureException(err, distinctId, props)` call can be counted and read.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Rejecting guarded handler is reported once, 500 unchanged | - | 1 (T1) | - | - | - | 🟢 |
| AC2 | Throwing guarded handler is reported once, 500 unchanged | - | 1 (T2) | - | - | - | 🟢 |
| AC3 | Any 5xx written without a throw is reported once as `http_5xx` | - | 3 (T3a 500, T3b 503, T3c status set then end) | - | - | - | 🟢 |
| AC4 | No double report | - | 2 (T4a router catch, T4b guard plus safety net) | - | - | - | 🟢 |
| AC5 | Below 500 is not reported | - | 1 (T5) | - | - | - | 🟢 |
| AC6 | Capture failure or unwired never changes the response | - | 2 (T6a unwired, T6b throwing client) | - | - | - | 🟢 |
| AC7 | Unhandled rejection reported, no exit | 1 (T7) | - | - | - | - | 🟢 |
| AC8 | Live: one bad URL opens exactly one issue and PR; repeat opens none | - | - | - | 1 | Live-only, outward action | 🟡 |
| NFR | Report passes through the scrubber (no raw message or id) | 1 (T8) | - | - | - | - | 🟢 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Needs the deployed app, the alert and the bridge, and creates a real GitHub issue and PR | AC8 | Live-only, outward-facing | Verification scenario 9; operator approval required before the request; `production-observed` |
| The 48 individual 500 sites are not enumerated one by one | AC3 | By design | The safety net is one chokepoint; T3 proves it for any site |

No AC depends on CSS layout; no B2 classification needed.

## Test Data Strategy

**Source:** Synthetic. Routers are small async functions defined in the test (resolve with a 200, write a 500 directly, write a 503, set a status then end, reject, throw); guarded cases call the real `authGuard` from `routes/auth.js` around a failing handler, inside a test router passed to `createApp`. Requests go to the server on an ephemeral port with Node's `http`. A recording `PostHogClient` class collects capture calls (mock shape read from the existing coha-s5 `recordingCtor` and from `captureServerError`, which calls `client.captureException(err, FIXED_DISTINCT_ID, props)`). **PCI/sensitivity:** No. **Owner:** self-contained.

## Integration Tests (new file `tests/check-ecg-s1-capture-all-5xx.js`)

- **T1 - rejecting guarded handler (AC1).** Router calls `authGuard(req, res, async () => { throw new Error('boom') })` with a session holding an `accessToken`. Expect: response 500 with body `Internal Server Error` and content type `text/plain`; exactly one `captureException` call; its error is the thrown one; its props carry `code: 'request_error'` and `route` equal to the label of the request url. Fails today (0 calls).
- **T2 - throwing guarded handler (AC2).** Same, handler throws synchronously. One call, same 500.
- **T3a - plain 500 written without a throw (AC3).** Router does `res.writeHead(500); res.end('x')`. Exactly one call with `code: 'http_5xx'`; the client sees status 500 and body `x`. Fails today.
- **T3b - 503 (AC3).** Same with 503; one call, `http_5xx`, status 503 passes through.
- **T3c - status set then end (AC3).** Router does `res.statusCode = 500; res.end('y')` (no `writeHead`). One call, `http_5xx`, status 500 passes through.
- **T4a - router rejection (AC4).** Router rejects; the existing router catch reports and writes 500. Exactly one call (not two).
- **T4b - guard plus safety net (AC4).** The T1 setup again: the guard's own report and the safety net see the same 500; exactly one call in total.
- **T5 - below 500 not reported (AC5).** 200, 302 and 404 responses: zero calls.
- **T6a - unwired (AC6).** After `_resetForTests()` (not wired, not disabled) run T1 and T3a: the 500 responses are identical to today and nothing throws out of the server (the client still receives the response).
- **T6b - throwing client (AC6).** A client whose `captureException` throws: same assertions.

## Unit Tests

- **T7 - unhandled rejection (AC7).** Export `handleUnhandledRejection(reason)` from server.js (the function the process handler calls); calling it with an Error logs once, reports once with `code: 'unhandled_rejection'`, returns without throwing, and does not call `process.exit` (spied).
- **T8 - scrubber applies (NFR).** Run a captured event from T1 through the module's `scrubEvent` as the client's `before_send` would: the output has no message text other than the code and the route is the label form. This asserts the new paths do not bypass the scrubber (they only call `captureServerError`, which passes `code`, `route` and `environment`).

## NFR Tests
- Privacy: T8. Reliability: T4a, T4b, T6a, T6b. Performance: none new (one wrapped function per request); confirmed.

## Test Gaps and Risks
| Gap | Reason | Mitigation |
|-----|--------|------------|
| A real PostHog, alert and bridge are not in the loop | Mocks only prove the report is sent | AC8 live check |
| A route could answer 5xx by a path other than `writeHead` or `statusCode` then `end` | Static search found only those two forms | T3a and T3c cover both; the safety net checks `statusCode` at the response `finish` event |

**Total automated tests:** 13 (T1, T2, T3a, T3b, T3c, T4a, T4b, T5, T6a, T6b, T7, T8; T3 counts as three).
