# Contract Proposal: Drift-comparator recognizes labeled and multi-target edges

**Story reference:** artefacts/2026-08-29-diagram-validation-and-types/stories/s3-drift-comparator-labeled-multi-target-edges.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-29

---

## What will be built

- Extend `EDGE_RE` (or add a second regex alongside it) in `src/modules/drift-comparator.js`'s `parseFlowchartMermaid` to recognize `A -->|label| B` syntax, capturing the label as a new `label` field on the edge object without changing the existing `from`/`to`/`fromLabel`/`toLabel` fields' meaning.
- Extend the edge-parsing logic to recognize `A --> B & C` syntax, expanding it into two separate edge objects (`{from:A,to:B}`, `{from:A,to:C}`) at parse time — the `&`-syntax is fully resolved before the result reaches `compareProgramDesign`/`compareSystemArchitecture`, so no downstream comparison logic needs to know about it.
- No changes to `_diffNodesAndEdges`, `compareProgramDesign`, or `compareSystemArchitecture` themselves — they already operate correctly on `{from,to,fromLabel,toLabel}` edge objects; this story only ensures more mermaid syntax variants correctly produce that shape.

## What will NOT be built

- Subgraph support — S4's scope.
- Any change to `parseErDiagramMermaid`.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Parse `A -->|creates| B`; assert label captured, and MATCHED against an unlabeled equivalent | Unit |
| AC2 | Parse `A --> B & C`; assert two separate edge objects | Unit |
| AC3 | Compare an as-designed `A --> B & C` against an as-built two-line equivalent; assert MATCHED | Integration |
| AC4 | Re-run full existing `drift-comparator.js` suite; assert no regressions | Unit |

## Assumptions

- None beyond what's stated in the story — this is a self-contained parsing extension with no external dependencies or ambiguous scope boundaries.

## Estimated touch points

Files: `src/modules/drift-comparator.js` (`parseFlowchartMermaid`'s regex constants and parsing loop only — `_diffNodesAndEdges`/`compareProgramDesign`/`compareSystemArchitecture` are unmodified). Services: none. APIs: none.
