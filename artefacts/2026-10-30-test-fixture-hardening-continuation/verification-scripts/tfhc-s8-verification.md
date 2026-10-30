# AC Verification Script: Stub the real git-commit adapter in the 13 remaining skill-turn test files

**Story reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s8-skill-turn-git-commit-adapter-stubbing.md
**Technical test plan:** artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s8-skill-turn-git-commit-adapter-stubbing-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the repo root.
2. No server needs to be running — this is a code and test-output review, not a live system check.

**Reset between scenarios:** None needed.

---

## Scenarios

### Scenario 1: All 13 files now protect themselves the same way the existing 12 do

**Covers:** AC1

**Steps:**
1. Open any one of the 13 named files, for example `tests/check-dcuf-s1-github-commit-real-completion-point.js`.
2. Look near the top of the file, before any test that completes a skill turn, for a call to `setSkillTurnGitCommitAdapter`.

**Expected outcome:**
> A `setSkillTurnGitCommitAdapter(...)` call is present, appearing before any test in the file that drives a turn to completion. This looks the same as how an already-safe file, like `tests/check-dic1-story-cards.js`, already does it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The new check correctly tells which files are safe and which aren't

**Covers:** AC2

**Steps:**
1. Run `node scripts/check-skill-turn-git-commit-stubbing.js`.

**Expected outcome:**
> The check reports 0 unstubbed files out of 41 total calling files. No file names are listed as missing a stub.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Nothing else about the test suite changed

**Covers:** AC3

**Steps:**
1. Run `npm test`.

**Expected outcome:**
> The same number of files run as before this story (814), and the only failure is the same, already-known pipeline-state-integrity flag that was present before this story started. No new or different failure appears. Each of the 13 modified files' own tests still show exactly the same pass/fail counts as before.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The known junk-commit bug is recorded as closed

**Covers:** AC4

**Steps:**
1. Open `workspace/learnings.md`.
2. Find the entry about "skills.js fires a real git commit during tests."

**Expected outcome:**
> The entry now says this is closed, and mentions this story (`tfhc-s8`) as the fix.

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
