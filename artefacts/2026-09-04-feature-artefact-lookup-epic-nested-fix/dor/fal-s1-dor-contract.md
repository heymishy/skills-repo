# Contract Proposal: Feature artefact page resolves epic-nested stories (object and bare-string shaped) to their real feature directory before looking up artefacts

**Story reference:** artefacts/2026-09-04-feature-artefact-lookup-epic-nested-fix/stories/fal-s1-resolve-real-feature-slug-before-artefact-lookup.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-04

---

## What will be built

1. In `computeTaxonomyRollup` (`src/web-ui/modules/product-rollup.js`): change the epic-nested story slug extraction from `story.slug || story.id` to `typeof story === 'string' ? story : (story.slug || story.id)`, so a bare-string story reference resolves to itself instead of producing `undefined`. `featureSlug` assignment (`feature.slug`) is unchanged; no other function in this file is touched.
2. In `features.js`: extract `_resolveBreadcrumbContext`'s existing tenant-scoped taxonomy-scan logic into a shared resolver function that, in addition to its current breadcrumb output, also returns the matched item's real `featureSlug` (or the raw slug unchanged when the fast path already resolved directly, or when nothing resolves at all).
3. In `handleGetFeatureArtefacts`: call the shared resolver once, before the artefact fetch. Thread its resolved feature slug into the two currently-raw-slug-keyed calls: `_journeyStore.getJourneyByFeatureSlug` and `_listArtefacts`. `_resolveResumeLinksForFeature` takes the `journeyForPage` object (not a slug) and is corrected automatically once `getJourneyByFeatureSlug` receives the resolved slug — no separate change needed there.
4. Update `_resolveBreadcrumbContext`'s own call site (used for breadcrumb rendering) to reuse the same single resolution computed in step 3, rather than running the taxonomy-scan query a second time for the same request.
5. Update the existing `feature_artefacts_accessed` audit log call (`_logger.info`, line ~321) to log the resolved real feature slug in place of the raw URL slug, so the audit trail reflects which artefacts were actually looked up.
6. Writes the 6 tests from the test plan (AC1–AC5, including AC2's own 2-part split), extending `tests/check-pdt-s4-story-breadcrumb.js`'s established mock pattern (`setListArtefacts`, `setJourneyStoreModule`, mocked `pool.query`) with call-argument capture (a spy wrapping the mocked functions) so the tests assert which feature slug was actually passed downstream, not just the rendered output.

## What will NOT be built

- Any change to `_listArtefacts`'s own internal logic (local filesystem scan, GitHub API fallback, Postgres merge) — untouched, already covered by its own existing tests.
- Any change to `_renderStoryBreadcrumb`'s own display logic, or the artefact page's `displayTitle` fallback (still shows the raw story ID as the final breadcrumb segment) — confirmed unaffected by this story's own scope.
- Duplicate story-slug collision resolution across products/features — explicitly out of scope per the story; the resolver returns the first match found, identical to `pdt-s4`'s own pre-existing behaviour today.
- Any change to how `pipeline-state.json` stores stories (object vs bare-string shape) — read-path fix only.
- A second, independent Postgres query for the artefact-fetch path — the existing taxonomy-scan query result is reused for both breadcrumb and artefact-list resolution.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Object-shaped epic-nested story fixture (`lphf-s2` → `featureSlug: '2026-08-08-landing-page-hero-features'`); spy on `_listArtefacts`/`getJourneyByFeatureSlug` mocks, assert they were called with the resolved slug, not the raw URL slug | unit |
| AC2 (part 1) | `computeTaxonomyRollup` called directly with a bare-string `epics[0].stories` fixture (`['p3.1a', 'p3.1b']`); assert `result.groups[0].items[].slug` equals the string itself, not `undefined` | unit |
| AC2 (part 2) | Route-handler-level test with a bare-string-shaped taxonomy fixture (representing the now-fixed `computeTaxonomyRollup` output); same call-argument-capture approach as AC1 | unit |
| AC3 (regression) | `journeyForPage` resolves directly (top-level feature); spy on the tenant-scoped taxonomy query, assert it was never called; assert `_listArtefacts` still received the raw (correct) slug | unit |
| AC4 (regression) | No `journeyForPage` match, no taxonomy match; assert "No artefacts found for this feature" still renders | unit |
| AC5 (regression) | Re-run `tests/check-pdt-s4-story-breadcrumb.js` unmodified; all existing assertions still pass | unit (no new test — existing file as regression guard) |

## Assumptions

- `_resolveBreadcrumbContext`'s existing tenant-scoped taxonomy query (`SELECT p.product_id, p.name, pr.taxonomy FROM product_rollups pr JOIN products p ON p.product_id = pr.product_id WHERE p.tenant_id = $1`) already returns everything Fix 2 needs — confirmed via direct code reading; no schema or query change required, only reusing its own already-scanned result for a second purpose.
- The pre-existing `tests/check-pdt-s4-story-breadcrumb.js` test for the epic-nested case does not currently assert which feature slug was passed to `_listArtefacts` — confirmed by direct reading; it will keep passing unmodified after this fix (its own assertions are about breadcrumb text, which is unchanged), and is reused as-is for AC5, not rewritten.
- Fix 1 (bare-string handling in `computeTaxonomyRollup`) must land before Fix 2's own AC2 test can pass end-to-end, since AC2's route-handler-level test depends on the taxonomy fixture actually carrying a resolved `slug` for the bare-string case — sequencing this as one task, not two independently-mergeable ones, since Fix 2 is meaningless for AC2 without Fix 1.

## Estimated touch points

Files: `src/web-ui/modules/product-rollup.js` (`computeTaxonomyRollup`), `src/web-ui/routes/features.js` (`_resolveBreadcrumbContext`, `handleGetFeatureArtefacts`), `tests/check-fal-s1-*.js` (new).
Services: None new.
APIs: None new — reuses the existing tenant-scoped `product_rollups.taxonomy` query.
