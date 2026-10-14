# DoR Contract: jcx-s7

**Story:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s7.md
**Test plan:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s7-test-plan.md

## Touch-point inventory

Repo-wide grep (`grep -rn "sw-stage-panel-saved\|sw-stage-edit\|sw-cx-grid-row\|window.location.reload" src/web-ui/`) confirms every touched pattern exists ONLY in `src/web-ui/routes/journeys.js`:
- `sw-stage-panel-saved` (the save-indicator span/class) — 1 render site
- `sw-stage-edit` (the existing small edit link) — 3 render sites, all inside `journeys.js` (drawflow canvas node, swimlane grid header cell, Delivery per-stage card)
- `sw-cx-grid-row*` (the swimlane grid's own row/cell classes, `jcx-s6`) — all inside `journeys.js`
- `window.location.reload()` on the stage-add success path — 1 call site, `journeys.js`'s own `addBtn` click handler

No other file in `src/` renders or references any of these — the contract's single-file touch-point list is complete, per `web-ui-patterns.md`'s own "inventory every render site" standard.

## Files touched

- `src/web-ui/routes/journeys.js` (only file touched):
  - **AC1:** the stage-panel save handler's `.then`/`.catch` (currently one shared `panelSaved` element/class for both outcomes) — add a `Saving…` state on request start, give the error branch its own distinct class (reusing this page's own `sw-stage-reorder-error`/`sw-feature-mapping-warning` danger-color convention), and track a per-indicator save-sequence token so a stale success-clear timeout from an earlier save can never hide a later save's state (closes review 1-M1).
  - **AC2:** the `addBtn` click handler's success path — replace `window.location.reload()` with a DOM patch using the POST response's own `{id, name, position}` fields; no change to the response shape itself (`handlePostJourneyStage` is untouched).
  - **AC3:** the swimlane grid header cell markup (and the equivalent drawflow node markup) — add a click listener on the cell/node itself (not only the existing `.sw-stage-edit` link) that calls the same `openPanel(stageId)` the link already calls; verify (via AC3b) that a click on the link itself still produces exactly one open, not a double-fire (closes review 1-M2).
  - **AC4:** the swimlane grid's cell-rendering helpers (`buildTextCellsRow`, the stage-name header rendering) — add a muted-treatment class/em-dash for empty values, conditioned on the field actually being empty after `.trim()` (matching this codebase's own existing emptiness convention).
  - **AC5:** the inline `<style>` block's `.sw-cx-grid-row`/`.sw-cx-grid-row-cells` rules — change `padding:10px 0` to `padding:8px 0` and `column-gap:12px` to `column-gap:8px` (or `16px`); no change to `grid-template-columns`/`minmax(200px,1fr)`.

- `tests/check-jcx-s7-panel-feedback-and-polish.js` (new): unit tests for AC1a/b/c, AC2, AC3a/b, AC4, AC5.
- `tests/e2e/jcx-s7-panel-entry-and-save-feedback.spec.js` (new): E2E test for AC3's visual/size portion.

## No files out of scope are touched

`handlePostJourneyStage`, `handlePatchJourneyStage`, `handleGetJourneyCanvas`'s own query, the Delivery tab's own render branch, the Canvas/drawflow initialization logic, and `jcx-s6`'s own grid column/row structure are all unchanged — confirmed against the story's own Architecture Constraints and Out of Scope sections.
