# DoR Contract Proposal: Delete (detach) a product

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s4.2.md

## What will be built

A delete route handler that removes the product row, its journeys, and its standards cache rows from Postgres — with an explicit assertion path proving zero calls are ever made to any GitHub repo-delete endpoint.

## What will NOT be built

Deleting the underlying GitHub repo (never, by design). Soft-delete/undo.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Delete product, assert pool deletions + zero GitHub delete-endpoint calls | Integration |
| AC2 | UI copy check (confirmation wording) | Manual |
| AC3 | GET deleted product's URL, assert clean 404-equivalent | Integration |

## Assumptions

None new.

## Estimated touch points

Files: product delete route handler
Services: Postgres only — GitHub API is asserted to receive zero calls, not invoked at all
APIs: None invoked (the absence of a call is what's tested)
