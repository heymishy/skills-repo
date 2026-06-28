## Test Plan: Interactive story cards with inherited/new styling and epic rename guard

**Story reference:** artefacts/2026-06-28-definition-canvas/stories/dic.1.md
**Discovery reference:** artefacts/2026-06-28-definition-canvas/discovery.md
**Test plan author:** Copilot
**Date:** 2026-06-28

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Model-emitted stories have data-origin="model", card--inherited class, dashed border + model tag | 3 tests | — | — | — | — | 🟢 |
| AC2 | Drag within same epic column updates order + records pendingReorder | 2 tests | — | — | — | — | 🟢 |
| AC3 | Drag to different epic column rejected — no DOM change, no state change | 2 tests | — | — | — | — | 🟢 |
| AC4 | Epic label click/edit → no edit field; tooltip with specified text; auto-dismisses after 3s | 3 tests | — | — | — | — | 🟢 |
| AC5 | Origin distinction (inherited/new) survives map refresh | 2 tests | — | — | — | — | 🟢 |
| AC6 | Existing tests (check-mfc1, check-mfc2, check-ougl) continue to pass | — | — | — | — | Regression gate | 🟢 |
| NFR-A11Y | Keyboard up/down arrow reorder when card has focus | 2 tests | — | — | 1 scenario | Partial | 🟡 |
| NFR-PERF | Drag events do not cause frame drops on 30-card map | — | — | — | 1 scenario | Manual | 🟡 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Node.js | Handling |
|-----|----|----------|------------------------------|---------|
| Real DnD interaction across browser viewport | AC2, AC3 | DOM-behaviour | HTML5 DnD not supported in JSDOM | Logic tested via direct event dispatch on mock DOM; full interaction is manual smoke test 🟡 |
| Screen reader announcement of epic rename tooltip | AC4 | AT behaviour | Requires real AT | axe-core validates role="alert" rule; real announcement is manual 🟡 |
| Keyboard reorder actual focus movement | NFR-A11Y | DOM-behaviour | JSDOM does not fire real keyboard events via dispatchEvent for DnD | Key-handler function tested directly; real focus behaviour is manual 🟡 |
| Frame-rate measurement | NFR-PERF | Runtime perf | Cannot measure rAF timing in JSDOM | Manual scenario on 30-card fixture 🟡 |

---

## Test Data Strategy

**Source:** Synthetic — crafted HTML fixtures and mock session state objects.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Story map HTML fixture with model-emitted story entries | Synthetic | None | cardId → {origin: 'model'} in session.canvasCards |
| AC2 | Story map HTML fixture with 3 cards in one epic column; drag event sequence (dragstart, dragover, drop) | Synthetic | None | pendingReorder schema: {cardId, epicId, phaseId, newIndex} |
| AC3 | Story map fixture with 2 epic columns; drag event sequence crossing columns | Synthetic | None | |
| AC4 | Story map HTML fixture with epic label element | Synthetic | None | |
| AC5 | session.canvasCards fixture with mixed model/operator origins; renderDefinitionMap call | Synthetic | None | |
| NFR-A11Y | Key event (ArrowUp / ArrowDown) dispatched on focused card | Synthetic | None | |

### PCI / sensitivity constraints

None.

---

## Unit Tests

### renderDefinitionMap applies data-origin="model" to model-emitted story card

- **Verifies:** AC1
- **Precondition:** `renderDefinitionMap(stories, canvasCards)` is callable; `canvasCards` maps a storyId to `{ origin: 'model' }`
- **Action:** Call with a single story whose storyId is in `canvasCards` with `origin: 'model'`
- **Expected result:** The returned HTML contains `data-origin="model"` on the story card element
- **Edge case:** No

### renderDefinitionMap applies card--inherited class to model-emitted card

- **Verifies:** AC1
- **Precondition:** Same as above
- **Action:** Same call
- **Expected result:** The returned HTML contains `class="story-card card--inherited"` on the card; also contains a `model` tag in the card header (element with text "model" or class "card-tag--model")
- **Edge case:** No

### renderDefinitionMap applies data-origin="operator" and card--new to operator-added card

- **Verifies:** AC1 (contrast case — operator-origin card gets card--new)
- **Precondition:** `canvasCards` maps a storyId to `{ origin: 'operator' }`
- **Action:** Call with that story
- **Expected result:** HTML contains `data-origin="operator"` and `class="story-card card--new"` and a `new` tag in the card header
- **Edge case:** No

### within-column drop handler updates DOM order

- **Verifies:** AC2
- **Precondition:** Story map DOM fixture with 3 cards in one epic column; drag handler attached
- **Action:** Dispatch `dragstart` on card-2, then `dragover` on card-3's cell, then `drop` on that cell
- **Expected result:** After drop, card-2 appears after card-3 in the DOM (their order has swapped)
- **Edge case:** No

### within-column drop handler records pendingReorder entry

- **Verifies:** AC2
- **Precondition:** Same as above; `session.canvasCards.pendingReorder` is initially empty
- **Action:** Same drag sequence
- **Expected result:** `session.canvasCards.pendingReorder` has one entry with `{ cardId: card2Id, epicId, phaseId, newIndex: 2 }` (or equivalent new position)
- **Edge case:** No

### cross-column dragover does not fire preventDefault

- **Verifies:** AC3
- **Precondition:** Story map fixture with 2 epic columns; card from column A being dragged; dragover handler on column B cell
- **Action:** Dispatch `dragover` on a cell in column B while card from column A is in flight (simulated via `dataTransfer.getData` returning column A's epicId)
- **Expected result:** The dragover handler does NOT call `event.preventDefault()` (assert via a mock event object that tracks `preventDefault` calls)
- **Edge case:** No

### cross-column drop produces no state change

- **Verifies:** AC3
- **Precondition:** Same setup
- **Action:** Attempt to drop card from column A onto column B cell
- **Expected result:** `session.canvasCards.pendingReorder` remains empty; no DOM change
- **Edge case:** No

### epic label click shows tooltip with correct message

- **Verifies:** AC4
- **Precondition:** Story map DOM with an epic column label element; click handler attached
- **Action:** Dispatch `click` event on the epic label element
- **Expected result:** A tooltip element appears in the DOM containing the text "Epic names are set by the Definition skill — return to the chat to rename"; no `<input>` or `contenteditable` attribute is added to the DOM
- **Edge case:** No

### epic label click does not add edit field

- **Verifies:** AC4
- **Precondition:** Same as above
- **Action:** Same click dispatch
- **Expected result:** No element with `contenteditable="true"` or `type="text"` input appears in or adjacent to the epic header
- **Edge case:** No

### epic rename tooltip auto-dismisses after 3 seconds

- **Verifies:** AC4
- **Precondition:** Tooltip is visible; use fake timers (sinon or jest fake timers)
- **Action:** Advance fake timer by 3000ms
- **Expected result:** The tooltip element is no longer in the DOM (or has `display: none`)
- **Edge case:** No

### map refresh re-applies model origin to model-emitted stories

- **Verifies:** AC5
- **Precondition:** `session.canvasCards` has entries with `origin: 'model'` for existing stories; `renderDefinitionMap` is called again with the same canvasCards after a refresh
- **Action:** Call `renderDefinitionMap` a second time with the same canvasCards
- **Expected result:** The re-rendered cards still have `data-origin="model"` and `class="card--inherited"` — origin distinction is preserved
- **Edge case:** No

### map refresh preserves operator origin for operator-added stories

- **Verifies:** AC5
- **Precondition:** `session.canvasCards` has one entry with `origin: 'operator'`
- **Action:** Same refresh call
- **Expected result:** The operator-added card still has `data-origin="operator"` and `class="card--new"`
- **Edge case:** No

### ArrowUp key on focused card moves it one position up in column

- **Verifies:** NFR-A11Y (keyboard reorder)
- **Precondition:** Story map DOM with 3 cards in a column; keyboard handler attached; card-2 is focused
- **Action:** Dispatch `keydown` with `key: 'ArrowUp'` on card-2
- **Expected result:** card-2 moves to position 1 in the column; `session.canvasCards.pendingReorder` records the change
- **Edge case:** No

### ArrowDown key on focused card moves it one position down in column

- **Verifies:** NFR-A11Y (keyboard reorder)
- **Precondition:** card-2 is focused
- **Action:** Dispatch `keydown` with `key: 'ArrowDown'` on card-2
- **Expected result:** card-2 moves to position 3; `session.canvasCards.pendingReorder` records the change
- **Edge case:** No

---

## NFR Tests

### axe-core scan on story card (inherited) passes WCAG AA

- **NFR addressed:** Accessibility
- **Measurement method:** Build an inherited card HTML string; run `axe.run` in JSDOM; assert zero violations; assert dashed border is accompanied by a visible text label ("model" tag)
- **Pass threshold:** Zero axe violations at AA level

### axe-core scan on epic rename tooltip passes WCAG AA

- **NFR addressed:** Accessibility
- **Measurement method:** Render the tooltip with `role="alert"`; run `axe.run`; assert zero violations
- **Pass threshold:** Zero axe violations at AA level

---

## Out of Scope for This Test Plan

- Phase row locking — dic.2
- Add-story flow — dic.3
- Touch interaction — dic.4
- Canvas-edit dispatch — dic.5

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real DnD across viewport | JSDOM does not fire HTML5 DnD | Manual smoke test on rendered story map with 4 epics × 6 stories |
| Real screen reader announcement of tooltip | Requires AT | axe-core validates role="alert"; real announcement is manual verification step |
| Frame-rate on 30-card map | Cannot measure rAF in JSDOM | Manual: load fixture with 4 epics × 8 stories; monitor Chrome DevTools Performance tab during drag |
