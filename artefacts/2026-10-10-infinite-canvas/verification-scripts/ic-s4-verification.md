# AC Verification Script: Keyboard-accessible node movement (WCAG 2.1 AA)

**Story reference:** artefacts/2026-10-10-infinite-canvas/stories/ic-s4.md
**Technical test plan:** artefacts/2026-10-10-infinite-canvas/test-plans/ic-s4-test-plan.md
**Script version:** 1
**Verified by:** Claude (session verify-completion pass) | **Date:** 2026-10-11 | **Context:** [x] Pre-code  [ ] Post-merge  [ ] Demo

**Method note:** Verified against the real `handleGetJourneyCanvas`/`handlePatchJourneyStagePosition` production handlers, dispatched through a minimal custom HTTP server (same technique as `ic-s1`/`ic-s2`/`ic-s3`'s own live checks) against an in-memory mock pool (mutated by the real PATCH route, so a reload reflects a genuinely "persisted" value), serving the real `drawflow.min.js`/`.css` assets, in a real Chrome tab. All Tab/Shift+Tab/Arrow key presses were dispatched as real OS-level key events (not synthetic JS events), avoiding the known synthetic-wheel/mouse-drag limitation already documented for `ic-s2`/`ic-s3`.

**Local E2E run attempted first (and why it fell back to this method):** Ran the real `tests/e2e/ic-s4-keyboard-node-movement.spec.js` against a disposable Docker Postgres container (same approach used to close `ic-s2`'s own DoD test-count gap). It failed — not from this story's own code, but from a genuinely pre-existing, unrelated migration-ordering gap: `getProductsNavSummary` (in `products.js`'s dashboard route) queries a legacy `journeys` table that is never created on a freshly-migrated database, 500-ing the dashboard before any journey-specific content renders. Confirmed not a regression by running `ic-s2`'s own already-merged `ic-s2-canvas-drag-position.spec.js` against the identical fresh container — it failed in the exact same way. Not in this story's scope to fix; falling back to the live-server method above for genuine evidence instead of leaving these ACs unverified.

---

## Setup

**Before you start:**
1. Open a journey with 2+ stages on the Canvas tab.
2. **Put your mouse away for this entire script.**

**Reset between scenarios:** Reload the page.

---

## Scenarios

---

### Scenario 1: You can focus a node with Tab, and see that it's focused

**Covers:** AC1a

**Steps:**
1. Press the Tab key repeatedly until a stage node appears highlighted.

**Expected outcome:**
> You can clearly see which node is focused — a visible outline or highlight, not something invisible you have to guess at.

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed live: `tabindex="0"` present on all 3 real node elements. Focusing the first node and reading its real computed style gave `outlineStyle: "solid"`, `outlineWidth: "3px"`, `outlineColor: "rgb(37, 99, 235)"` (= `var(--accent)` = `#2563EB`, confirmed matching) — a zoomed screenshot visually confirms a clear blue outline around the node. One tooling nuance found and worked around (not a product finding): the FIRST `getComputedStyle` check (before clicking anywhere in the automated tab) incorrectly showed `outlineStyle: "none"` despite `document.activeElement` being correct — `document.hasFocus()` was `false` at that point. Clicking into the page first (giving the document real focus) fixed it; a genuine user's browser tab always has document focus, so this is purely an automation-tooling artifact, not a product defect.

---

### Scenario 2: Arrow keys move the focused node

**Covers:** AC1b, AC5

**Steps:**
1. With a node focused, press the right arrow key once.
2. Press it three more times.

**Expected outcome:**
> The node moves a small step to the right each time you press the key — four presses move it noticeably further than one.

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed live: starting at `left:0px;top:120px`, two real `ArrowRight` presses plus one real `ArrowDown` press moved the node to exactly `left:40px;top:140px` — precisely 2×20px right and 1×20px down, matching the fixed 20px step exactly, confirming cumulative (not one-shot-clamped) movement.

---

### Scenario 3: Tab moves between nodes and off the canvas, never gets stuck

**Covers:** AC2

**Steps:**
1. Press Tab repeatedly, past every node on the canvas, and keep going.
2. Press Shift+Tab repeatedly to go back.

**Expected outcome:**
> Focus moves from node to node, then moves on to whatever comes after the canvas on the page (don't get stuck cycling only through the canvas's own nodes forever).

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed live in both directions — forward: 9 real Tab presses from the first node reached `<body>` (fully off the page's own tab sequence), passing through each node's own `Edit stage`/`Map feature` child links/buttons along the way (also natively focusable — a real finding, not a defect: a node contains more than one tab stop). Backward: 2 real Shift+Tab presses from the first node reached the canvas's own outer container element, then "+ Add stage", genuinely outside the canvas. No cycle back into a node in either direction. **This live check found that the E2E spec's original assumption ("exactly 3 Tabs = past all 3 nodes") was factually wrong** — fixed before merge to loop until focus genuinely leaves the canvas (bounded, not a hardcoded press count), matching this scenario's own real, literal behaviour.

---

### Scenario 4: The whole thing works with no mouse at all

**Covers:** AC3

**Steps:**
1. Using only the keyboard: Tab to a node, move it with arrow keys.
2. Reload the page.

**Expected outcome:**
> The node you moved is still in its new position after reloading — the entire flow worked without ever touching the mouse.

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed live: focused the first node, moved it to `left:40px;top:140px` via real arrow-key presses (Scenario 2's own moves), waited for the save request to complete, then performed a genuine page navigation/reload (re-dispatching the real handler against the same mutated mock pool). The reloaded node rendered at the exact same `left:40px;top:140px` — not reset to the default auto-layout position (`0,120`). Full keyboard-only flow confirmed end to end.

---

### Edge case: Keyboard and mouse movement agree with each other

**Covers:** AC4

**Steps:**
1. Drag a node with the mouse to a new spot and note roughly where it is.
2. Reload. Confirm it's still there.
3. Now use the keyboard to move that same node a little further.
4. Reload again.

**Expected outcome:**
> Both the mouse-dragged position and the keyboard-moved position persist correctly — there's no separate "keyboard position" that conflicts with the "mouse position."

**Result:** [x] Pass  [ ] Fail
**Notes:** Verified via the real-jsdom-execution unit test (`check-ic-s4-keyboard-node-movement.js`, AC4) rather than re-run live: a real mouse-drag event sequence and a real keyboard arrow-key move on the same node both produced exactly one save request each, to the exact same URL, with the exact same `x`/`y` field names — confirmed by directly reading drawflow's own source (`getNodeFromId` deep-clones; the live mutable record both code paths write to is `editor.drawflow.drawflow[editor.module].data[nodeId]`) that there is no second, parallel position model. Not re-verified live separately since the unit test already executes the real library and the real handler-reuse path end to end; the live checks above (Scenarios 2 and 4) already exercise the keyboard half of this same mechanism against the real production handler.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — visible focus | Pass | `outline: 3px solid #2563EB` confirmed via computed style + screenshot |
| Scenario 2 — arrow keys move node | Pass | Exact 20px-per-press cumulative movement confirmed |
| Scenario 3 — tab order, no trap | Pass | Confirmed both directions; found and fixed an inaccurate press-count assumption in the E2E spec |
| Scenario 4 — full keyboard-only flow | Pass | Moved position survived a genuine reload |
| Edge case — keyboard/mouse agree | Pass | Confirmed via real-jsdom-execution unit test (AC4) |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| Scenario 3 | E2E spec asserts tab order after exactly 3 presses | Each node has 2 additional native tab stops (Edit stage link, Map feature button) plus the canvas's own container is a stop too, so 3 presses does not reach past all nodes | LOW (test-accuracy only, not a product defect) | Fixed implementation: none needed. Fixed test: `tests/e2e/ic-s4-keyboard-node-movement.spec.js` now loops (bounded) until focus genuinely leaves `#sw-drawflow-canvas`, rather than asserting after a fixed press count. |

No product-code findings. One genuine E2E-test-accuracy correction made before merge (see above). One tooling-automation nuance noted (`document.hasFocus()` needed for `:focus` CSS matching in an automated tab), not a product finding, matching the general category of tooling quirks already documented for `ic-s2`/`ic-s3`'s own live checks.
