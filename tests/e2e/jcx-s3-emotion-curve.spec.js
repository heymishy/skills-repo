// jcx-s3-emotion-curve.spec.js -- E2E coverage for AC1, AC2, AC3 of story
// artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s3.md
//
// NOT in npm test chain (ADR-018, matching ep1-s3/ic-s2/ic-s3/ic-s4's own
// precedent) -- run with:
//   npx playwright test tests/e2e/jcx-s3-emotion-curve.spec.js
//
// KNOWN GAP (pre-existing, same class as ic-s4's own logged gap):
// src/web-ui/adapters/fake-test-db.js has no in-memory backing for
// customer_journeys/customer_journey_stages. Running this spec against the
// standard local/CI harness (NODE_ENV=test, no DATABASE_URL) will fail the
// moment it tries to create a journey or stage through the real server.js
// dispatch. Running it against a real Postgres instance (DATABASE_URL set)
// works -- ncdv-s2 (2026-10-13) fixed the local-Postgres SSL block that
// previously made this impractical to exercise locally.

const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

function uniqueName(label) {
  return 'jcx-s3-' + label + '-' + Date.now();
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

async function setStageEmotion(request, journeyId, stageId, csrfToken, emotion) {
  await request.patch('/journeys/' + journeyId + '/stages/' + stageId, {
    data: { field: 'emotion', value: emotion, _csrf: csrfToken },
    headers: { 'Content-Type': 'application/json' }
  });
}

async function openCustomerExperienceView(page, journeyId) {
  await page.goto('/journeys/' + journeyId);
  await page.locator('.sw-canvas-view-toggle-btn[data-view="customer-experience"]').click();
}

withAuth('connected curve tracks emotion position across stages, positive highest negative lowest (AC1)', async ({ page }) => {
  const request = page.context().request;
  const { journeyId, csrfToken, stageIds } = await seedJourneyWithStages(
    request, uniqueName('journey'), ['Discover', 'Buy', 'Use']
  );
  await setStageEmotion(request, journeyId, stageIds[0], csrfToken, 'negative');
  await setStageEmotion(request, journeyId, stageIds[1], csrfToken, 'neutral');
  await setStageEmotion(request, journeyId, stageIds[2], csrfToken, 'positive');

  await openCustomerExperienceView(page, journeyId);
  await page.waitForSelector('.sw-emotion-curve svg');

  const negY = await page.locator('.sw-emotion-curve-point--negative circle').first().getAttribute('cy');
  const neutralY = await page.locator('.sw-emotion-curve-point--neutral circle').first().getAttribute('cy');
  const posY = await page.locator('.sw-emotion-curve-point--positive circle').first().getAttribute('cy');

  // SVG y increases downward -- smaller y = visually higher. positive must
  // have the smallest y (highest), negative the largest (lowest).
  expect(Number(posY), 'expected positive to render visually highest (smallest y)').toBeLessThan(Number(neutralY));
  expect(Number(neutralY), 'expected neutral to render between positive and negative').toBeLessThan(Number(negY));

  await expect(page.locator('.sw-emotion-curve polyline')).toHaveCount(1);
});

withAuth('missing-emotion stage shows an empty-state marker, not a silent gap, and connects correctly around it (AC2)', async ({ page }) => {
  const request = page.context().request;
  const { journeyId, csrfToken, stageIds } = await seedJourneyWithStages(
    request, uniqueName('journey'), ['Discover', 'Buy', 'Use']
  );
  await setStageEmotion(request, journeyId, stageIds[0], csrfToken, 'positive');
  // Middle stage (Buy) deliberately left with no emotion set.
  await setStageEmotion(request, journeyId, stageIds[2], csrfToken, 'negative');

  await openCustomerExperienceView(page, journeyId);
  await page.waitForSelector('.sw-emotion-curve svg');

  await expect(page.locator('.sw-emotion-curve-point--unset')).toHaveCount(1);
  // jcx-s6 -- each point now carries TWO <text> elements (the stage name,
  // added per jcx-s6 AC3, plus the emotion/status label) -- .last() targets
  // the status label specifically, matching buildEmotionCurve's own
  // append order (name first, then "No data yet"/emotion).
  await expect(page.locator('.sw-emotion-curve-point--unset text').last()).toHaveText('No data yet');
  await expect(page.locator('.sw-emotion-curve-point--unset text').first()).toHaveText('Buy');
  // Both set stages (Discover, Use) still rendered on either side.
  await expect(page.locator('.sw-emotion-curve-point--positive')).toHaveCount(1);
  await expect(page.locator('.sw-emotion-curve-point--negative')).toHaveCount(1);
  // The connecting line passes through all 3 points, including the unset one.
  const points = await page.locator('.sw-emotion-curve polyline').getAttribute('points');
  expect(points.trim().split(/\s+/).length, 'expected the polyline to have exactly 3 points, one per stage').toBe(3);
});

withAuth('no-emotion-at-all journey shows a full, friendly empty state (AC3)', async ({ page }) => {
  const request = page.context().request;
  const { journeyId } = await seedJourneyWithStages(
    request, uniqueName('journey'), ['Discover', 'Buy']
  );
  // Neither stage has emotion set.

  await openCustomerExperienceView(page, journeyId);
  await page.waitForSelector('.sw-emotion-curve-empty');

  await expect(page.locator('.sw-emotion-curve-empty')).toBeVisible();
  await expect(page.locator('.sw-emotion-curve svg')).toHaveCount(0);
});
