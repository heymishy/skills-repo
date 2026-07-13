# AC Verification Script: Bulk-add fetches real GitHub org members, not the admin's own org memberships

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s8.md
**Technical test plan:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s8-real-org-members-fetch-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:**
1. Have an admin account connected to a real GitHub org with at least 2-3 members who have already logged into the platform once.

**Reset between scenarios:** No reset needed.

---

## Scenarios

---

### Scenario 1: Bulk-add now actually adds real teammates

**Covers:** AC1, AC3

**Steps:**
1. Log in as the admin.
2. Click "Bulk-add from GitHub org".
3. Check the team list.

**Expected outcome:**
> The real members of your GitHub org (not the org itself) now appear in your team list with the "Engineer" role. Previously, this action silently added nobody — now it works.

**Result:** [ ] Pass [ ] Fail
**Notes:**

---

### Scenario 2: Large orgs are fully processed

**Covers:** AC4

**Steps:**
1. Bulk-add from a GitHub org with more members than fit on one page (if available in your test org; otherwise skip and rely on the automated test).

**Expected outcome:**
> All members are added, not just the first page's worth.

**Result:** [ ] Pass [ ] Fail
**Notes:**

---

### Edge case: You still can't target someone else's org

**Covers:** Security NFR

**Steps:**
1. Attempt to manipulate the bulk-add request (if you have the technical means) to specify a different org name than your own.

**Expected outcome:**
> The request is ignored or rejected — bulk-add only ever operates on your own connected org, never one you specify.

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
