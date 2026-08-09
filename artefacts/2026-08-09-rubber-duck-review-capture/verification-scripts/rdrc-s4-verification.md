# AC Verification Script: Wire the agent-driven mode into CI against real staging

**Story reference:** artefacts/2026-08-09-rubber-duck-review-capture/stories/rdrc-s4-agent-driven-ci-wiring.md
**Technical test plan:** artefacts/2026-08-09-rubber-duck-review-capture/test-plans/rdrc-s4-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open `.github/workflows/e2e.yml` in an editor alongside this script.
2. Have this repo's `scenario-a-staging-e2e` job open in another tab/window for comparison — the new job should look structurally similar.

**Reset between scenarios:** Not needed — all scenarios read the same file.

---

## Scenarios

---

### Scenario 1: The new job exists and looks like its siblings

**Covers:** AC1

**Steps:**
1. Find the new job in `.github/workflows/e2e.yml`.
2. Compare its shape (checkout, setup, opt-in check, run steps, cleanup) against `scenario-a-staging-e2e`.

**Expected outcome:**
> The new job follows the same overall pattern as the existing staging jobs — nothing structurally surprising or ad hoc.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: It signs in the same safe way, no new credential path

**Covers:** AC2

**Steps:**
1. Look at the new job's environment variables / secrets.

**Expected outcome:**
> It uses the exact same secret names (`E2E_STAGING_BASE_URL`, `E2E_STAGING_AUTH_STUB_SECRET`, `E2E_STAGING_ADMIN_PASSWORD`) as the existing staging jobs — nothing new introduced.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The mock-gateway safety check runs first

**Covers:** AC3

**Steps:**
1. Look at the order of steps in the new job.

**Expected outcome:**
> A step that forces the mock gateway on runs before the step that actually makes any real review/LLM call — matching how the existing two staging jobs are already set up.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Findings land somewhere you'd actually see them

**Covers:** AC4

**Steps:**
1. Look at what the job does with its findings once the review step finishes.

**Expected outcome:**
> Findings go somewhere reviewable — a job summary, an uploaded file, or a clear note that a human needs to log them manually. Nothing in the job automatically opens a story, a PR, or takes any action on its own.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: The job can be turned off cleanly

**Covers:** AC5

**Steps:**
1. Find the opt-in flag check for the new job in `.github/context.yml`.
2. Imagine (or actually try) setting the flag to false/unset.

**Expected outcome:**
> With the flag off, the job's real steps are skipped with a clear log message explaining why — not an error, not a silent no-op that looks like something ran.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: The job actually runs, for real, once merged

**Covers:** AC1 (real-world confirmation)

**Steps:**
1. After this story merges, wait for (or trigger) a real run of this workflow.
2. Check the run's log for this specific job.

**Expected outcome:**
> The job actually executes — not skipped, not stuck — and completes with real output you can read, against real staging.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Scenario 4 | | |
| Scenario 5 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
