# AC Verification Script: Remove dead nav links and add the missing Org board and Home List/Board toggle

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/b1-remove-dead-links-add-missing-nav.md`
**Technical test plan:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/b1-test-plan.md`
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:** Sign in and look at the left sidebar.

---

## Scenarios

### Scenario 1 — Dead links are gone (AC1)
1. Look at the sidebar's main navigation list.

**Expected:** You do NOT see "Features", "Actions", or "Status" anywhere.

### Scenario 2 — List/Board toggle under Home (AC2)
1. Look under the "Home" nav item.
2. Click "Board".

**Expected:** A small List/Board switcher is visible right under Home. Clicking "Board" switches to the board/kanban view without a page-wide navigation click.

### Scenario 3 — Org board is reachable (AC3)
1. Look at the sidebar's main navigation list.
2. Click "Org board".

**Expected:** An "Org board" item exists and clicking it takes you to the organization-level kanban view.

### Scenario 4 — Every link works (AC4)
1. Click every single item in the sidebar, one at a time.

**Expected:** Every click takes you to a real page — never a 404, never the login/sign-in page while you're already signed in.

---

## Summary

| Scenario | Pass/Fail | Notes |
|----------|-----------|-------|
| 1 — Dead links gone | | |
| 2 — List/Board toggle | | |
| 3 — Org board reachable | | |
| 4 — Every link resolves | | |
