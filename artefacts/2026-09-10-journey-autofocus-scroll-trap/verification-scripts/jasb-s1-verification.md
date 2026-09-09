# AC Verification Script: /journey's unconditional autofocus on the "new feature" input auto-scrolls past the entire feature list on every page load

**Story reference:** `artefacts/2026-09-10-journey-autofocus-scroll-trap/stories/jasb-s1-remove-unconditional-autofocus-on-journey-new-feature-input.md`
**Technical test plan:** `artefacts/2026-09-10-journey-autofocus-scroll-trap/test-plans/jasb-s1-test-plan.md`
**Script version:** 1
**Verified by:** ______ | **Date:** ______ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a browser open and signed in to the app (staging or local dev).
2. You need enough features in your account's feature list that the page is taller than one screen — if your list is short, this bug won't be visible even when present, so borrow a tenant/account with a long list (staging has 269+ features as of 2026-09-10) or seed several test features first.

**Reset between scenarios:** None needed — each scenario is a fresh page load and does not change state used by the others.

---

## Scenarios

---

### Scenario 1: Visiting the Journeys page shows your feature list right away, not a blank screen

**Covers:** AC1

**Steps:**
1. Type or paste the `/journey` page address into your browser and press Enter (do not add anything after `/journey` in the address).
2. Look at the screen the instant the page finishes loading — before you touch your mouse or scroll wheel.

**Expected outcome:**
> You see the "Journeys" heading and your list of features immediately, at the very top of the page. You do not see a blank or black screen, and you do not have to scroll up to find your features.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Clicking "+ New feature" still takes you straight to the new-feature form

**Covers:** AC2

**Steps:**
1. From the Journeys page, click the "+ New feature" button in the top right.
2. Look at the screen the instant the page finishes loading.

**Expected outcome:**
> The page jumps straight to the "Start a new feature" section at the bottom, and your cursor is already blinking in the "Feature name" box, ready for you to type — exactly as it does today. This behaviour should feel unchanged from before.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Starting a new feature from the Journeys page still works

**Covers:** AC3

**Steps:**
1. From the Journeys page (address bar shows exactly `/journey`, no extra text after it), scroll down to "Start a new feature".
2. Click into the "Feature name" box and type a test name, e.g. `Verification test feature`.
3. Leave "Formed idea — jump straight to discovery" selected (it should already be selected by default).
4. Click "Start journey →".

**Expected outcome:**
> You're taken into a new chat session for the Discovery skill, and the feature you just named appears as the one being worked on. Nothing about filling in or submitting this form should feel different from before this fix.

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
