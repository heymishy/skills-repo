# AC Verification Script: Team-membership lookups stay indexed at ~100 members per tenant

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s6.md
**Technical test plan:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s6-schema-scale-validation-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:**
1. This story is mostly about behind-the-scenes database performance, not something you click through in the UI.
2. You'll need access to a real database connection (not the built-in test-mode fake) and someone who can run a seed script to create 100 test team members in one tenant.

**Reset between scenarios:** Clear the 100 seeded rows between scenarios if reusing the same tenant.

---

## Scenarios

---

### Scenario 1: Looking up someone's role stays fast even with a big team

**Covers:** AC1, AC2

**Steps:**
1. Have an engineer seed 100 test team members into one tenant.
2. Ask them to look up one specific person's role and time how long it takes.

**Expected outcome:**
> The lookup finishes in well under 50 milliseconds (essentially instant) — even with 100 people on the team.

**Result:** [ ] Pass [ ] Fail
**Notes:**

---

### Scenario 2: A small (solo) team isn't affected by this change

**Covers:** AC3

**Steps:**
1. Log in as a solo (single-person) account.
2. Confirm your role/access still works exactly as before.

**Expected outcome:**
> No noticeable change for a solo account — this change is specifically about handling large teams well, not about changing behaviour for small ones.

**Result:** [ ] Pass [ ] Fail
**Notes:**

---

### Edge case: Adding 100 people all at once doesn't slow things down

**Covers:** AC4

**Steps:**
1. Have an engineer bulk-add or seed 100 members into a team in one action.
2. Confirm the action completes without hanging or timing out.

**Expected outcome:**
> Adding 100 people at once finishes in a reasonable time — no noticeably worse than adding them one at a time would (scaled up).

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
