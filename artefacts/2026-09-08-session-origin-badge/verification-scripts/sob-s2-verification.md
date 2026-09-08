# AC Verification Script: Session-origin indicator on the /journey dashboard

**Story reference:** artefacts/2026-09-08-session-origin-badge/stories/sob-s2-journey-dashboard-indicator.md
**Technical test plan:** artefacts/2026-09-08-session-origin-badge/test-plans/sob-s2-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open `/journey` on `wuce-staging`, signed in as usual.
2. You'll want to spot at least one card built through a real chat session, and at least one built entirely via the CLI/agent (most cards on this page will be the latter).

**Reset between scenarios:** No reset needed — read-only view.

---

## Scenarios

---

### Scenario 1: A card for a feature driven entirely through real chat sessions shows "fully session-backed"

**Covers:** AC1

**Steps:**
1. Open `/journey`.
2. Find a card for a feature you completed live in chat, start to finish.

**Expected outcome:**
> That card shows the same "fully session-backed" icon you saw on the product feature-list page, with the same tooltip wording.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A card for a feature with a mix of session and CLI-driven stages shows "mixed"

**Covers:** AC2

**Steps:**
1. Open `/journey`.
2. Find a card for a feature where some stages were done live, others by an agent.

**Expected outcome:**
> That card shows the "mixed" icon, same as on the product page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A card for a CLI-authored feature with no real journey at all shows "no session"

**Covers:** AC3

**Steps:**
1. Open `/journey`.
2. Find a card for a feature built entirely by an agent — most cards on this page.

**Expected outcome:**
> That card shows "no session" — the page doesn't error or show a blank/broken card for these.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A card for a feature with no completed stages yet shows no indicator

**Covers:** AC4

**Steps:**
1. Open `/journey`.
2. Find a card still sitting at "Idea", nothing completed yet.

**Expected outcome:**
> No session-origin icon appears on that card at all.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: The /journey page doesn't feel slower or make extra requests

**Covers:** AC5

**Steps:**
1. This is best checked with engineering help via the automated test, or by watching the browser's network tab while loading `/journey`.

**Expected outcome:**
> No new network request appears for this feature beyond what `/journey` already made before this story shipped.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — Fully session-backed | | |
| Scenario 2 — Mixed | | |
| Scenario 3 — No session (CLI-authored) | | |
| Scenario 4 — No indicator (nothing completed) | | |
| Edge case — No new requests | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
