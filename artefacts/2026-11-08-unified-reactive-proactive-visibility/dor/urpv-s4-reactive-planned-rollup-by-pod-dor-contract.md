## Contract Proposal — Reactive-vs-planned load rollup by pod

**What will be built:**
A rollup computation (location: likely `src/web-ui/modules/product-rollup.js` or a sibling module) that iterates the merged item list already produced by `computeTaxonomyRollup`/`mergeFeatureSources` (now carrying `track` from urpv-s2 and `decisions.md`-sourced items from urpv-s3), classifies each item reactive (`track: "short"` or `decisions.md`-sourced) or planned (everything else), resolves pod attribution via the existing `getFeaturePodAssignments`/`getProductDefaultPod` (`pod-assignment-store.js`), falling back to a single "Unassigned" bucket when neither resolves, and renders the per-pod reactive/planned counts as an additional tab/chip within `_renderConsolidatedFeaturesSection`, reusing the existing tab/chip pattern already shipped on that view.

**What will NOT be built:**
Historical/trend tracking of the reactive/planned ratio over time — current-snapshot count only. Per-individual-engineer breakdown within a pod — scoped to pod-level per the story's own Architecture Constraints.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit tests: reactive/planned classification; three-step pod-fallback resolution | unit |
| AC2 | Unit test: pod row shows two distinct counts, not blended | unit |
| AC3 | Unit test: zero pods configured → single "Unassigned" row with full split | unit |
| AC4 | Integration test: rollup reachable via existing tab/chip pattern, no separate page | integration |

**Assumptions:**
- `getFeaturePodAssignments`/`getProductDefaultPod`'s existing call signatures are sufficient for this read-only rollup use — no modification to `pod-assignment-store.js` itself.
- The existing tab/chip rendering pattern already shipped on `_renderConsolidatedFeaturesSection` is extensible to a new tab without structural changes to that pattern.

**Estimated touch points:**
Files: `src/web-ui/modules/product-rollup.js` (or sibling — rollup computation), `src/web-ui/routes/products.js` (_renderConsolidatedFeaturesSection — new tab/chip rendering). Services: none new. APIs: none new.

**schemaDepends:** `["dorStatus"]` — Dependencies names urpv-s2 and urpv-s3 as upstream (this rollup counts both reactive-work sources those stories introduce). `dorStatus` confirmed present in `.github/pipeline-state.schema.json`.

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs, including the degenerate "Unassigned"-bucket case (AC3) which the story's own Architecture Constraints explicitly frame as a correct, honest outcome rather than an error state.
