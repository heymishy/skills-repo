# AC Verification Script: Add staging smoke test + manual promote gate to prod

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.6-smoke-test-promote-gate.md
**Technical test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.6-smoke-test-promote-gate-test-plan.md
**Script version:** 1 (update version if ACs change post-implementation)
**Verified by:** ______________ | **Date:** ______________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to this repository's GitHub Actions tab and Settings → Environments.
2. Know Hamish's GitHub username, to confirm reviewer assignment in Scenario 2.
3. This story's own DoD may only cover whatever `@mocked` suite coverage exists at the time (starting with bri-s3.1's mock-gateway smoke coverage) — do not expect a full 5-journey suite until later Epic 3 stories land. Scenario 1 checks the gate works with whatever coverage currently exists.

**Reset between scenarios:** No reset needed — each scenario observes a real CI run or a repo setting.

---

## Scenarios

### Scenario 1: The available `@mocked` suite runs against staging and reports a clear result

**Covers:** AC1

**Steps:**
1. Merge a change to `main` that triggers a staging deploy.
2. Watch the Actions run for a step that runs the `@mocked`-tagged Playwright suite against the staging URL, after the seed step.
3. Wait for that step to finish.

**Expected outcome:**
> A clear pass or fail result appears for the `@mocked` suite step, run against the staging URL (not localhost, not prod). Whatever specs currently carry the `@mocked` tag are the ones that ran — this is expected to grow over time as more of Epic 3 lands.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A green suite still requires Hamish's explicit approval before promoting

**Covers:** AC2

**Steps:**
1. After Scenario 1's suite passes, look at the Actions run for a promote/deploy-to-prod step.
2. Confirm it is not already running automatically — it should be waiting for approval, or require a separate manual trigger (e.g. "Run workflow" button).
3. Go to Settings → Environments in GitHub and open the environment used for the promote job.
4. Check the "Required reviewers" list.

**Expected outcome:**
> Promotion to `wuce-prod` does not happen automatically even though the suite is green — a distinct manual step is required. In Settings → Environments, the required reviewer is Hamish's own GitHub account, not a bot or service account.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A red suite structurally blocks the promote option

**Covers:** AC3

**Steps:**
1. Deliberately introduce a failing `@mocked` spec on a throwaway branch (or temporarily point the suite at a broken staging state, if safe to do so).
2. Merge/trigger the staging pipeline so the smoke-test job fails.
3. Look at the Actions run to see whether the promote job appears, runs, or is skipped.
4. Revert the deliberately-broken change afterward.

**Expected outcome:**
> When the smoke-test job fails, the promote job is skipped by GitHub Actions (shown as "skipped," not "waiting for approval" or "success"). There is no way to click through to promote — the option is structurally unavailable, not just discouraged.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A documented rollback path exists and is usable without guesswork

**Covers:** AC4

**Steps:**
1. Open the rollback runbook document (e.g. `docs/rollback-runbook.md`).
2. Read through it as if you had never seen it before and needed to roll back `wuce-prod` right now.
3. Confirm it names a specific command to find the previous known-good release (e.g. `fly releases --app wuce-prod`) and a specific command to redeploy it (e.g. `fly deploy --image ... --app wuce-prod` or `fly releases rollback`).
4. Do not actually execute the rollback against a real deploy — this is a read-through, not a live rehearsal.

**Expected outcome:**
> The runbook contains copy-pasteable, specific commands — not a vague description like "just revert it." Someone with repo access but no prior tribal knowledge could follow it successfully during a real incident.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — suite runs, clear result | | |
| Scenario 2 — manual approval still required on green | | |
| Scenario 3 — red suite blocks promote structurally | | |
| Scenario 4 — rollback path documented and usable | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
