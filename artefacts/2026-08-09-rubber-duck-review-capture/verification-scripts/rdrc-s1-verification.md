# AC Verification Script: Validate findings-extraction signal quality on a real human-narrated recording

**Story reference:** artefacts/2026-08-09-rubber-duck-review-capture/stories/rdrc-s1-validate-extraction-signal-quality.md
**Technical test plan:** artefacts/2026-08-09-rubber-duck-review-capture/test-plans/rdrc-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Pick an already-shipped feature you know well (e.g. a recent story from this repo).
2. Record a screen+voice walkthrough of yourself using that feature, narrating out loud what you notice — good and bad — as you go. Use your normal OS/browser screen recorder. Aim for 3-5 minutes.
3. Have the recording saved somewhere the script can read it from.

**Reset between scenarios:** Not needed — each scenario reuses the same recording.

---

## Scenarios

---

### Scenario 1: The recording gets turned into a readable transcript

**Covers:** AC1

**Steps:**
1. Run the transcription step against your recording.

**Expected outcome:**
> You get back a block of text. Reading it, you can tell it roughly matches what you actually said in the recording — it doesn't need to be word-for-word perfect, but it shouldn't be garbled or missing whole sentences you clearly spoke.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The transcript gets turned into ready-to-log findings

**Covers:** AC2

**Steps:**
1. Run the extraction step against the transcript from Scenario 1.

**Expected outcome:**
> You get back one or more findings, each written in the same style as an entry in `workspace/capture-log.md` (a date, a short signal-type, a sentence or two of signal-text, a source). Each finding should read like a genuine summary of something you actually said — not the whole transcript pasted back at you, and not a vague, generic-sounding placeholder.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Most findings hold up as real and useful

**Covers:** AC3

**Steps:**
1. Read through every finding produced (from this recording and, if you've made more than one, any others).
2. For each one, mark it "actionable" (you'd genuinely want to act on it or log it) or "noise" (not useful, too vague, or wrong).
3. Count: actionable findings ÷ total findings.

**Expected outcome:**
> At least 4 out of every 10 findings (40%) are ones you'd mark actionable. Write down the actual count (e.g. "3 out of 6") — this number is the thing being measured, not just a pass/fail.

**Result:** [ ] Pass  [ ] Fail
**Notes:** Actionable count: _____ / Total: _____

---

### Scenario 4: Findings trace back to something you actually said

**Covers:** AC4

**Steps:**
1. Pick 2-3 findings at random.
2. For each, go back to the transcript and find the part it's describing.

**Expected outcome:**
> Each finding you check points to something genuinely present in the transcript — a real moment, not something invented that merely sounds plausible. If a finding mentions a specific issue, you should be able to point to the sentence(s) in the transcript it came from.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: The raw recording and transcript aren't kept lying around

**Covers:** AC1/AC2's transient-data requirement (NFR — Security)

**Steps:**
1. After running Scenarios 1-2, look in the folder(s) the tool wrote to (or was configured to use).

**Expected outcome:**
> You don't find the raw audio recording or the full raw transcript saved anywhere persistent — only the extracted findings are there for you to review and choose to log.

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
