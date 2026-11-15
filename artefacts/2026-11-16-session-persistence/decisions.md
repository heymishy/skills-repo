# Decisions: keep people signed in across deploys

**2026-11-16 | FINDING | Every deploy signs everyone out because the login token is never persisted**
**Evidence:** about six deploys in one working session each required the operator to sign in again before a live check could run. `src/web-ui/middleware/session.js` already restores sessions from Upstash Redis after a restart, but strips `accessToken` before writing (`_sanitiseForRedis`, and again in `session-redis.js` `_sanitise`), so a restored session has `login` and `userId` but no token and `authGuard` treats it as signed out. The strip was an operator decision on 2026-07-22 (`artefacts/2026-07-22-session-redis-fallback/decisions.md`): "a live GitHub token is never cached in the third-party-managed Upstash instance", with a note to revisit if it became a real operational problem.

**2026-11-16 | DECISION (operator) | Store the token encrypted in Redis**
**Options shown:** encrypt the token in the existing Redis; silent re-login through GitHub OAuth (no stored token); store encrypted in Postgres; change nothing.
**Decision:** encrypt in Redis. Operator answer, 2026-11-16: "Encrypt token in Redis (Recommended)".
**Rationale:** smallest change that fixes it fully; the third party only ever holds ciphertext; silent re-login still needs a GitHub round trip and does not help when GitHub itself asks to sign in; Postgres needs a new table and migration for the same encryption.
**Accepted cost and risks:** a live token (encrypted) now exists in a third-party store; key rotation signs everyone out once; the operator must set a new Fly secret on staging and production. Mitigations: AES-256-GCM with a per-write random nonce, session id bound as additional authenticated data (a ciphertext cannot be moved to another session), a key separate from `SESSION_SECRET`, fail-safe to signed out on any problem, the existing 24-hour TTL, no behaviour change at all until the secret is set.

**2026-11-16 | ARCH | The adapter becomes the single place that decides what reaches Redis**
**Context:** the token was stripped in two places (`session.js` and `session-redis.js`), so encrypting in one would still lose it in the other.
**Decision (as built, refining the plan):** `persistSession` keeps handing the adapter a sanitised session-data object (no token) and passes the token as a separate third argument, `writeSession(id, data, accessToken)`; the adapter encrypts it or drops it. The plan had been to pass the full session and edit the existing tests that pinned token stripping; passing the token separately keeps `_sanitiseForRedis` and those tests (lab-s1.3 NFR1, p3.2 AC2, srf-s1 AC4) true unchanged, so only one test label was edited (p3.2 AC2's title). The adapter also never trusts a plaintext `accessToken` read back from Redis.
**Follow-up at DoD:** record the changed token-at-rest rule as a repo-level ADR note in `.github/architecture-guardrails.md`.
