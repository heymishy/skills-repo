# AC Verification Script: Invite acceptance is blocked if the tenant is at its member-count cap

**Story reference:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s4-member-count-cap.md
**Technical test plan:** artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s4-member-count-cap-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Use a trial-tier test tenant with a small enough cap to reach in practice (or adjust the count directly in a test database).

**Reset between scenarios:** Remove test members between scenarios to reset the count.

---

## Scenarios

---

### Scenario 1: A full team blocks a new invite acceptance

**Covers:** AC1, AC4

**Steps:**
1. Fill the tenant up to its trial-plan member cap.
2. Send one more invite, then try to accept it (as a new person).

**Expected outcome:**
> The join is blocked with a clear "member limit reached" message. The invitee is not added. Trying again later (after freeing a spot) with the SAME invite should still work — it wasn't consumed by the failed attempt.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A team below its cap works normally

**Covers:** AC2

**Steps:**
1. With a team well below its cap, send and accept an invite.

**Expected outcome:**
> Works exactly as before — no cap-related error.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Paid tenants get a higher cap

**Covers:** AC3

**Steps:**
1. Compare a trial tenant's cap against a paid tenant's cap (e.g. by filling each up and confirming where the block occurs).

**Expected outcome:**
> The paid tenant can have noticeably more members before hitting its own cap than the trial tenant can.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (AC1, AC4) | | |
| Scenario 2 (AC2) | | |
| Edge case (AC3) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
