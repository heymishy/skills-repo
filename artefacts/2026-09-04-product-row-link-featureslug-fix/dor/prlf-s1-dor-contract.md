# Contract Proposal: Product page row links use the resolved feature slug, not the raw (potentially colliding) story slug

**Story reference:** artefacts/2026-09-04-product-row-link-featureslug-fix/stories/prlf-s1-use-featureslug-in-row-links.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-04

---

## What will be built

1. In `_renderPvcItemRow` (`src/web-ui/routes/products.js`): change the row link's `href` from `'/features/' + _escapeHtml(item.slug)` to `'/features/' + _escapeHtml(item.featureSlug || item.slug)`.
2. Writes the 3 tests from the test plan (AC1–AC3), as direct calls to the already-exported `_renderPvcItemRow` function.

## What will NOT be built

- Any change to `computeTaxonomyRollup`, `groupItemsByModule`, or `groupItemsByPhase` — the `featureSlug` field this story reads is already computed and correct.
- Any change to `handleGetFeatureArtefacts`'s own server-side resolver (`fal-s1`'s taxonomy-scan fallback) — remains in place for non-product-page navigation paths.
- Any anchor/fragment (`#p3.3`) added to the link — the artefact page doesn't yet consume such a fragment; speculative, not in scope.
- Any change to `_renderPvcItemRowWithCheckbox` or `_renderPvcItemRowForPhase`'s own wrapper logic — both delegate to `_renderPvcItemRow`, so this single fix covers all three call paths (By Module, By Phase, All) automatically.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Item with differing `slug`/`featureSlug`; assert href uses `featureSlug` | unit |
| AC2 | Item with no `featureSlug`; assert href falls back to `slug` | unit (regression guard) |
| AC3 | The real, confirmed `p3.3` collision's own slugs; assert href resolves unambiguously | unit |

## Assumptions

- `item.featureSlug` is reliably absent (not `null`, not empty string — genuinely `undefined`) for top-level items, since `computeTaxonomyRollup`'s own `ungrouped[]` mapping never sets that key — confirmed via direct code reading. `item.featureSlug || item.slug` is therefore a safe, correct fallback, not a guess.
- No other call site constructs a `_renderPvcItemRow`-style link independently (bypassing this function) — confirmed via `grep` for `href="/features/` across `products.js`; this is the only construction site.

## Estimated touch points

Files: `src/web-ui/routes/products.js` (`_renderPvcItemRow` only), `tests/check-prlf-s1-*.js` (new).
Services: None new.
APIs: None new.
