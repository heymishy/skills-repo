## Test Plan: Prove the canvas diagram mechanism with a real data-model example

**Story reference:** artefacts/2026-07-25-code-shape-diagrams/stories/csd-s1-derisk-canvas-mermaid.md
**Epic reference:** artefacts/2026-07-25-code-shape-diagrams/epics/csd-e1-code-shape-diagrams.md
**Test plan author:** Copilot (Claude Sonnet 5)
**Date:** 2026-07-25

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Diagram content-block renders as rendered mermaid, not raw text, alongside existing block types | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | Realistic 5+ entity data-model diagram is legible/distinguishable | — | — | 1 test | — | CSS-layout-dependent | 🔴 |
| AC3 | Existing block types (clusters/tables/paragraphs) render unchanged — no regression | — | 2 tests | — | — | — | 🟢 |
| AC4 | New mechanism follows the same dispatch pattern as existing block types (ADR-026) | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in unit/integration | Handling |
|-----|----|----------|--------------------------|---------|
| Visual legibility of rendered diagram entities/relationships | AC2 | CSS-layout-dependent | Rendered visual quality (are shapes/text distinguishable on screen) cannot be verified by a DOM-only assertion — this repo's unit/integration runner has no CSS layout engine | Playwright E2E test with a screenshot assertion — see AC verification script 🔴 |

---

## Test Data Strategy

**Source:** Synthetic — hand-authored fixture content
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A single diagram content-block object (type `data-model`, minimal 2-entity mermaid syntax) | Hand-authored test fixture | None | Minimal fixture — just enough to prove rendering dispatch works |
| AC2 | A realistic 5+ entity data-model diagram (entities, relationships) | Hand-authored test fixture, modelled loosely on this repo's own `credits`/`tenant_plan`/`team_memberships` shape (structure only, no real data) | None | Fixture must be genuinely representative, not a toy example, to make the legibility check meaningful |
| AC3 | Existing cluster/table/paragraph fixture payloads already used by `/ideate`'s existing tests | Reuse existing test fixtures | None | Confirms no regression using the SAME fixtures already proven to work |
| AC4 | The existing block-type dispatch source code | Real source, read directly | None | Structural/source-inspection test, not runtime data |

### PCI / sensitivity constraints

None.

### Gaps

None — all test data available now.

---

## Unit Tests

### rendersDataModelBlockAsMermaidNotRawText
- **Verifies:** AC1
- **Precondition:** A canvas payload containing one content-block with `type: 'data-model'` and valid mermaid syntax
- **Action:** Render the canvas payload
- **Expected result:** Output contains a rendered diagram element (not the raw mermaid source string as visible text)
- **Edge case:** No

### newBlockTypeDoesNotBreakExistingDispatchForOtherTypes
- **Verifies:** AC1
- **Precondition:** A canvas payload containing a `data-model` block AND an existing `cluster` block
- **Action:** Render the canvas payload
- **Expected result:** Both blocks render correctly; the presence of the new type does not alter how the existing type is dispatched
- **Edge case:** No

### dispatchMechanismUsesSameSwitchPatternAsExistingTypes
- **Verifies:** AC4
- **Precondition:** Source inspection of the canvas rendering module
- **Action:** Locate the `data-model` case in the block-type dispatch logic
- **Expected result:** The new case follows the identical dispatch structure (same switch/conditional shape) as the `cluster`/`table`/`paragraph` cases — no parallel rendering function introduced
- **Edge case:** No

### dispatchMechanismRejectsUnknownDiagramTypeGracefully
- **Verifies:** AC4
- **Precondition:** A canvas payload containing a content-block with an unrecognised `type` value
- **Action:** Render the canvas payload
- **Expected result:** No crash; unrecognised block types are skipped or rendered as a no-op, matching the existing behaviour for unrecognised types today
- **Edge case:** Yes — genuinely unrecognised type, not one of the four known types

---

## Integration Tests

### canvasRendersMixedBlockTypesInOneCoherentPayload
- **Verifies:** AC1, AC3
- **Components involved:** Canvas rendering module, content-block dispatcher
- **Precondition:** A single canvas payload containing a `data-model` block, a `cluster` block, a `table` block, and a `paragraph` block, in that order
- **Action:** Render the full payload
- **Expected result:** All four blocks render, in the order given, each in its own correct format — no cross-contamination between block types

### existingClusterTableParagraphFixturesStillPassAfterDiagramTypeAdded
- **Verifies:** AC3
- **Components involved:** Canvas rendering module
- **Precondition:** The existing `/ideate` canvas test suite's own fixture payloads (pre-dating this feature)
- **Action:** Re-run the existing canvas rendering tests unmodified
- **Expected result:** All pre-existing tests still pass with zero changes to their own assertions — confirms no regression

---

## NFR Tests

### mermaidSecurityLevelDisablesHtmlInjection
- **NFR addressed:** Security (`MC-SEC-01`)
- **Measurement method:** Inspect the mermaid initialization configuration; assert `securityLevel` is not set to `'loose'` or any value permitting raw HTML injection
- **Pass threshold:** `securityLevel` is `'strict'` or `'sandbox'` (mermaid's documented safe values)
- **Tool:** Unit test against the mermaid config object

### diagramHasTextAlternativeFallback
- **NFR addressed:** Accessibility
- **Measurement method:** Render a diagram block; assert the raw mermaid source (or an equivalent alt-text summary) is present in the DOM in a screen-reader-accessible form (e.g. an `aria-label` or a visually-hidden text node)
- **Pass threshold:** Text alternative present for every rendered diagram block
- **Tool:** Unit/DOM test

---

## Out of Scope for This Test Plan

- Generating diagram content from a skill — covered by csd-s3/csd-s4's own test plans, not this one.
- The other two diagram types (System Architecture, Program Design) — only Data Model is exercised here per this story's own scope.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Visual legibility of the rendered diagram (AC2) | Requires real CSS layout and rendered pixels — not verifiable in the unit/integration runner | Playwright E2E test with a screenshot assertion (see verification script) — marked 🔴, never skipped at smoke test time |
