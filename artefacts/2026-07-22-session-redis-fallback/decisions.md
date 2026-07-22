# Decisions: Session Redis Fallback

## SCOPE — Redis fallback for pre-login state only, not accessToken (2026-07-22)

**Context:** Operator reported two symptoms: (1) GitHub OAuth callback occasionally returning "Forbidden," requiring a manual retry; (2) mid-product-creation-flow session loss redirecting to GitHub auth and losing edits. Investigation found the shared architectural root cause: `session.js`'s `_sessions` store is an in-memory `Map`, with Redis used only as a write-behind backup — `loadSessionsFromRedis()` runs once at server boot, never per-request. Any process replacement (a deploy — three of which happened during this exact session while the operator was live-testing) wipes the in-memory Map; only a fresh server boot reloads from Redis.

**Decision:** Add a per-request Redis fallback to `sessionMiddleware` on an in-memory cache miss — but explicitly do NOT extend this to `accessToken`, which both `session.js` and `session-redis.js` deliberately strip before writing to Redis (a live GitHub token is never cached in the third-party-managed Upstash instance).

**Rationale:** This fixes symptom (1) fully — the OAuth CSRF `oauthState` value is written and persisted to Redis *before* the token even exists, so it survives a rehydration cleanly. It does NOT fix symptom (2) — `authGuard` gates on `accessToken` specifically, and restoring that via Redis would mean accepting a real security-posture change (a live token in a third-party cache) rather than a contained bug fix. The operator was asked directly and chose the safer, contained scope: fix (1) now, leave (2) as an explicitly documented, undressed gap.

**Source:** Operator instruction, this session, 2026-07-22: "Harden session lookup to fall back to Redis per-request" (chosen after being shown the accessToken tradeoff explicitly).

---

## IMPLEMENTATION — srf-s1 build summary (2026-07-22)

**What was built:**
- `readSession(id)` added to `session-redis.js` — a fourth method alongside the existing `writeSession`/`deleteSession`/`loadAllSessions`.
- `sessionMiddleware` (`session.js`) changed from sync to `async`: on an in-memory cache miss with a cookie-supplied session ID, attempts a Redis read; on a hit, rehydrates into the in-memory Map under the same ID and uses it (no new `Set-Cookie`); on a miss (or no Redis configured, or no cookie at all), falls straight through to creating a new session exactly as before.
- Single call site (`server.js`'s `router` function) updated to `await sessionMiddleware(req, res)`.

**Test result:** New file `tests/check-srf-s1-session-redis-fallback.js` — 7/7 passing, covering AC1-AC5 (including a direct reproduction of the reported OAuth-callback bug: `handleAuthGithub` → simulated in-memory clear → `handleAuthCallback`, confirming no false-positive 403). Existing session-related suites re-verified: `check-p3.2-redis-session-adapter.js` (17/17), `check-p1.2-tenant-session-journey.js` (12/12), `check-wsm1-session-persistence.js` (23/23), `check-wuce1-oauth-flow.js` (48/48), `check-s0.2-resume-existing-session.js` (12/12) all clean. Three pre-existing, already-documented baseline failures (`check-sec5-session-rotation.js`, `check-sec3-return-to.js`, `check-s0.2-tenant-login-fallback.js`) confirmed unchanged in both count and shape — not newly broken or newly fixed by this change. Full 361-file suite: 37 failed, identical to the established baseline.

**Verification:** Deployed to `wuce-staging`, clean boot confirmed via logs (no errors, server listening, all migrations ready).

**Known, accepted remaining gap:** The mid-product-creation-flow session loss (symptom 2) is NOT fixed by this story — `accessToken` remains absent after a Redis rehydration, by design, so `authGuard`-protected routes will still correctly require a fresh login if the in-memory session was lost. If this recurs and becomes a real operational problem (not just a byproduct of this session's own repeated redeploys during live testing), the tradeoff of caching `accessToken` in Redis would need to be revisited as its own, explicitly-scoped decision — not silently expanded into by this story.
