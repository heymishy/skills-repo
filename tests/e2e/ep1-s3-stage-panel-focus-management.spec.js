// ep1-s3-stage-panel-focus-management.spec.js — E2E coverage for AC1
// (interaction half), AC4, and AC5 of story
// artefacts/2026-10-05-customer-journey-as-first-class/stories/ep1-s3.md
//
// NOT in npm test chain (ADR-018, matching a4-module-expand-collapse.spec.js's
// and bmau-s1-bulk-assign-rerender.spec.js's own precedent) -- run with:
//   npx playwright test tests/e2e/ep1-s3-stage-panel-focus-management.spec.js
//
// KNOWN GAP (pre-existing, logged in this feature's own decisions.md D5, not
// introduced by this story): src/web-ui/adapters/fake-test-db.js has no
// in-memory backing for customer_journeys/customer_journey_stages (confirmed
// by grep). Running this spec against the standard local/CI harness
// (NODE_ENV=test, no DATABASE_URL) will fail the moment it tries to create a
// journey or stage through the real server.js dispatch. Running it against a
// real Postgres instance (DATABASE_URL set) works, but creates real rows in
// whatever database that is -- do not point this at a shared staging/dev
// database without a deliberate cleanup plan (see workspace/learnings.md for
// this repo's own prior E2E-pollution history). Follow-up: extend
// fake-test-db.js with customer_journeys/customer_journey_stages support
// (mirroring bmau-s1's own already-logged follow-up for modulesAdapter) so
// this spec runs in the standard harness like every other one.

const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

function uniqueName(label) {
  return 'ep1-s3-' + label + '-' + Date.now();
}

// journeys.js's own pages embed the CSRF token as a JS variable
// (`var csrfToken=...;`), not as a hidden form input (products.js's own
// `_csrf.csrfField()` convention) -- there is no "create journey" form page
// yet (ships in ep4-s1) to scrape a hidden-input token from, so this tries
// both patterns rather than assuming either one blindly.
function extractCsrfToken(html) {
  const hiddenInput = html.match(/name="_csrf" value="([^"]*)"/);
  if (hiddenInput) return hiddenInput[1];
  const jsVar = html.match(/var csrfToken=("(?:[^"\\]|\\.)*")/);
  return jsVar ? JSON.parse(jsVar[1]) : null;
}

withAuth('stage panel opens with focus inside it, traps Tab/Shift+Tab, and Escape closes it returning focus to the trigger (AC1, AC4, AC5)', async ({ page }) => {
  // ── Fixture setup: a journey with one stage, via real HTTP ──
  const journeyName = uniqueName('journey');
  const homeHtml = await (await page.request.get('/')).text();
  const homeCsrf = extractCsrfToken(homeHtml);
  expect(homeCsrf, 'the authenticated home page must embed a usable CSRF token (hidden input or JS variable)').toBeTruthy();

  const journeyRes = await page.request.post('/journeys', {
    data: { name: journeyName, _csrf: homeCsrf },
    headers: { 'Content-Type': 'application/json' },
    maxRedirects: 0
  });
  expect(journeyRes.status(), 'handlePostJourneys redirects 302 to the canvas').toBe(302);
  const journeyId = journeyRes.headers()['location'].split('/journeys/')[1];

  const canvasHtml = await (await page.request.get('/journeys/' + journeyId)).text();
  const canvasCsrf = extractCsrfToken(canvasHtml);
  expect(canvasCsrf, 'canvas page must embed a csrfToken for the client script').toBeTruthy();

  const stageRes = await page.request.post('/journeys/' + journeyId + '/stages', {
    data: { name: 'Discover', _csrf: canvasCsrf },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(stageRes.status(), 'handlePostJourneyStage returns 201 on creation').toBe(201);

  // ── Real browser: navigate, open the panel, verify focus/trap/escape ──
  await page.goto('/journeys/' + journeyId);
  await page.waitForLoadState('networkidle');

  const editLink = page.locator('.sw-stage-edit').first();
  await editLink.focus(); // the trigger element AC4 must return focus to
  await editLink.press('Enter'); // activates the click handler

  const panel = page.locator('#sw-stage-panel');
  await expect(panel, 'AC1: panel becomes visible on open').toHaveClass(/sw-stage-panel--open/);

  // AC1: focus landed inside the panel (the first focusable field).
  const firstField = page.locator('#sw-stage-field-description');
  await expect(firstField).toBeFocused();

  // AC5: Tab from the LAST focusable element wraps to the first.
  const lastField = page.locator('#sw-stage-panel-close');
  await lastField.focus();
  await page.keyboard.press('Tab');
  await expect(firstField, 'AC5: Tab past the last element wraps to the first').toBeFocused();

  // AC5: Shift+Tab from the FIRST focusable element wraps to the last.
  await firstField.focus();
  await page.keyboard.press('Shift+Tab');
  await expect(lastField, 'AC5: Shift+Tab before the first element wraps to the last').toBeFocused();

  // AC4: Escape closes the panel and returns focus to the triggering element.
  await page.keyboard.press('Escape');
  await expect(panel, 'AC4: panel closes on Escape').not.toHaveClass(/sw-stage-panel--open/);
  await expect(editLink, 'AC4: focus returns to the stage card link that opened the panel').toBeFocused();
});
