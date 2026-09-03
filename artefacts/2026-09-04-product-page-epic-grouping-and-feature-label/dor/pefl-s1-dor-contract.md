# Contract Proposal: Grouped item rows show the parent feature's own name instead of repeating the epic group header, and epic-grouped view becomes the default when a product has more than one epic

**Story reference:** artefacts/2026-09-04-product-page-epic-grouping-and-feature-label/stories/pefl-s1-feature-name-not-epic-name-on-grouped-rows.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-04

---

## What will be built

1. In `computeTaxonomyRollup` (`src/web-ui/modules/product-rollup.js`): the epic-nested item mapping gains `featureName: feature.name`, alongside the existing `slug`/`featureSlug`. No change to `groupItemsByPhase`, `groupItemsByModule`, or any other function.
2. In `_renderPvcItemRow` (`src/web-ui/routes/products.js`): add a third, optional parameter `preferFeatureName`. When truthy, `subLabel = item.stage || item.featureName || ''`; when falsy/omitted (every existing call site), behaviour is byte-for-byte identical to today (`item.stage || item.epicName || ''`).
3. In `_renderConsolidatedFeaturesSection`'s `byPhaseHtml` construction: add a thin wrapper `_renderPvcItemRowForPhase = function(item) { return _renderPvcItemRow(item, false, true); }` (matching the existing `_renderPvcItemRowWithCheckbox` convention), and use it in place of the bare `_renderPvcItemRow` reference in both `.map(...)` calls at the By Phase tab's own group/other-items rendering.
4. In `_renderConsolidatedFeaturesSection`'s `defaultTab` computation: change from `modules.length === 0 ? 'phase' : 'module'` to `byPhase.byPhase.length > 1 ? 'phase' : (modules.length === 0 ? 'phase' : 'module')` — reuses the `byPhase` value already computed earlier in the same function (no new call to `groupItemsByPhase`).

## What will NOT be built

- Any change to the epic group header's own text (`_renderModuleSection`, called with `p.epicName` as the header label) — unchanged.
- A dedicated authored product-level summary/blurb — explicitly ruled out during scoping; the confirmed ask is per-row feature-name labeling, not new authored prose.
- Any change to `_renderPvcItemRowWithCheckbox`'s own sub-label computation — it delegates to the same underlying `_renderPvcItemRow`, called with the same 2-argument shape as before, so it is unaffected without any direct change.
- Deduplication of identical epic names across different features in the same product.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Item with distinct `epicName`/`featureName`; assert `_renderPvcItemRow(item, false, true)` output contains `featureName`, not `epicName` | unit |
| AC2 | Same item; assert `_renderPvcItemRow(item)` and `_renderPvcItemRow(item, true)` still use `epicName` (today's exact behaviour) | unit (regression guard) |
| AC3 | 2-epic-group fixture with ≥1 module; assert By Phase renders as the active tab | unit |
| AC4 | 0- and 1-epic-group fixtures; assert `defaultTab` matches `ppg-s1`'s own pre-existing AC3/AC6 behaviour exactly | unit (regression guard) |
| AC5 | Object- and bare-string-shaped story fixture (reusing `fal-s1`'s own AC2 fixture); assert `featureName` is present alongside unchanged `slug`/`featureSlug` values | unit (regression guard) |

## Assumptions

- `feature.name` is already loaded into memory by `computeTaxonomyRollup`'s own existing `features.forEach` loop — confirmed via direct code reading; no new read is required, only capturing a value already in scope.
- `groupItemsByPhase` pushes each item object through its bucketing unchanged (no field allowlist/stripping) — confirmed via direct code reading; the new `featureName` field survives bucketing with zero changes to that function.
- `byPhase.byPhase.length` (the real, rendered epic-group count) is a more precise "is grouping worth defaulting to" signal than a raw `taxonomy.groups.length` count, since the latter could include epics that end up empty after health/journey merging — using the already-computed, already-bucketed value costs nothing extra and matches what actually renders.

## Estimated touch points

Files: `src/web-ui/modules/product-rollup.js` (`computeTaxonomyRollup`), `src/web-ui/routes/products.js` (`_renderPvcItemRow`, `_renderConsolidatedFeaturesSection`), `tests/check-pefl-s1-*.js` (new).
Services: None new.
APIs: None new.
