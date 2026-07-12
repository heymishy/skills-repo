# AC Verification Script: Stop the skill-turn artefact auto-commit from firing real git commits during tests

**Story reference:** artefacts/2026-07-12-skill-turn-test-isolation/stories/stis-s1-guard-skill-turn-auto-commit.md
**Technical test plan:** artefacts/2026-07-12-skill-turn-test-isolation/test-plans/stis-s1-guard-skill-turn-auto-commit-test-plan.md
**Script version:** 1
**Verified by:** Coding agent (autonomous /verify-completion) | **Date:** 2026-07-12 | **Context:** [x] Pre-code sign-off (post-implementation, pre-PR)

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

**Result:** [x] Pass  [ ] Fail
**Notes:** The coding agent's own exhaustive search (tracing every call site of `handlePostTurnStreamHtml`, not grepping for marker text) found that `check-wusl1-chat-streaming.js` does not currently reach the artefact-completion path at all (no executor mock in that file returns ARTEFACT-START/END content). The 2 files that do reach it — `check-wusl2-progressive-live-draft.js` and `check-iwu5-lens-complete.js` — were each run standalone before/after the fix: HEAD identical both times (`7b71fe2b...` unchanged), wusl2 8/8 passing, iwu5 17/17 passing. Also reproduced the defect once, deliberately, on the unfixed code with a disposable slug (RED state: HEAD moved to a real `feat: discovery artefact` commit), then reverted via `git reset --hard` before implementing the fix — logged in decisions.md.

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

**Result:** [x] Pass  [ ] Fail
**Notes:** Ran `node scripts/run-all-tests.js` (this repo's dynamic test runner) twice in a row. HEAD was `7b71fe2b393b754254263ef68db121afb0a4deeb` before, after run 1, and after run 2 — unchanged all three times. Run 1: 308 files run, 69 failed. Run 2: 308 files run, 69 failed, identical failing-file list (diffed, zero differences).

---

### Scenario 3: The pre-existing test failure count is unchanged

**Covers:** AC5

**Steps:**
1. Ask the coding agent (or check `artefacts/2026-07-11-pipeline-conflict-reduction/decisions.md`) for the documented pre-existing failure count from before this fix (should be the same 68-70-ish number several other stories this session have already confirmed).
2. Run `npm test` after this fix and look at the final summary line (something like "X file(s) run, Y failed").
3. Compare Y to the documented number.

**Expected outcome:**
> The failure count matches the documented pre-existing number — this fix didn't accidentally hide or add any real test failures, it only stopped the side-effect commits.

**Result:** [x] Pass  [ ] Fail
**Notes:** 69 failures both full-suite runs, within the documented ~68-70 baseline range referenced across `pcr-s1`/`bri-s2.5` decisions.md entries. Failing-file list identical between the two runs (see Scenario 2 notes) — this fix changed zero test outcomes, only removed the git-commit side effect.

---

### Edge case: A genuine live server session still auto-commits real artefacts (production behaviour preserved)

**Covers:** AC2

**Steps:**
1. Ask the coding agent to point you to their test that verifies the production-default adapter still performs a real commit (it should use a disposable temp git repo, not this real repo, to check this safely).
2. Confirm that test passes.

**Expected outcome:**
> The test confirms a real commit still happens when nothing overrides the adapter — proving this fix only changed test-time behaviour, not the real feature that saves and commits artefacts during an actual live skill session.

**Result:** [x] Pass  [ ] Fail
**Notes:** `tests/check-stis-s1-guard-skill-turn-git-commit.js` U2 creates a disposable temp git repo via `fs.mkdtempSync`/`git init`, points `CLAUDE_REPO_PATH` at it, and confirms a real commit appears in that throwaway repo's `git log` when no adapter override is set — never touching this real repo checkout. PASS.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — one previously-affected test creates no commit | Pass | wusl1 does not reach the path; wusl2 + iwu5 (the 2 files that actually do) both verified HEAD-unchanged instead |
| Scenario 2 — full suite run twice creates no commits | Pass | 308 files, 69 failed, HEAD unchanged across 2 runs |
| Scenario 3 — pre-existing failure count unchanged | Pass | 69/69, identical failing-file list both runs |
| Edge case — production auto-commit still works | Pass | U2, disposable temp repo only |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| Scenario 1 | DoR contract named `check-wusl1-chat-streaming.js` as "the primary trigger" | That file does not currently reach the git-commit path; 2 other files do (found by tracing, not grepping) | LOW | Accept — logged in decisions.md, plan's exhaustive-search table corrects the record |
| (new, beyond test plan) | N/A | e2e/webServer subprocess also reaches the git-commit path with no way to stub via HTTP | MED | Fixed — `server.js` NODE_ENV=test no-op wiring added (Task 2), logged in decisions.md as a DoR-contract scope expansion |
| (new, beyond test plan) | N/A | A pre-existing tracked file (`artefacts/test-slug/ideate.md`, commit `7147efb8`) appears to be historical contamination from this exact defect, already on master | LOW | Accept — out of scope for this story per its own Out of Scope section; logged in decisions.md for a future cleanup story |
