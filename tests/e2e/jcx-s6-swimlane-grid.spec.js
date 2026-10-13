// jcx-s6-swimlane-grid.spec.js -- E2E coverage for AC1, AC2, AC3, AC7 of
// story artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s6.md
//
// NOT in npm test chain (ADR-018, matching jcx-s3/ic-s2/ic-s3/ic-s4's own
// precedent) -- run with:
//   npx playwright test tests/e2e/jcx-s6-swimlane-grid.spec.js
//
// Same local-Postgres dependency as jcx-s3-emotion-curve.spec.js (ncdv-s2
// already resolved the SSL block that previously made this impractical).

const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

function uniqueName(label) {
  return 'jcx-s6-' + label + '-' + Date.now();
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

async function setStageField(request, journeyId, stageId, csrfToken, field, value) {
  await request.patch('/journeys/' + journeyId + '/stages/' + stageId, {
    data: { field: field, value: value, _csrf: csrfToken },
    headers: { 'Content-Type': 'application/json' }
  });
}

async function openCustomerExperienceView(page, journeyId) {
  await page.goto('/journeys/' + journeyId);
  await page.locator('.sw-canvas-view-toggle-btn[data-view="customer-experience"]').click();
}

withAuth('stages render left-to-right as columns, not stacked (AC1)', async ({ page }) => {
  const request = page.context().request;
  const { journeyId } = await seedJourneyWithStages(request, uniqueName('journey'), ['Evaluate', 'Discover', 'Purchase']);

  await openCustomerExperienceView(page, journeyId);
  await page.waitForSelector('.sw-cx-swimlane-grid');

  const headers = page.locator('.sw-cx-grid-cell--header');
  await expect(headers).toHaveCount(3);
  const xs = [];
  for (let i = 0; i < 3; i++) {
    const box = await headers.nth(i).boundingBox();
    xs.push(box.x);
  }
  expect(xs[0], 'expected Evaluate to render left of Discover').toBeLessThan(xs[1]);
  expect(xs[1], 'expected Discover to render left of Purchase').toBeLessThan(xs[2]);
});

withAuth('swimlane rows align under their own stage columns (AC2)', async ({ page }) => {
  const request = page.context().request;
  const { journeyId, csrfToken, stageIds } = await seedJourneyWithStages(request, uniqueName('journey'), ['Evaluate', 'Discover', 'Purchase']);
  for (const id of stageIds) {
    await setStageField(request, journeyId, id, csrfToken, 'emotion', 'neutral');
    await setStageField(request, journeyId, id, csrfToken, 'pain_points', 'Some pain');
    await setStageField(request, journeyId, id, csrfToken, 'opportunities', 'Some opportunity');
    await setStageField(request, journeyId, id, csrfToken, 'customer_actions', 'Some action');
    await setStageField(request, journeyId, id, csrfToken, 'touchpoints', 'Some touchpoint');
  }

  await openCustomerExperienceView(page, journeyId);
  await page.waitForSelector('.sw-cx-swimlane-grid');

  const headerCells = page.locator('.sw-cx-grid-cell--header');
  const actionsCells = page.locator('.sw-cx-grid-row--actions .sw-cx-grid-cell');
  await expect(actionsCells).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    const headerBox = await headerCells.nth(i).boundingBox();
    const actionBox = await actionsCells.nth(i).boundingBox();
    expect(Math.abs(headerBox.x - actionBox.x), 'expected stage ' + i + "'s own actions cell to share its header column's X position").toBeLessThan(2);
  }
  // Every cell in the same row shares the same Y.
  const ys = [];
  for (let i = 0; i < 3; i++) { ys.push((await actionsCells.nth(i).boundingBox()).y); }
  expect(Math.abs(ys[0] - ys[1])).toBeLessThan(2);
  expect(Math.abs(ys[1] - ys[2])).toBeLessThan(2);
});

withAuth('emotion curve carries stage names and fills at least 80% of its row width for 3+ stages (AC3)', async ({ page }) => {
  const request = page.context().request;
  const { journeyId, csrfToken, stageIds } = await seedJourneyWithStages(request, uniqueName('journey'), ['Evaluate', 'Discover', 'Purchase']);
  await setStageField(request, journeyId, stageIds[0], csrfToken, 'emotion', 'neutral');
  await setStageField(request, journeyId, stageIds[1], csrfToken, 'emotion', 'positive');
  await setStageField(request, journeyId, stageIds[2], csrfToken, 'emotion', 'mixed');

  await openCustomerExperienceView(page, journeyId);
  await page.waitForSelector('.sw-emotion-curve svg');

  // Stage names on the chart itself.
  await expect(page.locator('.sw-emotion-curve-point--neutral text').first()).toHaveText('Evaluate');
  await expect(page.locator('.sw-emotion-curve-point--positive text').first()).toHaveText('Discover');
  await expect(page.locator('.sw-emotion-curve-point--mixed text').first()).toHaveText('Purchase');

  const trackBox = await page.locator('.sw-cx-grid-row--emotion .sw-cx-grid-row-track').boundingBox();
  const svgBox = await page.locator('.sw-emotion-curve svg').boundingBox();
  expect(svgBox.width, 'expected the curve SVG to fill at least 80% of its row track width').toBeGreaterThanOrEqual(trackBox.width * 0.8);
});

withAuth('many-stage journey scrolls horizontally with row labels pinned, keyboard-operable (AC7)', async ({ page }) => {
  const request = page.context().request;
  const stageNames = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];
  const { journeyId } = await seedJourneyWithStages(request, uniqueName('journey'), stageNames);

  await page.setViewportSize({ width: 1280, height: 800 });
  await openCustomerExperienceView(page, journeyId);
  await page.waitForSelector('.sw-cx-swimlane-grid');

  const track = page.locator('.sw-cx-grid-row--actions .sw-cx-grid-row-track');
  const scrollWidth = await track.evaluate(el => el.scrollWidth);
  const clientWidth = await track.evaluate(el => el.clientWidth);
  expect(scrollWidth, 'expected an 8-stage journey to overflow its track at a 1280px viewport').toBeGreaterThan(clientWidth);

  const labelBefore = await page.locator('.sw-cx-grid-row--actions .sw-cx-row-label').boundingBox();
  await track.evaluate(el => { el.scrollLeft = 300; });
  const labelAfter = await page.locator('.sw-cx-grid-row--actions .sw-cx-row-label').boundingBox();
  expect(Math.abs(labelBefore.x - labelAfter.x), 'expected the row label to stay pinned after scrolling the track').toBeLessThan(2);

  // Keyboard reachability/operability -- the track itself is tabindex="0".
  await track.focus();
  await expect(track).toBeFocused();
});
