# AC Verification Script: Periodic review scan

**Story reference:** artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s2-periodic-review-scan.md
**Technical test plan:** artefacts/2026-11-08-deferred-decision-follow-through/test-plans/ddft-s2-periodic-review-scan-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a copy of `workspace/incidents.json` ready with at least the two real deferred-item records from `ddft-s1` (`tfhc-s1` and the C1-vs-Option-C disagreement)
2. Know how the scan is run (a command, documented in the implementation)

**Reset between scenarios:** None needed between scenarios 1–3. Scenario 4 (Edge case) needs you to mark one record "resolved" first — undo that afterward if you want to repeat other scenarios.

---

## Scenarios

---

### Scenario 1: The scan surfaces both real deferred items on its first run

**Covers:** AC1, AC2

**Steps:**
1. Run the scan against the incidents file
2. Read the list it prints

**Expected outcome:**
> Both the `tfhc-s1` record and the C1-vs-Option-C record show up in the list. Nothing is missing.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The "reason to revisit" text is shown exactly as written

**Covers:** AC3

**Steps:**
1. Look at the "reason to revisit" text the scan prints for the C1-vs-Option-C record
2. Compare it word-for-word against what's logged in `workspace/capture-log.md` for that item

**Expected outcome:**
> The text matches exactly — nothing shortened, nothing reworded, nothing turned into a checkbox or a "met/not met" status. It reads exactly like the original note.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Running the scan again shows the same items — nothing gets "used up"

**Covers:** AC4

**Steps:**
1. Run the scan a second time, without changing anything in between
2. Compare the list to the first run

**Expected outcome:**
> The exact same items show up again. The scan doesn't hide something just because you already saw it once — it's meant to keep nagging you until you actually resolve it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A resolved item drops out of the list

**Covers:** AC1

**Steps:**
1. Mark one of the two deferred-item records as resolved (edit its status directly, or use whatever the real resolution step turns out to be)
2. Run the scan again

**Expected outcome:**
> Only the still-unresolved item shows up now. The resolved one no longer appears.

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
