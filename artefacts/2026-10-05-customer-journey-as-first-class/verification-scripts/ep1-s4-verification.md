# AC Verification Script: Drag-and-drop stage reorder with keyboard alternative

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep1-s4.md
**Technical test plan:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep1-s4-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Log in to the app and open a journey canvas that already has at least 3 stages (create them first via "+ Add stage" if needed, naming them e.g. "Discover", "Compare", "Buy").
2. Have the browser's developer tools network tab open if you want to confirm a request fires (optional — not required to judge pass/fail).

**Reset between scenarios:** Reload the journey canvas page between scenarios so the stage order starts from a known state ("Discover", "Compare", "Buy").

---

## Scenarios

### Scenario 1: Dragging a stage card to a new position reorders the stages for real

**Covers:** AC1

**Steps:**
1. Click and hold on the "Discover" stage card.
2. Drag it down past "Compare" and "Buy", then release (drop) it at the end of the list.
3. Reload the page.

**Expected outcome:**
> After dropping, the stage cards immediately show the new order: "Compare", "Buy", "Discover". After reloading the page, the order is still "Compare", "Buy", "Discover" — the new order was saved, not just a visual-only change.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A reorder that fails to save reverts and shows an error

**Covers:** AC2

**Steps:**
1. Turn off your network connection (or ask the person running this with you to simulate a failed save — e.g. a developer intercepting the request).
2. Drag the "Compare" stage card to the end of the list and drop it.

**Expected outcome:**
> The cards briefly show the new order, then snap back to the original order ("Discover", "Compare", "Buy"). A message appears on screen reading exactly: "Stage order not saved — please try again".

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Reordering stages without dragging, using buttons

**Covers:** AC3

**Steps:**
1. Find the up/down arrow buttons on the "Buy" stage card (the last one in the list).
2. Click the up arrow on "Buy" twice.
3. Reload the page.

**Expected outcome:**
> "Buy" moves up one position each click, ending up first in the list ("Buy", "Discover", "Compare"). After reloading, the order is still "Buy", "Discover", "Compare". The first stage in the list never shows an up arrow you can click (it's greyed out/disabled), and the last stage never shows a clickable down arrow.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The visual order always matches the saved order

**Covers:** AC4

**Steps:**
1. After completing Scenario 1 or Scenario 3 successfully, reload the page one more time.

**Expected outcome:**
> The stage cards appear in exactly the order you last saved — no stage appears out of place, duplicated, or missing.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A journey with only one stage shows no reorder controls

**Covers:** AC3 (boundary)

**Steps:**
1. Open (or create) a journey with exactly one stage.
2. Look at that stage's card.

**Expected outcome:**
> No up/down arrow buttons appear on the card at all — there's nothing to reorder against.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (drag reorders and saves) | | |
| Scenario 2 (failed save reverts + error shown) | | |
| Scenario 3 (keyboard/button reorder) | | |
| Scenario 4 (visual order matches saved order) | | |
| Edge case (single stage, no controls) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
