## Test Plan: Touch tap-to-select / tap-to-place reorder fallback

**Story reference:** artefacts/2026-06-28-definition-canvas/stories/dic.4.md
**Discovery reference:** artefacts/2026-06-28-definition-canvas/discovery.md
**Test plan author:** Copilot
**Date:** 2026-06-28

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | touchstart on card → card--touch-selected + _touchState set | 2 tests | — | — | 1 scenario | Partial | 🟡 |
| AC2 | Second card tapped deselects first, selects second | 2 tests | — | — | 1 scenario | Partial | 🟡 |
| AC3 | Same-column current-phase cell placement → DOM reorder + pendingReorder + count++ + state cleared | 4 tests | — | — | 1 scenario | Partial | 🟡 |
| AC4 | Cross-column placement rejected — no DOM change, card stays selected | 2 tests | — | — | 1 scenario | Partial | 🟡 |
| AC5 | Locked-row placement rejected — no DOM change | 2 tests | — | — | 1 scenario | Partial | 🟡 |
| AC6 | Re-tap selected card deselects it | 2 tests | — | — | 1 scenario | Partial | 🟡 |
| AC7 | Mouse drag does not activate touch state | 1 test | — | — | 1 scenario | Partial | 🟡 |
| AC8 | Touch-placed reorder structurally identical to mouse-drag reorder in dispatch | 1 test | — | — | — | — | 🟢 |
| NFR-PERF | touchstart does not call preventDefault globally; native scroll not blocked | 2 tests | — | — | 1 scenario | Partial | 🟡 |

---

## Coverage gaps

All ACs for this story have a partial automated coverage gap. JSDOM does not simulate `TouchEvent` in Node.js. Unit tests exercise the handler functions directly by calling them with synthetic event-like objects; they do not simulate real browser touch events. The full interaction path must be verified manually on a touch device or via Playwright with touch simulation (emulated mobile viewport).

| Gap | AC | Gap type | Reason untestable in Node.js | Handling |
|-----|----|----------|------------------------------|---------|
| Real touchstart / touchend on a touch device | All ACs | Browser event | JSDOM does not fire TouchEvent | Unit tests call handler functions with synthetic objects; manual smoke test on touch device is required 🟡 |
| Touch/mouse co-firing on hybrid devices | AC7 | Browser event | Requires hybrid device | Manual: use Chrome DevTools touch emulation; verify card--touch-selected not applied during mouse drag 🟡 |
| Native scroll not blocked | NFR-PERF | Browser behaviour | JSDOM does not implement scrolling | Manual: on touch device, scroll the story map; verify page scrolls normally when touch target is not a card 🟡 |

> **Classification (per review LOW-1):** All AC1–AC8 unit tests exercise handler logic directly. The Playwright with touch simulation path is noted as a future enhancement; for this story's DoR, the manual smoke test scenarios are the verification gate for the browser-behaviour gaps.

---

## Test Data Strategy

**Source:** Synthetic — story map HTML fixtures; synthetic touch-like event objects with `touches[0].target`.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Story map DOM; card element; synthetic touchstart event object | Synthetic | None | |
| AC2 | Two story cards in different positions; two touchstart events | Synthetic | None | |
| AC3 | Card with _touchState set; target cell in same column, current-phase row | Synthetic | None | pendingReorder schema: {cardId, epicId, phaseId, newIndex} — same as dic.1 |
| AC4 | Card with _touchState set; target cell in different column | Synthetic | None | |
| AC5 | Card with _touchState set; target cell in locked row | Synthetic | None | |
| AC6 | Card already selected; same card touchstart event | Synthetic | None | |
| AC7 | Mousedown event on card; _touchState initial state | Synthetic | None | |
| NFR-PERF | touchstart on non-card scroll container element | Synthetic | None | |

### PCI / sensitivity constraints

None.

---

## Unit Tests

### touchstart on card sets card--touch-selected class

- **Verifies:** AC1
- **Precondition:** Story map DOM with a card; touch handler function is callable with a synthetic event `{ target: cardElement }`
- **Action:** Call `handleCardTouchStart({ target: cardElement })` (or dispatch from the handler)
- **Expected result:** `cardElement.classList.contains('card--touch-selected')` is `true`
- **Edge case:** No

### touchstart on card sets _touchState.selectedCardId

- **Verifies:** AC1
- **Precondition:** `_touchState` initially `{ selectedCardId: null, selectedCardEl: null }`
- **Action:** Call handler with cardElement
- **Expected result:** `_touchState.selectedCardId === cardElement.dataset.cardId`
- **Edge case:** No

### touchstart on second card deselects first card

- **Verifies:** AC2
- **Precondition:** card-1 is selected (card--touch-selected applied, _touchState set)
- **Action:** Call handler with card-2 element
- **Expected result:** card-1 no longer has `card--touch-selected`; card-2 has it
- **Edge case:** No

### touchstart on second card updates _touchState to second card

- **Verifies:** AC2
- **Precondition:** Same
- **Action:** Same
- **Expected result:** `_touchState.selectedCardId === card2Id`
- **Edge case:** No

### touchend on same-column current-phase cell moves card in DOM

- **Verifies:** AC3
- **Precondition:** card-2 is touch-selected; target cell is in card-2's epic column, current-phase row
- **Action:** Call `handleCellTouchEnd({ currentTarget: targetCell })` (or equivalent)
- **Expected result:** card-2 appears at the target position in the DOM
- **Edge case:** No

### touchend on same-column cell records pendingReorder entry

- **Verifies:** AC3
- **Precondition:** Same; `session.canvasCards.pendingReorder` initially empty
- **Action:** Same touchend
- **Expected result:** `pendingReorder[0]` has `{ cardId: card2Id, epicId, phaseId, newIndex }` — identical schema to dic.1 drag reorder entry
- **Edge case:** No

### touchend on same-column cell clears card--touch-selected

- **Verifies:** AC3
- **Precondition:** Same
- **Action:** Same touchend
- **Expected result:** card-2 no longer has `card--touch-selected`
- **Edge case:** No

### touchend on same-column cell increments pending count

- **Verifies:** AC3
- **Precondition:** Pending-changes count is 0
- **Action:** Same touchend
- **Expected result:** Pending count is 1
- **Edge case:** No

### touchend on different-column cell rejects placement

- **Verifies:** AC4
- **Precondition:** card-1 from column A is selected; target cell is in column B
- **Action:** Call touchend handler with column B cell
- **Expected result:** No DOM change; `pendingReorder` remains empty
- **Edge case:** No

### touchend on cross-column cell does not clear _touchState

- **Verifies:** AC4 (card stays selected)
- **Precondition:** Same
- **Action:** Same
- **Expected result:** `_touchState.selectedCardId` is still card-1's id after the rejected placement
- **Edge case:** No

### touchend on locked-row cell rejects placement

- **Verifies:** AC5
- **Precondition:** A card is selected; target cell is in a locked row (`data-phase-current="false"`)
- **Action:** Call touchend handler with locked-row cell
- **Expected result:** No DOM change; `pendingReorder` remains empty
- **Edge case:** No

### touchend on locked-row cell does not clear _touchState

- **Verifies:** AC5
- **Precondition:** Same
- **Action:** Same
- **Expected result:** `_touchState.selectedCardId` still set (card stays selected)
- **Edge case:** No

### touchstart on already-selected card deselects it

- **Verifies:** AC6
- **Precondition:** card-1 is selected
- **Action:** Call handler again with card-1 element
- **Expected result:** card-1 no longer has `card--touch-selected`; `_touchState` is `{ selectedCardId: null, selectedCardEl: null }`
- **Edge case:** Yes — retap deselect

### touchstart on already-selected card clears _touchState

- **Verifies:** AC6
- **Precondition:** Same
- **Action:** Same
- **Expected result:** `_touchState` is cleared (both fields null)
- **Edge case:** Yes

### mousedown on card does not set _touchState

- **Verifies:** AC7 (touch state not activated by mouse)
- **Precondition:** `_touchState` initially empty; mousedown handler not connected to touch state
- **Action:** Dispatch `mousedown` on a card (or confirm the handler only listens on `touchstart`)
- **Expected result:** `_touchState.selectedCardId` remains null; no `card--touch-selected` class applied
- **Edge case:** No

### pendingReorder entry from touch has identical schema to drag reorder entry

- **Verifies:** AC8
- **Precondition:** Two pendingReorder entries: one from dic.1 drag test, one from touch test
- **Action:** Compare schemas of the two entries
- **Expected result:** Both have exactly the same field set: `{ cardId, epicId, phaseId, newIndex }` — no extra or missing fields in the touch entry
- **Edge case:** No

### touchstart on non-card container does not call preventDefault

- **Verifies:** NFR-PERF (native scroll not blocked)
- **Precondition:** touchstart event on the story map container element (not a card)
- **Action:** Dispatch touchstart on the container with a mock event object
- **Expected result:** `event.preventDefault()` is NOT called
- **Edge case:** No

### touchstart on card does not call preventDefault on scroll ancestor

- **Verifies:** NFR-PERF (native scroll preserved on card touch)
- **Precondition:** touchstart on a card element; mock event object tracks all calls
- **Action:** Call handler
- **Expected result:** `event.stopPropagation()` is called only on the card element if needed; `event.preventDefault()` is NOT called (scroll must not be blocked)
- **Edge case:** No

---

## NFR Tests

### axe-core scan on story card with card--touch-selected applied passes WCAG AA

- **NFR addressed:** Accessibility (aria-selected)
- **Measurement method:** Apply `card--touch-selected` to a card HTML; set `aria-selected="true"` on the element; run `axe.run`; assert zero violations
- **Pass threshold:** Zero axe violations at AA level

---

## Manual Smoke Test Scenarios

These scenarios must be executed on a real touch device (tablet or touch-enabled laptop) or via Playwright with touch simulation.

1. **Basic select and place:** Tap a story card → verify highlight. Tap another cell in the same column → verify card moves.
2. **Cross-column rejection:** Tap a story card → tap a cell in a different epic column → verify no move.
3. **Locked row rejection:** Tap a story card → tap a cell in a locked row → verify no move.
4. **Deselect by retap:** Tap a card → tap the same card → verify highlight cleared.
5. **Native scroll:** Scroll the story map vertically → verify page scrolls normally (touch handler does not block scroll).
6. **Mouse-touch non-interference:** Use mouse to drag a card → verify no card--touch-selected highlight appears during mouse drag.

---

## Out of Scope for This Test Plan

- Touch add-story flow — dic.3's click handler covers tap on + button
- Server-side dispatch of touch-placed reorders — dic.5

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real TouchEvent in Node.js | JSDOM does not fire TouchEvent | Handler functions tested directly with synthetic objects; manual smoke test on touch device is required before DoR sign-off |
| Touch/mouse co-firing on hybrid devices | Requires hybrid device | Chrome DevTools touch emulation as acceptable proxy |
| Native scroll not blocked | Browser behaviour | Manual smoke test scenario 5 |
