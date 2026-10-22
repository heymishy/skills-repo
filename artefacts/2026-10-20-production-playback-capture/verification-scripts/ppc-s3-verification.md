# AC Verification Script: Rate-limit the capture-trigger endpoint per tenant user

**Story reference:** `artefacts/2026-10-20-production-playback-capture/stories/ppc-s3.md`
**Technical test plan:** `artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s3-test-plan.md`
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. You need two test user accounts within the same tenant (for Scenario 2).
2. Know the configured rate-limit window length (ask your test administrator) so you can wait it out for Scenario 3.

**Reset between scenarios:** Wait for the rate-limit window to pass before starting the next scenario, so an earlier scenario's rejection doesn't carry over.

---

## Scenarios

---

### Scenario 1: Triggering capture twice quickly is blocked the second time

**Covers:** AC1

**Steps:**
1. Trigger a capture (either a single acceptance criterion or "Capture all evidence").
2. Immediately trigger another capture again, within the same minute.

**Expected outcome:**
> The second attempt is rejected with a clear message (for example, "You're capturing too quickly — please wait before trying again"). It does not silently do nothing, and it does not start a second capture running alongside the first.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Another person on my team isn't blocked by my own usage

**Covers:** AC2

**Steps:**
1. As User A, trigger a capture, then immediately trigger another so User A is now rate-limited.
2. Log out and log in as User B (same tenant, different person).
3. Trigger a capture as User B.

**Expected outcome:**
> User B's capture runs normally — User A's rate limit does not affect User B.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Waiting resets the limit

**Covers:** AC3

**Steps:**
1. Trigger a capture, then immediately trigger another so you're rate-limited.
2. Wait for the rate-limit window to pass.
3. Trigger a capture again.

**Expected outcome:**
> The capture runs normally this time — you are not still blocked once the window has passed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Accessible error message

**Covers:** NFR — Accessibility

**Steps:**
1. Trigger the rate-limit rejection from Scenario 1.
2. Using a screen reader, check whether the rejection message is announced.

**Expected outcome:**
> The rate-limit message is announced by the screen reader when it appears — it is not a silent, visual-only toast that only sighted users would notice.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Edge case (accessible error) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
