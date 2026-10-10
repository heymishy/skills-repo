# AC Verification Script: Keyboard-accessible node movement (WCAG 2.1 AA)

**Story reference:** artefacts/2026-10-10-infinite-canvas/stories/ic-s4.md
**Technical test plan:** artefacts/2026-10-10-infinite-canvas/test-plans/ic-s4-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a journey with 2+ stages on the Canvas tab.
2. **Put your mouse away for this entire script.**

**Reset between scenarios:** Reload the page.

---

## Scenarios

---

### 🔴 Scenario 1: You can focus a node with Tab, and see that it's focused

**Covers:** AC1a

**Steps:**
1. Press the Tab key repeatedly until a stage node appears highlighted.

**Expected outcome:**
> You can clearly see which node is focused — a visible outline or highlight, not something invisible you have to guess at.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Arrow keys move the focused node

**Covers:** AC1b, AC5

**Steps:**
1. With a node focused, press the right arrow key once.
2. Press it three more times.

**Expected outcome:**
> The node moves a small step to the right each time you press the key — four presses move it noticeably further than one.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### 🔴 Scenario 3: Tab moves between nodes and off the canvas, never gets stuck

**Covers:** AC2

**Steps:**
1. Press Tab repeatedly, past every node on the canvas, and keep going.
2. Press Shift+Tab repeatedly to go back.

**Expected outcome:**
> Focus moves from node to node, then moves on to whatever comes after the canvas on the page (don't get stuck cycling only through the canvas's own nodes forever).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### 🔴 Scenario 4: The whole thing works with no mouse at all

**Covers:** AC3

**Steps:**
1. Using only the keyboard: Tab to a node, move it with arrow keys.
2. Reload the page.

**Expected outcome:**
> The node you moved is still in its new position after reloading — the entire flow worked without ever touching the mouse.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Keyboard and mouse movement agree with each other

**Covers:** AC4

**Steps:**
1. Drag a node with the mouse to a new spot and note roughly where it is.
2. Reload. Confirm it's still there.
3. Now use the keyboard to move that same node a little further.
4. Reload again.

**Expected outcome:**
> Both the mouse-dragged position and the keyboard-moved position persist correctly — there's no separate "keyboard position" that conflicts with the "mouse position."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — visible focus 🔴 | | |
| Scenario 2 — arrow keys move node | | |
| Scenario 3 — tab order, no trap 🔴 | | |
| Scenario 4 — full keyboard-only flow 🔴 | | |
| Edge case — keyboard/mouse agree | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
