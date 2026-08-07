# Contract Proposal — Stop the artefact panel squeezing the diagram panel, and fix the dead "maximise canvas" button (cdpl-s1)

**What will be built:**
- `src/web-ui/views/chat-view.js` changes, scoped to the `sw-artefact-pane` variant (used by `/design` and `/definition`):
  - `#artefact-panel`'s inline style gains a `max-height` cap (e.g. `55vh` or an equivalent percentage of the pane) alongside its existing `overflow-y:auto`.
  - `#canvas-panel` (in this variant only) gains a `min-height` declaration (e.g. `200px`) alongside its existing `flex:1 1 auto`.
  - A new maximise/expand button is added to the "Diagrams" section header, reusing the exact `.ad-fs`/`swToggleArtefactFs()` toggle pattern already used for the artefact panel — a new CSS class (e.g. `.canvas-fs`) mirroring `.ad-fs`'s `position:fixed` rule, and a new toggle function (e.g. `swToggleCanvasFs()`) mirroring `swToggleArtefactFs()`'s body.
  - `swExpandCanvas()` — currently referenced via `onclick` but never defined — is now defined, reusing the same shared toggle mechanism (either calling the new `swToggleCanvasFs()` directly, or being an alias for it) so the ideate layout's existing button starts working with no separate implementation.

**What will NOT be built:**
- Any change to the ideate 3-panel layout's own base flex proportions — only its dead button is fixed.
- A drag-to-resize splitter between panels.
- Any change to diagram content or Mermaid rendering.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | `renderChat_designSkill_artefactPanelHasMaxHeightStyle` | unit |
| AC2 | `renderChat_designSkill_canvasPanelHasMinHeightDeclaration`, `canvasPanel_realBrowserRender_hasComputedMinHeight` | unit + E2E |
| AC3 | `renderChat_designSkill_diagramsHeaderHasMaximiseButton`, `maximiseCanvasButton_realClick_expandsAndRestores` | unit + E2E |
| AC4 | `swExpandCanvas_functionIsDefined_inRenderedScript`, `ideateExpandCanvasButton_realClick_nowWorksInsteadOfThrowing` | unit + E2E |
| AC5 | `canvasPanel_realBrowserRender_hasComputedMinHeight` (extended with synthetic long-content injection per the test plan's Test Data Strategy) | E2E |

**Assumptions:**
- The exact `max-height`/`min-height` pixel/percentage values are an implementation detail left to the coding agent, provided AC2's "usable minimum" and AC1's "does not consume the pane" intents are both satisfied — no specific number is mandated by the ACs themselves.
- `swExpandCanvas()` can be implemented as a thin wrapper/alias around the new shared toggle function rather than a fully independent function body — AC4 only requires it to exist and work, not that it be a unique implementation.

**Estimated touch points:**
Files: `src/web-ui/views/chat-view.js` (styles, markup, and the two toggle functions), `tests/e2e/design-definition-canvas-render.spec.js` (extended with 3 new E2E tests), a new `tests/check-cdpl-s1-canvas-panel-layout-fix.js` (5 unit tests)
Services: None
APIs: None
