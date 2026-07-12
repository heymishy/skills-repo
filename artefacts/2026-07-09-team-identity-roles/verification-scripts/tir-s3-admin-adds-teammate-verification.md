# AC Verification Script: An admin adds a teammate by identity and assigns a role

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s3.md
**Technical test plan:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s3-admin-adds-teammate-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:**
1. Have an admin account for a tenant, and a second account (any role) that has logged in at least once.
2. Also have on hand an email address or identity that has never logged in, for the edge case.

**Reset between scenarios:** No reset needed between scenarios unless a role change from an earlier scenario would interfere with a later one.

---

## Scenarios

---

### Scenario 1: Admin adds a teammate and gives them a role

**Covers:** AC1, AC2

**Steps:**
1. Log in as the admin.
2. Go to the team management page and add the second account as a teammate with the role "Engineer".
3. Log out, then log in as that second account.

**Expected outcome:**
> The teammate can now log in and sees Engineer-level access — distinct from the admin's own access — within the same team/tenant.

**Result:** [ ] Pass [ ] Fail
**Notes:**

---

### Scenario 2: Only admins can add teammates

**Covers:** AC3

**Steps:**
1. Log in as a non-admin (e.g. the Engineer from Scenario 1).
2. Try to reach the add-teammate action (e.g. via the team management page, or directly hitting the same action).

**Expected outcome:**
> You are denied ("Forbidden") — only admins can add teammates or change roles.

**Result:** [ ] Pass [ ] Fail
**Notes:**

---

### Scenario 3: Adding the same teammate twice updates their role instead of duplicating them

**Covers:** AC4

**Steps:**
1. Log in as the admin.
2. Add the same teammate from Scenario 1 again, this time with the role "Product".
3. Check the team list.

**Expected outcome:**
> The teammate appears exactly once in the team list, now showing "Product" as their role — not twice.

**Result:** [ ] Pass [ ] Fail
**Notes:**

---

### Edge case: Trying to add someone who has never logged in

**Covers:** AC5

**Steps:**
1. Log in as the admin.
2. Try to add a teammate using an identity/email that has never logged into the platform before.

**Expected outcome:**
> You see a clear message explaining that person needs to log in at least once before they can be added — they are not silently added or half-created.

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
