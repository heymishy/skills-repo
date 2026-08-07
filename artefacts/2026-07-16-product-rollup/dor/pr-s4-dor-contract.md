# DoR Contract Proposal: Render aggregate health on the product rollup view

**Story reference:** artefacts/2026-07-16-product-rollup/stories/pr-s4.md

## What will be built

A health-count aggregation function (features grouped by green/amber/red/unknown, using `viz-functions.js`'s `fleetHealthLabel` label convention) and an overall product-health derivation function (red-takes-precedence, mirroring `featureActionMeta`'s pattern), both consuming pr-s2's cached rollup record and rendered on `/products/:id`.

## What will NOT be built

A weighted or percentage-based health score. Drill-down into which specific features are red/amber.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test on the count-and-label function; integration test on the rendered route | Unit + Integration |
| AC2 | Unit tests: one-red-among-many, one-red-alone | Unit |
| AC3 | Unit test: no-red-some-amber | Unit |
| AC4 | Unit tests: all-green, zero-features | Unit |

## Assumptions

The red-takes-precedence rule (discovery's own [ASSUMPTION]) is implemented as specified in the story's ACs; if `/clarify` changes this before implementation, the story and its tests need revision first.

## Estimated touch points

Files: a new aggregation module (or function within pr-s2's rollup-computation module), `src/web-ui/routes/products.js` (render)
Services: None new
APIs: None new — reads only from pr-s2's cache table
