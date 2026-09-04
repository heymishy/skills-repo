# AC Verification Script: Staging deploy workflow skips bookkeeping-only pushes to master

**Story reference:** artefacts/2026-09-04-staging-deploy-skip-bookkeeping-pushes/stories/sdsb-s1-skip-staging-deploy-for-bookkeeping-only-pushes.md
**Technical test plan:** artefacts/2026-09-04-staging-deploy-skip-bookkeeping-pushes/test-plans/sdsb-s1-test-plan.md
**Script version:** 1
**Verified by:** Claude Code (agent, operator-directed — Hamish King) | **Date:** 2026-09-04 | **Context:** [x] Post-merge

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

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed with commit `b5626450` ("chore: definition-of-done sdsb-s1 -- COMPLETE"), touching only `.github/pipeline-state.json` and `artefacts/2026-09-04-staging-deploy-skip-bookkeeping-pushes/dod/`. `gh run list --branch master --workflow staging-deploy.yml --limit 3` showed the most recent run still anchored to the prior commit (`7bff10df`, the sdsb-s1 merge itself) — no run at all was created for `b5626450`. This is the first genuine bookkeeping-only push to land after the fix went live, so this is a real confirmation, not a synthetic test push.

---

### Scenario 2: A push that also touches code still triggers the full pipeline

**Covers:** AC3 (regression guard)

**Steps:**
1. Push a commit to master that changes at least one file under `src/` or `tests/`, optionally bundled with a `workspace/state.json` or `artefacts/**` change in the same commit.
2. Check `gh run list --branch master --workflow staging-deploy.yml --limit 3`.

**Expected outcome:**
> A new "Staging Deploy" run appears and runs its full `deploy-staging` -> `smoke-test` -> `promote-to-prod` (approval-gated) pipeline exactly as before this story.

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed by `sdsb-s1`'s own merge commit (`7bff10df`), which touched `.github/workflows/staging-deploy.yml` and `tests/check-sdsb-s1-staging-deploy-paths-ignore.js` (real code, not bookkeeping-only). `gh run list` showed a full new "Staging Deploy" run (`33849246230`) triggered for that commit and progressed normally through `deploy-staging`.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | Pass | Confirmed via commit `b5626450` -- no run created |
| Scenario 2 | Pass | Confirmed via commit `7bff10df` (the merge itself) -- full run triggered |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
