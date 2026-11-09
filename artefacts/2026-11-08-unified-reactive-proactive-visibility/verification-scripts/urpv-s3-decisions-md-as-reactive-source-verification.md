# AC Verification Script: Surface decisions.md RISK-ACCEPT/SCOPE entries as a second reactive-work source

**Story reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/stories/urpv-s3-decisions-md-as-reactive-source.md
**Technical test plan:** artefacts/2026-11-08-unified-reactive-proactive-visibility/test-plans/urpv-s3-decisions-md-as-reactive-source-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a connected product whose repo has a real `decisions.md` with at least one `RISK-ACCEPT` or `SCOPE` entry (any feature artefact in this very repo qualifies, e.g. `incident-triage-and-respond`'s decisions.md).
2. Also have access to a second connected product whose repo has no `decisions.md` file at all, for the missing-file scenario.

**Reset between scenarios:** None needed.

---

## Scenarios

---

### Scenario 1: A RISK-ACCEPT or SCOPE entry shows up as a reactive-work item

**Covers:** AC1

**Steps:**
1. Open the consolidated features view for the product with a real `decisions.md` containing a RISK-ACCEPT or SCOPE entry.
2. Look for that entry among the reactive-work items.

**Expected outcome:**
> The entry appears with its date, its code (RISK-ACCEPT or SCOPE), and the decision title text — matching what's written in the real `decisions.md` file.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Other decision types don't show up here

**Covers:** AC2

**Steps:**
1. On the same page, check whether any `ARCH`, `ASSUMPTION`, or `SLICE` entries from that same `decisions.md` file appear in the reactive-work list.

**Expected outcome:**
> None of those entries appear — only RISK-ACCEPT and SCOPE entries show up.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A missing decisions.md file doesn't break the page

**Covers:** AC4

**Steps:**
1. Open the consolidated features view for the product whose repo has no `decisions.md` file.

**Expected outcome:**
> The page loads normally. No error message appears. The reactive-work list simply shows nothing from `decisions.md` (it may still show other reactive items like short-track features, if any).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: One badly-formatted entry doesn't take down the rest

**Covers:** AC3

**Steps:**
1. (Requires a test repo) Edit a test `decisions.md` so one entry's header line is missing or broken, while leaving at least one other RISK-ACCEPT/SCOPE entry well-formed.
2. Reload the consolidated features view for that product.

**Expected outcome:**
> The well-formed entry still shows up normally. The broken entry simply doesn't appear — no error message, no broken page, no missing entries beyond the one broken one.

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
