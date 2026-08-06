# AC Verification Script: Automatically reflect a web-UI journey stage completion in pipeline-state.json

**Story reference:** artefacts/2026-08-07-cross-surface-state-sync/stories/css-s2-web-ui-journey-reflects-on-pipeline-state.md
**Technical test plan:** artefacts/2026-08-07-cross-surface-state-sync/test-plans/css-s2-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Sign in to the web UI with a real GitHub account connected to a test repo.
2. Have a journey in progress for a feature that has a matching entry in that repo's `pipeline-state.json`.
3. Run `npm test` first to confirm the automated suite passes before doing manual verification.

**Reset between scenarios:** Complete a different stage on a fresh test journey for each scenario, so completions don't interfere with each other.

---

## Scenarios

---

### Scenario 1: Completing a stage on the web UI writes to pipeline-state.json under your own GitHub identity

**Covers:** AC1

**Steps:**
1. Complete a stage (e.g. DoR sign-off) on a repo-connected journey in the web UI.
2. Open the connected repo's commit history on GitHub for `.github/pipeline-state.json`.

**Expected outcome:**
> A new commit updating `pipeline-state.json` appears, and the commit's author is you — your own GitHub username and avatar, not a bot or service account.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The stage-completion response doesn't feel noticeably slower

**Covers:** AC2

**Steps:**
1. Time how long it takes for the stage-completion action to show as "done" in the web UI.

**Expected outcome:**
> The response feels the same speed as any other stage completion you've done in the web UI before — no long added wait.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: If the pipeline-state.json write fails, your stage completion still goes through

**Covers:** AC3

**Steps:**
1. (Requires a test setup where the connected repo write is deliberately made to fail — e.g. a repo the app's token can't write to.)
2. Complete a stage on that journey anyway.

**Expected outcome:**
> The web UI still shows the stage as completed for you — it doesn't get stuck or show an error just because the `pipeline-state.json` side failed. Separately, a reconciliation-gap log entry exists somewhere the platform maintainer can check (location confirmed at implementation time).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A journey for a feature that isn't in pipeline-state.json at all

**Covers:** AC4

**Steps:**
1. Complete a stage on a journey whose feature slug has no matching entry in the connected repo's `pipeline-state.json`.

**Expected outcome:**
> The stage completes normally — no error message, and nothing tries to write a new entry into `pipeline-state.json` for a feature that was never there.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
