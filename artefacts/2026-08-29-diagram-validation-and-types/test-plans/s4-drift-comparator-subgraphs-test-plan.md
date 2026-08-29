## Test Plan: Drift-comparator recognizes subgraphs

**Story reference:** artefacts/2026-08-29-diagram-validation-and-types/stories/s4-drift-comparator-subgraphs.md
**Epic reference:** artefacts/2026-08-29-diagram-validation-and-types/epics/diagram-validation-drift-and-sequence-type.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-29

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Nodes inside a subgraph are captured, not dropped | 1 test | — | — | — | — | 🟢 |
| AC2 | Edges crossing a subgraph boundary resolve correctly | 1 test | — | — | — | — | 🟢 |
| AC3 | Subgraph-grouped as-designed vs. flat as-built compares MATCHED | — | 1 test | — | — | — | 🟢 |
| AC4 | S3's tests and existing non-subgraph tests still pass (regression) | 1 test | — | — | — | — | 🟢 |

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
| AC1 | A mermaid flowchart with a `subgraph NAME ... end` block containing 2+ node declarations | Synthetic | None | |
| AC2 | A flowchart with a subgraph and an edge from a node inside it to a node outside it | Synthetic | None | |
| AC3 | An as-designed diagram grouping components into a subgraph; an as-built diagram with the same nodes/edges, no subgraph | Synthetic | None | |
| AC4 | S3's own fixtures, plus pre-existing non-subgraph `drift-comparator.js` fixtures | Synthetic | None | Full regression run |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### nodesInsideSubgraphAreCapturedNotDropped

- **Verifies:** AC1
- **Precondition:** Mermaid source: `subgraph Backend\n  A[Service A]\n  B[Service B]\nend`.
- **Action:** Call `parseFlowchartMermaid` with this source.
- **Expected result:** The result's `nodes` array contains both `A` (label "Service A") and `B` (label "Service B") — identical to how they'd appear if declared outside any subgraph.
- **Edge case:** No.

### edgeAcrossSubgraphBoundaryResolvesCorrectly

- **Verifies:** AC2
- **Precondition:** Mermaid source with `subgraph Backend\n  A[Service A]\nend\nC[Service C]\nA --> C`.
- **Action:** Call `parseFlowchartMermaid`.
- **Expected result:** The edge `{from: A, to: C}` is captured with `fromLabel: "Service A"` and `toLabel: "Service C"` correctly resolved, regardless of `A` being inside the subgraph and `C` outside it.
- **Edge case:** Yes — boundary-crossing case.

### s3RegressionAndExistingNonSubgraphFixturesStillPass

- **Verifies:** AC4 (regression)
- **Precondition:** S3's own test fixtures (labeled/multi-target edges) plus all pre-existing `drift-comparator.js` fixtures.
- **Action:** Re-run the full `drift-comparator.js` test suite after this story's changes.
- **Expected result:** All S3 tests and all pre-existing tests continue to pass unmodified.
- **Edge case:** No.

---

## Integration Tests

### subgraphGroupedAsDesignedMatchesFlatAsBuilt

- **Verifies:** AC3
- **Components involved:** `parseFlowchartMermaid` → `compareSystemArchitecture` (and `compareProgramDesign`)
- **Precondition:** As-designed mermaid groups `A[Service A]` and `B[Service B]` inside `subgraph Backend`. As-built mermaid (from real call-graph extraction, which never emits subgraphs) expresses the same two nodes and their edges with no subgraph wrapping.
- **Action:** Run `compareSystemArchitecture(asDesigned, asBuilt)`.
- **Expected result:** Result status is `MATCHED` — subgraph grouping alone must not register as a structural difference.

---

## NFR Tests

### subgraphParsingAddsNoModelOrNetworkCall

- **NFR addressed:** Performance
- **Measurement method:** Same as S3 — assert parsing/comparison functions remain synchronous, no new async call sites introduced.
- **Pass threshold:** No latency regression.
- **Tool:** Node test runner.

---

## Out of Scope for This Test Plan

- Nested subgraphs (a subgraph within a subgraph) — deferred per the story's own Out of Scope section.
- Visual subgraph styling or layout direction — parsing structure only.

---

## Test Gaps and Risks

None — all 4 ACs have full unit/integration coverage.
