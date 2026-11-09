# AC Verification Script: Handoff to short-track pipeline + post-fix confirmation

**Story reference:** artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s4-handoff-and-post-fix-confirmation.md
**Technical test plan:** artefacts/2026-11-08-incident-triage-and-respond/test-plans/itar-s4-handoff-and-post-fix-confirmation-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have an incident record with a triage summary already attached (from itar-s1/itar-s2).
2. Have access to create or simulate a short-track story in `pipeline-state.json` and move it to `dodStatus: complete`.

**Reset between scenarios:** Reset the incident record's status and linked-story fields between scenarios.

---

## Scenarios

---

### Scenario 1: Acting on an incident creates a linked short-track story

**Covers:** AC1

**Steps:**
1. Using an incident with a triage summary, decide to act on it and trigger the handoff.
2. Look at the newly created short-track story, and look back at the incident record.

**Expected outcome:**
> The new story includes the triage summary's context (what's known, suggested next step) somewhere a reader can see it. The incident record now shows a link back to that story.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Once the fix merges and passes Definition of Done, the incident is checked

**Covers:** AC2, AC3

**Steps:**
1. Move the linked story through to `dodStatus: complete`.
2. See what the post-fix check does.

**Expected outcome:**
> The system either automatically re-checks the original problem (if that kind of automated check exists yet) or asks a human to confirm manually (if it doesn't). Either way, the incident record ends up marked as "confirmed" or "not confirmed" — it does not stay stuck showing its old, pre-fix status.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A fix that doesn't actually work stays visibly open, not falsely closed

**Covers:** AC4

**Steps:**
1. Walk through Scenario 2 again, but this time have the confirmation come back negative (the original problem still happens).

**Expected outcome:**
> The incident record is marked "not confirmed" and stays open/flagged — it is not closed. There's a note recorded that a fix was tried but didn't resolve the issue, so the next person who looks at this incident knows a fix attempt already failed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
