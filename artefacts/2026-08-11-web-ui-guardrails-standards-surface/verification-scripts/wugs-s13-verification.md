# AC Verification Script: Admin sees real Approve/Reject buttons for pending promotion requests

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s13-approve-reject-ui.md
**Technical test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s13-approve-reject-ui-test-plan.md
**Script version:** 1
**Verified by:** Claude (agent), via automated test suite | **Date:** 2026-08-14 | **Context:** [x] Pre-code (TDD RED) [x] Post-merge (automated, this run) [ ] Demo

---

## Note on verification method

Unlike `wugs-s9`'s verification script (manual GitHub-check scenarios), every AC (AC1: Acceptance Criterion 1 — admin sees real buttons; AC2: Acceptance Criterion 2 — non-admin sees unchanged static text; AC3: Acceptance Criterion 3 — approve button wired with CSRF/disable/update; AC4: Acceptance Criterion 4 — reject button wired with CSRF/disable/update; AC5: Acceptance Criterion 5 — failure path re-enables button and shows error; AC6: Acceptance Criterion 6 — server-side role gate regression-only) in this story has 1:1 direct automated test coverage per the test plan's AC Coverage table — no manual browser walkthrough is required to demonstrate correctness. The scenarios below are the automated-test equivalent of the manual-scenario format used by sibling stories.

---

## Scenarios

---

### Scenario 1: Admin session sees real, wired buttons

**Covers:** AC1

**Steps:**
1. Run `node tests/check-wugs-s13-approve-reject-ui.js`.
2. Check the `AC1: adminSession_pendingRequest_rendersRealButtons` result.

**Expected outcome:**
> Rendered HTML for an admin session with a pending promotion request contains real `<button>` elements labelled "Approve" and "Reject", with the request's real `requestId` embedded — not the static "pending approval" text.

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed passing in Task 1 dispatch (TDD RED→GREEN) and re-confirmed in Task 4's full regression run.

---

### Scenario 2: Non-admin session is unaffected

**Covers:** AC2

**Steps:**
1. Run `node tests/check-wugs-s13-approve-reject-ui.js`.
2. Check the `AC2: nonAdminSession_pendingRequest_rendersStaticTextUnchanged` result.

**Expected outcome:**
> A non-admin session viewing the same pending request still sees the pre-existing static "Promotion requested — pending approval" text, with no buttons and no `requestId` leaked into the markup.

**Result:** [x] Pass  [ ] Fail
**Notes:** Passed on first run in Task 2 — confirmed Task 1's admin/non-admin branching had no bug (no source fix required).

---

### Scenario 3: Approve button calls the real endpoint with CSRF and updates the row

**Covers:** AC3

**Steps:**
1. Run `node tests/check-wugs-s13-approve-reject-ui.js`.
2. Check the `AC3: approveHandler_source_callsRealEndpointWithCsrfAndUpdatesRow` result.

**Expected outcome:**
> The `wugsApprove` client-side handler disables the button, calls `POST /api/admin/promotions/<requestId>/approve` with `_csrf` in the body, and on success replaces the row's buttons with a resolved-state indicator.

**Result:** [x] Pass  [ ] Fail
**Notes:** Independently confirmed by a spec-compliance review (dispatched separately) that the endpoint path, CSRF field, and DOM update are real, not merely test-shaped.

---

### Scenario 4: Reject button calls the real endpoint with CSRF and updates the row

**Covers:** AC4

**Steps:**
1. Run `node tests/check-wugs-s13-approve-reject-ui.js`.
2. Check the `AC4: rejectHandler_source_callsRealEndpointWithCsrfAndUpdatesRow` result.

**Expected outcome:**
> Same shape as Scenario 3, targeting `POST /api/admin/promotions/<requestId>/reject`.

**Result:** [x] Pass  [ ] Fail
**Notes:** Same independent review as Scenario 3.

---

### Scenario 5: Failure path re-enables the button and surfaces an error

**Covers:** AC5

**Steps:**
1. Run `node tests/check-wugs-s13-approve-reject-ui.js`.
2. Check the `AC5: approveAndRejectHandlers_failurePath_reEnableButtonAndShowError` result.

**Expected outcome:**
> On a non-ok fetch response, both `wugsApprove` and `wugsReject` re-enable their button (`disabled = false`) and surface a clear error (`alert(...)`) — not silently fail or leave the button permanently disabled.

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed for both functions independently, not just one, by the spec-compliance review.

---

### Scenario 6: wugs-s9's server-side role gate is unaffected (regression)

**Covers:** AC6

**Steps:**
1. Run `node tests/check-wugs-s9-approve-reject-promotion.js` (unchanged from before this story).

**Expected outcome:**
> `10 passed, 0 failed` — exactly matching the pre-story baseline, confirming this story's client-side-only changes did not touch or weaken the existing server-side role gate.

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed in Task 4's final regression pass.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (AC1) | Pass | |
| Scenario 2 (AC2) | Pass | |
| Scenario 3 (AC3) | Pass | |
| Scenario 4 (AC4) | Pass | |
| Scenario 5 (AC5) | Pass | |
| Scenario 6 (AC6) | Pass | |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

None.
