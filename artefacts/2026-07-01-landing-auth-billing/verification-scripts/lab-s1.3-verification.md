# AC Verification Script — lab-s1.3 — Multi-provider auth registry (GitHub primary)

**Story:** lab-s1.3
**Feature:** 2026-07-01-landing-auth-billing
**Audience:** Operator / QA

---

## Purpose

1. **Pre-code sign-off** — confirm these auth registry behaviours are correct before implementation.
2. **Post-merge smoke test** — confirm the shipped provider registry matches these scenarios.
3. **Delivery review** — structured walkthrough confirming GitHub auth still works and session hygiene is enforced.

---

## Setup

Start the server with environment variables loaded:

```powershell
Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
node src/web-ui/server.js
```

```bash
export $(grep -v '^#' .env | xargs) && node src/web-ui/server.js
```

**Run automated checks first:**
```
node tests/check-lab-s1.3-provider-registry.js
node tests/check-wuce1-oauth-flow.js
```
Expected: all checks pass. Zero failures.

---

## Scenarios

### Scenario AC1 — GitHub login still works after the provider registry is introduced

1. Open `http://localhost:3000` in an incognito window (no session).
2. Click "Get started" → confirm you reach `/auth/github`.
3. Complete the GitHub OAuth flow (authorise the app in GitHub).
4. **Expected:** You are redirected to `/welcome` (first login) or `/dashboard` (returning login). Your browser has a session cookie. No error page appears.
5. If you see a 500 error or an auth error, AC1 fails.

---

### Scenario AC2 — Session ID changes after login (session fixation prevention)

1. Before clicking "Get started", open browser developer tools → Application (or Storage) → Cookies.
2. Note the value of the `session_id` cookie (if one exists before login).
3. Complete the GitHub OAuth flow (as in AC1).
4. After redirect to `/welcome` or `/dashboard`, check the `session_id` cookie again.
5. **Expected:** The `session_id` cookie value is DIFFERENT after login than before. If the value is the same before and after login, AC2 fails — this is a session fixation vulnerability.

---

### Scenario AC3 — Old sessions are invalidated after the registry is deployed

1. Log in via GitHub (AC1 scenario). Note your `session_id` cookie value.
2. Simulate the deployment by restarting the server (stop and start it).
3. With the old `session_id` cookie still in your browser (do not clear cookies), navigate to `http://localhost:3000/dashboard`.
4. **Expected:** If the session schema changed (Path A or B was chosen in lab-s1.1), you are redirected to `/` — the old session is not recognised. You must log in again.
5. Note: if Path C was chosen (no schema change), this scenario may not apply — document as "N/A for Path C".

---

### Scenario AC4 — `authGuard` uses the correct session field

*This is verified automatically by the automated check. Human verification:*

1. Run `node tests/check-lab-s1.3-provider-registry.js`.
2. Look for the test named "auth-guard-rejects-request-with-only-session-token-field".
3. **Expected:** This test passes — confirming the guard reads `req.session.accessToken` (not `req.session.token`).
4. If this test fails, a regression was introduced in the canonical field check.

---

### Scenario AC5 — Provider adapter default stub throws

*Verified automatically. Human verification:*

1. Run `node tests/check-lab-s1.3-provider-registry.js`.
2. Look for tests named "default-provider-adapter-throws-on-*".
3. **Expected:** Both tests pass — confirming the stub throws an error (not returning null or undefined silently).

---

### Scenario AC6 — Production server wires real adapter on startup

1. Start the server (not in test mode).
2. Check the startup log output.
3. **Expected:** A log message like "Provider registry initialised" or similar appears in the console. No unhandled error about "Adapter not wired" appears.
4. If "Adapter not wired" appears in the startup logs, AC6 fails — `server.js` is not calling `setProviderAdapter()`.

---

### Scenario AC7 — No regression in existing GitHub OAuth tests

1. Run `node tests/check-wuce1-oauth-flow.js`.
2. **Expected:** All tests pass. Zero failures. The output matches what passed before lab-s1.3 was implemented.
3. Any new failure in `check-wuce1-oauth-flow.js` is a regression introduced by this story.

---

## Reset instructions

Between scenarios, use separate incognito windows. To reset logged-in state, close and reopen an incognito window.
