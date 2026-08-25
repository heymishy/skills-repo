# AC Verification Script: pncg-s1 — Wrap the Products-nav fetch in a shared helper and wire it to every page that's currently missing it

**Story reference:** `artefacts/2026-08-26-products-nav-coverage-gap/stories/pncg-s1-shared-nav-wrapper-and-full-coverage.md`
**Technical test plan:** `artefacts/2026-08-26-products-nav-coverage-gap/test-plans/pncg-s1-test-plan.md`
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Sign in to the app (staging or production) with an account that has at least one product.
2. Have the list of 22 pages handy (see Scenario 2's list) — you don't need to check all 22 by hand, just a sample plus the ones named explicitly below.

**Reset between scenarios:** No shared state.

---

## Scenarios

---

### Scenario 1: The originally-reported page, `/org/kanban`, now shows the Products list

**Covers:** AC2 (originating report)

**Steps:**
1. Go to `/org/kanban`.
2. Look at the left-hand sidebar.

**Expected outcome:**
> The sidebar shows your Products list, a "See all products →" link, and a "+" button to create a new product — exactly like it does on `/dashboard`. Not an empty or missing section.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A sample of the other 21 pages also shows the Products list

**Covers:** AC2 (broader coverage)

**Steps:**
1. Visit each of these pages in turn: `/settings`, `/team/members`, `/journey/wizard`, `/products/new`, `/admin/credits` (if you have admin access).
2. On each one, look at the left-hand sidebar.

**Expected outcome:**
> Every one of these pages shows the same Products list, "See all products →" link, and "+" button in the sidebar.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Existing page functionality is unaffected

**Covers:** AC4 (non-regression)

**Steps:**
1. On `/org/kanban`, confirm the kanban board itself (columns, cards) still works as before.
2. On `/settings`, confirm you can still see and use the existing Settings tabs (Profile, Billing, Credits).
3. On `/team/members`, confirm the member list itself still displays correctly.

**Expected outcome:**
> Nothing on any of these pages changed except the sidebar now showing the Products list. All existing content and functionality works exactly as before.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A page you visit right after a fresh sign-in (no cached session) still shows the Products list

**Covers:** AC2, AC3 (pages whose fix required wiring database access to a handler that didn't have it before)

**Steps:**
1. Sign out completely, then sign back in.
2. Immediately go to `/journey/wizard`.
3. Look at the sidebar.

**Expected outcome:**
> The Products list appears correctly, with no error, blank page, or delay — confirming the underlying database connection needed to fetch it is wired correctly for this page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**
