# AC Verification Script: Restyle the Artefact Viewer to Match DESIGN.md

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s1.md
**Technical test plan:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s1-test-plan.md
**Script version:** 1
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
1. Open an artefact that has existing sign-off status and at least one comment.
2. Try adding a new comment.
3. Try viewing the artefact's content — scroll through it if it's long.
4. If you have sign-off permissions, try the sign-off action.

**Expected outcome:**
> Everything you tried in steps 2–4 works exactly the way it did before this restyle — the new visual styling changed how things look, not how they behave. Adding a comment shows up in the sidebar. Content scrolls normally. Sign-off (if tried) records correctly.

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

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
