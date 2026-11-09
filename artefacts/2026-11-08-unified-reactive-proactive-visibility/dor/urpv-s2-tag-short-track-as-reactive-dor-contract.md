## Contract Proposal — Tag short-track features as reactive work in the consolidated features view

**What will be built:**
In `src/web-ui/modules/product-rollup.js`'s `computeTaxonomyRollup`, carry each feature object's real `track` field through to the emitted item, defaulting to `"standard"` only when the key is genuinely absent (not when falsy-but-present). In the same module's `mergeFeatureSources`, resolve `track` from the taxonomy source on overlap, following the same resolution pattern already used for `name`/`epicName`. In `src/web-ui/routes/products.js`'s `_renderConsolidatedFeaturesSection`, render a visible "Reactive" / "Planned" text-label tag on each item's card, using a `DESIGN.md` token class (no inline colour), in both the By Module and By Phase tab views.

**What will NOT be built:**
Any new filtering mechanism keyed on `track` — that is urpv-s4's scope. This story only tags; it does not add a filter UI control.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit tests on `computeTaxonomyRollup` for real-value pass-through and absent-vs-falsy default distinction | unit |
| AC2 | Unit test on `mergeFeatureSources` overlap resolution | unit |
| AC3 | Integration test rendering both tab views, asserting a "Reactive" text node | integration |
| AC4 | Unit + integration test asserting zero items incorrectly tagged "Reactive" when none exist | unit, integration |

**Assumptions:**
- The exact rendered label text ("Reactive" vs. a synonym) is confirmed against the story's own AC3 wording at implementation time; the test plan already notes this is "to be confirmed against the story's chosen convention," not tied to one specific string beyond "distinguishable from Planned."
- `DESIGN.md`'s existing token classes are sufficient to express the tag's visual distinction (success/warn-style tokens already exist) — no new token is being proposed.

**Estimated touch points:**
Files: `src/web-ui/modules/product-rollup.js` (computeTaxonomyRollup, mergeFeatureSources), `src/web-ui/routes/products.js` (_renderConsolidatedFeaturesSection — tag rendering in both tab views). Services: none new. APIs: none new.

**schemaDepends:** `["dorStatus"]` — this story's Dependencies block names urpv-s1 as upstream ("a product with no real synced data has nothing to tag"). The coding agent must confirm urpv-s1's `dorStatus` is `"signed-off"` in `.github/pipeline-state.json` before beginning implementation. `dorStatus` is a valid field in `.github/pipeline-state.schema.json`.

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs. No mismatch: AC1/AC2 are pure-function unit-testable data transforms; AC3/AC4 are DOM-text-node integration assertions, matching the test plan's own classification (no CSS-layout dependency). Architecture Constraints (MC-A11Y-02 text label, `product/constraints.md` #9 design-token compliance, no change to `computeOverallHealthSignal`) are all reflected in the proposed touch points.
