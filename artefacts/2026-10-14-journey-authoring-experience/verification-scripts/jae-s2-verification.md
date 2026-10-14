# AC Verification Script: Collapse stage creation into one guided action

**Story reference:** artefacts/2026-10-14-journey-authoring-experience/stories/jae-s2.md
**Technical test plan:** artefacts/2026-10-14-journey-authoring-experience/test-plans/jae-s2-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open any existing journey's canvas page.

**Reset between scenarios:** Close any open panel between scenarios.

---

## Scenarios

### Scenario 1: The panel opens on its own after naming a new stage

**Covers:** AC1

**Steps:**
1. Click "+ Add stage."
2. Type a name, e.g. "Post-purchase support."
3. Press Tab (or click elsewhere) to save the name.

**Expected outcome:**
> The stage edit panel slides open on the right by itself — you do not need to find or click "Edit stage."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Typing starts immediately in the right place

**Covers:** AC2

**Steps:**
1. Repeat Scenario 1's steps 1-3.
2. Without clicking anywhere, start typing.

**Expected outcome:**
> Your typing appears in the "Description" field — it was already focused when the panel opened.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Closing the panel right away still leaves the stage saved

**Covers:** AC3

**Steps:**
1. Repeat Scenario 1's steps 1-3.
2. Immediately press Escape (don't type anything in the panel).

**Expected outcome:**
> The panel closes. The new stage still shows its name in the list/grid — it was never "incomplete" or lost just because you didn't fill anything else in.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Staying on the same view, no page reload

**Covers:** AC4

**Steps:**
1. Switch to the "Customer experience" tab.
2. Click "+ Add stage," name it, save.

**Expected outcome:**
> You're still on "Customer experience" after the panel opens — you were not bounced back to "Canvas," and the page did not visibly reload/flash.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: A previous stage's error message never carries over to a new one

**Covers:** AC5

**Steps:**
1. Open an existing stage's edit panel, disconnect your network (or use browser dev tools to block the request), type into a field and tab away so the save fails. You should see "Failed to save — Retry."
2. Reconnect, close the panel.
3. Click "+ Add stage," name a brand-new stage, save it.

**Expected outcome:**
> The newly-opened panel shows no leftover "Failed to save" (or "Saved") message from the previous stage — it starts clean, with no save status shown, since nothing has been saved or failed for this stage yet.

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
| Scenario 5 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
