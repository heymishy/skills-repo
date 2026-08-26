# AC Verification Script: Show the /clarify and /estimate sub-step buttons live

**Story reference:** artefacts/2026-08-27-live-sidestep-buttons-missing/stories/lsbm-s1-live-substep-affordance-injection.md
**Technical test plan:** artefacts/2026-08-27-live-sidestep-buttons-missing/test-plans/lsbm-s1-test-plan.md
**Script version:** 1
**Verified by:** __________ | **Date:** __________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. This story's changes live in one file: `src/web-ui/routes/skills.js`.
2. Run the automated checks with: `node tests/check-lsbm-s1-live-substep-injection.js`
3. For a real, hands-on check: start a new discovery conversation and let it run to completion without reloading the page.

---

## Scenarios

---

### Scenario 1: Clarify/estimate buttons appear live, no reload needed

**Covers:** AC1

**Steps:**
1. Start a fresh `/discovery` conversation.
2. Answer through to the final turn (the one that completes the stage).
3. Watch the page — do not reload or navigate away.

**Expected outcome:**
> As soon as the model's final response finishes streaming, the "Before proceeding: 1a /clarify / 1b /estimate" buttons appear, alongside the "Continue →" button — without needing to reload the page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The live clarify button actually works

**Covers:** AC2

**Steps:**
1. From Scenario 1's state, click "1a /clarify".

**Expected outcome:**
> The button shows "Opening /clarify…" briefly, then navigates to a new `/clarify` side-trip chat session — identical to how it behaves after a page reload.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The live estimate form actually works

**Covers:** AC3

**Steps:**
1. From Scenario 1's state (or after Scenario 2, on a fresh run), click "1b /estimate", fill in the form, and submit.

**Expected outcome:**
> The form submits, the panel closes, and the button label updates to show "✓ logged" — identical to how it behaves after a page reload.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: No regression to the resume path

**Covers:** AC5 (regression guard)

**Steps:**
1. Start a fresh discovery conversation, complete it, then reload the page (or navigate away and click "Resume conversation").

**Expected outcome:**
> The buttons appear exactly as they always have on a resumed/reloaded already-done session — no visual or functional change from before this fix.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Post-merge smoke test note

Scenario 1 is the direct fix for the reported bug. Scenarios 2 and 3 confirm the live-appeared buttons are fully functional, not just visually present. Scenario 4 confirms the already-working resume path is untouched.
