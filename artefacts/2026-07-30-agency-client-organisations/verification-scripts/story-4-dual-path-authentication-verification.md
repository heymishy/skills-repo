# AC Verification Script: Client-org dual-path authentication

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-4-dual-path-authentication.md
**Technical test plan:** artefacts/2026-07-30-agency-client-organisations/test-plans/story-4-dual-path-authentication-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have an invited Client-org user available (created via Story 3's invitation flow) with both a GitHub account and an email address you can check.
2. Have a test inbox ready to check the magic-link email.

**Reset between scenarios:** Sign out between scenarios.

---

## Scenarios

---

### Scenario 1: Signing in with GitHub works for a Client-org user

**Covers:** AC1

**Steps:**
1. On the sign-in page, choose "Continue with GitHub."
2. Complete the GitHub sign-in as normal.

**Expected outcome:**
> You land inside the app, signed in as your Client organisation, exactly as GitHub sign-in has always worked for other account types.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Signing in with just an email (magic-link) works

**Covers:** AC2

**Steps:**
1. On the sign-in page, choose the "Sign in with email" (or equivalent) option.
2. Enter your invited email address and submit.
3. Check your inbox for the sign-in email.
4. Click the link in the email.

**Expected outcome:**
> An email arrives with a sign-in link. Clicking it signs you in and takes you into the app as your Client organisation — the same place GitHub sign-in would take you.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Email sign-in is only offered to Client organisations

**Covers:** AC3

**Steps:**
1. Sign out.
2. Sign in as an Agency or Standalone account.
3. Look for an "sign in with email only" option on that account type's usual sign-in path (or try requesting one directly if you know the address).

**Expected outcome:**
> This option is not available (or is rejected if attempted directly) for Agency/Standalone accounts — it's specific to Client organisations.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A sign-in link can't be used twice

**Covers:** AC4

**Steps:**
1. Request a new sign-in email (as in Scenario 2) and click the link once — confirm you're signed in.
2. Sign out.
3. Click the exact same link from the email again.

**Expected outcome:**
> The second click does not sign you in — you see an error or expired-link message, not a successful sign-in.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Requesting many sign-in emails quickly is blocked

**Covers:** Security NFR (rate-limiting)

**Steps:**
1. Request a sign-in email several times in quick succession for the same address.

**Expected outcome:**
> After a handful of attempts, further requests are refused (a "too many attempts, try again later" style message) rather than sending unlimited emails.

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
