# AC Verification Script: Close the CSRF-persist race with process suspend

**Story reference:** artefacts/2026-08-27-csrf-persist-race-on-suspend/stories/cpr-s1-await-csrf-persist-before-response.md
**Technical test plan:** artefacts/2026-08-27-csrf-persist-race-on-suspend/test-plans/cpr-s1-test-plan.md
**Script version:** 1
**Verified by:** __________ | **Date:** __________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. This story's changes touch `src/web-ui/middleware/csrf.js`, `src/web-ui/middleware/session.js`, and 12 route files (see the DoR's Coding Agent Instructions for the full list).
2. Run the automated checks with: `node tests/check-cpr-s1-csrf-persist-race.js`

---

## Scenarios

---

### Scenario 1: `/dashboard` still renders correctly (the one non-mechanical change)

**Covers:** the `dashboard.js` `handleDashboard` async conversion

**Steps:**
1. Sign in and navigate to `/dashboard`.

**Expected outcome:**
> The page renders exactly as before — product list, nav, impersonation banner (if applicable) all present and correct.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: repeat the exact live reproduction that surfaced this bug

**Covers:** AC1, AC2, AC6 (the real-world proof)

**Steps:**
1. On a deployed environment with `min_machines_running=0` (e.g. `wuce-staging`), load a page containing a CSRF-protected form (e.g. a completed discovery stage's "Continue" button).
2. Wait for the machine to idle-suspend (or force it, if you have deploy access).
3. Without reloading the page, submit the form.

**Expected outcome:**
> The form submits successfully — no "Forbidden" response, even though the machine genuinely restarted between the page load and the submission.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Post-merge smoke test note

Scenario 2 is the direct, real-world repeat of the exact failure this story fixes — it's the same steps that surfaced `ctpr-s1`'s residual gap live on staging. Scenario 1 confirms the one non-mechanical code change (dashboard.js) didn't regress.
