# DoR Contract Proposal: Render discovery scope and feature/epic taxonomy grouping

**Story reference:** artefacts/2026-07-16-product-rollup/stories/pr-s7.md

## What will be built

A taxonomy-grouping function reading each feature's epic-nesting structure and `discoveryArtefact` path from pr-s2's cached rollup record, producing grouped-by-epic plus ungrouped sections, rendered on `/products/:id`.

## What will NOT be built

Full discovery-artefact content rendered inline. Editing/reorganising the taxonomy from this view. The cross-story consistency check against pr-s4's rendered health view — moved to the epic level (`pr-e2-dimensions.md`'s integration check) per review finding 7-M1.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit tests: epic-grouping correctness, no-double-count on ambiguous stale-field shape | Unit |
| AC2 | Unit test on per-feature scope-summary/link rendering | Unit |
| AC3 | Unit test with zero epics, confirming no misleading empty section | Unit |
| AC4 | Unit test + integration test confirming this story's own total matches pr-s2's cache record total (self-contained, not compared against pr-s4) | Unit + Integration |

## Assumptions

The cross-story total-count consistency check (originally embedded in AC4 before review finding 7-M1) is tracked at the epic level, not as an AC of this story or pr-s4 — confirmed once both stories are implemented, not part of either's own DoR sign-off.

## Estimated touch points

Files: a new taxonomy-grouping function (or addition to pr-s2's rollup-computation module), `src/web-ui/routes/products.js` (render)
Services: None new
APIs: None new — reads only from pr-s2's cache table
