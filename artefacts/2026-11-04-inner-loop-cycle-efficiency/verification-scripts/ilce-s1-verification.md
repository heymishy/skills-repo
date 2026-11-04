# AC Verification Script: Add structured per-skill timing writes to pipeline-timings.jsonl

**Story reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/stories/ilce-s1-timing-writes.md
**Technical test plan:** artefacts/2026-11-04-inner-loop-cycle-efficiency/test-plans/ilce-s1-test-plan.md
**Script version:** 1
**Verified by:** Hamish King | **Date:** 2026-11-04 | **Context:** [x] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the repo root.
2. No server needs to be running.
3. If `.github/pipeline-timings.jsonl` already exists from a previous test run, note its current last line before starting (for comparison, not required to delete it).

**Reset between scenarios:** None needed — each scenario only checks that a new line was appended, not that the file is empty.

---

## Scenarios

### Scenario 1: Each pipeline skill writes down how long its step took

**Covers:** AC1

**Steps:**
1. Run any inner-loop skill through to its own completion (for example, run `/implementation-plan` for any story).
2. Open `.github/pipeline-timings.jsonl` and look at the last line.

**Expected outcome:**
> The last line is a single line of text that, when read, clearly shows: which skill ran, which feature and story it ran for, which stage it was, and when it happened (a date and time).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The timing file starts itself automatically

**Covers:** AC2

**Steps:**
1. Confirm `.github/pipeline-timings.jsonl` does not exist (rename it aside temporarily if it does).
2. Run any inner-loop skill through to completion.
3. Check whether the file now exists.

**Expected outcome:**
> The file now exists on its own — nobody had to create it by hand — and it contains the one new entry from the skill that just ran. No error message appeared.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Writing two entries at once doesn't lose either one

**Covers:** AC3

**Steps:**
1. Trigger two skill completions in quick succession (as close together as practical).
2. Open `.github/pipeline-timings.jsonl` afterward and count the lines added.

**Expected outcome:**
> Both new entries are present as separate, readable lines — neither one is missing, and neither line looks garbled or merged with the other.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A failed write doesn't break the skill it's attached to

**Covers:** AC4

**Steps:**
1. (Developer-assisted step) Temporarily make the timing-log write fail on purpose (e.g. point it at a read-only location).
2. Run a skill through to completion anyway.

**Expected outcome:**
> The skill still finishes normally and reports its usual completion message — it does not crash or stop just because the timing-log entry couldn't be written.

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
