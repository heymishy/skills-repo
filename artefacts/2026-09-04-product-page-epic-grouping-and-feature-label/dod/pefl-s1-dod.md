# Definition of Done: Grouped item rows show the parent feature's own name instead of repeating the epic group header, and epic-grouped view becomes the default when a product has more than one epic

**PR:** https://github.com/heymishy/skills-repo/pull/824 | **Merged:** 2026-09-03 (commit `7ec977b5`)
**Story:** artefacts/2026-09-04-product-page-epic-grouping-and-feature-label/stories/pefl-s1-feature-name-not-epic-name-on-grouped-rows.md
**Test plan:** artefacts/2026-09-04-product-page-epic-grouping-and-feature-label/test-plans/pefl-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-04-product-page-epic-grouping-and-feature-label/dor/pefl-s1-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-03

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `By Phase row: preferFeatureName=true shows featureName, not epicName` | automated test (`tests/check-pefl-s1-feature-name-not-epic-name.js`) | None |
| AC2 (regression) | ✅ | `By Module / All rows: default and checkbox call shapes still use epicName, unaffected by featureName` | automated test | None |
| AC3 | ✅ | `2-epic-group product with modules: By Phase is still the default tab` | automated test | None |
| AC4 (regression) | ✅ | `0-epic-group...still defaults to By Phase` + `1-epic-group, with-modules...still defaults to By Module` | automated test (2 tests) | None |
| AC5 (regression) | ✅ | `computeTaxonomyRollup: featureName added alongside unchanged slug/featureSlug for both object- and bare-string-shaped stories` | automated test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. Implementation matched the DoR contract exactly — no regressions were introduced during development (unlike `ppg-s1` and `fal-s1`, both of which found and fixed a real regression within the same story before commit). The `byPhaseHtml`'s "Other features" bucket (`byPhase.other`, items with no `epicName`) was also switched to the new `_renderPvcItemRowForPhase` renderer, slightly beyond the DoR contract's literal wording (which named only the `byPhase.byPhase` bucket) — confirmed safe and consistent, since those items have no `featureName` either, so the effective row output is unchanged for that bucket; noted here for traceability, not because it changed observable behaviour.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6
**Tests passing in CI:** 6 / 6 (all 8 PR checks green: Validate traceability chain, Lint/typecheck/test/build, Cross-tenant isolation spec, Playwright E2E smoke tests, Run assurance gate, Scenario A E2E staging, Scenario B E2E staging, Watermark gate)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 By Phase row shows featureName | ✅ | ✅ | |
| AC2 By Module/All rows unchanged | ✅ | ✅ | |
| AC3 epic-count > 1 defaults to By Phase | ✅ | ✅ | |
| AC4 (part 1) 0-epic regression guard | ✅ | ✅ | |
| AC4 (part 2) 1-epic-with-modules regression guard | ✅ | ✅ | |
| AC5 featureName additive | ✅ | ✅ | |

**TDD verification performed (RED confirmed, not assumed):** before committing, the fix was temporarily stashed (`git stash push -u` with a unique tag, reapplied and dropped by SHA per this repo's worktree stash-safety convention) and the new test file re-run against the pre-fix code. Confirmed AC1, AC3, and AC5 fail with exactly the expected values (missing feature name text, wrong default tab, `undefined` for the new field), while AC2/AC4's regression guards correctly pass either way — proving the new tests are load-bearing, not vacuously true.

**Gaps (tests not implemented):**
None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no new computation | ✅ | Code review confirms `feature.name` reuses an already-loaded value, and `byPhase.byPhase.length` reuses the `groupItemsByPhase` call already made in `_renderConsolidatedFeaturesSection` — no new query, no new function call |
| Security — no new external input | ✅ N/A | Pure rendering/template change |
| Accessibility | ✅ N/A | No new interactive element |
| Audit | ✅ N/A | No new data write or access path |

`nfr-profile.md` status: `Active` — no NFR gaps were identified at DoR, and none surfaced during implementation.

---

## Metric Signal

Not applicable — short-track story, no formal benefit-metric artefact or `metrics[]` array entries reference `pefl-s1` (per CLAUDE.md's short-track path, benefit-metric is skipped by design). Benefit linkage was stated directly in the story: Time to First Actionable Content, the same metric `dashboard-triage`/`ppg-s1`/`fal-s1` all targeted.

---

## Outcome

**COMPLETE**

A clean implementation with no regressions found during development — all 5 ACs satisfied exactly as scoped, confirmed via genuine RED→GREEN TDD verification (the new tests were proven to fail against the pre-fix code, not just written after the fact), plus a clean full-suite run (604 files, 1 pre-existing unrelated failure) and two additional targeted regression-guard re-runs (`ppg-s1`'s and `fal-s1`'s own test files, since both touched functions were built/extended by those prior stories).

**Follow-up actions:**
1. **Approve `promote-to-prod`** in GitHub Actions for this merge commit (`7ec977b5`) whenever convenient. Not time-sensitive — this is a UI-only readability fix, not a data-loss or correctness risk.
2. **Data note:** the new `featureName` field only appears in a product's cached taxonomy after its next sync — confirm this via a live check of the `cli-deterministic-governance` feature's "By Phase" tab once production has both the deploy and a fresh sync. Owner: Hamish King.
3. **Optional live confirmation, next time `skills-framework` (or any multi-epic product) is viewed in production**: check that By Phase tab rows show feature names, not repeated epic names, and that a multi-epic product with custom Modules defaults to By Phase. Not blocking — automated coverage already proves this behaviour. Owner: Hamish King.

---

## DoD Observations

1. **Sixth occurrence of the recurring deploy-topology gap this session**, reiterating the same `/improve` candidate flagged in `pst-s1`, `pgft-s1`, `psbf-s1`, `ppg-s1`, and `fal-s1`'s own DoDs. `fal-s1`'s own DoD (observation 5) escalated this from a benign note to a real risk after the operator approved a *superseded* run rather than the one for the actual fix commit — worth checking `promote-to-prod` for this specific merge commit (`7ec977b5`) using the same ancestor-verification approach before considering this fully closed.
2. **A clean implementation is itself worth recording as a positive signal.** Unlike `ppg-s1` (found and fixed 1 real regression) and `fal-s1` (found and fixed 1 real regression, from the exact same class of bug — a resolver call escaping its originally-scoped conditional), `pefl-s1` introduced zero regressions during development. The difference: this story's fix was narrower in surface area (an optional, backward-compatible third parameter with an explicit default, versus a full extraction/refactor of shared control flow) — a data point for future DoR complexity ratings that an "additive optional parameter" pattern is lower-risk than a "restructure the call graph" pattern, even when both touch the same shared rendering functions.
3. **This is the third short-track story in this session's own "product page redesign" thread** (`ppg-s1` → `fal-s1` → `pefl-s1`), each one surfaced by the operator's own live-production review of the previous story's result. Worth naming as an established, effective working pattern for this kind of UI legibility work: ship a narrow fix, look at the real page again, name the next concrete defect, repeat — rather than attempting to scope the entire "feature summary page needs a general improvement pass" deferred item (`workspace/capture-log.md`, 2026-08-31) in one large pass. Two rounds of `AskUserQuestion` clarification were needed to convert the operator's own initial vague framing ("grouped by epic", "feature summary") into this story's precise, testable ACs — worth noting that a screenshot/pasted-example exchange (the operator's own literal pasted page content) was what actually converted an ambiguous request into a correctly-scoped one, more effectively than verbal description alone.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Grouped item rows show the parent feature's own name instead of repeating the epic group header, and epic-grouped view becomes the default when a product has more than one epic" (pefl-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Is it clear that production (skills-framework.fly.dev) still does not have this fix until promote-to-prod is approved for this specific merge commit (7ec977b5) -- verified via git-ancestor check against whatever commit is actually deployed, not just the operator's own recollection of which run they approved?
Report findings as HIGH / MEDIUM / LOW.
```
