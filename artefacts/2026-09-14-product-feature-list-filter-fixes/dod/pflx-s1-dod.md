# Definition of Done: Auto-expand collapsed module/phase groups when a search match is inside them

**PR:** https://github.com/heymishy/skills-repo/pull/881 | **Merged:** 2026-09-14T04:51:53Z
**Merge commit:** ce280c04f9f88b4d31b7909ad20de985b0d5c933
**Story:** artefacts/2026-09-14-product-feature-list-filter-fixes/stories/pflx-s1-auto-expand-collapsed-groups-on-search-match.md
**Test plan:** artefacts/2026-09-14-product-feature-list-filter-fixes/test-plans/pflx-s1-test-plan.md
**DoR:** artefacts/2026-09-14-product-feature-list-filter-fixes/dor/pflx-s1-dor.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | A search match inside a collapsed group removes `.a4-module-body--collapsed` and sets its header's `aria-expanded="true"` — T1, re-run fresh against merged master | Automated behavioural test (real script extracted and evaluated in jsdom against a real render) | None |
| AC2 | ✅ | A group auto-expanded by this logic re-collapses when the search is cleared, with `data-auto-expanded` removed — T2 | Automated behavioural test | None |
| AC3 | ✅ | A group expanded manually (via the real `a4ToggleModule` click handler) is never marked `data-auto-expanded` and stays expanded after a later search is cleared — T3 | Automated regression test | None |
| AC4 | ✅ | A group with zero matching rows for the current search keeps its collapse state completely unchanged — T4 | Automated regression test | None |
| AC5 | ✅ | The same underlying match expands its equivalent group independently in both the By Module and By Phase tabs — T5 | Automated behavioural test | None |

**All 5 ACs satisfied.** 5/5 new tests re-run fresh against merged master (commit `ce280c04`), 0 failures.

**Verification strength:** 5 behavioural/regression (real jsdom execution of the real generated script against a real render, not source-string grep), 0 live-verified against the real production app. This story's core claim — "a search match the operator found via `pflx-s1`'s own investigation on `skills-framework.fly.dev` now becomes visible" — has not yet been re-checked live against production, since production deploy requires the operator's own manual approval (`bri-s2.6`). Recorded as a Follow-up Action below.

---

## Scope Deviations

None. The merged diff (`src/web-ui/routes/products.js` — `pvcSyncGroupExpansion`, `pvcApplyFilters` update — plus `pflx-s2`'s own changes in the same file/PR, `tests/check-pflx-s1-auto-expand-search-match.js`, 3 new artefacts, `.github/pipeline-state.json`) maps directly to the story. Auto-expand was correctly scoped to search text only — health-chip filtering and `pflx-s2`'s active-only toggle do not trigger it, per the story's own Architecture Constraints.

---

## Test Plan Coverage

**Tests passing:** 5/5 new, re-run fresh 2026-09-14 against merged master (commit `ce280c04`) — `tests/check-pflx-s1-auto-expand-search-match.js`.

**Regression coverage:** `check-bmau-s1-bulk-assign-checkbox-ui.js`, `check-fdn-s1-feature-display-name.js`, `check-frsr-s1-feature-row-session-resume.js`, `check-pefl-s1-feature-name-not-epic-name.js`, `check-prlf-s1-featureslug-row-links.js`, `check-sob-s1-product-list-integration.js`, `check-pdt-s2-triage-summary-strip.js` — all re-run clean before merge.

**Gaps:** None against the story's own ACs.

**Full regression suite (post-merge, fresh on master, alongside `pflx-s2`):** 656 files run, 1 failure — `tests/check-p3.5-validate-trace.js`, the pre-existing documented resource-contention flake. No new regressions.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | `pvcSyncGroupExpansion` runs once per existing `pvcApplyFilters()` call, iterating groups already in the DOM — negligible added cost |
| Security | ✅ N/A | Pure client-side DOM state, no new data or input surface |
| Accessibility | ✅ | `aria-expanded` kept in sync for both manual and auto-expand paths — verified directly (T1/T2 assert the attribute, not just the CSS class) |

---

## Metric Signal

No formal benefit-metric artefact exists for this short-track feature (per the story's own Benefit Linkage field). Directly closes a gap the operator found first-hand this session: reported "filters and search don't work" on the live production app, root-caused via direct JS inspection to this exact collapsed-group-hides-a-real-match bug.

---

## Outcome

**COMPLETE**

No deviations, no test gaps, no NFR gaps.

---

## DoD Observations

1. **Follow-up Action — not yet live-verified against the real production app.** Once a production deploy is approved, re-run the exact live investigation from this session (search "roles" or "teams" on `skills-framework`'s product page) and confirm the matching row is now visibly expanded, not just present-but-hidden-by-collapse as originally found.
2. **Implemented and merged in the same PR as `pflx-s2`**, per that story's own Dependencies note — both stories' ACs and tests are independently verified above, but share one merge commit and one production deploy.
