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
//
// jae-s5 (decisions.md 2026-10-15) -- rewritten. The original AC1/AC2 both
// drove `.sw-stage-card` via drag-and-drop inside #sw-journey-stages;
// neither exists any more -- the Delivery view's card stack was replaced by
// a swimlane grid (tests/e2e/jae-s5-delivery-swimlane-grid.spec.js covers
// its own column-alignment/scroll ACs), and drag-and-drop reordering was
// explicitly scoped out (AC5 never required it; only the up/down buttons
// remain). These 2 tests now exercise the up/down button path instead,
// asserting the SAME two outcomes the originals proved (a reorder
// persists; a failed reorder shows the exact existing error text) via the
// mechanism that actually exists today (reload-on-success, no DOM-revert
// needed since nothing is optimistically moved any more).

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

async function openDeliveryView(page, journeyId) {
  await page.goto('/journeys/' + journeyId);
  await page.locator('.sw-canvas-view-toggle-btn[data-view="delivery"]').click();
}

withAuth('AC1 (superseded, jae-s5): clicking the up button moves a stage earlier and persists after reload', async ({ page }) => {
  const request = page.context().request;
  const journeyId = await seedJourneyWithStages(request, ['Discover', 'Compare', 'Buy']);

  await openDeliveryView(page, journeyId);
  await page.waitForSelector('.sw-delivery-swimlane-grid');

  // Move the 3rd stage ("Buy") up once -- its own "up" button is the
  // 2nd .sw-stage-move button in that header cell (index 0 = up, 1 = down).
  const buyHeader = page.locator('.sw-delivery-swimlane-grid .sw-cx-grid-cell--header', { hasText: 'Buy' });
  await buyHeader.locator('.sw-stage-move[data-direction="up"]').click();

  // Success reloads the page (jae-s5's own reorder-mechanism decision) --
  // wait for the navigation, then re-open Delivery view post-reload.
  await page.waitForLoadState('networkidle');
  await page.locator('.sw-canvas-view-toggle-btn[data-view="delivery"]').click();
  await page.waitForSelector('.sw-delivery-swimlane-grid');

  const namesAfter = await page.locator('.sw-delivery-swimlane-grid .sw-stage-name').allTextContents();
  expect(namesAfter[1], 'AC1: "Buy" moved from last to the middle position after one "up" click and a reload').toBe('Buy');
});

withAuth('AC2 (superseded, jae-s5): a reorder whose PATCH fails shows the exact error text, no reload', async ({ page }) => {
  const request = page.context().request;
  const journeyId = await seedJourneyWithStages(request, ['Discover', 'Compare']);

  await page.route('**/stages-order', function(route) { route.abort('failed'); });

  await openDeliveryView(page, journeyId);
  await page.waitForSelector('.sw-delivery-swimlane-grid');

  const namesBefore = await page.locator('.sw-delivery-swimlane-grid .sw-stage-name').allTextContents();
  const compareHeader = page.locator('.sw-delivery-swimlane-grid .sw-cx-grid-cell--header', { hasText: 'Compare' });
  await compareHeader.locator('.sw-stage-move[data-direction="up"]').click();
  await page.waitForTimeout(500);

  // jae-s5: no reload happens on failure (only on success) -- the grid's
  // own column order is therefore still exactly what it was before the
  // click, with no DOM-revert step needed (nothing was optimistically
  // moved in the first place).
  const namesAfter = await page.locator('.sw-delivery-swimlane-grid .sw-stage-name').allTextContents();
  expect(namesAfter, 'AC2: order is unchanged after a failed save (no reload happened)').toEqual(namesBefore);

  const errorEl = page.locator('#sw-stage-reorder-error');
  await expect(errorEl, 'AC2: exact toast text shown on save failure').toHaveText('Stage order not saved — please try again');
});
