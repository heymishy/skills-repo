# AC Verification Script: Bootstrap a minimal fresh repo with one init command

**Story reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s1-minimal-fresh-repo-init.md
**Technical test plan:** artefacts/2026-08-05-repo-bootstrap-no-fork/test-plans/rb-s1-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Make sure you have Node.js installed, and a completely empty folder to bootstrap into (e.g. `mkdir C:\temp\my-new-repo`).
2. You don't need a copy of the skills-repo source anywhere on your machine for this test.
3. No browser needed — this is entirely a command-line test.

**Reset between scenarios:** Delete and recreate the empty target folder before each scenario.

---

## Scenarios

---

### Scenario 1: Running the init command creates a working repo from nothing

**Covers:** AC1

**Steps:**
1. Open a terminal in your empty target folder.
2. Run: `npx @heymishy/skills-repo@latest init .`

**Expected outcome:**
> The command finishes without an error. The folder now contains a `.github/skills/` directory with skill files inside it, a `context.yml` file, and a `.github/pipeline-state.json` file.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The command works without any local copy of the source repo

**Covers:** AC2

**Steps:**
1. Confirm you have no folder anywhere on your machine that's a clone of `heymishy/skills-repo`.
2. Run the same init command from Scenario 1 in a fresh empty folder.

**Expected outcome:**
> The command still completes successfully and produces the same files as Scenario 1 — it does not fail with an error about a missing local repository, and it does not silently produce an empty or partial result.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Running init a second time doesn't overwrite or duplicate anything

**Covers:** AC3

**Steps:**
1. In the folder from Scenario 1 (already bootstrapped), run the init command again: `npx @heymishy/skills-repo@latest init .`

**Expected outcome:**
> The command reports a list of files it skipped (because they already exist) rather than silently overwriting them or erroring out. The message mentions `platform:fetch` as the way to get updates — it does not vaguely refer to "a future update mechanism."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The bootstrapped repo can actually run the inner loop

**Covers:** AC4

**Steps:**
1. In the freshly bootstrapped folder from Scenario 1, open the folder in your coding assistant of choice (Claude Code, VS Code + Copilot, or Cursor).
2. Run the `/branch-setup` skill.

**Expected outcome:**
> `/branch-setup` runs and completes without needing you to manually copy any files in from elsewhere — everything it needs was already there from the init command.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Target path is a file, not a folder

**Covers:** AC1 (edge case)

**Steps:**
1. Create an empty text file (not a folder) called `not-a-folder.txt`.
2. Run: `npx @heymishy/skills-repo@latest init not-a-folder.txt`

**Expected outcome:**
> The command fails with a clear error message explaining that the target is a file, not a directory. It does not attempt to write into the file or crash with an unrelated error.

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
