## Implementation Plan: Reactive-vs-planned load rollup by pod

**Story reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/stories/urpv-s4-reactive-planned-rollup-by-pod.md
**Test plan reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/test-plans/urpv-s4-reactive-planned-rollup-by-pod-test-plan.md

---

## File map

| File | Change |
|------|--------|
| `src/web-ui/modules/reactive-pod-rollup.js` (new) | `resolvePodContext` (async, one `getFeaturePodAssignments` per journey, never throws), `computePodRollup` (pure), `renderPodRollupTab` (tab button + panel markup, tokens only, all text escaped) |
| `src/web-ui/routes/products.js` | `handleGetProductView` builds the pod context once and passes it as a new LAST parameter (`podContext`) through `_renderProductView` to `_renderConsolidatedFeaturesSection`, which adds a "By Pod" tab and panel only when a context is supplied |
| `tests/check-urpv-s4-reactive-planned-rollup-by-pod.js` (new) | Unit tests plus integration tests that drive the real `handleGetProductView` with a fake pool answering the real pod SQL and the real artefact-fetcher seam for decisions.md |
| `tests/check-ep4-s2-nav-and-product-link.js` | One source-text regex extended to also allow the trailing `podContext` argument (another story's test; disclosed) |

## Task 1 (AC1, AC2, AC3) - pure rollup

- Failing test first: classification (short-track plus decisions.md items reactive, rest planned), three-step pod fallback, distinct counts, zero-pods single Unassigned row, done items excluded, multi-pod feature counted under each pod.
- Implementation: `computePodRollup`. Pod membership is read from `pod_assignments` (feature_id = journeys.journey_id) joined to `pods`; taxonomy-only items have no journey and fall to the product default pod, then Unassigned.

## Task 2 (AC1) - pod context resolution

- Failing test first: real-route test asserting tenant-scoped pod queries, one per journey, and that the product default pod is not read a second time (the page's existing `defaultPod` is reused).
- Implementation: `resolvePodContext`; a failed lookup sets `lookupFailed` and the panel says so rather than silently mislabelling.

## Task 3 (AC4) - render and wire (separate task: handler vs wiring)

- Failing test first: real `handleGetProductView` output contains the `By Pod` tab button and panel in the same response, no link to another page; counts rendered as text including a real zero; pod name escaped.
- Implementation: append `podContext` as the last parameter of both render functions; one extra tab button and one panel at the existing insertion points; everything else stays in the new module.

## Verification commands

```
node tests/check-urpv-s4-reactive-planned-rollup-by-pod.js
node scripts/check-design-tokens.js src/web-ui/modules/reactive-pod-rollup.js
node scripts/check-design-tokens.js src/web-ui/routes/products.js
```
Expected: 17 passed; module PASS; products.js reports the same pre-existing RISK-ACCEPTed non-token colours as master (36), none introduced.
