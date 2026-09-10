# AC Verification Script: No-product, CLI-authored features are reachable within one click from the /dashboard landing page

**Story reference:** artefacts/2026-08-31-web-ui-navigation-legibility/stories/wnl-s3-dashboard-no-product-discoverability.md
**Technical test plan:** artefacts/2026-08-31-web-ui-navigation-legibility/test-plans/wnl-s3-test-plan.md
**Script version:** 1
**Verified by:** ______ | **Date:** ______ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Sign in to the app (staging or production).
2. Ideally, have access to a tenant with at least one feature that was created via Claude Code CLI directly (not through a web-UI session) and has no product assigned — `jasb-s1` or `web-ui-navigation-legibility` itself are exactly this kind of feature on this repo's own staging/production instances.

**Reset between scenarios:** None needed.

---

## Scenarios

---

### Scenario 1: A "No product" entry point appears on the main Products page

**Covers:** AC1, AC3

**Steps:**
1. Go to `/dashboard` (the main Products page you land on after signing in).
2. Look below or alongside your product cards.

**Expected outcome:**
> You see a clickable entry point (a link or small card) referring to "No product" work — not just in the left sidebar, but right there in the main page body. Clicking it takes you to the same "No product" feature list the left sidebar's own "No product" link already goes to.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A CLI-only feature that's never been opened in the web UI still shows up

**Covers:** AC2 (the main point of this story)

**Steps:**
1. Find (or ask an engineer to point you at) a feature that was created directly via Claude Code CLI and has never had its "Continue" link clicked in the web UI yet — it should have zero real sessions/journeys recorded for it in the database.
2. Go to `/dashboard`.

**Expected outcome:**
> The "No product" entry point from Scenario 1 is still there and still leads you to a list that includes this CLI-only feature — even though it's never technically been "opened" in the web UI before.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: No clutter when there's genuinely nothing to show

**Covers:** AC4

**Steps:**
1. Find (or set up) a tenant/account with only real products and no CLI-only or unassigned work at all.
2. Go to `/dashboard`.

**Expected outcome:**
> There's no "No product" entry point shown — the page isn't cluttered with a link that would lead nowhere useful.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Existing products and the sidebar still work exactly as before

**Covers:** AC5, AC6

**Steps:**
1. Go to `/dashboard` on an account with at least one real product.
2. Check the product cards (name, feature count, last-updated date) and the sidebar's own "No product" link.

**Expected outcome:**
> Everything looks and works exactly as it did before this change — same product cards, same sidebar link and count. The only new thing is the entry point in the main page body from Scenario 1.

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
