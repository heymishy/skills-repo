# Contract Proposal - Answer 404 Not Found, not 500, when the URL contains a broken percent-escape

**What will be built:**
- `src/web-ui/utils/invalid-id-error.js`: `isInvalidIdError(err, req)` also returns true for a `URIError` with message `URI malformed` when the request's own url cannot be decoded (decoding the path, a path segment or the query string throws); the uuid-syntax case is unchanged; never throws. `respondNotFound(res)` is unchanged. The header comment is extended to describe both cases.
- `tests/check-ure-s1-malformed-escape-404.js` (new, T1 to T7).

**What will NOT be built:**
- No change to `authGuard` or the router catch themselves (both already call the helper); no wrapping of individual `decodeURIComponent` calls; no change to the artefact route (`anf-s1`); no change to any existing 404 or 400 answer; no new npm dependency.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1 | integration (real `createApp` and `authGuard`) |
| AC2 | T2 | integration |
| AC3 | T3a, T3b | unit and integration |
| AC4 | T4a, T4b | unit and integration |
| AC5 | T5 | integration |
| AC6 | T6a, T6b | integration with the real route table |
| AC7 | Scenario 8 | live (production-observed) |

**Assumptions:** the router catch and `authGuard`'s error handler already call `isInvalidIdError` first (confirmed in uid-s1, `server.js` and `auth.js`); the two reported routes decode in the router (`server.js` journey stage route and playback-evidence route) so the error reaches the router catch; the engine's `URIError` message is `URI malformed` (the tests produce it by calling `decodeURIComponent`, not by imitation).

`schemaDepends: []`. **Estimated touch points:** Files: `src/web-ui/utils/invalid-id-error.js`, `tests/check-ure-s1-malformed-escape-404.js` (new). Services: none. APIs: none changed except 500 becoming 404 for broken escapes.
