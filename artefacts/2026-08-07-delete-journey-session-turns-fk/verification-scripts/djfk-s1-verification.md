# AC Verification Script: Delete a journey's session_turns rows before the journey row, alongside artefacts

**Story reference:** artefacts/2026-08-07-delete-journey-session-turns-fk/stories/djfk-s1-delete-session-turns-before-journey.md
**Technical test plan:** artefacts/2026-08-07-delete-journey-session-turns-fk/test-plans/djfk-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a journey with at least one real conversation turn recorded (any completed skill session).
2. Run `npm test` first to confirm the automated suite passes before doing manual verification.

**Reset between scenarios:** Use a fresh journey per scenario.

---

## Scenarios

---

### Scenario 1: Deleting a journey with recorded turns now works

**Covers:** AC1

**Steps:**
1. Start a session and complete at least one turn of conversation.
2. Delete that journey.

**Expected outcome:**
> The journey deletes successfully — no error page, no server error. It's gone from the dashboard.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Deleting a journey with no turns still works exactly as before

**Covers:** AC2

**Steps:**
1. Create a journey and delete it immediately, before any conversation turn happens.

**Expected outcome:**
> Deletes cleanly, same as always.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
