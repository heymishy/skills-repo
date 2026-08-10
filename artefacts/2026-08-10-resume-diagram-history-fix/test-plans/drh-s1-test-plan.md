## Test Plan: Diagrams generated during a live /ideate session never appear when resuming/viewing that stage's history

**Story reference:** artefacts/2026-08-10-resume-diagram-history-fix/stories/drh-s1-resume-history-diagram-rendering.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-10

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Diagram markers in turn history render as real diagrams | 2 tests | — | — | — | — | 🟢 |
| AC2 | mermaid.min.js loaded, mermaid.run() called exactly once | 1 test | — | — | — | — | 🟢 |
| AC3 | Malformed/unrecognised marker skipped, others still render | 1 test | — | — | — | — | 🟢 |
| AC4 | No interactive controls present in the history view | 1 test | — | — | — | — | 🟢 |
| AC5 | Fix applies to design/definition stages too, not just ideate | 1 test | — | — | — | — | 🟢 |
| AC6 | No diagrams in history → no regression to current behaviour | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. AC2's "mermaid.run() executes" claim is verified at the HTML/script-generation level (the init script and mermaid asset tag are present exactly once, matching the existing live-page pattern's own test convention) — actual browser-side mermaid execution is out of scope for a unit/integration test and is the same convention already used by this repo's existing canvas-block tests.

---

## Test Data Strategy

**Source:** Hand-authored turn arrays matching the real `session.turns` shape (`{role, content}`), with `content` containing real-shaped `---CANVAS-JSON: {...}---` markers matching `skills/ideate/SKILL.md`'s documented format.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Turns with 1-2 valid CANVAS-JSON markers of different types | Hand-authored | None | |
| AC2 | Same as AC1 | Hand-authored | None | |
| AC3 | Turns with one malformed marker (invalid JSON) and one valid marker | Hand-authored | None | |
| AC4 | Same as AC1, inspect for absence of form/confirm-button markup | Hand-authored | None | |
| AC5 | Same as AC1, with `stageName: 'design'` and `'definition'` | Hand-authored | None | |
| AC6 | Turns with zero CANVAS-JSON markers | Hand-authored | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### extractCanvasBlocksFromTurns_findsAllValidMarkers

- **Verifies:** AC1 (data-layer half)
- **Precondition:** An array of turns whose combined `content` contains 2 valid CANVAS-JSON markers (different types, e.g. `text` and `cluster-tree`).
- **Action:** Call the new extraction helper with the turns array.
- **Expected result:** Returns an array of 2 parsed block objects, in the order they appeared across the turns.
- **Edge case:** Yes — the core new mechanism.

### handleGetJourneyStageView_ideateWithDiagrams_rendersCanvasPanelAndInitScript

- **Verifies:** AC1 (render-layer half), AC2
- **Precondition:** A completed `ideate` stage with durable turns containing 1 valid CANVAS-JSON marker; `_useChatSplit` true.
- **Action:** Call `handleGetJourneyStageView` (via its route handler, with mocked `_getTurnsForStageFn`).
- **Expected result:** Response HTML contains: the `#canvas-panel` structure, exactly one `<script src=".../mermaid.min.js">` tag, exactly one `window.__SW_INITIAL_CANVAS_BLOCKS__=` init script containing the parsed block, and exactly one call site that would trigger `mermaid.run()` on load.

### extractCanvasBlocksFromTurns_skipsMalformedMarker_keepsValidOnes

- **Verifies:** AC3
- **Precondition:** Turns content containing one marker with invalid JSON and one marker with a valid, allowlisted type.
- **Action:** Call the extraction helper.
- **Expected result:** Returns an array with exactly 1 block (the valid one) — no throw, malformed marker silently dropped.

### handleGetJourneyStageView_readOnlyHistoryWithDiagrams_noInteractiveControls

- **Verifies:** AC4
- **Precondition:** Same fixture as the render-layer AC1/AC2 test.
- **Action:** Inspect the response HTML.
- **Expected result:** No `<form>` element with `action` pointing at an answer/confirm endpoint; no lens-navigation pip elements with click handlers; no assumption-confirm buttons — matching the existing readOnly-mode guarantee, now confirmed to still hold with diagrams present.

### handleGetJourneyStageView_designAndDefinitionStages_sameDiagramFix

- **Verifies:** AC5
- **Precondition:** Same turns/marker fixture as AC1, but `stageName: 'design'` in one run and `stageName: 'definition'` in another.
- **Action:** Call the handler for each.
- **Expected result:** Both responses render the diagram identically to the `ideate` case — same canvas-panel structure, same init script, same mermaid asset tag.

### handleGetJourneyStageView_noDiagramMarkers_unchangedFromToday

- **Verifies:** AC6
- **Precondition:** A completed stage's turns contain zero CANVAS-JSON markers.
- **Action:** Call the handler.
- **Expected result:** No `#canvas-panel` init script, no mermaid asset tag — byte-identical to this handler's current (pre-fix) output for a no-diagram stage.

---

## Integration Tests

None required beyond the unit tests above — `handleGetJourneyStageView_ideateWithDiagrams_rendersCanvasPanelAndInitScript` already exercises the real handler end to end (turns fetch → extraction → render), which is the meaningful integration surface for this fix.

---

## NFR Tests

### noNewXssSurface_markerContentEscaped

- **NFR addressed:** Security
- **Measurement method:** Feed a CANVAS-JSON marker whose `content` contains `<script>`/`</div>`-shaped strings through the extraction + render path; assert the rendered output HTML-escapes it (matching the existing live-page convention for the same data shape) — never raw-injected.
- **Pass threshold:** No unescaped `<`/`>` from marker content appears in the rendered output.
- **Tool:** Same unit test harness.

---

## Out of Scope for This Test Plan

- Real browser-side mermaid.js execution/visual diagram correctness — covered by this session's own manual live-browser confirmation that the mermaid rendering mechanism itself works; this test plan verifies the HTML/script scaffolding that triggers it is present and correct.
- Restoring interactive controls — explicitly out of scope per the story; AC4 tests their continued absence, not their behaviour.

---

## Test Gaps and Risks

None identified as blocking.
