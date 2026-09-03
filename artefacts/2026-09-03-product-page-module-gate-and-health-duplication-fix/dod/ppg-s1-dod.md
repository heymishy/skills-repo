# Definition of Done: Module-less products get the full grouped/collapsed/filterable features UI, and health counts render in one place, not three

**PR:** https://github.com/heymishy/skills-repo/pull/822 | **Merged:** 2026-09-03
**Story:** artefacts/2026-09-03-product-page-module-gate-and-health-duplication-fix/stories/ppg-s1-decouple-modules-gate-and-consolidate-health-counts.md
**Test plan:** artefacts/2026-09-03-product-page-module-gate-and-health-duplication-fix/test-plans/ppg-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-03-product-page-module-gate-and-health-duplication-fix/dor/ppg-s1-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-03

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `zero-modules: tabs, search, and health-filter chip bar all render` | automated test (`tests/check-ppg-s1-decouple-modules-gate.js`) | None |
| AC2 | ✅ | `zero-modules: By Module tab shows one Unclassified(N) group, no bmau-bar` | automated test | None |
| AC3 | ✅ | `zero-modules: By Phase is the default active tab` | automated test | None |
| AC4 | ✅ | `health-filter chips show real per-status counts; pdt-triage-strip is gone` | automated test | None |
| AC5 | ✅ | `Overall line contains only its own label, no per-status breakdown` | automated test | None |
| AC6 (regression) | ✅ | `with-modules: By Module remains the default active tab` and `...bulk-assign bar still renders` | automated test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

Two recorded, non-blocking items — both real work discovered and resolved within this same story, not silently absorbed:

1. **A real regression found and fixed within the story itself.** The first implementation pass left the By Module tab using the checkbox-wrapped row renderer for its Unclassified section even with zero custom Modules — since the bulk-assign bar was already correctly hidden in that case (AC2), this rendered orphaned, non-functional checkboxes with nothing to pair them with. Caught by a full-suite run (not by running only the individually-related test files), fixed properly (the row renderer now depends on module count, matching whether a bulk-assign bar exists to use it), and covered by the same test that caught it (`tests/check-bmau-s1-bulk-assign-checkbox-ui.js`, its own AC5).
2. **Six pre-existing test files updated to match this story's own intentional supersessions**, not silently broken: `tests/check-pvc-s1-consolidate-and-tab-features-view.js` and `tests/check-tmc-s1-persist-feature-module-classification.js` (both asserted `pvc-s1`'s own original AC9 — "zero-module fallback preserved, no tabs" — which this story deliberately reverses, since that decision was the exact root cause of the production gap); `tests/check-pdt-s2-triage-summary-strip.js` (rewritten in full to assert the consolidated chip-bar behaviour instead of the removed separate triage strip); `tests/check-pr-s2-products-route.js`'s own `pr-s4`/`a3` tests and `tests/check-shb-s1-story-health-badge-fix.js` (all three asserted the old colon-format health-count text this story's own consolidation removed); `tests/check-bmau-s1-bulk-assign-checkbox-ui.js` (narrowed an over-broad regex that also matched the tabbed UI's own now-always-present `<script>` block, not just real rendered checkbox elements).

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6
**Tests passing in CI:** 6 / 6 (all 8 PR checks green: Validate traceability chain, Lint/typecheck/test/build, Cross-tenant isolation spec, Playwright E2E smoke tests, Run assurance gate, Scenario A/B E2E staging, Watermark gate)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 zero-modules full UI renders | ✅ | ✅ | |
| AC2 zero-modules Unclassified group, no bulk-assign bar | ✅ | ✅ | |
| AC3 zero-modules defaults to By Phase | ✅ | ✅ | |
| AC4 health counts on the chip bar with real counts | ✅ | ✅ | |
| AC5 Overall line shows only its own label | ✅ | ✅ | |
| AC6 with-modules regression guard (default tab, bulk-assign bar) | ✅ | ✅ | 2 assertions |

**Gaps (tests not implemented):**
None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no new computation | ✅ | Reuses `groupItemsByModule`/`groupItemsByPhase`/`healthCounts` unchanged, confirmed by code review |
| Security — no new external input | ✅ N/A | Pure rendering/template change |
| Accessibility — chips remain real, keyboard-operable controls with counts in the accessible label | ✅ | Confirmed via `tests/check-pdt-s2-triage-summary-strip.js`'s own NFR-Accessibility test, unchanged and still passing |
| Data residency / Compliance | ✅ N/A | No new data storage, no regulatory clause |

`nfr-profile.md` status: `Active` — no NFR gaps were identified at DoR, and none surfaced during implementation; can be marked `Verified` on the next touch of this feature if the operator confirms the live visual result (see Follow-up actions).

---

## Metric Signal

Not applicable — short-track story, no formal benefit-metric artefact or `metrics[]` array entries reference `ppg-s1` (per CLAUDE.md's short-track path, benefit-metric is skipped by design).

---

## Outcome

**COMPLETE**

Unlike the `pst-s1`/`pgft-s1`/`psbf-s1` incident chain, this story is a UI/rendering-only fix with no production data-fetch risk — the merged code's own correctness is already fully confirmed by 6/6 automated ACs plus a clean full-suite run (602 files, 1 pre-existing unrelated failure), not contingent on a live production data path that could still fail in ways tests can't reach. No deviation from AC intent occurred; the two items in Scope Deviations were extra rigor applied within the story, not gaps left behind.

**Follow-up actions:**
1. **Approve `promote-to-prod`** in GitHub Actions (workflow run `33789963431`, job "Promote to production (manual approval required)") for this merge commit (`b6c2f6ef`) whenever convenient — `wuce-staging.fly.dev` is confirmed running this fix (deploy + `@mocked` smoke-test both passed); `skills-framework.fly.dev` needs its own separate approval, same recurring deploy-topology pattern noted in every prior DoD this session. Not time-sensitive the way the incident-chain stories were — this is a UI improvement, not a broken production feature. Owner: Hamish King.
2. **Optional visual confirmation, next time `skills-framework` is viewed in production**: collapsed By Phase groups by default, tabs (By Module/By Phase/All), a single health-filter chip bar with real counts (no more "Warning: 27" appearing three times), and no orphaned bulk-assign UI. Not a blocking action — the automated test coverage already proves this behaviour; this is just the operator's own visual sign-off when they next look at the page. Owner: Hamish King.

---

## DoD Observations

1. **Same recurring deploy-topology gap, fourth occurrence this session.** Reiterating the `/improve` candidate already flagged three times in the `pst-s1`/`pgft-s1`/`psbf-s1` DoDs: every merge in this session has required its own separate `promote-to-prod` approval. For this story specifically the urgency is genuinely lower (a UI fix, not a broken production feature), which is itself useful signal: the pattern isn't inherently costly when the underlying fix isn't time-critical — it becomes costly specifically for fast-follow incident chains, reinforcing that the right platform fix (if the operator decides to make one) should probably be scoped to that scenario rather than a blanket change to the promotion gate.
2. **A concrete example of TDD catching a real regression a first implementation pass introduced, within the same story, before merge.** The orphaned-checkbox bug (Scope Deviations item 1) was not caught by the individually-run related test files — only a full-suite run surfaced it, because the specific test asserting that exact behaviour (`check-bmau-s1-bulk-assign-checkbox-ui.js`) wasn't in the initially-identified "related files" list compiled at DoR time. Worth noting for future DoR contracts on stories touching shared rendering functions built by many independent prior stories: the DoR's own "estimated touch points" list is a starting point for targeted regression checks, not a substitute for a full-suite run before considering implementation complete.
3. **This story is the direct, causal outcome of the operator's own live production review immediately after the sync-fix chain resolved.** `pst-s1`/`pgft-s1`/`psbf-s1` fixed the data pipeline; the moment real data became visible for the first time, a second, independent class of gap (UI/rendering, not data-fetch) was immediately apparent and diagnosable from the same live session. Worth recording as a positive pattern: fixing the data path first, then reviewing the now-populated UI, surfaced a real gap that would have been invisible (or looked like "no data" rather than "wrong rendering") while the sync was still broken.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Module-less products get the full grouped/collapsed/filterable features UI, and health counts render in one place, not three" (ppg-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Is it clear that production (skills-framework.fly.dev) still does not have this fix until promote-to-prod is approved for this specific merge commit (b6c2f6ef), and that this is explicitly framed as non-urgent (unlike the pst-s1/pgft-s1/psbf-s1 incident chain)?
Report findings as HIGH / MEDIUM / LOW.
```
