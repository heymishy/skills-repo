# DoR Contract Proposal: Add repo association columns to the products table

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s1.1.md

## What will be built

A new migration function (e.g. `migrateProductRepoColumns(pool)` in `src/web-ui/modules/product-repo.js`, mirroring `user-roles.js`'s `migrateTeamSchema` convention) that idempotently adds three nullable columns to the existing `products` table: `repo_provider`, `repo_owner`, `repo_name`. Wired into `server.js`'s existing DATABASE_URL-gated startup migration block, alongside the other `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` calls already there.

## What will NOT be built

Any logic to populate these columns — that's `prc-s1.2`. No UI change — this story has no user-facing surface at all.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Mocked pool asserts the exact `ALTER TABLE` SQL shape | Integration |
| AC2 | Mocked pool seeded with a pre-existing row, assert null columns post-migration | Integration |
| AC3 | Run the migration function twice against the same mocked pool, assert no error/duplication | Integration |

## Assumptions

The new columns live on the existing `products` table, not a new `product_repos` join table — consistent with the story's own framing of "one repo per product for now" (MVP scope item 1).

## Estimated touch points

Files: `src/web-ui/modules/product-repo.js` (new), `src/web-ui/server.js` (wiring)
Services: None
APIs: None — this story is schema-only
