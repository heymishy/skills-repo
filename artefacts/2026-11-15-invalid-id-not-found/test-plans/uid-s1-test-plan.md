## Test Plan: Answer 404 Not Found, not 500, when a malformed id is in the URL

**Story reference:** artefacts/2026-11-15-invalid-id-not-found/stories/uid-s1-invalid-id-not-found.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-15
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New files: `tests/check-uid-s1-invalid-id-404.js` (always runs) and `tests/check-uid-s1-real-postgres.js` (gated by the environment variable `UID_TEST_DATABASE_URL`; refuses non-local hosts; same pattern as `tests/check-tabf-s1-bootstrap-real-postgres.js`). The main file uses the same seams as the ecg-s1 tests: `createApp({ router })`, the real `authGuard`, and a recording capture client via `initErrorCapture(..., { PostHogClient })`.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Guarded route, uuid error with the value in the url: 404, no report | - | 1 (T1) | - | - | - | 🟢 |
| AC2 | Unguarded route, same: 404, no report | - | 1 (T2) | - | - | - | 🟢 |
| AC3 | Value not in the url (or empty): stays 500 and reported | 1 (T3a classifier) | 1 (T3b through the server) | - | - | - | 🟢 |
| AC4 | Any other failure unchanged | - | 2 (T4a other database error, T4b plain thrown error) | - | - | - | 🟢 |
| AC5 | Response already started: no second write, no throw | - | 1 (T5) | - | - | - | 🟢 |
| AC6 | Real product and journey handlers answer 404 for malformed ids | - | 2 (T6a product view, T6b journey page) | - | - | - | 🟢 |
| AC7 | Real Postgres confirms the error shape | - | 1 (P1, gated) | - | - | Environmental | 🟢 |
| AC8 | Live: both URLs answer 404, no new issue | - | - | - | 1 | Live-only | 🟡 |
| NFR | Classifier never throws; no database text or value in the response | 1 (T7) | - | - | - | - | 🟢 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Needs Docker for a throwaway Postgres | AC7 | Environmental | P1 is gated and prints SKIPPED when no database URL is set; it is run once locally with Docker and recorded in the evidence file; the pure classifier test (T3a) and the mock-shaped tests still run everywhere |
| Needs the deployed app | AC8 | Live-only | Verification scenario 9; `production-observed` |

No AC depends on CSS layout; no B2 classification needed.

## Test Data Strategy

**Source:** Synthetic. Error objects shaped exactly like the node-postgres error for this case (`code: '22P02'`, `message: 'invalid input syntax for type uuid: "<value>"'`), with the real shape confirmed by P1 against a real Postgres (the lesson from D62 and D63: prove the third-party error shape once, not only through our own double). Handlers are driven with a mock pool whose `query` rejects with that error (shape read from the pool usage in `handleGetProductView`). **PCI/sensitivity:** No. **Owner:** self-contained.

## Unit Tests (new file `tests/check-uid-s1-invalid-id-404.js`)

- **T3a - classifier (AC3).** `isInvalidIdError(err, req)`: true for a 22P02 uuid error whose value is in `req.url` raw (`/products/not-a-uuid`), and in percent-encoded form (`/products/%E0%A4%A`, `/products/%27%20OR%201%3D1`); false when the value is not in the url; false for an empty value; false for code 22P02 with a different type in the message (for example `integer`); false for other codes; false for non-errors (`null`, a string).
- **T7 - never throws (NFR).** The classifier returns false, not an exception, for `undefined`, an object without `message`, a getter that throws, and an `err.message` that is not a string.

## Integration Tests

- **T1 - guarded route (AC1).** `authGuard` around a handler that rejects with the uuid error, url `/products/not-a-uuid`: status 404, body exactly `{"error":"not found"}`, content type `application/json`, and zero `captureException` calls. Fails today (500).
- **T2 - unguarded route (AC2).** A router that rejects with the same error: 404, same body, zero reports. Fails today.
- **T3b - value not in url (AC3).** Url `/products/abc` but the error names a different value: 500 `Internal Server Error` and exactly one report.
- **T4a - another database error (AC4).** Error with `code: '23505'`: 500 and one report. **T4b - plain error (AC4).** `new Error('boom')`: 500 and one report.
- **T5 - already started (AC5).** The handler writes a 200 head, then rejects with the uuid error: no exception escapes, status stays 200, no second head written.
- **T6a - real product page handler (AC6).** `handleGetProductView` with a mock pool whose first query rejects with the real-shaped error, inside the guarded server: `/products/not-a-uuid`, `/products/%00`, `/products/%E0%A4%A`, `/products/%27%20OR%201%3D1%20--` each answer 404 JSON. A well-formed unknown uuid (pool returns no rows) still answers 404 through the existing path.
- **T6b - real journey page handler (AC6).** `handleGetJourneyCanvas` the same way for `/journeys/not-a-uuid` and `/journeys/%00`.

## Real-database test (new file `tests/check-uid-s1-real-postgres.js`, gated)

- **P1 - the error shape (AC7).** Against a fresh throwaway Postgres (refuses any host that is not local): create a table with a uuid primary key, run `SELECT * FROM t WHERE id = $1` with `'not-a-uuid'`, `'%00'` and `"' OR 1=1 --"` using the real `pg` client; each rejects with `code === '22P02'` and a message matching `invalid input syntax for type uuid: "<the value>"`, and `isInvalidIdError` returns true for it with the matching request url.

## NFR Tests
- Security: T6a (body contains no database text, no echoed value). Reliability: T7. Performance: none (failure path only).

## Test Gaps and Risks
| Gap | Reason | Mitigation |
|-----|--------|------------|
| Other routes with an id are not each driven | Central translation by design | T1 and T2 prove it for any guarded or unguarded route; T6 proves it for the two reported handlers; AC8 samples production |
| A different driver message text on a future `pg` upgrade | Message text is parsed | P1 would catch it; the classifier requires both code and message, failing safe to 500 |

**Total automated tests:** 11 (T1, T2, T3a, T3b, T4a, T4b, T5, T6a, T6b, T7, and P1 which is gated; T3a, T6a and T7 cover several inputs each).
