# AC Verification Script: Restyle the Dashboard to Match DESIGN.md

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s2.md
**Technical test plan:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s2-test-plan.md
**Script version:** 2 (amended for the CRITICAL re-target -- see `decisions.md` -- this story now restyles the REAL, live `GET /dashboard` route served by `routes/products.js`'s `handleGetDashboard`/`_renderProductDashboard`, not the dead `routes/dashboard.js` code the version-1 script described)
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Log in with a real account that has at least one product (for Scenarios 1-3, 5-7).
2. A second real account (or the same account's Settings) that genuinely has zero products, for Scenario 8.
3. Know how to switch between dark and light mode (Settings page).
4. To see Scenario 5's "Waiting on you" section populated, have at least one pending sign-off item across your accessible repos -- otherwise it will honestly show "Nothing waiting." (also a valid, testable outcome, see Scenario 5's notes).
5. To see Scenario 6's "Recent sessions" section populated, have run at least one skill session recently -- otherwise it will honestly show "No recent sessions." (also a valid, testable outcome, see Scenario 6's notes).

**Reset between scenarios:** No reset needed for Scenarios 1-2 (mode switch only). Scenarios 3, 5-7 need a has-products account. Scenario 4 needs the `?view=board` URL directly. Scenario 8 needs a genuinely zero-product account/tenant.

---

## Scenarios

---

### Scenario 1: Dashboard looks right in dark mode

**Covers:** AC1

**Steps:**
1. Make sure dark mode is active.
2. Go to the real dashboard (`/dashboard`).
3. Look at the sidebar, main content area, greeting, skill cards, and any status badges.

**Expected outcome:**
> Deep near-black background, bright readable text, subtle dark borders, clear blue accent color on buttons/active nav items. Looks crisp and consistent, not the current dated style.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Dashboard looks right in light mode

**Covers:** AC2

**Steps:**
1. Switch to light mode in Settings.
2. Go to the real dashboard (`/dashboard`).
3. Look at the same elements as Scenario 1.

**Expected outcome:**
> Off-white background, dark readable text, light grey borders, deeper blue accent color for contrast. Just as polished as dark mode, nothing half-styled.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Dashboard layout matches the design (has-products account)

**Covers:** AC3, AC6

**Steps:**
1. Go to the real dashboard (`/dashboard`) with an account that has at least one product (either mode).
2. Look at the overall page structure.
3. Look specifically at the "Run a skill" section.

**Expected outcome:**
> A fixed-width sidebar on the left with your products list, main navigation, and account settings pinned to the bottom. The main content area fills the rest of the screen, capped at a reasonable reading width. A personal greeting at the top ("Good morning/afternoon/evening, [your name]"), a "Run a skill" grid of skill cards (name, short description, estimated time, each launchable), and "Waiting on you"/"Recent sessions" columns below -- this should look like the "Dashboard" reference screenshot (`Skills Platform - Dashboard.dc.html`).
> Note: the mock's own approximate figures (224px sidebar, 1080px content cap) are slightly different from the real, current implementation values (220px sidebar, 1040px content cap) -- both are visually equivalent close readings of the same mock; this is a known, RISK-ACCEPTed wording imprecision (see `decisions.md`), not something to fail this scenario over.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: `?view=board` kanban route is unaffected

**Covers:** AC4 (kanban route specifically)

**Steps:**
1. Go to `/dashboard?view=board` directly (or use the Board toggle under Home in the sidebar, if present).
2. Confirm this shows the kanban board view, not the new dashboard mock content.

**Expected outcome:**
> The kanban board renders exactly as it did before this story -- columns, cards, drag-to-advance if applicable. None of the new dashboard content (greeting, "Run a skill" grid, "Waiting on you"/"Recent sessions") appears on this route.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: "Waiting on you" shows real pending sign-off items

**Covers:** AC5

**Steps:**
1. Go to the real dashboard (`/dashboard`) with an account that has at least one pending sign-off item across its accessible repos.
2. Look at the "Waiting on you" column.

**Expected outcome:**
> Each real pending item is shown with its feature name, artefact type, and how long it's been pending (e.g. "Sign off Discovery -- [feature name] -- 4d ago") -- not static/placeholder content. If the account genuinely has nothing pending, "Nothing waiting." is shown honestly instead -- that is also a correct, passing outcome (confirm it says "Nothing waiting.", not an empty section or a stale placeholder count).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: "Recent sessions" shows real in-progress count and completed-stage history

**Covers:** AC7

**Steps:**
1. Go to the real dashboard (`/dashboard`) with an account that has run at least one skill session recently (in-progress or with completed stages).
2. Look at the greeting line's "N in-progress sessions" count and the "Recent sessions" column.

**Expected outcome:**
> The in-progress count matches your real number of active, not-yet-complete journeys. "Recent sessions" lists your real completed stages, most-recent-first, each with skill name, feature, and how long ago it completed. If the account genuinely has zero journeys, the count reads "0 in-progress sessions" and "Recent sessions" honestly shows "No recent sessions." -- also a correct, passing outcome.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 7: Nothing that worked before is now broken (has-products account)

**Covers:** AC4

**Steps:**
1. Click through to one of your products from the dashboard.
2. Use the main navigation to visit another section.
3. Check the account nav at the bottom of the sidebar works.
4. Click one of the "Run a skill" cards and confirm it starts a real skill session.

**Expected outcome:**
> Clicking a product takes you to that product's page. Navigation links all go to the right place. Account nav opens the right menu. A skill card's "Start" action really starts that skill's session. Everything behaves exactly as it did before -- only the visual styling and the dashboard's own main-content area changed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 8: Zero-products onboarding is preserved

**Covers:** AC8

**Steps:**
1. Log in with an account/tenant that genuinely has zero products (or use Settings to view as a fresh tenant, if your environment supports that).
2. Go to the real dashboard (`/dashboard`).

**Expected outcome:**
> The existing "No products yet" onboarding message and "Create your first product →" button are shown, functioning exactly as they did before this story. None of the new dashboard content (greeting, "Run a skill" grid, "Waiting on you"/"Recent sessions" columns) appears on this path -- it is unaffected by this story's changes.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (Dark mode) | | |
| Scenario 2 (Light mode) | | |
| Scenario 3 (Layout, has-products) | | |
| Scenario 4 (`?view=board` unaffected) | | |
| Scenario 5 (Real pending actions) | | |
| Scenario 6 (Real in-progress count / recent sessions) | | |
| Scenario 7 (No regression, has-products) | | |
| Scenario 8 (Zero-products onboarding preserved) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
