# Story: Session middleware falls back to Redis on an in-memory cache miss, fixing OAuth-callback "Forbidden" after a redeploy

**Epic reference:** None — short-track (per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`).
**Discovery reference:** None — short-track skips discovery; root cause confirmed by direct architecture review this session.
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below.

## Background

The operator reported: "new github log ins, the callback url redirects to forbidden, but then I manually point to url again and logged in." Investigation of `src/web-ui/middleware/session.js` found the root cause: sessions are stored in an in-memory `Map` (`_sessions`), with Redis (Upstash, confirmed configured on `wuce-staging`) used only as a write-behind backup — `persistSession()` writes to Redis on every session mutation, but `loadSessionsFromRedis()` is only ever called **once, at server process startup** (`server.js`). The per-request `sessionMiddleware` checks the in-memory Map exclusively and never queries Redis on a cache miss.

`GET /auth/github` writes a CSRF `oauthState` value into the session and calls `persistSession()` immediately (comment: "so it survives across the external redirect") — but if the in-memory Map loses that session before the callback arrives (any process replacement: a deploy, a crash-restart, or a manual redeploy — exactly what happened repeatedly during this session's own staging deploys), `GET /auth/github/callback` looks up a session with no `oauthState`, the CSRF check fails, and the user sees a 403 "Forbidden" page — even though the state value was safely sitting in Redis the whole time, unread.

A separate, related symptom (mid-product-creation flow bouncing to GitHub auth, losing the operator's edits) has the same *contributing* architecture but is **not** fixed by this story — `authGuard` gates on `req.session.accessToken` specifically, and both `session.js` and `session-redis.js` deliberately strip `accessToken` before writing to Redis (a live GitHub token is never cached in the third-party-managed Redis instance). Restoring that field too is a real security-posture change, explicitly declined by the operator for this story (see decisions.md) — that failure mode remains a known, documented gap.

## User Story

As **an operator or user completing the GitHub OAuth login flow**,
I want **the session my login flow depends on (specifically, the CSRF state written just before redirecting to GitHub) to survive even if the server process was replaced while I was on GitHub's authorization page**,
So that **I don't hit an unexplained "Forbidden" page and have to manually retry — the callback succeeds on the first attempt using the same session data that was already safely persisted to Redis**.

## Benefit Linkage

**Metric moved:** Login flow reliability — directly observed failure this session, reproducible any time a deploy (or process restart) happens to land in the ~10-30 second window between a user starting the GitHub OAuth redirect and completing authorization on GitHub's side.
**How:** Removing this failure mode means operators/users are not blocked from logging in by an environment-timing coincidence outside their control, and do not need to understand or work around an internal implementation detail (in-memory session loss) to retry successfully.

## Architecture Constraints

- Checked against `.github/architecture-guardrails.md` — no conflicting ADR found. Session cookie security config (`SESSION_COOKIE_CONFIG`, ADR-009) is unchanged.
- **Explicit scope boundary (operator-confirmed):** `accessToken` remains excluded from Redis persistence — this story does not change that. `authGuard`-protected routes continue to require a fresh, in-memory-present `accessToken`; a session rehydrated from Redis after a cache miss will have `oauthState`/`userId`/`login`/etc. restored but `accessToken` will remain absent until a fresh login completes. This is a deliberate, named limitation, not an oversight.
- `sessionMiddleware` changes from a synchronous to an `async` function. Confirmed single call site (`server.js`'s `router` function, already `async`) — the blast radius is one `await` added at one call site, not a broader refactor.

## Dependencies

- **Upstream:** None — modifies existing, already-merged session/Redis infrastructure (`session.js`, `session-redis.js`, both pre-dating this story).
- **Downstream:** None yet.

## Acceptance Criteria

**AC1 (Redis fallback on cache miss):** Given a valid `session_id` cookie whose session is absent from the in-memory `_sessions` Map (simulating a post-redeploy cache miss) but present in Redis, When `sessionMiddleware` runs, Then the session data is read from Redis, rehydrated into the in-memory Map under the same session ID, and used as `req.session`/`req.sessionId` for that request — no new session is created and no new `Set-Cookie` header is sent (the existing cookie remains valid).

**AC2 (genuine cache miss still creates a new session):** Given a `session_id` cookie (or no cookie at all) whose session exists in neither the in-memory Map nor Redis, When `sessionMiddleware` runs, Then a brand-new session is created and a `Set-Cookie` header is sent, exactly as today — this story does not change behavior for a genuine first-time visitor or an expired/never-existed session.

**AC3 (OAuth callback survives a simulated mid-flow process replacement):** Given `GET /auth/github` was called (writing `oauthState` and persisting to Redis) and the in-memory session is then cleared (simulating a redeploy) before `GET /auth/github/callback` arrives with the matching `state` query parameter, When the callback runs, Then the CSRF state check passes (no false-positive 403) and the login flow proceeds normally.

**AC4 (accessToken is honestly absent after rehydration, not fabricated):** Given a session is rehydrated from Redis via AC1, When any code reads `req.session.accessToken` afterward, Then it is `undefined` (matching Redis's existing, unchanged `_sanitise`/`_sanitiseForRedis` stripping behavior) — never a stale or fabricated value. `authGuard`-protected routes continue to correctly redirect to `/` for a rehydrated session lacking a real token, exactly as they would for any session missing `accessToken` today.

**AC5 (no Redis configured, behavior unchanged):** Given Redis is not configured (`UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` unset, matching this repo's local-dev/test default), When `sessionMiddleware` runs on any in-memory cache miss, Then it falls straight through to creating a new session exactly as it does today — no error, no hang, no behavior change for environments without Redis configured.

## Out of Scope

- Caching `accessToken` (or any other currently-stripped field) in Redis — an explicit, named, operator-declined scope boundary for this story (see Architecture Constraints and decisions.md).
- Fixing the mid-product-creation-flow session loss for already-authenticated users — remains a known, documented gap requiring either the `accessToken`-caching tradeoff (declined) or a separate UX-only mitigation (not scoped here).
- Any change to `SESSION_COOKIE_CONFIG`, cookie expiry, or `rotateSessionId`'s own logic — untouched.
- Any change to how `persistSession`/`loadSessionsFromRedis` are invoked at startup — untouched; this story only adds a new per-request read path.

## NFRs

- **Performance:** Redis fallback only fires on an in-memory cache miss (the rare case) — the common case (session already in memory) has zero added latency, no new Redis call.
- **Security:** No new data is sent to Redis beyond what `persistSession` already writes today (same `_sanitiseForRedis`/`_sanitise` stripping applies unchanged). `SESSION_COOKIE_CONFIG` (HttpOnly/Secure/SameSite=Strict) is untouched.
- **Resilience:** This is itself a resilience improvement — reduces the blast radius of a mid-flow process replacement (deploy, crash-restart) on the login flow specifically.
- **Accessibility:** N/A — no UI surface.

## Complexity Rating

**Rating:** 1 — well understood, root cause fully diagnosed via direct code inspection, fix is a narrow, single-call-site addition (Redis read on cache miss) to an existing, already-proven Redis-adapter interface (`writeSession`/`deleteSession`/`loadAllSessions` already exist; this adds a natural fourth method, `readSession`).
**Scope stability:** Stable — explicitly bounded away from the harder `accessToken`-caching problem.

## Definition of Ready Pre-check

<!-- Filled in by /definition-of-ready -->

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
