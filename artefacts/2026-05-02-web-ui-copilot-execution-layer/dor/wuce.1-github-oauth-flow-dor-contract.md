# Contract Proposal: GitHub OAuth flow and session establishment

**Story:** wuce.1
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-02

---

## Components built by this story

- Express route handler: `GET /auth/github` — redirects to GitHub OAuth authorisation URL with state parameter
- Express route handler: `GET /auth/github/callback` — receives code + state, validates CSRF state, exchanges code for access token, stores token in HttpOnly session cookie, redirects to dashboard
- Express route handler: `GET /auth/logout` — clears session cookie and redirects to login page
- Session middleware configuration (express-session or equivalent): HttpOnly, Secure, SameSite=Strict
- Auth adapter module: `src/adapters/github-auth.js` — `exchangeCodeForToken(code, clientId, clientSecret)`, `getUserIdentity(token)` — standalone, no inline GitHub API calls in route handler
- CSRF state parameter generation and validation (crypto.randomBytes, stored in session)
- Environment variable loading: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SESSION_SECRET`, `GITHUB_OAUTH_CALLBACK_URL`
- Audit log entries: login attempt, login success, login failure (CSRF mismatch), logout
- Test fixtures: `tests/fixtures/github/oauth-token-exchange-success.json`, `tests/fixtures/github/oauth-token-exchange-error.json`, `tests/fixtures/github/user-identity.json`

## Components NOT built by this story

- Artefact read/render layer (wuce.2)
- Sign-off or write operations (wuce.3)
- Docker container or deployment configuration (wuce.4)
- Frontend HTML/CSS beyond the minimum needed to redirect/render error messages
- SAML enterprise SSO integration (out of scope — Phase 1 GitHub.com OAuth only)
- Non-GitHub IdP support (Bitbucket, Azure AD) — out of scope
- OAuth token refresh — out of scope for Phase 1

## AC → Test mapping

| AC | Description | Tests |
|----|-------------|-------|
| AC1 | OAuth redirect includes state param | `GET /auth/github returns 302 with state in redirect URL`, `state param is cryptographically random` |
| AC2 | Token exchange + server-side session | `valid callback stores token in HttpOnly cookie`, `user identity fetched and stored in session`, `token exchange calls auth adapter not inline GitHub API` |
| AC3 | CSRF state mismatch → 403 | `missing state param → 403`, `mismatched state param → 403`, `replayed state → 403` |
| AC4 | Enterprise SAML redirect handled | `GITHUB_API_BASE_URL pointing to GHE redirects OAuth to correct base URL` |
| AC5 | Session expiry redirects to login | `expired session cookie on protected route → redirect to /auth/github`, `clear cookie on logout → redirect` |

## Assumptions

- GitHub OAuth App credentials (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`) are provided via environment variables before server start
- The server is deployed behind HTTPS (cookie Secure flag enforced) — HTTP-only development mode is acceptable for local testing with `NODE_ENV=development`
- `express-session` (or equivalent) is the session management library; session secret from `SESSION_SECRET` env var

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/routes/auth.js` | Create | OAuth route handlers (redirect, callback, logout) |
| `src/adapters/github-auth.js` | Create | Token exchange and user identity adapter |
| `src/middleware/session.js` | Create | Session middleware config |
| `src/app.js` | Create or extend | Express app entry point; mount auth routes |
| `tests/auth.test.js` | Create | 18 Jest tests for wuce.1 |
| `tests/fixtures/github/oauth-token-exchange-success.json` | Create | Fixture for token exchange success |
| `tests/fixtures/github/oauth-token-exchange-error.json` | Create | Fixture for token exchange error |
| `tests/fixtures/github/user-identity.json` | Create | Fixture for user identity response |

## Contract review

**APPROVED** — all components are within story scope, AC → test mapping is complete, no scope boundary violations identified.
