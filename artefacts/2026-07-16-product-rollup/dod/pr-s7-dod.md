# Definition of Done: Render discovery scope and feature/epic taxonomy grouping

**PR:** https://github.com/heymishy/skills-repo/pull/500 | **Merged:** 2026-07-17
**Story:** artefacts/2026-07-16-product-rollup/stories/pr-s7.md
**Test plan:** artefacts/2026-07-16-product-rollup/test-plans/pr-s7-test-plan.md
**DoR artefact:** artefacts/2026-07-16-product-rollup/dor/ (pr-s7 sign-off)
**Assessed by:** Claude (agent-run DoD, per skills/definition-of-done/SKILL.md)
**Date:** 2026-07-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — features spanning multiple epics group under their parent epic; ungrouped features listed separately | ✅ | `check-pr-s2-product-rollup.js` "computeTaxonomyRollup: 2 epics with 2 stories each, plus 1 flat ungrouped feature", "epic-nested feature with a leftover empty stories[] field appears once, under its epic only"; `check-pr-s2-products-route.js` "_renderProductView: renders epic groups (AC1)" | Automated test | None |
| AC2 — a feature with a `discoveryArtefact` field shows a one-line scope summary or link, not just slug/name | ✅ | `check-pr-s2-products-route.js` "_renderProductView: renders ungrouped features with a discovery-artefact link (AC2)" | Automated test | None |
| AC3 — zero epics shows a flat feature list with no misleading empty "Epics" section | ✅ | `check-pr-s2-product-rollup.js` "computeTaxonomyRollup: all-flat features -> groups is empty array, ungrouped has all 4"; `check-pr-s2-products-route.js` "_renderProductView: shows no misleading empty epics section when there are zero epics (AC3)" | Automated test | None |
| AC4 — the taxonomy view's total feature count (grouped + ungrouped) exactly matches the cached rollup record's feature count; no feature silently dropped or double-counted | ✅ | `check-pr-s2-product-rollup.js` T27 "the taxonomy view's own total feature count matches the sum of grouped + ungrouped items", asserting `totalCount` equals `sum(groups[].items.length) + ungrouped.length` exactly (5 in the test fixture); T28 confirms `syncProductRollup` writes `taxonomy` alongside the other rollup columns | Automated test | None |

---

## Scope Deviations

None. Full discovery-artefact content rendered inline, and editing/reorganising the taxonomy from this view, were correctly left out, per the story's Out of Scope section — this story is read-only display only.

**Review-finding note (not a deviation):** the story's own artefact records Review finding 7-M1 (run 1) — the original AC4 draft compared totals against pr-s4's rendered health view (a cross-story dependency that would have made pr-s7 untestable in isolation). It was split before Definition of Ready into this story's self-contained AC4 (testable using only pr-s2's cache + pr-s7's own taxonomy logic, verified by T27 above) plus a separate cross-story consistency check deferred to the epic level. See Follow-up actions below for the epic-level check's status.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8
**Tests passing in CI:** confirmed passing

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `check-pr-s2-product-rollup.js` (AC1, AC3, AC4, T27, T28 — `computeTaxonomyRollup` + storage) | ✅ | ✅ (29 passed, 0 failed, combined suite) | |
| `check-pr-s2-products-route.js` (AC1, AC2, AC3 — rendering) | ✅ | ✅ (22 passed, 0 failed, combined suite) | |

**Gaps (tests not implemented):** the epic-level cross-story consistency check (pr-s7's total vs. pr-s4's health-view total vs. pr-s2's raw `dod_status_counts` total) named in the 7-M1 review-finding split has no dedicated automated test — see Follow-up actions.

**CSS-layout-dependent Acceptance Criteria audit:** the story's Accessibility NFR (keyboard-navigable, correct heading hierarchy for epic groups vs. feature items) is a structural/semantic HTML requirement, not a visual/pixel-layout requirement — verified via heading-tag presence/absence checks (AC3 test above), not a screenshot comparison. `hasLayoutDependentGaps: false` is correct; no automated visual-regression test or RISK-ACCEPT is required for this story.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — computed from the already-cached rollup record, no additional API calls | ✅ | T28 confirms `taxonomy` is computed and stored during pr-s2's single sync |
| Accessibility — keyboard-navigable, correct heading hierarchy for epic groups vs. feature items | ✅ | AC3 test asserts heading-tag structure directly (`Epics</h[1-6]>` absence check) |
| Security / Audit — none identified | ✅ | Read-only display of existing structure, no new data-access surface |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Product shape visible in the web UI | ✅ | Now — pr-s7 is a contributing story and all six contributing stories are merged | `not-yet-measured` pending operator's manual sync-and-compare check. pr-s7 is also the final story to merge for this feature, so this is the point at which Metric 1's full target (all six rollup fields, not just the minimum validation signal) becomes checkable for the first time |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

The deviation is the untested epic-level cross-story consistency check named below — not a defect in pr-s7 itself, but an explicitly-deferred check that has not yet been picked up anywhere else in the epic.

**Follow-up actions:**
1. The epic-level cross-story total-count consistency check (pr-s7's taxonomy total vs. pr-s4's health-view total vs. pr-s2's raw `dod_status_counts` total — all three should agree for the same synced product) named in Review finding 7-M1 has not been implemented as an automated test anywhere in `pr-e2-dimensions`. Recommend either a small dedicated integration test or covering it as part of the operator's Metric 1 manual verification pass (comparing all rendered totals against the hand-computed `pipeline-state.json` aggregate would incidentally catch this). Owner: Hamish King.
2. Operator to perform Metric 1's full manual verification now that all seven stories are merged (see Metric Signal above).

---

## DoD Observations

1. The 7-M1 review-finding split (cross-story consistency deferred to epic level) is a legitimate scope-management decision, but "epic level" was never concretely assigned to any story or a dedicated verification step — flagging as an `/improve` candidate: when a review finding splits an AC and defers part of it to "the epic level," the DoR or epic artefact should name the specific mechanism (a test, a manual check, or an explicit epic-level story) that will actually perform the deferred check, rather than leaving it as an implicit expectation.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Render discovery scope and feature/epic taxonomy grouping" (pr-s7).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
