**Contract Proposal — Register product-feature journeys in the shared in-memory store**

**What will be built:**
`handlePostProductFeature` (`routes/products.js`) rewritten to call `_journeyStore.createJourney(...)` (generating its own journeyId) then `_journeyStore.setJourneyFields(journeyId, {featureSlug, ownerId, tenantId, productId})` — mirroring `handlePostJourney`'s already-proven pattern exactly — instead of a raw, direct `INSERT INTO journeys` SQL statement. `journey-store-pg.js`'s `saveJourney()` SQL extended to write `journey.productId` into the real `product_id` column (in addition to `tenant_id`/`owner_id`/`feature_slug`/`data`), backward-compatible (existing callers that never set `productId` continue to persist `null`, matching today's default).

**What will NOT be built:**
Any change to `handlePostJourney` (already correct). Any retroactive repair of already-broken journeys. Any change to the `data` JSONB shape.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration test calling the real `handlePostProductFeature`, then `journeyStore.getJourney()` | integration |
| AC2 | Same call, asserting `activeSessionId`/`activeSkill` are populated | integration |
| AC3 | Unit test on `saveJourney`'s SQL/params + integration test tracing `productId` through to the adapter call | unit + integration |
| AC4 | Integration test: real handler creates journey → session marked done → real `handlePostGateConfirm` succeeds | integration |
| AC5 | Integration test: the existing product-view journeys-listing SQL shape picks up the created row | integration |

**Assumptions:**
`journeyId` can be derived from `createJourney()`'s own generated ID (reversing today's order, where `handlePostProductFeature` currently generates the ID first and derives the slug from it) — `featureSlug = 'new-feature-' + journeyId.slice(0, 8)` still holds, just computed after `createJourney()` returns rather than before it's called.

**Estimated touch points:**
Files: `src/web-ui/routes/products.js` (`handlePostProductFeature` rewrite), `src/web-ui/adapters/journey-store-pg.js` (`saveJourney` SQL extension), a new test file `tests/check-jrf-s2-register-product-feature-journeys.js`.
Services: None (no schema change — `product_id` column already exists).
APIs: None (no new routes).
