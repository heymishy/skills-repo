## Definition of Ready: shb-s1 — Epic-nested story rows always show "Unknown" health instead of their real health

**Story:** artefacts/2026-08-10-story-health-badge-fix/stories/shb-s1-per-story-health-badge-fix.md
**Review artefact:** artefacts/2026-08-10-story-health-badge-fix/review/shb-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-10-story-health-badge-fix/test-plans/shb-s1-test-plan.md
**Date:** 2026-08-10

---

### Scope contract

**Files in scope (exact touchpoints):**
- `src/web-ui/modules/product-rollup.js` — `computeTaxonomyRollup`: when building epic-nested story items, add `featureSlug: feature.slug` alongside the existing `slug: story.slug || story.id`. `_flattenTaxonomy`: carry `featureSlug` through onto each flattened item (alongside the already-carried `epicSlug`/`epicName`).
- `src/web-ui/routes/products.js` — line ~656: change `healthBySlug.hasOwnProperty(item.slug) ? healthBySlug[item.slug] : 'unknown'` to look up `item.featureSlug || item.slug` first.
- New test file: `tests/check-shb-s1-story-health-badge-fix.js`.

**Files explicitly out of scope (must not be touched):**
- `product-rollup.js`'s `computeHealthCounts` — granularity stays feature-only, per the story's Architecture Constraints.
- `products.js`'s `_renderPvcItemRow` rendering logic itself (the label/color ternaries) — unchanged; only the data feeding `item.health` changes.
- Any `pipeline-state.json` schema or content change.

### Architecture Constraints

No new architectural decision — this is a data-inheritance fix within the existing taxonomy-flattening pipeline, using a field-threading pattern already established for `epicSlug`/`epicName` in the same function. No ADR required.

**Correctness note for the coding agent:** `mergeFeatureSources` (product-rollup.js:388) also needs to preserve `featureSlug` when it copies taxonomy items into `bySlug` (it currently does `Object.assign({}, item, {...})`-style spreads in places — confirm `featureSlug` survives that copy, since `_renderPvcItemRow` and the `products.js:656` lookup both operate on `mergedItems`, not the raw taxonomy output).

### Human oversight

**Low** — a well-understood, fully root-caused data-threading fix with no user-facing behavior change beyond correcting an already-broken display value. Matches the oversight level of other single-field-threading bug fixes this session.

### Coding Agent Instructions

1. In `src/web-ui/modules/product-rollup.js`'s `computeTaxonomyRollup` (~line 280-288), change the epic-nested story item construction from `{ slug: story.slug || story.id }` to `{ slug: story.slug || story.id, featureSlug: feature.slug }`.
2. In the same file's `_flattenTaxonomy` (~line 361-372), confirm `featureSlug` survives the `Object.assign({}, item, { epicSlug: ..., epicName: ... })` spread for grouped items (it should, since `item` already carries it from step 1) — the `ungrouped` branch's items never had `featureSlug` set and don't need it (their own `slug` already IS the feature slug).
3. In `mergeFeatureSources` (~line 388-420), confirm `featureSlug` is preserved when copying taxonomy items into `bySlug` — add it explicitly to the object literal if the current code hand-picks fields (`slug`, `name`, `epicName`, `discoveryArtefact`, `source`) rather than spreading the whole item.
4. In `src/web-ui/routes/products.js` (~line 656), change:
   ```javascript
   var realHealth = healthBySlug.hasOwnProperty(item.slug) ? healthBySlug[item.slug] : 'unknown';
   ```
   to:
   ```javascript
   var healthLookupKey = item.featureSlug || item.slug;
   var realHealth = healthBySlug.hasOwnProperty(healthLookupKey) ? healthBySlug[healthLookupKey] : 'unknown';
   ```
5. Write the 5 tests per the test plan.
6. Run the new test file, and re-run `tests/check-a4-*.js` / any existing `product-rollup.js`/`pvc-s1`-related test files unmodified — zero regression to existing passing tests.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Low)
- [x] No CSS-layout-dependent AC left unclassified (none — this is a data-correctness fix, health badges already exist visually; no new layout)

**PROCEED: Yes**
