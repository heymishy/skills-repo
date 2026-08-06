# AC Verification Script: Show the Products sidebar during skill chat sessions

**Story reference:** artefacts/2026-08-06-nav-products-wiring-expansion/stories/npwe-s1-wire-products-nav-into-skill-chat-sessions.md
**Technical test plan:** artefacts/2026-08-06-nav-products-wiring-expansion/test-plans/npwe-s1-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Sign in with a tenant that has 2+ products, each with at least one journey.
2. Have one journey with no product assigned (the "No product" bucket), if possible.

**Reset between scenarios:** No reset needed — these are read-only page visits.

---

## Scenarios

---

### Scenario 1: The Products list stays visible while working through a skill session

**Covers:** AC1

**Steps:**
1. Start or resume a journey from one of your products.
2. Answer a question in the skill session (discovery, benefit-metric, etc.), watch the draft appear, and view the commit preview/complete screens.

**Expected outcome:**
> At every one of these steps, your Products list is still visible in the sidebar, with the product you're working in highlighted — you never lose your place.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The highlighted product doesn't change unexpectedly

**Covers:** AC2

**Steps:**
1. Click into a product from the sidebar (lands on `/products/:id`).
2. From there, open one of that product's journeys and continue into its skill session.

**Expected outcome:**
> The same product stays highlighted the whole way through — no flicker or switch to a different product.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A journey with no product still makes sense

**Covers:** AC3

**Steps:**
1. Open a skill session for a journey that isn't attached to any product.

**Expected outcome:**
> The sidebar shows a "No product" entry highlighted — not a blank or broken sidebar, not one of your real products highlighted incorrectly.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Everything else still looks the same

**Covers:** AC4

**Steps:**
1. Visit a few pages this change deliberately doesn't touch: Settings, Admin credits (if you're an admin), and a journey's "Stories" or "Journey complete" page.

**Expected outcome:**
> These pages look exactly as they did before — no Products list has appeared where it wasn't already, nothing else has shifted or changed.

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
