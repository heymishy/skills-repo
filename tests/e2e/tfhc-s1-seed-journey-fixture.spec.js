'use strict';
const { test, expect } = require('@playwright/test');
const { seedApprovalJourney } = require('./fixtures/seed-journey');
const { withAuth } = require('./fixtures/auth');

test('tfhc-s1: seedApprovalJourney seeds a journey with sensible defaults and returns a usable journeyId', async ({ page }) => {
  const seeded = await seedApprovalJourney(page.request);
  expect(seeded.journeyId, 'expected a real journeyId').toBeTruthy();

  // Prove the journeyId is real and addressable, not just a 200 with no usable side effect.
  const stateRes = await page.request.get('/api/journey/' + seeded.journeyId);
  expect(stateRes.status(), 'GET /api/journey/:journeyId').toBe(200);
});

withAuth('tfhc-s1: seedApprovalJourney accepts overrides and applies them server-side', async ({ page }) => {
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
