**Contract Proposal — Session middleware Redis fallback on cache miss**

**What will be built:**
`readSession(id)` added to `src/web-ui/adapters/session-redis.js` (a natural fourth method alongside the existing `writeSession`/`deleteSession`/`loadAllSessions`, using `client.get(KEY_PREFIX + id)`). `sessionMiddleware` in `src/web-ui/middleware/session.js` becomes `async`: on an in-memory `_sessions` Map cache miss with a cookie-supplied session ID, it attempts `await _activeRedis().readSession(id)` (only if a Redis adapter is configured and a cookie ID was actually present — no read attempted for a request with no cookie at all); on a hit, rehydrates `_sessions.set(id, data)` and uses it as `req.session`/`req.sessionId` with no new `Set-Cookie`; on a miss (or no Redis configured), falls through to creating a new session exactly as today. The single call site in `server.js`'s `router` function is updated to `await sessionMiddleware(req, res)`.

**What will NOT be built:**
Caching `accessToken` in Redis (explicit, operator-declined scope boundary). Any fix for the mid-product-creation-flow session loss (remains a known gap). Any change to `rotateSessionId`, `SESSION_COOKIE_CONFIG`, or the startup-time `loadSessionsFromRedis()` call.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit tests: rehydration from a stub Redis adapter, no new Set-Cookie, rehydrated data written back to the in-memory Map | unit |
| AC2 | Unit tests: genuine double-miss (memory + Redis) creates a new session; no-cookie request never attempts a Redis read | unit |
| AC3 | Integration test: real `handleAuthGithub` → simulated in-memory clear → real `handleAuthCallback`, confirming no false-positive 403 | integration |
| AC4 | Unit test: rehydrated session has no `accessToken`, matching existing `_sanitise` stripping | unit |
| AC5 | Unit test: no Redis adapter configured, cache miss falls straight through, no error/hang | unit |

**Assumptions:**
The single call site for `sessionMiddleware` in `server.js`'s `router` function is the only place it's invoked (confirmed via `grep` before drafting this story) — the blast radius of making it `async` is exactly one `await` added at one call site, not a broader refactor across multiple routers/entry points.

**Estimated touch points:**
Files: `src/web-ui/adapters/session-redis.js` (new `readSession` method), `src/web-ui/middleware/session.js` (`sessionMiddleware` becomes async, gains the fallback branch), `src/web-ui/server.js` (one `await` added at the existing call site), a new test file `tests/check-srf-s1-session-redis-fallback.js`.
Services: Upstash Redis (read-only addition to an already-configured, already-written-to store — no new provisioning).
APIs: None (no new routes).
