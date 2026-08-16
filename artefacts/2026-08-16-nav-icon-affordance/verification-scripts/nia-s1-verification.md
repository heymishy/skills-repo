# AC Verification Script: Fix affordance mismatch on the sign-out control and theme-toggle button

**Story reference:** artefacts/2026-08-16-nav-icon-affordance/stories/nia-s1-fix-nav-icon-affordance.md
**Technical test plan:** artefacts/2026-08-16-nav-icon-affordance/test-plans/nia-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Sign in as any user on staging (or a local dev server) — no admin role required, this is a global nav element.
2. Have the browser's dev tools or "View Page Source" available for Scenarios 1–3.
3. Ideally test on both a desktop browser and a real (or emulated) mobile-Safari-class touch device for Scenario 1, since the original defect was touch-specific.

**Reset between scenarios:** None needed — each scenario is a fresh page load, no shared state.

---

## Scenarios

---

### Scenario 1: Sign-out control shows what it does before you tap it

**Covers:** AC1

**Steps:**
1. Go to any signed-in page (e.g. `/dashboard`).
2. Look at the bottom of the left sidebar, next to your username.
3. On a touch device (or by disabling hover in dev tools), confirm the label is visible without needing to hover.

**Expected outcome:**
> The sign-out control now shows a visible "Sign out" text label next to its icon — not just an unlabelled arrow glyph that only reveals its purpose on hover. A first-time user should be able to tell what it does without tapping it or needing a mouse hover.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Sign-out requires confirmation before it actually signs you out

**Covers:** AC2

**Steps:**
1. On any signed-in page, tap/click "Sign out."
2. Observe the browser's confirmation dialog.
3. Click Cancel. Confirm you are still signed in and on the same page.
4. Tap/click "Sign out" again, this time confirm the dialog.

**Expected outcome:**
> A confirmation dialog appears with a clear message (e.g. "Sign out of wuce?") before anything happens. Cancelling leaves you signed in with no navigation. Confirming signs you out as before, landing on the public homepage — same end behaviour as today, just no longer a surprise single-tap action.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Theme-toggle button no longer looks like a profile/avatar icon (manual visual check — RISK-ACCEPT item, see decisions.md)

**Covers:** AC3

**Steps:**
1. Go to any signed-in page. Look at the top-right corner of the header.
2. Without prior knowledge of what the button does, ask: does this look like a profile picture / account avatar, or does it look like a light/dark theme control?
3. Click it. Confirm the page switches between light and dark mode, and the icon itself visibly changes to match (sun when light, moon when dark).
4. Reload the page. Confirm the icon still matches the current theme (no flash of the wrong icon, no reset to a default glyph).

**Expected outcome:**
> The button now shows a clearly sun-or-moon-style icon (whichever matches the currently active theme), not a plain filled/half-filled circle. It should read unambiguously as "click to change appearance," not "click to see my profile." No dropdown or navigation should ever open from this button — it purely toggles the theme, same as before.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Theme toggle still functions exactly as before (no behavioural regression)

**Covers:** AC4

**Steps:**
1. Click the theme-toggle button several times in a row.
2. Confirm the page reliably alternates between light and dark mode each time, with no lag, error, or stuck state.
3. Set it to dark mode, then reload the page. Confirm it stays dark (the choice persisted).
4. Open dev tools → Application/Storage → Local Storage, confirm a `sw-theme` key is present with the expected value (`light` or `dark`).

**Expected outcome:**
> Toggling behaviour, persistence across reloads, and the underlying `localStorage` key are all unchanged from before this story — only the button's icon changed, not its function.

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
