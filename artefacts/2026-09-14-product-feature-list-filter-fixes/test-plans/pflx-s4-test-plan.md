# Test Plan: Populate a real pipeline stage for taxonomy-sourced feature-list items, not just journey-sourced ones (pflx-s4)

**Story:** artefacts/2026-09-14-product-feature-list-filter-fixes/stories/pflx-s4-populate-stage-for-taxonomy-items.md
**Track:** Short-track

---

## Test Cases

Two touchpoints, mirroring `healthBySlug`'s own precedent exactly:

| Test | AC | Type | File | Description |
|------|----|------|------|-------------|
| T1 | AC1 | Behavioural | `tests/check-pflx-s4-taxonomy-item-stage.js` | `computeHealthCounts` returns `perFeature` entries each carrying a real `stage` field matching the input feature's own `stage` |
| T2 | AC1 | Regression | same | A feature with no `.stage` at all in `pipeline-state.json` produces `perFeature[i].stage === undefined` (no fabricated value) |
| T3 | AC2 | Behavioural | same | A taxonomy-only `mergedItems` entry (no `.stage` from `mergeFeatureSources`) whose `featureSlug` matches a `pipeline-state.json` feature at `stage: 'definition-of-done'` renders with `data-active="false"` |
| T4 | AC3 | Regression | same | A journey-sourced item with its own live `item.stage` set renders using that value — the feature-level pipeline-state lookup does not override it, even when the two disagree |
| T5 | AC4 | Regression | same | A taxonomy-only item with no matching `pipeline-state.json` feature at all renders with `item.stage` still `undefined` and `data-active="true"` — no false-positive hiding |
| T6 | AC5 | Regression | `tests/check-pr-s2-product-rollup.js` | Existing `computeHealthCounts` tests re-run unmodified and still pass |

## Regression coverage

- `check-pdt-s1-consolidate-epic-list.js`, `check-pdt-s3-deemphasize-unknown-health.js`, `check-pr-s2-products-route.js`, `check-shb-s1-story-health-badge-fix.js` — all touch `computeHealthCounts` indirectly; re-run to confirm the additive `stage` field introduces no regression.
- `pflx-s1`/`pflx-s2`/`pflx-s3`'s own test suites re-run to confirm this upstream data fix doesn't change their own already-correct client-side logic.

## Out of Scope (per story)

- `mergeFeatureSources()`'s own name/epicName precedence rules.
- Backfilling `pipeline-state.json` features with no `.stage`.
- Any change to client-side filter/count logic in `products.js`'s inline script.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
