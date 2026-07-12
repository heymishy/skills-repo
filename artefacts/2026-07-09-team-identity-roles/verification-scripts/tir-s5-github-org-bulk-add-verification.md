# AC Verification Script: An admin bulk-adds teammates from their connected GitHub org

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s5.md
**Technical test plan:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s5-github-org-bulk-add-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:**
1. Have an admin account whose GitHub login is connected to a GitHub org with a few members.
2. Have the team management page open.

**Reset between scenarios:** No reset needed unless testing the re-run scenario, which builds on Scenario 1.

---

## Scenarios

---

### Scenario 1: Bulk-adding your GitHub org's members

**Covers:** AC1, AC2

**Steps:**
1. Log in as the admin.
2. On the team management page, click "Bulk-add from GitHub org".
3. Check the team list.
4. Log out, then log in as one of the newly-added members (via GitHub).

**Expected outcome:**
> Every member of your GitHub org who wasn't already on the team appears in the team list with the "Engineer" role. When you log in as one of them, they see Engineer-level access on the team, exactly like someone added one at a time.

**Result:** [ ] Pass [ ] Fail
**Notes:**

---

### Scenario 2: Running bulk-add twice doesn't cause duplicates or overwrite changes

**Covers:** AC3

**Steps:**
1. Go to the team list and manually change one bulk-added member's role to "Product".
2. Log in as the admin again and click "Bulk-add from GitHub org" a second time.
3. Check the team list.

**Expected outcome:**
> No one appears twice in the list. The person you changed to "Product" is still "Product" — bulk-add did not reset them back to "Engineer".

**Result:** [ ] Pass [ ] Fail
**Notes:**

---

### Edge case: Bulk-add fails clearly if permission is missing

**Covers:** AC4

**Steps:**
1. This typically requires simulating a GitHub connection without organization-read permission (an engineer may need to set this up in a test environment).
2. Attempt bulk-add in that state.

**Expected outcome:**
> You see a clear message explaining the missing permission — not a blank/silent failure, and not a crash or broken page.

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
