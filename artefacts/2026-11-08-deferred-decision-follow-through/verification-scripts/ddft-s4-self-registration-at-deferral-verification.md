# AC Verification Script: Self-registration at the moment of deferral

**Story reference:** artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s4-self-registration-at-deferral.md
**Technical test plan:** artefacts/2026-11-08-deferred-decision-follow-through/test-plans/ddft-s4-self-registration-at-deferral-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a way to run through `/discovery`, `/decisions`, and `/definition-of-done` (or simulate their ending steps) in a test or demo project
2. Have `workspace/incidents.json` ready to inspect after each run

**Reset between scenarios:** Reset `workspace/incidents.json` to empty (or note its starting state) before each scenario so you can clearly see what got added.

---

## Scenarios

---

### Scenario 1: Finishing `/discovery` with something out of scope creates a record automatically

**Covers:** AC1

**Steps:**
1. Run through `/discovery` for a test feature, deliberately leaving something in the "Out of Scope" section
2. Finish the skill — do not manually create any record yourself

**Expected outcome:**
> A new record appears in the incidents file on its own, without you doing anything extra. It's marked as coming from "discovery-out-of-scope."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Logging a RISK-ACCEPT decision creates a record automatically

**Covers:** AC2

**Steps:**
1. Run `/decisions` and log a RISK-ACCEPT entry
2. Finish the skill — again, don't create any record by hand

**Expected outcome:**
> A new record appears automatically, linked to the decision you just logged, marked as coming from "risk-accept."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A still-unmeasured metric at `/definition-of-done` creates a record automatically

**Covers:** AC3

**Steps:**
1. Run `/definition-of-done` for a story whose benefit metric genuinely can't be measured yet
2. Let the skill record that metric's signal as "not yet measured," with your explanation of why
3. Finish the skill

**Expected outcome:**
> A new record appears automatically, carrying the metric's name and your explanation as its "reason to revisit." Importantly, this happens because of `/definition-of-done` finishing — not because `/benefit-metric` ran earlier. If you only ran `/benefit-metric` (without ever running `/definition-of-done`), no record from this hook should appear, because that skill never gets to see whether the metric is still unmeasured later on.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: All three records land in the same place

**Covers:** AC4

**Steps:**
1. After running through Scenarios 1–3, open `workspace/incidents.json`

**Expected outcome:**
> All three new records are in this one file. None of the three skills created a separate file or a different storage location.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: One hook breaking doesn't mean the others are untested

**Covers:** AC5

**Steps:**
1. Ask whoever implements this: "if the `/decisions` hook's test were deliberately broken, would the `/discovery` and `/definition-of-done` hook tests still run and still correctly report pass or fail?"
2. Confirm the three hooks have genuinely separate test files, not one shared test that happens to check all three at once

**Expected outcome:**
> Yes — each hook has its own independent test. Breaking one doesn't hide or fake a pass for the others.

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
