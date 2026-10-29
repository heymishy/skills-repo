# AC Verification Script: Extract a shared mockReq/mockRes fixture module for journey.js tests

**Story reference:** artefacts/2026-10-29-test-suite-infra-refactor/stories/tsir-s1-shared-journey-fixture-module.md
**Technical test plan:** artefacts/2026-10-29-test-suite-infra-refactor/test-plans/tsir-s1-shared-journey-fixture-module-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the repo root.
2. No server needs to be running — these are plain command-line checks (`node ...`), not browser-based.

**Reset between scenarios:** None needed — each scenario is independent and has no shared state.

---

## Scenarios

### Scenario 1: The shared fixture provides every field journey.js actually needs by default

**Covers:** AC1

**Steps:**
1. Run: `node -e "const {journeyFixture}=require('./tests/helpers/journey-fixture'); console.log(JSON.stringify(journeyFixture().session))"`

**Expected outcome:**
> A single line of JSON prints to the terminal showing a `session` object with five fields filled in: `login`, `tenantId`, `accessToken`, `userId`, `role`. None of these five are missing, empty strings, or `null`.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: An existing test file keeps passing after switching to the shared fixture

**Covers:** AC2

**Steps:**
1. Run: `node tests/check-ep1-s1-journey-feature-merge.js`

**Expected outcome:**
> The command prints a list of test results ending in something like "X passed, 0 failed" and exits without an error. The pass count matches what it was before this story's change (same file, just using the new shared fixture internally).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The default tenant ID is never blank

**Covers:** AC3

**Steps:**
1. Run: `node -e "const {journeyFixture}=require('./tests/helpers/journey-fixture'); const t = journeyFixture().session.tenantId; console.log('tenantId:', JSON.stringify(t), '| empty:', t === '', '| undefined:', t === undefined)"`

**Expected outcome:**
> Prints a `tenantId` value that is a real, non-blank piece of text (e.g. `"tsir-test-tenant"`), with `empty: false` and `undefined: false`.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: You can override just one field without losing the others

**Covers:** AC4

**Steps:**
1. Run: `node -e "const {journeyFixture}=require('./tests/helpers/journey-fixture'); console.log(JSON.stringify(journeyFixture({session:{tenantId:'other-tenant'}}).session))"`

**Expected outcome:**
> The printed `session` object shows `tenantId` as `"other-tenant"`, while `login`, `accessToken`, and `role` still show their normal default values (not blank, not missing).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Two separate uses of the fixture don't interfere with each other

**Covers:** AC1 (robustness)

**Steps:**
1. Run: `node -e "const {journeyFixture}=require('./tests/helpers/journey-fixture'); const a=journeyFixture(); a.session.tenantId='changed'; const b=journeyFixture(); console.log('b tenantId:', b.session.tenantId)"`

**Expected outcome:**
> `b tenantId:` prints the normal default value, NOT `"changed"` — proving changing one fixture object doesn't leak into a second one.

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
