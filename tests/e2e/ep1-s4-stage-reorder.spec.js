// ep1-s4-stage-reorder.spec.js — E2E coverage for AC1 (interaction) and AC2
// (interaction) of story
// artefacts/2026-10-05-customer-journey-as-first-class/stories/ep1-s4.md
//
// NOT in npm test chain (ADR-018, matching ep1-s3-stage-panel-focus-management.spec.js's
// own precedent) -- run with:
//   npx playwright test tests/e2e/ep1-s4-stage-reorder.spec.js
//
// KNOWN GAP (pre-existing, logged in decisions.md D5, not introduced by this
// story): src/web-ui/adapters/fake-test-db.js has no in-memory backing for
// customer_journeys/customer_journey_stages. Requires a real DATABASE_URL.

const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

function uniqueName(label) {
  return 'ep1-s4-' + label + '-' + Date.now();
}

function extractCsrfToken(html) {
  const hiddenInput = html.match(/name="_csrf" value="([^"]*)"/);
  if (hiddenInput) return hiddenInput[1];
  const jsVar = html.match(/var csrfToken=("(?:[^"\\]|\\.)*")/);
  return jsVar ? JSON.parse(jsVar[1]) : null;
}

/**
 * Manual pointer-sequence drag, mirroring tests/e2e/s3.1-drag-to-advance.spec.js's
 * own documented approach (more reliable for native draggable="true" elements
 * than Playwright's dragTo()).
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

async function seedJourneyWithStages(request, stageNames) {
  const homeHtml = await (await request.get('/')).text();
  const homeCsrf = extractCsrfToken(homeHtml);
  const journeyRes = await request.post('/journeys', {
    data: { name: uniqueName('journey'), _csrf: homeCsrf },
    headers: { 'Content-Type': 'application/json' },
    maxRedirects: 0
  });
  const journeyId = journeyRes.headers()['location'].split('/journeys/')[1];
  const canvasHtml = await (await request.get('/journeys/' + journeyId)).text();
  const canvasCsrf = extractCsrfToken(canvasHtml);
  for (const name of stageNames) {
    await request.post('/journeys/' + journeyId + '/stages', {
      data: { name: name, _csrf: canvasCsrf },
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return journeyId;
}

withAuth('AC1: dragging a stage card to a new position persists the new order', async ({ page }) => {
  const request = page.context().request;
  const journeyId = await seedJourneyWithStages(request, ['Discover', 'Compare', 'Buy']);

  await page.goto('/journeys/' + journeyId);
  await page.waitForLoadState('networkidle');

  await dragAndDrop(page, '.sw-stage-card >> nth=0', '.sw-stage-card >> nth=2');
  await page.waitForTimeout(300);

  await page.reload();
  await page.waitForLoadState('networkidle');
  const namesAfterReload = await page.locator('.sw-stage-name').allTextContents();
  expect(namesAfterReload[0], 'AC1: the dragged stage is no longer first after a real reload').not.toBe('Discover');
});

withAuth('AC2: a reorder whose PATCH fails rolls back visually and shows the exact error text', async ({ page }) => {
  const request = page.context().request;
  const journeyId = await seedJourneyWithStages(request, ['Discover', 'Compare']);

  await page.route('**/stages-order', function(route) { route.abort('failed'); });

  await page.goto('/journeys/' + journeyId);
  await page.waitForLoadState('networkidle');

  const namesBefore = await page.locator('.sw-stage-name').allTextContents();
  await dragAndDrop(page, '.sw-stage-card >> nth=0', '.sw-stage-card >> nth=1');
  await page.waitForTimeout(500);

  const namesAfter = await page.locator('.sw-stage-name').allTextContents();
  expect(namesAfter, 'AC2: order reverts to its pre-drag state after a failed save').toEqual(namesBefore);

  const errorEl = page.locator('#sw-stage-reorder-error');
  await expect(errorEl, 'AC2: exact toast text shown on save failure').toHaveText('Stage order not saved — please try again');
});
