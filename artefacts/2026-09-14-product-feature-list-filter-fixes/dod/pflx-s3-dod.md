# Definition of Done: Collapsed group counts reflect the currently-filtered item count, not the unfiltered total

**PR:** https://github.com/heymishy/skills-repo/pull/882 | **Merged:** 2026-09-14T06:14:17Z
**Merge commit:** e879d4590a918185b6297193022e38b6ae2e2fa3
**Story:** artefacts/2026-09-14-product-feature-list-filter-fixes/stories/pflx-s3-live-group-counts.md
**Test plan:** artefacts/2026-09-14-product-feature-list-filter-fixes/test-plans/pflx-s3-test-plan.md
**DoR:** artefacts/2026-09-14-product-feature-list-filter-fixes/dor/pflx-s3-dor.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | A group's `.a4-module-count` badge shows the count of currently-visible rows under any filter combination — T1, re-run fresh against merged master | Automated behavioural test (real script in real jsdom against a real render) | None |
| AC2 | ✅ | On initial render with "Active only" checked by default, the count already reflects only active items — T2 | Automated behavioural test | None |
| AC3 | ✅ | A group whose every item is `definition-of-done` shows `(0)` once "Active only" is checked — T3 | Automated behavioural test | None |
| AC4 | ✅ | Clearing all filters restores every group's original `groupFeatures.length` — T4 | Automated regression test | None |
| AC5 | ✅ | The same group's count updates independently and correctly in both the By Module and By Phase tabs — T5 | Automated behavioural test | None |

**All 5 ACs satisfied on the synthetic-fixture test suite.** 5/5 new tests re-run fresh against merged master (commit `e879d459`), 0 failures.

**Verification strength — IMPORTANT DOWNGRADE:** live-verified against the real production app (`skills-framework.fly.dev`) immediately after this story's own deploy, and found to be **functionally inert in practice** for that product: `pvcSyncGroupCounts()` itself works exactly as specced (confirmed by T1-T5), but `pflx-s2`'s own upstream `data-active` computation depends on `item.stage`, which `mergeFeatureSources()` (`product-rollup.js`) only ever populates for journey-sourced items — taxonomy-sourced items (the large majority of `skills-framework`'s 564 real features, since they're GitHub-synced completed work rather than live journeys) get `item.stage === undefined`, so `data-active` was `"true"` for all 1692 real `.pvc-item` rows checked, and the "Active only" checkbox's own "(0 completed hidden)" label was accurate to that broken input, not to reality. This is a real, upstream data-completeness gap in `pflx-s2`'s own dependency, not a defect in this story's own `pvcSyncGroupCounts()` logic — tracked and being fixed separately as `pflx-s4`. Recorded as a Follow-up Action below rather than silently treated as fully proven in production.

---

## Scope Deviations

None against this story's own stated scope. The merged diff (`src/web-ui/routes/products.js` — `pvcSyncGroupCounts()`, called from `pvcApplyFilters()` — `tests/check-pflx-s3-live-group-counts.js`, 3 new artefacts, `.github/pipeline-state.json`) maps directly to the story.

---

## Test Plan Coverage

**Tests passing:** 5/5 new, re-run fresh 2026-09-14 against merged master (commit `e879d459`) — `tests/check-pflx-s3-live-group-counts.js`.

**Regression coverage:** `pflx-s1` (5/5), `pflx-s2` (6/6), plus `check-bmau-s1-bulk-assign-checkbox-ui.js`, `check-fdn-s1-feature-display-name.js`, `check-frsr-s1-feature-row-session-resume.js`, `check-pefl-s1-feature-name-not-epic-name.js`, `check-prlf-s1-featureslug-row-links.js`, `check-sob-s1-product-list-integration.js`, `check-pdt-s2-triage-summary-strip.js` — all re-run clean before merge.

**Gaps:** None against the story's own ACs — see Verification Strength above for the real gap this story's own live-verification surfaced in a different, upstream story (`pflx-s2`).

**Full regression suite (post-merge, fresh on master):** 657 files run, 1 failure — `tests/check-p3.5-validate-trace.js`, the pre-existing documented resource-contention flake. No new regressions.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | One additional `querySelectorAll` + textContent write per group, per existing `pvcApplyFilters()` call |
| Security | ✅ N/A | Pure client-side DOM state, no new data or input surface |
| Accessibility | ✅ | Count text remains part of the existing header `<button>`'s accessible name |

---

## Metric Signal

No formal benefit-metric artefact exists for this short-track feature. Directly closes a gap the operator reported immediately after `pflx-s2` reached production.

---

## Outcome

**COMPLETE, with a real production gap found during live verification and tracked as `pflx-s4`.**

This story's own code (`pvcSyncGroupCounts()`) is correct and fully covered — the gap discovered is in `pflx-s2`'s upstream data dependency (`item.stage` never populated for taxonomy-sourced items), not in this story's own logic. Not re-opening this story; `pflx-s4` owns the fix.

---

## DoD Observations

1. **Follow-up Action — `pflx-s4` in progress.** Fixes the root cause: `mergeFeatureSources()`/`computeHealthCounts()` never populate a usable `.stage` for taxonomy-sourced items, so `pflx-s2`'s "Active only" filter (and, by extension, this story's own counts) currently has no real effect on `skills-framework` or any other taxonomy-heavy product.
2. **This was caught by direct live-app verification** (Chrome DevTools-style JS inspection of the real production DOM), not by the synthetic-fixture test suite — the tests correctly verify `pvcSyncGroupCounts()`'s own logic in isolation, but synthetic fixtures with `item.stage` set directly never exercised the real `mergeFeatureSources()` data-assembly gap. Worth remembering for future filter/data-dependent stories: verify against real production data shape, not just synthetic fixtures, before calling a UI feature done.
