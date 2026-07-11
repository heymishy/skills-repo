# AC Verification Script: Stop the skill-turn artefact auto-commit from firing real git commits during tests

**Story reference:** artefacts/2026-07-12-skill-turn-test-isolation/stories/stis-s1-guard-skill-turn-auto-commit.md
**Technical test plan:** artefacts/2026-07-12-skill-turn-test-isolation/test-plans/stis-s1-guard-skill-turn-auto-commit-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code sign-off  [ ] Post-merge smoke test  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal at the repo root (or a clean worktree of the branch you're checking).
2. This story has no UI or browser component — every scenario is a terminal command and a `git log` you read afterward.
3. Note the current commit: run `git log --oneline -1` and write it down before starting any scenario.

**Reset between scenarios:** No shared state — each scenario is independent. If you accidentally create a real test commit while checking (shouldn't happen after this fix, but just in case), `git reset --hard` back to the commit you noted in Setup step 3.

---

## Scenarios

### Scenario 1: Running one previously-affected test file no longer creates a commit

**Covers:** AC1, AC3

**Steps:**
1. Run `git log --oneline -1` and note the commit hash.
2. Run `node tests/check-wusl1-chat-streaming.js` (or whichever file the coding agent's search identified as the primary trigger).
3. Run `git log --oneline -1` again.

**Expected outcome:**
> The commit hash is exactly the same before and after. The test's own pass/fail output is unaffected — it should report all its usual tests passing, just with zero side-effect commits.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Running the full test suite twice produces no new commits either time

**Covers:** AC1, AC4

**Steps:**
1. Run `git log --oneline -1` and note the commit hash.
2. Run `npm test` (the full suite) and let it finish.
3. Run `git log --oneline -1` again — should match step 1.
4. Run `npm test` a second time.
5. Run `git log --oneline -1` a third time — should still match step 1.

**Expected outcome:**
> All three commit-hash checks show the exact same value. No matter how many times you run the full suite, nothing new appears in the git history.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The pre-existing test failure count is unchanged

**Covers:** AC5

**Steps:**
1. Ask the coding agent (or check `artefacts/2026-07-11-pipeline-conflict-reduction/decisions.md`) for the documented pre-existing failure count from before this fix (should be the same 68-70-ish number several other stories this session have already confirmed).
2. Run `npm test` after this fix and look at the final summary line (something like "X file(s) run, Y failed").
3. Compare Y to the documented number.

**Expected outcome:**
> The failure count matches the documented pre-existing number — this fix didn't accidentally hide or add any real test failures, it only stopped the side-effect commits.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A genuine live server session still auto-commits real artefacts (production behaviour preserved)

**Covers:** AC2

**Steps:**
1. Ask the coding agent to point you to their test that verifies the production-default adapter still performs a real commit (it should use a disposable temp git repo, not this real repo, to check this safely).
2. Confirm that test passes.

**Expected outcome:**
> The test confirms a real commit still happens when nothing overrides the adapter — proving this fix only changed test-time behaviour, not the real feature that saves and commits artefacts during an actual live skill session.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — one previously-affected test creates no commit | | |
| Scenario 2 — full suite run twice creates no commits | | |
| Scenario 3 — pre-existing failure count unchanged | | |
| Edge case — production auto-commit still works | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
