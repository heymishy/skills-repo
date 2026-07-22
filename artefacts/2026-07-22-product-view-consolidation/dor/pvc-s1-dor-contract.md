**Contract Proposal — Consolidate product view features section with tabs and filters**

**What will be built:**
Two new functions in `src/web-ui/modules/product-rollup.js`: `mergeFeatureSources(taxonomy, journeyFeatures)` (dedupe by feature_slug, taxonomy metadata wins, journey stage carried through) and `groupItemsByPhase(items)` (epic/phase grouping over the merged list, mirrors the pre-tmc-s1 taxonomy Epics/Other-features shape). `groupTaxonomyByModule` is generalized into a lower-level `groupItemsByModule(items, assignmentMap, modules)` that both the existing taxonomy-only path and the new merged path can call (kept backward compatible — no removal of the existing exported name). `routes/products.js`'s `_renderProductView` is rewritten to build one merged, enriched item list (health/coverage attached from the existing `healthBySlug`/`coverageBySlug` maps) and render ONE consolidated section with 3 tabs (By Module / By Phase / All) and 2 client-side filters (health chips, search input), replacing both the old a4 journeys-module section and the tmc-s1 taxonomy-module section. Tab markup/JS reuses `settings.js`'s exact `sw-settings-tab`-equivalent pattern, namespaced as `pvc-tab*`/`pvcShowTab`.

**What will NOT be built:**
Server-side filtering or pagination. Any change to the Test Coverage breakdown's own "Epics" heading. Any nav/Settings changes. Any change to module CRUD UI.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration test counting module-name heading occurrences in rendered HTML | integration |
| AC2 | Unit test, overlapping slug precedence | unit |
| AC3 | Unit test, journeys-only slug surfaces | unit |
| AC4 | Unit test (bucketing) + integration test (default-active tab, empty bucket) | unit / integration |
| AC5 | Unit test, phase bucketing | unit |
| AC6 | Unit test, count-parity across all 3 groupings | unit |
| AC7 | Integration test, chip markup + data-health attributes | integration |
| AC8 | Integration test, search input + data-search attributes | integration |
| AC9 | Integration test, zero-modules fallback unchanged | integration |

**Assumptions:**
`feature_slug` is the correct, already-established dedup key across both data sources (confirmed: `journeys.feature_slug` is `NOT NULL`, per tmc-s1's own unification revision; taxonomy items are keyed the same way). No new persistence — this is a render-layer-only consolidation.

**Estimated touch points:**
Files: `src/web-ui/modules/product-rollup.js` (new merge/phase-group functions, generalized module-group function), `src/web-ui/routes/products.js` (`_renderProductView` rewrite — new tab/filter markup, removal of the old dual-section rendering), a new test file `tests/check-pvc-s1-consolidate-and-tab-features-view.js`.
Services: None (no schema change).
APIs: None (no new routes).
