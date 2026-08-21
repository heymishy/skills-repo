# AC Verification Script: Fix the read-only-view maximise-button ReferenceError and the stuck "Assigning…" button label

**Story reference:** artefacts/2026-08-21-canvas-maximise-and-bulk-assign-button-fixes/stories/cmba-s1-fix-readonly-maximise-and-stuck-button-label.md
**Technical test plan:** artefacts/2026-08-21-canvas-maximise-and-bulk-assign-button-fixes/test-plans/cmba-s1-test-plan.md
**Script version:** 1
**Verified by:** __________ | **Date:** __________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. This story's changes live in two files: `src/web-ui/views/chat-view.js` (the maximise buttons) and `src/web-ui/routes/products.js` (the bulk-assign button).
2. Run the automated checks with: `node tests/check-cmba-s1-readonly-maximise-and-stuck-label.js`
3. For a real, hands-on check: start the local server (`node --env-file=.env src/web-ui/server.js`) and open a browser.

**Reset between scenarios:** Not needed.

---

## Scenarios

---

### Scenario 1: Opening an old, already-finished conversation and clicking "Maximise diagrams" actually works

**Covers:** AC1

**Steps:**
1. Resume a past `/design` or `/definition` conversation (one that's already complete, so it opens in the read-only/historical view).
2. Click the "Maximise diagrams" button (the small square icon near the diagrams panel).
3. Open your browser's developer console (F12) and check for any red error text.

**Expected outcome:**
> The diagrams panel expands to fill the screen. No red error appears in the console. Clicking the button again shrinks it back to normal size.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The other fullscreen button on the same old conversation also works

**Covers:** AC2

**Steps:**
1. On the same resumed, read-only conversation view, find the artefact panel's own fullscreen toggle button (a similar small square icon).
2. Click it.

**Expected outcome:**
> The artefact panel expands to fill the screen, with no error in the console. Clicking again restores the normal split view.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A live, in-progress conversation's maximise buttons still work exactly as before

**Covers:** AC3

**Steps:**
1. Start a new `/design` or `/definition` conversation (still in progress, not yet finished).
2. Click "Maximise diagrams" and the artefact panel's fullscreen button.
3. Continue typing and sending a message in the chat as normal.

**Expected outcome:**
> Both buttons still work exactly as they did before this fix. Typing and sending a message still works normally — nothing about the live conversation experience has changed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The bulk-assign button label resets after a successful assign

**Covers:** AC4

**Steps:**
1. Go to a product's "By module" view.
2. Check the checkbox next to one or more features, pick a target module from the dropdown, and click "Assign to module."
3. Wait for the assignment to finish (the features should move into the target module's list).
4. Look at the button's label.

**Expected outcome:**
> The button's label goes back to reading "Assign to module" (not stuck on "Assigning…") once the move completes, and the button is usable again for another assignment.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Post-merge smoke test note

Scenarios 1, 2, and 4 above are the complete post-merge smoke test — each is a real, hands-on click-through matching exactly how an operator would hit these bugs in normal use. Scenario 3 confirms nothing about the existing, working live-session experience broke along the way.
