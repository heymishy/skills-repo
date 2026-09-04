# AC Verification Script: Staging deploy workflow skips bookkeeping-only pushes to master

**Story reference:** artefacts/2026-09-04-staging-deploy-skip-bookkeeping-pushes/stories/sdsb-s1-skip-staging-deploy-for-bookkeeping-only-pushes.md
**Technical test plan:** artefacts/2026-09-04-staging-deploy-skip-bookkeeping-pushes/test-plans/sdsb-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to the GitHub Actions run history for this repo (`gh run list --branch master` or the Actions tab).
2. This story must already be merged to master.

---

## Scenarios

---

### Scenario 1: A bookkeeping-only push does not trigger a new Staging Deploy run

**Covers:** AC2

**Steps:**
1. Push a commit to master that touches only `workspace/state.json` (or another file under `workspace/**`, `artefacts/**`, or `.github/pipeline-state.json`).
2. Check `gh run list --branch master --workflow staging-deploy.yml --limit 3`.

**Expected outcome:**
> No new "Staging Deploy" run appears for that commit's SHA -- the workflow was skipped entirely, not run-and-passed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A push that also touches code still triggers the full pipeline

**Covers:** AC3 (regression guard)

**Steps:**
1. Push a commit to master that changes at least one file under `src/` or `tests/`, optionally bundled with a `workspace/state.json` or `artefacts/**` change in the same commit.
2. Check `gh run list --branch master --workflow staging-deploy.yml --limit 3`.

**Expected outcome:**
> A new "Staging Deploy" run appears and runs its full `deploy-staging` -> `smoke-test` -> `promote-to-prod` (approval-gated) pipeline exactly as before this story.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
