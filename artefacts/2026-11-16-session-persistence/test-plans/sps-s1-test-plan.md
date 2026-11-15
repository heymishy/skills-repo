## Test Plan: Keep people signed in across deploys by storing the login token encrypted

**Story reference:** artefacts/2026-11-16-session-persistence/stories/sps-s1-persist-login-across-deploys.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-sps-s1-encrypted-session-token.js`. It uses the real `src/web-ui/utils/token-crypto.js`, the real `src/web-ui/adapters/session-redis.js` (with a recording double in place of the `@upstash/redis` client, shaped from the real adapter's use of `client.set`, `client.get`, `client.del` and `client.scan`, read from `session-redis.js` and the srf-s1 test), the real `sessionMiddleware`, and the real `authGuard`. Existing tests that pinned token stripping are edited (AC8).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Stored value has `accessTokenEnc`, no plaintext token anywhere | 1 (T1) | - | - | - | - | 🟢 |
| AC2 | Read and load-all restore the token and all other fields | 1 (T2) | - | - | - | - | 🟢 |
| AC3 | Ciphertext bound to the session id | 1 (T3) | - | - | - | - | 🟢 |
| AC4 | Wrong key, corrupt, tampered, unknown version, bad key length: no token, no throw | 1 (T4, several inputs) | - | - | - | - | 🟢 |
| AC5 | No key: token stripped as today, one startup warning | 1 (T5) | - | - | - | - | 🟢 |
| AC6 | Real middleware and real `authGuard`: signed in after a simulated restart; signed out with no key | - | 2 (T6a with key, T6b without) | - | - | - | 🟢 |
| AC7 | Logout deletes the Redis key; old cookie signed out | - | 1 (T7) | - | - | - | 🟢 |
| AC8 | Existing token-stripping tests updated to the new rule and passing | - | existing tests (p3.2 AC2, srf-s1 AC4, others from the audit) edited | - | - | - | 🟢 |
| AC9 | Live: still signed in after a later deploy | - | - | - | 1 | Live-only | 🟡 |
| NFR | Key and token never appear in any log line or error message | 1 (T8) | - | - | - | - | 🟢 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Needs the deployed app, the secret set, and two deploys | AC9 | Live-only | Verification scenario 9; `production-observed` |
| The real Upstash service is not called in tests | AC1, AC2 | Environmental | The double mirrors the adapter's own use of the client (store a string with a TTL, return the string); one real write and read is part of AC9 |

No AC depends on CSS layout; no B2 classification needed.

## Test Data Strategy

**Source:** Synthetic. A fixed test key (generated in the test with `crypto.randomBytes(32)`, never a real secret), canary token strings (`gho_canary_<random>`) so a leak is detectable by searching the stored value and the captured log output. **PCI/sensitivity:** No real credentials. **Owner:** self-contained.

## Unit Tests (new file `tests/check-sps-s1-encrypted-session-token.js`)

- **T1 (AC1).** With a key, `writeSession('sid', { login:'u', tenantId:'t', accessToken: CANARY })`: the string handed to the client's `set` parses to an object with `accessTokenEnc` starting `v1.`, with `login` and `tenantId`, with no `accessToken` key; the canary text does not occur in that string; two writes of the same session produce different ciphertexts (random nonce); the TTL option is still 86400.
- **T2 (AC2).** After T1, `readSession('sid')` returns `accessToken === CANARY` and the other fields equal; `loadAllSessions()` returns the same for that session; neither returned object has `accessTokenEnc`.
- **T3 (AC3).** The stored value for session A is written under session B's key: `readSession('B')` returns the other fields and no `accessToken`.
- **T4 (AC4).** For each of: a different key, a ciphertext with one byte flipped, a truncated ciphertext, a changed tag, a `v2.` prefix, a key that decodes to 16 bytes, an empty key: `readSession` returns the non-token fields, no `accessToken`, and does not throw; `loadAllSessions` skips nothing and does not throw.
- **T5 (AC5).** With no key, the stored value has neither `accessToken` nor `accessTokenEnc`, and loading the module's key logic logs exactly one warning line (no secret in it).
- **T8 (NFR).** With console output captured across T1 to T4, the canary token, the key (base64 and raw) and any ciphertext part never appear in any log or error message.

## Integration Tests

- **T6a - restart survival with a key (AC6).** Real `sessionMiddleware` and the real Redis adapter over the recording double, key set: run a request to create a session, set `login`, `userId` and `accessToken` on it, `persistSession`; clear the in-memory map (`_clearForTesting`); a new request carrying the cookie rehydrates the session: `req.session.accessToken` equals the original, and the real `authGuard` calls the handler instead of redirecting. Fails today (token stripped, guard redirects).
- **T6b - no key (AC6).** Same sequence with no key: rehydrated session has `login` but no `accessToken`, and the real `authGuard` redirects to sign in (today's behaviour).
- **T7 - logout (AC7).** After T6a's login, `destroySession(id)`: the double's `del` was called with `session:<id>`; a request with the old cookie gets a new empty session and is signed out.

## Updated existing tests (AC8)

- `tests/check-p3.2-redis-session-adapter.js` AC2 ("accessToken never written to Redis"): becomes "a plaintext `accessToken` is never written; with no key neither field is written".
- `tests/check-srf-s1-session-redis-fallback.js` AC4 ("accessToken absent after rehydration"): runs with no key configured and keeps its assertion, with its comment updated; a companion assertion with a key is covered by T6a.
- Any other test found by the audit that asserts the stripping (`check-p3.3-persistence-survival.js`, `check-sec2-redis-scan.js`, `check-a4-session-store-state.js` are checked and edited only if they assert it).

## NFR Tests
- Security: T1, T3, T4, T8. Reliability: T4, T6b. Performance: none.

## Test Gaps and Risks
| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real Upstash behaviour (value size, string vs object return) | Not called in tests | The adapter already handles both string and object returns on read; AC9 live check exercises the real service |
| Key rotation signs everyone out | By design | Documented in the story and decisions |

**Total automated tests:** 9 new (T1, T2, T3, T4, T5, T6a, T6b, T7, T8) plus the edited existing tests.
