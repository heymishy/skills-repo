# AC Verification Script: Free node positioning persisted across reloads

**Story reference:** artefacts/2026-10-10-infinite-canvas/stories/ic-s2.md
**Technical test plan:** artefacts/2026-10-10-infinite-canvas/test-plans/ic-s2-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a journey with at least 2 stages on the Canvas tab.

**Reset between scenarios:** Reload the page.

---

## Scenarios

---

### 🔴 Scenario 1: Dragging a node keeps it where you drop it, even after reloading

**Covers:** AC1

**Steps:**
1. Click and drag any stage node to a clearly different, empty area of the canvas (not on top of another node).
2. Release the mouse.
3. Reload the page.

**Expected outcome:**
> The node stays exactly where you dropped it — not the default position, both immediately after the drop and after reloading the page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Stages you haven't dragged yet use the default layout

**Covers:** AC2

**Steps:**
1. Open a journey where no stage has ever been dragged.
2. Open the Canvas tab.

**Expected outcome:**
> Every stage shows at its default left-to-right position — not stacked on top of each other in one corner.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Dragging one stage doesn't move another

**Covers:** AC5

**Steps:**
1. Note the current position of two different stages.
2. Drag only one of them to a new position.
3. Reload the page.

**Expected outcome:**
> Only the stage you dragged moved. The other stage is exactly where it was before.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A failed save tells you, instead of staying silent

**Covers:** AC6

**Steps:**
1. Turn off your network connection (or use your browser's dev tools to block the save request).
2. Drag a node to a new position.

**Expected outcome:**
> You see a visible message telling you the save failed — you are not left thinking it worked when it didn't.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — drag persists across reload 🔴 | | |
| Scenario 2 — default layout for untouched stages | | |
| Scenario 3 — dragging one doesn't move another | | |
| Edge case — failed save is visible | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
