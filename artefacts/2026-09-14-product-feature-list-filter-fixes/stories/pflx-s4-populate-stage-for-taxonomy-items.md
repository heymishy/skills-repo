## Story: Populate a real pipeline stage for taxonomy-sourced feature-list items, not just journey-sourced ones

**Epic reference:** None — short-track (bug fix in already-shipped work from this same feature, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery; scope stated directly below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **the operator using "Active only" on a product's feature list (`pflx-s2`) — especially a taxonomy-heavy product like `skills-framework`, where most features are real, GitHub-synced completed work rather than live in-progress journeys**,
I want **every item's `stage` to be populated from real pipeline data, not just the small subset that happen to also have a live journey**,
So that **"Active only" actually hides completed features instead of silently having no effect at all**.

## Benefit Linkage

**Metric moved:** None formal — bug fix, per this story's own short-track Benefit Linkage convention.
**How:** Directly closes a gap found by live-verifying `pflx-s2`/`pflx-s3` against real production (`skills-framework.fly.dev`) immediately after their own deploys, at the operator's explicit request ("Same, just approved prod deploy but isn't filtering. Use Chrome review to confirm behaviour"). Direct JS inspection of the live DOM found all 1692 real `.pvc-item` rows across all three tabs carrying `data-active="true"` — meaning `pflx-s2`'s "Active only" filter had zero real effect on this product, despite working correctly against every synthetic test fixture.

## Architecture Constraints

- **Root cause:** `mergeFeatureSources()` (`src/web-ui/modules/product-rollup.js`) only ever sets `.stage` on an item when a live journey exists for that slug (either an overlap with a taxonomy item, or a journey-only item) — a purely taxonomy-sourced item (the majority of any product with substantial completed history) gets `slug`/`name`/`epicName`/`discoveryArtefact`/`featureSlug`/`source` only, never `.stage`. `pflx-s2`'s `activeAttr = item.stage !== 'definition-of-done'` then trivially evaluates `undefined !== 'definition-of-done'` — always `true` — for every taxonomy-only item.
- **Fix by extending the existing, already-proven per-feature lookup pattern**, not inventing a new one. `products.js` already builds `healthBySlug` from `healthCounts.perFeature` (itself built by `computeHealthCounts(pipelineState)` in `product-rollup.js`, reading `pipeline-state.json`'s real `features[].health`) — the exact same function already has full access to each `feature`'s own real `.stage` field and simply never surfaces it. Add `stage: feature.stage` to each `perFeature` entry `computeHealthCounts` already pushes, additively (confirmed via existing test assertions in `check-pr-s2-product-rollup.js` — none use `deepStrictEqual` against the whole `perFeature` shape, all narrow to specific fields, so this is a safe additive change).
- **Build a `stageBySlug` map in `products.js`**, mirroring `healthBySlug`'s own construction exactly (same source array, same iteration pattern).
- **Lookup key matches `healthBySlug`'s own precedent exactly**: `item.featureSlug || item.slug` — story-level items resolve to their parent feature's slug, feature-level items resolve to their own slug, identical to the existing `healthLookupKey` pattern already used for health.
- **Precedence: a journey-sourced item's own live `item.stage` wins over the pipeline-state feature-level lookup.** A live journey's `stage` reflects real-time in-progress state (e.g. mid-`/discovery`), which can be more current than the feature-level `pipeline-state.json` entry (which this session's own delivery pattern advances via explicit `bin/skills advance`/`gate-advance` calls, sometimes with a lag). Only fall back to the feature-level lookup when `item.stage` is not already set — this is a pure gap-fill, not a behavioural change for journey-sourced items.
- **This also incidentally fixes `_renderPvcItemRow`'s own pre-existing `subLabel` fallback** (`item.stage || ... item.epicName`) for taxonomy items — confirmed live that taxonomy items were showing their epic name instead of a real stage label even before this story, a latent gap this story's fix closes as a side effect, not a separately-scoped change.

## Dependencies

- **Upstream:** `pflx-s2` (the `data-active`/"Active only" feature whose real-world effectiveness this story restores) and `pflx-s3` (group counts, which will also become meaningful once `data-active` is correct) — both already merged and live in production.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given `computeHealthCounts(pipelineState)` is called, When inspecting the returned `perFeature` array, Then each entry additionally carries `stage: feature.stage` (the real, unmodified value from the input `pipeline-state.json` feature object) alongside the existing `slug`/`name`/`health` fields.

**AC2:** Given a `mergedItems` entry with no `.stage` set by `mergeFeatureSources` (a taxonomy-only item) and a matching `pipeline-state.json` feature (looked up via `item.featureSlug || item.slug`) with `stage: 'definition-of-done'`, When the item is rendered, Then its `data-active` attribute is `"false"`.

**AC3:** Given a journey-sourced item whose own `item.stage` is already set (e.g. `"discovery"`), When the item is rendered, Then its `data-active` reflects that live `item.stage` value — the feature-level pipeline-state lookup does not override it.

**AC4:** Given a taxonomy-only item with no matching entry in `pipeline-state.json` at all (a slug tracked only via GitHub-synced taxonomy, never through the CLI pipeline), When the item is rendered, Then `item.stage` remains `undefined` and `data-active` is `"true"` (the existing, safe default — an item with no completion signal is never hidden) — no new false-positive hiding is introduced.

**AC5 (regression guard):** Existing `computeHealthCounts` tests (`check-pr-s2-product-rollup.js` and others) continue to pass unmodified — the new `stage` field is purely additive to `perFeature` entries.

## Out of Scope

- Changing `mergeFeatureSources()`'s own precedence rule for taxonomy vs. journey metadata (name, epicName, etc.) — only `.stage` gains a new fallback source.
- Backfilling or migrating any `pipeline-state.json` feature that itself has no `.stage` set — this story only reads what already exists.
- Any change to `pflx-s1`/`pflx-s2`/`pflx-s3`'s own client-side filter logic — `data-active` continues to be computed exactly the same way from `item.stage`; only how `item.stage` itself gets populated changes.

## NFRs

- **Performance:** one additional map construction (`stageBySlug`), built once per product-view render from data already fetched for `healthBySlug` — no new query, no new I/O.
- **Security:** None — reads the same already-trusted `pipeline-state.json` data already used for health.
- **Correctness:** AC4 explicitly guards against a worse regression (a real, in-progress feature being wrongly hidden) — absence of data must never be treated as "done."

## Complexity Rating

**Rating:** 1 — a well-understood, narrowly-scoped fix once root-caused; reuses an exactly-proven existing pattern (`healthBySlug`) rather than inventing a new mechanism.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic
