# AC Verification Script: /workflow reconciles merged-but-no-DoD stories against live GitHub, not just pipeline-state.json

**Story reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/stories/ilce-s4-dod-handoff-reconciliation.md
**Technical test plan:** artefacts/2026-11-04-inner-loop-cycle-efficiency/test-plans/ilce-s4-test-plan.md
**Script version:** 1
**Verified by:** Hamish King | **Date:** 2026-11-04 | **Context:** [x] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the repo root, with `gh` CLI installed and logged in.
2. No server needs to be running.

**Reset between scenarios:** None needed.

---

## Scenarios

### Scenario 1: /workflow checks the real merged-PR list, not just its own notes

**Covers:** AC1

**Steps:**
1. Run `/workflow` at the start of a session.

**Expected outcome:**
> The session-start report mentions checking GitHub's real list of merged pull requests, not just reading its own saved records.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: You can't miss it — the gap gets top billing

**Covers:** AC3

**Steps:**
1. Run `/workflow` for a repo state known to have at least one merged-but-no-DoD story.

**Expected outcome:**
> The warning about merged-but-no-DoD stories appears near the very top of the report — you don't have to scroll past other things to see it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The check still works (politely) if GitHub access isn't available

**Covers:** AC4

**Steps:**
1. Temporarily disable `gh` CLI access (e.g. log out, or run somewhere without network).
2. Run `/workflow`.

**Expected outcome:**
> `/workflow` says plainly that it couldn't check live GitHub this time and is falling back to its own saved records — it does not crash or refuse to run.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: The check catches the real backlog it was built for

**Covers:** AC5

**Steps:**
1. Run the new reconciliation check against this repo's real current state.

**Expected outcome:**
> The known backlog of merged-but-not-yet-DoD stories (confirmed earlier in this feature's own discovery work) all show up as flagged — none of them are missed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
