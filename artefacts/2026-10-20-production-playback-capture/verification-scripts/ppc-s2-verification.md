# AC Verification Script: Extend to full-feature capture loop with timing validation

**Story reference:** `artefacts/2026-10-20-production-playback-capture/stories/ppc-s2.md`
**Technical test plan:** `artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s2-test-plan.md`
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. You need a tenant feature with at least 3 acceptance criteria.
2. Set capture targets (per `ppc-s1`'s own verification script, Scenario 2) for at least 2 of them, and deliberately leave at least 1 without a target so you can see the "skipped" behaviour in Scenario 6.
3. Scenarios 4 and 5 need a test administrator to simulate a slow run and a failing AC respectively — these aren't things you can trigger from the UI alone.

**Reset between scenarios:** Re-run "Capture all evidence" fresh for each scenario rather than relying on a previous run's state.

---

## Scenarios

---

### Scenario 1: Capturing evidence for every targeted AC in one action

**Covers:** AC1

**Steps:**
1. Open the playback-review page for a feature with multiple acceptance criteria, at least two of which already have capture targets set.
2. Click "Capture all evidence".

**Expected outcome:**
> The system captures a screenshot for every acceptance criterion that has a target set, one after another, without you needing to click "Capture evidence" separately for each one.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Loading state and blocking a second trigger

**Covers:** AC2

**Steps:**
1. Click "Capture all evidence".
2. While it's still running, try clicking "Capture all evidence" again.

**Expected outcome:**
> While the first run is in progress, you see a loading or progress indicator (e.g. "capturing AC 2 of 5"). Clicking the button again while it's running does not start a second run — you see a message saying a capture is already in progress.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Real capture time is recorded

**Covers:** AC3

**Steps:**
1. Complete a "Capture all evidence" run for a feature.
2. Check the feature's own record (ask your test administrator if this isn't visible in the UI yet) for how long the run took.

**Expected outcome:**
> A real elapsed time is recorded for that run — not a placeholder or estimate. The time reflects how long the capture actually took.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A slow run is flagged, not silently accepted

**Covers:** AC4

**Steps:**
1. Ask your test administrator to simulate a capture run that takes longer than 60 seconds.
2. Check the feature's decisions log after the run.

**Expected outcome:**
> A note appears in the decisions log flagging that the capture time exceeded 60 seconds and that async capture should be reconsidered. The capture run itself still completes and shows the acceptance criteria that succeeded.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: One failed AC doesn't lose the rest

**Covers:** AC5

**Steps:**
1. Ask your test administrator to simulate one acceptance criterion's capture failing during a run (e.g. by pointing its target at a page that doesn't exist).
2. Run "Capture all evidence" for that feature.

**Expected outcome:**
> The acceptance criteria that succeeded still show their screenshots. The one that failed shows a clear "Retry" option instead of a screenshot — the whole run does not come back empty or show an error page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: ACs with no target are skipped, not silently ignored

**Covers:** AC6

**Steps:**
1. Open a feature where at least one acceptance criterion has no capture target set.
2. Click "Capture all evidence".

**Expected outcome:**
> That acceptance criterion is clearly marked as skipped, with a reason shown (e.g. "no capture target set"). It is not left blank with no explanation, and it does not stop the other acceptance criteria from being captured.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Screen-reader progress announcement

**Covers:** NFR — Accessibility

**Steps:**
1. Turn on a screen reader (or ask someone who uses one to help).
2. Click "Capture all evidence" and listen for progress updates without looking at the screen.

**Expected outcome:**
> The screen reader announces progress updates (e.g. "capturing AC 2 of 5") as the run proceeds — not silence until it finishes.

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
| Scenario 6 | | |
| Edge case (screen reader) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
