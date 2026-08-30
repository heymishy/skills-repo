# Contract Proposal: Drift-comparator recognizes subgraphs

**Story reference:** artefacts/2026-08-29-diagram-validation-and-types/stories/s4-drift-comparator-subgraphs.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-29

---

## What will be built

**Corrected 2026-08-30 during implementation planning — see decisions.md ASSUMPTION entry.** Empirical testing against the current, unmodified `parseFlowchartMermaid` (4 scenarios: plain subgraph, quoted display-name header, a `direction` sub-line with edges crossing the subgraph boundary both ways, and combined with S3's labeled/multi-target edge syntax) found it ALREADY parses subgraphs correctly with zero code changes — `subgraph`/`end`/`direction` lines simply don't match `NODE_DECL_RE`/`EDGE_RE` and are silently skipped, while nested declarations are matched individually regardless of indentation. This story's actual deliverable:

- **No production code change to `src/modules/drift-comparator.js`.**
- Dedicated test coverage (`tests/check-s4-drift-comparator-subgraphs.js`) proving AC1-AC4 against the existing, already-correct implementation — this closes the benefit-metric's M2 target ("dedicated passing fixtures... for subgraphs"), which was about an untested gap, not a broken one.
- The mutation-testing check (this story's own Architecture Constraint) is satisfied differently than S3's: since there is no fix to revert, the check instead temporarily introduces a deliberate, real bug into `parseFlowchartMermaid` itself (a naive "skip every line between `subgraph` and `end`" mutation — a plausible bug a less careful implementation might actually ship), confirms the new tests fail for that exact reason (nodes dropped), then reverts to the real, unmodified, already-correct code and confirms the tests pass again. This proves the tests have real detection power against the specific failure mode this story exists to guard against, not just confirmation of pre-existing correctness by coincidence.

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
