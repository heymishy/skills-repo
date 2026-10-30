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
