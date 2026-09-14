# Definition of Done: Populate a real pipeline stage for taxonomy-sourced feature-list items, not just journey-sourced ones

**PR:** https://github.com/heymishy/skills-repo/pull/883 | **Merged:** 2026-09-14T06:56:27Z
**Merge commit:** 5a993e401e94a2b6057f2f6ca95850406ec6d8a0
**Story:** artefacts/2026-09-14-product-feature-list-filter-fixes/stories/pflx-s4-populate-stage-for-taxonomy-items.md
**Test plan:** artefacts/2026-09-14-product-feature-list-filter-fixes/test-plans/pflx-s4-test-plan.md
**DoR:** artefacts/2026-09-14-product-feature-list-filter-fixes/dor/pflx-s4-dor.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `computeHealthCounts`'s `perFeature` entries carry the real, unmodified `feature.stage` — T1, re-run fresh against merged master | Automated behavioural test (real function call, not a mock) | None |
| AC2 | ✅ | A taxonomy-only item with a matching `pipeline-state.json` feature at `stage: 'definition-of-done'` renders `data-active="false"` — T3, via the real `computeTaxonomyRollup` + `computeHealthCounts` + `_renderProductView` fixture pipeline | Automated behavioural test | None |
| AC3 | ✅ | A journey-sourced item's own live `stage` wins over a disagreeing pipeline-state feature-level value — T4 | Automated behavioural test | None |
| AC4 | ✅ | A taxonomy item with no matching `healthCounts.perFeature` entry at all keeps `data-active="true"` — no false-positive hiding — T5 | Automated behavioural test | None |
| AC5 | ✅ | `computeHealthCounts`'s existing tests (`check-pr-s2-product-rollup.js`, 37/37) pass unmodified — the `stage` field is purely additive | Automated regression test | None |

**All 5 ACs satisfied.** 5/5 new tests re-run fresh against merged master (commit `5a993e40`), 0 failures.

**Verification strength:** 5 behavioural (using the real `computeTaxonomyRollup`/`computeHealthCounts`/`_renderProductView` fixture pipeline already established by `check-shb-s1-story-health-badge-fix.js` — not synthetic item objects with hand-set fields, the exact gap that made `pflx-s2` inert in production), plus the original live production finding that directly motivated this story (all 1692 real `.pvc-item` rows on `skills-framework.fly.dev` showing `data-active="true"`, confirmed via direct Chrome JS inspection before this fix). **Live re-verification against real production after this deploy is the essential follow-up** — see DoD Observations below; this fix has not yet been re-checked against the exact same live scenario that first surfaced the bug, since production deploy requires the operator's manual approval.

---

## Scope Deviations

None. The merged diff (`src/web-ui/modules/product-rollup.js` — `computeHealthCounts`'s additive `stage` field, `src/web-ui/routes/products.js` — `stageBySlug` construction and the `realStage` lookup wired into `mergedItems`, `tests/check-pflx-s4-taxonomy-item-stage.js`, 3 new artefacts, `.github/pipeline-state.json`) maps directly to the story. `mergeFeatureSources()`'s own name/epicName precedence rules were left untouched exactly as scoped; no `pipeline-state.json` feature was backfilled or defaulted.

---

## Test Plan Coverage

**Tests passing:** 5/5 new, re-run fresh 2026-09-14 against merged master (commit `5a993e40`) — `tests/check-pflx-s4-taxonomy-item-stage.js`.

**Regression coverage:** `check-pr-s2-product-rollup.js` (37/37), `check-pr-s2-products-route.js` (28/28), `check-pdt-s1-consolidate-epic-list.js`, `check-pdt-s3-deemphasize-unknown-health.js`, `check-shb-s1-story-health-badge-fix.js`, `pflx-s1`/`pflx-s2`/`pflx-s3`, `check-pvc-s1-consolidate-and-tab-features-view.js`, `check-ppg-s1-decouple-modules-gate.js`, `check-pefl-s1-feature-name-not-epic-name.js`, `check-bmau-s1-bulk-assign-checkbox-ui.js` — all re-run clean before merge.

**Gaps:** None against the story's own ACs.

**Full regression suite (post-merge, fresh on master):** 658 files run, 1 failure — `tests/check-p3.5-validate-trace.js`, the pre-existing documented resource-contention flake. No new regressions.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | One additional map construction (`stageBySlug`), built once per product-view render from data already fetched for `healthBySlug` — no new query, no new I/O |
| Security | ✅ N/A | Reads the same already-trusted `pipeline-state.json` data already used for health |
| Correctness | ✅ | AC4 explicitly verified: absence of any match never means "done" — no worse regression (wrongly hiding real in-progress work) was introduced while fixing the original bug |

---

## Metric Signal

No formal benefit-metric artefact exists for this short-track feature. Directly closes the real production gap the operator found and asked to be investigated via direct browser verification, immediately after approving today's production deploy of `pflx-s1`/`pflx-s2`/`pflx-s3`.

---

## Outcome

**COMPLETE**

No deviations, no test gaps, no NFR gaps.

---

## DoD Observations

1. **Follow-up Action — re-verify against the exact live scenario that surfaced this bug.** Once a production deploy is approved, repeat the exact Chrome-based check performed during this story's own investigation: load `skills-framework`'s product page, confirm the "Active only" checkbox's own "(N completed hidden)" label shows a real, non-zero count, and confirm `.pvc-item` rows for known `definition-of-done` features (e.g. `fsdn-s1`, `lasr-s1`, `rclr-s1`, `pflx-s1`/`s2`/`s3` themselves) carry `data-active="false"`.
2. **This closes the full arc of today's product-feature-list-filter-fixes work** (`pflx-s1` through `pflx-s4`) — search now surfaces matches hidden in collapsed groups, the list defaults to active-only, group counts reflect the real filtered state, and the underlying data now actually supports all of the above for every item type, not just live journeys.
