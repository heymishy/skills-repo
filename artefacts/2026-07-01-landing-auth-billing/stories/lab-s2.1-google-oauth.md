# Story lab-s2.1 — Google OAuth — second auth provider

**Feature:** 2026-07-01-landing-auth-billing
**Epic:** lab-e2-providers-onboarding
**Discovery:** artefacts/2026-07-01-landing-auth-billing/discovery.md
**Benefit-metric:** artefacts/2026-07-01-landing-auth-billing/benefit-metric.md
**Status:** Definition
**Complexity:** 2
**Scope stability:** Stable

## User story

As a new visitor / prospective user,
I want to sign up or log in using my Google account,
So that I am not required to have a GitHub account to use the platform.

## Metric linkage

- **M1** (Self-serve signup conversion, benefit-metric.md §M1): Google OAuth widens the addressable signup population beyond GitHub users. Users who complete Google OAuth contribute to the PostHog `auth_completed` funnel event.

## Acceptance criteria

**AC1** — `GET /auth/google` redirects to Google OAuth authorisation URL
Given an unauthenticated user navigates to `/auth/google`,
When the server handles the request,
Then the response is a 302 redirect to Google's OAuth 2.0 authorisation endpoint (`https://accounts.google.com/o/oauth2/v2/auth`) with correct `client_id`, `redirect_uri`, `scope` (at minimum `openid email`), `response_type=code`, and a random `state` CSRF parameter stored in the session.

**AC2** — Google OAuth callback validates state and exchanges code for tokens
Given Google redirects back to `/auth/google/callback` with a `code` and matching `state`,
When the callback handler runs,
Then the CSRF state is validated (mismatch returns 403), the `code` is exchanged for a Google access token, and the user's Google identity (`sub` as `userId`, `email` as `login`) is retrieved from the Google userinfo endpoint.

**AC3** — Session is created with correct fields after Google OAuth
Given Google OAuth completes successfully (AC2),
When the session is inspected,
Then `req.session.accessToken` contains the Google access token, `req.session.userId` contains the Google `sub` (numeric or string ID), `req.session.tenantId` is set (same derivation logic as GitHub — email login if no org allowlist), and `req.session.login` contains the user's email.

**AC4** — `rotateSessionId` is called after Google OAuth login
Given a user completes Google OAuth,
When the callback handler finishes populating the session,
Then `rotateSessionId` is called and a new `Set-Cookie: session_id=<new-id>` header is sent — preventing session fixation attacks.

**AC5** — Google provider is available in the auth chooser UI
Given a user is on the landing page or sign-in page,
When the page is rendered,
Then a "Continue with Google" button or link is visible alongside the GitHub option.

**AC6** — Existing GitHub OAuth flow is not broken by Google provider addition
Given a user initiates auth via `/auth/github`,
When the GitHub OAuth flow completes,
Then the result is identical to before this story was merged — correct session fields, `rotateSessionId` called, redirect to `/dashboard` or `/welcome`.

**AC7** — Google OAuth state parameter is CSRF-protected identically to GitHub
Given a callback arrives with a `state` that does not match the session `oauthState`,
When the callback handler evaluates the state,
Then the response is 403 with no token stored in the session, and `oauth_state_mismatch` is audit-logged.

## Out of scope

- Email/password auth (lab-s2.2)
- The /welcome onboarding flow (lab-s2.3)
- Google Workspace-specific org/domain restrictions
- Sign-in-with-Apple or Microsoft OAuth
- Google token refresh (access token is sufficient for MVP — no refresh token handling)

## Dependencies

- **lab-s1.3 must be complete** — Google OAuth is added to the provider registry established by s1.3. Blocked until s1.3 is merged.
- Google OAuth App credentials: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` must be set as environment variables (not committed).

## Implementation touchpoints

- `src/web-ui/auth/oauth-adapter.js` or equivalent provider registry (modified): add Google provider config
- `src/web-ui/routes/auth.js` or provider-specific route file (new/modified): `handleAuthGoogle` and `handleAuthGoogleCallback` handlers
- `src/web-ui/server.js` (modified): register `/auth/google` and `/auth/google/callback` routes; wire Google provider adapter
- `src/web-ui/templates/` (modified): add "Continue with Google" button to auth chooser UI

## Architecture Constraints

- **sec-perf**: `rotateSessionId` MUST be called after Google OAuth callback (CLAUDE.md). Enforced by AC4.
- **`req.session.accessToken` canonical field (CLAUDE.md)**: Google access token stored as `req.session.accessToken` — not `req.session.googleToken` or any other field name.
- **CSRF state parameter is mandatory (ADR-012 / auth.js comment)**: Google OAuth callback must validate the state parameter identically to GitHub. AC7 enforces this.
- **CJS-only (Style Guide)**: New Google provider code uses `require()`/`module.exports` (or ESM if Path B was chosen in s1.1 spike).

## NFRs

- **No credentials committed**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` must never appear in committed code. Fly.io secrets only.
- **Audit log**: `login` event must be emitted on successful Google OAuth (same as GitHub — `_logger.info('login', { userId, timestamp })`) with no token value in the log.

## Test

Node.js tests: `tests/check-lab-s2.1-google-oauth.js` (new) — verify (1) `GET /auth/google` builds correct Google redirect URL with `state` stored in session, (2) callback validates state mismatch → 403, (3) successful callback sets `req.session.accessToken`, `userId`, `login`, `tenantId`, (4) `rotateSessionId` called after success, (5) GitHub flow unchanged (AC6 regression check). Monkeypatch the Google userinfo fetch call.
