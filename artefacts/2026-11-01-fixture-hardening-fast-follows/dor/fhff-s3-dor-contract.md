# Contract Proposal: Extend journeys.js/products.js fixture adoption and DRY-extract the fixture-usage-check scripts

**Story reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/stories/fhff-s3-mechanical-fixture-dry-batch.md
**Test plan reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/test-plans/fhff-s3-test-plan.md
**Date:** 2026-11-01

---

## What will be built

- Migrate 3-5 more real `journeys.js`-touching test files (chosen during implementation) to `tests/helpers/journeys-fixture.js`.
- New `tests/helpers/products-fixture.js` (default shape grounded in a direct read of the real `products.js` handler code, same discipline as `journeys-fixture.js`'s own grounding), its self-test (`tests/check-fhff-s3-products-fixture-self-test.js`), a structural check (`scripts/check-products-fixture-usage.js`), and 1 real `products.js`-touching file migrated to it.
- A new shared factory `scripts/lib/make-fixture-usage-check.js`; `scripts/check-journey-fixture-usage.js`, `scripts/check-skills-fixture-usage.js`, and `scripts/check-journeys-fixture-usage.js` rewritten to call it, with zero behaviour change.
- A new regression-fixture pair (hand-rolled + compliant) for `check-skills-fixture-usage.js`, closing the coverage gap found at `/test-plan`, plus its own test file.

## What will NOT be built

- Full completion of the `journeys.js` retrofit beyond the 3-5 file batch.
- `products.js`'s full retrofit beyond the 1 proof-of-pattern migration.
- Any behaviour change to the 3 scripts' own detection logic beyond sharing it through the factory.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration test per migrated file: run it, confirm identical pass count to before migration | integration |
| AC2 | Unit test (fixture self-test: field coverage, fresh-instance, overrides-merge) + Integration test (migrated file's assertions unchanged) | unit + integration |
| AC3 | Unit test (mutation-test pair: hand-rolled flagged, migrated passed) | unit |
| AC4 | Unit test (new `check-skills-fixture-usage.js` regression pair) + Integration test (existing `journey.js`/`journeys.js` regression fixtures re-run, confirmed unchanged) | unit + integration |
| AC5 | Integration test — re-run `tfhc-s7`'s own existing windowed-match regression fixture against the refactored shared factory | integration |

## Assumptions

- `products.js`'s real session/request shape can be derived directly from its own handler code during implementation — to be confirmed by reading the real code, not assumed from the fixture's own intended shape.

## Estimated touch points

**Files:** 3-5 real `journeys.js`-touching files (TBD during implementation), `tests/helpers/products-fixture.js` (new), `tests/check-fhff-s3-products-fixture-self-test.js` (new), `scripts/check-products-fixture-usage.js` (new), 1 real `products.js`-touching file (TBD), `scripts/lib/make-fixture-usage-check.js` (new), `scripts/check-journey-fixture-usage.js` (modified), `scripts/check-skills-fixture-usage.js` (modified), `scripts/check-journeys-fixture-usage.js` (modified), a new `check-skills-fixture-usage.js` regression-fixture pair + test file (new)
**Services:** None
**APIs:** None

**schemaDepends:** N/A — Dependencies block is "None."
