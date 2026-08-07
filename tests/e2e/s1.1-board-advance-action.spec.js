// s1.1-board-advance-action.spec.js — E2E coverage for s1.1 (Epic 1, kanban
// boards feature), local NODE_ENV=test mocked harness (ADR-018).
// Story: artefacts/2026-07-24-interactive-kanban-boards/stories/s1.1-board-advance-action.md
// Test plan: artefacts/2026-07-24-interactive-kanban-boards/test-plans/s1.1-board-advance-action-test-plan.md
//
// AC1 (visual confirmation layer, in addition to check-s1.1-board-advance-action.js's
//      API-level Integration test): clicking a ready card's "Advance" action in a real
//      browser moves the card into its new stage's column on the next render.
// AC2 (visual confirmation): a not-ready card has no clickable Advance control at all.
//
// Uses /test/seed-board-journey (NODE_ENV=test only, server.js) to create a REAL
// journey + HTML session with a controllable `done` state, bypassing the slow real
// chat-turn flow -- mirrors the existing /test/seed-definition-session precedent.

const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

async function createProduct(request, name) {
  const draftRes = await request.post('/products/new', {
    data: { name: name, description: 's1.1 E2E fixture product.' },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(draftRes.status(), 'POST /products/new (draft)').toBe(200);

  const confirmRes = await request.post('/products/confirm', {
    form: { name: name, description: 's1.1 E2E fixture product.' },
    maxRedirects: 0
  });
  expect(confirmRes.status(), 'POST /products/confirm should redirect to the product view').toBe(302);
  const location = confirmRes.headers()['location'];
  expect(location).toMatch(/^\/products\//);
  return location.split('/products/')[1];
}

async function seedBoardJourney(request, opts) {
  const res = await request.post('/test/seed-board-journey', {
    data: opts,
    headers: { 'Content-Type': 'application/json' }
  });
  expect(res.status(), 'POST /test/seed-board-journey').toBe(200);
  return res.json();
}

withAuth('AC1: clicking a ready card\'s Advance action moves it to its next stage column', async ({ page }) => {
  const request = page.context().request;
  const productId = await createProduct(request, 'S1.1 Ready Product ' + Date.now());
  const seeded = await seedBoardJourney(request, {
    productId: productId,
    stage: 'discovery',
    done: true,
    featureSlug: 's1-1-ready-feature-' + Date.now()
  });

  await page.goto('/products/' + productId + '/kanban');
  await page.waitForLoadState('networkidle');

  const card = page.locator('[data-journey-id="' + seeded.journeyId + '"]').first();
  await expect(card).toBeVisible();
  const advanceBtn = card.locator('.kb-advance-btn');
  await expect(advanceBtn).toBeVisible();

  await advanceBtn.click();
  await page.waitForLoadState('networkidle');

  // discovery's real next stage is benefit-metric (STAGE_SEQUENCE, journey-store.js)
  const movedCard = page.locator('[data-stage="benefit-metric"] [data-journey-id="' + seeded.journeyId + '"]');
  await expect(movedCard).toBeVisible();
  const oldColumnCard = page.locator('[data-stage="discovery"] [data-journey-id="' + seeded.journeyId + '"]');
  await expect(oldColumnCard).toHaveCount(0);
});

withAuth('AC2: a not-ready card has no clickable Advance control in the browser', async ({ page }) => {
  const request = page.context().request;
  const productId = await createProduct(request, 'S1.1 Not Ready Product ' + Date.now());
  const seeded = await seedBoardJourney(request, {
    productId: productId,
    stage: 'discovery',
    done: false,
    featureSlug: 's1-1-notready-feature-' + Date.now()
  });

  await page.goto('/products/' + productId + '/kanban');
  await page.waitForLoadState('networkidle');

  const card = page.locator('[data-journey-id="' + seeded.journeyId + '"]').first();
  await expect(card).toBeVisible();
  const advanceBtn = card.locator('.kb-advance-btn');
  await expect(advanceBtn).toHaveCount(0);
});
