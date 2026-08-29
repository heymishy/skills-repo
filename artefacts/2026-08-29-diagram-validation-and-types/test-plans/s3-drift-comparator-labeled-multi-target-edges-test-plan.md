## Test Plan: Drift-comparator recognizes labeled and multi-target edges

**Story reference:** artefacts/2026-08-29-diagram-validation-and-types/stories/s3-drift-comparator-labeled-multi-target-edges.md
**Epic reference:** artefacts/2026-08-29-diagram-validation-and-types/epics/diagram-validation-drift-and-sequence-type.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-29

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Labeled edges parsed, label doesn't affect topology-diff identity | 2 tests | — | — | — | — | 🟢 |
| AC2 | Multi-target edge (`A --> B & C`) parses into two separate edges | 1 test | — | — | — | — | 🟢 |
| AC3 | Multi-target as-designed vs. two-line as-built compares MATCHED | — | 1 test | — | — | — | 🟢 |
| AC4 | Existing single-line, single-target syntax unaffected (regression) | 1 test | — | — | — | — | 🟢 |

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
| AC1 | A mermaid flowchart string containing `A -->|creates| B` | Synthetic | None | |
| AC2 | A mermaid flowchart string containing `A --> B & C` | Synthetic | None | |
| AC3 | An as-designed diagram using `A --> B & C` and an as-built diagram with the equivalent expressed as two separate lines | Synthetic | None | |
| AC4 | Existing pre-change flowchart fixtures (single-line, single-target) | Synthetic | None | Reuse existing `drift-comparator.js` test fixtures |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### labeledEdgeCapturesLabelAndFromToNodes

- **Verifies:** AC1
- **Precondition:** Mermaid source containing `A[Service A] --> B[Service B]` with a label: `A -->|creates| B`.
- **Action:** Call `parseFlowchartMermaid` with this source.
- **Expected result:** The resulting edge object has `from`/`to`/`fromLabel`/`toLabel` populated exactly as an unlabeled edge would, plus a new `label` field containing `"creates"`.
- **Edge case:** No.

### labeledEdgeTreatedSameAsUnlabeledForTopologyDiff

- **Verifies:** AC1
- **Precondition:** As-designed diagram has `A -->|creates| B`; as-built diagram (or fixture) has the same relationship as a plain `A --> B`.
- **Action:** Run `compareProgramDesign` (or `compareSystemArchitecture`) across the two.
- **Expected result:** MATCHED — a label-only difference does not register as a structural drift signal in this story's scope.
- **Edge case:** Yes — proves label differences alone aren't (yet) a drift signal.

### multiTargetEdgeParsesIntoTwoSeparateEdges

- **Verifies:** AC2
- **Precondition:** Mermaid source containing `A --> B & C`.
- **Action:** Call `parseFlowchartMermaid`.
- **Expected result:** The result's `edges` array contains exactly two entries: `{from: A, to: B}` and `{from: A, to: C}` — not one malformed/unparsed entry, and not silently dropped.
- **Edge case:** No.

### existingSingleLineSingleTargetEdgesUnaffected

- **Verifies:** AC4 (regression)
- **Precondition:** All pre-existing `drift-comparator.js` test fixtures using plain `A --> B` syntax.
- **Action:** Re-run the full existing `drift-comparator.js` test suite against the updated parser.
- **Expected result:** All pre-existing tests continue to pass unmodified — zero regressions.
- **Edge case:** No.

---

## Integration Tests

### multiTargetAsDesignedMatchesTwoLineAsBuilt

- **Verifies:** AC3
- **Components involved:** `parseFlowchartMermaid` → `compareProgramDesign`
- **Precondition:** As-designed mermaid: `A --> B & C`. As-built mermaid (independently generated, e.g. by `call-graph-extractor.js`'s own two-line convention): `A --> B` and `A --> C` on separate lines.
- **Action:** Run `compareProgramDesign(asDesigned, asBuilt)`.
- **Expected result:** Result status is `MATCHED` — this is the regression case that fails today (both edges are currently silently unparsed by `EDGE_RE`, since it never matches `&`-syntax).

---

## NFR Tests

### parsingAddsNoModelOrNetworkCall

- **NFR addressed:** Performance
- **Measurement method:** Assert `parseFlowchartMermaid` and `compareProgramDesign` remain synchronous functions with no `await`/promise introduced by this change.
- **Pass threshold:** Function signatures remain synchronous; no new async call sites.
- **Tool:** Node test runner, static/structural check via function inspection or simply asserting the call completes synchronously.

---

## Out of Scope for This Test Plan

- Subgraphs — covered by S4's own test plan.
- Any change to `parseErDiagramMermaid` — not applicable, ER diagrams have no labeled/multi-target edge concept.

---

## Test Gaps and Risks

None — all 4 ACs have full unit/integration coverage.
