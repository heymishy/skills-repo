# Definition of Done: fresc-s1 — Add orientation copy to two first-run empty states, and gate the Modules card on feature count

**PR:** https://github.com/heymishy/skills-repo/pull/769 | **Merged:** 2026-08-25
**Story:** `artefacts/2026-08-25-first-run-empty-state-copy/stories/fresc-s1-product-and-modules-clarity-copy.md`
**Test plan:** `artefacts/2026-08-25-first-run-empty-state-copy/test-plans/fresc-s1-test-plan.md`
**DoR artefact:** `artefacts/2026-08-25-first-run-empty-state-copy/dor/fresc-s1-dor.md`
**Assessed by:** Claude (agent)
**Date:** 2026-08-26

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `modulesCardHiddenWithZeroFeatures`, `modulesCardHiddenWithExactlyOneFeature`, `handleGetProductViewReflectsVisibilityGateEndToEnd` — all pass, fresh run on master 2026-08-26 | Automated test | None |
| AC2 | ✅ | `modulesCardVisibleWithTwoFeatures`, `moduleCrudMarkupUnchangedWhenCardVisible` — pass | Automated test | See below |
| AC3 | ✅ | `productEmptyStateIncludesExplanatoryLine`, `boardViewEmptyStateAlsoIncludesExplanatoryLine` — pass, both list and board view | Automated test | See below |
| AC4 | ✅ | `productListNonEmptyStateUnaffected`, 5 repaired `check-a1-modules-taxonomy-crud.js` tests, full suite (552/552), CI green (all 8 checks passed on PR #769) | Automated test + CI | None |

**Deviation on AC2/AC3 (recorded, not a failure):** Both ACs' illustrative "e.g." example wording in the story artefact is now stale relative to what actually shipped. AC2's example ("Group related features together for easier organization on the Kanban and Roadmap views") and AC3's example ("A product is a connected GitHub repo...") were both found factually wrong during implementation review — module grouping has no effect on the Kanban or Roadmap views (only this same page's own Features "By Module" tab), and a connected GitHub repo is optional, not inherent to what a product is. The actual shipped copy ("...in the features list below" / "...you can connect a GitHub repo to it anytime.") is accurate; the story's own illustrative examples were not updated after the correction. Both ACs' actual requirement ("a short explanatory line describing X") is satisfied — the deviation is in the story's own now-stale illustration, not in the implementation.

---

## Scope Deviations

None. Commits on the branch map cleanly to the 4 planned tasks, their review-driven fix-ups, and artefact reconciliation — confirmed at `/verify-completion`'s scope check and independently re-confirmed by the final cross-cutting reviewer, who traced all 4 ACs through the actual merged code.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8
**Tests passing in CI:** 8 / 8 (part of the 552-file full suite, PR #769's "Lint, typecheck, test, build" check — pass)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `modulesCardHiddenWithZeroFeatures` (AC1) | ✅ | ✅ | |
| `modulesCardHiddenWithExactlyOneFeature` (AC1, boundary) | ✅ | ✅ | |
| `modulesCardVisibleWithTwoFeatures` (AC2) | ✅ | ✅ | |
| `moduleCrudMarkupUnchangedWhenCardVisible` (AC2, AC4) | ✅ | ✅ | |
| `productEmptyStateIncludesExplanatoryLine` (AC3) | ✅ | ✅ | |
| `productListNonEmptyStateUnaffected` (AC3, non-regression) | ✅ | ✅ | |
| `handleGetProductViewReflectsVisibilityGateEndToEnd` (AC1, integration) | ✅ | ✅ | |
| `boardViewEmptyStateAlsoIncludesExplanatoryLine` (AC3, duplicated-block parity check) | ✅ | ✅ | Renamed from "shared-function regression check" during review after discovering the board/list empty states are independently-duplicated blocks, not one shared function — see DoD Observations |

**Gaps (tests not implemented):** None. Test plan's own coverage-gaps section stated "None" — confirmed accurate at merge.

**Collateral repair, not a gap:** 5 pre-existing tests in `check-a1-modules-taxonomy-crud.js` had their fixtures repaired ahead of AC1's gate landing (their 0-feature fixtures previously asserted the Modules card WAS present — the exact opposite of the new gate). Flagged in the test plan before coding began, not discovered as a surprise CI failure.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| None declared — story's NFR section: "NFRs: None — reviewed 2026-08-25" | ✅ N/A | No NFR profile required; confirmed not applicable, matching H-NFR's DoR pass |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 (Beta activation rate, `2026-06-29-beta-entry-experience`) | N/A — not wired | N/A | `fresc-s1` is not listed in M1's `contributingStories` array in `pipeline-state.json` (only `bee.1`/`bee.2`/`bee.3` are). The story's own Benefit Linkage references M1 conceptually ("first-run clarity gaps are activation friction... the exact population M1 tracks") but, being a short-track story that bypassed `/definition` (where `contributingStories` arrays are normally populated), was never formally wired in. Not corrected here — a deliberate metric-wiring decision belongs to the metric owner, not a DoD-time addition. Flagged as a DoD Observation below. |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. (Low priority, documentation-only) Update AC2/AC3's illustrative example wording in the story artefact to match the actual shipped copy, so a future reader doesn't need to cross-reference this DoD to learn the examples are stale. Owner: next operator touching this story's artefacts, no urgency.
2. (Tracked separately, not blocking) Extract a shared `_renderEmptyProductsState()` helper to eliminate the pre-existing duplication between `_renderProductDashboard`'s and `handleGetDashboard`'s board-view empty-state blocks — already logged in `workspace/capture-log.md` (2026-08-25) as a real, now-slightly-worse piece of technical debt.
3. (Metric owner decision) Consider whether `fresc-s1` should be added to M1's `contributingStories` array, given its story-level rationale explicitly ties it to that metric's population.

---

## DoD Observations

1. **A review-driven correction changed what "shared function" meant for one AC's test, and the story text was never updated to match.** AC3's Architecture Constraints section states the empty-state block is "shared by both the list-view dashboard and the board-view dashboard — one change covers both surfaces." This was true of the *original* plan's assumption but turned out to be false of the actual code: the board-view branch has its own independently-maintained duplicate block, not a call to the shared function. The implementation correctly adapted (editing both locations, renaming the misleading test), but the story artefact's own Architecture Constraints text still asserts the now-known-false premise. Worth a `/improve` candidate: when an implementer discovers a plan's structural assumption was wrong mid-story, consider whether the *story* artefact (not just the plan/test names) should also get a one-line correction note, since the story is the longer-lived record `/trace` and future readers will consult.
2. **Two factually-wrong copy claims were caught and corrected by the review process before shipping, not after.** Both instances (Modules-card hint claiming an effect on Kanban/Roadmap; empty-state hint claiming a product IS a connected repo) were plausible-sounding but demonstrably false against the actual code, caught by code-quality review dispatches that independently traced the real rendering/data logic rather than accepting the copy at face value. This is the review process working as designed — cited here as a positive signal for `/improve`, not a gap.
3. **Verification-script and story documentation drift is a real, recurring small cost.** Both `fresc-s1`'s AC verification script (Scenario 3) and the story artefact itself (AC2/AC3 examples) needed post-hoc correction to stay consistent with a mid-implementation copy fix. Neither was a blocking issue, but it's the same class of drift risk noted in Observation 1 — worth a `/improve` candidate around whether test-plan/verification-script skills should prompt an explicit "does this still match the shipped code?" check at DoD time, not just at pre-code sign-off.
