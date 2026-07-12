# AC Verification Script: A logged-in user links a second auth provider to their identity

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s2.md
**Technical test plan:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s2-cross-provider-linking-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:**
1. Have two test accounts ready: one signed up via GitHub, one via Google (or email/password).
2. Have access to the settings page where account linking happens.

**Reset between scenarios:** Log out and log back in as the relevant test account between scenarios.

---

## Scenarios

---

### Scenario 1: Linking a second sign-in method to your account

**Covers:** AC1

**Steps:**
1. Log in with your GitHub account.
2. Go to the account settings page and click "Link Google account".
3. Complete the Google sign-in when prompted.
4. Log out, then log back in — this time using Google instead of GitHub.

**Expected outcome:**
> You land back in the same account (same dashboard, same data) whether you sign in via GitHub or Google — the two are now treated as the same person.

**Result:** [ ] Pass [ ] Fail
**Notes:**

---

### Scenario 2: You must be logged in to link an account

**Covers:** AC2

**Steps:**
1. Make sure you are logged out.
2. Try to go directly to the account-linking settings page.

**Expected outcome:**
> You are sent to the login page instead of seeing the linking settings — you cannot reach the link action without first being logged in.

**Result:** [ ] Pass [ ] Fail
**Notes:**

---

### Scenario 3: Signing up separately with the same email doesn't merge two people

**Covers:** AC3

**Steps:**
1. Sign up for a brand-new account via email/password using an email address, e.g. `test@example.com`.
2. Separately, sign up for another brand-new account via Google, using a Google account whose email also happens to be `test@example.com`.
3. Log in as each account in turn.

**Expected outcome:**
> These are two completely separate accounts with separate data — signing up with the same email through different sign-in methods does not automatically combine them.

**Result:** [ ] Pass [ ] Fail
**Notes:**

---

### Edge case: Trying to link an account that's already linked to someone else

**Covers:** AC4

**Steps:**
1. Confirm a Google account is already linked to Person B's account (from Scenario 1's setup or similar).
2. Log in as a different person, Person A.
3. Try to link that same Google account to Person A.

**Expected outcome:**
> You see a clear error message saying that account is already linked elsewhere. Nothing changes for either Person A's or Person B's account.

**Result:** [ ] Pass [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
