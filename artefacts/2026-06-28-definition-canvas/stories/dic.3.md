# Story: Add-story canvas flow

**Epic reference:** artefacts/2026-06-28-definition-canvas/discovery.md
**Discovery reference:** artefacts/2026-06-28-definition-canvas/discovery.md
**Benefit-metric reference:** artefacts/2026-06-28-definition-canvas/benefit-metric.md

## User Story

As a **platform operator (primary)**,
I want to add a new story directly on the canvas by clicking a `+` affordance in an empty current-phase cell, entering a title inline, and seeing it immediately appear as a "new" card in the pending changes set,
So that I can extend the definition output without re-entering the chat, and the added story is visually distinguishable from model-emitted stories.

## Benefit Linkage

**Metrics moved:** MM1 (definition re-instruction turns reduced) — this story removes the most common class of add-story re-instruction ("add a story for X"). M2 (future-phase placement guard) — the add affordance must not appear in locked rows, and the server-side guard (dic.5) must reject a POST that targets a non-current phase row.
**How:** The `+` affordance replaces the chat re-instruction turn for the add-story action. An operator who types "add a story for the audit trail" as a chat instruction costs one model turn plus the full artefact re-emit. Adding directly on the canvas costs zero turns and one "Apply changes" batch (shared with any pending reorders). The cumulative effect across a definition session is the primary driver of MM1.

## Architecture Constraints

- The `+` affordance is a `<button class="add-story-btn" aria-label="Add story to [epic name]">+</button>` rendered in each empty cell of the current-phase row only. Locked future-phase rows have no `+` affordance.
- Clicking `+` replaces the button with an inline `<input type="text" class="add-story-input" placeholder="Story title…">`. On `Enter` or `blur` with non-empty value, the input is replaced by a new story card with `data-origin="operator"` and `class="card--new"`. On `Escape` or `blur` with empty value, the input is dismissed and the `+` button restored.
- The new card is added to `session.canvasCards` with `origin: 'operator'` and a generated `cardId` (UUID or timestamp-prefixed). It is also added to `session.canvasCards.pendingAdds` as `{cardId, epicId, phaseId, title}`.
- The pending-changes count on the "Apply changes" button increments by 1 per add. The button label format: `Apply changes (N pending)` where N is `pendingReorder.length + pendingAdds.length`.
- No new JS file. All logic is embedded in the existing inline script block in `skills.js`. The `+` button event listeners are wired in the same `initCanvasInteractivity()` init block as dic.1's drag listeners.

## Dependencies

- **Upstream:** dic.1 (canvas shell and `session.canvasCards` structure). dic.2 (phase row locking — add affordance must not appear in locked rows; phase row awareness required to render `+` only in current-phase cells).
- **Downstream:** dic.4 (touch) — the tap-to-add interaction uses the same `+` affordance; dic.4 must not break the add flow. dic.5 (canvas-edit dispatch) — `pendingAdds` is consumed by the dispatch handler to produce `addStory` definition actions.

## Acceptance Criteria

**AC1:** Given the story map is rendered with a current-phase row, when the operator views an empty cell in that row, then a `+` button (`<button class="add-story-btn" aria-label="Add story to [epic name]">+</button>`) is visible. Locked future-phase cells have no `+` button.

**AC2:** Given the operator clicks the `+` button in a current-phase cell, when the click fires, then: (a) the `+` button is replaced by an inline text input (`<input type="text" class="add-story-input" placeholder="Story title…">`); (b) the input receives focus immediately.

**AC3:** Given the inline input is focused, when the operator types a title and presses Enter, then: (a) the input is replaced by a new story card with `data-origin="operator"` and `class="story-card card--new"`; (b) the card displays a `new` tag in the header; (c) the card has a solid border (card--new style); (d) the pending-changes count increments; (e) the card is added to `session.canvasCards.pendingAdds`; (f) the card is draggable within the current-phase row of its epic column (dic.1 drag behaviour applies immediately to new cards).

**AC4:** Given the inline input is focused, when the operator presses Escape or blurs the input with an empty value, then the input is dismissed and the `+` button is restored in the cell. No state change occurs; no pending change is recorded.

**AC5:** Given a new operator-added card exists (from AC3), when the story map is refreshed by a new artefact draftChunk from the model (map re-initialisation per dic.2 AC6), then the operator-added card is NOT preserved in the refreshed map (the refresh replaces the map with the model's authoritative artefact; any unapplied pending adds are cleared). The pending-changes count resets to 0.

**AC6:** Given the operator has added a story on the canvas and the pending-changes set contains the add, when the operator clicks "Apply changes", then: (a) the add is included in the batch dispatched to dic.5's endpoint; (b) after the round-trip, the refreshed map shows the newly-added story as a model-emitted story (origin transitions from `operator` to `model` once it is in the written artefact). The `new` tag is no longer shown on the refreshed card.

**AC7:** Given the `+` button, when activated via keyboard (Tab to focus, Space or Enter to activate), then the inline input appears and the operator can complete the add flow without using a mouse. The add flow is fully keyboard-navigable.

## Out of Scope

- Multi-line story descriptions entered on the canvas — the add-story input captures title only; description is added via chat or the Apply/rewrite cycle
- Operator editing an existing story's title directly on the canvas — card titles are read-only on the canvas in the MVP; edits go through chat
- Undo for an add that has not yet been applied — Escape before submit and the pending-changes clear on map refresh are the discard paths; there is no explicit undo button in dic.3

## NFRs

- **Accessibility:** The `+` button must be reachable and activatable via keyboard. The inline input must trap focus until dismissed (no tab-away without submit or cancel). The new card's `new` tag must be announced to screen readers (aria-label or visible text).
- **Performance:** Card addition is local DOM mutation only — no server call until "Apply changes". Pending-changes count update must be synchronous with the DOM mutation.
- **Regression:** All dic.1 and dic.2 tests continue to pass.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
**Rationale:** The inline add flow is a well-understood pattern (click-to-edit). The main risk is interaction with dic.1's drag event setup — new cards must become draggable immediately without re-running the full init block. Requires reading how `initCanvasInteractivity()` attaches listeners (event delegation vs per-card attachment) before implementing.
