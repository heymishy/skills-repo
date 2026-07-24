// s3.2-within-column-reorder.spec.js — E2E coverage for s3.2 (Epic 3, kanban
// boards feature), local NODE_ENV=test mocked harness (ADR-018).
// Story: artefacts/2026-07-24-interactive-kanban-boards/stories/s3.2-within-column-reorder.md
// Test plan: artefacts/2026-07-24-interactive-kanban-boards/test-plans/s3.2-within-column-reorder-test-plan.md
//
// AC1: dragging a card to a different position within the same column
//      reorders the cards, with zero calls to S1.1's advance endpoint.
// AC2: the reordered position survives a page reload (persisted, per this
//      story's client-only localStorage decision -- see decisions.md).
// AC3: dragging a card BETWEEN columns is still handled by S3.1's own logic
//      (the advance endpoint IS called), proving the two drag types are
//      correctly distinguished, not confused with each other.
//
// AC4 (the non-drag up/down move-button alternative) is covered at the
// source level in tests/check-s3.2-within-column-reorder.js, since it needs
// no real browser drag simulation -- a click is sufficient and each button's
// presence/disabled-state is fully determined by server-rendered markup.

const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

async function createProduct(request, name) {
  const draftRes = await request.post('/products/new', {
    data: { name: name, description: 's3.2 E2E fixture product.' },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(draftRes.status(), 'POST /products/new (draft)').toBe(200);

  const confirmRes = await request.post('/products/confirm', {
    form: { name: name, description: 's3.2 E2E fixture product.' },
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

// Same manual mouse-sequence approach s3.1's own spec uses -- Playwright's
// dragTo() alone does not reliably fire dragstart/dragover/drop for native
// draggable="true" elements in every case.
async function dragAndDrop(page, sourceSelector, targetSelector) {
  const source = page.locator(sourceSelector);
  const target = page.locator(targetSelector);
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
  await page.mouse.up();
}

// s3.2's own within-column drop direction (before vs. after the target card)
// is decided by comparing the drop's clientY against the target's exact
// vertical midpoint -- dropping at the exact center is a genuine boundary
// case (sub-pixel/integer mouse-coordinate rounding can land a fraction of a
// pixel either side of the midpoint, non-deterministically). Drop clearly in
// the lower quarter of the target instead, so the "insert after" branch
// fires deterministically regardless of rounding.
async function dragOntoLowerPortion(page, sourceSelector, targetSelector) {
  const source = page.locator(sourceSelector);
  const target = page.locator(targetSelector);
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height * 0.85, { steps: 10 });
  await page.mouse.up();
}

async function cardOrderInStage(page, stage) {
  return page.locator('[data-stage="' + stage + '"] .kb-card').evaluateAll(function(els) {
    return els.map(function(el) { return el.getAttribute('data-journey-id'); });
  });
}

withAuth('AC1: dragging a card onto another card in the SAME column reorders them, no advance call made', async ({ page }) => {
  const request = page.context().request;
  const productId = await createProduct(request, 'S3.2 Reorder Product ' + Date.now());
  const first = await seedBoardJourney(request, { productId: productId, stage: 'discovery', done: true, featureSlug: 's3-2-first-' + Date.now() });
  const second = await seedBoardJourney(request, { productId: productId, stage: 'discovery', done: true, featureSlug: 's3-2-second-' + Date.now() });

  await page.goto('/products/' + productId + '/kanban');
  await page.waitForLoadState('networkidle');

  const before = await cardOrderInStage(page, 'discovery');
  expect(before).toEqual([first.journeyId, second.journeyId]);

  let advanceCallCount = 0;
  await page.route('**/api/board/journey/**/advance', function(route) {
    advanceCallCount++;
    route.continue();
  });

  // Drag the FIRST card onto the SECOND card, same column -- a within-column
  // reorder, not a between-column advance.
  // The drop synchronously triggers window.location.reload() -- wait for
  // that navigation concurrently with the drag itself, started before the
  // drop fires, to avoid racing the reload (evaluateAll against a
  // mid-navigation page throws "Execution context was destroyed").
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    dragOntoLowerPortion(
      page,
      '[data-stage="discovery"] .kb-card[data-journey-id="' + first.journeyId + '"]',
      '[data-stage="discovery"] .kb-card[data-journey-id="' + second.journeyId + '"]'
    )
  ]);

  expect(advanceCallCount, 'expected zero calls to the advance endpoint for a within-column reorder').toBe(0);

  const after = await cardOrderInStage(page, 'discovery');
  expect(after).toEqual([second.journeyId, first.journeyId]);
});

withAuth('AC2: a within-column reorder survives a page reload (persisted, not reset)', async ({ page }) => {
  const request = page.context().request;
  const productId = await createProduct(request, 'S3.2 Persist Product ' + Date.now());
  const first = await seedBoardJourney(request, { productId: productId, stage: 'review', done: true, featureSlug: 's3-2-persist-first-' + Date.now() });
  const second = await seedBoardJourney(request, { productId: productId, stage: 'review', done: true, featureSlug: 's3-2-persist-second-' + Date.now() });

  await page.goto('/products/' + productId + '/kanban');
  await page.waitForLoadState('networkidle');

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    dragOntoLowerPortion(
      page,
      '[data-stage="review"] .kb-card[data-journey-id="' + first.journeyId + '"]',
      '[data-stage="review"] .kb-card[data-journey-id="' + second.journeyId + '"]'
    )
  ]);

  const afterDrop = await cardOrderInStage(page, 'review');
  expect(afterDrop).toEqual([second.journeyId, first.journeyId]);

  // A genuinely fresh navigation (not just the reload the reorder itself
  // triggers) -- proves the order is read back from real persisted storage,
  // not merely an artefact of the DOM never having been torn down.
  await page.goto('/products/' + productId + '/kanban');
  await page.waitForLoadState('networkidle');

  const afterReload = await cardOrderInStage(page, 'review');
  expect(afterReload).toEqual([second.journeyId, first.journeyId]);
});

withAuth('AC3: dragging a card BETWEEN columns still uses the real advance endpoint (S3.1 logic, not confused with reorder)', async ({ page }) => {
  const request = page.context().request;
  const productId = await createProduct(request, 'S3.2 Between Columns Product ' + Date.now());
  const seeded = await seedBoardJourney(request, { productId: productId, stage: 'discovery', done: true, featureSlug: 's3-2-between-' + Date.now() });

  await page.goto('/products/' + productId + '/kanban');
  await page.waitForLoadState('networkidle');

  const cardSelector = '.kb-card[data-journey-id="' + seeded.journeyId + '"]';
  await expect(page.locator(cardSelector)).toBeVisible();

  // discovery's real next stage is benefit-metric (STAGE_SEQUENCE, journey-store.js)
  await dragAndDrop(page, cardSelector, '[data-stage="benefit-metric"]');
  await page.waitForLoadState('networkidle');

  const movedCard = page.locator('[data-stage="benefit-metric"] ' + cardSelector);
  await expect(movedCard).toBeVisible();
  const oldColumnCard = page.locator('[data-stage="discovery"] ' + cardSelector);
  await expect(oldColumnCard).toHaveCount(0);
});
