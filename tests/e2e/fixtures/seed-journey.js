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
