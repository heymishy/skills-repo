# DoR Contract Proposal: Render aggregate AC coverage on the product rollup view

**Story reference:** artefacts/2026-07-16-product-rollup/stories/pr-s6.md

## What will be built

An AC-coverage aggregation function computing a blended percentage (sum of `acVerified` / sum of `acTotal` across features with AC data, excluding features with none), rendered alongside test coverage on `/products/:id` with a clearly distinct label.

## What will NOT be built

AC-coverage trend over time. Per-AC (not per-feature) detail.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test proving the blended calculation | Unit |
| AC2 | Unit test with a no-acTotal feature confirming exclusion | Unit |
| AC3 | Integration test rendering both test-coverage and AC-coverage with distinct labels | Integration |
| AC4 | Unit test with zero AC-having features, confirming explicit "no data" state | Unit |

## Assumptions

Same blended-calculation-method [ASSUMPTION] as pr-s5, pending `/clarify` — this story's implementation must stay consistent with pr-s5's chosen method.

## Estimated touch points

Files: a new aggregation function (or addition to pr-s2's rollup-computation module), `src/web-ui/routes/products.js` (render)
Services: None new
APIs: None new — reads only from pr-s2's cache table
