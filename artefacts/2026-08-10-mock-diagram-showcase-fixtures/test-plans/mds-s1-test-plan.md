## Test Plan: Add a richer mock-gateway scenario covering every diagram type a skill session can legitimately emit

**Story reference:** artefacts/2026-08-10-mock-diagram-showcase-fixtures/stories/mds-s1-diagram-showcase-mock-scenario.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-10

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | ideate diagram-showcase has 3 valid markers (cluster-tree/table/text) | 1 test | — | — | — | — | 🟢 |
| AC2 | design diagram-showcase has 2 valid markers (system-architecture/data-model) | 1 test | — | — | — | — | 🟢 |
| AC3 | definition diagram-showcase has 2 valid markers (program-design/data-model) | 1 test | — | — | — | — | 🟢 |
| AC4 | existing success/failure fixtures byte-identical, unchanged | 1 test | — | — | — | — | 🟢 |
| AC5 | inventoryFixtures reports new files correctly | 1 test | — | — | — | — | 🟢 |
| AC6 | new fixture data renders correctly via the resume-history view | — | 3 tests | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** New, hand-authored fixture JSON files matching the existing `{stage, scenarioName, model, response, usage}` shape, plus turns fixtures for the AC6 integration tests matching `session.turns` shape.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | `ideate.diagram-showcase.json` | Hand-authored, following ideate SKILL.md format | None | |
| AC2 | `design.diagram-showcase.json` | Hand-authored, following design SKILL.md format | None | |
| AC3 | `definition.diagram-showcase.json` | Hand-authored, following definition SKILL.md format | None | |
| AC4 | Checksums of the 6 existing success/failure files, taken before and after | Computed from existing files | None | |
| AC5 | Same 3 new fixture files as AC1-AC3 | Hand-authored | None | |
| AC6 | Turns arrays built from each new fixture's own response text, run through `handleGetJourneyStageView` | Hand-authored, reusing `check-drh-s1-*`'s fixture pattern | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### getMockResponse_ideateDiagramShowcase_hasThreeValidMarkers

- **Verifies:** AC1
- **Precondition:** `ideate.diagram-showcase.json` exists with the mock gateway wired to the default fixture-file client.
- **Action:** `getMockResponse('ideate', 'mock', 'diagram-showcase')`, then extract markers from the returned `.text` using `extractCanvasBlocksFromTurns([{role:'assistant', content: result.text}])`.
- **Expected result:** Returns exactly 3 blocks, with types `['cluster-tree', 'table', 'text']` in that order, each with non-empty, realistic `title`/`content`.

### getMockResponse_designDiagramShowcase_hasTwoValidMarkers

- **Verifies:** AC2
- **Precondition:** `design.diagram-showcase.json` exists.
- **Action:** Same pattern for `('design', 'mock', 'diagram-showcase')`.
- **Expected result:** Returns exactly 2 blocks, types `['system-architecture', 'data-model']`, each with real mermaid syntax in `content.mermaid` (non-empty, contains at least one `-->` or `erDiagram` keyword as appropriate).

### getMockResponse_definitionDiagramShowcase_hasTwoValidMarkers

- **Verifies:** AC3
- **Precondition:** `definition.diagram-showcase.json` exists.
- **Action:** Same pattern for `('definition', 'mock', 'diagram-showcase')`.
- **Expected result:** Returns exactly 2 blocks, types `['program-design', 'data-model']`, each with real mermaid syntax.

### existingFixtures_byteIdentical_afterNewFixturesAdded

- **Verifies:** AC4
- **Precondition:** SHA-256 checksums of `ideate.success.json`, `ideate.failure.json`, `design.success.json`, `definition.success.json`, `definition.failure.json` computed and hard-coded into the test BEFORE this story's fixture files are added (captured once, checked in).
- **Action:** Re-read and re-hash the same 5 files after this story's changes.
- **Expected result:** Every checksum matches exactly — zero byte-level change to any pre-existing fixture.

### inventoryFixtures_reportsNewDiagramShowcaseFiles

- **Verifies:** AC5
- **Precondition:** The 3 new `diagram-showcase` fixture files present alongside existing ones.
- **Action:** `inventoryFixtures()`.
- **Expected result:** `byStage.ideate.files`, `byStage.design.files`, `byStage.definition.files` each include their new `diagram-showcase` filename; `byStage.*.success`/`.failure` counts unchanged from before this story.

---

## Integration Tests

### resumeHistoryView_ideateDiagramShowcase_rendersAllThreeTypes (AC6)

- **Verifies:** AC6 (ideate)
- **Precondition:** A completed `ideate` stage whose durable turns contain `ideate.diagram-showcase.json`'s response text as the single assistant turn's content (reusing `check-drh-s1-resume-history-diagram-rendering.js`'s fixture-journey pattern).
- **Action:** `handleGetJourneyStageView` for that journey/stage.
- **Expected result:** Response HTML contains 3 distinct `.canvas-block` elements with `data-block-type` values `cluster-tree`, `table`, `text` respectively — proving the new fixture's full marker set survives extraction, rendering, and the read-only script injection end to end.

### resumeHistoryView_designDiagramShowcase_rendersBothTypes (AC6)

- **Verifies:** AC6 (design)
- **Precondition:** Same pattern, `design.diagram-showcase.json`'s content, `stageName: 'design'`.
- **Action:** Same.
- **Expected result:** 2 `.canvas-block` elements, types `system-architecture` and `data-model`.

### resumeHistoryView_definitionDiagramShowcase_rendersBothTypes (AC6)

- **Verifies:** AC6 (definition)
- **Precondition:** Same pattern, `definition.diagram-showcase.json`'s content, `stageName: 'definition'`.
- **Action:** Same.
- **Expected result:** 2 `.canvas-block` elements, types `program-design` and `data-model`.

---

## NFR Tests

None beyond the ACs above — Correctness (parseability) and Test isolation (AC4) are the only NFRs in scope, both fully covered.

---

## Out of Scope for This Test Plan

- Real browser-side mermaid.js visual rendering of the new fixture content — the mechanism itself was already confirmed working live this session (drh-s1); this test plan verifies the new data reaches the same, already-proven-correct rendering path.
- Any E2E Playwright spec — the integration tests above (calling `handleGetJourneyStageView` directly) are the right level per this story's Complexity rating of 1.

---

## Test Gaps and Risks

None identified as blocking.
