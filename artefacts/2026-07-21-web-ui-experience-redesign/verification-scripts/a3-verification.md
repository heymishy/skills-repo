# AC Verification Script: Compute health per-feature, distinct from test coverage

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/a3-per-feature-health-signal.md`
**Technical test plan:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a3-test-plan.md`
**Script version:** 1
**Verified by:** Claude (agent) | **Date:** 2026-07-21 | **Context:** [x] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:** This story is backend-only — there's no UI to click through yet (that's story A4). Verification here is done by inspecting the synced data directly (e.g. via a database query or the sync response), not the rendered page.

---

## Scenarios

### Scenario 1 — A docs-only feature gets its own health value (AC1, AC2, AC2a)
1. Find (or set up) a feature in a real product's `pipeline-state.json` that has no `testPlan` data on any of its stories.
2. Trigger a sync for that product.
3. Look at the synced rollup data for that specific feature.

**Expected:** The feature has its own health value recorded, separate from the whole-product aggregate — and that value is not simply "unknown/no-data" copied from its (nonexistent) coverage number.

**Verified (2026-07-21), against this repo's own real `.github/pipeline-state.json` directly (not a synthetic fixture):** ran `computeHealthCounts` and `computeTestCoverageRollup` against the real file. `2026-04-14-skills-platform-phase3` (a real feature with zero `testPlan` data on any of its 21 stories) resolved to `perFeature` entry `{"slug":"2026-04-14-skills-platform-phase3","health":"green"}` — a real, non-"unknown" value, sourced from its own explicit `feature.health` field, independent of its (nonexistent) coverage data. `perFeature.length` (57) equals `features.length` (57), confirming one entry per feature (AC1). ✅ **Pass**

**AC2a resolution:** the investigation (this story's Architecture Constraints task) confirmed the real signal source is `feature.health`, and is now concretely tested (T30 in `tests/check-pr-s2-product-rollup.js`) — the 🔴 manual gap noted in this script's original version is now closed by that automated test; see `decisions.md` and `plans/a3-plan.md` (Task 0) for the full trace. ✅ **Pass**

### Scenario 2 — Existing health gauge still works (AC3)
1. Open a product you've viewed before this story shipped.
2. Look at the "Feature health" summary at the top of the page.

**Expected:** It shows the exact same green/amber/red counts as before — nothing about the existing summary view changed.

**Verified (2026-07-21):** confirmed via `tests/check-pr-s2-products-route.js`'s new regression test (a3, AC3) — `_renderProductView` renders the identical four health-status labels, identical numeric aggregate counts, and the overall signal section, when fed the extended `health_counts` shape (aggregate + `perFeature`). The pre-existing pr-s4 AC1 gauge test (unmodified) also still passes. No UI code changed (this story is backend-only, per Out of Scope). ✅ **Pass**

---

## Summary

| Scenario | Pass/Fail | Notes |
|----------|-----------|-------|
| 1 — Per-feature health computed (AC1, AC2, AC2a — gap closed) | ✅ Pass | Verified against real pipeline-state.json data, not only synthetic fixtures |
| 2 — Existing gauge unaffected (AC3) | ✅ Pass | New regression test + unmodified pre-existing test both pass |
