# AC Verification Script: Fix bri-s3.3's role-boundary regression guard so it actually asserts denial

**Story reference:** artefacts/2026-08-18-bri-s3-3-role-boundary-guard-gap/stories/rbg-s1-fix-role-boundary-regression-guard.md
**Technical test plan:** artefacts/2026-08-18-bri-s3-3-role-boundary-guard-gap/test-plans/rbg-s1-test-plan.md
**Script version:** 1
**Verified by:** __________ | **Date:** __________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. This story's changes live entirely inside one file: `tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js`. No app code changes.
2. Three test identities are already automatically created every time this test file runs — you don't need to set anything up by hand: "alice" (an admin), "bob" (an engineer), and "viewer" (a viewer).
3. Run the test file with: `npx playwright test tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js`

**Reset between scenarios:** Not needed — each scenario below is its own independent check within the same test run; the test file resets its own state each time you run it.

---

## Scenarios

---

### Scenario 1: The admin can open the Admin Credits page, but a regular team member cannot

**Covers:** AC1

**Steps:**
1. Run the test file.
2. Look at the result for the test named "AC1: admin (alice) succeeds on role-gated feature, engineer (bob) is denied".

**Expected outcome:**
> The test passes. Specifically: when "alice" (the admin) tries to open the Admin Credits page, she gets in successfully. When "bob" (a regular engineer, not an admin) tries to open the same page, he is turned away with a "Forbidden" (403) response — not let in.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A "viewer" team member also cannot open the Admin Credits page

**Covers:** AC2

**Steps:**
1. Run the test file (same run as Scenario 1 is fine).
2. Look at the result for the test named "AC2: viewer-role write attempt is denied" (or its renamed equivalent, if the test name changes during implementation — it will be the test that logs in as "viewer").

**Expected outcome:**
> The test passes. Specifically: when the "viewer" team member (someone with read-only-style access) tries to open the Admin Credits page, they are also turned away with a "Forbidden" (403) response — the same as the regular engineer in Scenario 1.
>
> **Important — what this scenario does NOT check:** it only checks that the viewer can't open this one specific admin page. It does not check whether a viewer can be stopped from making other kinds of changes elsewhere in the app (like creating a new product) — that turned out to not be built anywhere yet, and is being tracked as its own separate piece of work (see `artefacts/2026-08-21-viewer-role-no-enforcement/discovery.md`), not part of this fix.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The whole test file runs clean, with nothing broken

**Covers:** AC3

**Steps:**
1. Run the full test file: `npx playwright test tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js`
2. Check the summary line at the end of the run.

**Expected outcome:**
> All 5 tests in the file pass — the 2 fixed in Scenarios 1 and 2 above, plus the 3 that were already working before this fix (the "concurrent access" test, and the two housekeeping checks confirming no real AI-model calls were made during the test run).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Post-merge smoke test note

This story's fix only touches an automated test file — there is no new user-facing behaviour to click through in a browser. The three scenarios above (re-running the test file and checking the results) ARE the complete post-merge smoke test; no separate manual browser walkthrough is needed.
