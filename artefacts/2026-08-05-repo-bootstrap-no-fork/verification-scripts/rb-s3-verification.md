# AC Verification Script: Generate harness-agnostic instruction files from one source

**Story reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s3-harness-agnostic-instructions.md
**Technical test plan:** artefacts/2026-08-05-repo-bootstrap-no-fork/test-plans/rb-s3-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Bootstrap a fresh repo using the init command (rb-s1/rb-s2 already applied).
2. Have VS Code with GitHub Copilot, Cursor, and Claude Code all available to test with, if you're running Scenario 3.

**Reset between scenarios:** Not needed for Scenarios 1-2. For Scenario 3, use a fresh bootstrapped folder per tool tested.

---

## Scenarios

---

### Scenario 1: Four instruction files exist and say the same thing

**Covers:** AC1

**Steps:**
1. Open `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, and `.github/copilot-instructions.md` in your bootstrapped repo, one at a time.

**Expected outcome:**
> All four files contain exactly the same content, word for word.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Hand-editing one file gets caught

**Covers:** AC2

**Steps:**
1. Open `.cursorrules` and add a random extra line at the end.
2. Run the drift-check command (see your repo's README or `package.json` scripts for the exact command name).

**Expected outcome:**
> The command fails and its output specifically names `.cursorrules` as the file that no longer matches — it doesn't just say "something's wrong" without saying what.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Each harness actually receives the same governing instructions

**Covers:** AC3

**Steps:**
1. Open the bootstrapped repo in VS Code with GitHub Copilot Chat. Ask it something that only the instruction file would tell it (e.g. "what's the pipeline order for this repo?").
2. Repeat the same question in Cursor.
3. Repeat the same question in Claude Code.

**Expected outcome:**
> All three give you the same answer, reflecting the same instruction content — none of them behaves as if it's missing the guidance the others have.

**Result:** [ ] Pass  [ ] Fail
**Notes:** This is the one manual-only scenario in this feature — automated tests can't observe how each tool actually ingests its file, only that the files themselves are identical (Scenario 1).

---

### Scenario 4: Changing the source updates all four files

**Covers:** AC4

**Steps:**
1. Edit the source instruction content (per your repo's assembly documentation) to add a new sentence.
2. Re-run the assembly command.
3. Open all four instruction files again.

**Expected outcome:**
> All four files now contain your new sentence — none of them are left showing the old content.

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
