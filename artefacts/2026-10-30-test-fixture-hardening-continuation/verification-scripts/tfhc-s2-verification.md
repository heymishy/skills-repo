# AC Verification Script: Migrate a bounded batch of hand-rolled journey.js test files to the shared fixture

**Story reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s2-journey-js-fixture-retrofit-batch.md
**Technical test plan:** artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s2-journey-js-fixture-retrofit-batch-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the repo root.
2. No server needs to be running — these are plain command-line checks (`node ...`), not browser-based.

**Reset between scenarios:** None needed — each scenario is independent.

---

## Scenarios

### Scenario 1: The migrated files still pass all their own checks

**Covers:** AC1

**Steps:**
1. Run each migrated file individually, e.g.: `node tests/check-<migrated-file>.js` (repeat for every file in the batch — the implementer will tell you which 3-5 files were chosen).

**Expected outcome:**
> Each file prints a result ending in something like "X passed, 0 failed" and exits without an error — the same result it gave before this change.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The migrated files no longer get flagged as "hand-rolling" their own setup

**Covers:** AC2

**Steps:**
1. Run: `node scripts/check-journey-fixture-usage.js <migrated-file>` for each file in the batch.

**Expected outcome:**
> No warning or finding is printed for any migrated file — a clean "no issues found" result for each one.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Nothing else in the test suite broke

**Covers:** AC3

**Steps:**
1. Run: `npm test`

**Expected outcome:**
> The full test run completes and reports the same overall pass/fail numbers as before this change — no new failures anywhere in the suite.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Fewer files are flagged than before the migration

**Covers:** AC4

**Steps:**
1. Before the migration starts, someone records how many `journey.js` test files get flagged by `scripts/check-journey-fixture-usage.js` (16, going in).
2. After the migration, run the same check sweep again.

**Expected outcome:**
> The number flagged after migration is lower than before by exactly the number of files migrated — landing somewhere between 11 and 13 if 3-5 files were migrated.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Scenario 4 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
