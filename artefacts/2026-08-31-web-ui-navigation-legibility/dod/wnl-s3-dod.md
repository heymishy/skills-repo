# Definition of Done: No-product, CLI-authored features are reachable within one click from the /dashboard landing page

**PR:** [#855](https://github.com/heymishy/skills-repo/pull/855) | **Merged:** 2026-09-10 (merge commit `6cc7d1f3`)
**Story:** artefacts/2026-08-31-web-ui-navigation-legibility/stories/wnl-s3-dashboard-no-product-discoverability.md
**Test plan:** artefacts/2026-08-31-web-ui-navigation-legibility/test-plans/wnl-s3-test-plan.md
**DoR artefact:** artefacts/2026-08-31-web-ui-navigation-legibility/dor/wnl-s3-dor.md
**Assessed by:** Copilot (Claude Sonnet 5)
**Date:** 2026-09-11

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Entry point shown for Postgres no-product journey: visible clickable "No product work" entry appears in dashboard body when `journeys.product_id IS NULL` rows exist | `tests/check-wnl-s3-dashboard-no-product-entry.js`: "entry-point-shown-for-postgres-no-product-journey" | None |
| AC2 | ✅ | Entry point shown for CLI-only unbackfilled feature (the actual root cause this story exists to fix): entry point still appears when Postgres count is 0 but an unmatched `pipeline-state.json` feature exists, via reuse of `_mergeStateFeaturesIntoJourneyList` (ADR-028) | `tests/check-wnl-s3-dashboard-no-product-entry.js`: "entry-point-shown-for-cli-only-unbackfilled-feature" — specifically designed to catch a shallow/naive Postgres-only implementation by construction | None |
| AC3 | ✅ | Entry point links to existing `/journey` no-product list: links to the same destination the sidebar's own "No product" link provides; no new list view built | "entry-point-links-to-existing-journey-no-product-list" | None |
| AC4 | ✅ | No entry point when genuinely empty: no entry point rendered when zero no-product work of either kind exists | "no-entry-point-when-genuinely-empty" | None |
| AC5 | ✅ | Regression — existing product cards unaffected: name, feature count, last-updated date, link all render exactly as before | "existing-product-cards-unaffected" | None |
| AC6 | ✅ | Regression — sidebar's own no-product link/count unaffected: sidebar's own `renderProductsSection` link and count continue rendering exactly as before | "sidebar-no-product-link-unaffected" | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. The merged diff is scoped to `_hasUnbackfilledCliFeatures(repoRoot)` (new, reuses `_mergeStateFeaturesIntoJourneyList` per ADR-028 rather than re-deriving), a 7th parameter (`hasNoProductWork`) threaded through `_renderProductDashboard`/`handleGetDashboard`, and a presence-only rendered entry point. Confirmed out of scope and absent from the merged diff: no fix to the sidebar's own separate `noProductJourneyCount` undercounting (explicitly deferred — see Decision below), no change to `_mergeStateFeaturesIntoJourneyList` itself or to `/journey`'s own rendering, no numeric count on the new entry point, no change to how products are created/connected.

**Decision carried from `/review`:** the dashboard entry point shows presence only ("No product work →"), no "(N)" count — logged in `decisions.md` (2026-09-10) as a deliberate refinement of the discovery's literal MVP wording, to avoid a visible two-different-numbers-on-one-screen inconsistency with the sidebar's own still-undercounting number. Not a scope change; reachability (the actual capability this story exists to deliver) is unaffected.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7 (6 AC-mapped tests + 1 NFR timing check)
**Tests passing in CI:** 6 / 6 automated (the NFR timing check is a manual rough before/after measurement, see NFR Status below)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| entry-point-shown-for-postgres-no-product-journey (AC1) | ✅ | ✅ | |
| entry-point-shown-for-cli-only-unbackfilled-feature (AC2) | ✅ | ✅ | The construction-designed test for the real root cause |
| entry-point-links-to-existing-journey-no-product-list (AC3) | ✅ | ✅ | |
| no-entry-point-when-genuinely-empty (AC4) | ✅ | ✅ | |
| existing-product-cards-unaffected (AC5) | ✅ | ✅ | |
| sidebar-no-product-link-unaffected (AC6) | ✅ | ✅ | |
| dashboard-load-no-material-timing-regression | ✅ | N/A (manual) | Rough before/after timing check per NFR profile — not a formal load test |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Dashboard load time not measurably regressed (Performance) | ✅ | Rough before/after timing check performed at implementation time per NFR profile — `_mergeStateFeaturesIntoJourneyList` already reads `pipeline-state.json` from disk on every `/journey` load today; marginal cost of doing so once more on `/dashboard` confirmed small, no formal SLO exists for this repo's web UI |
| Security | ✅ Not applicable | No new input surface; reuses existing tenant-scoped queries and file reads |
| Accessibility (keyboard-accessible new entry point) | ✅ | Plain `<a>` tag, consistent with existing product cards' own accessibility pattern |
| Data residency / Compliance | ✅ Not applicable | No new data storage or movement |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M3 — Cross-channel feature discoverability from the dashboard | ✅ (target: 0 "couldn't find a no-product feature from /dashboard" incidents across 4 weeks post-ship; baseline: 2 confirmed incidents in one session, 2026-09-10 — the exact session this story originated from) | Not yet — requires a 4-week post-ship observation window with no incident-tracking automation | Signal: `not-yet-measured`. Evidence note: feature just shipped (merged 2026-09-10); the 4-week no-incident observation window has not elapsed. |

**Recorded in pipeline-state.json:** `metrics[2].signal = "not-yet-measured"`, `evidence = "wnl-s3 shipped 2026-09-10; 4-week no-incident observation window not yet elapsed"`, `lastMeasured = null`. `contributingStories` for `m3` updated to include `wnl-s3`.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. The sidebar's own `noProductJourneyCount` (`getProductsNavSummary`) still undercounts not-yet-backfilled `pipeline-state.json` features (confirmed during this story's own implementation, out of scope by design — see `decisions.md`). No follow-up story opened yet; owner: Platform Owner (Hamish King), no committed timeline.
2. Revisit M3's signal at the 4-week mark post-ship (~2026-10-08) — no automated incident tracking exists for this metric, so this requires a manual operator check-in.

---

## DoD Observations

1. This story's `pipeline-state.json` bookkeeping needed two rounds of post-hoc correction this session: (a) the resumed subagent-execution run's own bookkeeping stalled at `stage: "branch-setup"` despite real, independently-verified work completing (fixed on master directly, `cf957f05`); (b) the feature branch's own separate copy of the same `tasks[]` array used a different, schema-invalid field shape (`{description, status, tddState}` instead of `{id, name, tddState, file}`), which passed local review but caused a real CI failure on PR #855 ("Validate traceability chain" — schema_valid check) after the PR was opened. Fixed directly on the branch (`10466308`) and verified locally via `bash scripts/validate-trace.sh --ci` before pushing. Both are logged as `/improve` candidates in `workspace/capture-log.md` — epic-nested story state bookkeeping (cdg.6) needs a schema-conformance check run on the branch's own copy, not just master's, before a PR is considered ready.
2. No NFR gaps or guardrail entries were absent at delivery time.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "No-product, CLI-authored features are reachable within one click from the /dashboard landing page" (wnl-s3).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
