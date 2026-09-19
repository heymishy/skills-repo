# AC Verification Script: Restyle the Landing Page to Match DESIGN.md

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s3.md
**Technical test plan:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s3-test-plan.md
**Script version:** 2 (amended 2026-09-19 for AC5, the FEATURE-WIDE mobile-responsiveness requirement — see `decisions.md`; Scenario 3 corrected to reflect the deliberately-omitted "product in action" browser-chrome section, see that same decisions.md entry)
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a private/incognito browser window (no login needed — this is the public landing page).
2. Know how to switch between dark and light mode.

**Reset between scenarios:** No reset needed.

---

## Scenarios

---

### Scenario 1: Landing page looks right in dark mode

**Covers:** AC1

**Steps:**
1. Make sure dark mode is active.
2. Go to the landing page (the site's homepage, `/`).
3. Look at the hero section, background, text, and any buttons.

**Expected outcome:**
> Deep near-black background, bright readable headline text, clear blue call-to-action buttons. Looks crisp and modern, not the current dated style.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Landing page looks right in light mode

**Covers:** AC2

**Steps:**
1. Switch to light mode.
2. Reload the landing page.
3. Look at the same elements as Scenario 1.

**Expected outcome:**
> Off-white background, dark readable text, deeper blue buttons for contrast. Just as polished as dark mode.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Landing page layout matches the design

**Covers:** AC3

**Steps:**
1. Go to the landing page (either mode).
2. Scroll from top to bottom.

**Expected outcome:**
> A centered hero section at the top with a headline and short copy (not stretched edge-to-edge). Below it, full-width sections including the golden-trace demo (4 frames) and the "scope-contract"/"crypto-verification" hero cards, laid out as a 2-column grid on desktop. Note: the mock's own "Product in action" browser-window-framed screenshot section is deliberately NOT built in this pass — it depends on demo assets this codebase has no real equivalent for; its absence is expected, not a failure. This should look like the "Landing" reference screenshot, minus that one section.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Nothing that worked before is now broken

**Covers:** AC4

**Steps:**
1. Click the sign-up or login button/link on the landing page.
2. Confirm it takes you to the right place.

**Expected outcome:**
> Sign-up/login links work exactly as before — only the visual styling changed. In particular, click "Get started with GitHub" in the auth panel near the bottom of the page (not the hero button near the top, which is a separate, visually-similar entry point) and confirm the click actually starts the GitHub sign-up flow.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Landing page is genuinely usable on a real phone

**Covers:** AC5

**Steps:**
1. On a real phone (or your browser's device-emulation mode at ~375-390px width), go to the landing page.
2. Scroll from top to bottom.

**Expected outcome:**
> No horizontal scrolling anywhere on the page. The hero and copy stay in a single readable column. The golden-trace demo and hero-card sections stack into a single column (not squeezed side-by-side). All text is legible, nothing is clipped or overlapping. The theme toggle and auth buttons remain easily tappable.

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
| Scenario 5 (Mobile responsive) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
