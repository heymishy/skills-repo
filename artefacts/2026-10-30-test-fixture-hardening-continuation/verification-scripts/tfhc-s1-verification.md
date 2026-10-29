# AC Verification Script: Extract a shared E2E fixture for seeding an approval journey

**Story reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s1-e2e-seed-journey-fixture.md
**Technical test plan:** artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s1-e2e-seed-journey-fixture-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the repo root.
2. Start the server in test mode so the seed endpoint is enabled:
   ```powershell
   # PowerShell
   $env:NODE_ENV = "test"
   node src/web-ui/server.js
   ```
   ```bash
   # bash/zsh
   NODE_ENV=test node src/web-ui/server.js
   ```
3. Leave that server running in its own terminal for the rest of this script.

**Reset between scenarios:** None needed — each scenario seeds its own fresh journey.

---

## Scenarios

### Scenario 1: The shared fixture seeds a usable journey with sensible defaults

**Covers:** AC1

**Steps:**
1. Run: `npx playwright test tests/e2e/ep3-s1-regression.spec.js --headed`

**Expected outcome:**
> The test seeds a new journey automatically (no manual data entry) and then successfully opens the confirm-back screen for that journey. The test reports as passed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: You can ask for a specific stage without rebuilding the whole payload

**Covers:** AC2

**Steps:**
1. Run: `npx playwright test tests/e2e/ep3-s1-regression.spec.js`

**Expected outcome:**
> The seeded journey ends up at the `test-plan` stage, shown by the confirm-back screen for the `definition` stage being reachable and visible — proving the specific stage you asked for was actually applied, not just the system's own default.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Two existing checks still work correctly after switching to the shared fixture

**Covers:** AC3

**Steps:**
1. Run: `npx playwright test tests/e2e/ep3-s1-regression.spec.js tests/e2e/ep2-s4-concurrent-merge.spec.js`

**Expected outcome:**
> Both checks report "passed" — the same result they gave before this change, just now using the shared fixture behind the scenes instead of each writing its own duplicate setup code.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The migration didn't change whether these checks pass or fail

**Covers:** AC4

**Steps:**
1. Run: `npx playwright test tests/e2e/ep3-s1-regression.spec.js tests/e2e/ep2-s4-concurrent-merge.spec.js` three times in a row.

**Expected outcome:**
> All three runs report "passed" for both checks, every time — the same outcome they gave before migration. (This script does not check for flakiness beyond this — that's watched separately, after this change ships, not required to pass right now.)

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Scenario 4 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
