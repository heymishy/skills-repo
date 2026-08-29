## Test Plan: Structured diagnostic for invalid mermaid syntax inside a diagram

**Story reference:** artefacts/2026-08-29-diagram-validation-and-types/stories/s2-mermaid-syntax-diagnostic.md
**Epic reference:** artefacts/2026-08-29-diagram-validation-and-types/epics/diagram-validation-drift-and-sequence-type.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-29

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Mermaid render failure surfaces the specific reason mermaid reported | 2 tests | — | — | — | — | 🟢 |
| AC2 | The reason is available via the text-alternative mechanism, not colour alone | 1 test | — | — | — | — | 🟢 |
| AC3 | A sibling diagram's successful render is unaffected by a neighbour's failure | 1 test | — | — | — | — | 🟢 |
| AC4 | Successful renders are unchanged (regression) | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A `content.mermaid` string with invalid mermaid syntax (e.g. an unterminated `flowchart` with a dangling arrow) | Synthetic | None | |
| AC2 | Same fixture as AC1 | Synthetic | None | |
| AC3 | Two diagram blocks in the same canvas panel — one broken, one valid | Synthetic | None | |
| AC4 | A valid mermaid diagram of each of the 3 mermaid-based types | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### mermaidRenderFailureSurfacesMermaidsOwnReason

- **Verifies:** AC1
- **Precondition:** `window.mermaid.run()` is stubbed to reject with a specific error object (e.g. `{ message: "Parse error on line 2" }`) for a given node.
- **Action:** Invoke `markDiagramRenderError` (or the updated equivalent) with that node and the rejection reason.
- **Expected result:** The rendered error box's text content includes `"Parse error on line 2"` — not just `"[label] diagram failed to render"`.
- **Edge case:** No.

### mermaidRenderFailureReasonLoggedToConsole

- **Verifies:** AC1
- **Precondition:** Same stubbed rejection as above; a console spy is installed.
- **Action:** Trigger the render failure path.
- **Expected result:** The console spy captures a log/error call containing the specific reason.
- **Edge case:** No.

### errorReasonAvailableViaTextAlternativeNotColourAlone

- **Verifies:** AC2
- **Precondition:** Same stubbed rejection.
- **Action:** Inspect the rendered error box's DOM structure.
- **Expected result:** The specific reason text is present as actual text content within the error box or its accompanying `<details>` element — not conveyed via a CSS class/colour change alone (e.g. `.cv-diagram-error` red styling with no text).
- **Edge case:** Yes — accessibility boundary case.

### siblingDiagramRendersSuccessfullyDespiteNeighbourFailure

- **Verifies:** AC3
- **Precondition:** Two `.mermaid` nodes in the same canvas panel — node A stubbed to reject, node B stubbed to resolve successfully.
- **Action:** Trigger the render pass for both nodes (matching the existing per-node `mermaid.run({nodes:[node]})` call pattern).
- **Expected result:** Node A shows the error box with its specific reason; node B renders its diagram normally and is not affected by node A's failure.
- **Edge case:** No.

### successfulRendersUnchangedAcrossAll3MermaidTypes

- **Verifies:** AC4 (regression)
- **Precondition:** One valid mermaid fixture per type (`data-model`, `system-architecture`, `program-design`).
- **Action:** Render each through the updated `mermaid.run()`/`markDiagramRenderError` path.
- **Expected result:** All 3 render successfully with no error UI — behaviour identical to pre-change.
- **Edge case:** No.

---

## Integration Tests

None beyond the unit-level coverage above — this story's changes are confined to the client-side render-failure handler, with no new cross-component seam beyond what S1's own integration tests already cover for the marker-parsing side.

---

## NFR Tests

### mermaidRenderFailureAddsNoLatency

- **NFR addressed:** Performance
- **Measurement method:** Assert `mermaid.run()` is called exactly once per node before and after this change — no additional call introduced to capture the rejection reason.
- **Pass threshold:** Call count unchanged.
- **Tool:** Node test runner (jsdom), call-count spy.

### errorReasonTextIsEscapedBeforeDomInsertion

- **NFR addressed:** Security
- **Measurement method:** Stub a rejection reason containing `<script>`-like text; assert the rendered error box's `innerHTML` does not contain an executable, unescaped `<script>` tag.
- **Pass threshold:** No raw script/HTML injection from the reason text.
- **Tool:** Node test runner (jsdom), DOM inspection.

### accessibilityTextAlternativePresentOnFailure

- **NFR addressed:** Accessibility
- **Measurement method:** Same as AC2's unit test — a text-content assertion, not a CSS-only check.
- **Pass threshold:** Failure reason text present in the DOM as real text content.
- **Tool:** Node test runner (jsdom).

---

## Out of Scope for This Test Plan

- The malformed-marker case (invalid JSON/type) — covered by S1's test plan.
- Real-browser mermaid rendering fidelity — jsdom + a stubbed `window.mermaid` is sufficient to verify this story's own logic (capturing and surfacing the rejection reason); mermaid's own parsing correctness is mermaid's concern, not this story's.

---

## Test Gaps and Risks

None — all 4 ACs have full unit coverage, and Step 3a's scan found no layout-dependent behaviour.
