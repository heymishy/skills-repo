## Test Plan: Stop the artefact panel squeezing the diagram panel, and fix the dead "maximise canvas" button

**Story reference:** artefacts/2026-08-07-canvas-diagram-panel-layout-fix/stories/cdpl-s1-fix-canvas-panel-squeeze-and-maximise.md
**Epic reference:** None — short-track
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-08-07

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `#artefact-panel` has a max-height cap in the design/definition pane markup | 1 test | — | — | — | — | 🟢 |
| AC2 | `#canvas-panel` retains a minimum usable height | 1 test | — | 1 test | — | — | 🟢 |
| AC3 | New maximise button on the Diagrams section, reusing the `.ad-fs` toggle pattern | 1 test | — | 1 test | — | — | 🟢 |
| AC4 | `swExpandCanvas()` now exists and works (fixes the dead ideate-layout button) | 1 test | — | 1 test | — | — | 🟢 |
| AC5 (CSS-layout-dependent) | Diagram panel visually occupies a usable, non-trivial height with a long artefact draft loaded | — | — | 1 test | — | — | 🟢 |

---

## Coverage gaps

None — Playwright (ADR-018) is already configured and this exact pane already has a rich existing E2E spec (`tests/e2e/design-definition-canvas-render.spec.js`) to extend, so AC5 is covered by a real E2E test rather than deferred to manual-only.

---

## Test Data Strategy

**Source:** Synthetic (unit tests: `renderChat()` called directly with fixture options); Mixed — real browser + synthetic DOM injection (E2E: real journey flow per the existing spec's `driveJourneyToStage` helper, with a synthetic long artefact string injected via `page.evaluate()` rather than relying on the mock-gateway fixture's own short canned text)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | `renderChat()` output for `skillName: 'design'` | Direct function call, no fixtures needed | None | |
| AC2 | Same, plus a real browser render for the integration-level minimum-height check | Direct function call + Playwright | None | |
| AC3 | `renderChat()` output for `skillName: 'design'`; real browser for the click-to-expand behaviour | Direct function call + Playwright | None | |
| AC4 | `renderChat()` output for `skillName: 'ideate'`; real browser for the click-to-expand behaviour | Direct function call + Playwright | None | |
| AC5 | A real `/design` journey driven to the chat page (existing `driveJourneyToStage` helper), with a long synthetic string injected into `#artefact-panel` via `page.evaluate()` post-render — decouples this test from the mock fixture's own short canned text, which is too short to naturally reproduce the squeeze | `tests/e2e/design-definition-canvas-render.spec.js`'s existing helpers + synthetic injection | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### renderChat_designSkill_artefactPanelHasMaxHeightStyle

- **Verifies:** AC1
- **Precondition:** Call `renderChat({ skillName: 'design', ... })` with minimal required options
- **Action:** Inspect the returned HTML string for `#artefact-panel`'s inline style
- **Expected result:** The `style` attribute on the `id="artefact-panel"` element includes a `max-height` declaration (not just `flex:0 1 auto` with no cap, as today)
- **Edge case:** No

### renderChat_designSkill_canvasPanelHasMinHeightDeclaration

- **Verifies:** AC2
- **Precondition:** Same as above
- **Action:** Inspect the returned HTML string for `#canvas-panel`'s inline style
- **Expected result:** The `style` attribute on the `id="canvas-panel"` element (in the design/definition pane variant) includes a `min-height` declaration (e.g. `min-height:200px`) in addition to its existing `flex:1 1 auto`
- **Edge case:** No

### renderChat_designSkill_diagramsHeaderHasMaximiseButton

- **Verifies:** AC3
- **Precondition:** Call `renderChat({ skillName: 'design', ... })`
- **Action:** Inspect the returned HTML string for the "Diagrams" section header
- **Expected result:** A new button element exists in that header with an `onclick` handler toggling the canvas panel's fullscreen state, using the same `.ad-fs`-style class/toggle convention as `swToggleArtefactFs()`/`sw-artefact-fs-btn` — not a newly-invented class name
- **Edge case:** No

### swExpandCanvas_functionIsDefined_inRenderedScript

- **Verifies:** AC4
- **Precondition:** Call `renderChat({ skillName: 'ideate', ... })` (or any variant — the function is defined once, globally in the page script, not per-skillName)
- **Action:** Inspect the returned HTML/script string for a `function swExpandCanvas(` definition
- **Expected result:** The function is now defined (today it is referenced via `onclick="swExpandCanvas()"` at line ~402 but never defined anywhere — a `ReferenceError` at click time) and its body toggles the ideate layout's `#canvas-panel` using the same reusable toggle mechanism as AC3
- **Edge case:** Yes — this test would fail (function absent) against today's unmodified code, confirming the dead-button defect is real before the fix

### toggleMechanism_isSharedNotDuplicated_betweenArtefactAndCanvasMaximise

- **Verifies:** Architecture Constraint (reuse, not a second implementation)
- **Precondition:** Inspect the rendered script source for all three maximise/fullscreen functions (`swToggleArtefactFs`, the new canvas-maximise function, and the fixed `swExpandCanvas`)
- **Action:** Compare their implementations
- **Expected result:** All three follow the identical `classList.toggle(<fs-class>)` + button-glyph-swap pattern — no function reimplements fullscreen logic independently (e.g. via a different CSS class naming scheme or a different toggle mechanism)
- **Edge case:** No

---

## Integration Tests

### canvasPanel_realBrowserRender_hasComputedMinHeight

- **Verifies:** AC2
- **Components involved:** `renderChat()`, the `/design` chat page route, a real (non-headless-assertion-only) browser render via Playwright
- **Precondition:** A `/design` session driven to its chat page (existing `driveJourneyToStage` helper)
- **Action:** Load the page, query `#canvas-panel`'s computed `getBoundingClientRect().height`
- **Expected result:** The computed height is at least the min-height value asserted in the unit test (e.g. ≥200px) even before any long artefact content is injected

### maximiseCanvasButton_realClick_expandsAndRestores

- **Verifies:** AC3
- **Components involved:** Real browser, the new maximise button, the shared toggle mechanism
- **Precondition:** A `/design` session driven to its chat page
- **Action:** Click the new "Maximise" button on the Diagrams section header, then click it again
- **Expected result:** After the first click, `#canvas-panel` (or its containing pane) occupies the full viewport (matching `.ad-fs`'s `position:fixed;top:0;left:0;right:0;bottom:0` pattern); after the second click, it returns to the normal split-pane layout

### ideateExpandCanvasButton_realClick_nowWorksInsteadOfThrowing

- **Verifies:** AC4
- **Components involved:** Real browser, the ideate layout's pre-existing "Maximise canvas" button
- **Precondition:** An `/ideate` session driven to its chat page (reuse whatever existing helper this repo has for ideate sessions, or construct an equivalent to `driveJourneyToStage`)
- **Action:** Listen for uncaught page errors, then click `#sw-expand-canvas`
- **Expected result:** No `ReferenceError: swExpandCanvas is not defined` is thrown (today's actual behaviour), and the ideate layout's canvas panel expands to fullscreen exactly as AC3's mechanism does

---

## NFR Tests

None — this is a pure layout/UI fix with no new performance, security, or audit surface. Confirmed with story owner: "None — confirmed" per the story's own NFR section (Performance/Security/Audit all state "not applicable" or "no new").

---

## Out of Scope for This Test Plan

- The ideate 3-panel layout's base canvas rendering (already covered by existing `csd-s2-canvas-diagram-rendering.spec.js` / `dic-canvas.spec.js`) — this plan only covers the maximise-button fix for that layout (AC4).
- Any test of diagram content correctness (Mermaid syntax rendering) — already covered by `design-definition-canvas-render.spec.js`; this story doesn't touch diagram content.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC5's "long artefact draft" scenario uses synthetic DOM injection rather than a naturally long mock-gateway response | The existing `design.success.json`/`definition.success.json` fixtures are short (~1.5KB) — reproducing a genuinely long draft via multiple real turns would make the test slower and more fragile (rate-limit interactions, per the existing spec's own noted `useIsolatedTenant` workaround) | Synthetic injection via `page.evaluate()` is a standard, legitimate Playwright pattern for testing a specific CSS/layout scenario deterministically; it tests the real rendered CSS rules against real content, just not real mock-gateway-generated content |
