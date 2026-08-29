## Story: Drift-comparator recognizes labeled and multi-target edges

**Epic reference:** epics/diagram-validation-drift-and-sequence-type.md
**Discovery reference:** artefacts/2026-08-29-diagram-validation-and-types/discovery.md
**Benefit-metric reference:** artefacts/2026-08-29-diagram-validation-and-types/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **Tech lead / squad lead relying on drift-check results for delivery governance**,
I want to **have `drift-comparator.js`'s `parseFlowchartMermaid` correctly recognize labeled edges (`-->|text|`) and multi-target edges (`A --> B & C`)**,
So that **a MATCHED or DIVERGED signal reflects the real diagram content, not an artifact of the parser's narrow regex**.

## Benefit Linkage

**Metric moved:** Drift-comparator parsing accuracy
**How:** Directly closes 2 of the 3 named parsing gaps by adding fixture-verified support for these two mermaid constructs, both currently unhandled by `EDGE_RE`/`NODE_DECL_RE` in `src/modules/drift-comparator.js`.

## Architecture Constraints

- Hand-rolled parsing only, no new npm dependency (stack constraint, `discovery.md`'s Constraints section) — extend the existing regex-based approach, do not introduce a mermaid AST parser library.
- **Testing standards** (`.github/standards/testing/test-design-patterns.md`, added this session): a test asserting `parseFlowchartMermaid` correctly handles labeled/multi-target edges must be mutation-tested (temporarily revert the fix, confirm the test fails for the expected reason) before being trusted — a passing test alone doesn't prove the parser genuinely handles the new syntax rather than passing by coincidence.

## Dependencies

- **Upstream:** None (independent of S1/S2).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a mermaid flowchart edge written as `A -->|creates| B`, When `parseFlowchartMermaid` parses it, Then the resulting edge object captures the label ("creates") in addition to the existing from/to information, and `compareProgramDesign`/`compareSystemArchitecture` treat it as the same edge as an unlabeled `A --> B` for topology-diff purposes — a label difference alone is not a drift signal in this story's scope.

**AC2:** Given a mermaid flowchart edge written as `A --> B & C` (one source, multiple targets), When `parseFlowchartMermaid` parses it, Then the result contains two separate edges (A→B and A→C) — matching how the same relationships would appear if authored as two separate lines.

**AC3:** Given a drift comparison where the as-designed diagram uses `A --> B & C` and the as-built diagram independently expresses the same two relationships as separate `A --> B` and `A --> C` lines, When `compareProgramDesign` runs, Then the result is MATCHED — this is the regression case that fails today, since `EDGE_RE` does not match the `&` syntax and both edges are currently silently unparsed.

**AC4:** Given the existing single-line, single-target edge syntax already supported today, When `parseFlowchartMermaid` parses it after this change, Then behaviour is unchanged — all existing `drift-comparator.js` tests continue to pass unmodified.

## Out of Scope

- Subgraphs — that is S4's scope.
- Any change to `parseErDiagramMermaid` — labeled and multi-target edges are flowchart-only mermaid concepts; ER diagrams don't have them.

## NFRs

- **Performance:** Parsing remains synchronous with no added model/network calls, matching `drift-comparator.js`'s existing zero-latency design.
- **Security:** Not applicable.
- **Accessibility:** Not applicable.
- **Audit:** Not applicable — parsing correctness is verified by test, not a runtime audit event.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
