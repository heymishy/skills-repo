## Test Plan: Answer 404 Not Found, not 500, when the URL contains a broken percent-escape

**Story reference:** artefacts/2026-11-16-malformed-url-escape/stories/ure-s1-malformed-url-escape.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-ure-s1-malformed-escape-404.js`, using the same seams as the uid-s1 tests (`createApp({ router })`, the real `authGuard`, a recording capture client via `initErrorCapture(..., { PostHogClient })`) plus the real `createApp()` route table for AC6. The uid-s1 tests are left unchanged and must keep passing.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Guarded handler fails with URIError and the path is undecodable: 404, no report | - | 1 (T1) | - | - | - | 🟢 |
| AC2 | Router-level failure, same: 404, no report | - | 1 (T2) | - | - | - | 🟢 |
| AC3 | URIError while the path decodes fine: stays 500 and reported | 1 (T3a classifier) | 1 (T3b) | - | - | - | 🟢 |
| AC4 | Everything else unchanged (other URIError message, TypeError, database error, uid-s1 case) | 1 (T4a) | 1 (T4b) | - | - | - | 🟢 |
| AC5 | Response already started: no second write, no throw | - | 1 (T5) | - | - | - | 🟢 |
| AC6 | Real route table: the two reported URLs plus one more decoding route answer 404; well-formed escapes still route | - | 2 (T6a broken escapes, T6b well-formed escapes) | - | - | - | 🟢 |
| AC7 | Live: both URLs 404, no new issue | - | - | - | 1 | Live-only | 🟡 |
| NFR | Classifier never throws | 1 (T7) | - | - | - | - | 🟢 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Needs the deployed app | AC7 | Live-only | Verification scenario 8; `production-observed` |

No AC depends on CSS layout; no B2 classification needed.

## Test Data Strategy

**Source:** Synthetic, with the real shape. The real error is produced by calling `decodeURIComponent('%E0%A4%A')` in the test, not by constructing an imitation, so the message text (`URI malformed`) comes from the engine itself. **PCI/sensitivity:** No. **Owner:** self-contained.

## Unit Tests (new file `tests/check-ure-s1-malformed-escape-404.js`)

- **T3a - classifier (AC3).** `isInvalidIdError(err, req)`: true for the engine's own `URIError` with `req.url` `/journey/x/stage/%E0%A4%A`; true when only a query value is broken (`/x?q=%E0%A4%A`); false when the same `URIError` is passed with a url that decodes fine (`/journey/x/stage/ok%20name`); false for a `URIError` with a different message; false for `TypeError`, a plain `Error('URI malformed')`, `null`, a string.
- **T4a - uid-s1 unchanged (AC4).** The uuid-syntax case still returns true and a non-matching 22P02 still returns false.
- **T7 - never throws (NFR).** `undefined`, `{}`, an err whose `name` is a throwing getter, a req whose `url` is a number or whose url throws on decode, all return false without an exception.

## Integration Tests

- **T1 - guarded route (AC1).** `authGuard` around a handler that rejects with the engine's URIError, url `/journey/x/stage/%E0%A4%A`: 404, body exactly `{"error":"not found"}`, JSON, zero reports. Fails today (500).
- **T2 - router level (AC2).** A router that throws the same error synchronously: same 404, zero reports. Fails today.
- **T3b - not from the url (AC3).** Url `/journey/x/stage/ok`, same URIError: 500 `Internal Server Error`, exactly one report.
- **T4b - others unchanged (AC4).** `TypeError`, a different `URIError` message and a 23505 database error each: 500 and one report; the uid-s1 case still 404.
- **T5 - already started (AC5).** The handler ends a 200 response, then rejects with the URIError: status stays 200, nothing appended, no throw.
- **T6a - real route table (AC6).** The real `createApp()` router, a signed-in test session and a stub pool: GET `/journey/x/stage/%E0%A4%A`, `/products/x/playback-evidence/%E0%A4%A` and one further route from the audit that decodes a segment each answer 404 JSON and send zero reports.
- **T6b - well-formed escapes still route (AC6).** `/journey/x/stage/ok%20name` reaches the stage handler with `stageName` `ok name`; an encoded slash (`%2F`) decodes to `/` as before.

## NFR Tests
- Security: T1 and T6a (body contains no error text, no echoed value). Reliability: T7. Performance: none.

## Test Gaps and Risks
| Gap | Reason | Mitigation |
|-----|--------|------------|
| Not every one of the ~20 decode sites is driven | Central translation by design | T1 and T2 prove it for any guarded or unguarded route; T6a proves three real routes; AC7 samples production |

**Total automated tests:** 10 (T1, T2, T3a, T3b, T4a, T4b, T5, T6a, T6b, T7; T3a, T4a and T7 each cover several inputs).
