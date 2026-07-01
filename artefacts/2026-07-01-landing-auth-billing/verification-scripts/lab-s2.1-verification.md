# AC Verification Script — lab-s2.1 — Google OAuth — second auth provider

**Story:** lab-s2.1
**Feature:** 2026-07-01-landing-auth-billing
**Audience:** Operator / QA

---

## Setup

Google OAuth App credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`) must be set in `.env`. The callback URL must be registered in the Google Cloud Console for your OAuth app.

Start server:
```powershell
Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
node src/web-ui/server.js
```

**Run automated checks first:**
```
node tests/check-lab-s2.1-google-oauth.js
node tests/check-wuce1-oauth-flow.js
```
Expected: all checks pass.

---

## Scenarios

### Scenario AC1 — Clicking "Continue with Google" starts the Google OAuth flow

1. Open `http://localhost:3000` in an incognito window.
2. Click "Get started" (or navigate to the auth chooser).
3. Find and click the "Continue with Google" button.
4. **Expected:** Your browser redirects to `https://accounts.google.com/o/oauth2/v2/auth` with a Google consent screen asking you to authorise the app. The URL in your browser address bar should start with `accounts.google.com`.
5. If you are redirected somewhere other than Google, or see an error, AC1 fails.

---

### Scenario AC2 — Completing Google OAuth creates a session

1. On the Google consent screen (from AC1), click "Allow" or "Continue".
2. **Expected:** Your browser is redirected back to the platform and you land on `/welcome` (first login) or `/dashboard` (returning login). A session cookie is set. No error page.
3. If you see a 403 or 500 error, AC2 fails.

---

### Scenario AC3 — Session contains correct fields after Google login

*Verified automatically. Human verification:*

1. Run `node tests/check-lab-s2.1-google-oauth.js`.
2. Look for tests named "google-oauth-sets-session-access-token" and "google-oauth-sets-session-user-id-and-tenant-id".
3. **Expected:** Both pass. The `tenantId` should be your Google email address (since no org allowlist is configured).

---

### Scenario AC4 — Session ID rotates after Google login (session fixation prevention)

1. Before clicking "Continue with Google", note the `session_id` cookie value in developer tools.
2. Complete the Google OAuth flow.
3. After redirect to `/welcome` or `/dashboard`, check the `session_id` cookie again.
4. **Expected:** The `session_id` value is different after login. If it is the same, AC4 fails.

---

### Scenario AC5 — "Continue with Google" button is on the auth page

1. Navigate to `http://localhost:3000` and click "Get started" to reach the auth chooser page.
2. **Expected:** You see a "Continue with Google" button alongside the "Continue with GitHub" option (and "Email / password" if lab-s2.2 is merged).
3. If only GitHub is visible, AC5 fails.

---

### Scenario AC6 — GitHub OAuth still works after Google was added

1. In a fresh incognito window, click "Continue with GitHub".
2. Complete the GitHub OAuth flow (authorise the app).
3. **Expected:** You land on `/welcome` or `/dashboard`. The GitHub flow is identical to before lab-s2.1 was merged.
4. Run `node tests/check-wuce1-oauth-flow.js` — all tests must pass.

---

### Scenario AC7 — CSRF protection: tampered callback is rejected

*This scenario requires manipulating the callback URL — for QA/technical reviewer only.*

1. Start the Google OAuth flow (AC1) — get to the Google consent screen.
2. Before clicking "Allow", open browser developer tools → Network.
3. After clicking "Allow", intercept or modify the callback request to change the `state` parameter to a different value.
4. **Expected:** The platform responds with 403. No session is created. You are not logged in.
5. If a 403 is not returned, AC7 fails — CSRF protection is not working.

---

## Reset instructions

Between scenarios: close and reopen an incognito window to clear all cookies and session state.
