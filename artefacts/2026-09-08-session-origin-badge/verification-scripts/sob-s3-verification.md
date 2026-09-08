# AC Verification Script: Session-origin indicator on the org kanban board

**Story reference:** artefacts/2026-09-08-session-origin-badge/stories/sob-s3-org-kanban-indicator.md
**Technical test plan:** artefacts/2026-09-08-session-origin-badge/test-plans/sob-s3-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open `/org/kanban` on `wuce-staging`.
2. You'll want to find at least one card driven fully through real chat sessions, and one with a mix.

**Reset between scenarios:** No reset needed — read-only view.

---

## Scenarios

---

### Scenario 1: A card for a fully session-backed feature shows "fully session-backed"

**Covers:** AC1

**Steps:**
1. Open the org kanban board.
2. Find a card for a feature you completed live in chat.

**Expected outcome:**
> That card shows the same "fully session-backed" icon and tooltip you saw on the product page and `/journey`.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A card for a feature with mixed session/CLI stages shows "mixed"

**Covers:** AC2

**Steps:**
1. Open the org kanban board.
2. Find a card for a feature with a mix of session-driven and CLI-driven stages.

**Expected outcome:**
> That card shows the "mixed" icon.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: The board doesn't get slower or add a second lookup mechanism

**Covers:** AC3

**Steps:**
1. Best checked with engineering help via the automated test — confirms the board reuses the same underlying lookup the product page uses, not a second one.

**Expected outcome:**
> Only one shared lookup mechanism exists across the whole app for this feature.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: The board still loads if the session-origin data can't be read

**Covers:** AC4

**Steps:**
1. Best checked with engineering help by temporarily forcing the lookup to fail.
2. Load the org kanban board while the failure is forced.

**Expected outcome:**
> The board still loads completely and normally, with no error — just no session-origin icons on any card until the underlying issue is fixed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: You will not see a "no session" icon on this board today — and that's expected

**Covers:** AC5

**Steps:**
1. Look through every card currently on the org kanban board.

**Expected outcome:**
> Every card shows either "fully session-backed" or "mixed" — none show "no session", because every card on this board already has a real journey behind it by how this board is built today. If you ever DO see a "no session" card here, that's worth flagging — it means this known limitation has changed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — Fully session-backed | | |
| Scenario 2 — Mixed | | |
| Edge case — Shared lookup, no slowdown | | |
| Edge case — Graceful degradation | | |
| Edge case — No "no session" cards (expected limitation) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
