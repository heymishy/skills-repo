# AC Verification Script: Increase the session-persist timeout to close the suspend race

**Story reference:** artefacts/2026-08-30-csrf-persist-timeout-race/stories/cptr-s1-increase-persist-timeout-to-close-suspend-race.md
**Technical test plan:** artefacts/2026-08-30-csrf-persist-timeout-race/test-plans/cptr-s1-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:** No special setup — the automated scenarios below are unit tests. Scenario 4 is the real-world post-merge smoke test.

---

## Scenarios

### Scenario 1: A moderately slow write still lands before the response goes out

**Covers:** AC1

**Steps:**
1. Simulate a session write that takes about 2 seconds — slower than the old 500ms cutoff, well within the new bound.

**Expected outcome:**
> The write is confirmed complete before the code moves on — it's not left to finish in the background after the fact.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A genuinely broken write still doesn't hang forever

**Covers:** AC4

**Steps:**
1. Simulate a write that never completes (e.g. Redis is fully down).

**Expected outcome:**
> Processing still gives up after a bounded wait (around 8 seconds) rather than hanging indefinitely.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Ordinary cases (no adapter, or a write that fails outright) are unaffected

**Covers:** AC2, AC3

**Steps:**
1. Confirm the existing behaviour for "no Redis configured" and "Redis rejects the write" is unchanged.

**Expected outcome:**
> Both cases behave exactly as they did before this fix.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4 (real prod smoke test): The original bug no longer reproduces

**Covers:** End-to-end confidence, post-merge

**Steps:**
1. On staging or production, load a `/discovery` page (or any page that mints a fresh CSRF token) after the app has been idle long enough to have suspended.
2. Immediately navigate forward (e.g. to `/clarify` or the next stage) without an intervening reload.
3. Repeat a few times across different idle-then-resume windows if practical.

**Expected outcome:**
> No blank "Forbidden" page appears. The flow proceeds normally.

**Result:** [ ] Pass  [ ] Fail
**Notes:** This is the direct real-world reproduction of the bug this story fixes — the strongest available confidence signal, run post-merge since it depends on real Fly suspend/resume timing that cannot be forced in a local test.

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
