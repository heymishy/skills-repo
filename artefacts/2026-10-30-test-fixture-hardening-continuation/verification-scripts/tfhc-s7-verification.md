# AC Verification Script: Extract a shared mockReq/mockRes fixture module for journeys.js tests

**Story reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s7-journeys-js-fixture-walking-skeleton.md
**Technical test plan:** artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s7-journeys-js-fixture-walking-skeleton-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the repo root.
2. No server needs to be running — these checks run against test files and scripts directly.

**Reset between scenarios:** None needed.

---

## Scenarios

### Scenario 1: The new shared fixture module exists and produces the right default

**Covers:** AC1

**Steps:**
1. Open `tests/helpers/journeys-fixture.js`.
2. Read the default session object the factory function returns.

**Expected outcome:**
> The default session has one field, `tenantId`, set to a non-empty value. There is no `csrfToken`, `accessToken`, `login`, `userId`, or `role` field in the default — `journeys.js`'s own real code only ever reads `tenantId` from the session.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The self-test confirms the fixture's shape is grounded in the real code, and that overrides work

**Covers:** AC2

**Steps:**
1. Run `node tests/check-journeys-fixture-self-test.js`.

**Expected outcome:**
> All test cases print `PASS`, with a final line reading something like `X passed, 0 failed`. No `FAIL` lines.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The proof-of-pattern migration doesn't break anything

**Covers:** AC3

**Steps:**
1. Run `node tests/check-ep3-s2-journey-health.js` before any change — note the pass count.
2. After the file is migrated to use the shared fixture, run it again.

**Expected outcome:**
> Both runs show exactly `6 passed, 0 failed` — identical results before and after the migration. Nothing about the test's own behaviour changed, only how it builds its test request object.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The structural check correctly tells apart hand-rolled vs. shared-fixture files

**Covers:** AC4

**Steps:**
1. Run `node scripts/check-journeys-fixture-usage.js tests/fixtures/tfhc-s7-hand-rolled-mockreq.js`.
2. Run `node scripts/check-journeys-fixture-usage.js tests/fixtures/tfhc-s7-shared-fixture-usage.js`.

**Expected outcome:**
> Step 1 fails (non-zero exit) and prints a message naming `tests/helpers/journeys-fixture.js` as the fix. Step 2 succeeds (exit 0) with no complaints.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: A hand-rolled journeys.js session literal now shows up as its own finding category in /review

**Covers:** AC5

**Steps:**
1. Open `skills/review/SKILL.md`.
2. Look at the very first part of the file (Step 1's announcement line) and search for the text that says how many review categories exist.
3. Search further down for the `rssp-s1` instruction line that also mentions the category count.

**Expected outcome:**
> Both places say "8 categories (A-H)" — not one place saying 8 and the other still saying 7. There is also a new "Category H: journeys.js fixture hygiene" section further down the file.

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
| Scenario 5 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
