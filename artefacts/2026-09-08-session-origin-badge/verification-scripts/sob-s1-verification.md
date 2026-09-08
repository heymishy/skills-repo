# AC Verification Script: Shared session-origin derivation + product feature-list indicator

**Story reference:** artefacts/2026-09-08-session-origin-badge/stories/sob-s1-shared-derivation-and-product-list-indicator.md
**Technical test plan:** artefacts/2026-09-08-session-origin-badge/test-plans/sob-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open the product feature-list page for a product with at least one feature (e.g. `/products/:id` on `wuce-staging`).
2. You'll need three features in different states to see all three indicator states in one pass: one whose stages were all completed through a real chat session, one with a mix, and one authored entirely through the CLI/agent (no session at all). If a real product doesn't naturally have all three, this can be checked stage-by-stage on a single feature instead — see Scenario 4.

**Reset between scenarios:** No reset needed — this is a read-only view.

---

## Scenarios

---

### Scenario 1: A feature with every stage completed through a real session shows the "fully session-backed" indicator

**Covers:** AC1

**Steps:**
1. Open the product feature-list page.
2. Find a feature whose discovery/benefit-metric stages you completed by chatting with the skill live (not one built via Claude Code/CLI directly).

**Expected outcome:**
> That feature's row shows a small icon indicating every completed stage came from a real conversation. Hovering over it shows a tooltip explaining this in words (not just a colour).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A feature with a mix of session-driven and CLI-authored stages shows the "mixed" indicator

**Covers:** AC2

**Steps:**
1. Open the product feature-list page.
2. Find a feature where some stages were done live in chat and others were written directly by an agent.

**Expected outcome:**
> That feature's row shows a visually distinct icon from Scenario 1, and its tooltip explains that some — not all — of its completed stages came from a real conversation.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A feature that exists but was never worked on through a live chat session shows "no session"

**Covers:** AC3 and AC4 (both a real-but-sessionless journey, and a CLI-authored feature with no journey at all, show the same visual state)

**Steps:**
1. Open the product feature-list page.
2. Find a feature that was built entirely by an agent/CLI, with no live chat turns at all (most features in this repo look like this).

**Expected outcome:**
> That row shows the "no session" icon — no live conversation exists for this feature to revisit.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A feature that hasn't completed any stage yet shows no indicator at all

**Covers:** AC5

**Steps:**
1. Start a brand-new feature via `/journey` (or find one still sitting at "Idea", with no discovery yet).
2. Open the product feature-list page and find that feature's row.

**Expected outcome:**
> There is no session-origin icon on that row at all — not a greyed-out or blank version of one, nothing. This is different from "no session" (Scenario 3), which does show an icon.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Page still loads correctly if the session-origin data can't be read

**Covers:** AC7

**Steps:**
1. This one can only be checked with engineering help, by temporarily forcing the lookup to fail (e.g. via a test flag) or by reviewing the automated test for this case directly.
2. Load the product feature-list page while the failure is forced.

**Expected outcome:**
> The page still loads completely and normally. No error message. No broken layout. Simply no session-origin icons appear on any row until the underlying issue is fixed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Every icon is understandable without colour vision

**Covers:** AC8

**Steps:**
1. Hover your mouse (or move keyboard focus) over each type of session-origin icon on the page.

**Expected outcome:**
> Every icon shows a text tooltip explaining exactly what it means — you don't have to rely on colour or shape alone to tell them apart.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — Fully session-backed | | |
| Scenario 2 — Mixed | | |
| Scenario 3 — No session (real journey and CLI-only) | | |
| Scenario 4 — No indicator (nothing completed yet) | | |
| Edge case — Graceful degradation | | |
| Edge case — Text-equivalent on every icon | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
