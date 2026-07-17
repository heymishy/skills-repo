# AC Verification Script: Show last-synced freshness and a manual refresh action

**Story reference:** artefacts/2026-07-16-product-rollup/stories/pr-s3.md
**Technical test plan:** artefacts/2026-07-16-product-rollup/test-plans/pr-s3-test-plan.md
**Script version:** 1
**Verified by:** _______________ | **Date:** _______________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to a product that has already been synced at least once (from pr-s2's own testing), and a second product that has never been synced.
2. Have access to trigger a Refresh action on the product's page.

**Reset between scenarios:** None needed for Scenarios 1–2. For Scenario 3, use the never-synced product specifically.

---

## Scenarios

---

### Scenario 1: The page shows when the product was last synced

**Covers:** AC1

**Steps:**
1. Go to a product that has already been synced.

**Expected outcome:**
> You see text like "Last synced 2 hours ago" (or similar relative time) near the rollup — not a raw date/time code, not blank.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Clicking Refresh updates the data and the timestamp

**Covers:** AC2

**Steps:**
1. Note the current last-synced time and the current rollup numbers shown.
2. Click "Refresh."
3. Wait for it to finish.

**Expected outcome:**
> The last-synced time updates to "just now" (or similar). If anything changed in the connected repo since the last sync, the rollup numbers update to match. If nothing changed, the numbers stay the same but the timestamp still updates.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A never-synced product shows a clear "not yet synced" state

**Covers:** AC3

**Steps:**
1. Go to a product that has never been synced.

**Expected outcome:**
> Instead of a timestamp, you see a clear message like "Not yet synced," along with a button or link to trigger the first sync.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Refresh shows a loading state and can't be clicked twice at once

**Covers:** AC4

**Steps:**
1. Click "Refresh."
2. Immediately try clicking it again before it finishes.

**Expected outcome:**
> After the first click, you see a loading indicator and the Refresh button becomes disabled (greyed out or unclickable) until the sync finishes. The second click does nothing while it's disabled.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
