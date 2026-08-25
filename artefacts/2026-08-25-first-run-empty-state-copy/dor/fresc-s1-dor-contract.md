# Contract Proposal — fresc-s1: Add orientation copy to two first-run empty states, and gate the Modules card on feature count

**What will be built:**
In `src/web-ui/routes/products.js`:
1. In `_renderProductView` (line ~729), gate the existing `_renderModulesManagement(productId, modules, csrfToken)` call (line ~932) behind `features.length > 1`.
2. Inside `_renderModulesManagement` (line ~634), add one short line of explanatory text under the "Modules" heading (line ~656), wrapped in a stable, identifiable element (e.g. `id="a1-modules-hint"`) so tests can assert presence without pinning exact wording.
3. Inside `_renderProductDashboard`'s empty-state branch (line ~146-151), add one short line of explanatory text near "No products yet", wrapped in a stable element (e.g. `id="sw-products-empty-hint"`). This function is shared by both `/dashboard` (list view) and `/dashboard?view=board` (board view, since `bvnd-s1`), so this single change reaches both surfaces.
4. Repair 5 pre-existing tests in `tests/check-a1-modules-taxonomy-crud.js` (lines 467, 475, 486, 494, 502) whose `features`/`journeys` fixtures currently produce 0 features and assert the Modules card IS present — update those fixtures to 2+ features so they continue to exercise the markup they're actually testing, under the new gate.
5. Write `tests/check-fresc-s1-empty-state-clarity-copy.js` per the test plan (8 tests: 6 unit + 2 integration).

**What will NOT be built:**
- No change to `a3`/`a4`'s module-distribution strip (`_renderScaleGauge`, `_renderConsolidatedFeaturesSection`, `_renderModuleSection`) — a separate, already-correctly-gated rendering path.
- No new onboarding flow, tooltip system, or guided tour.
- No configurability of the ">1" threshold — it is a fixed constant per the operator's stated direction.
- No change to module CRUD behaviour itself (create/rename/delete) — only its visibility precondition and one line of surrounding copy.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | `modulesCardHiddenWithZeroFeatures`, `modulesCardHiddenWithExactlyOneFeature` (unit, direct `_renderProductView` calls); `handleGetProductViewReflectsVisibilityGateEndToEnd` (integration, through the route handler) | unit + integration |
| AC2 | `modulesCardVisibleWithTwoFeatures`, `moduleCrudMarkupUnchangedWhenCardVisible` (unit) | unit |
| AC3 | `productEmptyStateIncludesExplanatoryLine`, `productListNonEmptyStateUnaffected` (unit); `boardViewEmptyStateAlsoIncludesExplanatoryLine` (integration, through `handleGetDashboard`) | unit + integration |
| AC4 | Covered collectively by the 5 repaired pre-existing tests + `moduleCrudMarkupUnchangedWhenCardVisible` + `productListNonEmptyStateUnaffected`, plus a full-suite regression run at `/verify-completion` | unit + full-suite |

**Assumptions:**
- The operator's stated threshold ("hide until multiple features") means `features.length > 1` (i.e. 0 and 1 both hide; 2+ shows) — not `>= 1`. This is stated explicitly in the story and tested at the boundary (`modulesCardHiddenWithExactlyOneFeature`).
- Exact copy wording for both explanatory lines is not fixed by this contract — draft wording is suggested in the story/test plan, final wording is confirmed via the AC verification script's manual scenarios (Scenario 2 and Scenario 3) before merge, not asserted verbatim in automated tests.
- `features` in `_renderProductView`'s signature is the same array already used elsewhere in that function for epic/feature counting (confirmed via `_renderScaleGauge`'s `epicCount = features.length` pattern at line ~589) — no new data fetch is required to read its length at the `_renderModulesManagement` call site.

**Estimated touch points:**
Files: `src/web-ui/routes/products.js`, `tests/check-fresc-s1-empty-state-clarity-copy.js`, `tests/check-a1-modules-taxonomy-crud.js` (fixture repair only)
Services: None
APIs: None — no new route, no schema change
