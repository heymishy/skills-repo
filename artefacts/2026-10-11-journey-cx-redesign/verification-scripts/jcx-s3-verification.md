# AC Verification Script: Connected emotion curve across stages on the Customer experience tab

**Story reference:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s3.md
**Technical test plan:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s3-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a journey with 3+ stages on the Customer experience tab.

**Reset between scenarios:** Reload the page.

---

## Scenarios

---

### 🔴 Scenario 1: The curve tracks emotion up and down across stages

**Covers:** AC1

**Steps:**
1. Set 3 stages to negative, neutral, and positive emotion (in that order).
2. Open the Customer experience tab.

**Expected outcome:**
> You can see a line connecting the 3 stages, with the negative one lowest, the neutral one in the middle, and the positive one highest — like a real emotion curve, not a flat line.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### 🔴 Scenario 2: A stage with no emotion set shows clearly on the curve, not silently skipped

**Covers:** AC2

**Steps:**
1. Set the first and third stages' emotion, leave the middle one blank.
2. Open the tab.

**Expected outcome:**
> The middle stage shows an obvious "no data yet" marker on the curve — it doesn't just vanish, and it doesn't pretend to have a real emotion value.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### 🔴 Scenario 3: A journey with no emotion data at all shows a friendly empty state

**Covers:** AC3

**Steps:**
1. Use a journey where none of the stages have emotion set.
2. Open the tab.

**Expected outcome:**
> Instead of a blank space or a broken-looking line, you see a clear message inviting you to add emotion data.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Every curve point has a readable label, not just a colour

**Covers:** AC4

**Steps:**
1. Hover or look closely at each point on the curve.

**Expected outcome:**
> Each point shows a text label (e.g. "positive") — you don't have to guess from colour alone.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — curve tracks emotion 🔴 | | |
| Scenario 2 — missing-data stage marked clearly 🔴 | | |
| Scenario 3 — full empty state 🔴 | | |
| Scenario 4 — text label on every point | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
