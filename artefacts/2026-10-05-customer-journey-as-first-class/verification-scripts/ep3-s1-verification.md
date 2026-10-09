# AC Verification Script: Customer experience view: emotion, pain points, opportunities annotation rows

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep3-s1.md
**Technical test plan:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep3-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a journey's canvas page (`/journeys/<id>`) for a journey that has at least one stage with emotion/pain points/opportunities already set (via `ep1-s3`'s own stage side panel — click "Edit stage" to set them if none exist), and ideally a second stage with none of those three set.

**Reset between scenarios:** Reload the canvas page between scenarios.

---

## Scenarios

---

### Scenario 1: Switching to the Customer experience view shows emotion, pain points, and opportunities

**Covers:** AC1, AC4

**Steps:**
1. Click the "Customer experience" view toggle button above the canvas.
2. Look at a stage card that has emotion/pain points/opportunities set.

**Expected outcome:**
> An annotation row appears below the stage card showing: a coloured emotion chip WITH the emotion's text label (e.g. "positive" — not just a coloured dot), the pain points text, and the opportunities text.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A stage with nothing set shows "Not set" for all three rows

**Covers:** AC2

**Steps:**
1. Stay in the Customer experience view.
2. Look at a stage card with no emotion, pain points, or opportunities set.

**Expected outcome:**
> All three annotation rows are visible, each showing the exact text "Not set" — none of the three rows is hidden or missing.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Switching views toggles the annotation rows without a page reload

**Covers:** AC3

**Steps:**
1. With a stage's Customer experience annotations visible, open browser dev tools to the Network tab.
2. Click "Canvas", then "Delivery", then back to "Customer experience".

**Expected outcome:**
> Each click instantly shows/hides the Customer experience annotation rows (visible only in that view) with NO new network request fired. Delivery view's own annotation rows (from `ep2-s3`) continue to work correctly alongside this story's own rows — the two view modes don't interfere with each other.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — emotion chip + label, pain points, opportunities | | |
| Scenario 2 — "Not set" for all three | | |
| Scenario 3 — view toggle, no network request, no interference with Delivery view | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
