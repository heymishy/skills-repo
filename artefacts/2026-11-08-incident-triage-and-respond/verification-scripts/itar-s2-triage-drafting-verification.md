# AC Verification Script: Triage drafting via structured-field Jaccard matching

**Story reference:** artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s2-triage-drafting.md
**Technical test plan:** artefacts/2026-11-08-incident-triage-and-respond/test-plans/itar-s2-triage-drafting-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a test copy of `workspace/incidents.json` with at least one existing incident record in it.
2. Have the triage-drafting function (or its CLI entry point, once implemented) available to run against that test file.

**Reset between scenarios:** Restore your test copy of `incidents.json` to its starting state between scenarios.

---

## Scenarios

---

### Scenario 1: A new incident is matched against a similar past incident

**Covers:** AC1

**Steps:**
1. Add a new incident record whose tags closely overlap with an existing record's tags.
2. Run the triage-drafting step.

**Expected outcome:**
> The new record now links back to the matching prior record as a "prior incident link."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The triage summary explains what's known and what to try next

**Covers:** AC2

**Steps:**
1. Using the same matched pair from Scenario 1, look at the new record's triage summary text.

**Expected outcome:**
> The summary reads like a short briefing, not just a number. It should mention what's already known about the similar past incident, what was tried before, and a suggested next step — not just something like "similarity: 0.73" with nothing else.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A genuinely new kind of incident says so, honestly

**Covers:** AC3

**Steps:**
1. Add a new incident record with tags that don't resemble anything already recorded.
2. Run the triage-drafting step.

**Expected outcome:**
> The triage summary clearly states that no relevant prior incident was found. It does not leave the summary blank, and it does not pretend a weak, unrelated match is a real one.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: An incident record with no tags at all is handled without crashing

**Covers:** AC4

**Steps:**
1. Add a new incident record where the tags field was left empty.
2. Run the triage-drafting step.

**Expected outcome:**
> The system does not crash or error out. It records a clear message along the lines of "cannot score — no tags present" — and this message is visibly different from Scenario 3's "no relevant prior incident found" message, so you can always tell the two situations apart.

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

**Note on the matching threshold:** the exact similarity cutoff used to decide "close enough to count as a match" is deliberately not fixed yet — it will be tuned once the team has run real examples through it. If a scenario above seems to flag something as "too similar" or "not similar enough" in a way that feels wrong, record it as a finding here rather than assuming the test itself is broken — it may be useful evidence for tuning that cutoff.
