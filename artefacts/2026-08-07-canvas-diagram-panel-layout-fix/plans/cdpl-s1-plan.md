# Implementation Plan: cdpl-s1 — Stop the artefact panel squeezing the diagram panel, and fix the dead "maximise canvas" button

**Story reference:** artefacts/2026-08-07-canvas-diagram-panel-layout-fix/stories/cdpl-s1-fix-canvas-panel-squeeze-and-maximise.md
**DoR reference:** artefacts/2026-08-07-canvas-diagram-panel-layout-fix/dor/cdpl-s1-dor.md
**Contract reference:** artefacts/2026-08-07-canvas-diagram-panel-layout-fix/dor/cdpl-s1-dor-contract.md
**Test plan reference:** artefacts/2026-08-07-canvas-diagram-panel-layout-fix/test-plans/cdpl-s1-test-plan.md

---

## Scope

Single file, plus tests: `src/web-ui/views/chat-view.js`.
New unit test file: `tests/check-cdpl-s1-canvas-panel-layout-fix.js`.
Extend existing E2E spec: `tests/e2e/design-definition-canvas-render.spec.js`.

No other file should need to change (per DoR Coding Agent Instructions).

## Root cause recap

1. `#artefact-panel` (non-ideate/`sw-artefact-pane` variant, line ~417) is `flex:0 1 auto` with no `max-height` — a long draft consumes the pane, squeezing `#canvas-panel` below it.
2. `#canvas-panel` in that same variant (line ~437) is `flex:1 1 auto` with no `min-height` floor.
3. No maximise control exists for that `#canvas-panel` (the ideate variant's canvas panel has one, but it's wired to `swExpandCanvas()`, which is referenced (line ~402 `onclick="swExpandCanvas()"`) but never defined anywhere in the file.
4. The only existing working fullscreen mechanism is `swToggleArtefactFs()` (in `scriptHtml`, ~line 150) + the `.ad-fs` CSS class (~line 275, scoped to `#sw-artefact-pane.ad-fs`).

## Task breakdown (TDD order)

### Task 1 — Write failing unit tests (RED)
Create `tests/check-cdpl-s1-canvas-panel-layout-fix.js` following `tests/check-inc4-canvas-panel.js`'s pattern (plain Node script, `ok()`/`eq()` helpers, calls `renderChat()` directly, no server). 5 tests, matching the test plan's Unit Tests section exactly:

1. `renderChat_designSkill_artefactPanelHasMaxHeightStyle` (AC1) — call `renderChat({skillName:'design', ...})`, assert `id="artefact-panel"`'s inline `style` attribute contains `max-height`.
2. `renderChat_designSkill_canvasPanelHasMinHeightDeclaration` (AC2) — same render, assert the design-variant `id="canvas-panel"`'s inline `style` contains `min-height` alongside `flex:1 1 auto`.
3. `renderChat_designSkill_diagramsHeaderHasMaximiseButton` (AC3) — assert a new button exists in the "Diagrams" header using the same `.ad-fs`-style class/toggle convention (not a newly invented class name) — reuses `ad-fs-btn` class, has an `onclick` calling a toggle function.
4. `swExpandCanvas_functionIsDefined_inRenderedScript` (AC4) — call `renderChat({skillName:'ideate', ...})`, assert the returned script text contains `function swExpandCanvas(`. This test fails against unmodified code today — confirms the dead-button defect before the fix.
5. `toggleMechanism_isSharedNotDuplicated_betweenArtefactAndCanvasMaximise` (Architecture Constraint) — inspect all three toggle function bodies (`swToggleArtefactFs`, the new canvas-maximise function, `swExpandCanvas`) and assert they all follow the identical `classList.toggle(<fs-class>)` + button-glyph-swap shape — no independently reinvented fullscreen logic.

Run the new file — confirm RED (at minimum tests 1, 2, 3, 4 fail against current code; test 5 may fail trivially since the function doesn't exist yet).

### Task 2 — Implement the CSS/markup fix in `chat-view.js` (GREEN for unit tests)

- Add `.canvas-fs` CSS class mirroring `.ad-fs`'s rule (scoped appropriately — likely `#canvas-panel.canvas-fs` or applied to the containing `sw-artefact-pane`/ideate section, matching whichever element the `.ad-fs` pattern currently fullscreens). Re-use `position:fixed;top:0;left:0;right:0;bottom:0;z-index:999;border-radius:0;max-height:100vh` — the exact `.ad-fs` declaration shape, new class name only.
- Add `swToggleCanvasFs()` to `scriptHtml`, mirroring `swToggleArtefactFs()`'s body exactly (classList.toggle + button glyph swap), targeting the canvas panel's container and a new button id.
- Add `swExpandCanvas()` to `scriptHtml` as a thin alias/wrapper calling `swToggleCanvasFs()` (per the DoR contract's stated assumption) — so the pre-existing `onclick="swExpandCanvas()"` button in the ideate layout starts working through the same shared mechanism.
- In the non-ideate (`sw-artefact-pane`) variant's markup:
  - `#artefact-panel` inline style: add `max-height:55vh` (or equivalent) alongside existing `flex:0 1 auto;overflow-y:auto`.
  - `#canvas-panel` inline style: add `min-height:200px` alongside existing `flex:1 1 auto;overflow-y:auto`.
  - Add a new maximise button to the "Diagrams" `cv-section-head`, using the same `ad-fs-btn` class and `⊞`/title/aria-label convention as `sw-artefact-fs-btn`, wired to `swToggleCanvasFs()`.
- Do NOT touch the ideate 3-panel layout's base flex proportions — only wire its existing `sw-expand-canvas` button's `onclick="swExpandCanvas()"` to something that now works (it already calls `swExpandCanvas()`; Task 2 only needs to define that function).

Run the new unit test file — confirm GREEN (all 5 pass). Run full `npm test` to confirm no regressions in dependent suites (`check-inc4-canvas-panel.js` in particular, since it renders `chat-view.js` output and asserts specific fragments).

### Task 3 — Write the 3 new E2E tests (RED against real browser, then GREEN)

Extend `tests/e2e/design-definition-canvas-render.spec.js` — do not duplicate `driveJourneyToStage`/`useIsolatedTenant`/`submitTurnViaRealChatUiAndWaitForStreamToFinish`; call the existing functions already defined in that file.

1. `canvasPanel_realBrowserRender_hasComputedMinHeight` (AC2) — drive to `/design` chat page via `driveJourneyToStage` + `useIsolatedTenant`, submit a turn via the real chat UI, then assert `#canvas-panel`'s `getBoundingClientRect().height` computed in-browser is >= the min-height floor (200px).
2. `maximiseCanvasButton_realClick_expandsAndRestores` (AC3) — same journey drive, click the new Diagrams-header maximise button, assert the panel/container occupies full viewport (position fixed, covers viewport), click again, assert it returns to normal layout.
3. `ideateExpandCanvasButton_realClick_nowWorksInsteadOfThrowing` (AC4) — drive an `/ideate` journey (reuse `driveJourneyToStage`/`useIsolatedTenant` with `'ideate'` as an additional target-stage case, or construct an equivalent minimal ideate session flow), listen for uncaught page errors via `page.on('pageerror', ...)`, click `#sw-expand-canvas`, assert no `ReferenceError` was raised and the canvas panel goes fullscreen.

Confirm RED against current code before Task 2's fix lands is not meaningful for E2E (since Task 2 happens first in implementation order to keep the loop tight) — instead: run these 3 E2E specs immediately after Task 2's implementation and confirm GREEN. If time allows, temporarily revert Task 2's markup to confirm these 3 fail against unmodified code, then re-apply — this is the practical RED/GREEN order for a UI fix where unit tests are the fast RED signal and E2E is the slower confirmation layer.

### Task 4 — Full verification

- `npm test` (full unit/integration suite) — zero new regressions vs. baseline.
- `npx playwright test tests/e2e/design-definition-canvas-render.spec.js` — all 5 specs in that file pass (2 existing + 3 new).
- Confirm `git diff origin/master...HEAD --stat` only touches: `src/web-ui/views/chat-view.js`, `tests/check-cdpl-s1-canvas-panel-layout-fix.js`, `tests/e2e/design-definition-canvas-render.spec.js`, this plan file.

### Task 5 — Branch-complete

Commit, push, open draft PR. Do not mark ready for review. Do not merge.

## Out of scope (explicit)

- Drag-to-resize splitter.
- Any change to diagram content/Mermaid rendering.
- Any change to the ideate layout's base flex proportions.
- Any file other than the three listed above.

## Risk / ambiguity notes

- The DoR contract explicitly leaves exact max-height/min-height values as an implementation detail (55vh / 200px chosen as the contract's own suggested example values) — not a genuine ambiguity requiring a PR comment.
- `swExpandCanvas()` as a thin alias vs. independent implementation is explicitly sanctioned by the contract's own "Assumptions" section — proceeding with the alias form.
