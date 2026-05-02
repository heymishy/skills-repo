# Test Plan: GitHub OAuth flow and authenticated session

**Story reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.1-github-oauth-flow.md
**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e1-walking-skeleton.md
**Test plan author:** Copilot
**Date:** 2026-05-02

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Unauthenticated user → Sign in → GitHub OAuth redirect with correct client ID, scopes, and random state | 4 | 1 | — | — | — | 🟢 |
| AC2 | Valid callback (code + matching state) → token exchange → server-side session → dashboard redirect | 3 | 1 | — | — | — | 🟢 |
| AC3 | Mismatched state → 403, no token stored, attempt logged | 3 | 1 | — | — | — | 🟢 |
| AC4 | SAML SSO enterprise → flow completes without additional config | — | — | — | 1 | External-dependency | 🟡 |
| AC5 | Session expired/token revoked → redirect to sign-in, no internal details exposed | 2 | 1 | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| SAML SSO enterprise federation completes without additional config | AC4 | External-dependency | Requires a live GitHub Enterprise organisation with SAML SSO configured — no test double faithfully reproduces SAML assertion flow | Manual scenario — see AC verification script 🟡 |

---

## Test Data Strategy

**Source:** Fixtures — static JSON fixtures committed to `tests/fixtures/github/`
**PCI/sensitivity in scope:** No
**Availability:** Created alongside these tests (self-contained — no live API required)
**Owner:** Self-contained — tests generate session state in setup; fixture files provide GitHub API response shapes

### Named shared fixtures (reusable by E2–E4)

The following fixtures are the canonical shapes for all downstream tests. Any test in E2–E4 that needs to simulate an authenticated session or a GitHub API token response **must import from these paths** rather than inline a duplicate shape.

| Fixture path | Purpose | Used by |
|---|---|---|
| `tests/fixtures/github/oauth-token-exchange-success.json` | Successful GitHub OAuth token exchange response | wuce.1, wuce.2, wuce.3, wuce.9 |
| `tests/fixtures/github/oauth-token-exchange-error.json` | Failed token exchange (bad code) | wuce.1 |
| `tests/fixtures/github/user-identity.json` | `/user` endpoint — authenticated user profile | wuce.1, wuce.2, wuce.3, E4 stories |

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | OAuth redirect URL params: client_id, scope, state | Generated in test setup | None | State must be randomly generated per redirect |
| AC2 | GitHub code exchange response with access_token | `oauth-token-exchange-success.json` | None | Token value `gho_test_fixture_token` — not a real token |
| AC3 | Session with stored state; callback with different state | Generated in test setup | None | |
| AC4 | Live GitHub Enterprise org with SAML SSO | External org — not available in CI | None | Manual only |
| AC5 | Session with expired/missing token | Generated in test setup | None | |

### Fixture contents

**`tests/fixtures/github/oauth-token-exchange-success.json`:**
```json
{
  "access_token": "gho_test_fixture_token_wuce1",
  "token_type": "bearer",
  "scope": "repo,read:user"
}
```

**`tests/fixtures/github/oauth-token-exchange-error.json`:**
```json
{
  "error": "bad_verification_code",
  "error_description": "The code passed is incorrect or expired.",
  "error_uri": "https://docs.github.com/apps/managing-oauth-apps/troubleshooting-oauth-app-access-token-request-errors/"
}
```

**`tests/fixtures/github/user-identity.json`:**
```json
{
  "login": "test-stakeholder",
  "id": 99001,
  "name": "Test Stakeholder",
  "email": "stakeholder@example.com",
  "avatar_url": "https://avatars.githubusercontent.com/u/99001"
}
```

### PCI / sensitivity constraints

None.

### Gaps

Test data for AC4 (SAML SSO) is not available in CI — external-dependency gap. Accepted as manual-only (see gap table).

---

## Unit Tests

### AC1 — OAuth redirect generation

**T1.1** `buildOAuthRedirectURL() returns URL pointing to GitHub OAuth authorisation endpoint`
- **AC:** AC1
- **Precondition:** `GITHUB_CLIENT_ID=test-client-id` set in env; `GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback`
- **Action:** Call `buildOAuthRedirectURL(state)`
- **Expected:** Returned URL starts with `https://github.com/login/oauth/authorize`; contains `client_id=test-client-id`
- **Fails before implementation:** Yes — function does not exist

**T1.2** `buildOAuthRedirectURL() includes repo and read:user scopes`
- **AC:** AC1
- **Precondition:** As T1.1
- **Action:** Call `buildOAuthRedirectURL(state)`
- **Expected:** URL contains `scope=repo%2Cread%3Auser` (or equivalent encoding)
- **Fails before implementation:** Yes

**T1.3** `buildOAuthRedirectURL() embeds the provided state value in the redirect URL`
- **AC:** AC1
- **Precondition:** `state = 'test-csrf-state-abc123'`
- **Action:** Call `buildOAuthRedirectURL('test-csrf-state-abc123')`
- **Expected:** URL contains `state=test-csrf-state-abc123`
- **Fails before implementation:** Yes

**T1.4** `generateState() returns a different value on each call`
- **AC:** AC1 (random state requirement)
- **Precondition:** None
- **Action:** Call `generateState()` twice
- **Expected:** The two returned strings are not equal
- **Fails before implementation:** Yes

### AC2 — Token exchange and session storage

**T2.1** `exchangeCodeForToken(code, state) calls GitHub token endpoint with code and client credentials`
- **AC:** AC2
- **Precondition:** Mock GitHub token endpoint to return `oauth-token-exchange-success.json`; `GITHUB_CLIENT_ID=test-id`, `GITHUB_CLIENT_SECRET=test-secret`
- **Action:** Call `exchangeCodeForToken('valid-code')`
- **Expected:** Fetch called with `https://github.com/login/oauth/access_token`, POST body contains `code=valid-code`, `client_id=test-id`, `client_secret=test-secret`
- **Fails before implementation:** Yes

**T2.2** `exchangeCodeForToken() returns the access_token from the fixture response`
- **AC:** AC2
- **Precondition:** Mock returns `oauth-token-exchange-success.json`
- **Action:** `const token = await exchangeCodeForToken('valid-code')`
- **Expected:** `token === 'gho_test_fixture_token_wuce1'`
- **Fails before implementation:** Yes

**T2.3** `storeTokenInSession(req, token) stores token in req.session, not in response headers`
- **AC:** AC2
- **Precondition:** Mock `req` object with `session` property
- **Action:** Call `storeTokenInSession(req, 'gho_test_fixture_token_wuce1')`
- **Expected:** `req.session.accessToken === 'gho_test_fixture_token_wuce1'`; response object has no `Set-Cookie` header containing the token
- **Fails before implementation:** Yes

### AC3 — State mismatch CSRF protection

**T3.1** `validateOAuthState(sessionState, callbackState) returns false when states do not match`
- **AC:** AC3
- **Precondition:** None
- **Action:** Call `validateOAuthState('state-abc', 'state-xyz')`
- **Expected:** Returns `false`
- **Fails before implementation:** Yes

**T3.2** `validateOAuthState(sessionState, callbackState) returns true when states match`
- **AC:** AC3 (confirming the positive path is also testable)
- **Precondition:** None
- **Action:** Call `validateOAuthState('state-abc', 'state-abc')`
- **Expected:** Returns `true`
- **Fails before implementation:** Yes

**T3.3** `callbackHandler logs mismatch event when state validation fails`
- **AC:** AC3
- **Precondition:** Mock logger; session contains `state = 'state-stored'`; callback arrives with `state = 'state-different'`
- **Action:** Call callback handler
- **Expected:** Logger called with event type `oauth_state_mismatch` and session ID (no token value in log)
- **Fails before implementation:** Yes

### AC5 — Session expiry redirect

**T5.1** `authGuard middleware redirects to / when req.session.accessToken is absent`
- **AC:** AC5
- **Precondition:** `req.session` exists but has no `accessToken`
- **Action:** Call `authGuard(req, res, next)`
- **Expected:** `res.redirect('/')` called; `next()` not called
- **Fails before implementation:** Yes

**T5.2** `authGuard middleware does not include session data in redirect response`
- **AC:** AC5
- **Precondition:** `req.session.accessToken = 'gho_expired_token'`; session considered invalid (mock token validator returns expired)
- **Action:** Call `authGuard(req, res, next)`
- **Expected:** Redirect response body/headers do not contain the token string
- **Fails before implementation:** Yes

---

## Integration Tests

**IT1** `GET /auth/github returns 302 redirect to GitHub OAuth URL with state stored in session`
- **ACs:** AC1
- **Precondition:** `GITHUB_CLIENT_ID=test-client-id` in env; fresh session
- **Action:** `GET /auth/github`
- **Expected:** Response status 302; `Location` header contains `github.com/login/oauth/authorize`; `req.session.oauthState` is set
- **Fails before implementation:** Yes

**IT2** `GET /auth/github/callback with valid code and matching state stores token and redirects to /dashboard`
- **ACs:** AC2
- **Precondition:** Session contains `oauthState = 'state-abc'`; mock GitHub token endpoint returns `oauth-token-exchange-success.json`
- **Action:** `GET /auth/github/callback?code=valid-code&state=state-abc`
- **Expected:** Status 302 to `/dashboard`; session contains `accessToken`; response does not expose token in headers
- **Fails before implementation:** Yes

**IT3** `GET /auth/github/callback with mismatched state returns 403`
- **ACs:** AC3
- **Precondition:** Session contains `oauthState = 'state-stored'`
- **Action:** `GET /auth/github/callback?code=any-code&state=state-different`
- **Expected:** Status 403; response body does not contain any token value; session `accessToken` remains unset
- **Fails before implementation:** Yes

**IT4** `GET /dashboard without session redirects to /`
- **ACs:** AC5
- **Precondition:** No session / no `accessToken` in session
- **Action:** `GET /dashboard`
- **Expected:** Status 302 to `/`
- **Fails before implementation:** Yes

---

## NFR Tests

**NFR1** `session cookie is HttpOnly, Secure, and SameSite=Strict`
- **NFR:** Security
- **Precondition:** App initialised with session middleware
- **Action:** Inspect session middleware configuration
- **Expected:** `httpOnly: true`, `secure: true` (in production), `sameSite: 'strict'`
- **Fails before implementation:** Yes

**NFR2** `audit log contains login event with GitHub user ID and timestamp but no access token`
- **NFR:** Audit
- **Precondition:** Mock logger; mock `/user` endpoint returns `user-identity.json`; successful callback flow
- **Action:** Complete callback handler with valid state
- **Expected:** Log entry contains `event: 'login'`, `userId: 99001`, ISO timestamp; does not contain the string `gho_test_fixture_token_wuce1`
- **Fails before implementation:** Yes

---

## Gap table

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| SAML SSO enterprise federation | AC4 | External-dependency | Requires live GitHub Enterprise org with SAML SSO — no test double reproduces SAML assertion chain | Manual scenario in verification script 🟡 |
