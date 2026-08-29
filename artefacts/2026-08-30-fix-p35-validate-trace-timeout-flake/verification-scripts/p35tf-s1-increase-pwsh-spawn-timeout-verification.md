# AC Verification Script: Increase check-p3.5-validate-trace.js's pwsh spawn timeout

**Story reference:** artefacts/2026-08-30-fix-p35-validate-trace-timeout-flake/stories/p35tf-s1-increase-pwsh-spawn-timeout.md
**Technical test plan:** artefacts/2026-08-30-fix-p35-validate-trace-timeout-flake/test-plans/p35tf-s1-increase-pwsh-spawn-timeout-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:** Have a terminal open at the repo root with `pwsh` available.

---

## Scenarios

### Scenario 1: The timeout is defined once, not duplicated

**Covers:** AC1

**Steps:**
1. Open `tests/check-p3.5-validate-trace.js`.
2. Find the two places that spawn `pwsh` to run `validate-trace.ps1`.

**Expected outcome:**
> Both spawn calls reference the same named constant for their timeout — there is exactly one number to change if this ever needs adjusting again, not two.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The test file still works exactly as before, alone

**Covers:** AC2

**Steps:**
1. Run `node tests/check-p3.5-validate-trace.js`.

**Expected outcome:**
> All 5 tests pass, exactly as they did before this change — nothing about what's being checked has changed, only how long it's willing to wait.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The flake stops happening under the exact conditions that triggered it

**Covers:** AC3

**Steps:**
1. Run `node scripts/run-all-tests.js`.
2. Immediately run it again, a second time.

**Expected outcome:**
> Both times, `check-p3.5-validate-trace.js` passes cleanly — no "exited null" failure on the pwsh test, even right after a prior full run has left the machine under load.

**Result:** [ ] Pass  [ ] Fail
**Notes:** This scenario cannot be guaranteed with mathematical certainty (it's a timing-dependent fix), but two clean consecutive full-suite runs — immediately after each other, the exact condition that has triggered this flake 8 times before — is strong practical evidence.

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
