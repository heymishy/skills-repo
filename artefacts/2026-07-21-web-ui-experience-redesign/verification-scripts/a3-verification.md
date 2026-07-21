# AC Verification Script: Compute health per-feature, distinct from test coverage

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/a3-per-feature-health-signal.md`
**Technical test plan:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a3-test-plan.md`
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:** This story is backend-only — there's no UI to click through yet (that's story A4). Verification here is done by inspecting the synced data directly (e.g. via a database query or the sync response), not the rendered page.

---

## Scenarios

### Scenario 1 — A docs-only feature gets its own health value (AC1, AC2)
1. Find (or set up) a feature in a real product's `pipeline-state.json` that has no `testPlan` data on any of its stories.
2. Trigger a sync for that product.
3. Look at the synced rollup data for that specific feature.

**Expected:** The feature has its own health value recorded, separate from the whole-product aggregate — and that value is not simply "unknown/no-data" copied from its (nonexistent) coverage number.

🔴 **Manual gap — AC2a:** There is no concrete "correct" health value to check against yet — the real rule for what a docs-only feature's health *should* be hasn't been decided. This scenario can only confirm a value exists and looks independently computed, not that it's the *right* value. This gap closes once the story's own technical investigation is done.

### Scenario 2 — Existing health gauge still works (AC3)
1. Open a product you've viewed before this story shipped.
2. Look at the "Feature health" summary at the top of the page.

**Expected:** It shows the exact same green/amber/red counts as before — nothing about the existing summary view changed.

---

## Summary

| Scenario | Pass/Fail | Notes |
|----------|-----------|-------|
| 1 — Per-feature health computed (partial — AC2a gap) | | |
| 2 — Existing gauge unaffected | | |
