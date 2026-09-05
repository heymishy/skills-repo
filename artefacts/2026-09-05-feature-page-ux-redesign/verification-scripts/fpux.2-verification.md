# AC Verification Script: Audit and fix the navigation path into `/features/:slug`

**Story reference:** artefacts/2026-09-05-feature-page-ux-redesign/stories/fpux.2-audit-and-fix-nav-path.md
**Technical test plan:** artefacts/2026-09-05-feature-page-ux-redesign/test-plans/fpux.2-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Sign in to the platform.
2. Have a feature you can reach three ways: from the dashboard list, from its product page, and from one of its stories' own Definition of Done / artefact links.

**Reset between scenarios:** None needed — each scenario starts fresh from the dashboard.

---

## Scenarios

---

### Scenario 1: Clicking a feature on the dashboard takes you straight to its page

**Covers:** AC2 (dashboard entry point)

**Steps:**
1. Click "Dashboard" in the navigation.
2. Click on any feature in the list.

**Expected outcome:**
> You land directly on that feature's artefact page — no error page, no bounce back to sign-in, no unexpected extra screen in between.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Clicking through from a product page takes you straight to the feature's page

**Covers:** AC2 (product-page entry point)

**Steps:**
1. Open a product's page.
2. Click through to one of its features.

**Expected outcome:**
> You land directly on that feature's artefact page — no error page, no dead end, no unexpected extra screen.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Resuming from a story's own DoD/artefact link takes you back to the feature page

**Covers:** AC2 (story DoD entry point)

**Steps:**
1. Open a story that has a "Resume conversation" or artefact link.
2. Click it, then navigate back toward the feature's own artefact page from there.

**Expected outcome:**
> The link works — no 404, no being bounced back to sign-in, no dead page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Independently double-check the entry-point list is actually complete 🔴

**Covers:** AC1

**Steps:**
1. Open the story's own write-up (`stories/fpux.2-audit-and-fix-nav-path.md`) and read the documented list of entry points.
2. Independently search the codebase (`grep -rn "features/" src/web-ui/routes/ src/web-ui/views/`) for any link, redirect, or route that leads to `/features/:slug` that is **not** already named in the story's list.

**Expected outcome:**
> Your independent search does not turn up any additional real entry point beyond what the story already documents. If it does, that's a real finding — the story's own AC1 claim is incomplete and must be corrected before this story is considered done.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — Dashboard entry | | |
| Scenario 2 — Product-page entry | | |
| Scenario 3 — Story DoD entry | | |
| Edge case — Independent entry-point audit 🔴 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
