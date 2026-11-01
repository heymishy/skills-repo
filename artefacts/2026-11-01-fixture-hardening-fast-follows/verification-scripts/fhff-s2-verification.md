# AC Verification Script: Stop the deploy-group concurrency lock from silently cancelling E2E coverage

**Story reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/stories/fhff-s2-ci-deploy-group-concurrency-fix.md
**Technical test plan:** artefacts/2026-11-01-fixture-hardening-fast-follows/test-plans/fhff-s2-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the repo root.
2. Have `gh` (the GitHub CLI) available and authenticated.

**Reset between scenarios:** None needed.

---

## Scenarios

### Scenario 1: The concurrency lock still only applies to the one real shared app

**Covers:** AC2

**Steps:**
1. Open `.github/workflows/e2e.yml` and `.github/workflows/staging-deploy.yml`.
2. Find the `concurrency:` line for the deploy/E2E jobs.

**Expected outcome:**
> The value is still the plain word `deploy-group`, not something that includes the branch name or PR number. If it includes the branch/PR, that's wrong — it would let two different PRs deploy to the same real app at the same time.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The recovery mechanism tells a real cancellation apart from a real failure

**Covers:** AC3 (the part that can be checked without waiting for a real cancellation)

**Steps:**
1. Run the new detection function/script with the text `"Canceling since a higher priority waiting request for deploy-group exists"`.
2. Run it again with the text `"Process completed with exit code 1"`.

**Expected outcome:**
> The first one is recognized as "this should be retried." The second one is recognized as "this is a real failure, do not retry."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A real cancelled run actually gets rerun 🔴

**Covers:** AC1, AC3 (the real-world half)

**Steps:**
1. Watch for two pushes landing close together on a real PR (this story's own, or the next one) — the same pattern that already happened 3+ times this session.
2. If/when a Scenario A/B E2E job shows "Canceling since a higher priority waiting request for deploy-group exists" in its annotations, check whether it automatically reruns.

**Expected outcome:**
> The cancelled job reruns on its own, without you having to manually click "Re-run jobs."

**Result:** [ ] Pass  [ ] Fail
**Notes:** Marked 🔴 — this needs a real, naturally-occurring double-push to observe. If none happens during this story's own PR, check again on the next PR after merge.

---

### Edge case: Two PRs after this one show no unresolved cancellations

**Covers:** AC4

**Steps:**
1. After this story merges, watch the next 2 PRs' own E2E checks.
2. For each, check whether a cancellation happened and, if so, whether it auto-recovered.

**Expected outcome:**
> Across those 2 PRs, either no cancellation happens, or every one that does happen reruns on its own.

**Result:** [ ] Pass  [ ] Fail
**Notes:** This can only be checked once 2 more PRs exist after this one. If none exist yet, record this as "not yet measurable" rather than a fail.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 🔴 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
