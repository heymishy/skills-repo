# AC Verification Script: Extend journeys.js/products.js fixture adoption and DRY-extract the fixture-usage-check scripts

**Story reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/stories/fhff-s3-mechanical-fixture-dry-batch.md
**Technical test plan:** artefacts/2026-11-01-fixture-hardening-fast-follows/test-plans/fhff-s3-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the repo root.
2. No server needs to be running.

**Reset between scenarios:** None needed.

---

## Scenarios

### Scenario 1: The newly-migrated journeys.js files still work the same as before

**Covers:** AC1

**Steps:**
1. Run `npm test`.
2. Find each of the 3-5 files that were migrated in this story.

**Expected outcome:**
> Each one shows the same number of passing checks as it did before the migration — nothing broke by switching to the shared fixture.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: products.js now has its own shared fixture, and one file already uses it

**Covers:** AC2

**Steps:**
1. Open the one `products.js`-touching file that was migrated.
2. Confirm it imports the new shared fixture instead of writing its own session object inline.
3. Run that file directly.

**Expected outcome:**
> The file passes, same as before migration.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The new products.js check correctly tells hand-rolled apart from shared

**Covers:** AC3

**Steps:**
1. Run the new structural check against a file that hand-rolls its own session object.
2. Run it against the migrated file.

**Expected outcome:**
> The hand-rolled file is flagged. The migrated file is not.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The 3 duplicate scripts are now 1 shared piece of logic, and nothing changed

**Covers:** AC4

**Steps:**
1. Run `npm test`.
2. Look for the existing tests that check the journey.js and journeys.js structural-check scripts.
3. Look for a new test checking the skills.js structural-check script the same way.

**Expected outcome:**
> All of them pass — the journey.js and journeys.js ones exactly as before, and the new skills.js one proves that script now has the same level of checking the other two always had.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: The specific journeys.js bug fix from before is still caught

**Covers:** AC5

**Steps:**
1. Open `tests/fixtures/tfhc-s7-hand-rolled-mockreq-session-not-first.js`.
2. Run the journeys.js structural check against it.

**Expected outcome:**
> It's still correctly flagged as hand-rolled, exactly as it was before this story's refactor.

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
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
