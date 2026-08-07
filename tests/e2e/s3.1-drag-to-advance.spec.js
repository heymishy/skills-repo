// s3.1-drag-to-advance.spec.js — E2E coverage for s3.1 (Epic 3, kanban boards
// feature), local NODE_ENV=test mocked harness (ADR-018).
// Story: artefacts/2026-07-24-interactive-kanban-boards/stories/s3.1-drag-to-advance.md
// Test plan: artefacts/2026-07-24-interactive-kanban-boards/test-plans/s3.1-drag-to-advance-test-plan.md
//
// AC1: dragging a ready card onto its single valid next-stage column advances
//      it for real (confirmed by the card appearing in the new column after
//      the drop, calling the exact same /api/board/journey/:id/advance
//      endpoint s1.1 built).
// AC2: dragging a ready card onto a column that is NOT its valid next stage
//      is rejected client-side -- confirmed via network request interception
//      that zero requests reach the advance endpoint -- and the card stays
//      in its original column.
// AC3: a not-ready card is not draggable at all (the `draggable` attribute is
//      absent) -- this satisfies the story's own "either the drag doesn't
//      initiate, or..." framing via the simpler, safer branch.
//
// AC4 (a real, non-readiness gate-confirm validation failure reverting with
// the actual reason) is NOT covered here: this repo's own server.js hardcodes
// setValidate() to always succeed whenever NODE_ENV=test (the same env this
// entire E2E harness runs under), so no genuine validation failure can ever
// be produced through a real HTTP-driven browser session -- this is the
// identical, pre-existing constraint that caused s1.1's own AC5 (the routine,
// non-drag version of this same failure path) to be tested at the
// integration level instead of E2E. s3.1's drag path calls the exact same
// _kbTriggerAdvance()/_kbAdvanceErrorMessage() functions the click path uses
// (refactored to be shared, not duplicated) -- see
// tests/check-s3.1-drag-to-advance.js for the source-level assertion that
// confirms this reuse, and decisions.md for the full writeup.
//
// Uses /test/seed-board-journey (NODE_ENV=test only, server.js) to create a
// REAL journey + HTML session with a controllable `done` state, the same
// fixture s1.1's own E2E spec already established.

const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

async function createProduct(request, name) {
  const draftRes = await request.post('/products/new', {
    data: { name: name, description: 's3.1 E2E fixture product.' },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(draftRes.status(), 'POST /products/new (draft)').toBe(200);

  const confirmRes = await request.post('/products/confirm', {
    form: { name: name, description: 's3.1 E2E fixture product.' },
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

/**
 * Perform a real HTML5 drag-and-drop from a source element to a target
 * element via Playwright's low-level mouse API (dragTo() alone does not
 * reliably fire dragstart/dragover/drop for elements using the native
 * draggable="true" attribute in all cases, so this uses the same manual
 * pointer-sequence approach Playwright's own docs recommend for HTML5 DnD).
 */
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

withAuth('AC1: dragging a ready card onto its valid next-stage column advances it for real', async ({ page }) => {
  const request = page.context().request;
  const productId = await createProduct(request, 'S3.1 Drag Valid Product ' + Date.now());
  const seeded = await seedBoardJourney(request, {
    productId: productId,
    stage: 'discovery',
    done: true,
    featureSlug: 's3-1-drag-valid-feature-' + Date.now()
  });

  await page.goto('/products/' + productId + '/kanban');
  await page.waitForLoadState('networkidle');

  const cardSelector = '.kb-card[data-journey-id="' + seeded.journeyId + '"]';
  await expect(page.locator(cardSelector)).toBeVisible();
  await expect(page.locator(cardSelector)).toHaveAttribute('draggable', 'true');

  // discovery's real next stage is benefit-metric (STAGE_SEQUENCE, journey-store.js)
  await dragAndDrop(page, cardSelector, '[data-stage="benefit-metric"]');
  await page.waitForLoadState('networkidle');

  const movedCard = page.locator('[data-stage="benefit-metric"] ' + cardSelector);
  await expect(movedCard).toBeVisible();
  const oldColumnCard = page.locator('[data-stage="discovery"] ' + cardSelector);
  await expect(oldColumnCard).toHaveCount(0);
});

withAuth('AC2: dragging a ready card onto an invalid column is rejected client-side, no server call made', async ({ page }) => {
  const request = page.context().request;
  const productId = await createProduct(request, 'S3.1 Drag Invalid Product ' + Date.now());
  const seeded = await seedBoardJourney(request, {
    productId: productId,
    stage: 'discovery',
    done: true,
    featureSlug: 's3-1-drag-invalid-feature-' + Date.now()
  });

  await page.goto('/products/' + productId + '/kanban');
  await page.waitForLoadState('networkidle');

  let advanceCallCount = 0;
  await page.route('**/api/board/journey/**/advance', function(route) {
    advanceCallCount++;
    route.continue();
  });

  page.once('dialog', function(dialog) { dialog.accept(); });

  const cardSelector = '.kb-card[data-journey-id="' + seeded.journeyId + '"]';
  await expect(page.locator(cardSelector)).toBeVisible();

  // "test-plan" is NOT discovery's valid next stage (benefit-metric is) --
  // a real board renders many columns beyond just the immediate next one.
  await dragAndDrop(page, cardSelector, '[data-stage="test-plan"]');
  await page.waitForTimeout(300); // allow any (incorrect) fetch to have been issued

  expect(advanceCallCount, 'expected zero requests to the advance endpoint for an invalid-column drop').toBe(0);
  const stillInOriginalColumn = page.locator('[data-stage="discovery"] ' + cardSelector);
  await expect(stillInOriginalColumn).toBeVisible();
});

withAuth('AC3: a not-ready card is not draggable at all', async ({ page }) => {
  const request = page.context().request;
  const productId = await createProduct(request, 'S3.1 Not Ready Product ' + Date.now());
  const seeded = await seedBoardJourney(request, {
    productId: productId,
    stage: 'discovery',
    done: false,
    featureSlug: 's3-1-notready-feature-' + Date.now()
  });

  await page.goto('/products/' + productId + '/kanban');
  await page.waitForLoadState('networkidle');

  const card = page.locator('.kb-card[data-journey-id="' + seeded.journeyId + '"]');
  await expect(card).toBeVisible();
  // Either the attribute is absent, or explicitly "false" -- both mean the
  // browser will refuse to initiate a drag on this element.
  const draggableAttr = await card.getAttribute('draggable');
  expect(draggableAttr === null || draggableAttr === 'false', 'expected a not-ready card to never be draggable, got draggable="' + draggableAttr + '"').toBe(true);
});
