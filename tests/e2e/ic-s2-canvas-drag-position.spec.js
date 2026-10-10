// ic-s2-canvas-drag-position.spec.js -- E2E coverage for AC1 of story
// artefacts/2026-10-10-infinite-canvas/stories/ic-s2.md
//
// NOT in npm test chain (ADR-018, matching ep1-s3/ep1-s4's own precedent) -- run with:
//   npx playwright test tests/e2e/ic-s2-canvas-drag-position.spec.js
//
// KNOWN GAP (pre-existing, logged in this feature's own decisions.md D5, not
// introduced by this story): src/web-ui/adapters/fake-test-db.js has no
// in-memory backing for customer_journeys/customer_journey_stages (confirmed
// by grep, and by ic-s1's own /definition-of-ready and /definition-of-done
// passes reproducing the same gap). Running this spec against the standard
// local/CI harness (NODE_ENV=test, no DATABASE_URL) will fail the moment it
// tries to create a journey or stage through the real server.js dispatch.
// Running it against a real Postgres instance (DATABASE_URL set) works.

const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

function uniqueName(label) {
  return 'ic-s2-' + label + '-' + Date.now();
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
  for (const name of stageNames) {
    await request.post('/journeys/' + journeyId + '/stages', {
      data: { name: name, _csrf: canvasCsrf },
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return journeyId;
}

withAuth('dragging a canvas node to a new position persists across reload (AC1)', async ({ page }) => {
  const request = page.context().request;
  const journeyId = await seedJourneyWithStages(request, uniqueName('journey'), ['Discover', 'Evaluate']);

  await page.goto('/journeys/' + journeyId);
  await page.waitForSelector('#sw-drawflow-canvas .sw-drawflow-node');

  const node = page.locator('#sw-drawflow-canvas .sw-drawflow-node').first();
  const before = await node.boundingBox();
  expect(before).toBeTruthy();

  // Drag the node to a clearly different position.
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.down();
  await page.mouse.move(before.x + 300, before.y + 250, { steps: 10 });
  await page.mouse.up();

  // Give the nodeMoved -> PATCH request a moment to complete before reload.
  await page.waitForTimeout(500);

  await page.reload();
  await page.waitForSelector('#sw-drawflow-canvas .sw-drawflow-node');
  const after = await page.locator('#sw-drawflow-canvas .sw-drawflow-node').first().boundingBox();
  expect(after).toBeTruthy();

  // The reloaded position should be close to where it was dropped, not back
  // at the original auto-layout position.
  const movedX = Math.abs(after.x - before.x);
  expect(movedX).toBeGreaterThan(100);
});
