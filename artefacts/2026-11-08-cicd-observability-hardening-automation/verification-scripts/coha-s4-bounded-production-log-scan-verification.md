# AC Verification Script: Bounded production-log scan with pattern-match notification

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s4-bounded-production-log-scan.md
**Technical test plan:** artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s4-bounded-production-log-scan-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. This story has no user interface. Verification is done by checking the GitHub Actions scheduled-run history and the test Teams channel.
2. Have access to the repository's GitHub Actions run page and the Teams channel open.

**Reset between scenarios:** No reset needed — each scenario is a separate scheduled run.

---

## Scenarios

---

### Scenario 1: The scan runs on schedule and finishes — it never keeps running

**Covers:** AC1

**Steps:**
1. Open the GitHub Actions run page and find the scheduled log-scan workflow's most recent run.
2. Check its status and duration.

**Expected outcome:**
> The run shows as completed (not still running, not stuck), with a clear start and end time — it finished and exited, it did not keep running in the background.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A known error pattern in the logs produces a notification with enough detail to investigate

**Covers:** AC2

**Steps:**
1. Ask the implementer to trigger a test run against a log excerpt containing the known `tenant_admin_bootstrap_failed` pattern (via a test/dry-run mode, not against real production logs).
2. Watch the Teams channel.

**Expected outcome:**
> A message appears that includes a timestamp, the name of the matched error pattern, and a short excerpt of the log line — enough that you could start investigating without needing to run the scan yourself again.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A quiet period produces no notification

**Covers:** AC3

**Steps:**
1. Let a scheduled run complete against a period with no known error patterns present.
2. Watch the Teams channel.

**Expected outcome:**
> No message appears for this run. The channel stays quiet — a clean period never produces a false alarm.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: The first real defect this scan catches becomes the baseline measurement

**Covers:** AC4

**Steps:**
1. When a real production defect is confirmed (by any means) to have appeared in the logs, note the timestamp it first appeared.
2. Note the timestamp the scheduled scan's notification for that defect arrived.
3. Record the gap between the two in the benefit-metric artefact, as the first real measurement of detection latency.

**Expected outcome:**
> The gap between "defect appeared" and "scan notified" is written down somewhere durable (the benefit-metric.md baseline), replacing the current `[UNKNOWN BASELINE]` placeholder with a real number.

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
