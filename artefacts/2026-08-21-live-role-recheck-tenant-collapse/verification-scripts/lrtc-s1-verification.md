# AC Verification Script: Thread the authenticating person's identity through requireAdmin's live role re-check

**Story reference:** artefacts/2026-08-21-live-role-recheck-tenant-collapse/stories/lrtc-s1-thread-identity-through-live-role-recheck.md
**Technical test plan:** artefacts/2026-08-21-live-role-recheck-tenant-collapse/test-plans/lrtc-s1-test-plan.md
**Script version:** 1
**Verified by:** __________ | **Date:** __________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. This story's changes live in two files: `src/web-ui/middleware/require-admin.js` and `src/web-ui/server.js` (the admin-access gate and its wiring).
2. Run the automated checks with: `node tests/check-sec-perf-s2-stale-role-revalidation.js`
3. For the final confirmation (Scenario 3 below), run: `npx playwright test tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js -g "AC1: admin"`

**Reset between scenarios:** Not needed — each scenario below is independent.

---

## Scenarios

---

### Scenario 1: Two people sharing one team, only one of them an admin — each gets the correct outcome

**Covers:** AC1

**Steps:**
1. Run `node tests/check-sec-perf-s2-stale-role-revalidation.js`.
2. Look at the new test result described as "two distinct sessions resolve to two different, individually-correct roles" (added by this story).

**Expected outcome:**
> The test passes. Specifically: a person set up as "admin" is let through. A different person, sharing the same team, set up as "engineer," is turned away — even though, before this fix, a stale cached setting on their account said "admin." The system now checks each person's own, current, real role every time — not an arbitrary teammate's.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A single person with their own private workspace is unaffected

**Covers:** AC2

**Steps:**
1. Run `node tests/check-sec-perf-s2-stale-role-revalidation.js`.
2. Look at the test result for the solo-workspace case (added by this story).

**Expected outcome:**
> The test passes. Specifically: someone using their own private, single-person workspace (not a shared team) is let through exactly as before — this fix does not change anything for that everyday case.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The original bug report (bri-s3.3's admin/engineer test) is now fixed

**Covers:** AC3

**Steps:**
1. Run: `npx playwright test tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js -g "AC1: admin"`
2. Look at the result.

**Expected outcome:**
> The test passes. Specifically: on a real running copy of the app, an admin teammate can open the Admin Credits page, and an engineer teammate sharing the same team is correctly turned away — the exact real-world scenario that first surfaced this bug.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Post-merge smoke test note

If you have access to a real deployed environment with a shared team that has more than one person with different roles (an admin and at least one non-admin), the strongest possible manual check is: log in as the non-admin teammate and confirm you cannot open the Admin Credits page (`/admin/credits`) — you should see an access-denied response, not the page. This is the same check Scenario 3 automates, done by hand against real production data instead of test data.
