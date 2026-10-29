# AC Verification Script: Extract a shared mockReq/mockRes fixture module for skills.js tests

**Story reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s3-skills-js-fixture-walking-skeleton.md
**Technical test plan:** artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s3-skills-js-fixture-walking-skeleton-test-plan.md
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

### Scenario 1: The shared fixture provides every field skills.js actually needs by default

**Covers:** AC1

**Steps:**
1. Run: `node -e "const {skillsFixture}=require('./tests/helpers/skills-fixture'); console.log(JSON.stringify(skillsFixture().session))"`

**Expected outcome:**
> A single line of JSON prints showing a `session` object with five fields filled in: `tenantId`, `accessToken`, `userId`, `login`, `role`. None of these five are missing, empty strings, or `null`.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The dedicated self-test for the fixture passes

**Covers:** AC2

**Steps:**
1. Run: `node tests/check-skills-fixture-self-test.js`

**Expected outcome:**
> The command prints a result ending in something like "X passed, 0 failed" and exits without an error.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: An existing check still works correctly after switching to the shared fixture

**Covers:** AC3

**Steps:**
1. Run: `node tests/check-dic1-story-cards.js`

**Expected outcome:**
> The command prints a result ending in "X passed, 0 failed" — the same result it gave before this change.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The new check correctly tells apart old-style and new-style test files

**Covers:** AC4

**Steps:**
1. Run: `node scripts/check-skills-fixture-usage.js tests/fixtures/tfhc-s3-hand-rolled-mockreq.js`
2. Run: `node scripts/check-skills-fixture-usage.js tests/fixtures/tfhc-s3-shared-fixture-usage.js`

**Expected outcome:**
> Step 1 prints a warning naming the file and suggesting the shared fixture as the fix. Step 2 prints a clean "no issues found" result.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: /review now has a named check for this on skills.js files

**Covers:** AC5

**Steps:**
1. Open `skills/review/SKILL.md` in a text editor.
2. Search for "check-skills-fixture-usage".

**Expected outcome:**
> The text is found, under its own named section (not buried inside an unrelated paragraph) describing when this check applies and what it looks for.

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
