# DoR Contract Proposal: Designate Product as a named primitive and register skills-framework as a product

**Story reference:** artefacts/2026-07-16-product-rollup/stories/pr-s1.md

## What will be built

A one-time seed function creating skills-framework's own row in the existing `products` table (`repo_owner`/`repo_name` pointing at this repository, scoped to the operator's own `tenant_id`), wired into `server.js`'s existing startup migration/seed block. A documentation edit to `docs/concepts/README.md` adding "Product" as an eighth primitive entry, describing the existing `products` table/UI rather than a new schema.

## What will NOT be built

The sync mechanism (fetching/caching a connected repo's `pipeline-state.json`) — that's pr-s2. No new UI beyond what `/products/:id` already renders for any product.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Seeded/mocked Postgres pool asserts the row is created with correct fields and tenant_id | Unit |
| AC1 (idempotency) | Run the seed function twice against the same mock, assert no duplicate | Unit |
| AC2 | Integration test against `_renderProductView` for the seeded row | Integration |
| AC3 | Unit test reading the real committed `docs/concepts/README.md` file | Unit |
| AC4 | Two-tenant fixture, unit tests confirming isolation in both directions | Unit |

## Assumptions

The seed step runs once at server startup (same pattern as existing schema migrations), not as an on-demand admin action — consistent with how other one-time schema/seed changes in this codebase are wired.

## Estimated touch points

Files: a new seed function (likely alongside `product-repo.js` or in `server.js`'s existing startup block), `docs/concepts/README.md`
Services: None
APIs: None — this story has no new HTTP surface
