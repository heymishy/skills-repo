# Contract Proposal: Drift-comparator recognizes subgraphs

**Story reference:** artefacts/2026-08-29-diagram-validation-and-types/stories/s4-drift-comparator-subgraphs.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-29

---

## What will be built

- Extend `parseFlowchartMermaid` in `src/modules/drift-comparator.js` to recognize `subgraph NAME ... end` blocks: node declarations inside the block are captured into the same flat `nodes` array as top-level declarations (subgraph membership is not tracked as a separate concept, since neither `compareProgramDesign` nor `compareSystemArchitecture` need it — they only diff nodes/edges, not grouping).
- Ensure the line-by-line parsing loop correctly resumes top-level parsing after an `end` line, so nodes/edges declared after a subgraph closes are not mis-attributed.
- No changes to `_diffNodesAndEdges`, `compareProgramDesign`, or `compareSystemArchitecture` — subgraph membership is invisible to them by design (AC3's MATCHED requirement falls out naturally from nodes/edges being flattened identically regardless of subgraph wrapping).

## What will NOT be built

- Nested subgraphs — explicitly deferred per the story's Out of Scope.
- Any visual/layout handling of subgraphs — parsing only.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Parse a flowchart with a subgraph containing 2 nodes; assert both appear in the flat `nodes` result | Unit |
| AC2 | Parse a flowchart with an edge crossing a subgraph boundary; assert both endpoints resolve correctly | Unit |
| AC3 | Compare a subgraph-grouped as-designed diagram against a flat as-built equivalent; assert MATCHED | Integration |
| AC4 | Re-run S3's tests and all pre-existing `drift-comparator.js` tests; assert no regressions | Unit |

## Assumptions

- None beyond what's stated in the story.

## Estimated touch points

Files: `src/modules/drift-comparator.js` (`parseFlowchartMermaid`'s parsing loop only, same function S3 touches — sequenced after S3 per the story's own stated dependency). Services: none. APIs: none.
