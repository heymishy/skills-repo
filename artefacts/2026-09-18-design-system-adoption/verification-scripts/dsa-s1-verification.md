# AC Verification Script: Restyle the Artefact Viewer and Build Its Sign-Off/Comments UI to Match DESIGN.md

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s1.md
**Technical test plan:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s1-test-plan.md
**Script version:** 2 (amended following story scope expansion — see decisions.md)
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a real feature with an artefact document already created (any existing product/feature works, or ask the operator for a seeded test one).
2. Open the artefact viewer page for that artefact in a browser.
3. Know how to switch between dark and light mode — the toggle is on the Settings page.

**Reset between scenarios:** No reset needed — scenarios 1 and 2 only differ by which mode (dark/light) is active; switch modes via Settings between them.

---

## Scenarios

---

### Scenario 1: Artefact viewer looks right in dark mode

**Covers:** AC1

**Steps:**
1. Make sure dark mode is active (check Settings if unsure).
2. Open the artefact viewer page.
3. Look at the background, text, borders, and status colors (like pass/fail badges if any are visible).

**Expected outcome:**
> The page background is a deep near-black, text is bright and easy to read, borders are subtle dark grey lines, and any accent-colored elements (buttons, links) are a clear blue. Nothing looks like today's current style — colors should look crisper and more consistent with the reference style guide screenshot.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Artefact viewer looks right in light mode

**Covers:** AC2

**Steps:**
1. Go to Settings and switch to light mode.
2. Open the artefact viewer page again.
3. Look at the same elements as Scenario 1.

**Expected outcome:**
> The page background is off-white, text is dark and easy to read, borders are light grey lines, and accent-colored elements are a slightly deeper blue than the dark-mode version (for contrast on white). Nothing looks broken or half-styled — light mode should look as polished as dark mode.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Artefact viewer layout matches the design

**Covers:** AC3

**Steps:**
1. Open the artefact viewer page (either mode).
2. Look at the overall page layout — the main document area and the sidebar.

**Expected outcome:**
> The document text appears in a wide main column on the left, in a readable serif font (not the same font as the rest of the page). On the right, there's a narrower sidebar with two distinct cards — one showing sign-off status (who approved, pending/signed), and one showing comments (with a way to reply). This should look like the "Artefact Viewer" reference screenshot, not the current flat/unstyled layout.

**Expected outcome:**
> ✓ matches the `Skills Platform - Artefact Viewer.dc.html` reference mock.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Nothing that worked before is now broken

**Covers:** AC4

**Steps:**
1. Open an artefact and view its content.
2. Scroll through it if it's long.
3. Try any pre-existing navigation or actions on the page that existed before this story.

**Expected outcome:**
> Everything works exactly the way it did before this change — the restyle changed how the page looks, not how the pre-existing parts of it behave. Content displays and scrolls normally.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Signing off an artefact works

**Covers:** AC5

**Steps:**
1. Open an artefact that has NOT yet been signed off.
2. Look at the Sign-off card in the sidebar — it should show an active "Sign Off" button.
3. Click the Sign Off button.

**Expected outcome:**
> The button click sends a request to record your sign-off. If it succeeds, the card updates to show your name and today's date as the approver — you should NOT need to reload the page to see this. (Note: the real GitHub-backed part of this can't always be tested automatically — if the sign-off request fails because no GitHub repo is connected for this product, that's expected in some test environments; the important thing to verify is that clicking the button visibly does something and doesn't silently fail with no feedback.)

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: An already-signed-off artefact shows who signed it, not a button

**Covers:** AC6

**Steps:**
1. Open an artefact that has ALREADY been signed off (ask the operator for one, or use one you signed off in Scenario 5).
2. Look at the Sign-off card.

**Expected outcome:**
> The card shows the name of whoever approved it and the date — no clickable "Sign Off" button is shown. You should not be able to try signing it off again from this page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 7: Comments list shows existing comments, or says there are none

**Covers:** AC7

**Steps:**
1. Open an artefact that has no comments yet.
2. Look at the Comments card.
3. Open a different artefact that has a few comments on it (or add some via Scenario 8 first, then come back).
4. Look at its Comments card.

**Expected outcome:**
> Step 2: the card clearly says something like "No comments yet" — it doesn't look broken or empty by accident. Step 4: every comment is shown, oldest at the top, each with who wrote it and when.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 8: Posting a comment works

**Covers:** AC8

**Steps:**
1. Open any artefact.
2. Type a comment into the Comments card's text box.
3. Submit it.

**Expected outcome:**
> Your comment appears in the list right away — you don't need to reload the page to see it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (Dark mode) | | |
| Scenario 2 (Light mode) | | |
| Scenario 3 (Layout) | | |
| Scenario 4 (No regression) | | |
| Scenario 5 (Sign off works) | | |
| Scenario 6 (Already signed off) | | |
| Scenario 7 (Comments list/empty state) | | |
| Scenario 8 (Post a comment) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
