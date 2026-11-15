# Contract Proposal - Answer 404 Not Found, not 500, when a malformed id is in the URL

**What will be built:**
- `src/web-ui/utils/invalid-id-error.js` (new): `isInvalidIdError(err, req)` (true only for a database error with code `22P02` and a message `invalid input syntax for type uuid: "<value>"` whose non-empty value appears in `req.url` raw or percent-encoded; never throws) and `respondNotFound(res)` (404, `{"error":"not found"}`, `application/json`; does nothing if the response has started).
- `src/web-ui/routes/auth.js`: `authGuard`'s error handler checks `isInvalidIdError` first; on a match it logs one line, answers 404 and does not report.
- `src/web-ui/server.js`: the router catch in `createApp` does the same before it reports and answers 500.
- `tests/check-uid-s1-invalid-id-404.js` (new, T1 to T7) and `tests/check-uid-s1-real-postgres.js` (new, P1, gated by `UID_TEST_DATABASE_URL`, refuses non-local hosts).

**What will NOT be built:**
- No per-route id validation; no change to any existing 404 or 400 answer or to well-formed-id behaviour; no handling of non-uuid malformed input; no change to the slow artefact 404 (`anf-s1`); no change to error reporting beyond skipping it for a matched request; no new npm dependency.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1 | integration (real `createApp` and `authGuard`) |
| AC2 | T2 | integration |
| AC3 | T3a, T3b | unit and integration |
| AC4 | T4a, T4b | integration |
| AC5 | T5 | integration |
| AC6 | T6a, T6b | integration with the real handlers and a mock pool |
| AC7 | P1 | real Postgres, gated |
| AC8 | Scenario 8 | live (production-observed) |

**Assumptions:** the server passes the raw path segment to the query without decoding (confirmed: `req.params = { id: pathname.split('/')[2] }`), so malformed values reach Postgres as written and produce `22P02`; `node-postgres` errors carry the SQLSTATE in `err.code` and the server message in `err.message` (to be confirmed by P1); `handleGetProductView` already answers a missing product with `404` JSON `{error:'not found'}`; `handleGetJourneyCanvas` is the handler for `/journeys/:id`.

`schemaDepends: []`. **Estimated touch points:** Files: `src/web-ui/utils/invalid-id-error.js` (new), `src/web-ui/routes/auth.js`, `src/web-ui/server.js`, `tests/check-uid-s1-invalid-id-404.js` (new), `tests/check-uid-s1-real-postgres.js` (new). Services: none. APIs: none changed except 500 becoming 404 for malformed ids.
