# AC Verification Script — lab-s2.2 — Email/password — third auth provider

**Story:** lab-s2.2
**Feature:** 2026-07-01-landing-auth-billing
**Audience:** Operator / QA / Security reviewer

---

## Setup

Start the server:
```powershell
Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
node src/web-ui/server.js
```

**Run automated checks first:**
```
node tests/check-lab-s2.2-email-password.js
```
Expected: all checks pass. Zero failures. Pay special attention to the bcrypt cost factor test (NFR1) and password-in-logs test (NFR2).

---

## Scenarios

### Scenario AC1 — Signing up with an email and password creates an account

1. Open `http://localhost:3000` in an incognito window.
2. Navigate to the sign-up form (click "Get started" → find the "Email / password" option).
3. Enter a new email address (e.g. `smoketest+s22@example.com`) and a password of at least 12 characters.
4. Submit the form.
5. **Expected:** You are redirected to `/welcome` — the plan selection page. A session cookie is set. No error message appears.
6. If you stay on the sign-up form with an error, or see a 500, AC1 fails.

---

### Scenario AC2 — Signing up with an email that already exists returns an error

1. Complete AC1 (or use an email address that already exists in the database).
2. Submit the sign-up form with the same email address again.
3. **Expected:** You see an error message that says "Email already registered". You are NOT logged in. No redirect to `/welcome` occurs.
4. If you are logged in or see a different error message, AC2 fails.

---

### Scenario AC3 — Logging in with the correct password creates a session

1. Navigate to the login form.
2. Enter the email and password created in AC1.
3. Submit.
4. **Expected:** You are redirected to `/dashboard` (returning user — `/welcome` was already completed). A session cookie is set. No error appears.
5. Now submit the same form with an INCORRECT password.
6. **Expected:** You see "Invalid email or password". You are NOT logged in. The error message does not say "wrong password" or "user not found" — it must be the same message for both wrong email and wrong password.

---

### Scenario AC4 — Brute-force protection blocks after 10 failed attempts

*This scenario is for QA / security reviewer. It requires sending 11 requests.*

1. Open a tool like `curl` or Postman.
2. Send 10 login requests to `POST /auth/email/login` with a wrong password for any email address.
3. **Expected:** All 10 responses are 401 "Invalid email or password".
4. Send an 11th request.
5. **Expected:** The 11th response is 429 "Too many attempts". The platform has blocked further attempts from this IP for the rate-limit window (5 minutes).

---

### Scenario AC5 — Password is never exposed

1. Complete a signup (AC1).
2. Open browser developer tools → Network. Find the `POST /auth/email/signup` request.
3. Check the response body: **Expected:** The response body (302 redirect) contains no password, no hash, no plaintext credential.
4. On the server console (or log output), search for the password you used.
5. **Expected:** Zero log lines contain the password string. The only place the password appears is in the browser's request body — never in the response.

---

### Scenario AC6 — Session ID rotates after email/password auth

1. Before signing up, note the `session_id` cookie value (if any) in developer tools.
2. Complete signup (AC1).
3. After redirect to `/welcome`, check the `session_id` cookie value.
4. **Expected:** The `session_id` value is DIFFERENT after signup. If it is the same, AC6 fails.
5. Repeat for login: log out, then log back in. Confirm the `session_id` changes again after login.

---

### Scenario AC7 — "Email / password" option is visible in the auth chooser

1. Navigate to `http://localhost:3000` → click "Get started" → reach the auth chooser page.
2. **Expected:** You see an "Email / password" option alongside the GitHub and Google buttons.
3. Clicking the Email / password option should reveal a sign-up/log-in form — it should NOT navigate away from the platform.

---

## Reset instructions

Between scenarios: use fresh incognito windows. To test the same email again (e.g. for AC2), delete the test user from the database first:
```sql
DELETE FROM users WHERE email = 'smoketest+s22@example.com';
```
Or use a different email address for each scenario.

To reset rate limiting (AC4): wait 5 minutes, or restart the server if the rate limiter uses in-memory state.
