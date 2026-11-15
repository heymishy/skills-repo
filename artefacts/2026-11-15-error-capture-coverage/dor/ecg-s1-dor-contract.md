# Contract Proposal - Report every server error to the error chain, not only the ones the router catches

**What will be built:**
- `src/web-ui/modules/error-capture.js`: `captureServerError` accepts an optional `context.req` and reports each request at most once (a flag on the request); nothing else about what is sent changes.
- `src/web-ui/routes/auth.js`: `authGuard`'s `handleGuardedError` reports the error (with `url` and `req`) before writing the 500, inside its own try/catch.
- `src/web-ui/server.js`: in `createApp`, wrap `res.writeHead` and check `statusCode` at `finish` so any 5xx not yet reported is reported once with code `http_5xx`; pass `req` in the existing router-catch report; export `handleUnhandledRejection` and have the process handler call it (logs as today, reports with code `unhandled_rejection`, never exits).
- `tests/check-ecg-s1-capture-all-5xx.js` (new, T1 to T8).

**What will NOT be built:**
- No change to any route's status, body or headers; no rewrite of the 48 response sites; no fix for the malformed-id or slow-404 bugs (`uid-s1`, `anf-s1`); no client-side error reporting; no change to the alert, bridge or incident record; no new npm dependency.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1 | integration (real `createApp` and `authGuard`) |
| AC2 | T2 | integration |
| AC3 | T3a, T3b, T3c | integration |
| AC4 | T4a, T4b | integration |
| AC5 | T5 | integration |
| AC6 | T6a, T6b | integration |
| AC7 | T7 | unit |
| AC8 | Scenario 9 | live (production-observed), needs the operator |

**Assumptions:** `createApp` already accepts `{ router }` (confirmed, server.js line 5262); `captureServerError` calls `client.captureException(err, distinctId, props)` (confirmed); `authGuard` is the only wrapper that writes its own 500 for guarded routes (confirmed by search; other 500 sites are covered by the safety net); posthog-node's autocapture already covers `uncaughtException`.

`schemaDepends: []`. **Estimated touch points:** Files: `src/web-ui/modules/error-capture.js`, `src/web-ui/routes/auth.js`, `src/web-ui/server.js`, `tests/check-ecg-s1-capture-all-5xx.js` (new). Services: none. APIs: none changed.
