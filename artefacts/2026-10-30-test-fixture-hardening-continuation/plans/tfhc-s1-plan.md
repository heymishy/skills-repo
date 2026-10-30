# Extract a shared E2E fixture for seeding an approval journey — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/tfhc-s1-e2e-seed-journey-fixture`
**Worktree:** `.worktrees/tfhc-s1-e2e-seed-journey-fixture`
**Test command:** `npx playwright test tests/e2e/tfhc-s1-seed-journey-fixture.spec.js tests/e2e/ep3-s1-regression.spec.js tests/e2e/ep2-s4-concurrent-merge.spec.js` (scoped), full E2E: `npx playwright test`

---

## Discovery findings that shaped this plan

1. **`tests/e2e/ep2-s4-concurrent-merge.spec.js` already hand-rolls its own local `seedApprovalJourney(request, featureSlug)` helper** (lines 73-82) — a second positional `featureSlug` string argument, not an overrides object. This is itself an undiscovered instance of the exact duplication this story closes. Task 4 below removes this local helper entirely and updates both of its call sites (lines 208, 262) to pass a proper overrides object to the shared fixture, matching the shape `ep3-s1-regression.spec.js` already uses.
2. The shared fixture's internal failure mode (throw a plain `Error` on a non-200 response) differs from the migrated files' previous literal `expect(seedRes.status(), '...').toBe(200)` line — both fail the test loudly on the same condition, just via a different mechanism. This mirrors `tsir-s1`'s own precedent (the shared `journeyFixture()` has no embedded `expect()` calls; assertions stay with the caller). The `expect(seeded.journeyId, ...).toBeTruthy()` line in each caller is preserved unchanged.

---

## File map

```
Create:
  tests/e2e/fixtures/seed-journey.js              — seedApprovalJourney(request, overrides) fixture (AC1, AC2)
  tests/e2e/tfhc-s1-seed-journey-fixture.spec.js   — dedicated spec testing the fixture directly (AC1, AC2)

Modify:
  tests/e2e/ep3-s1-regression.spec.js           — replace inline seed block with the shared fixture (AC3)
  tests/e2e/ep2-s4-concurrent-merge.spec.js     — remove local duplicate helper, migrate both call sites (AC3)
```

---

## Task 1: Fixture seeds a journey with sensible defaults (AC1)

**Files:**
- Create: `tests/e2e/fixtures/seed-journey.js`
- Test: `tests/e2e/tfhc-s1-seed-journey-fixture.spec.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
const { test, expect } = require('@playwright/test');
const { seedApprovalJourney } = require('./fixtures/seed-journey');

test('tfhc-s1: seedApprovalJourney seeds a journey with sensible defaults and returns a usable journeyId', async ({ page }) => {
  const seeded = await seedApprovalJourney(page.request);
  expect(seeded.journeyId, 'expected a real journeyId').toBeTruthy();

  // Prove the journeyId is real and addressable, not just a 200 with no usable side effect.
  const stateRes = await page.request.get('/api/journey/' + seeded.journeyId);
  expect(stateRes.status(), 'GET /api/journey/:journeyId').toBe(200);
});
```

- [ ] **Step 2: Run test — must fail**

```bash
npx playwright test tests/e2e/tfhc-s1-seed-journey-fixture.spec.js
```

Expected output: `Error: Cannot find module './fixtures/seed-journey'` (module does not exist yet)

- [ ] **Step 3: Write minimal implementation**

```javascript
'use strict';

/**
 * seed-journey.js — shared E2E fixture for seeding an approval journey (tfhc-s1)
 *
 * Wraps the real /test/seed-approval-journey endpoint (NODE_ENV=test only,
 * src/web-ui/server.js:2663) so Playwright specs don't each hand-roll their
 * own inline payload -- closing the same E2E-layer duplication risk tsir-s1
 * already closed at the journey.js unit-test layer.
 *
 * Usage:
 *   const { seedApprovalJourney } = require('./fixtures/seed-journey');
 *   const seeded = await seedApprovalJourney(page.request);
 *   const seeded = await seedApprovalJourney(page.request, { stage: 'test-plan', completedStages: [...] });
 */

async function seedApprovalJourney(request, overrides) {
  const defaults = {
    featureSlug: 'tfhc-s1-e2e-feature-' + Date.now(),
    stage: 'discovery',
    completedStages: []
  };
  const payload = Object.assign({}, defaults, overrides || {});

  const res = await request.post('/test/seed-approval-journey', {
    data: payload,
    headers: { 'Content-Type': 'application/json' }
  });
  if (res.status() !== 200) {
    throw new Error('seedApprovalJourney: POST /test/seed-approval-journey returned ' + res.status() + ' (expected 200)');
  }
  return res.json();
}

module.exports = { seedApprovalJourney };
```

- [ ] **Step 4: Run test — must pass**

```bash
npx playwright test tests/e2e/tfhc-s1-seed-journey-fixture.spec.js
```

Expected output: `1 passed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same pass/fail counts as the branch-setup baseline (811/812 — see decisions.md RISK-ACCEPT for the one pre-existing, unrelated failure)

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/fixtures/seed-journey.js tests/e2e/tfhc-s1-seed-journey-fixture.spec.js
git commit -m "feat(e2e): add shared seed-journey fixture with sensible defaults"
```

---

## Task 2: Fixture accepts overrides and merges them over its own defaults (AC2)

**Files:**
- Modify: `tests/e2e/tfhc-s1-seed-journey-fixture.spec.js` (add a second test)

- [ ] **Step 1: Write the failing test**

```javascript
test('tfhc-s1: seedApprovalJourney accepts overrides and applies them server-side', async ({ page }) => {
  const seeded = await seedApprovalJourney(page.request, {
    stage: 'test-plan',
    completedStages: [
      { skillName: 'discovery' },
      { skillName: 'benefit-metric' },
      { skillName: 'definition' },
      { skillName: 'review' }
    ]
  });
  expect(seeded.journeyId, 'expected a real journeyId').toBeTruthy();

  // Confirm the stage override actually took effect server-side by reaching
  // the confirm-back interstitial for the 'definition' stage -- the same
  // proof ep3-s1-regression.spec.js already relies on.
  await page.goto('/journey/' + seeded.journeyId + '/stage/definition/confirm-back');
  await expect(page.locator('#cb-regress-reason')).toBeVisible();
});
```

- [ ] **Step 2: Run test — must fail**

```bash
npx playwright test tests/e2e/tfhc-s1-seed-journey-fixture.spec.js
```

Expected output: fails at `page.goto(...)` or the visibility check — Task 1's implementation already merges overrides correctly via `Object.assign`, so this step confirms the test is meaningful (it would have failed against a fixture that ignored `overrides` entirely), not that the implementation is missing. If it already passes, proceed directly to Step 5 — note this in the PR description rather than forcing an artificial fail.

- [ ] **Step 3: Write minimal implementation**

No implementation change required — Task 1's `Object.assign({}, defaults, overrides || {})` already satisfies this AC. This step is a no-op; proceed to Step 4.

- [ ] **Step 4: Run test — must pass**

```bash
npx playwright test tests/e2e/tfhc-s1-seed-journey-fixture.spec.js
```

Expected output: `2 passed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same pass/fail counts as Task 1's Step 5

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/tfhc-s1-seed-journey-fixture.spec.js
git commit -m "test(e2e): cover seed-journey fixture overrides-merge behaviour"
```

---

## Task 3: Capture pre-migration baseline, then migrate ep3-s1-regression.spec.js (AC3, AC4 setup)

**Files:**
- Modify: `tests/e2e/ep3-s1-regression.spec.js`

- [ ] **Step 1: Capture the pre-migration baseline (required before any edit below)**

```bash
npx playwright test tests/e2e/ep3-s1-regression.spec.js tests/e2e/ep2-s4-concurrent-merge.spec.js
```

Expected output: `2 passed` — record this result; Task 5 compares against it.

- [ ] **Step 2: Edit the file** — add the fixture import and replace the inline seed block.

Replace:
```javascript
const { test, expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');
```
with:
```javascript
const { test, expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');
const { seedApprovalJourney } = require('./fixtures/seed-journey');
```

Replace:
```javascript
  const seedRes = await page.request.post('/test/seed-approval-journey', {
    data: {
      featureSlug: featureSlug,
      stage: 'test-plan',
      completedStages: [
        { skillName: 'discovery' },
        { skillName: 'benefit-metric' },
        { skillName: 'definition' },
        { skillName: 'review' }
      ]
    },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(seedRes.status(), 'POST /test/seed-approval-journey').toBe(200);
  const seeded = await seedRes.json();
  expect(seeded.journeyId, 'expected a real journeyId').toBeTruthy();
```
with:
```javascript
  const seeded = await seedApprovalJourney(page.request, {
    featureSlug: featureSlug,
    stage: 'test-plan',
    completedStages: [
      { skillName: 'discovery' },
      { skillName: 'benefit-metric' },
      { skillName: 'definition' },
      { skillName: 'review' }
    ]
  });
  expect(seeded.journeyId, 'expected a real journeyId').toBeTruthy();
```

- [ ] **Step 3: Run the migrated spec — must still pass**

```bash
npx playwright test tests/e2e/ep3-s1-regression.spec.js
```

Expected output: `1 passed` (same result as this file's share of Task 3's Step 1 baseline)

- [ ] **Step 4: (TDD step 4/5 combined with Step 3 above — this is a migration task, not new-behaviour TDD; there is no separate "write failing test first" step since the spec's own existing assertions are the test.)**

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same pass/fail counts as Task 1's Step 5

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/ep3-s1-regression.spec.js
git commit -m "refactor(e2e): migrate ep3-s1-regression.spec.js to shared seed-journey fixture"
```

---

## Task 4: Migrate ep2-s4-concurrent-merge.spec.js, removing its own duplicate helper (AC3)

**Files:**
- Modify: `tests/e2e/ep2-s4-concurrent-merge.spec.js`

- [ ] **Step 1: Edit the file** — add the fixture import, remove the local helper, update both call sites.

Replace:
```javascript
const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3999';
```
with:
```javascript
const { test, expect } = require('@playwright/test');
const { seedApprovalJourney } = require('./fixtures/seed-journey');

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3999';
```

Remove the now-redundant local helper entirely:
```javascript
async function seedApprovalJourney(request, featureSlug) {
  const seedRes = await request.post('/test/seed-approval-journey', {
    data: { featureSlug: featureSlug, stage: 'discovery', completedStages: [{ skillName: 'discovery' }] },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(seedRes.status(), 'POST /test/seed-approval-journey').toBe(200);
  const seeded = await seedRes.json();
  expect(seeded.journeyId, 'expected a real journeyId').toBeTruthy();
  return seeded;
}
```

At both call sites (lines 208 and 262 in the pre-migration file), replace:
```javascript
  const seeded = await seedApprovalJourney(request, featureSlug);
```
with:
```javascript
  const seeded = await seedApprovalJourney(request, { featureSlug: featureSlug, stage: 'discovery', completedStages: [{ skillName: 'discovery' }] });
  expect(seeded.journeyId, 'expected a real journeyId').toBeTruthy();
```

- [ ] **Step 2: Run the migrated spec — must still pass**

```bash
npx playwright test tests/e2e/ep2-s4-concurrent-merge.spec.js
```

Expected output: `1 passed` (same result as this file's share of Task 3's Step 1 baseline)

- [ ] **Step 3: Run full suite — no regressions**

```bash
npm test
```

Expected output: same pass/fail counts as Task 1's Step 5

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/ep2-s4-concurrent-merge.spec.js
git commit -m "refactor(e2e): migrate ep2-s4-concurrent-merge.spec.js to shared seed-journey fixture, removing its own duplicate helper"
```

---

## Task 5: Confirm migration did not change either file's pass/fail outcome (AC4)

**Files:**
- None (verification-only task; no file changes)

- [ ] **Step 1: Re-run both migrated specs together**

```bash
npx playwright test tests/e2e/ep3-s1-regression.spec.js tests/e2e/ep2-s4-concurrent-merge.spec.js
```

Expected output: `2 passed` — identical to Task 3's Step 1 pre-migration baseline (`2 passed`). If the count or pass/fail status differs from the baseline, stop and investigate before proceeding — this is the AC4 collision class Review finding 1-M2 flagged (do not assert flakiness; only confirm the deterministic outcome is unchanged).

- [ ] **Step 2: Record the comparison**

Note in the PR description: "AC4 baseline comparison — pre-migration: 2 passed; post-migration: 2 passed. Outcome unchanged."

- [ ] **Step 3: No commit** — this task produces no file changes, only a verification record for the PR description.

---

<!-- All 4 ACs covered: AC1 (Task 1), AC2 (Task 2), AC3 (Tasks 3-4), AC4 (Task 5). -->
