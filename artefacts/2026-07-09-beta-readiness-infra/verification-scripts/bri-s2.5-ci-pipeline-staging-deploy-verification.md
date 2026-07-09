# AC Verification Script: Build the CI pipeline — PR checks through staging deploy

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.5-ci-pipeline-staging-deploy.md
**Technical test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.5-ci-pipeline-staging-deploy-test-plan.md
**Script version:** 1 (update version if ACs change post-implementation)
**Verified by:** ______________ | **Date:** ______________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to this repository's GitHub page, including the "Actions" tab and Settings → Rules (branch protection).
2. Have permission to open a test pull request (a trivial, throwaway change is fine).
3. No local environment setup needed — everything in this script happens on GitHub's website.

**Reset between scenarios:** No reset needed. Scenario 1 uses a throwaway PR you can close afterward. Scenario 2 observes a real merge to `main`.

---

## Scenarios

### Scenario 1: A PR runs lint, typecheck, tests, and build — and a failure blocks merging

**Covers:** AC1

**Steps:**
1. Open a small test pull request against `main` (e.g. a one-line comment change).
2. Watch the "Checks" section at the bottom of the PR page.
3. Confirm lint, typecheck, `npm test`, and a build step all appear and run.
4. Go to Settings → Rules (or Branches) for this repository and check whether these checks are listed as "required" status checks for merging into `main`.

**Expected outcome:**
> All four checks (lint, typecheck, unit test chain, build) appear on the PR and run to completion. In the repository's branch protection settings, these checks are configured as required — meaning a red check genuinely blocks the "Merge" button, not just shows a warning.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Merging to main deploys to wuce-staging, not wuce-prod

**Covers:** AC2

**Steps:**
1. Merge the test PR from Scenario 1 (or any real PR) into `main`.
2. Open the "Actions" tab and find the workflow run triggered by that merge.
3. Read the deploy step's log output for the target app name.

**Expected outcome:**
> The workflow run's deploy step shows it deployed to `wuce-staging`. Nothing in this workflow run touches `wuce-prod` — no step references the production app at all.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The seed script runs automatically right after the staging deploy

**Covers:** AC3

**Steps:**
1. In the same Actions run from Scenario 2, look at the steps that follow the deploy step.
2. Confirm a seed-script step appears and runs without any manual click or approval.

**Expected outcome:**
> Immediately after the deploy step, a step running the anonymized seed script (from S2.4) executes automatically, as part of the same pipeline run — Hamish did not have to trigger it separately.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: No push-to-main workflow ever deploys straight to wuce-prod

**Covers:** AC4

**Steps:**
1. Open the repository's `.github/workflows/` folder on GitHub.
2. Open every `.yml` file that is triggered on push to `main`.
3. Search each one for any deploy command referencing `wuce-prod` (or the production Fly app).

**Expected outcome:**
> No workflow triggered by a push to `main` contains a deploy step targeting the production app, except for the separate manual-approval "promote" job introduced by S2.6 (which requires an explicit human approval step, not an automatic push trigger).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — PR checks + merge block | | |
| Scenario 2 — auto-deploy to staging only | | |
| Scenario 3 — auto seed after deploy | | |
| Scenario 4 — no push-to-main deploys to prod | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
