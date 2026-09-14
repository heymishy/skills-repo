# Definition of Done: Hide a module/phase group entirely once its current filter leaves it with zero visible items

**PR:** https://github.com/heymishy/skills-repo/pull/884 | **Merged:** 2026-09-14T07:44:39Z
**Merge commit:** a8ac5c9b7342cb756fb90d8879ef441fb2f484d8
**Story:** artefacts/2026-09-14-product-feature-list-filter-fixes/stories/pflx-s5-hide-empty-groups.md
**Test plan:** artefacts/2026-09-14-product-feature-list-filter-fixes/test-plans/pflx-s5-test-plan.md
**DoR:** artefacts/2026-09-14-product-feature-list-filter-fixes/dor/pflx-s5-dor.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | A group whose currently-visible count is 0 has its entire `.a4-module-section` hidden — T1, re-run fresh against merged master | Automated behavioural test (real script in real jsdom against a real render) | None |
| AC2 | ✅ | A hidden group becomes visible again once its count rises above 0 — T2 | Automated behavioural test | None |
| AC3 | ✅ | Every group empty under the current filter shows a "No active features match." message; a tab with at least one non-empty group keeps it hidden — T3, T3b | Automated behavioural test | None |
| AC4 | ✅ | The same group hides/shows independently and correctly in both the By Module and By Phase tabs — T4 | Automated behavioural test | None |
| AC5 | ✅ | A group with at least one visible item is never hidden, and its `pflx-s3`-computed count badge is unaffected — T5 | Automated regression test | None |

**All 5 ACs satisfied.** 6/6 new tests re-run fresh against merged master (commit `a8ac5c9b`), 0 failures.

**Verification strength:** 6 behavioural/regression (real jsdom execution of the real generated script against a real render, not source-string grep). Not yet live-verified against the real production app — this story was scoped and shipped directly off the operator's own live production observation of `pflx-s4` (no separate synthetic reproduction was needed before starting, since the gap was already concretely described with exact on-screen text). Recorded as a Follow-up Action below rather than silently treated as fully proven in production.

---

## Scope Deviations

None. The merged diff (`src/web-ui/routes/products.js` — the `hidden`-attribute toggle added to `pvcSyncGroupCounts()`, plus the per-tab empty-state message, `tests/check-pflx-s5-hide-empty-groups.js`, 3 new artefacts, `.github/pipeline-state.json`) maps directly to the story. The "All" tab and `pvcSyncGroupCounts()`'s own count computation were left untouched exactly as scoped.

---

## Test Plan Coverage

**Tests passing:** 6/6 new, re-run fresh 2026-09-14 against merged master (commit `a8ac5c9b`) — `tests/check-pflx-s5-hide-empty-groups.js`.

**Regression coverage:** `pflx-s1` (5/5), `pflx-s2` (6/6), `pflx-s3` (5/5), `pflx-s4` (5/5), `check-bmau-s1-bulk-assign-checkbox-ui.js`, `check-fdn-s1-feature-display-name.js`, `check-pvc-s1-consolidate-and-tab-features-view.js`, `check-ppg-s1-decouple-modules-gate.js` — all re-run clean before merge.

**Gaps:** None against the story's own ACs.

**Full regression suite (post-merge, fresh on master):** 659 files run, 1 failure — `tests/check-p3.5-validate-trace.js`, the pre-existing documented resource-contention flake. No new regressions.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | Piggybacks on the count `pflx-s3` already computes — one additional attribute write per group, per existing `pvcApplyFilters()` call |
| Security | ✅ N/A | Pure client-side DOM state, no new data or input surface |
| Accessibility | ✅ | Uses the `hidden` attribute (removes from the accessibility tree), not just visual `display:none` styling — confirmed via T1/T4 asserting `hasAttribute('hidden')` directly |

---

## Metric Signal

No formal benefit-metric artefact exists for this short-track feature. Directly closes the gap the operator reported immediately after live-verifying `pflx-s4` in production — a deliberate, agreed follow-up to `pflx-s3`'s own explicit Out of Scope note.

---

## Outcome

**COMPLETE**

No deviations, no test gaps, no NFR gaps.

---

## DoD Observations

1. **Follow-up Action — live-verify against production once deployed.** Once a production deploy is approved, repeat the exact scenario the operator described: check `skills-framework`'s "By Phase" tab with "Active only" checked and confirm fully-complete phase groups (e.g. "Phase 0 — Authorization Guard") no longer appear at all, rather than showing a bare `(0)` header.
2. **This closes the full `pflx-s1` through `pflx-s5` arc** for this feature: search surfaces matches hidden in collapsed groups, the list defaults to active-only, group counts reflect the real filtered state, the underlying data supports that for every item type, and now the list visibly shrinks instead of leaving empty scaffolding behind.
