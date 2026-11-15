## Story: Keep people signed in across deploys by storing the login token encrypted

**Epic reference:** None - short-track (bounded change to one adapter, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: every deploy this session (about six) signed the operator out and blocked work until they signed in again; `artefacts/2026-07-22-session-redis-fallback/decisions.md` records the earlier decision to keep the token out of Redis and says to revisit it "if this recurs and becomes a real operational problem".
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [web-ui]

## User Story

As **a signed-in person using the platform (and the operator checking a deploy in a browser)**,
I want **my login to survive a deploy**,
So that **I am not sent back to sign in after every release, and live checks of a deploy are not blocked on a fresh sign-in**.

## Benefit Linkage

**Metric moved:** None formal - short-track convention. Removes the sign-out after every deploy; makes post-deploy live checks possible without the operator re-authenticating each time.
**How:** sessions already survive in Upstash Redis, but `accessToken` (the GitHub login token) is deliberately stripped before the write (decision of 2026-07-22, srf-s1), so a restored session has an identity but no token and `authGuard` treats it as signed out. The operator has now chosen to change that decision: store the token in Redis **encrypted**, so the third-party store only ever holds ciphertext.

## Operator decision (2026-11-16)

Chosen over silent re-login via GitHub and over storing in Postgres: "Encrypt token in Redis". This is a deliberate change of security posture and supersedes the token-stripping rule in `artefacts/2026-07-22-session-redis-fallback/decisions.md` for this one field, only when an encryption key is configured.

## Architecture Constraints

- **Algorithm and key.** AES-256-GCM with a random 12-byte nonce per write. The key comes from a new environment variable `SESSION_ENCRYPTION_KEY` (32 bytes, base64). It is a separate secret from `SESSION_SECRET`. The operator sets it; it is never pasted into chat, logged or committed.
- **Bound to the session.** The session id is the GCM additional authenticated data, so a ciphertext copied to another session fails to decrypt.
- **Stored shape.** The Redis value carries `accessTokenEnc` (a versioned string `v1.<nonce>.<tag>.<ciphertext>`, base64url parts) and never a plaintext `accessToken`. On read the adapter decrypts back to `accessToken` on the returned data.
- **Fail safe, never fail open.** No key configured, an invalid key (wrong length), a wrong or rotated key, corrupt or tampered ciphertext, or an unknown version: the session is restored without a token (signed out), exactly as today. Nothing throws and nothing is logged beyond a single non-secret line.
- **No key configured means today's behaviour exactly:** the token is stripped, one warning line at startup, so staging and local development are unchanged until the secret is set.
- **Where the change lives.** The adapter `src/web-ui/adapters/session-redis.js` (encrypt on `writeSession`, decrypt on `readSession` and `loadAllSessions`), a new small module `src/web-ui/utils/token-crypto.js` (encrypt, decrypt, key loading), and `src/web-ui/middleware/session.js` (`persistSession` stops stripping the token itself and hands the adapter the full session; the adapter is now the single place that decides). Logout and session destruction still delete the Redis key.
- **TTL unchanged:** 24 hours from the last write.
- **Existing tests that pin "token never written to Redis"** (`tests/check-p3.2-redis-session-adapter.js` AC2 and `tests/check-srf-s1-session-redis-fallback.js` AC4, plus any others found by the audit) are updated to the new rule: a plaintext token is never written; with no key the token is absent; with a key it is present only as ciphertext. No other expectation changes.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-009 (server-side session storage, HttpOnly cookie) kept; ADR-011 (artefact-first) satisfied by this chain; ADR-025 (tenant isolation) not engaged. The change to the token-at-rest rule is recorded in `decisions.md` and should be added as a repo-level ADR note at DoD.
- **Injectable adapter rule (D37):** the Redis adapter is already wired in `server.js`; a wiring test asserts behaviour (a real encrypt, store, restore round trip through the wired adapter shape), not only that a function was assigned.
- **Zero new npm dependencies** (Node's built-in `crypto`).

## Dependencies

- **Upstream:** srf-s1 and p3.2 (the existing Redis session adapter and fallback). Merged.
- **Operator action before the live check:** set `SESSION_ENCRYPTION_KEY` as a Fly secret on staging and production (the operator generates and sets it; the agent never sees it).
- **Related:** none blocking.

## Acceptance Criteria

**AC1:** Given a configured key and a session with an `accessToken`, When it is written to Redis, Then the stored value contains `accessTokenEnc` and contains no plaintext `accessToken`, and the token's text appears nowhere in the stored value.

**AC2:** Given a stored session written under AC1, When it is read (single read and the startup load-all), Then the returned data has `accessToken` equal to the original, and every other field is restored as before.

**AC3:** Given a ciphertext written for session A, When it is placed under session B's id and read, Then no token is returned (the session id is bound).

**AC4:** Given a wrong key, a corrupt or truncated ciphertext, a tampered tag, an unknown version, or an invalid-length key, When the session is read, Then it is restored without a token, nothing throws, and the other fields are intact.

**AC5:** Given no key configured, When a session with a token is written, Then the stored value has neither `accessToken` nor `accessTokenEnc` (today's behaviour), and a single warning line is logged at startup.

**AC6:** Given the real `sessionMiddleware` and a recording Redis double, When a user logs in, the process "restarts" (the in-memory map is cleared) and a request arrives with the same cookie, Then `req.session.accessToken` is present and the real `authGuard` lets the request through; and with no key it still redirects to sign in (today's behaviour).

**AC7:** Given a signed-in session, When the user logs out (`destroySession`), Then the Redis key is deleted and a later request with the old cookie is signed out.

**AC8:** Given the existing tests that pinned token stripping, When updated to the new rule, Then they pass and assert the new rule (no plaintext token ever; ciphertext only with a key).

**AC9 (live, after the secret is set and two deploys):** Given the operator signs in to production on a deploy that contains this change and the secret is set, When a later deploy completes, Then the operator is still signed in on the next page load (no sign-in prompt). Evidence class `production-observed`.

## Out of Scope

- Removing the 24-hour expiry or adding "remember me".
- Storing any provider other than the GitHub login token (no refresh tokens are held today).
- Rotating the key without signing people out (rotation signs everyone out; acceptable and documented).
- Moving sessions out of in-memory first-read (the in-memory map stays the primary read path).
- Any change to how the OAuth login itself works.

## NFRs

- **Security:** plaintext token never leaves the process; ciphertext authenticated (GCM) and bound to the session id; the key never logged, never committed, never in an error message; a token never appears in any log line.
- **Reliability:** a decrypt failure signs the person out (the safe state), never errors the request; Redis outage behaviour unchanged.
- **Performance:** one AES-GCM operation per session write and per rehydration; negligible.

## Complexity Rating

**Rating:** 2 - small code, but a security-posture change touching the login path and several existing tests.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified
- [ ] Human oversight level confirmed from parent epic - N/A, short-track; operator decision recorded above
