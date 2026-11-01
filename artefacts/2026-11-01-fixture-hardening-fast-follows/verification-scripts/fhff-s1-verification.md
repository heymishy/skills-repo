# AC Verification Script: Sweep fragile wall-clock NFR budgets and re-tune run-all-tests.js's concurrency cap

**Story reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/stories/fhff-s1-nfr-budget-sweep-concurrency-retune.md
**Technical test plan:** artefacts/2026-11-01-fixture-hardening-fast-follows/test-plans/fhff-s1-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the repo root.
2. Close other heavy applications so timing readings are clean (same requirement as `tfhc-s9`'s own Scenario 4).

**Reset between scenarios:** None needed.

---

## Scenarios

### Scenario 1: The 4 known flaky files now pass reliably, every time

**Covers:** AC1

**Steps:**
1. Run `npm test` 5 times in a row.
2. Each time, check whether `check-rb-s3-harness-agnostic-instructions.js`, `check-cat-s4-features-page-integration.js`, `check-cat-s1-core-trace-builder.js`, or `check-bri-s2.2-neon-staging-branch.js` appear in the failed-files list.

**Expected outcome:**
> None of those 4 files appear as failed in any of the 5 runs.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The concurrency cap really did go up

**Covers:** AC2

**Steps:**
1. Run `node -e "console.log(require('./scripts/run-all-tests.js').getPoolConcurrency())"`.
2. Compare the printed number to `node -e "console.log(Math.ceil(require('os').cpus().length / 3))"` (the old value).

**Expected outcome:**
> The first number is bigger than the second number.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Nothing else broke

**Covers:** AC3

**Steps:**
1. Run `npm test` 3 times.
2. Compare the failed-files list each time against the known baseline: the pipeline-state-integrity flag, the pcr-s1 flake, and (occasionally) one unrelated file that also passes on its own.

**Expected outcome:**
> No file outside that known list shows up as failed, in any of the 3 runs.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The real GitHub Actions job is actually faster 🔴

**Covers:** AC4

**Steps:**
1. Once this story's own PR is open, run `gh pr checks <PR number>` to find the "Lint, typecheck, test, build" job's run ID.
2. Run `gh api repos/heymishy/skills-repo/actions/jobs/<job id> --jq '.steps[] | select(.name == "Unit test chain")'` to get its start/end time.
3. Compare the duration to 124 seconds (the time recorded before this story).

**Expected outcome:**
> The new duration is less than 124 seconds.

**Result:** [ ] Pass  [ ] Fail
**Notes:** Marked 🔴 — a real timing measurement that can vary with load, not an automatic CI check. Re-run once if the first result looks unusually slow before recording a Fail.

---

### Edge case: If a fix would make an NFR meaningless, it gets deferred instead of forced through

**Covers:** AC5

**Steps:**
1. Open `artefacts/2026-11-01-fixture-hardening-fast-follows/decisions.md`.
2. Check whether any entry says a file's fix was deferred because a safe widen wasn't possible.

**Expected outcome:**
> If no such entry exists, that's fine — it means none of the 4 files needed this. If one does exist, it should clearly name which file and why a wider threshold wasn't a safe option.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Scenario 4 🔴 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
