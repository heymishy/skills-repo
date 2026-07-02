# Story lab-s1.3 — Multi-provider auth registry (GitHub primary)

**Feature:** 2026-07-01-landing-auth-billing
**Epic:** lab-e1-foundation
**Discovery:** artefacts/2026-07-01-landing-auth-billing/discovery.md
**Benefit-metric:** artefacts/2026-07-01-landing-auth-billing/benefit-metric.md
**Status:** Definition
**Complexity:** 3
**Scope stability:** Stable — implementation approach depends on spike (lab-s1.1) outcome; ACs are approach-agnostic

## User story

As a new visitor / prospective user,
I want to choose from multiple auth providers when signing up or logging in,
So that I am not locked into GitHub as the only way to access the platform.

## Metric linkage

- **M1** (Self-serve signup conversion, benefit-metric.md §M1): Multi-provider auth is the mechanism that allows the `auth_completed` PostHog funnel event to fire across all provider types. Without it, the funnel is GitHub-only.
- **M2** (Credits enforcement, benefit-metric.md §M2): A valid `tenantId` on the session is required before credits can be looked up. This story establishes the session shape that billing reads from.

## Acceptance criteria

**AC1** — GitHub OAuth continues to work after the provider registry is introduced
Given a user initiates auth via `/auth/github`,
When they complete the GitHub OAuth flow,
Then they are redirected to `/dashboard` (or `/welcome` on first login) with a valid session containing `req.session.accessToken`, `req.session.userId`, and `req.session.tenantId`.

**AC2** — `rotateSessionId` is called after every successful provider login
Given any supported auth provider completes successfully (GitHub in this story),
When the auth callback handler runs,
Then `rotateSessionId` is called with the pre-login session ID, the current session data is copied to the new session ID, and a new `Set-Cookie: session_id=<new-id>` header is sent — preventing session fixation attacks (sec-perf AC5).

**AC3** — Session schema migration decision is documented and enforced at story level
Given this story introduces a provider registry (Path A or B: Better Auth; Path C: extended oauth-adapter),
When the auth provider registry is deployed,
Then existing pre-migration sessions require the user to re-authenticate after the registry is deployed — no session that was valid before the deploy is automatically valid after, without the user logging in again via a provider. Verified by: attempting to use a pre-deploy session cookie after deploy returns 302 to `/` (authGuard rejects it).

**AC4** — `authGuard` correctly identifies authenticated sessions regardless of provider
Given the provider registry is in place,
When `authGuard` evaluates a request,
Then it reads `req.session.accessToken` (canonical field — CLAUDE.md) and allows or denies access identically for sessions created by any supported provider.

**AC5** — Provider adapter is injectable (D37 rule)
Given the provider registry introduces a provider-fetch adapter (e.g. `getUserIdentity`, `exchangeCode`),
When `setProviderAdapter()` is called in tests,
Then the test adapter is used; the default stub throws `Error('Adapter not wired: <name>. Call set<Name>() before use.')` so misconfiguration is immediately visible.

**AC6** — Provider registry wiring is verified in `server.js`
Given the production server starts,
When `server.js` initialises the auth module,
Then the real provider implementations are wired via the setter functions (not the throwing stubs), and a startup log message confirms provider registry initialised.

**AC7** — No regression on existing `check-wuce1-oauth-flow.js` tests
Given the provider registry replaces or wraps `oauth-adapter.js`,
When `node tests/check-wuce1-oauth-flow.js` is run,
Then all tests pass — zero new failures introduced.

## Out of scope

- Google OAuth or email/password providers (those are lab-s2.1 and lab-s2.2)
- The `/welcome` onboarding flow (lab-s2.3)
- Stripe integration or billing (lab-e3 epic)
- Migrating any existing session data (no existing beta users per ARCH-003)

## Dependencies

- **lab-s1.1 must be complete** and spike outcome document must contain the path recommendation before implementation begins. This story is BLOCKED until spike AC5 is met (decisions.md ARCH-002 updated).
- Existing `oauth-adapter.js`, `session.js`, `auth.js` in `src/web-ui/`

## Implementation touchpoints

- `src/web-ui/auth/oauth-adapter.js` (modified or replaced): extended/replaced to support provider registry pattern
- `src/web-ui/routes/auth.js` (modified): updated to call provider registry; `rotateSessionId` already present from sec-perf
- `src/web-ui/server.js` (modified): production wiring for the new provider registry (D37 AC requirement)
- If Path A/B: Better Auth tables in Neon (`user`, `session`, `account`) — migration script required
- `artefacts/2026-07-01-landing-auth-billing/decisions.md`: update ARCH-002 with final chosen path

## Architecture Constraints

- **sec-perf**: `rotateSessionId` MUST be called after every provider login callback (CLAUDE.md §Session fixation). This is enforced by AC2.
- **D37 (Injectable adapter rule, CLAUDE.md)**: Any new provider adapter introduced MUST have a throwing stub as the default (not a silent no-op). Production wiring MUST be a separate task in the implementation plan and a separate AC (AC6) in this story.
- **`req.session.accessToken` canonical field (CLAUDE.md)**: `authGuard` and all route handlers MUST read `req.session.accessToken`. Never `req.session.token`.
- **CJS-only (Style Guide)**: If Path C is chosen, all new code uses `require()`/`module.exports`. If Path A is chosen, dynamic `import()` is the only ESM boundary. If Path B is chosen, `"type": "module"` is added to `package.json` as the first commit of this story.
- **ADR-011 (Artefact-first)**: Any new `src/` module introduced by this story is covered by this story artefact.
- **CLAUDE.md B1/D1 — DoR contract must not contradict test plan**: The DoR contract for this story must NOT exclude `server.js` if the test plan requires verifying production wiring (AC6 requires this). The contract must list `server.js` as a required touchpoint.

## NFRs

- **No `accessToken` in Redis**: `_sanitiseForRedis` in `session.js` strips `accessToken` before writing to Redis. This must remain unchanged after the provider registry is introduced.
- **No credentials committed**: GitHub Client ID, Client Secret, and any Better Auth secrets must appear only as environment variables, never in committed code.
- **Session rotation after login**: The `rotateSessionId` test suite (`tests/check-sec5-session-rotation.js`) must continue to pass.

## Test

Node.js tests: `tests/check-lab-s1.3-provider-registry.js` (new) — verify (1) GitHub OAuth happy path end-to-end (AC1), (2) `rotateSessionId` called after callback (AC2), (3) default adapter stubs throw (AC5), (4) `authGuard` uses `req.session.accessToken` (AC4). Regression: `node tests/check-wuce1-oauth-flow.js` must pass (AC7) and `node tests/check-sec5-session-rotation.js` must pass.
