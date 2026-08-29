## Test Plan: Add the Sequence diagram type, conditionally emitted

**Story reference:** artefacts/2026-08-29-diagram-validation-and-types/stories/s5-sequence-diagram-type.md
**Epic reference:** artefacts/2026-08-29-diagram-validation-and-types/epics/diagram-validation-drift-and-sequence-type.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-29

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | SKILL.md instruction includes a worked example for the sequence marker | — | — | — | 1 scenario | Untestable-by-nature | 🔴 |
| AC2 | Conditional (not unconditional) emission | — | — | — | 1 scenario | Untestable-by-nature | 🔴 |
| AC3 | Renders via the shared mechanism with "Sequence" label; S1/S2 diagnostics apply automatically | 2 tests | — | — | — | — | 🟢 |
| AC4 | Read-only history view renders identically (proves single shared array, ADR-026) | 1 test | — | — | — | — | 🟢 |
| AC5 | `sequence` present in `TYPE_ALLOW` | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| Whether the model actually chooses to emit (or correctly withholds) a sequence marker for a given feature description | AC1, AC2 | Untestable-by-nature | This is a live-model behavioural judgment call (does this feature's subject matter "genuinely involve a multi-step interaction"), not a deterministic code path — no unit/integration test can assert what the model chooses to write | Manual scenario — see AC verification script 🔴 |

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC3 | A `sequence`-type CANVAS-JSON marker with valid `sequenceDiagram` mermaid content | Synthetic | None | |
| AC4 | A session/turn history fixture containing a `sequence`-type canvas block | Synthetic | None | |
| AC5 | A `sequence`-type marker fed through `parseCanvasBlock` | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None beyond the AC1/AC2 manual-only gap noted above.

---

## Unit Tests

### sequenceTypeRendersViaSharedBuildDiagramBodyHtml

- **Verifies:** AC3
- **Precondition:** A `sequence`-type canvas block with valid `content.mermaid`.
- **Action:** Call `renderCanvasBlock` with this block.
- **Expected result:** The output includes the type label "Sequence" and the same markup shape (`.cv-diagram-wrap`, `.cv-diagram-type-label`, `<details class="cv-diagram-alt">`) as the existing 3 mermaid-based types — proving it dispatches through `buildDiagramBodyHtml`, not a new code path.
- **Edge case:** No.

### sequenceTypeRenderFailureUsesS1S2DiagnosticsAutomatically

- **Verifies:** AC3
- **Precondition:** A `sequence`-type block with invalid mermaid content, and the S2 diagnostic mechanism in place.
- **Action:** Trigger the render-failure path for this block.
- **Expected result:** The same structured diagnostic mechanism S2 built for the 3 existing types fires identically for `sequence` — no type-specific error-handling code was added.
- **Edge case:** Yes — proves no special-casing was introduced.

### readOnlyHistoryViewRendersSequenceBlockIdenticallyToLiveView

- **Verifies:** AC4
- **Precondition:** A durable turn-history fixture containing a `sequence`-type canvas block, processed via `extractCanvasBlocksFromTurns` and the read-only rendering script.
- **Action:** Render via both the live-session script and the read-only history script.
- **Expected result:** Both produce identical markup for the same `sequence`-type block — confirming the type was added to the single shared `_CANVAS_RENDER_FN_LINES` array, not duplicated.
- **Edge case:** No.

### typeAllowIncludesSequence

- **Verifies:** AC5
- **Precondition:** A marker with `type: "sequence"` and valid JSON.
- **Action:** Call `parseCanvasBlock`.
- **Expected result:** The marker is parsed successfully (not rejected as disallowed) — `"sequence"` is present in `TYPE_ALLOW`.
- **Edge case:** No.

---

## Integration Tests

None beyond the unit-level coverage above — this story reuses S1/S2's already-integration-tested diagnostic mechanism and the existing shared render dispatch; no new integration seam is introduced.

---

## NFR Tests

### noNewModelOrNetworkCallForSequenceType

- **NFR addressed:** Performance
- **Measurement method:** Assert adding the sequence type introduces no new model/executor or network call beyond the existing per-turn LLM call.
- **Pass threshold:** No additional calls.
- **Tool:** Node test runner, call-count spy.

### sequenceMermaidCoveredBySameSecurityLevelStrict

- **NFR addressed:** Security
- **Measurement method:** Confirm mermaid's global `securityLevel: "strict"` configuration (set once per page) applies to `sequenceDiagram` rendering the same as `flowchart` — no separate mermaid initialization path for the new type.
- **Pass threshold:** Single shared mermaid config, no type-specific override.
- **Tool:** Node test runner, source inspection of the mermaid init call site.

### sequenceDiagramAccessibleViaSameTextAlternative

- **NFR addressed:** Accessibility
- **Measurement method:** Assert the `sequence` type's rendered output includes the same `<details class="cv-diagram-alt">` text-alternative element as the other 3 mermaid-based types.
- **Pass threshold:** Text alternative present.
- **Tool:** Node test runner (jsdom).

---

## Out of Scope for This Test Plan

- Drift comparison for sequence diagrams — no `compareSequence` function exists; not testable because not built, per the story's own Out of Scope section.
- Whether the model's judgment about "genuinely involves a multi-step interaction" is *correct* in any given case — this is a product-quality question for real usage (measured by Benefit Metric 3), not a pre-implementation test.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC1/AC2's conditional-emission behaviour (does the model choose correctly) | Live-model judgment call, not a deterministic code path | Manual verification scenario (🔴) in the AC verification script; real-world accuracy tracked via Benefit Metric 3 post-launch |
