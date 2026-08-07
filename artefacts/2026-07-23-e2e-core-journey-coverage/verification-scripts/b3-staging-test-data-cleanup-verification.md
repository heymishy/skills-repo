# AC Verification Script: Design and implement a staging test-data cleanup strategy for E2E-generated accounts and records

**Story reference:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/b3-staging-test-data-cleanup.md
**Technical test plan:** artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/b3-staging-test-data-cleanup-test-plan.md
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Ask an engineer to seed a small set of test records on staging: a few `e2e-test-` tagged users/products older than a week, a few tagged ones from today, and at least one real-looking but untagged account.
2. Have access to run the cleanup script (ask an engineer for the command).

**Reset between scenarios:** Re-seed the data set before each scenario if records were deleted in a prior scenario.

---

## Scenarios

---

### Scenario 1: Old test data gets cleaned up, recent data doesn't

**Covers:** AC1

**Steps:**
1. Run the cleanup script.
2. Check the staging user/product list afterward.

**Expected outcome:**
> The old (older-than-a-week) `e2e-test-` tagged records are gone. The recent `e2e-test-` tagged records are still there. Nothing else changed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A real-looking account is never touched

**Covers:** AC2

**Steps:**
1. Before running the script, note the untagged "real-looking" test account from Setup.
2. Run the cleanup script.
3. Check whether that account still exists.

**Expected outcome:**
> The untagged account is still there, completely untouched — even though it's old and superficially resembles test data.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The decision log reflects what was actually built

**Covers:** AC3

**Steps:**
1. Open `artefacts/2026-07-23-e2e-core-journey-coverage/decisions.md`.
2. Find the "Staging test-data accumulation" entry.

**Expected outcome:**
> The entry says the naming-convention + manual-purge-script approach was chosen and is implemented — it no longer says "tracked, not yet resolved."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
