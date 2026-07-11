# AC Verification Script: Remove the three recurring merge-conflict hotspots in parallel-wave inner-loop delivery

**Story reference:** artefacts/2026-07-11-pipeline-conflict-reduction/stories/pcr-s1-reduce-merge-conflict-hotspots.md
**Technical test plan:** artefacts/2026-07-11-pipeline-conflict-reduction/test-plans/pcr-s1-reduce-merge-conflict-hotspots-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal at the repo root (`C:\Users\Hamis\code\skills repo` or a clean worktree of the branch you're checking).
2. This story has no UI or browser component — every scenario is a terminal command and a file you read afterward.
3. For Scenarios 4 and 5, you'll create a couple of throwaway git branches in a temporary folder — instructions are included, nothing here touches your real repo's history.

**Reset between scenarios:** No shared state — each scenario is independent. If a scenario creates a temp folder, delete it when you're done with that scenario.

---

## Scenarios

### Scenario 1: The test runner still catches every failure the old chain did — no more, no less

**Covers:** AC1

**Steps:**
1. Run `npm test` and let it finish. Note how many files it says failed, and which ones.
2. Separately, run the old-style command-by-command sweep (ask the team for the "bypass cmd.exe length limit" script if you don't have it handy — it just runs each `tests/check-*.js` file one at a time instead of one giant chained command).
3. Compare the two lists of failing files.

**Expected outcome:**
> Both approaches report the exact same set of failing files. Today, that should just be the two already-known pre-existing gaps (a missing `.github/skills/definition/SKILL.md` file, logged in `decisions.md`) — nothing new should appear on either side.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: `npm test` no longer breaks with a "command line too long" error

**Covers:** AC1

**Steps:**
1. Open a fresh `cmd.exe` window (not PowerShell, not Git Bash — plain Command Prompt).
2. `cd` to the repo root.
3. Run `npm test`.

**Expected outcome:**
> The command runs and prints test output (pass/fail results). It does **not** print "The command line is too long" or any similar error before any tests even start.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Adding a new test file doesn't require touching package.json

**Covers:** AC2

**Steps:**
1. Create a new file `tests/check-zzz-dummy.js` containing a single trivial test that always passes (ask the coding agent for a one-liner if needed).
2. Run `git status`.
3. Run `git diff -- package.json`.

**Expected outcome:**
> `git status` shows the new file as untracked/added, but `git diff -- package.json` shows **nothing at all** — an empty result. You did not need to open or edit `package.json` to make your new test file part of the suite.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Two people advancing different stories in the same feature don't collide

**Covers:** AC3, AC4

**Steps:**
1. Ask the coding agent (or a teammate) to show you `.github/pipeline-state.json` before and after they run `bin/skills advance` for one story in a feature.
2. Check: did the *story's own* fields change? (They should.)
3. Check: did the feature's own `updatedAt` field (the one shared by every story in that feature) change? (It should **not**, unless this was a genuine feature-level milestone like discovery approval — not a routine story update.)
4. If you have two people/agents advancing two different stories in the same feature at the same time, have them merge their branches one after the other.

**Expected outcome:**
> The second merge completes with no conflict message about `.github/pipeline-state.json`. Both people's story updates are present in the final file.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Two independent decision-log entries merge automatically

**Covers:** AC5

**Steps:**
1. Ask the coding agent to show you `.gitattributes` and confirm it contains a line mentioning `decisions.md` and `merge=union`.
2. Have two branches each add a *different* new entry to the same feature's `decisions.md` (e.g. two different stories each logging their own RISK-ACCEPT note), based off the same starting point.
3. Merge one branch into master, then merge master into the other branch.

**Expected outcome:**
> The second merge completes with **no conflict** — no `<<<<<<<`/`=======`/`>>>>>>>` markers appear anywhere in `decisions.md`, and reading the file afterward shows **both** new entries present, not just one.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A genuine feature-level milestone still updates the feature's timestamp

**Covers:** AC3 (the "not a blanket removal" check)

**Steps:**
1. Ask the coding agent to advance a feature-level milestone directly (not a single story's field) — e.g. marking the whole feature's discovery as approved.
2. Check the feature's `updatedAt` field in `.github/pipeline-state.json` before and after.

**Expected outcome:**
> The feature's `updatedAt` field **does** change this time — proving the fix only stopped the *redundant, routine, per-story* bump, not all feature-level timestamp tracking.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — same failures, old vs new runner | | |
| Scenario 2 — no cmd.exe length error | | |
| Scenario 3 — new test file needs zero package.json edits | | |
| Scenario 4 — concurrent story updates merge cleanly | | |
| Scenario 5 — decisions.md entries auto-merge | | |
| Edge case — genuine milestone still bumps feature timestamp | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
