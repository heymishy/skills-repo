**Contract Proposal — Persist a feature-to-module join for taxonomy-sourced features**

**What will be built:**
A new `feature_module_assignments` Postgres table (`product_id`, `tenant_id`, `feature_slug`, `module_id`, `assigned_at`; primary key `(product_id, feature_slug)`; FK `module_id → product_modules(id) ON DELETE SET NULL`), created via a chained migration in `server.js` after the existing `product_modules` `CREATE TABLE` (mirrors the a1 `journeys.module_id` chaining pattern — required because of the FK dependency and the already-documented migration-race incident). New adapter functions added to the existing `src/web-ui/adapters/modules-adapter.js` (same D37-wired adapter a1 built, not a new one): `getFeatureModuleAssignments(productId, tenantId)`, `assignFeatureToModule(productId, tenantId, featureSlug, moduleId)`, `bulkAssignFeaturesToModule(productId, tenantId, featureSlugs, moduleId)`, `unassignFeature(productId, tenantId, featureSlug)`. `deleteModule` is extended to also null out any `feature_module_assignments` rows pointing at it, before the module row is deleted. A new render-layer helper (`src/web-ui/modules/product-rollup.js` or a small new module) joins `computeTaxonomyRollup`'s groups/ungrouped output against the assignment map into per-module buckets + an "Unclassified" bucket. `_renderProductView` (`routes/products.js`) uses this joined shape when at least one assignment exists for the product; falls back to today's exact existing render when zero assignments exist. One new CSRF-protected route: `POST /products/:id/modules/bulk-assign` (body: `{featureSlugs: [...], moduleId}`).

**What will NOT be built:**
Any UI pagination/virtualization for the Unclassified bucket beyond what already exists for the taxonomy section today. Any change to `journeys.module_id` or the a2 epic-reassignment flow — untouched. Any auto-classification/suggestion logic. Retroactive classification of any real product's existing feature set (that's a one-off operator action once this mechanism ships, not code scope).

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration test: assign → run `syncProductRollup` twice with different mock pipeline-state fixtures → re-read assignment | integration |
| AC2 | Unit test: mock pool call-counter, 300 synthetic slugs, assert exactly 1 query | unit |
| AC3 | Unit test: mock pool call-counter at 2 and 250 slugs, assert exactly 1 query each | unit |
| AC4 | Integration tests: cross-tenant read and cross-tenant bulk-assign, both asserting zero leakage/writes | integration |
| AC5 | Unit tests (join-shape correctness, byte-identical zero-assignment fallback) + integration test (real `handleGetProductView` render with partial classification) | unit / integration |
| AC6 | Unit test: delete a module with existing assignments, assert rows survive with `module_id: null`, ordering of UPDATE-before-DELETE asserted | unit |
| AC7 | Unit tests: missing/mismatched CSRF token rejected with 403 and zero writes; valid token proceeds (control case) | unit |

**Assumptions:**
`feature_slug` (the same field `computeTaxonomyRollup` already uses as each item's stable identity — `story.slug || story.id` for epic-nested stories, `feature.slug` for top-level features) is stable and unique per product across re-syncs; this is already relied upon implicitly by the existing taxonomy rendering and is not a new assumption this story introduces. The new table is additive/idempotent (`CREATE TABLE IF NOT EXISTS`) with no migration of existing data — matches this repo's established migration-track threshold (a1's own `product_modules` table used the same additive pattern without triggering the heavier H-MIG gate).

**Estimated touch points:**
Files: `src/web-ui/server.js` (table creation, chained migration), `src/web-ui/adapters/modules-adapter.js` (new functions + `deleteModule` extension), `src/web-ui/modules/product-rollup.js` (new join helper), `src/web-ui/routes/products.js` (render-path change + new bulk-assign route + CSRF guard), a new test file `tests/check-tmc-s1-persist-feature-module-classification.js`.
Services: Postgres (new table).
APIs: 1 new REST endpoint (`POST /products/:id/modules/bulk-assign`).
