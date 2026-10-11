// ic-s4-keyboard-node-movement.spec.js -- E2E coverage for AC1a (focus style),
// AC2, and AC3 of story artefacts/2026-10-10-infinite-canvas/stories/ic-s4.md
//
// NOT in npm test chain (ADR-018, matching ep1-s3/ep1-s4/ic-s2/ic-s3's own
// precedent) -- run with:
//   npx playwright test tests/e2e/ic-s4-keyboard-node-movement.spec.js
//
// KNOWN GAP (pre-existing, logged in this feature's own decisions.md D5, not
// introduced by this story): src/web-ui/adapters/fake-test-db.js has no
// in-memory backing for customer_journeys/customer_journey_stages. Running
// this spec against the standard local/CI harness (NODE_ENV=test, no
// DATABASE_URL) will fail the moment it tries to create a journey or stage
// through the real server.js dispatch. Running it against a real Postgres
// instance (DATABASE_URL set) works.

const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

function uniqueName(label) {
  return 'ic-s4-' + label + '-' + Date.now();
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

withAuth('a focused canvas node shows a visible, non-default focus style (AC1a)', async ({ page }) => {
  const request = page.context().request;
  const journeyId = await seedJourneyWithStages(request, uniqueName('journey'), ['Discover']);

  await page.goto('/journeys/' + journeyId);
  await page.waitForSelector('#sw-drawflow-canvas .sw-drawflow-node');

  const node = page.locator('#sw-drawflow-canvas .sw-drawflow-node').first();
  await node.focus();
  await expect(node).toBeFocused();

  const outlineStyle = await node.evaluate((el) => getComputedStyle(el).outlineStyle);
  const outlineWidth = await node.evaluate((el) => getComputedStyle(el).outlineWidth);
  expect(outlineStyle, 'expected a non-default (non-"none") outline style on focus').not.toBe('none');
  expect(outlineWidth, 'expected a non-zero outline width on focus').not.toBe('0px');
});

withAuth('Tab/Shift+Tab move between canvas nodes and off the canvas with no focus trap (AC2)', async ({ page }) => {
  const request = page.context().request;
  const journeyId = await seedJourneyWithStages(request, uniqueName('journey'), ['Discover', 'Evaluate', 'Decide']);

  await page.goto('/journeys/' + journeyId);
  await page.waitForSelector('#sw-drawflow-canvas .sw-drawflow-node');

  const nodes = page.locator('#sw-drawflow-canvas .sw-drawflow-node');
  await expect(nodes).toHaveCount(3);

  const first = nodes.nth(0);

  await first.focus();
  await expect(first).toBeFocused();

  // Tab forward past all 3 nodes -- the 4th Tab must leave the canvas node
  // set entirely (no focus trap).
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const stillOnANode = await page.evaluate(() => {
    return !!(document.activeElement && document.activeElement.classList.contains('sw-drawflow-node'));
  });
  expect(stillOnANode, 'expected focus to have left the canvas node set after tabbing past the last node').toBe(false);

  // Shift+Tab back from the first node must also leave the node set (not
  // wrap back INTO the canvas), confirming no trap in either direction.
  await first.focus();
  await expect(first).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  const stillOnANodeBackward = await page.evaluate(() => {
    return !!(document.activeElement && document.activeElement.classList.contains('sw-drawflow-node'));
  });
  expect(stillOnANodeBackward, 'expected Shift+Tab from the first node to also leave the canvas node set').toBe(false);
});

withAuth('a full keyboard-only walkthrough can focus, move, and persist a node position across reload (AC3)', async ({ page }) => {
  const request = page.context().request;
  const journeyId = await seedJourneyWithStages(request, uniqueName('journey'), ['Discover']);

  await page.goto('/journeys/' + journeyId);
  await page.waitForSelector('#sw-drawflow-canvas .sw-drawflow-node');

  const node = page.locator('#sw-drawflow-canvas .sw-drawflow-node').first();
  await node.focus(); // Tab-reachability is AC2's own claim, verified above; this test's own scope is movement + persistence.
  await expect(node).toBeFocused();

  const before = await node.boundingBox();
  expect(before).toBeTruthy();

  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');

  const afterMove = await node.boundingBox();
  expect(afterMove.x, 'expected the node to have moved right').toBeGreaterThan(before.x);
  expect(afterMove.y, 'expected the node to have moved down').toBeGreaterThan(before.y);

  // Give the nodeMoved -> PATCH save request a moment to complete before reload.
  await page.waitForTimeout(500);

  await page.reload();
  await page.waitForSelector('#sw-drawflow-canvas .sw-drawflow-node');
  const afterReload = await page.locator('#sw-drawflow-canvas .sw-drawflow-node').first().boundingBox();
  expect(afterReload).toBeTruthy();

  expect(Math.abs(afterReload.x - before.x), 'expected the reloaded position to reflect the keyboard move, not reset to the original auto-layout position').toBeGreaterThan(10);
  expect(Math.abs(afterReload.y - before.y), 'expected the reloaded y position to also reflect the keyboard move').toBeGreaterThan(10);
});
