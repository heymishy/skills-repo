# AC Verification Script: Migrate team-management admin pages onto the shared HTML shell

**Story reference:** artefacts/2026-08-16-team-management-shared-shell-migration/stories/tmss-s1-migrate-to-shared-shell.md
**Technical test plan:** artefacts/2026-08-16-team-management-shared-shell-migration/test-plans/tmss-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Sign in as a tenant admin on staging (or a local dev server pointed at a test tenant).
2. Have the browser's dev tools or "View Page Source" available for Scenario 3.

**Reset between scenarios:** None needed — each scenario is a fresh page load, no shared state.

---

## Scenarios

---

### Scenario 1: Team members page looks like the rest of the app

**Covers:** AC1

**Steps:**
1. Go to `/team/members`.
2. Look at the page.

**Expected outcome:**
> The page has the same left-hand navigation sidebar, header bar, and overall look as every other page in the app (Dashboard, Settings, etc.) — not a plain white page with unstyled text. The "Add teammate by identity" form (an identity field, a role dropdown, and an "Add teammate" button) is still there, in the main content area, working exactly as before.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Invite-a-teammate page looks like the rest of the app

**Covers:** AC2

**Steps:**
1. Go to `/team/invites/new`.
2. Look at the page.

**Expected outcome:**
> Same as Scenario 1 — the same sidebar/header shell as the rest of the app, not a plain unstyled page. The "Invite a teammate" form (an Email field, a Role dropdown, a "Send invite" button) is still there and still submits to the same place as before.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: No leftover custom escaping code, and special characters still display safely

**Covers:** AC3

**Steps:**
1. Ask a developer to confirm (via a code search) that `team-management.js` no longer defines its own `_escapeHtml` function.
2. On either page, view the page source (right-click → View Page Source, or dev tools → Elements).
3. Look at the hidden CSRF field near the top of the form.

**Expected outcome:**
> No `_escapeHtml` function exists anywhere in `team-management.js` — the file uses the app's one shared escaping function instead. The hidden CSRF field's value looks like a normal token (letters/numbers, no stray unescaped quote marks breaking the HTML).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Invite/CSRF protection still present on both forms

**Covers:** AC4

**Steps:**
1. On `/team/members`, view page source and look for a hidden field named `_csrf`.
2. On `/team/invites/new`, do the same.

**Expected outcome:**
> Both pages contain a hidden `_csrf` field with a real (non-empty) value, exactly as they did before this change — this protects the form submission from cross-site request forgery.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Keyboard-only navigation still works on both pages

**Covers:** AC1, AC2 (accessibility carry-over from `tir-s3`/`wsi-s6`, not newly introduced by this story, but worth re-confirming after the wrapper change)

**Steps:**
1. On `/team/members`, click somewhere blank on the page, then press Tab repeatedly.
2. Confirm each form field gets a visible focus outline in a sensible order (identity field → role dropdown → Add teammate button).
3. Repeat on `/team/invites/new` (email field → role dropdown → Send invite button).

**Expected outcome:**
> Tab moves through the form fields in a logical order with a visible focus ring on each, same as before this change — the new sidebar/header shell does not trap focus or insert itself into the tab order ahead of the form.

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
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
