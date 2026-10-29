# AC Verification Script: Add a structural /review check flagging hand-rolled mockReq on journey.js-touching test files

**Story reference:** artefacts/2026-10-29-test-suite-infra-refactor/stories/tsir-s3-structural-review-check-fixture-usage.md
**Technical test plan:** artefacts/2026-10-29-test-suite-infra-refactor/test-plans/tsir-s3-structural-review-check-fixture-usage-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the repo root.
2. `tsir-s1` (the shared fixture module) must already be implemented.

**Reset between scenarios:** None needed — Scenario 3 uses a temporary copy, not the real fixture files.

---

## Scenarios

### Scenario 1: The check catches a test file that rolled its own mock instead of using the shared one

**Covers:** AC1

**Steps:**
1. Run: `node scripts/check-journey-fixture-usage.js tests/fixtures/tsir-s3-hand-rolled-mockreq.js`

**Expected outcome:**
> The command fails (non-zero exit) and prints a message naming the file and telling you to use the shared fixture module instead of your own.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The check is happy with a file that correctly uses the shared fixture

**Covers:** AC2

**Steps:**
1. Run: `node scripts/check-journey-fixture-usage.js tests/fixtures/tsir-s3-shared-fixture-usage.js`

**Expected outcome:**
> The command succeeds (exit code 0) with no warning or error message.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Fixing the problem actually turns the warning off

**Covers:** AC4

**Steps:**
1. Copy `tests/fixtures/tsir-s3-hand-rolled-mockreq.js` to a throwaway temp file, e.g. `/tmp/scratch-mockreq.js`.
2. Run the check against the copy: `node scripts/check-journey-fixture-usage.js /tmp/scratch-mockreq.js` — confirm it fails, same as Scenario 1.
3. Edit the temp copy: replace its hand-rolled mock with a call to the shared fixture (copy the pattern from `tests/fixtures/tsir-s3-shared-fixture-usage.js`).
4. Run the check again against the edited temp copy.

**Expected outcome:**
> Step 2 fails (same as Scenario 1). Step 4 succeeds (exit code 0) — proving the tool is actually looking at what's in the file right now, not giving a canned answer.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Running /review on a journey.js story actually shows this as its own finding

**Covers:** AC3

**Steps:**
1. Open `skills/review/SKILL.md` in an editor (or run `grep -n "check-journey-fixture-usage" skills/review/SKILL.md`).

**Expected outcome:**
> You can find a clearly labelled section or bullet point that mentions `check-journey-fixture-usage.js` and describes it as its own kind of finding — not buried inside an unrelated paragraph about something else.

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
