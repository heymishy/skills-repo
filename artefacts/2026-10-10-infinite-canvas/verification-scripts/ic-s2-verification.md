# AC Verification Script: Free node positioning persisted across reloads

**Story reference:** artefacts/2026-10-10-infinite-canvas/stories/ic-s2.md
**Technical test plan:** artefacts/2026-10-10-infinite-canvas/test-plans/ic-s2-test-plan.md
**Script version:** 1
**Verified by:** Claude (session verify-completion pass) | **Date:** 2026-10-11 | **Context:** [x] Pre-code  [ ] Post-merge  [ ] Demo

**Method note:** Verified against the real `handleGetJourneyCanvas`/`handlePatchJourneyStagePosition` production handlers, dispatched through a minimal custom HTTP server (not server.js's own router/authGuard/requireNonViewer/CSRF chain, which are separately, directly tested in `tests/check-ic-s2-position-persistence.js`) against a single shared, mutable in-memory pool — a genuine persist-then-reload round trip through real production code in a real Chrome tab, not a static single-render snapshot. This repo's `fake-test-db.js` has no `customer_journeys`/`customer_journey_stages` backing in `NODE_ENV=test` with no `DATABASE_URL` (a pre-existing, already-documented gap, re-confirmed this session by reproducing it against `ep1-s4-stage-reorder.spec.js`), so a true end-to-end test against the real deployed server + real Postgres was not possible locally — this is what the story's own written E2E spec (`tests/e2e/ic-s2-canvas-drag-position.spec.js`) is for, and it SKIPs/fails the same way locally by design, running correctly wherever `DATABASE_URL` is set (CI/staging). A real drag gesture required dispatching a realistic `mousedown`/multiple `mousemove`/`mouseup` sequence via JS directly at the DOM node — the browser automation tool's own single-step drag primitive did not generate the intermediate `mousemove` events drawflow's gesture handling needs to register a move (confirmed: zero network requests fired from that tool's drag; a real event sequence immediately produced a real `PATCH .../position` → 200).

---

## Setup

**Before you start:**
1. Open a journey with at least 2 stages on the Canvas tab.

**Reset between scenarios:** Reload the page.

---

## Scenarios

---

### 🔴 Scenario 1: Dragging a node keeps it where you drop it, even after reloading

**Covers:** AC1

**Steps:**
1. Click and drag any stage node to a clearly different, empty area of the canvas (not on top of another node).
2. Release the mouse.
3. Reload the page.

**Expected outcome:**
> The node stays exactly where you dropped it — not the default position, both immediately after the drop and after reloading the page.

**Result:** [x] Pass  [ ] Fail
**Notes:** Full real round trip confirmed in Chrome: dragged the "Discover" node (originally at the auto-layout position) via a real `mousedown`→10×`mousemove`→`mouseup` sequence; a real `PATCH /journeys/j1/stages/s1/position` fired and returned 200 (confirmed via the Network panel). Reloaded the page (a genuine navigation, re-invoking `handleGetJourneyCanvas` against the same pool, now mutated) — the node rendered at `left: 528px; top: -201px` (read directly from its DOM `style`), a position matching the drag direction/magnitude and clearly different from the original auto-layout position, not reset.

---

### Scenario 2: Stages you haven't dragged yet use the default layout

**Covers:** AC2

**Steps:**
1. Open a journey where no stage has ever been dragged.
2. Open the Canvas tab.

**Expected outcome:**
> Every stage shows at its default left-to-right position — not stacked on top of each other in one corner.

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed visually before any drag occurred: a 2-stage journey with "Discover" at `position_x/position_y: null` and "Evaluate" at a pre-set stored position (500, 300) rendered with Discover at the left-to-right auto-layout spot and Evaluate at its own distinct stored spot, with a correctly-curved connecting line bridging the two different positions — not stacked, not erroring.

---

### Scenario 3: Dragging one stage doesn't move another

**Covers:** AC5

**Steps:**
1. Note the current position of two different stages.
2. Drag only one of them to a new position.
3. Reload the page.

**Expected outcome:**
> Only the stage you dragged moved. The other stage is exactly where it was before.

**Result:** [x] Pass  [ ] Fail
**Notes:** "Evaluate" (the un-dragged stage, stored position 500/300) rendered at the same visual position across every screenshot this session — before any drag, immediately after dragging "Discover," and after the reload — confirming it was never touched by the UPDATE issued for "Discover." This mirrors the stronger evidence already in Task 2's own integration test (AC5), which directly asserts at the handler level that updating stage A issues exactly one UPDATE call targeting only A's id, with B's id never appearing in the UPDATE params.

---

### Edge case: A failed save tells you, instead of staying silent

**Covers:** AC6

**Steps:**
1. Turn off your network connection (or use your browser's dev tools to block the save request).
2. Drag a node to a new position.

**Expected outcome:**
> You see a visible message telling you the save failed — you are not left thinking it worked when it didn't.

**Result:** [x] Pass  [ ] Fail
**Notes:** Simulated a failed save by patching `window.fetch` to reject requests to the `.../position` URL (equivalent to a real network failure), then performed a real drag gesture. Confirmed within the real 3-second display window (checked ~100ms after the drag, before the toast's own auto-hide `setTimeout` could fire): `#sw-stage-reorder-error` showed `textContent: "Stage position not saved — please try again"` and had the `sw-stage-reorder-error--visible` class applied. (First check attempt, taken after several additional round-trip tool calls, landed after the 3-second auto-hide had already fired — text was present but visibility was false; re-ran with a tight ~100ms check to land inside the actual display window and confirmed both conditions.)

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — drag persists across reload 🔴 | Pass | Real drag → real PATCH (200) → real reload → stored position used |
| Scenario 2 — default layout for untouched stages | Pass | Confirmed visually, no issue found |
| Scenario 3 — dragging one doesn't move another | Pass | Confirmed visually + already covered at handler level by Task 2's own test |
| Edge case — failed save is visible | Pass | Confirmed within the real display window, correct text |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| None | — | — | — | — |

A tooling-level observation, not a product finding: the browser automation tool's own single-step drag primitive (`left_click_drag`) does not generate the intermediate `mousemove` events drawflow's gesture handling needs to register a move — it produced zero network requests on two separate attempts. A real `mousedown`→multiple-`mousemove`→`mouseup` sequence, dispatched directly via JS, worked immediately and correctly. Not an AC/implementation defect; noted here only so a future live-browser check of this same canvas does not waste time assuming the product is broken when it is the drag-simulation technique that needs adjusting.
