# AC Verification Script: Drive product + first-feature creation via rough-idea/ideate, assert canvas and artefact persistence

**Story reference:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/a3-product-feature-ideate-canvas.md
**Technical test plan:** artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/a3-product-feature-ideate-canvas-test-plan.md
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have an authenticated, plan-active staging account ready (from A1/A2's scenarios).

**Reset between scenarios:** Each scenario creates its own `e2e-test-` tagged product/feature — no reset needed.

---

## Scenarios

---

### Scenario 1: Creating a product keeps its details after a page reload

**Covers:** AC1

**Steps:**
1. Click "New product."
2. Type a name and fill in the details form.
3. Click "Save" (or the equivalent submit button).
4. Refresh the page (F5 or the browser reload button).

**Expected outcome:**
> The product still appears in the products list with the exact same name and details you typed — the reload doesn't lose or change anything.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Creating a feature with "rough idea" opens an ideate session you can return to

**Covers:** AC2

**Steps:**
1. Open the product from Scenario 1.
2. Click "New feature."
3. Choose the "rough idea" option (as opposed to "formed idea").
4. Note the URL in the address bar.
5. Copy that URL, open a new browser tab, and paste it in.

**Expected outcome:**
> You're taken into an `/ideate` conversation. Opening the same URL in a new tab loads the exact same session (not a blank or new one).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The ideation canvas shows and updates as you chat

**Covers:** AC3

**Steps:**
1. In the `/ideate` session from Scenario 2, type a message describing your idea and send it.
2. Look at the canvas panel (usually on the right side of the screen).
3. Send a second message continuing the conversation.
4. Look at the canvas panel again.

**Expected outcome:**
> After the first message, the canvas shows at least one card or block related to what you typed (this may take a couple of tries if the model doesn't produce a card on the very first attempt — try re-sending or rephrasing up to 3 times). After the second message, at least one new card or block appears that wasn't there before — the canvas is not frozen/static.
> If, after 3 genuine attempts, no card ever appears at all, treat this as a known limitation (not a bug) and note it in Findings below rather than marking this scenario a hard failure.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: What's on the canvas matches what's actually saved

**Covers:** AC4

**Steps:**
1. After Scenario 3, ask an engineer to open the saved `/ideate` artefact file directly (from disk or the database — not the browser).
2. Compare its content to what the canvas showed in Scenario 3.

**Expected outcome:**
> The saved file's content matches what was shown on the canvas — nothing is different or missing.

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

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
