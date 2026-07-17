# AC Verification Script: Render aggregate AC coverage on the product rollup view

**Story reference:** artefacts/2026-07-16-product-rollup/stories/pr-s6.md
**Technical test plan:** artefacts/2026-07-16-product-rollup/test-plans/pr-s6-test-plan.md
**Script version:** 1
**Verified by:** _______________ | **Date:** _______________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to a synced product with a mix of features — some with real AC-verification data, ideally one feature that hasn't reached `/definition-of-ready` yet (no AC data).

**Reset between scenarios:** None needed.

---

## Scenarios

---

### Scenario 1: The product shows one overall AC-coverage percentage

**Covers:** AC1

**Steps:**
1. Go to a synced product's page with multiple features that have AC-verification data.

**Expected outcome:**
> You see a single AC-coverage percentage for the whole product (e.g. "75% AC coverage").

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Features with no AC data don't unfairly drag the number down

**Covers:** AC2

**Steps:**
1. Note the product's overall AC-coverage percentage.
2. Ask the implementer to confirm which features (if any) haven't reached `/definition-of-ready` yet.

**Expected outcome:**
> The percentage reflects only the features that actually have AC data — a feature still in early discovery doesn't make the product's number look artificially worse.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: AC coverage and test coverage are clearly labelled as different things

**Covers:** AC3

**Steps:**
1. Look at both the test-coverage and AC-coverage numbers on the same page.

**Expected outcome:**
> Each number has its own clear label (e.g. "Test coverage" and "AC coverage") — you can't mistake one for the other.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A product with no AC data anywhere shows a clear message, not a broken number

**Covers:** AC4

**Steps:**
1. Go to a product where none of its features have reached the point where ACs are verified yet.

**Expected outcome:**
> You see a message like "No AC data yet" — not "0%" and not "NaN" or a blank/broken-looking number.

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
