## Story: Drift-comparator recognizes subgraphs

**Epic reference:** epics/diagram-validation-drift-and-sequence-type.md
**Discovery reference:** artefacts/2026-08-29-diagram-validation-and-types/discovery.md
**Benefit-metric reference:** artefacts/2026-08-29-diagram-validation-and-types/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **Tech lead / squad lead relying on drift-check results for delivery governance**,
I want to **have `drift-comparator.js`'s `parseFlowchartMermaid` correctly recognize subgraphs**,
So that **a System Architecture or Program Design diagram using subgraphs to group related components doesn't silently break drift detection for everything inside the group**.

## Benefit Linkage

**Metric moved:** Drift-comparator parsing accuracy
**How:** Closes the third and final named parsing gap from discovery.

## Architecture Constraints

- Same as S3 — hand-rolled regex-based parsing, no new dependency, extends the existing parser rather than replacing it.

## Dependencies

- **Upstream:** S3 (shares the same parser function `parseFlowchartMermaid`; sequencing after S3 keeps each story's diff independently reviewable rather than one large parser rewrite).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a mermaid flowchart containing a `subgraph NAME ... end` block wrapping one or more node declarations, When `parseFlowchartMermaid` parses it, Then every node declared inside the subgraph is captured in the result exactly as if declared outside one — subgraph membership does not cause a node to be silently dropped.

**AC2:** Given a mermaid flowchart with edges crossing into or out of a subgraph boundary, When `parseFlowchartMermaid` parses it, Then the edge is captured correctly with both endpoints resolved to their correct labels, regardless of which side of the boundary they're declared on.

**AC3:** Given an as-designed diagram that groups components into a subgraph and an as-built diagram (from real call-graph extraction, which does not use subgraphs) expressing the same nodes/edges without any subgraph wrapping, When `compareSystemArchitecture` or `compareProgramDesign` runs, Then the result is MATCHED — subgraph grouping is a purely visual/organizational construct and must not itself register as a structural difference.

**AC4:** Given the existing non-subgraph flowchart syntax, When `parseFlowchartMermaid` parses it after this change, Then behaviour is unchanged — S3's tests and all pre-existing `drift-comparator.js` tests continue to pass.

## Out of Scope

- Nested subgraphs (a subgraph within a subgraph) — mermaid supports this, but it's rare enough to defer; extend if a real diagram needs it rather than building speculatively now.
- Visual subgraph styling or layout direction — structural parsing only, not rendering.

## NFRs

- **Performance:** No added latency, same as S3.
- **Security:** Not applicable.
- **Accessibility:** Not applicable.
- **Audit:** Not applicable — parsing correctness is verified by test.

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
