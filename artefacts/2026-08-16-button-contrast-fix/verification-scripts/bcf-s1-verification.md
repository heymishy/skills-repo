# AC Verification Script: Fix dark-mode (and light-mode) button contrast bug on the Products page

**Story reference:** artefacts/2026-08-16-button-contrast-fix/stories/bcf-s1-fix-button-contrast.md
**Technical test plan:** artefacts/2026-08-16-button-contrast-fix/test-plans/bcf-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Sign in as any user on staging (or a local dev server) — no admin role required.
2. Navigate to the Products area: product list (`/dashboard?view=list`), a product detail page, the new-product wizard, the module-management panel, the repo-connection flow, and the new-feature creation panel — the 11 fixed buttons are spread across these views.
3. Have both a light-mode and dark-mode view available (toggle via the theme button in the header, or OS preference).

**Reset between scenarios:** None needed — each scenario is a fresh page view, no shared state.

---

## Scenarios

---

### Scenario 1: Accent buttons are readable in dark mode

**Covers:** AC1, AC4 (dark-mode leg)

**Steps:**
1. Switch to dark mode.
2. Visit each of the 11 affected views/buttons: "Create your first product →" (empty state), "New product", "Generate context files →", "Confirm and create product", "Add module", "Select"/"Connect"/"Create new repo"/"Create" (repo-connection flow), "New feature", "Start →".
3. For each, read the button label without straining.

**Expected outcome:**
> Every button's text is clearly legible white text on the indigo/purple accent background — no more same-hue-family text-on-background blending.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Accent buttons are readable in light mode

**Covers:** AC1, AC4 (light-mode leg)

**Steps:**
1. Switch to light mode.
2. Revisit the same 11 buttons/views as Scenario 1.

**Expected outcome:**
> Every button's text is clearly legible white text on the indigo accent background in light mode too — confirming the fix (being unconditional, not theme-gated) improves both themes, not just the originally-reported dark-mode case.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Already-correct buttons and text-only links are unaffected

**Covers:** AC2, AC3

**Steps:**
1. In both light and dark mode, check the `Designate` button (product's module list) and `Save` button (guardrails/standards edit form) — confirm they still render exactly as before (white text on accent background, unchanged).
2. Check the plain text-only accent links — "Edit", "Add", "Connect a repo", "Request promotion", "Approve" — confirm these are unchanged: accent-colored text directly on the page background, no background box behind them.
3. Check the module progress bar (colored fill bar under a module row) — confirm its appearance (a solid/semi-transparent accent-colored bar, no text) is unchanged.

**Expected outcome:**
> No visual regression to any of these elements — this fix touched only the 11 identified buggy button/link instances.

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
