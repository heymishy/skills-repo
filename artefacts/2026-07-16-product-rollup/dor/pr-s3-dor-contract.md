# DoR Contract Proposal: Show last-synced freshness and a manual refresh action

**Story reference:** artefacts/2026-07-16-product-rollup/stories/pr-s3.md

## What will be built

UI additions to `/products/:id` (via the `/frontend-design` skill): a human-readable last-synced timestamp, a "Refresh" action wired to pr-s2's sync mechanism, a "Not yet synced" state for products with no cache row, and a disabled/loading state on Refresh while a sync is in progress.

## What will NOT be built

Automatic staleness/change detection. Background or scheduled sync.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test on the timestamp-formatting function | Unit |
| AC2 | Integration test triggering Refresh against pr-s2's mocked sync mechanism | Integration |
| AC3 | Unit test rendering the freshness section with no cache row | Unit |
| AC4 | Unit test asserting disabled state during a controlled pending promise; integration test confirming a second concurrent Refresh doesn't start a second sync | Unit + Integration |

## Assumptions

None beyond what pr-s2 already establishes — this story is presentation-layer only, consuming pr-s2's cache table and sync trigger.

## Estimated touch points

Files: `/products/:id` view/template changes in `src/web-ui/routes/products.js`, possibly a small client-side script for the loading/disabled state
Services: None new — reuses pr-s2's sync mechanism
APIs: None new
