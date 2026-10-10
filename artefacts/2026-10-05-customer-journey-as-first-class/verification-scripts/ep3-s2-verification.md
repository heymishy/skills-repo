# AC Verification Script: Journey health indicators: per-stage health state and summary bar

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep3-s2.md
**Technical test plan:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep3-s2-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a journey's canvas page (`/journeys/<id>`) for a journey with at least 2-3 stages, ideally with a mix of: a stage with a feature mapped and a metric key selected, a stage with a feature mapped but no metric key selected, and a stage with no feature mapped at all (use `ep2-s2`'s "Map feature"/"Save mapping" flow to set these up if needed).

**Reset between scenarios:** Reload the canvas page between scenarios.

---

## Scenarios

---

### Scenario 1: A stage with full coverage shows the ✅ health indicator

**Covers:** AC1, AC5

**Steps:**
1. Look at a stage that has a feature mapped with at least one metric key selected.

**Expected outcome:**
> The stage card shows a green check icon with a visible or screen-reader-accessible label describing it as covered/healthy — not a bare icon with no label.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A stage with a feature mapped but no metrics shows the ⚠️ health indicator

**Covers:** AC2, AC5

**Steps:**
1. Look at a stage with a feature mapped but zero metric keys selected on that mapping.

**Expected outcome:**
> The stage card shows a warning icon with an accessible label distinct from Scenario 1's.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A stage with no mapped features shows the ❌ health indicator

**Covers:** AC3, AC5

**Steps:**
1. Look at a stage with no features mapped at all.

**Expected outcome:**
> The stage card shows a close/X icon with an accessible label distinct from the other two.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The summary bar shows the correct coverage count

**Covers:** AC4

**Steps:**
1. Look at the summary bar near the top of the canvas.

**Expected outcome:**
> It shows the exact text "X of Y stages have metric coverage" where X matches the number of ✅ stages observed in Scenarios 1-3 and Y matches the total stage count.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Saving a mapping immediately updates the health indicator

**Covers:** AC6

**Steps:**
1. Find a ❌ stage (no features mapped). Click "Map feature", select a feature, select a metric key, click "Save mapping".

**Expected outcome:**
> The page reloads automatically (no manual refresh needed) and that stage now shows ✅, with the summary bar's count updated accordingly.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — ✅ full coverage | | |
| Scenario 2 — ⚠️ features, no metrics | | |
| Scenario 3 — ❌ no features | | |
| Scenario 4 — summary bar count | | |
| Scenario 5 — save triggers reload + update | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
