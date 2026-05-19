## Story: GitHub OAuth flow and authenticated session

**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e1-walking-skeleton.md
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md

## User Story

As a **business lead or non-technical stakeholder**,
I want to authenticate with my existing GitHub identity (supporting enterprise SAML/SSO federation),
So that I can access the pipeline web UI without any additional account creation, IT provisioning, or credential management.

## Benefit Linkage

**Metric moved:** M2 — Phase 1 stakeholder activation rate
**How:** Removing the credential barrier (no new account, no install, no terminal) is the primary activation pre-condition; a stakeholder who cannot authenticate in under 60 seconds will not activate within 30 days.

## Architecture Constraints

- ADR-004: OAuth client ID, client secret, and callback URL must be read from environment variables at runtime (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`) — never from `context.yml`, never hardcoded in application code
- ADR-012: Auth layer must be implemented as a standalone adapter module (not inlined in route handlers) to allow future support for non-GitHub identity providers without rewriting auth logic
- Mandatory security constraint: OAuth state parameter (CSRF protection) is mandatory — do not implement the OAuth flow without it
- Mandatory security constraint: access tokens must be stored server-side in the session store, never in browser localStorage or cookies accessible to JavaScript
- Mandatory security constraint: session tokens must be HttpOnly, Secure, SameSite=Strict cookies
- ADR-009: the auth service (token exchange, session creation) is a separate concern from the read/write API — do not combine in a single route handler

## Dependencies

- **Upstream:** None — this is the first story in the walking skeleton
- **Downstream:** wuce.2, wuce.3, and all subsequent stories depend on an authenticated session from this story

## Acceptance Criteria

**AC1:** Given a user visits the web UI unauthenticated, When they click "Sign in with GitHub", Then they are redirected to GitHub's OAuth authorisation page with the correct client ID, requested scopes (`repo` for Contents API write-back, `read:user` for identity), and a randomly generated state parameter.

**AC2:** Given a user completes GitHub OAuth authorisation, When GitHub redirects back to the callback URL with a valid code and matching state parameter, Then the server exchanges the code for an access token, stores it in a server-side session (not in the browser), and redirects the user to the authenticated dashboard.

**AC3:** Given a user attempts to complete the OAuth callback with a state parameter that does not match the one stored in the session, When the callback is processed, Then the request is rejected with a 403 error, no token is stored, and the attack attempt is logged.

**AC4:** Given an enterprise GitHub organisation has SAML SSO configured, When a user authenticates via GitHub OAuth, Then the flow completes successfully without requiring any additional configuration beyond the standard OAuth App registration.

**AC5:** Given a user's session expires or their token is revoked, When they attempt to access any protected route, Then they are redirected to the sign-in page without exposing the expired token or any internal error details.

## Out of Scope

- User management, role assignment, or invite flows — GitHub identity is the only identity model in Phase 1
- Okta, Azure AD, or any non-GitHub identity provider — explicitly deferred (discovery assumptions)
- Bitbucket or Azure DevOps OAuth — deferred (discovery out-of-scope item 3)
- Token refresh logic beyond session expiry redirect — progressive enhancement for Phase 2

## NFRs

- **Security:** OAuth state parameter required (CSRF). Access tokens HttpOnly Secure SameSite=Strict server-side session only. No tokens in logs.
- **Performance:** OAuth redirect and callback complete in under 2 seconds under normal network conditions.
- **Accessibility:** Sign-in page meets WCAG 2.1 AA — button is keyboard-accessible, focus-visible.
- **Audit:** Authentication events (login, logout, failed callback) are logged with timestamp and GitHub user ID (no tokens logged).

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
