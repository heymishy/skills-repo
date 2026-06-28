# Story: Touch tap-to-select / tap-to-place reorder fallback

**Epic reference:** artefacts/2026-06-28-definition-canvas/discovery.md
**Discovery reference:** artefacts/2026-06-28-definition-canvas/discovery.md
**Benefit-metric reference:** artefacts/2026-06-28-definition-canvas/benefit-metric.md

## User Story

As a **platform operator using a touch device (tablet or touch-enabled laptop)**,
I want to tap a story card to select it and then tap a target cell to place it at that position,
So that I can reorder stories on the canvas without needing mouse drag-and-drop, which does not fire on touch devices.

## Benefit Linkage

**Metrics moved:** MM1 (definition re-instruction turns reduced) — without a touch fallback, operators on touch devices cannot use the canvas drag-reorder at all and must fall back to chat re-instructions, negating MM1 for that device class.
**How:** The tap-to-select / tap-to-place interaction is a direct parity mechanism: it produces the same outcome (reordered card, pending change recorded) as the dic.1 mouse drag, via a touch-compatible interaction path.

## Architecture Constraints

- HTML5 `dragstart` / `dragover` / `drop` events do not fire on touch devices. The touch fallback uses `touchstart` on story cards and `touchend`/`click` on target cells — no third-party library.
- Touch state is held in a module-level variable `_touchState = { selectedCardId: null, selectedCardEl: null }` within the inline script block. This is not persisted to `session.canvasCards` until a placement occurs.
- On `touchstart` of a story card: card receives `class="card--touch-selected"` (visual highlight). If another card was already selected, it is deselected first. `_touchState` is updated.
- On `touchend` / `click` of a target cell (a `<td>` in the current-phase row): if `_touchState.selectedCardId` is non-null and the target cell is in the same epic column as the selected card, the card is moved to the target position in the DOM and the reorder is recorded in `session.canvasCards.pendingReorder` (same record format as dic.1 mouse drag). `_touchState` is cleared and the card's `card--touch-selected` class is removed.
- Cross-column placement is rejected (same guard as dic.1 AC3 — target cell's column must match selected card's column).
- Future-phase row placement is rejected (same guard as dic.2 AC3 — target cell's row must have `data-phase-current="true"`).
- No new JS file. Touch handling is in the same `initCanvasInteractivity()` init block as dic.1 and dic.2 handlers.
- The `+` button add flow from dic.3 is not affected by touch state. A touch tap on the `+` button uses the existing click handler; touch state is cleared if a card is currently selected.

## Dependencies

- **Upstream:** dic.1 (drag-and-drop init block structure; `session.canvasCards.pendingReorder` format). dic.2 (phase row locking — touch fallback must apply the same phase guard). dic.3 (add-story `+` button must remain tappable when touch state is active).
- **Downstream:** dic.5 (canvas-edit dispatch) — `pendingReorder` produced by touch placement is structurally identical to that from mouse drag; dic.5 makes no distinction.

## Acceptance Criteria

**AC1:** Given the story map is rendered on a touch device, when the operator taps a story card, then: (a) the card receives `class="card--touch-selected"` and a visible selection highlight; (b) `_touchState.selectedCardId` is set to the card's id; (c) no drag is initiated (no `dragstart` event is expected on touch).

**AC2:** Given a card is touch-selected (`card--touch-selected` present), when the operator taps a second story card (different card, same or different column), then: (a) the first card loses its selection highlight; (b) the second card gains `card--touch-selected`; (c) `_touchState.selectedCardId` updates to the second card's id.

**AC3:** Given a card is touch-selected, when the operator taps a target cell in the same epic column and the current-phase row, then: (a) the selected card is moved to the target position in the DOM (after the target cell's existing card, if any); (b) the reorder is recorded in `session.canvasCards.pendingReorder` using the same record format as dic.1; (c) the pending-changes count increments; (d) the card's `card--touch-selected` class is removed and `_touchState` is cleared.

**AC4:** Given a card is touch-selected, when the operator taps a cell in a different epic column, then the placement is rejected — no DOM change, no pending change, no state change. `_touchState.selectedCardId` remains set (the card stays selected for a valid placement).

**AC5:** Given a card is touch-selected, when the operator taps a cell in a locked future-phase row (`data-phase-current="false"`), then the placement is rejected — same as AC4 rejection behaviour.

**AC6:** Given a card is touch-selected, when the operator taps the same card again (second tap on the already-selected card), then the selection is cancelled — `card--touch-selected` is removed, `_touchState` is cleared. This is the "deselect" affordance.

**AC7:** Given the operator is using a mouse (not a touch device), when they interact with the story map, then the touch selection state never activates — there is no `card--touch-selected` class applied during mouse drag. The two interaction paths do not interfere.

**AC8:** Given a touch device user has tapped a card and placed it (AC3), when the "Apply changes" button is tapped, then the pending reorder recorded via touch is included in the batch dispatch — the server sees no structural difference between a touch-placed reorder and a mouse-drag reorder.

## Out of Scope

- Pinch-to-zoom or scroll interference handling — the implementation must not cancel native touch scroll; `touchstart` must call `e.stopPropagation()` only on card elements, not on the scroll container
- Long-press to initiate a "drag mode" on touch — the tap-to-select / tap-to-place model is the only touch interaction pattern; long-press is not used
- Touch add-story flow (beyond what dic.3 already provides via the `+` button click handler) — the `+` button tap is handled by dic.3's click event; dic.4 does not add a separate touch path for adds

## NFRs

- **Accessibility:** Touch selection state must be announced to screen readers (the selected card should gain `aria-selected="true"` when `card--touch-selected` is applied). The cancel-by-retap affordance (AC6) must be documented in an accessible tooltip or `aria-label` update on the selected card.
- **Performance:** `touchstart` handler must not call `event.preventDefault()` globally — doing so blocks native scroll. Only prevent default if the touch target is confirmed to be a story card.
- **Regression:** All dic.1, dic.2, dic.3 tests continue to pass. Mouse drag tests must not fail on environments that also fire touch events (JSDOM does not simulate touch events — mouse and touch tests run independently).

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
**Rationale:** The tap-to-select / tap-to-place model is architecturally simple (two event handlers, one module-level state variable). The main risk is touch/mouse event co-firing on hybrid devices — mitigated by using `touchstart` (fires only on touch) rather than `pointerdown` (fires on both). A known JSDOM limitation means touch events cannot be tested in the existing Node.js unit test suite; touch path testing requires a manual smoke test on a touch device or Playwright with touch simulation, which must be documented in the test plan.
