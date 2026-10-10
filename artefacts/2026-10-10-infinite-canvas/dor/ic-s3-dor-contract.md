# DoR Contract: Canvas pan and zoom

**Story:** artefacts/2026-10-10-infinite-canvas/stories/ic-s3.md
**Date:** 2026-10-10

---

## What will be built

- Confirm/wire drawflow's own built-in `Ctrl+scroll` zoom and drag-to-pan behaviour on the journey canvas — this is largely configuration, not new logic (drawflow provides this out of the box).
- Ensure the canvas container properly captures wheel/drag events so they don't bubble to the outer page scroll (likely a `wheel`/`mousedown` listener with `preventDefault()`/`stopPropagation()` on the canvas container, or drawflow's own built-in containment if sufficient — to be confirmed during implementation).
- No persistence of pan/zoom state — explicitly session-only.

## What will NOT be built

- Keyboard-based pan/zoom — formally RISK-ACCEPTed (`decisions.md`).
- Any change to node positioning logic (`ic-s2`) or node rendering (`ic-s1`).

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Synthetic `WheelEvent` (`ctrlKey: true` vs `false`), assert `editor.zoom` changes only in the first case | Unit |
| AC2 | Synthetic `mousedown`/`mousemove`/`mouseup` on empty canvas, assert `editor.canvas_x`/`canvas_y` change | Unit |
| AC3 | Fresh editor instance after a prior pan/zoom, assert default state, assert no persistence API call was made | Unit |
| AC4 | Dispatch a `WheelEvent` over the canvas, assert `event.defaultPrevented` / outer container `scrollTop` unchanged | Unit |

## Assumptions

- Drawflow's own default pan/zoom behaviour, once correctly initialized, already satisfies AC1/AC2 with zero custom interaction code — this story is primarily about *confirming* and *containing* that default behaviour (AC4), not building pan/zoom logic from scratch.

## Estimated touch points

**Files:** The client `<script>` block inside `journeys.js`'s canvas render (editor initialization config), `tests/check-ic-s3-pan-zoom.js` (new)
**Services:** None
**APIs:** None — pure client-side interaction wiring
