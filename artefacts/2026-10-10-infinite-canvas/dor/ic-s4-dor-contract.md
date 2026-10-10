# DoR Contract: Keyboard-accessible node movement (WCAG 2.1 AA)

**Story:** artefacts/2026-10-10-infinite-canvas/stories/ic-s4.md
**Date:** 2026-10-10

---

## What will be built

- `tabindex="0"` added to each drawflow node's DOM element, plus a visible `:focus` CSS style (not the invisible browser default).
- An arrow-key `keydown` handler on focused nodes: moves the node a fixed step in the pressed direction, calling `ic-s2`'s own position-update route with the new coordinates — same route, same fields, no parallel mechanism.
- Confirm Tab/Shift+Tab moves focus between nodes and cleanly off the canvas to the next page element, with no focus trap.

## What will NOT be built

- Continuous freehand keyboard dragging — ruled out in `/clarify`.
- Keyboard-based canvas pan/zoom — RISK-ACCEPTed (`decisions.md`).
- Configurable step size — a single hardcoded value for MVP.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1a (tabindex) | Rendered node DOM attribute check | Unit |
| AC1a (focus style) | Real browser focus + computed style check | E2E |
| AC1b | Synthetic `keydown`, assert position-update call fires with correct new coordinates | Unit |
| AC2 | Real browser Tab/Shift+Tab traversal, assert no focus trap | E2E |
| AC3 | Real browser, keyboard-only: focus → move → reload → confirm persisted | E2E |
| AC4 | Simulate both a drag-based update and a keyboard-based update, assert identical field writes | Unit |
| AC5 | Two consecutive synthetic `keydown`s, assert position moved twice | Unit |

## Assumptions

- `ic-s2`'s own position-update route accepts the same request shape regardless of whether the new coordinates came from a mouse drag or a keyboard nudge — no new route or parameter needed, just a new client-side trigger calling the same existing call.

## Estimated touch points

**Files:** The client `<script>` block inside `journeys.js`'s canvas render (keydown handler, tabindex/focus CSS), `tests/check-ic-s4-keyboard-movement.js` (new), `tests/e2e/ic-s4-keyboard-node-movement.spec.js` (new)
**Services:** None
**APIs:** None new — reuses `ic-s2`'s own position-update route
