# Definition of Done: Default the product features list to active (non-definition-of-done) features only

**PR:** https://github.com/heymishy/skills-repo/pull/881 | **Merged:** 2026-09-14T04:51:53Z
**Merge commit:** ce280c04f9f88b4d31b7909ad20de985b0d5c933
**Story:** artefacts/2026-09-14-product-feature-list-filter-fixes/stories/pflx-s2-default-active-only-feature-list.md
**Test plan:** artefacts/2026-09-14-product-feature-list-filter-fixes/test-plans/pflx-s2-test-plan.md
**DoR:** artefacts/2026-09-14-product-feature-list-filter-fixes/dor/pflx-s2-dor.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Every `definition-of-done`-stage item is already hidden on initial render, before any interaction — T1, re-run fresh against merged master | Automated behavioural test (real script in real jsdom against a real render) | None |
| AC2 | ✅ | The "Active only" checkbox is checked by default — T2 | Automated source-inspection/behavioural test | None |
| AC3 | ✅ | Unchecking "Active only" reveals `definition-of-done` items — T3 | Automated behavioural test | None |
| AC4 | ✅ | Re-checking "Active only" hides them again — T4 | Automated behavioural test | None |
| AC5 | ✅ | An active item's visibility is unaffected by toggling "Active only" on or off — T5 | Automated regression test | None |
| AC6 | ✅ | The active-only default applies consistently across the By Module, By Phase, and All tabs — T6 | Automated behavioural test | None |

**All 6 ACs satisfied.** 6/6 new tests re-run fresh against merged master (commit `ce280c04`), 0 failures.

**Verification strength:** 6 behavioural/regression (real jsdom execution against a real render), 0 live-verified against the real production app. This story's core claim — "the operator's own 564-item `skills-framework` list now defaults to showing only active work" — has not yet been re-checked live against production, pending manual deploy approval. Recorded as a Follow-up Action below.

---

## Scope Deviations

None. The merged diff (`src/web-ui/routes/products.js` — `data-active` attribute, "Active only" checkbox, `pvcToggleActiveOnly`, the `stageOk` filter condition, and the initial-load `pvcApplyFilters()` call — plus `pflx-s1`'s own changes in the same file/PR, `tests/check-pflx-s2-default-active-only-filter.js`, 3 new artefacts, `.github/pipeline-state.json`) maps directly to the story. Existing `healthCounts` computation and labels were left untouched exactly as scoped.

---

## Test Plan Coverage

**Tests passing:** 6/6 new, re-run fresh 2026-09-14 against merged master (commit `ce280c04`) — `tests/check-pflx-s2-default-active-only-filter.js`.

**Regression coverage:** same suite as `pflx-s1` (same PR, same file) — `check-bmau-s1-bulk-assign-checkbox-ui.js`, `check-fdn-s1-feature-display-name.js`, `check-frsr-s1-feature-row-session-resume.js`, `check-pefl-s1-feature-name-not-epic-name.js`, `check-prlf-s1-featureslug-row-links.js`, `check-sob-s1-product-list-integration.js`, `check-pdt-s2-triage-summary-strip.js` — all re-run clean before merge, confirming `healthCounts`/health-chip behaviour is untouched.

**Gaps:** None against the story's own ACs.

**Full regression suite (post-merge, fresh on master, alongside `pflx-s1`):** 656 files run, 1 failure — `tests/check-p3.5-validate-trace.js`, the pre-existing documented resource-contention flake. No new regressions.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | One extra boolean attribute per row, one extra condition in the existing per-row filter loop — negligible |
| Security | ✅ N/A | No new external input surface — `item.stage` is already server-resolved data rendered elsewhere on the same page |
| Accessibility | ✅ | Real `<input type="checkbox">` with an associated `<label>`, keyboard-operable and screen-reader-announced by default |

---

## Metric Signal

No formal benefit-metric artefact exists for this short-track feature (per the story's own Benefit Linkage field). Directly requested by the operator immediately after `pflx-s1`'s investigation surfaced the list's real scale — 564 features on `skills-framework` alone, most already shipped.

---

## Outcome

**COMPLETE**

No deviations, no test gaps, no NFR gaps.

---

## DoD Observations

1. **Follow-up Action — not yet live-verified against the real production app.** Once a production deploy is approved, load `skills-framework`'s product page and confirm the list opens already filtered to active work, with the "Active only" checkbox checked and a visible completed-count next to it.
2. **Implemented and merged in the same PR as `pflx-s1`**, per that story's own Dependencies note — both stories' ACs and tests are independently verified above, but share one merge commit and one production deploy.
