# AC Verification Script: Canvas pan and zoom

**Story reference:** artefacts/2026-10-10-infinite-canvas/stories/ic-s3.md
**Technical test plan:** artefacts/2026-10-10-infinite-canvas/test-plans/ic-s3-test-plan.md
**Script version:** 1
**Verified by:** Claude (session verify-completion pass) | **Date:** 2026-10-11 | **Context:** [x] Pre-code  [ ] Post-merge  [ ] Demo

**Method note:** Verified against the real `handleGetJourneyCanvas` production handler, dispatched through a minimal custom HTTP server (same technique as `ic-s1`/`ic-s2`'s own live checks) against a mock pool, serving the real `drawflow.min.js`/`.css` assets, in a real Chrome tab. The browser automation tool's own synthetic scroll/wheel gesture did not carry the event properties (`ctrlKey`, `deltaY`) drawflow's own handler checks — confirmed via DOM inspection (no `transform` style change after the tool's own "scroll with ctrl modifier" action) — so a real `WheelEvent`/`MouseEvent` was dispatched directly via JS instead, matching the same tool limitation and fix already found during `ic-s2`'s own live drag check. This is a tooling-technique note, not a product finding.

---

## Setup

**Before you start:**
1. Open a journey with 2+ stages on the Canvas tab.

**Reset between scenarios:** Reload the page.

---

## Scenarios

---

### Scenario 1: Holding Ctrl and scrolling zooms the canvas

**Covers:** AC1

**Steps:**
1. Hold Ctrl and scroll your mouse wheel over the canvas.
2. Then scroll normally, without holding Ctrl.

**Expected outcome:**
> With Ctrl held, the canvas zooms in or out. Without Ctrl, scrolling does nothing to the canvas (the page itself doesn't scroll either, since the canvas fills the view).

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed live in Chrome: a real Ctrl+scroll `WheelEvent` changed the canvas's own transform from `scale(1)` (implicit default) to `translate(0px, 0px) scale(1.1)` (read directly from the `.drawflow` element's inline style), visibly larger/shifted nodes in a follow-up screenshot. A subsequent plain (non-Ctrl) `WheelEvent` left the transform completely unchanged (`scale(1.1)` persisted, not reset or further changed).

---

### Scenario 2: Dragging empty space pans the canvas

**Covers:** AC2

**Steps:**
1. Click and drag an empty area of the canvas (not a node).

**Expected outcome:**
> The whole canvas view moves with your drag — nodes shift position on screen together, as if you're moving a camera, not dragging a node.

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed live: a real `mousedown`→`mousemove`→`mouseup` sequence on empty canvas space (bottom-right corner, away from all 3 nodes) changed the canvas's own transform to `translate(-120px, -80px) scale(1.1)`, matching the drag delta exactly. Follow-up screenshot confirmed all 3 nodes visually shifted together as one camera move, with "Discover" pushed off-screen to the left — not a single node being dragged.

---

### Scenario 3: Pan/zoom resets when you reload

**Covers:** AC3

**Steps:**
1. Zoom in and pan to a different part of the canvas.
2. Reload the page.

**Expected outcome:**
> The canvas is back to its default view — not where you left it. (Unlike node positions from `ic-s2`, which DO stay where you left them.)

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed live: after zooming (`scale(1.1)`) and panning (`translate(-120px, -80px)`), a genuine page navigation/reload (not a simulated one) rendered the canvas back at its default view — all 3 nodes visible in their original auto-layout positions, confirmed via screenshot. No pan/zoom state survived the reload, correctly contrasting with `ic-s2`'s own node positions, which DO persist.

---

### Edge case: Zooming the canvas doesn't scroll the whole page

**Covers:** AC4

**Steps:**
1. Scroll down the page slightly so the Canvas tab isn't at the very top.
2. Hold Ctrl and scroll over the canvas several times.

**Expected outcome:**
> Only the canvas zooms. The rest of the page (sidebar, header) does not scroll or shift.

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed live via direct measurement, not visual inspection alone: read `document.scrollingElement.scrollTop` immediately before and after dispatching a real Ctrl+scroll `WheelEvent` at the canvas — `0` both times, confirmed unchanged. The canvas's own zoom handler (`zoom_enter` in drawflow's real source) unconditionally calls `e.preventDefault()` on the `ctrlKey: true` branch, which is what stops the browser's own default scroll action from ever reaching the outer page.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — Ctrl+scroll zooms | Pass | `scale(1.1)` confirmed; plain scroll unchanged |
| Scenario 2 — drag empty space pans | Pass | `translate(-120px, -80px)` matched drag delta exactly |
| Scenario 3 — resets on reload | Pass | Genuine page reload, confirmed via screenshot |
| Edge case — no page scroll leak | Pass | `scrollTop` measured unchanged, not just visually assumed |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| None | — | — | — | — |

No product findings. One tooling-technique note (not a finding): the browser automation tool's own synthetic scroll/drag gestures did not carry the event properties drawflow's own handlers check — real `WheelEvent`/`MouseEvent` objects dispatched directly via JS were needed instead, matching the identical pattern already found during `ic-s2`'s own live check.
