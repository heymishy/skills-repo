# AC Verification Script: Login role resolution is scoped by person, not just tenant

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s7.md
**Technical test plan:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s7-person-scoped-login-resolution-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:**
1. Have a shared tenant set up with one admin and at least one teammate holding a different role (per tir-s3).

**Reset between scenarios:** No reset needed.

---

## Scenarios

---

### Scenario 1: Each person on a shared team sees their own access level, not someone else's

**Covers:** AC1, AC2

**Steps:**
1. Log in as the admin on a shared team.
2. Confirm you see admin-level access.
3. Log out, log in as the non-admin teammate.
4. Confirm you see that teammate's own (non-admin) access level.

**Expected outcome:**
> Each person sees exactly their own assigned access level — the admin sees admin access, the teammate sees theirs — never each other's, no matter who logged in first or most recently.

**Result:** [ ] Pass [ ] Fail
**Notes:**

---

### Scenario 2: Solo accounts are unaffected

**Covers:** AC3

**Steps:**
1. Log in as a solo (single-person) account.

**Expected outcome:**
> Access works exactly as it did before — no visible change for solo accounts.

**Result:** [ ] Pass [ ] Fail
**Notes:**

---

### Edge case: A completely new sign-in still works

**Covers:** AC4

**Steps:**
1. Log in with a brand-new identity that has never been seen before (e.g. a fresh GitHub account not on any allowlist).

**Expected outcome:**
> Login succeeds normally with standard (non-admin) access — no error, no crash.

**Result:** [ ] Pass [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
