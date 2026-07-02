# AC Verification Script — lab-s2.3 — /welcome onboarding — first-login detection + plan selection redirect

**Story:** lab-s2.3
**Feature:** 2026-07-01-landing-auth-billing
**Audience:** Operator / BA / QA

---

## Setup

Start the server:
```powershell
Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
node src/web-ui/server.js
```

Ensure `STRIPE_PRICE_ID_STARTER` and `STRIPE_PRICE_ID_PRO` are set in `.env` (test mode price IDs). Plan names (`PLAN_NAME_STARTER`, `PLAN_NAME_PRO`) should also be set.

**Run automated checks first:**
```
node tests/check-lab-s2.3-welcome.js
```
Expected: all checks pass.

---

## Scenarios

### Scenario AC1 — First-time login redirects to /welcome

1. Open an incognito window and sign up with a new email address OR complete GitHub/Google OAuth for the first time.
2. **Expected:** After completing auth, your browser is redirected to `http://localhost:3000/welcome` — NOT to `/dashboard`.
3. If you land on `/dashboard` on your first login, AC1 fails.

---

### Scenario AC2 — Returning user goes directly to /dashboard

1. Log out, then log back in with an account that has previously completed `/welcome` (i.e. has already selected a plan).
2. **Expected:** After login, you land on `/dashboard` — `/welcome` is not visited.
3. If you see `/welcome` on a returning login, AC2 fails.

---

### Scenario AC3 — /welcome is protected: unauthenticated access is blocked

1. In an incognito window (no session), navigate directly to `http://localhost:3000/welcome`.
2. **Expected:** You are immediately redirected to `http://localhost:3000/` (the landing page). You do not see the welcome page content.
3. If you can see the welcome page without being logged in, AC3 fails — this is a security issue.

---

### Scenario AC4 — /welcome shows plan options to first-time users

1. Log in for the first time (AC1 scenario). You should be on `/welcome`.
2. **Expected:** The page shows:
   - A welcome greeting (e.g. "Welcome to the platform")
   - At least two plan options with names and brief descriptions (names sourced from env vars — you should see "Starter" and "Pro" or whatever is configured)
   - A "Select this plan" button for each plan
3. **What broken looks like:** Plan names show as `PLAN_NAME_PLACEHOLDER` or price IDs show as `STRIPE_PLAN_PRICE_ID_PLACEHOLDER`. If you see placeholder text, AC4 fails.

---

### Scenario AC5 — Plan selection form wiring (technical reviewer)

1. On the `/welcome` page (AC4 scenario), right-click the "Select this plan" button and choose "Inspect Element".
2. **Expected:** The button's form or the enclosing `<form>` has `action="/billing/checkout"`. The form also has a hidden input field named `planId` with the plan identifier as the value.
3. If the form action points somewhere other than `/billing/checkout`, or if `planId` is missing, AC5 fails.

---

### Scenario AC6 — `plan_selected` PostHog event fires when a plan is selected

*Requires PostHog account and `POSTHOG_KEY` configured.*

1. Open the PostHog live event stream.
2. On the `/welcome` page, click "Select this plan" for any plan.
3. **Expected:** Within 30 seconds, a `plan_selected` event appears in PostHog with a `planName` property identifying which plan was selected.
4. If no event appears, or the event is missing `planName`, AC6 fails. If `POSTHOG_KEY` is not set, note as deferred.

---

### Scenario AC7 — Already-completed user cannot re-enter /welcome

1. Complete the `/welcome` flow (select a plan — lab-s3.2 must be merged for full checkout, but the redirect away from `/welcome` after plan selection is the relevant check here).
2. After plan selection, navigate directly to `http://localhost:3000/welcome` (type it in the address bar).
3. **Expected:** You are redirected to `/dashboard`. You do NOT see the plan selection page again.
4. If you see the plan selection page again, AC7 fails.

---

## Reset instructions

Between scenarios: close and reopen an incognito window. To test first-login (AC1) repeatedly with the same email, clear the `firstLogin` flag in the database:
```sql
UPDATE users SET first_login = true WHERE email = 'your@email.com';
```
Or create a new account with a different email address for each AC1 test.
