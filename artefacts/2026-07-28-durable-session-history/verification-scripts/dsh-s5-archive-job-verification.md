# AC Verification Script: Archive turns older than 60 days out of the hot table

**Story reference:** artefacts/2026-07-28-durable-session-history/stories/dsh-s5-archive-job.md
**Technical test plan:** artefacts/2026-07-28-durable-session-history/test-plans/dsh-s5-archive-job-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. This is a scheduled background job with no page of its own. Confirm it via the automated test output.
2. Ask an engineer to run `node tests/check-dsh-s5-archive-job.js` and share the output.

**Reset between scenarios:** No reset needed.

---

## Scenarios

### Scenario 1: Conversations older than 60 days move to long-term storage automatically

**Covers:** AC1

**Steps:**
1. Ask an engineer to confirm "Rows older than 60 days move to the archive table and are removed from the hot table" passes.

**Expected outcome:**
> The test passes. This confirms old conversations are automatically moved to cheaper long-term storage after 60 days, rather than sitting in the main database forever.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Recent conversations are left alone

**Covers:** AC2

**Steps:**
1. Ask an engineer to confirm "Rows within 60 days remain untouched" passes.

**Expected outcome:**
> The test passes. This confirms only genuinely old conversations get moved — anything from the last 60 days stays exactly where it is.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The cleanup job doesn't need a server running all the time

**Covers:** AC3

**Steps:**
1. Ask an engineer to confirm "Job exits cleanly — no process remains running after completion" passes.

**Expected outcome:**
> The test passes. This confirms the job runs on a schedule and switches itself off between runs, rather than needing a dedicated always-on server.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: One bad record doesn't stop the whole cleanup run

**Covers:** AC4

**Steps:**
1. Ask an engineer to confirm "A single row's archival failure doesn't abort the rest of the batch" passes.

**Expected outcome:**
> The test passes. This confirms that if one record has a problem while archiving, the job keeps going and archives everything else it can.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Nothing to archive is a normal outcome, not an error

**Covers:** AC5

**Steps:**
1. Ask an engineer to confirm "Zero eligible rows completes successfully with a clear log message" passes.

**Expected outcome:**
> The test passes. This confirms that on a day with nothing old enough to archive, the job just reports "0 archived" rather than failing or hanging.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Edge case (AC4) | | |
| Edge case (AC5) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
