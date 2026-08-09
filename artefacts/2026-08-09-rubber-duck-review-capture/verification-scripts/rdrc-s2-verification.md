# AC Verification Script: Wire the human-narrated mode as an on-demand operator tool

**Story reference:** artefacts/2026-08-09-rubber-duck-review-capture/stories/rdrc-s2-human-narrated-operator-tool.md
**Technical test plan:** artefacts/2026-08-09-rubber-duck-review-capture/test-plans/rdrc-s2-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a real screen+voice recording ready (reuse the one from Story 1's verification, or make a new one).
2. Make a note of what's currently in `workspace/capture-log.md`'s last entry, so you can tell a new one apart.

**Reset between scenarios:** Not needed — scenarios build on each other in order.

---

## Scenarios

---

### Scenario 1: Running the tool produces real findings

**Covers:** AC1

**Steps:**
1. Invoke the rubber-duck-review tool with your recording.

**Expected outcome:**
> You get back one or more findings, each formatted like a ready-to-paste `capture-log.md` entry — you shouldn't have to reformat or rewrite anything yourself before logging one.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: You can decide actionable-or-not without re-watching everything

**Covers:** AC2

**Steps:**
1. Read through the findings from Scenario 1.
2. For each one, decide "actionable" or "noise" using only what's shown — don't go back to the recording.

**Expected outcome:**
> Each finding gives you enough — a plain description plus roughly where it came from in the recording — that you can make that call without re-watching. If you genuinely can't decide without re-watching, that's a fail.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The recording and transcript don't stick around

**Covers:** AC3

**Steps:**
1. After the tool finishes, check your file system / repo for the raw recording file and the full transcript text.

**Expected outcome:**
> Neither the raw recording nor the full transcript is saved anywhere — not committed to the repo, not left in a temp folder you can find. Only the findings from Scenario 1 remain.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Confirming a finding logs it correctly

**Covers:** AC4

**Steps:**
1. Pick one finding from Scenario 1 you marked "actionable."
2. Confirm it for logging, using the tool's own confirm step.
3. Open `workspace/capture-log.md` and look at the newest entry.

**Expected outcome:**
> A new entry appears at the end of the file, with all 5 fields filled in (date, session-phase, signal-type, signal-text, source). The `source` field says something distinct like `rubber-duck-review` — not reused from an unrelated entry type.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Nothing gets logged until you say so

**Covers:** AC4 / NFR — Audit

**Steps:**
1. Run the tool again with a fresh recording, but stop right after findings are shown — do not confirm any of them.
2. Check `workspace/capture-log.md`.

**Expected outcome:**
> Nothing new has been added to the file. The findings only get logged if you explicitly confirm them.

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
