# AC Verification Script: Rebuild the breadcrumb "view a completed stage" page into a chat+artefact split view

**Story reference:** artefacts/2026-07-28-durable-session-history/stories/dsh-s3-rebuild-breadcrumb-view.md
**Technical test plan:** artefacts/2026-07-28-durable-session-history/test-plans/dsh-s3-rebuild-breadcrumb-view-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Sign in to the app and open any feature that has at least one completed pipeline stage (e.g. Discovery).
2. Have the feature's URL handy — you'll click a breadcrumb step to reach the page under test.

**Reset between scenarios:** No reset needed — each scenario uses a different feature/stage.

---

## Scenarios

### Scenario 1: Clicking a completed stage in the breadcrumb shows the real conversation, not just the document

**Covers:** AC1

**Steps:**
1. Open a feature you've completed at least one stage on (e.g. Discovery).
2. Click that stage's step in the breadcrumb strip at the top of the page.

**Expected outcome:**
> The page shows two panels side by side: on the left, the actual back-and-forth conversation that produced this stage's document; on the right, the finished document itself. This is new — previously this page only showed the document with no conversation at all.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: An older stage with no saved conversation still shows the document cleanly

**Covers:** AC2

**Steps:**
1. Open a feature that was completed before this update shipped (ask an engineer to identify one, since new features won't hit this case).
2. Click that stage's breadcrumb step.

**Expected outcome:**
> The page still shows the finished document, exactly as it did before this update. No error message, no broken or empty panel — this is expected, since conversations from before this update were never saved and cannot be recovered.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Editing the document from this page still works exactly as before

**Covers:** AC3

**Steps:**
1. From the page in Scenario 1, click "Edit artefact".
2. Make a small change and save.

**Expected outcome:**
> The document updates with your change, exactly as this always worked before this update.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: You can't reach another customer's stage by guessing its link

**Covers:** AC4

**Steps:**
1. Ask an engineer to confirm the existing cross-tenant protection test (`check-p0.2-journey-guard-wiring.js`) still passes after this update.

**Expected outcome:**
> The test passes — attempting to view another customer's stage still shows "Not Found," exactly as before.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: The conversation panel is read-only — no way to type a new message yet

**Covers:** AC5

**Steps:**
1. On the page from Scenario 1, look at the conversation panel on the left.

**Expected outcome:**
> There is no text box or "send" button in the conversation panel — it's a read-only history for now. (The ability to continue the conversation from here is planned as a follow-up, not part of this change.)

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
