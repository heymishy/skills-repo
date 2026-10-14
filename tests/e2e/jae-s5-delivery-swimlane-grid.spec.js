// jae-s5-delivery-swimlane-grid.spec.js -- E2E coverage for AC1 (column
// alignment) and AC8 (pinned-label horizontal scroll) of story
// artefacts/2026-10-14-journey-authoring-experience/stories/jae-s5.md
//
// NOT in npm test chain (ADR-018, matching jcx-s6/jcx-s3/ic-s2/ic-s3/ic-s4's
// own precedent) -- run with:
//   npx playwright test tests/e2e/jae-s5-delivery-swimlane-grid.spec.js
//
// Modelled directly on tests/e2e/jcx-s6-swimlane-grid.spec.js's own AC1/AC7
// tests -- same fixture, same assertions, different view toggle and row
// selectors. Same local-Postgres dependency as jcx-s3-emotion-curve.spec.js
// and jcx-s6-swimlane-grid.spec.js.

const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

function uniqueName(label) {
  return 'jae-s5-' + label + '-' + Date.now();
}

function extractCsrfToken(html) {
  const hiddenInput = html.match(/name="_csrf" value="([^"]*)"/);
  if (hiddenInput) return hiddenInput[1];
  const jsVar = html.match(/var csrfToken=("(?:[^"\\]|\\.)*")/);
  return jsVar ? JSON.parse(jsVar[1]) : null;
}

async function seedJourneyWithStages(request, journeyName, stageNames) {
  const homeHtml = await (await request.get('/')).text();
  const homeCsrf = extractCsrfToken(homeHtml);
  expect(homeCsrf, 'the authenticated home page must embed a usable CSRF token').toBeTruthy();

  const journeyRes = await request.post('/journeys', {
    data: { name: journeyName, _csrf: homeCsrf },
    headers: { 'Content-Type': 'application/json' },
    maxRedirects: 0
  });
  const journeyId = journeyRes.headers()['location'].split('/journeys/')[1];
  const canvasHtml = await (await request.get('/journeys/' + journeyId)).text();
  const canvasCsrf = extractCsrfToken(canvasHtml);
  const stageIds = [];
  for (const name of stageNames) {
    const stageRes = await request.post('/journeys/' + journeyId + '/stages', {
      data: { name: name, _csrf: canvasCsrf },
      headers: { 'Content-Type': 'application/json' }
    });
    const stageBody = await stageRes.json();
    stageIds.push(stageBody.id);
  }
  return { journeyId, csrfToken: canvasCsrf, stageIds };
}

async function openDeliveryView(page, journeyId) {
  await page.goto('/journeys/' + journeyId);
  await page.locator('.sw-canvas-view-toggle-btn[data-view="delivery"]').click();
}

withAuth('Delivery grid stages render left-to-right as columns, aligned across rows (AC1)', async ({ page }) => {
  const request = page.context().request;
  const { journeyId } = await seedJourneyWithStages(request, uniqueName('journey'), ['Evaluate', 'Discover', 'Purchase']);

  await openDeliveryView(page, journeyId);
  await page.waitForSelector('.sw-delivery-swimlane-grid');

  const headers = page.locator('.sw-delivery-swimlane-grid .sw-cx-grid-cell--header');
  await expect(headers).toHaveCount(3);
  const xs = [];
  for (let i = 0; i < 3; i++) {
    const box = await headers.nth(i).boundingBox();
    xs.push(box.x);
  }
  expect(xs[0], 'expected Evaluate to render left of Discover').toBeLessThan(xs[1]);
  expect(xs[1], 'expected Discover to render left of Purchase').toBeLessThan(xs[2]);

  const coverageCells = page.locator('.sw-delivery-swimlane-grid .sw-cx-grid-row--coverage-status .sw-cx-grid-cell');
  await expect(coverageCells).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    const headerBox = await headers.nth(i).boundingBox();
    const coverageBox = await coverageCells.nth(i).boundingBox();
    expect(Math.abs(headerBox.x - coverageBox.x), 'expected stage ' + i + "'s own coverage-status cell to share its header column's X position").toBeLessThan(2);
  }
});

withAuth('many-stage Delivery grid scrolls horizontally with row labels pinned, keyboard-operable (AC8)', async ({ page }) => {
  const request = page.context().request;
  const stageNames = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];
  const { journeyId } = await seedJourneyWithStages(request, uniqueName('journey'), stageNames);

  await page.setViewportSize({ width: 1280, height: 800 });
  await openDeliveryView(page, journeyId);
  await page.waitForSelector('.sw-delivery-swimlane-grid');

  const track = page.locator('.sw-delivery-swimlane-grid .sw-cx-grid-row--mapped-features .sw-cx-grid-row-track');
  const scrollWidth = await track.evaluate(el => el.scrollWidth);
  const clientWidth = await track.evaluate(el => el.clientWidth);
  expect(scrollWidth, 'expected an 8-stage journey to overflow its track at a 1280px viewport').toBeGreaterThan(clientWidth);

  const labelBefore = await page.locator('.sw-delivery-swimlane-grid .sw-cx-grid-row--mapped-features .sw-cx-row-label').boundingBox();
  await track.evaluate(el => { el.scrollLeft = 300; });
  const labelAfter = await page.locator('.sw-delivery-swimlane-grid .sw-cx-grid-row--mapped-features .sw-cx-row-label').boundingBox();
  expect(Math.abs(labelBefore.x - labelAfter.x), 'expected the row label to stay pinned after scrolling the track').toBeLessThan(2);

  await track.focus();
  await expect(track).toBeFocused();
});
