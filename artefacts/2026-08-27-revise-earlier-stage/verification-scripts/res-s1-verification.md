# AC Verification Script: Reopen a completed stage's live session from the step-nav

**Story reference:** artefacts/2026-08-27-revise-earlier-stage/stories/res-s1-reopen-completed-stage-live-session.md
**Technical test plan:** artefacts/2026-08-27-revise-earlier-stage/test-plans/res-s1-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Start a journey through at least two outer-loop stages (e.g. complete Discovery, then move into Benefit Metric) so you have at least one completed, gate-confirmed stage to reopen.
2. Note the journey's URL — you'll return to it between scenarios.

**Reset between scenarios:** Refresh the journey page (`/journey/:id`) between scenarios to get a clean step-nav view.

---

## Scenarios

### Scenario 1: Clicking a completed stage's step-nav link opens its live chat

**Covers:** AC1

**Steps:**
1. On the journey page, find the step-nav entry for the stage you already completed (e.g. "Discovery") — it should show as done (checkmark or similar).
2. Click that stage's step-nav link.

**Expected outcome:**
> You land on a live chat page for that stage — you can see the conversation history from when you did that stage, and there's an active message box at the bottom where you can type. You are NOT taken to a plain read-only summary page with no message box.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Reopening a stage after its session has expired still works

**Covers:** AC2

**Steps:**
1. Reopen a completed stage whose session has gone stale (e.g. wait for the server to restart, or use a journey you haven't touched in a while).
2. Click that stage's step-nav link.

**Expected outcome:**
> You land on a live chat page for that stage. It may start as a fresh conversation, but the existing write-up from that stage (the artefact) is visible or referenced in context — the system hasn't lost your prior work, it just started a new conversation thread to let you continue from it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Reopening a stage doesn't disturb the journey's overall progress

**Covers:** AC3

**Steps:**
1. Before reopening, note which stages show as "done" in the step-nav, and the journey's current stage.
2. Reopen a completed stage (Scenario 1 or 2).
3. Go back to the main journey page.

**Expected outcome:**
> The same stages still show as "done" as before — nothing was un-done, nothing new was marked done, and the journey's current stage hasn't changed. Reopening an old stage to look at it or ask something didn't move your progress backward or forward.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Stages you haven't reached yet are unaffected

**Covers:** AC4

**Steps:**
1. Look at a stage further along in the step-nav that you haven't completed yet (e.g. still greyed out or marked "not started").
2. Try clicking it (if clickable at all).

**Expected outcome:**
> Nothing about this not-yet-reached stage's link or appearance in the step-nav has changed from before this feature — it behaves exactly as it always has.

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

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
