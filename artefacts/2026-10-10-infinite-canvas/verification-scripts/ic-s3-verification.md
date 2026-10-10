# AC Verification Script: Canvas pan and zoom

**Story reference:** artefacts/2026-10-10-infinite-canvas/stories/ic-s3.md
**Technical test plan:** artefacts/2026-10-10-infinite-canvas/test-plans/ic-s3-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a journey with 2+ stages on the Canvas tab.

**Reset between scenarios:** Reload the page.

---

## Scenarios

---

### Scenario 1: Holding Ctrl and scrolling zooms the canvas

**Covers:** AC1

**Steps:**
1. Hold Ctrl and scroll your mouse wheel over the canvas.
2. Then scroll normally, without holding Ctrl.

**Expected outcome:**
> With Ctrl held, the canvas zooms in or out. Without Ctrl, scrolling does nothing to the canvas (the page itself doesn't scroll either, since the canvas fills the view).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Dragging empty space pans the canvas

**Covers:** AC2

**Steps:**
1. Click and drag an empty area of the canvas (not a node).

**Expected outcome:**
> The whole canvas view moves with your drag — nodes shift position on screen together, as if you're moving a camera, not dragging a node.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Pan/zoom resets when you reload

**Covers:** AC3

**Steps:**
1. Zoom in and pan to a different part of the canvas.
2. Reload the page.

**Expected outcome:**
> The canvas is back to its default view — not where you left it. (Unlike node positions from `ic-s2`, which DO stay where you left them.)

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Zooming the canvas doesn't scroll the whole page

**Covers:** AC4

**Steps:**
1. Scroll down the page slightly so the Canvas tab isn't at the very top.
2. Hold Ctrl and scroll over the canvas several times.

**Expected outcome:**
> Only the canvas zooms. The rest of the page (sidebar, header) does not scroll or shift.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — Ctrl+scroll zooms | | |
| Scenario 2 — drag empty space pans | | |
| Scenario 3 — resets on reload | | |
| Edge case — no page scroll leak | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
