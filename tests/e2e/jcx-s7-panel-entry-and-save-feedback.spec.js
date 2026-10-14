// jcx-s7-panel-entry-and-save-feedback.spec.js -- E2E coverage for AC3's
// visual/size portion of story artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s7.md
//
// NOT in npm test chain (ADR-018, matching jcx-s3/jcx-s6's own precedent) --
// run with:
//   npx playwright test tests/e2e/jcx-s7-panel-entry-and-save-feedback.spec.js
//
// The FUNCTIONAL portion of AC3 (does clicking the header cell open the
// panel) is already covered by tests/check-jcx-s7-panel-feedback-and-polish.js
// (AC3a/AC3b, jsdom). This spec covers only what real CSS layout is needed
// for: the real click-target hit area and keyboard focus-visible rendering.

const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

function uniqueName(label) {
  return 'jcx-s7-' + label + '-' + Date.now();
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

async function openCustomerExperienceView(page, journeyId) {
  await page.goto('/journeys/' + journeyId);
  await page.locator('.sw-canvas-view-toggle-btn[data-view="customer-experience"]').click();
}

withAuth('header cell click target is materially larger than the nested link, and shows a focus-visible outline via keyboard (AC3)', async ({ page }) => {
  const request = page.context().request;
  const { journeyId } = await seedJourneyWithStages(request, uniqueName('journey'), ['Evaluate']);

  await openCustomerExperienceView(page, journeyId);
  await page.waitForSelector('.sw-cx-swimlane-grid');

  const cell = page.locator('.sw-cx-grid-cell--header').first();
  const link = cell.locator('.sw-stage-edit');
  const cellBox = await cell.boundingBox();
  const linkBox = await link.boundingBox();
  const cellArea = cellBox.width * cellBox.height;
  const linkArea = linkBox.width * linkBox.height;
  expect(cellArea, 'expected the header cell\'s own clickable area to be materially larger than the nested link\'s area alone').toBeGreaterThan(linkArea * 2);

  // Single-click on the cell itself (not the link) opens the panel.
  await cell.click({ position: { x: 5, y: 5 } });
  await expect(page.locator('#sw-stage-panel')).toHaveClass(/sw-stage-panel--open/);
  await page.keyboard.press('Escape');

  // Keyboard: Tab to the cell, confirm a visible focus indicator, Enter opens the panel.
  await cell.focus();
  await expect(cell).toBeFocused();
  const outlineStyle = await cell.evaluate(el => getComputedStyle(el).outlineStyle);
  expect(outlineStyle, 'expected a visible focus-visible outline on the keyboard-focused header cell').not.toBe('none');
  await page.keyboard.press('Enter');
  await expect(page.locator('#sw-stage-panel')).toHaveClass(/sw-stage-panel--open/);
});
