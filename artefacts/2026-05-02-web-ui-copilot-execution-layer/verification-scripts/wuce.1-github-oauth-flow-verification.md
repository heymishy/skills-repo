# AC Verification Script: wuce.1 — GitHub OAuth flow and authenticated session

**Story reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.1-github-oauth-flow.md
**Test plan reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.1-github-oauth-flow-test-plan.md
**Verification script author:** Copilot
**Date:** 2026-05-02

---

## Pre-verification checks

Before verifying any AC, confirm:

```bash
# 1. Jest test suite passes (all unit + integration tests for wuce.1)
npx jest tests/wuce.1 --ci
# Expected: 0 failures, all tests listed in test plan present and passing

# 2. Named OAuth fixtures exist
ls tests/fixtures/github/oauth-token-exchange-success.json
ls tests/fixtures/github/oauth-token-exchange-error.json
ls tests/fixtures/github/user-identity.json
# Expected: all three files exist
```

---

## AC1 — Unauthenticated user redirected to GitHub OAuth with correct params

**Automated evidence (Jest):** T1.1, T1.2, T1.3, T1.4, IT1

**Verification command:**
```bash
npx jest tests/wuce.1 --ci --testNamePattern="AC1|buildOAuthRedirectURL|generateState|GET /auth/github"
```

**Expected output:** All named tests pass. Zero failures.

**Manual confirmation step:**
1. Start the web app locally with a test GitHub OAuth App registered at `http://localhost:3000`
2. Navigate to `http://localhost:3000` (unauthenticated)
3. Click "Sign in with GitHub"
4. Observe browser address bar redirect — must show `github.com/login/oauth/authorize` with `client_id`, `scope=repo%2Cread%3Auser`, and a `state` parameter
5. Navigate to `http://localhost:3000` again (new incognito window) and click "Sign in with GitHub" again
6. Compare the `state` parameter in both redirects — must be different values

**Pass condition:** Steps 4 and 6 both confirmed. ✅ / ❌

---

## AC2 — Valid callback stores token in session and redirects to dashboard

**Automated evidence (Jest):** T2.1, T2.2, T2.3, IT2

**Verification command:**
```bash
npx jest tests/wuce.1 --ci --testNamePattern="AC2|exchangeCodeForToken|storeTokenInSession|callback.*valid"
```

**Expected output:** All named tests pass. Zero failures.

**Manual confirmation step:**
1. Complete full OAuth flow (start from AC1 manual step, click through to GitHub, authorise)
2. Observe redirect to `/dashboard` after authorisation
3. Open browser DevTools → Application → Cookies — confirm no cookie named `access_token` or containing `gho_` prefix
4. Open browser DevTools → Network → Response headers for the callback redirect — confirm no `access_token` in headers

**Pass condition:** Redirects to dashboard; token not visible in browser storage or response headers. ✅ / ❌

---

## AC3 — Mismatched state parameter → 403, no token stored, attempt logged

**Automated evidence (Jest):** T3.1, T3.2, T3.3, IT3

**Verification command:**
```bash
npx jest tests/wuce.1 --ci --testNamePattern="AC3|validateOAuthState|state mismatch|callbackHandler logs"
```

**Expected output:** All named tests pass. Zero failures.

**Manual confirmation step:**
1. Initiate OAuth flow — note the `state` value in the GitHub redirect URL
2. Manually craft a callback URL: `http://localhost:3000/auth/github/callback?code=fake-code&state=tampered-state`
3. Navigate to the crafted URL directly in the browser
4. Observe: HTTP 403 response (or error page with no token); check application logs for `oauth_state_mismatch` event

**Pass condition:** 403 response; `oauth_state_mismatch` in logs; session has no `accessToken`. ✅ / ❌

---

## AC4 — SAML SSO enterprise flow completes without additional config

**Automated evidence:** 🟡 **NONE — external-dependency gap**

**Gap justification:** Requires a live GitHub Enterprise organisation with SAML SSO configured. No test double faithfully reproduces the SAML assertion chain. This AC is untestable in Jest CI.

**Manual verification required:**
- **Environment:** A GitHub Enterprise organisation that has SAML SSO enforced (e.g. the test org in the enterprise staging environment)
- **Precondition:** OAuth App registered against the enterprise organisation; `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` populated from the enterprise app
- **Steps:**
  1. Navigate to the web UI and click "Sign in with GitHub"
  2. GitHub redirects to the enterprise SAML SSO flow — authenticate through the SAML IdP
  3. After SAML authentication, GitHub redirects back to the OAuth callback
  4. Confirm the web UI shows the authenticated dashboard with the enterprise user's identity
- **Pass condition:** Authentication completes without additional configuration steps; enterprise user lands on the dashboard

**Risk level if not tested:** 🟡 MEDIUM — SAML SSO is the primary auth path for enterprise stakeholders (benefit metric M2). If this fails, Phase 1 activation rate target is unachievable. However, the OAuth mechanism itself is identical to non-SAML — SAML is handled entirely by GitHub before the callback. Architectural risk is low.

**Recommended verification cadence:** Once per environment setup (at staging stand-up time), not per story cycle.

---

## AC5 — Session expired/token revoked → redirect to sign-in without exposing token

**Automated evidence (Jest):** T5.1, T5.2, IT4

**Verification command:**
```bash
npx jest tests/wuce.1 --ci --testNamePattern="AC5|authGuard|session.*expired|redirect.*/"
```

**Expected output:** All named tests pass. Zero failures.

**Manual confirmation step:**
1. Sign in to the web UI and reach the dashboard
2. Clear the session cookie from browser DevTools (Application → Cookies → delete session cookie)
3. Navigate to `http://localhost:3000/dashboard`
4. Observe: redirect to sign-in page (`/`); no error detail, no token value in the response

**Pass condition:** Redirected to `/`; no internal error or token visible. ✅ / ❌

---

## NFR verification

### Security — session cookie properties

**Verification command:**
```bash
npx jest tests/wuce.1 --ci --testNamePattern="NFR1|session cookie|HttpOnly|SameSite"
```

**Manual confirmation:**
1. Sign in and open browser DevTools → Application → Cookies
2. Inspect the session cookie: confirm `HttpOnly` flag is set; `SameSite=Strict`; in production deployment, `Secure` flag is set
**Pass condition:** All three cookie flags confirmed. ✅ / ❌

### Audit — login event logged without token

**Verification command:**
```bash
npx jest tests/wuce.1 --ci --testNamePattern="NFR2|audit log|login event"
```

**Pass condition:** Test passes; log contains `event: login`, user ID, timestamp; access token string absent from log entry. ✅ / ❌

---

## Full suite run

```bash
npx jest tests/wuce.1 --ci --coverage
```

**Expected:** 0 failed suites; 0 failed tests; coverage for auth adapter module and callback route handler ≥ 80%.

---

## Completion criteria

All of the following must be true before wuce.1 is marked `testPlan.status: verified`:

- [ ] All Jest tests pass with 0 failures
- [ ] `tests/fixtures/github/oauth-token-exchange-success.json` committed
- [ ] `tests/fixtures/github/oauth-token-exchange-error.json` committed
- [ ] `tests/fixtures/github/user-identity.json` committed
- [ ] AC4 manual verification completed (or explicitly waived with justification in pipeline-state notes)
- [ ] NFR1 session cookie flags confirmed manually
- [ ] NFR2 audit log entry confirmed in test output
