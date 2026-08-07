# DoR Contract Proposal: Render aggregate test coverage on the product rollup view

**Story reference:** artefacts/2026-07-16-product-rollup/stories/pr-s5.md

## What will be built

A test-coverage aggregation function computing a blended percentage (sum of `testPlan.passing` / sum of `testPlan.totalTests` across features with testPlan data, excluding features with none), plus per-feature detail, rendered on `/products/:id`.

## What will NOT be built

Test-coverage trend over time. Per-test (not per-feature) detail.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test proving the blended calculation, not an average of percentages; integration test on the rendered route | Unit + Integration |
| AC2 | Unit test with a no-testPlan feature confirming exclusion | Unit |
| AC3 | Unit test confirming per-feature detail is retrievable | Unit |
| AC4 | Unit test with zero testPlan-having features, confirming explicit "no data" state | Unit |

## Assumptions

The blended (sum/sum) calculation method is discovery's own [ASSUMPTION], still pending `/clarify` confirmation — the contract and tests below implement it as currently specified in the story.

## Estimated touch points

Files: a new aggregation function (or addition to pr-s2's rollup-computation module), `src/web-ui/routes/products.js` (render)
Services: None new
APIs: None new — reads only from pr-s2's cache table
