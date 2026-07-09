# AC Verification Script: Auth journey spec

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.6-auth-journey.md
**Technical test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s3.6-auth-journey-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Make sure the app is running with `NODE_ENV=test` so GitHub/Google OAuth calls are stubbed rather than hitting the real providers.
2. Have a synthetic "first-time" GitHub identity ready (no prior login on record) and a synthetic "returning" GitHub identity (has logged in before).
3. Open the app in a browser at the login page.

**Reset between scenarios:** Log out fully between scenarios. Use a fresh, never-before-seen synthetic identity for Scenario 1, and the same identity again (now "returning") for Scenario 2.

---

## Scenarios

---

### Scenario 1: A brand-new user is sent to pick a plan, not straight to the dashboard

**Covers:** AC1

**Steps:**
1. Log in via GitHub for the first time with a synthetic identity that has never logged in before.

**Expected outcome:**
> You land on the `/welcome` page (plan selection) — not the dashboard.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A returning user goes straight to their dashboard

**Covers:** AC2

**Steps:**
1. Log out, then log in again via GitHub using the same identity from Scenario 1 (now a returning user).

**Expected outcome:**
> You land straight on `/dashboard` — you are not sent to `/welcome` again.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: An expired session sends you to log in again, not to a dead end

**Covers:** AC3

**Steps:**
1. While logged in, force your session to expire or become invalid (for example, by clearing the session on the server side or waiting out the expiry).
2. Try to do something that requires being logged in.

**Expected outcome:**
> You are redirected to log in again. You do not see a blank error page or a silent failure with no way forward.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Your access token never shows up anywhere it shouldn't

**Covers:** AC4

**Steps:**
1. Log in successfully using GitHub, then again using Google, then again using email/password.
2. Each time, view the page's source (right-click → "View Page Source" or browser dev tools) and check any logs produced during login.

**Expected outcome:**
> In none of the three logins does the literal access token value appear anywhere in the page's HTML or in the logs.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: This spec doesn't actually contact GitHub or Google

**Covers:** AC5

**Steps:**
1. While repeating the logins above with the app in test mode, watch for any outgoing network calls to the real github.com or accounts.google.com OAuth endpoints.

**Expected outcome:**
> Zero real calls are made to either provider's real OAuth endpoint. The browser still visibly goes through the same redirect steps a real login would — it just doesn't actually reach GitHub or Google's servers.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Scenario 4 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
