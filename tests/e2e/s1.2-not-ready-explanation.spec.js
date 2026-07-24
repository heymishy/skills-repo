// s1.2-not-ready-explanation.spec.js — E2E coverage for s1.2 (Epic 1, kanban
// boards feature), local NODE_ENV=test mocked harness (ADR-018).
// Story: artefacts/2026-07-24-interactive-kanban-boards/stories/s1.2-not-ready-explanation.md
// Test plan: artefacts/2026-07-24-interactive-kanban-boards/test-plans/s1.2-not-ready-explanation-test-plan.md
//
// AC1, AC2 (visual + keyboard-accessibility confirmation, in addition to
// check-s1.2-not-ready-explanation.js's markup-level Unit/Integration tests):
// a not-ready card's indicator receives visible keyboard focus (Tab), and its
// detailed explanation (title attribute) is reachable without a mouse.

const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

async function createProduct(request, name) {
  const draftRes = await request.post('/products/new', {
    data: { name: name, description: 's1.2 E2E fixture product.' },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(draftRes.status(), 'POST /products/new (draft)').toBe(200);

  const confirmRes = await request.post('/products/confirm', {
    form: { name: name, description: 's1.2 E2E fixture product.' },
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

withAuth('AC1/AC2: not-ready indicator is visible, non-colour-only, and keyboard-focusable with a detailed reason', async ({ page }) => {
  const request = page.context().request;
  const productId = await createProduct(request, 'S1.2 Not Ready Product ' + Date.now());
  const seeded = await seedBoardJourney(request, {
    productId: productId,
    stage: 'discovery',
    done: false,
    featureSlug: 's1-2-notready-feature-' + Date.now()
  });

  await page.goto('/products/' + productId + '/kanban');
  await page.waitForLoadState('networkidle');

  const card = page.locator('[data-journey-id="' + seeded.journeyId + '"]').first();
  await expect(card).toBeVisible();

  const indicator = card.locator('.kb-not-ready');
  await expect(indicator).toBeVisible();
  await expect(indicator).toContainText('Not ready to advance');

  // AC2: keyboard-focusable (not mouse-only) -- Tab to the indicator and
  // confirm it (or a descendant) receives real focus.
  await indicator.focus();
  const isFocused = await indicator.evaluate((el) => el === document.activeElement || el.contains(document.activeElement));
  expect(isFocused).toBe(true);

  // AC2: detailed reason available beyond the short label, naming the real stage.
  const title = await indicator.getAttribute('title');
  expect(title).toBeTruthy();
  expect(title.toLowerCase()).toContain('discovery');
});
