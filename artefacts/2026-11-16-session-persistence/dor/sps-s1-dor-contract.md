# Contract Proposal - Keep people signed in across deploys by storing the login token encrypted

**What will be built:**
- `src/web-ui/utils/token-crypto.js` (new): `loadKey(env)` (base64, must decode to exactly 32 bytes, else null), `encrypt(token, sessionId, key)` returning `v1.<nonce>.<tag>.<ciphertext>` (AES-256-GCM, random 12-byte nonce, session id as additional authenticated data), `decrypt(value, sessionId, key)` returning the token or null. Never throws, never logs.
- `src/web-ui/adapters/session-redis.js`: `writeSession` encrypts `accessToken` into `accessTokenEnc` when a key is configured and otherwise strips it; `readSession` and `loadAllSessions` decrypt back to `accessToken` (or leave it absent on any failure); one startup warning line when no key is configured; the plaintext token is never in the stored value.
- `src/web-ui/middleware/session.js`: `persistSession` hands the adapter the full session (the adapter is now the single place that decides); `_sanitiseForRedis` is removed or reduced to a no-op alias kept only if an existing test imports it.
- `.env.example`: a commented `SESSION_ENCRYPTION_KEY` line with generation instructions (no value).
- `tests/check-sps-s1-encrypted-session-token.js` (new, T1 to T8 and T6a, T6b, T7) and the edited existing tests listed in the test plan.

**What will NOT be built:**
- No change to OAuth login, `authGuard`, cookie settings, the 24-hour TTL, or tenant isolation; no new npm dependency; no storage in Postgres; no silent re-login; no key rotation tooling; no change to skill-session Redis storage (`skill-session-redis.js`, which already never holds the token).

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1 | unit |
| AC2 | T2 | unit |
| AC3 | T3 | unit |
| AC4 | T4 | unit |
| AC5 | T5 | unit |
| AC6 | T6a, T6b (real middleware and `authGuard`, recording double) | integration |
| AC7 | T7 | integration |
| AC8 | edited existing tests and the full suite | regression |
| AC9 | Scenario 9 | live (production-observed) |

**Assumptions:** `session.js` currently strips the token before calling `adapter.writeSession`, and `session-redis.js` strips it again (both read: `session.js` `_sanitiseForRedis`, `session-redis.js` `_sanitise`); the adapter returns either a string or an object from `client.get` (handled today); `authGuard` gates on `req.session.accessToken` (stated in the srf-s1 decision record); Node's built-in `crypto` supports `aes-256-gcm` with additional authenticated data.

`schemaDepends: []`. **Estimated touch points:** Files: `src/web-ui/utils/token-crypto.js` (new), `src/web-ui/adapters/session-redis.js`, `src/web-ui/middleware/session.js`, `.env.example`, `tests/check-sps-s1-encrypted-session-token.js` (new), and the existing tests that pin stripping (`tests/check-p3.2-redis-session-adapter.js`, `tests/check-srf-s1-session-redis-fallback.js`, others only if the audit shows they assert it). Services: none (the operator sets one Fly secret). APIs: none.
