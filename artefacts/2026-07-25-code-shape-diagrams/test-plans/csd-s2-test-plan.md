## Test Plan: Canvas rendering of the diagram content-block type

**Story reference:** artefacts/2026-07-25-code-shape-diagrams/stories/csd-s2-canvas-diagram-rendering.md
**Epic reference:** artefacts/2026-07-25-code-shape-diagrams/epics/csd-e1-code-shape-diagrams.md
**Test plan author:** Copilot (Claude Sonnet 5)
**Date:** 2026-07-25

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | All three diagram types render with a visible type label | 3 tests | 1 test | — | — | — | 🟢 |
| AC2 | Malformed mermaid syntax shows a labelled error box, not a blank/stack trace | 2 tests | — | — | — | — | 🟢 |
| AC3 | As-designed vs as-built diagrams of the same type are visually distinguishable | — | 1 test | 1 test | — | CSS-layout-dependent | 🔴 |
| AC4 | Diagram block doesn't break existing keyboard navigation/focus order | — | — | 1 test | — | CSS-layout-dependent | 🔴 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in unit/integration | Handling |
|-----|----|----------|--------------------------|---------|
| Visual distinguishability of two diagram blocks side by side | AC3 | CSS-layout-dependent | Whether two rendered elements are visually distinct depends on real CSS layout/styling, not just DOM presence | Playwright E2E screenshot-based test — see verification script 🔴 |
| Keyboard focus order across a page containing a diagram block | AC4 | CSS-layout-dependent | Tab order and visible focus indicators require a real browser's focus/layout engine | Playwright E2E keyboard-navigation test — see verification script 🔴 |

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | One fixture per diagram type (`system-architecture`, `program-design`, `data-model`) | Hand-authored fixtures | None | Minimal, one per type |
| AC2 | One fixture with deliberately broken mermaid syntax | Hand-authored fixture | None | Must trigger mermaid's own parse error |
| AC3 | One as-designed and one as-built fixture of the same type | Hand-authored fixtures, or reuse csd-s1's fixture as "as-designed" and a slightly modified copy as "as-built" | None | |
| AC4 | A canvas page fixture with a diagram block plus other interactive elements (links, buttons) | Existing canvas page fixture, extended with a diagram block | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### rendersEachDiagramTypeWithDistinctLabel
- **Verifies:** AC1
- **Precondition:** Three separate canvas payloads, each with one diagram block of a different type
- **Action:** Render each payload
- **Expected result:** Each renders with a visible label matching its type (`System Architecture` / `Program Design` / `Data Model`)
- **Edge case:** No

### malformedMermaidSyntaxShowsErrorBoxNotBlank
- **Verifies:** AC2
- **Precondition:** A diagram content-block with intentionally invalid mermaid syntax
- **Action:** Render the block
- **Expected result:** A labelled error box is rendered in place of the diagram, naming the diagram type and stating it failed to render — not a blank space
- **Edge case:** No

### malformedMermaidSyntaxNeverExposesRawStackTrace
- **Verifies:** AC2
- **Precondition:** Same as above
- **Action:** Render the block; inspect the rendered output
- **Expected result:** No raw JS error message or stack trace text appears anywhere in the rendered output
- **Edge case:** Yes — this is itself the negative-case check for AC2

### threeDiagramTypesRenderIndependentlyInSamePayload
- **Verifies:** AC1
- **Precondition:** One canvas payload containing all three diagram types
- **Action:** Render the payload
- **Expected result:** All three render correctly and independently — no cross-type interference

---

## Integration Tests

### asDesignedAndAsBuiltBlocksBothRenderWithDistinctLabels
- **Verifies:** AC3
- **Components involved:** Canvas rendering module, content-block dispatcher
- **Precondition:** A canvas payload with two diagram blocks of the same type, one tagged "as-designed" and one tagged "as-built"
- **Action:** Render the payload
- **Expected result:** Both render, each labelled distinctly ("As Designed" / "As Built") in the DOM structure

---

## NFR Tests

### multipleDiagramBlocksRenderWithoutNoticeableExtraDelay
- **NFR addressed:** Performance
- **Measurement method:** Render a payload with 3 diagram blocks vs 1; compare render completion time
- **Pass threshold:** No numeric target set (no baseline exists) — informal comparison only, flagged in NFR profile as a known gap
- **Tool:** Manual timing observation during dogfood use

### allThreeDiagramTypesUseConsistentSecurityConfig
- **NFR addressed:** Security (`MC-SEC-01`)
- **Measurement method:** Inspect the mermaid render call for each of the three diagram types; assert the same security-level configuration is applied to all
- **Pass threshold:** Identical `securityLevel` setting across all three type-rendering code paths
- **Tool:** Unit test

---

## Out of Scope for This Test Plan

- The drift/match-diverged visual signal — that is csd-s6's own test plan.
- Editable/interactive diagrams (zoom, pan, click-to-expand) — not built in this MVP.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Visual distinguishability (AC3) | Requires real CSS rendering | Playwright E2E screenshot test — marked 🔴 |
| Keyboard focus order (AC4) | Requires real browser focus/tab-order engine | Playwright E2E keyboard test — marked 🔴 |
