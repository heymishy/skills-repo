## Test Plan: Progress proxy for unknown-health features

**Story reference:** artefacts/2026-07-25-feature-display-name-and-progress/stories/fps-s1-progress-proxy-for-unknown-health.md

## AC Coverage

| AC | Description | Integration | Gap type | Risk |
|----|-------------|-------------|----------|------|
| AC1 | unknown health + N>0 artefacts -> stage + count label | 1 test | — | 🟢 |
| AC2 | unknown health + 0 artefacts -> stage + "no artefacts yet" | 1 test | — | 🟢 |
| AC3 | unknown health, no journeyId -> plain fallback text | 1 test | — | 🟢 |
| AC4 | bulk read throws -> graceful fallback, no page break | 1 test | — | 🟢 |
| AC5 | green/amber/red rows completely unchanged | 1 test | — | 🟢 |
| AC6 | exactly one batched call per render | 1 test | — | 🟢 |

## Integration Tests

### unknownHealthWithArtefactsShowsStageAndCount
- **Verifies:** AC1
- **Precondition:** item with `health: 'unknown'`, `journeyId` set, stubbed `_getArtefactCountsBulk` returning `{ [journeyId]: 3 }`, `stage: 'definition'`
- **Action:** Render the product detail page
- **Expected result:** Coverage label reads `"definition · 3 artefacts"` (exact wording per s2.2's pluralisation convention)

### unknownHealthWithZeroArtefactsShowsNoArtefactsYet
- **Verifies:** AC2
- **Precondition:** same as above but count is `0`
- **Expected result:** Coverage label reads `"definition · no artefacts yet"`

### unknownHealthNoJourneyIdFallsBackToPlainText
- **Verifies:** AC3
- **Precondition:** item with `health: 'unknown'`, no `journeyId` (taxonomy-only item)
- **Expected result:** Coverage label reads `"No test data yet"`, unchanged from pre-story behaviour

### bulkReadFailureDoesNotBreakPageRender
- **Verifies:** AC4
- **Precondition:** stubbed `_getArtefactCountsBulk` rejects
- **Action:** Render the product detail page
- **Expected result:** Page renders successfully (200); all `unknown`-health rows show `"No test data yet"` (fallback), matching s2.2's own AC5 precedent

### realHealthRowsUnchanged
- **Verifies:** AC5
- **Precondition:** items with `health: 'green'`, `'amber'`, `'red'` and real `coverageLabel` percentages
- **Expected result:** Rendered output byte-identical to pre-story output for these rows

### exactlyOneBatchedCallPerRender
- **Verifies:** AC6
- **Precondition:** 5 items with `health: 'unknown'` and resolvable `journeyId`s
- **Action:** Render the product detail page; spy on `_getArtefactCountsBulk` call count
- **Expected result:** Called exactly once, with all 5 journey IDs, not once per row

## Out of Scope for This Test Plan

- Re-testing `getArtefactCountsForJourneys`'s own SQL/batching correctness — pre-existing, covered by s2.2's own test suite.
- Re-testing the kanban board's own artefact badge (`kanban-view.js`) — unchanged by this story.
