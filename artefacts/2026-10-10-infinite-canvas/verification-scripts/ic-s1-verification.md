# AC Verification Script: Render journey stages as connected nodes on a drawflow canvas, replacing the linear list

**Story reference:** artefacts/2026-10-10-infinite-canvas/stories/ic-s1.md
**Technical test plan:** artefacts/2026-10-10-infinite-canvas/test-plans/ic-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a journey with at least 3 stages, one of which is flagged "Moment of truth".
2. Click the "Canvas" tab (not "Customer experience" or "Delivery").

**Reset between scenarios:** Reload the page.

---

## Scenarios

---

### Scenario 1: Stages render as connected nodes, not a list

**Covers:** AC1

**Steps:**
1. Open the Canvas tab.

**Expected outcome:**
> Each stage shows as a boxed "node" (not a row in a vertical list), arranged left-to-right in the same order they appear elsewhere in the app. A line connects each node to the next one in sequence.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Every existing stage action still works

**Covers:** AC2

**Steps:**
1. On any node, find the "Edit stage" link, "Map feature" button, and health indicator.
2. Click "Edit stage" and confirm the side panel opens as before.

**Expected outcome:**
> All three elements (Edit stage link, Map feature button, health indicator) appear on the node and work exactly as they did on the old list view — nothing is missing or broken.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Moment of truth badge still shows

**Covers:** AC3

**Steps:**
1. Find the node for the stage flagged "Moment of truth".

**Expected outcome:**
> That node shows the 🚩 flag badge. Other nodes do not.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Empty journey shows the same message as before

**Covers:** AC4

**Steps:**
1. Open a journey with 0 stages (or create a new one).
2. Click the Canvas tab.

**Expected outcome:**
> You see the text "No stages yet. Add your first stage." — not a blank or broken canvas.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Canvas library actually loads

**Covers:** AC5, AC6

**Steps:**
1. Open the browser's developer console before loading the Canvas tab.
2. Load the Canvas tab.

**Expected outcome:**
> No red error about a failed script load. If you deliberately block the `/vendor/drawflow.min.js` request (e.g. via dev tools network blocking) and reload, you see a clear, visible error — not a silently blank canvas.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — nodes, connected | | |
| Scenario 2 — existing actions preserved | | |
| Scenario 3 — moment of truth badge | | |
| Scenario 4 — empty state | | |
| Edge case — load failure is visible | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
