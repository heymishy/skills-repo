# AC Verification Script: Add a dedicated self-test for the shared journey.js fixture module

**Story reference:** artefacts/2026-10-29-test-suite-infra-refactor/stories/tsir-s2-fixture-module-self-test.md
**Technical test plan:** artefacts/2026-10-29-test-suite-infra-refactor/test-plans/tsir-s2-fixture-module-self-test-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the repo root.
2. `tsir-s1` (the shared fixture module) must already be implemented — this story builds on it.

**Reset between scenarios:** None needed.

---

## Scenarios

### Scenario 1: The self-test checks the fixture against the real fields journey.js needs

**Covers:** AC1

**Steps:**
1. Run: `node tests/check-journey-fixture-self-test.js`

**Expected outcome:**
> Prints a list of passing checks, including one that explicitly checks the fixture's default fields (`login`, `tenantId`, `accessToken`, `userId`, `role`) against the real route file, ending "X passed, 0 failed".

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A real break in the shared fixture makes the self-test fail (not silently pass)

**Covers:** AC2 — **this is the one scenario in this story that must be done manually, by design (see test plan's Coverage gaps note)**

**Steps:**
1. Open `tests/helpers/journey-fixture.js` and temporarily change the default `tenantId` value to an empty string `''`.
2. Run: `node tests/check-journey-fixture-self-test.js`
3. Undo the change from step 1 (restore the original default value) — check `git diff tests/helpers/journey-fixture.js` shows no leftover change before moving on.
4. Run: `node tests/check-journey-fixture-self-test.js` again to confirm it's back to passing.

**Expected outcome:**
> After step 2: the self-test fails with a message pointing at the tenantId/empty-string problem — it does NOT silently pass. After step 4 (change undone): the self-test passes again, "X passed, 0 failed".

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The self-test's own file doesn't do anything slow or risky (no network, no file writes)

**Covers:** AC3

**Steps:**
1. Open `tests/check-journey-fixture-self-test.js` in an editor.
2. Read through it looking for: any call that sends something over the network, any call that writes to a file, or any variable declared outside a function that gets changed while tests run.

**Expected outcome:**
> None of those three things appear anywhere in the file.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Overriding one field in the self-test leaves the others at their defaults

**Covers:** AC4

**Steps:**
1. Run: `node tests/check-journey-fixture-self-test.js` and look for the specific test case covering an override.

**Expected outcome:**
> That specific test case passes, and its name/output makes clear it checked that overriding one field (e.g. `tenantId`) didn't change the other default fields.

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
