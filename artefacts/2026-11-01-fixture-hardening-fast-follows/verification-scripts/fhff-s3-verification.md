# AC Verification Script: Extend journeys.js/products.js fixture adoption and DRY-extract the fixture-usage-check scripts

**Story reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/stories/fhff-s3-mechanical-fixture-dry-batch.md
**Technical test plan:** artefacts/2026-11-01-fixture-hardening-fast-follows/test-plans/fhff-s3-test-plan.md
**Script version:** 1
**Verified by:** Copilot (/verify-completion) | **Date:** 2026-11-04 | **Context:** [x] Pre-code (post-implementation, pre-PR)  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the repo root.
2. No server needs to be running.

**Reset between scenarios:** None needed.

---

## Scenarios

### Scenario 1: The newly-migrated journeys.js files still work the same as before

**Covers:** AC1

**Steps:**
1. Run `npm test`.
2. Find each of the 3-5 files that were migrated in this story.

**Expected outcome:**
> Each one shows the same number of passing checks as it did before the migration — nothing broke by switching to the shared fixture.

**Result:** [x] Pass  [ ] Fail
**Notes:** Ran fresh: `check-ep1-s1-journey-create.js` 8/8, `check-ep1-s2-journey-stage-create.js` 7/7, `check-cnsf-s1-canvas-node-token-styling.js` 6/6, `check-ep4-s1-journey-list.js` 8/8 — all identical to pre-migration counts (confirmed independently during `/subagent-execution`'s own review cycle, not just the implementer's claim).

---

### Scenario 2: products.js now has its own shared fixture, and one file already uses it

**Covers:** AC2

**Steps:**
1. Open the one `products.js`-touching file that was migrated.
2. Confirm it imports the new shared fixture instead of writing its own session object inline.
3. Run that file directly.

**Expected outcome:**
> The file passes, same as before migration.

**Result:** [x] Pass  [ ] Fail
**Notes:** `tests/check-dsa-s2-product-dashboard-wiring.js` imports `productsFixture`/`productsFixtureRes` from `tests/helpers/products-fixture.js` (confirmed via read), no more inline session literal or local `makeRes()`. Ran fresh: all 3 of its own tests pass (`has-products branch`, `zero-products onboarding`, `real-pending-actions-and-journey-data`), exit 0.

---

### Scenario 3: The new products.js check correctly tells hand-rolled apart from shared

**Covers:** AC3

**Steps:**
1. Run the new structural check against a file that hand-rolls its own session object.
2. Run it against the migrated file.

**Expected outcome:**
> The hand-rolled file is flagged. The migrated file is not.

**Result:** [x] Pass  [ ] Fail
**Notes:** Ran fresh: `node scripts/check-products-fixture-usage.js tests/fixtures/fhff-s3-products-hand-rolled.js` → FAIL (flagged, as expected); `node scripts/check-products-fixture-usage.js tests/fixtures/fhff-s3-products-shared-fixture-usage.js` → PASS (not flagged, as expected).

---

### Scenario 4: The 3 duplicate scripts are now 1 shared piece of logic, and nothing changed

**Covers:** AC4

**Steps:**
1. Run `npm test`.
2. Look for the existing tests that check the journey.js and journeys.js structural-check scripts.
3. Look for a new test checking the skills.js structural-check script the same way.

**Expected outcome:**
> All of them pass — the journey.js and journeys.js ones exactly as before, and the new skills.js one proves that script now has the same level of checking the other two always had.

**Result:** [x] Pass  [ ] Fail
**Notes:** Ran fresh: `check-tsir-s3-journey-fixture-usage-check.js` 4/4 (unchanged from before the DRY refactor), `check-tfhc-s7-journeys-fixture-usage-check.js` 5/5 (unchanged), new `check-tfhc-s3-skills-fixture-usage-check.js` 4/4 — wires the two previously-unused `tfhc-s3-hand-rolled-mockreq.js`/`tfhc-s3-shared-fixture-usage.js` fixtures, closing the exact coverage gap AC4(b) describes.

---

### Edge case: The specific journeys.js bug fix from before is still caught

**Covers:** AC5

**Steps:**
1. Open `tests/fixtures/tfhc-s7-hand-rolled-mockreq-session-not-first.js`.
2. Run the journeys.js structural check against it.

**Expected outcome:**
> It's still correctly flagged as hand-rolled, exactly as it was before this story's refactor.

**Result:** [x] Pass  [ ] Fail
**Notes:** Ran fresh: `node scripts/check-journeys-fixture-usage.js tests/fixtures/tfhc-s7-hand-rolled-mockreq-session-not-first.js` → FAIL (flagged), exactly as before — confirms the factory's `AD_HOC_SESSION_WINDOW = 300` windowed-match logic (the `tfhc-s7` bug fix) is retained byte-identical after the DRY extraction.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | ✅ Pass | 4 migrated journeys.js files, all counts unchanged |
| Scenario 2 | ✅ Pass | products.js proof-of-pattern migration passes |
| Scenario 3 | ✅ Pass | products structural check flags/passes correctly |
| Scenario 4 | ✅ Pass | journey/journeys unchanged, skills.js gap closed |
| Edge case | ✅ Pass | tfhc-s7 windowed-match fix retained |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
