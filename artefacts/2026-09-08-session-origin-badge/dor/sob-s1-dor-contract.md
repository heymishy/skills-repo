# Contract Proposal — Shared session-origin derivation + product feature-list indicator

**What will be built:**
- A new pure function `deriveSessionOrigin({ hasJourney, completedStages })` in `src/web-ui/routes/features.js` (colocated with `_resolveResumeLinksForFeature`), returning `"fully-session-backed"`, `"mixed"`, `"no-session"`, or `null`.
- A new injectable bulk-lookup seam in `src/web-ui/routes/products.js`: `_getSessionOriginBulk(journeyIds)` / `setGetSessionOriginBulk(fn)`, defaulting to a lazy require of a new `getSessionOriginForJourneys(journeyIds)` function added to `src/web-ui/adapters/journey-store-pg.js` (a sibling to the existing `getArtefactCountsForJourneys`), mirroring `_getArtefactCountsBulk`'s exact shape (real-by-default, test-injectable — not a D37 stub-throws adapter).
- Wiring into `handleGetProductView`/`_renderProductView`: build the bulk-call ID list from `mergedItems.filter(item => item.journeyId).map(item => item.journeyId)` (not the raw `rows` array), call `_getSessionOriginBulk` once, and render the resulting indicator inline on each feature row using the existing `sw-pill`-style markup convention.

**What will NOT be built:**
- Wiring into `/journey` or org kanban (sob-s2, sob-s3).
- Any click/drill-down interaction on the indicator — it is a static, non-interactive glyph with a `title`/`aria-label` tooltip only.
- A taxonomy merge for org kanban, or any change to which cards `_mergeStateFeaturesIntoJourneyList` synthesizes.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test: `deriveSessionOrigin` with all-`sessionId` `completedStages` returns `"fully-session-backed"` | unit |
| AC2 | Unit test: mixed `sessionId` presence returns `"mixed"` | unit |
| AC3 | Unit test: `hasJourney: true`, no `sessionId` anywhere, returns `"no-session"` | unit |
| AC4 | Integration test: `mergedItems` fixture with a taxonomy-only (no `journeyId`) entry renders "no session" | integration |
| AC5 | Unit test (`completedStages: []` → `null`) + integration test (zero-completed-stage journey renders no indicator element) | unit + integration |
| AC6 | Integration test: `setGetSessionOriginBulk` spy call count === 1 for a multi-row render | integration |
| AC7 | Integration test: spy throws, page still renders 200 with no indicators | integration |
| AC8 | Integration test: every rendered state's element has a non-empty `title`/`aria-label` | integration |
| AC9 | Unit test: `hasJourney: false` always yields `"no-session"`; `hasJourney: true` + empty array yields `null` — both from the same empty `completedStages` input | unit |

**Assumptions:**
- `mergedItems` (from `_productRollup.mergeFeatureSources`) is available in `_renderProductView`'s existing scope with no signature change needed — confirmed by reading the real code during `/design` and `/definition`.
- No real `DATABASE_URL`/Postgres connection is available in the standard local/CI test run; `getSessionOriginForJourneys`'s real SQL correctness is verified against real `wuce-staging` data post-merge, not in this story's own automated tests (documented gap in `sob-s1-test-plan.md`).

**Estimated touch points:**
Files: `src/web-ui/routes/features.js` (new `deriveSessionOrigin`), `src/web-ui/routes/products.js` (new bulk seam + wiring into `handleGetProductView`/`_renderProductView`), `src/web-ui/adapters/journey-store-pg.js` (new `getSessionOriginForJourneys`), `tests/check-sob-s1-session-origin-derivation.js` (new), `tests/check-sob-s1-product-list-integration.js` (new), `scripts/run-all-tests.js` (register the two new test files).
Services: Postgres `journeys` table (read-only, existing table, no schema change).
APIs: None new.
