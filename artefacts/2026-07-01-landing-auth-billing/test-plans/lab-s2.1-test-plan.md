# Test Plan — lab-s2.1 — Google OAuth — second auth provider

**Story:** lab-s2.1
**Feature:** 2026-07-01-landing-auth-billing
**Review status:** PASS (run 1, 2026-07-01)
**Test runner:** `node tests/check-lab-s2.1-google-oauth.js`
**Date written:** 2026-07-01

---

## Test data strategy

**Strategy:** Synthetic. All Google API calls (redirect URL construction, code exchange, userinfo fetch) are monkeypatched via injectable adapter. No real Google API calls in tests.

- Mock Google user identity: `{ sub: '123456789', email: 'testuser@example.com' }`
- CSRF state: generated in-process (`crypto.randomBytes`) and stored in mock session
- `rotateSessionId` is monkeypatched to a spy
- Audit logger is monkeypatched to capture log calls

**PCI/sensitivity:** None.

**Test data gaps:** None.

---

## AC coverage table

| AC | Summary | Test type | Test IDs | Gap? |
|----|---------|-----------|----------|------|
| AC1 | GET /auth/google → redirect to Google with correct params | Unit | T1.1, T1.2, T1.3 | None |
| AC2 | Callback validates CSRF state; exchanges code | Unit | T2.1, T2.2, T2.3 | None |
| AC3 | Session fields set correctly after Google OAuth | Unit | T3.1, T3.2 | None |
| AC4 | `rotateSessionId` called after Google login | Unit | T4.1 | None |
| AC5 | "Continue with Google" button visible in auth chooser | Unit (HTML) | T5.1 | None |
| AC6 | Existing GitHub OAuth flow unchanged | Regression | R6.1 | None |
| AC7 | State mismatch → 403, no token stored | Unit | T7.1, T7.2 | None |

---

## Gap table

No gaps — all ACs are unit/integration testable without a real browser or real Google OAuth.

---

## E2E / browser-layout detection

AC5 ("Continue with Google" button visible) can be verified by asserting the HTML response contains the button element. This is not CSS-layout-dependent — it is a DOM presence check. No E2E tooling required.

---

## Unit tests

### T1 — GET /auth/google redirects to Google authorisation URL (AC1)

**T1.1** — `google-auth-route-redirects-to-google-oauth-endpoint`
Covers: AC1
Precondition: `GET /auth/google` handler loaded; env vars `GOOGLE_CLIENT_ID`, `GOOGLE_CALLBACK_URL` set
Action: Call handler with mock unauthenticated req
Expected: Response is 302; `Location` header starts with `https://accounts.google.com/o/oauth2/v2/auth`
Edge case: none

**T1.2** — `google-redirect-url-contains-required-params`
Covers: AC1
Precondition: T1.1
Action: Parse the `Location` header URL query params
Expected: `client_id` equals `GOOGLE_CLIENT_ID` env var; `redirect_uri` equals `GOOGLE_CALLBACK_URL`; `scope` contains `openid` and `email`; `response_type` equals `code`; `state` is a non-empty string
Edge case: `state` must be randomly generated (not a fixed string)

**T1.3** — `google-redirect-stores-state-in-session`
Covers: AC1 (CSRF state stored in session)
Precondition: T1.1
Action: After handler call, inspect `req.session.oauthState` (or equivalent field)
Expected: `req.session.oauthState` is set to the same value as the `state` query param in the Location header
Edge case: none

### T2 — Callback validates state and exchanges code (AC2)

**T2.1** — `google-callback-validates-csrf-state-match`
Covers: AC2 (happy path state match)
Precondition: `req.session.oauthState` set to `'test-state-123'`; query params include `state=test-state-123&code=test-code`; adapter monkeypatched to return mock tokens and user identity
Action: Call callback handler
Expected: Handler proceeds to token exchange; no 403 returned
Edge case: none

**T2.2** — `google-callback-rejects-state-mismatch-with-403`
Covers: AC2, AC7
Precondition: `req.session.oauthState` set to `'expected-state'`; callback query has `state=wrong-state`
Action: Call callback handler
Expected: Response is 403; no call to token exchange adapter; `req.session.accessToken` NOT set
Edge case: none

**T2.3** — `google-callback-exchanges-code-for-tokens`
Covers: AC2
Precondition: State matches; mock adapter configured to return `{ access_token: 'mock-google-token', sub: '123456789', email: 'testuser@example.com' }`
Action: Call callback handler
Expected: Mock adapter `exchangeCode` (or equivalent) was called with the code from the query string
Edge case: none

### T3 — Session fields correct after Google OAuth (AC3)

**T3.1** — `google-oauth-sets-session-access-token`
Covers: AC3
Precondition: Successful callback (T2.1 setup); adapter returns mock Google access token
Action: Inspect `req.session.accessToken` after callback
Expected: `req.session.accessToken` is the Google access token value; it is non-empty
Edge case: Must be `req.session.accessToken` — NOT `req.session.googleToken` or any other field name

**T3.2** — `google-oauth-sets-session-user-id-and-tenant-id`
Covers: AC3
Precondition: Same as T3.1
Action: Inspect `req.session.userId`, `req.session.tenantId`, `req.session.login` after callback
Expected: `req.session.userId` is the Google `sub` value; `req.session.tenantId` is the email address (MVP tenantId derivation); `req.session.login` is the email address
Edge case: none

### T4 — `rotateSessionId` called (AC4)

**T4.1** — `rotate-session-id-called-after-google-oauth`
Covers: AC4
Precondition: `rotateSessionId` monkeypatched to spy; successful callback scenario
Action: Call callback handler
Expected: `rotateSessionId` spy called exactly once; new `session_id` cookie set in response
Edge case: none

### T5 — "Continue with Google" button in auth chooser HTML (AC5)

**T5.1** — `auth-chooser-contains-continue-with-google`
Covers: AC5
Precondition: Auth chooser page rendered (GET /auth or GET / with CTA)
Action: Assert response HTML body contains `Continue with Google` (case-insensitive string match)
Expected: "Continue with Google" text present in HTML; the element links to or targets `/auth/google`
Edge case: Once lab-s2.2 is merged, email/password option should also be present — this test only checks Google

### T7 — State mismatch returns 403 with audit log (AC7)

**T7.1** — `state-mismatch-403-response`
Covers: AC7
Precondition: T2.2 setup (wrong state)
Action: Call callback handler
Expected: `res.statusCode === 403`
Edge case: none

**T7.2** — `state-mismatch-audit-logged`
Covers: AC7 (audit log)
Precondition: T2.2 setup; audit logger monkeypatched to capture calls
Action: Call callback handler
Expected: Audit log contains an entry with key `oauth_state_mismatch` or equivalent; no token value in the log entry
Edge case: none

---

## Integration tests

**IT1** — `google-oauth-does-not-break-github-flow`
Covers: AC6 (regression check)
Precondition: GitHub OAuth handler and Google OAuth handler both registered; GitHub adapter monkeypatched to return GitHub user identity
Action: Trigger the GitHub OAuth callback (IT1.1 from lab-s1.3 equivalent scenario)
Expected: GitHub callback still sets correct session fields; `rotateSessionId` still called; no interference from Google route registration
Edge case: none

**IT2** — `full-google-flow-redirects-to-welcome-on-first-login`
Covers: AC1, AC2, AC3, AC4 (integration)
Precondition: Google adapter returns mock identity; session has no `firstLogin` cleared; user-flags adapter returns `firstLogin: true`
Action: Run the full Google OAuth flow (initiate + callback)
Expected: Response after callback is 302 to `/welcome`
Edge case: none

---

## NFR tests

**NFR1** — `no-credentials-in-audit-log`
Covers: NFR — login event must not log token value
Precondition: Successful Google OAuth callback; audit logger monkeypatched to capture all log calls
Action: Inspect all captured log calls for any occurrence of the mock access token string
Expected: Zero log entries contain the mock access token value; the login event log entry contains `userId` and timestamp only
Edge case: none

---

## Regression

**R6.1** — `github-oauth-unchanged`
Covers: AC6
Action: Run `node tests/check-wuce1-oauth-flow.js`
Expected: All tests pass. Zero new failures.

---

## State update fields

- `totalTests`: 12
- `acTotal`: 7
- `hasLayoutDependentGaps`: false
- `e2eToolingRequired`: false
