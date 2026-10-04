# AC Verification Script: Fix validate-trace.ps1's discovery_approved false positive

**Story reference:** artefacts/2026-10-04-trace-validation-ps1-parity-fix/stories/tvpf-s1-fix-discovery-approved-false-positive.md
**Technical test plan:** artefacts/2026-10-04-trace-validation-ps1-parity-fix/test-plans/tvpf-s1-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a PowerShell terminal in the repo root.
2. Have `pwsh` available (PowerShell 7+).

**Reset between scenarios:** None needed — each scenario is read-only or self-cleaning.

---

## Scenarios

### Scenario 1: An already-approved feature with a historical "status...Draft" note is no longer falsely flagged

**Covers:** AC1

**Steps:**
1. Run: `pwsh -NonInteractive -File scripts\validate-trace.ps1 -check discovery_approved`

**Expected outcome:**
> The command exits with code 0 (check `$LASTEXITCODE` after running — it should print `0`). Neither `new-feature-2b74a292` nor `new-feature-af17f555` appears anywhere in the output as "still Draft."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A genuinely un-approved feature is still correctly flagged

**Covers:** AC2

**Steps:**
1. Temporarily create a test folder `artefacts/zzz-verification-draft-test` with a `discovery.md` file containing just the line `**Status:** Draft`.
2. Run: `pwsh -NonInteractive -File scripts\validate-trace.ps1 -check discovery_approved`
3. Delete the test folder afterward.

**Expected outcome:**
> The command exits with a non-zero code, and the output names `zzz-verification-draft-test` as "still Draft." This confirms the fix didn't break real detection — it only stopped the false positive.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Full `npm test` run shows no new failures

**Covers:** AC3, AC4 (regression confirmation)

**Steps:**
1. Run: `npm test`

**Expected outcome:**
> The full suite completes with the same result as before this fix, except `tests/check-p3.5-validate-trace.js`'s own `ps1-exits-0-on-valid-repo-with-ci-flag` test now PASSES (it was the one known pre-existing failure this whole story exists to fix).

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
