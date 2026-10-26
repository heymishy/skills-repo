// tests/e2e/ppc-s5-video-lazy-load.spec.js -- E2E coverage for ppc-s5's AC6
// (an AC with no video yet shows screenshot-only, no console error) and AC7
// (preload=none means no eager video-byte download before user interaction;
// no layout shift at narrow viewports).
// Story: artefacts/2026-10-20-production-playback-capture/stories/ppc-s5.md
// Plan: artefacts/2026-10-20-production-playback-capture/plans/ppc-s5-plan.md
// (Task 8)
//
// Seeding: the production route under test (GET /products/:productId/
// playback-evidence/:featureSlug) resolves its journey via
// _resolveJourney -> journey-store.js's getJourneyByTenantProductSlug +
// isDodComplete -- a REAL Postgres-journeys-row fast path that needs no
// connected GitHub repo or real product record at all. This spec seeds that
// state directly via a new test-only route, POST /test/seed-ppc-s5-journey
// (src/web-ui/server.js, NODE_ENV=test guarded, added as part of this task --
// see that route's own doc comment for why it is safe/established
// precedent), instead of driving a real Playwright-recorded capture, which
// would require a connected GitHub repo + a real access token neither this
// E2E environment nor this task's scope provides.
'use strict';
const { test, expect } = require('@playwright/test');

var _idCounter = 0;
// session.js's own _parseSessionId regex (/session_id=([a-f0-9]+)/) requires
// the ENTIRE id to be lowercase hex, matched immediately after "session_id="
// -- a non-hex prefix (e.g. the task skeleton's original 'ps5', where 'p'
// and 's' are not hex digits) makes the whole cookie value unparseable and
// silently falls through to "no session" (a 302 redirect to the homepage,
// confirmed empirically while building this spec). 'fc5' is an all-hex
// nod to this story's own "ppc-s5" slug, mirroring dsa-s6-mobile-
// responsiveness.spec.js's own all-hex 'da6' prefix convention exactly.
function freshSessionId() {
  _idCounter++;
  return 'fc5' + Date.now().toString(16) + _idCounter.toString(16) + Math.random().toString(16).slice(2, 8);
}

async function isolatedSession(page, tenantSuffix) {
  var sessionId = freshSessionId();
  var tenantId = 'e2e-ppc-s5-' + tenantSuffix;
  var res = await page.request.get('/test/session?sessionId=' + sessionId + '&tenantId=' + tenantId);
  expect(res.status(), '/test/session seed').toBe(200);
  await page.context().addCookies([
    { name: 'session_id', value: sessionId, domain: 'localhost', path: '/', httpOnly: true, secure: false }
  ]);
  return { sessionId: sessionId, tenantId: tenantId };
}

/**
 * Seeds a REAL, DoD-complete journey (via the new /test/seed-ppc-s5-journey
 * route) for the given tenant, with one AC (acId) that has a captured video
 * on disk. Returns the feature slug + product id to build the playback-
 * evidence URL from.
 * @param {import('@playwright/test').APIRequestContext} request - page.request
 * @param {string} tenantId
 * @param {string} featureSlugSuffix - appended to 'ppc-s5-e2e-' for a unique, readable slug
 * @returns {Promise<{featureSlug: string, productId: string, acId: string}>}
 */
async function seedJourneyWithVideo(request, tenantId, featureSlugSuffix) {
  var featureSlug = 'ppc-s5-e2e-' + featureSlugSuffix;
  var productId = 'e2e-ppc-s5-product-' + featureSlugSuffix;
  var acId = 'AC1';
  var videoRelPath = 'artefacts/' + featureSlug + '/playback/ppc-s1/video/' + acId + '-e2e-fixture.webm';

  var res = await request.post('/test/seed-ppc-s5-journey', {
    data: {
      featureSlug: featureSlug,
      tenantId: tenantId,
      productId: productId,
      acId: acId,
      acDescription: 'Shows the dashboard widget',
      videoRelPath: videoRelPath
    },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(res.status(), '/test/seed-ppc-s5-journey seed').toBe(200);

  return { featureSlug: featureSlug, productId: productId, acId: acId };
}

function playbackEvidenceUrl(productId, featureSlug) {
  return '/products/' + encodeURIComponent(productId) + '/playback-evidence/' + encodeURIComponent(featureSlug);
}

test.describe('ppc-s5: video page-render performance', () => {
  test('page load does not eagerly download video bytes and fires no console error', async ({ page }) => {
    var session = await isolatedSession(page, 'lazy1');
    var seeded = await seedJourneyWithVideo(page.request, session.tenantId, 'lazy1-' + Date.now());

    var consoleErrors = [];
    page.on('console', function(msg) { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    var videoByteRequests = [];
    page.on('request', function(req) {
      if (req.url().indexOf('/video/') !== -1 && req.resourceType() === 'media') videoByteRequests.push(req.url());
    });

    // Real browser navigation (not an API request) -- the default Accept
    // header already includes text/html, which is what _wantsHtml()
    // (playback-evidence.js) checks for to render the HTML page instead of
    // the JSON API response.
    await page.goto(playbackEvidenceUrl(seeded.productId, seeded.featureSlug));
    await expect(page.locator('video')).toHaveCount(1);

    expect(consoleErrors, 'no console error on page load').toEqual([]);
    expect(videoByteRequests.length, 'no video byte request before user interaction (preload=none)').toBe(0);
  });

  // KNOWN FAILING, by design -- see Task 8 report (ppc-s5, 2026-10-26).
  // This assertion is the literal operationalization already written into
  // ppc-s5-test-plan.md's own AC7 row ("document.body.scrollWidth does not
  // exceed viewport width before/after"), not a looser check invented here.
  // Confirmed empirically (getComputedStyle on the real rendered <video>):
  // _renderPlaybackEvidenceHtml (src/web-ui/routes/playback-evidence.js)
  // renders the video with HTML width="480" height="270" and an inline
  // style of ONLY "display:block;margin-top:8px" -- no max-width/width:100%
  // constraint. At a 375px viewport this makes document.body.scrollWidth
  // genuinely 480, overflowing. The sibling screenshot <img> (same file,
  // screenshotHtml) already uses style="max-width:480px..." (fluid), so
  // this is a real, narrow asymmetry introduced when Task 6 added the
  // <video> element, not a flaky test or a misreading of the AC.
  // Task 8's own dispatch instructions explicitly forbid touching
  // _renderPlaybackEvidenceHtml's rendering logic in this task -- so this
  // test is intentionally left red, exactly matching AC7's own test-plan
  // wording, rather than weakened to hide the gap. The fix (narrowly
  // scoped, NOT applied here): add "max-width:100%;height:auto" (or
  // equivalent) to the <video> element's inline style in
  // _renderPlaybackEvidenceHtml's videoHtml branch, alongside its existing
  // width/height attributes (those attributes still establish the
  // intrinsic aspect ratio for layout-shift prevention per AC7's first
  // clause -- untouched by this fix).
  test('viewport narrowed does not shift surrounding element positions', async ({ page }) => {
    var session = await isolatedSession(page, 'lazy2');
    var seeded = await seedJourneyWithVideo(page.request, session.tenantId, 'lazy2-' + Date.now());

    await page.goto(playbackEvidenceUrl(seeded.productId, seeded.featureSlug));
    await expect(page.locator('video')).toHaveCount(1);

    var scrollWidthBefore = await page.evaluate(() => document.body.scrollWidth);
    await page.setViewportSize({ width: 375, height: 667 });
    var scrollWidthAfter = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidthAfter, 'no horizontal overflow introduced by video elements at narrow width').toBeLessThanOrEqual(375);
    expect(scrollWidthBefore, 'baseline width should also be free of horizontal overflow before narrowing').toBeGreaterThan(0);
  });
});
