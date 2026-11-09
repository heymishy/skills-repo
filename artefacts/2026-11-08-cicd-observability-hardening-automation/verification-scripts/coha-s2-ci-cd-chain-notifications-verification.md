# AC Verification Script: CI/CD chain notifications (announce, status, auto-retry visibility)

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s2-ci-cd-chain-notifications.md
**Technical test plan:** artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s2-ci-cd-chain-notifications-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. This story has no user interface. Verification is done by watching the Teams channel while triggering real or simulated CI events.
2. Have access to the repository's GitHub Actions runs page and the test Teams channel open side by side.

**Reset between scenarios:** No reset needed — each scenario is a separate CI event.

---

## Scenarios

---

### Scenario 1: Merging to master announces the patch before deploy begins

**Covers:** AC1

**Steps:**
1. Merge a small test change to master.
2. Watch the Teams channel and the GitHub Actions run page at the same time.

**Expected outcome:**
> A message naming the commit or PR appears in the Teams channel before (or at the very start of) the deploy job's build/test steps — not after the deploy has already finished.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A finished CI run produces exactly one status message

**Covers:** AC2

**Steps:**
1. Let the merge from Scenario 1 run to completion.
2. Count how many status messages appear in the Teams channel for that one run.

**Expected outcome:**
> Exactly one message reports the outcome of the run (success or failure) — not zero, and not two separate messages for the same run.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A deploy-group eviction triggers an "auto-retry occurred" message

**Covers:** AC3

**Steps:**
1. Trigger (or wait for) a run that gets cancelled by a deploy-group eviction and automatically reruns — ask the implementer how to simulate this safely if a real eviction isn't convenient to produce on demand.
2. Watch the Teams channel.

**Expected outcome:**
> A message appears stating that an auto-retry happened for this run and giving the reason (a deploy-group eviction) — so you can tell at a glance this was handled automatically and you don't need to run `gh run rerun` yourself.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A genuine failure never produces a misleading retry message

**Covers:** AC4

**Steps:**
1. Trigger a run that fails for a real reason (not an eviction) — for example a deliberately broken test on a throwaway branch pushed through the same workflow path.
2. Watch the Teams channel.

**Expected outcome:**
> No message claims an auto-retry occurred. You see the normal failure status message from Scenario 2, and nothing suggesting the system automatically handled it.

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

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
