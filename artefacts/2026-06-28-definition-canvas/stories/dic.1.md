# Story: Interactive story cards with inherited/new styling and epic rename guard

**Epic reference:** artefacts/2026-06-28-definition-canvas/discovery.md
**Discovery reference:** artefacts/2026-06-28-definition-canvas/discovery.md
**Benefit-metric reference:** artefacts/2026-06-28-definition-canvas/benefit-metric.md

## User Story

As a **platform operator (primary)**,
I want to drag story cards within their epic column to resequence them, and see clearly which stories were model-generated versus which I added myself,
So that I can organise the definition output spatially without re-entering the chat, and so that the distinction between model-reasoned and operator-added structure remains visible across session reloads.

## Benefit Linkage

**Metrics moved:** MM1 (definition re-instruction turns reduced) and M2 (future-phase guard — this story establishes the drop-target validation logic that dic.2 extends to phase rows).
**How:** The drag-and-drop interaction within an epic column directly replaces chat re-instruction turns ("move story X before story Y"). The inherited/new styling preserves editorial context across session reloads. dic.1 is the foundational story in this feature — it establishes the interactive shell, card styling, and drop validation pattern that all subsequent stories build on.

## Architecture Constraints

- All client-side JavaScript is embedded as string literals in `src/web-ui/routes/skills.js` (the existing `_renderChatPage` script block) and/or `src/web-ui/views/chat-view.js`. No new JS file introduced.
- The story map DOM is rendered server-side by `renderDefinitionMap()` in `src/web-ui/routes/skills.js`. The interactive layer adds drag-event listeners on top of the existing rendered structure via a JS init block — it does not replace the SSR structure.
- `draggable="true"` on story card elements. `dragstart` / `dragover` / `drop` event handlers scoped to within-column reorder only. Cross-column drops are ignored (no drop accepted on a card from a different epic column).
- Inherited vs. new card origin is tracked in session state (`session.canvasCards`: map of cardId → `{storyId, origin: 'model'|'operator'}`). When the story map is rendered, model-emitted stories get `data-origin="model"` attributes; operator-added stories (dic.3) get `data-origin="operator"`. CSS classes `card--inherited` (dashed border) and `card--new` (solid border, distinct tag) are applied from this attribute.
- Epic rename guard: clicking an epic column label opens no edit field. The label element has `pointer-events: auto` but any edit attempt triggers an inline tooltip/message. No `contenteditable` or `<input>` is rendered on the epic header.

## Dependencies

- **Upstream:** None — dic.1 is the foundational story for this feature. Requires that `renderDefinitionMap()` exists and produces the epics × stories DOM structure (it does — confirmed in Phase 1).
- **Downstream:** dic.2 (phase row model) extends the drop-validation logic introduced here. dic.3 (add-story) adds cards to the same canvas. dic.4 (touch) adds a parallel interaction path for the same reorder operation. dic.5 (canvas-edit dispatch) consumes the reorder state accumulated here via `session.canvasCards`.

## Acceptance Criteria

**AC1:** Given the story map is visible for a `/definition` session, when model-emitted stories are rendered, then each story card carries a `data-origin="model"` attribute and displays with inherited styling: dashed border, a `model` tag in the card header. The styling is applied via CSS class `card--inherited` on the card element.

**AC2:** Given a story card has `data-origin="model"` or `data-origin="operator"`, when the operator drags the card within its epic column (same column, same phase row), then the card drops at the target position, the display order updates immediately without a page reload, and the new order is reflected in the pending changes set (`session.canvasCards.pendingReorder`).

**AC3:** Given the operator drags a story card and holds it over a cell in a different epic column, when `dragover` fires on that cell, then the drop is rejected — `event.preventDefault()` is not called, the card cannot be dropped, and it snaps back to its origin on `dragend`. No state change occurs and no pending change is recorded.

**AC4:** Given the operator clicks or attempts to edit an epic column label directly, when the interaction fires, then no inline edit field opens, and an inline tooltip or message appears stating "Epic names are set by the Definition skill — return to the chat to rename." The tooltip auto-dismisses after 3 seconds or on the next user interaction.

**AC5:** Given the story map is rendered after a session reload (or after the model emits a new artefact draftChunk), when the map is re-initialised, then model-emitted stories continue to display as inherited and operator-added stories (if any, from dic.3) continue to display as new — the origin distinction survives a map refresh from artefact content.

**AC6:** Given the existing `renderDefinitionMap()` static rendering was passing all existing tests (check-mfc1, check-mfc2, check-ougl tests) before this story, when dic.1 is implemented, then all previously-passing tests continue to pass — no regression in static definition map rendering.

## Out of Scope

- Phase row locking (drag rejected into future-phase rows) — dic.2
- Touch tap-to-select / tap-to-place — dic.4
- Operator add-story canvas flow — dic.3
- Canvas-edit dispatch to definition skill — dic.5
- Cross-column drag (epic reassignment) — explicit out-of-scope for MVP per discovery.md
- Drag between phase rows within the same epic (moving a story from current phase to another) — dic.2 handles this constraint once phase rows exist; in dic.1 there is only a single phase row

## NFRs

- **Accessibility:** Drag-and-drop must be supplemented by a keyboard-accessible reorder mechanism (up/down arrow keys when a card has focus) — WCAG 2.1 AA. The epic rename tooltip/message must be announced to screen readers (role="alert" or aria-live="polite").
- **Performance:** Drag events must not cause observable frame-rate drops on a story map with up to 30 story cards across 4 epic columns. No DOM thrashing on dragover — use `requestAnimationFrame` or debounce if needed.
- **Regression:** All existing tests passing before this story must continue to pass after it.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
**Rationale:** The drag-and-drop implementation is well-understood (HTML5 DnD API). The inherited/new styling is straightforward CSS + data-attribute pattern. The main unknown is whether the existing `renderDefinitionMap()` DOM structure lends itself to adding drag listeners cleanly, or whether refactoring the DOM output is needed — requires reading the current implementation carefully before writing code.
