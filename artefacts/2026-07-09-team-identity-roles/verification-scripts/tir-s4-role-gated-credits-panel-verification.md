# AC Verification Script: The admin/credits panel is gated by per-person role, not tenant membership

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s4.md
**Technical test plan:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s4-role-gated-credits-panel-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:**
1. Have a team set up with one admin and at least one non-admin teammate sharing the same tenant (per tir-s3).
2. Also have a solo (single-person) admin account for the regression check.

**Reset between scenarios:** No reset needed.

---

## Scenarios

---

### Scenario 1: A non-admin teammate cannot reach the admin/credits panel

**Covers:** AC1

**Steps:**
1. Log in as the non-admin teammate.
2. Try to reach the admin/credits panel.

**Expected outcome:**
> You are denied ("Forbidden") — even though you're on the same team/tenant as an admin, you cannot see the credits panel.

**Result:** [ ] Pass [ ] Fail
**Notes:**

---

### Scenario 2: The admin can still reach the panel

**Covers:** AC2

**Steps:**
1. Log in as the admin from Scenario 1's team.
2. Go to the admin/credits panel.

**Expected outcome:**
> The panel loads normally — admin access still works.

**Result:** [ ] Pass [ ] Fail
**Notes:**

---

### Scenario 3: A solo account's admin access is unaffected

**Covers:** AC3

**Steps:**
1. Log in as a solo (single-person) account with admin access.
2. Go to the admin/credits panel.

**Expected outcome:**
> The panel loads exactly as it did before this change — no difference for solo accounts.

**Result:** [ ] Pass [ ] Fail
**Notes:**

---

### Edge case: Ambiguous access defaults to denied, not granted

**Covers:** AC4

**Steps:**
1. This scenario typically requires an engineer to simulate a broken/missing role state (e.g. via a test tool or by clearing part of the session).
2. Attempt to reach the admin/credits panel in that state.

**Expected outcome:**
> Access is denied — the system never grants access when it's unsure of your role.

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
