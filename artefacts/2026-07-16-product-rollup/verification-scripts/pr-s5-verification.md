# AC Verification Script: Render aggregate test coverage on the product rollup view

**Story reference:** artefacts/2026-07-16-product-rollup/stories/pr-s5.md
**Technical test plan:** artefacts/2026-07-16-product-rollup/test-plans/pr-s5-test-plan.md
**Script version:** 1
**Verified by:** _______________ | **Date:** _______________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to a synced product with a mix of features — some with real test-plan data (differing pass counts), and ideally one feature with no test-plan data yet.

**Reset between scenarios:** None needed.

---

## Scenarios

---

### Scenario 1: The product shows one overall test-coverage percentage

**Covers:** AC1

**Steps:**
1. Go to a synced product's page with multiple features that have test data.

**Expected outcome:**
> You see a single test-coverage percentage for the whole product (e.g. "87% test coverage").

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Features with no test data don't unfairly drag the number down

**Covers:** AC2

**Steps:**
1. Note the product's overall test-coverage percentage.
2. Ask the implementer to confirm which features (if any) have no test-plan data yet.

**Expected outcome:**
> The percentage reflects only the features that actually have test data — a brand-new feature with no tests yet does not make the whole product's number look artificially worse.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: You can see coverage per feature, not just the one overall number

**Covers:** AC3

**Steps:**
1. Look for a per-feature breakdown near or below the overall percentage.

**Expected outcome:**
> You can see each feature's own individual test-coverage percentage, not just the single blended number for the whole product.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A product with no test data anywhere shows a clear message, not a broken number

**Covers:** AC4

**Steps:**
1. Go to a product where none of its features have any test-plan data yet.

**Expected outcome:**
> You see a message like "No test data yet" — not "0%" and not "NaN" or a blank/broken-looking number.

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
