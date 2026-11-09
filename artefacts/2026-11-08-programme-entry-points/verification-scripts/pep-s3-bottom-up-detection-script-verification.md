# AC Verification Script: Bottom-up programme-candidate detection script (epic-count primary signal)

**Story reference:** artefacts/2026-11-08-programme-entry-points/stories/pep-s3-bottom-up-detection-script.md
**Technical test plan:** artefacts/2026-11-08-programme-entry-points/test-plans/pep-s3-bottom-up-detection-script-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a terminal open in the repo root.
2. Confirm the script's file path once implemented (e.g. `scripts/detect-programme-candidates.js` — exact name per the implementation plan).
3. No server needed — this is a CLI script.

**Reset between scenarios:** None needed — the script only reads files, it doesn't change state.

---

## Scenarios

---

### Scenario 1: Running the script shows each feature's epic count and dependency count, never a date/timeline number

**Covers:** AC1

**Steps:**
1. Run the script against the real `.github/pipeline-state.json`.
2. Look at the output for any feature.

**Expected outcome:**
> Each feature's line shows an epic count (a plain number) and a dependency-mention count (a plain number). Nothing in the output shows a date span, "days," or any timeline-derived value — timeline is deliberately never part of this script's output.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The historical skills-platform-phase4 effort gets flagged

**Covers:** AC2

**Steps:**
1. Run the script against data representing `skills-platform-phase4` (5 epics).
2. Check whether it appears in the candidates list.

**Expected outcome:**
> `skills-platform-phase4` (or its test fixture equivalent) appears in the candidates list, with "5" shown as its epic count.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The normal team-identity-roles feature does NOT get flagged

**Covers:** AC3

**Steps:**
1. Run the script against data representing `team-identity-roles` (1 epic, 9 stories).
2. Check whether it appears in the candidates list.

**Expected outcome:**
> `team-identity-roles` does NOT appear anywhere in the candidates list — the script correctly leaves it alone as ordinary, non-programme-scale work.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The report clearly says this is a suggestion for a human, not an automatic decision

**Covers:** AC4

**Steps:**
1. Run the script against a dataset with at least one candidate.
2. Read the report produced.

**Expected outcome:**
> Next to each flagged feature, the report includes a plain-language note — something like "this is a directional signal requiring human judgment, not an automatic verdict." The report never says a feature "is" a programme, only that it "looks like a candidate worth a human look."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Running the script when nothing qualifies

**Covers:** AC4

**Steps:**
1. Run the script against a dataset where every feature has fewer than 4 epics.
2. Read the report produced.

**Expected outcome:**
> The report clearly states something like "0 candidates found" — it does not crash, print nothing, or produce a confusing blank report.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A feature with exactly 4 epics is flagged (the boundary case)

**Covers:** AC1

**Steps:**
1. Run the script against a dataset where one feature has exactly 4 epics (not 3, not 5).
2. Check whether it appears in the candidates list.

**Expected outcome:**
> The feature with exactly 4 epics IS flagged as a candidate — "≥4" means 4 counts, not just 5 and above.

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
| Edge case (zero candidates) | | |
| Edge case (exactly 4 epics) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
