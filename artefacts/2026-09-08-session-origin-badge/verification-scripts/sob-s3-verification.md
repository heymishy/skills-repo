# AC Verification Script: Session-origin indicator on the org kanban board

**Story reference:** artefacts/2026-09-08-session-origin-badge/stories/sob-s3-org-kanban-indicator.md
**Technical test plan:** artefacts/2026-09-08-session-origin-badge/test-plans/sob-s3-test-plan.md
**Script version:** 1
**Verified by:** Claude Sonnet 5 (Chrome browser automation, DOM-level + visual inspection) | **Date:** 2026-09-09 | **Context:** [ ] Pre-code  [x] Post-merge  [ ] Demo

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

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed live on `/org/kanban`: all 31 badge elements found show `data-sob-session-origin="fully-session-backed"`, `class="sw-pill sw-pill--nodot"` (matching sob-s1/sob-s2's exact treatment — this is the mandatory final reviewer's own fix, confirmed correctly deployed), `title`/`aria-label` present on all. Also visually confirmed via a zoomed screenshot: the small filled dot (`●`) renders correctly next to the "1 artefact" badge on a real card.

---

### Scenario 2: A card for a feature with mixed session/CLI stages shows "mixed"

**Covers:** AC2

**Steps:**
1. Open the org kanban board.
2. Find a card for a feature with a mix of session-driven and CLI-driven stages.

**Expected outcome:**
> That card shows the "mixed" icon.

**Result:** [x] Pass  [ ] Fail
**Notes:** No live "mixed" card found among the 31 badges currently on `/org/kanban` (all are "fully-session-backed" today). The rendering code path is identical to `/journey`'s own card rendering (`kanban-view.js`'s shared `_renderKanbanColumns`, using the same `sessionOriginBadgeMeta` helper) — a real "mixed" card was found and confirmed correct on `/journey` (see sob-s2-verification.md Scenario 2), and the automated test suite (`check-sob-s3-org-kanban-integration.js`) directly render-tests the mixed case through `kanban-view.js`'s own `renderKanban` function. Not independently found live on this specific board today, but the rendering mechanism is proven correct both by a live sibling surface and by a direct automated render-level test.

---

### Edge case: The board doesn't get slower or add a second lookup mechanism

**Covers:** AC3

**Steps:**
1. Best checked with engineering help via the automated test — confirms the board reuses the same underlying lookup the product page uses, not a second one.

**Expected outcome:**
> Only one shared lookup mechanism exists across the whole app for this feature.

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed via the automated test (`check-sob-s3-org-kanban-integration.js`, AC3: "`_enrichColumnsWithSessionOrigin` is the only path org kanban uses to populate sessionOrigin", asserting exactly one call to the shared `_getSessionOriginBulk` seam). The live board loaded all 31 cards with no visible delay.

---

### Edge case: The board still loads if the session-origin data can't be read

**Covers:** AC4

**Steps:**
1. Best checked with engineering help by temporarily forcing the lookup to fail.
2. Load the org kanban board while the failure is forced.

**Expected outcome:**
> The board still loads completely and normally, with no error — just no session-origin icons on any card until the underlying issue is fixed.

**Result:** [x] Pass  [ ] Fail
**Notes:** Per the script's own guidance, verified via the automated test (`check-sob-s3-org-kanban-integration.js`, AC4: "board render survives a thrown bulk read, cards simply have no sessionOrigin") rather than forcing a live failure on staging.

---

### Edge case: You will not see a "no session" icon on this board today — and that's expected

**Covers:** AC5

**Steps:**
1. Look through every card currently on the org kanban board.

**Expected outcome:**
> Every card shows either "fully session-backed" or "mixed", because every card on this board already has a real journey behind it by how this board is built today. If you ever DO see a "no session" card here, that's worth flagging.

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed live: 0 of 31 badges on `/org/kanban` show `data-sob-session-origin="no-session"` — every single one is "fully-session-backed", exactly matching this documented structural limitation. Nothing to flag.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — Fully session-backed | Pass | 31/31 badges live, visually confirmed |
| Scenario 2 — Mixed | Pass | Code path confirmed identical to /journey's live-verified case |
| Edge case — Shared lookup, no slowdown | Pass | Via automated test, per script's own guidance |
| Edge case — Graceful degradation | Pass | Via automated test, per script's own guidance |
| Edge case — No "no session" cards (expected limitation) | Pass | 0/31, confirmed live |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
