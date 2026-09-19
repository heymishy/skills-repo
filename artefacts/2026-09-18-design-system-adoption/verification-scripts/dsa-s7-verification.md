# AC Verification Script: Add the "Product in Action" Demo Section to the Landing Page

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s7.md
**Technical test plan:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s7-test-plan.md
**Script version:** 1
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

### Scenario 1: "Product in action" section is present and looks right

**Covers:** AC1, AC4

**Steps:**
1. Go to the landing page (`/`), either mode.
2. Scroll down past the hero section and the golden-trace/hero-card sections.

**Expected outcome:**
> A "Product in action" section with a heading, framed inside what looks like a browser window (3 small colored dots top-left — red, amber, green — and a URL-style label next to them). The frame's colors and borders match the rest of the page's theme (dark mode: near-black background, light borders; light mode: white background, light-grey borders).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Placeholder is honest, not broken or misleading

**Covers:** AC2

**Steps:**
1. Look inside the browser-chrome frame from Scenario 1.

**Expected outcome:**
> A clear, deliberate placeholder — NOT a broken image icon, NOT blank/empty space. It should read something like "Demo coming soon" or similar — it should not look like a real product screenshot that's actually broken, and it should not try to fake being a real demo.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Landing page is genuinely usable on a real phone (with the new section)

**Covers:** AC5

**Steps:**
1. On a real phone (or your browser's device-emulation mode at ~375-390px width), go to the landing page.
2. Scroll down to the "Product in action" section.

**Expected outcome:**
> No horizontal scrolling. The browser-chrome frame shrinks to fit the screen width — it does not get cut off on the right edge, and it does not force the whole page to scroll sideways.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Nothing that worked before is now broken

**Covers:** AC6

**Steps:**
1. Check the rest of the landing page still works exactly as it did before this change: dark/light toggle, the golden-trace demo, the 3 hero cards, the sign-up/login buttons and forms.

**Expected outcome:**
> Everything dsa-s3 already verified still works identically — only the new "Product in action" section was added, nothing else changed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (Section present, styled correctly) | | |
| Scenario 2 (Honest placeholder) | | |
| Scenario 3 (Mobile responsive) | | |
| Scenario 4 (No regression) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
