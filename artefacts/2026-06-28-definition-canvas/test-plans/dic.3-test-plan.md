## Test Plan: Add-story canvas flow

**Story reference:** artefacts/2026-06-28-definition-canvas/stories/dic.3.md
**Discovery reference:** artefacts/2026-06-28-definition-canvas/discovery.md
**Test plan author:** Copilot
**Date:** 2026-06-28

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | + button present in current-phase empty cells; absent in locked rows | 2 tests | — | — | — | — | 🟢 |
| AC2 | Click + → inline input appears with focus | 2 tests | — | — | — | — | 🟢 |
| AC3 | Enter with title → card--new card in DOM; origin operator; pendingAdds entry; count++ | 6 tests | — | — | — | — | 🟢 |
| AC4 | Escape / empty blur → dismisses input, restores + button, no state change | 2 tests | — | — | — | — | 🟢 |
| AC5 | Map refresh clears unapplied operator adds | 2 tests | — | — | — | — | 🟢 |
| AC6 | Apply batch → added story transitions origin to model on refresh | 1 test | 1 test | — | — | — | 🟢 |
| AC7 | + button and add flow keyboard-accessible | 2 tests | — | — | 1 scenario | Partial | 🟡 |
| NFR-A11Y | Focus trap until submit/cancel; new tag announced | 2 tests | — | — | 1 scenario | Partial | 🟡 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Node.js | Handling |
|-----|----|----------|------------------------------|---------|
| Real screen reader announcement of "new" tag | NFR-A11Y | AT behaviour | Requires real AT | axe-core validates label/role rule; real announcement manual 🟡 |
| AC3(f) — new card draggable without re-running init (event delegation dependency) | AC3 | DOM-behaviour | Depends on delegation vs per-card attachment; JSDOM drag simulation limited | Unit test asserts card gets draggable="true"; full drag test is manual smoke test 🟡 |
| Focus trap behaviour on Tab keypress in inline input | NFR-A11Y | Browser focus behaviour | JSDOM focus model incomplete | Manual: Tab inside add-story input; verify focus stays in input until submit/cancel 🟡 |

---

## Test Data Strategy

**Source:** Synthetic — crafted story map HTML fixtures; mock session state.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Story map with current-phase empty cell and locked row cell | Synthetic | None | |
| AC2 | Story map with + button rendered | Synthetic | None | |
| AC3 | Typed title string; Enter keydown event | Synthetic | None | pendingAdds schema: {cardId, epicId, phaseId, title} |
| AC4 | Typed text then Escape; empty input then blur | Synthetic | None | |
| AC5 | session.canvasCards.pendingAdds with 2 entries; re-init trigger | Synthetic | None | |
| AC6 | Batch apply response fixture with updated artefact | Synthetic | None | |
| AC7 | Tab, Space/Enter keyboard events | Synthetic | None | |

### PCI / sensitivity constraints

None.

---

## Unit Tests

### renderDefinitionMap renders + button in current-phase empty cells

- **Verifies:** AC1
- **Precondition:** `renderDefinitionMap(stories, canvasCards, phaseModel)` where one epic column has an empty cell in the current-phase row
- **Action:** Call and inspect output HTML
- **Expected result:** A `<button class="add-story-btn" aria-label="Add story to [epic name]">+</button>` is present in the empty current-phase cell
- **Edge case:** No

### renderDefinitionMap does not render + button in locked rows

- **Verifies:** AC1
- **Precondition:** Same; locked phase rows also have empty cells
- **Action:** Inspect locked row cells in output HTML
- **Expected result:** No `<button class="add-story-btn">` in any locked row cell
- **Edge case:** No

### clicking + button replaces it with inline text input

- **Verifies:** AC2
- **Precondition:** Story map DOM with rendered + button; click handler attached
- **Action:** Dispatch `click` on the + button
- **Expected result:** The + button is no longer in the DOM; an `<input type="text" class="add-story-input" placeholder="Story title…">` is present in its place
- **Edge case:** No

### inline input receives focus immediately on click

- **Verifies:** AC2
- **Precondition:** Same
- **Action:** Same click; inspect `document.activeElement`
- **Expected result:** `document.activeElement === addStoryInput` immediately after the click handler runs
- **Edge case:** No

### Enter with title creates card--new element in DOM

- **Verifies:** AC3
- **Precondition:** Inline input is active; user has typed "New audit story"
- **Action:** Dispatch `keydown` with `key: 'Enter'` on the input
- **Expected result:** An element with `class="story-card card--new"` and `data-origin="operator"` is present in the cell
- **Edge case:** No

### new card has "new" tag in header

- **Verifies:** AC3
- **Precondition:** Same
- **Action:** Same Enter dispatch
- **Expected result:** The new card's HTML contains a tag element with text "new" or class "card-tag--new"
- **Edge case:** No

### new card has solid border (card--new class applied)

- **Verifies:** AC3 (solid border distinguishes from card--inherited)
- **Precondition:** Same
- **Action:** Inspect card class list
- **Expected result:** `card--new` is in the class list; `card--inherited` is NOT in the class list
- **Edge case:** No

### pending-changes count increments after add

- **Verifies:** AC3
- **Precondition:** `session.canvasCards.pendingAdds` initially empty; pending-count display is 0
- **Action:** Enter submit
- **Expected result:** `pendingAdds.length` is 1; the "Apply changes" button label shows "Apply changes (1 pending)"
- **Edge case:** No

### pendingAdds entry has correct schema

- **Verifies:** AC3
- **Precondition:** Same
- **Action:** Same Enter dispatch with title "New audit story"
- **Expected result:** `pendingAdds[0]` has fields `{ cardId: <non-empty string>, epicId: <correct epic id>, phaseId: <current phase id>, title: 'New audit story' }` — no missing or extra fields
- **Edge case:** No

### new card has draggable="true" attribute

- **Verifies:** AC3(f) — immediately draggable
- **Precondition:** Same
- **Action:** Inspect new card element attributes
- **Expected result:** `draggable` attribute is `"true"` on the new card element
- **Edge case:** No

### Escape dismisses input and restores + button

- **Verifies:** AC4
- **Precondition:** Inline input is active; user has typed some text
- **Action:** Dispatch `keydown` with `key: 'Escape'`
- **Expected result:** Input is removed; + button is restored in the cell; `session.canvasCards.pendingAdds` is unchanged (still empty)
- **Edge case:** No

### blur with empty value dismisses input and restores + button

- **Verifies:** AC4
- **Precondition:** Inline input is active; value is empty string
- **Action:** Dispatch `blur` on the input
- **Expected result:** Input is removed; + button is restored; no pending add recorded
- **Edge case:** No

### map re-init clears pendingAdds

- **Verifies:** AC5
- **Precondition:** `session.canvasCards.pendingAdds` has 2 entries
- **Action:** Trigger map re-initialisation (simulating artefact draftChunk refresh)
- **Expected result:** `pendingAdds` is empty after re-init; pending-changes count is 0
- **Edge case:** No

### re-initialised map does not show prior operator-added cards

- **Verifies:** AC5
- **Precondition:** An operator-added card is in the DOM; re-init is triggered
- **Action:** Re-init call
- **Expected result:** The operator-added card is no longer in the DOM (map is fully replaced from artefact)
- **Edge case:** No

### after apply-and-refresh, added story appears as model-emitted card

- **Verifies:** AC6
- **Precondition:** An operator-added story was applied; the server responded with a rewritten artefact containing the new story as a model-emitted entry; `canvasCards` is updated with `origin: 'model'` for the new story
- **Action:** Call `renderDefinitionMap` with the updated canvasCards
- **Expected result:** The previously-added story's card now has `data-origin="model"` and `class="card--inherited"`; the "new" tag is no longer shown
- **Edge case:** No

### + button activatable via keyboard (Space)

- **Verifies:** AC7
- **Precondition:** + button has focus (tab-reached); Space keydown dispatched
- **Action:** Dispatch `keydown` `key: ' '` on the + button
- **Expected result:** Inline input appears (same as AC2 click result)
- **Edge case:** No

### + button activatable via keyboard (Enter)

- **Verifies:** AC7
- **Precondition:** + button has focus; Enter keydown dispatched
- **Action:** Dispatch `keydown` `key: 'Enter'` on the + button
- **Expected result:** Inline input appears
- **Edge case:** No

---

## NFR Tests

### add-story input HTML-escapes title before inserting card

- **NFR addressed:** Security (XSS guard on operator-entered content)
- **Precondition:** Input value contains `<script>alert(1)</script>`
- **Action:** Submit with Enter
- **Expected result:** Card HTML contains `&lt;script&gt;` — literal script tag is not injected into the DOM
- **Pass threshold:** No unescaped `<script>` in rendered card HTML

### axe-core scan on new card passes WCAG AA

- **NFR addressed:** Accessibility
- **Measurement method:** Build a card--new HTML string with all fields populated; run `axe.run`; assert zero violations; assert "new" tag has visible text or aria-label
- **Pass threshold:** Zero axe violations at AA level

---

## Out of Scope for This Test Plan

- Touch tap on + button — covered by dic.4 (uses existing click handler)
- Apply-changes batch dispatch — covered by dic.5
- Phase row locking — covered by dic.2

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| New card draggable without re-running init | Delegation vs per-card ambiguity | Unit test asserts draggable="true"; manual smoke test: add card, immediately drag it to a new position |
| Focus trap on Tab in inline input | JSDOM focus model | Manual: Tab inside the add input; confirm focus stays until Enter or Escape |
| Real screen reader announcement of "new" tag | Requires AT | axe-core validates; real announcement is manual verification step |
