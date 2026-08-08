# AC Verification Script: Restyle the existing auth panel as the page's closing CTA

**Story reference:** artefacts/2026-08-08-landing-page-hero-features/stories/lphf-s5-restyle-auth-panel-as-closing-cta.md
**Technical test plan:** artefacts/2026-08-08-landing-page-hero-features/test-plans/lphf-s5-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Load the landing page at `/` in a browser.
2. Scroll down past the four hero cards to the sign-in panel.

**Reset between scenarios:** Reload the page between scenarios.

---

## Scenarios

---

### Scenario 1: The sign-in panel feels proportionate to the rest of the page, not oversized

**Covers:** AC1

**Steps:**
1. Scroll through the whole page from top to bottom.
2. Look at how much space the sign-in panel takes up compared to the four hero cards above it.

**Expected outcome:**
> The sign-in panel reads as one section among several — appropriately sized as a closing call-to-action, not as an oversized leftover that dominates the page the way it did before the redesign.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Clicking each sign-in option still works exactly as before

**Covers:** AC2

**Steps:**
1. Click "Get started with GitHub." Note where it takes you.
2. Go back. Click "Continue with Google." Note where it takes you.
3. Go back. Switch to the "Sign up" tab and check the form's submit button.

**Expected outcome:**
> GitHub sign-in takes you to GitHub's authorization page (via `/auth/github`). Google sign-in takes you to Google's authorization page (via `/auth/google`). The sign-up form is ready to submit to the email sign-up endpoint. None of this behaves differently from before the redesign.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The panel works correctly on a small phone screen and a wide desktop screen

**Covers:** AC3

**Steps:**
1. Resize the browser window to about 320 pixels wide. Try clicking each sign-in button and typing into the email field.
2. Resize to about 1280 pixels wide and repeat.

**Expected outcome:**
> At both sizes, every button and form field is visible, correctly sized, and clickable/tappable — no cut-off buttons, no horizontal scrollbar.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
