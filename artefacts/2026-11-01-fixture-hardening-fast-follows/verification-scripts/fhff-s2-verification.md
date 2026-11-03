# AC Verification Script: Stop the deploy-group concurrency lock from silently cancelling E2E coverage

**Story reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/stories/fhff-s2-ci-deploy-group-concurrency-fix.md
**Technical test plan:** artefacts/2026-11-01-fixture-hardening-fast-follows/test-plans/fhff-s2-test-plan.md
**Script version:** 1
**Verified by:** Copilot (/verify-completion) | **Date:** 2026-11-04 | **Context:** [x] Pre-code (post-implementation, pre-PR)  [ ] Post-merge  [ ] Demo

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

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed fresh via `grep -n "^\s*concurrency:" .github/workflows/e2e.yml .github/workflows/staging-deploy.yml` — all 3 lines (e2e.yml:151, e2e.yml:375, staging-deploy.yml:58) are the bare string `deploy-group`, unchanged by this story. Also covered by `tests/check-fhff-s2-deploy-group-eviction.js`'s AC2 checks (11/11 passing, part of the fresh full-suite run above).

---

### Scenario 2: The recovery mechanism tells a real cancellation apart from a real failure

**Covers:** AC3 (the part that can be checked without waiting for a real cancellation)

**Steps:**
1. Run the new detection function/script with the text `"Canceling since a higher priority waiting request for deploy-group exists"`.
2. Run it again with the text `"Process completed with exit code 1"`.

**Expected outcome:**
> The first one is recognized as "this should be retried." The second one is recognized as "this is a real failure, do not retry."

**Result:** [x] Pass  [ ] Fail
**Notes:** Ran fresh: `isDeployGroupEviction('Canceling since a higher priority waiting request for deploy-group exists')` → `true`; `isDeployGroupEviction('Process completed with exit code 1')` → `false`. Also independently re-verified during `/subagent-execution` against the real historical API response for a genuine deploy-group eviction (job id 124773105599, PR #1049) — the current implementation correctly fetches this text from the check-runs annotations endpoint (not the jobs-list endpoint, which was an earlier implementation bug, found and fixed before this verification).

---

### Scenario 3: A real cancelled run actually gets rerun 🔴

**Covers:** AC1, AC3 (the real-world half)

**Steps:**
1. Watch for two pushes landing close together on a real PR (this story's own, or the next one) — the same pattern that already happened 3+ times this session.
2. If/when a Scenario A/B E2E job shows "Canceling since a higher priority waiting request for deploy-group exists" in its annotations, check whether it automatically reruns.

**Expected outcome:**
> The cancelled job reruns on its own, without you having to manually click "Re-run jobs."

**Result:** [ ] Pass  [ ] Fail (not yet measurable)
**Notes:** No PR exists yet for this story (pre-`/branch-complete`) — cannot be observed before a real PR/push exists. Deferred to `/definition-of-done`, same honest-scoping precedent as `fhff-s1`'s own AC4 real-CI-timing deferral. Will check this story's own PR first (the pattern has recurred 3+ times already this session), then the next PR after merge if it doesn't occur here.

---

### Edge case: Two PRs after this one show no unresolved cancellations

**Covers:** AC4

**Steps:**
1. After this story merges, watch the next 2 PRs' own E2E checks.
2. For each, check whether a cancellation happened and, if so, whether it auto-recovered.

**Expected outcome:**
> Across those 2 PRs, either no cancellation happens, or every one that does happen reruns on its own.

**Result:** [ ] Pass  [ ] Fail (not yet measurable)
**Notes:** By definition requires 2+ PRs after this one merges — none exist yet. Recorded as not-yet-measurable per the test plan's own handling; deferred to `/definition-of-done` with a follow-up re-check once 2 subsequent PRs exist.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | ✅ Pass | Bare `deploy-group` confirmed in both workflow files |
| Scenario 2 | ✅ Pass | Decision function correctly distinguishes real eviction text from real failure text |
| Scenario 3 🔴 | ⏸ Not yet measurable | No PR exists yet; deferred to `/definition-of-done` |
| Edge case | ⏸ Not yet measurable | Requires 2+ subsequent PRs; deferred to `/definition-of-done` |

**Overall verdict:** [x] All testable-now scenarios pass — ready to proceed; 2 real-environment scenarios (AC1/AC3 trigger half, AC4) explicitly deferred to `/definition-of-done` by design, not a gap (same precedent as `fhff-s1`'s AC4).
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
