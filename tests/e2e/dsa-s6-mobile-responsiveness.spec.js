// dsa-s6-mobile-responsiveness.spec.js — E2E coverage for dsa-s6 (close the
// mobile-responsiveness gap on the already-shipped dashboard and artefact
// viewer -- both predate DESIGN.md's "Responsive behavior" section).
// Story: artefacts/2026-09-18-design-system-adoption/stories/dsa-s6.md
// Test plan: artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s6-test-plan.md
// Plan: artefacts/2026-09-18-design-system-adoption/plans/dsa-s6-plan.md
//
// This file is split into two sections by task:
//   Task 1 (this section): AC1/AC2 -- dashboard (src/web-ui/views/dashboard-view.js)
//   Task 2 (appended below by a later task): AC3/AC4 -- artefact viewer
//     (src/web-ui/routes/artefact.js)
// AC5 (regression) is verified separately by Task 3 re-running dsa-s1's and
// dsa-s2's own pre-existing E2E suites unmodified -- not duplicated here.
//
// Seeding pattern mirrors tests/e2e/dsa-s2-dashboard-restyle.spec.js: each
// scenario gets its own isolated session + tenant (via /test/session's
// sessionId=/tenantId= override) and creates a real product via the real
// POST /products/new + POST /products/confirm round trip, so the dashboard
// renders its "has products" content (.sw-skill-grid, .sw-cols) rather than
// the zero-products onboarding CTA.

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth }      = require('./fixtures/auth');
const { getCsrfToken }  = require('./fixtures/csrf');

// ── Shared helpers (Task 1 + Task 2) ───────────────────────────────────────

var _idCounter = 0;
/** A fresh, all-lowercase-hex session id (matches session.js's own
 * /^[a-f0-9]+$/ requirement) -- distinct per call so parallel workers/tests
 * never collide. Mirrors dsa-s2-dashboard-restyle.spec.js's own freshSessionId(). */
function freshSessionId() {
  _idCounter++;
  return 'da6' + Date.now().toString(16) + _idCounter.toString(16) + Math.random().toString(16).slice(2, 8);
}

/**
 * Re-seed this test's own browser context with a fresh, isolated session +
 * tenant, mirroring dsa-s2-dashboard-restyle.spec.js's own isolatedSession().
 * @param {import('@playwright/test').Page} page
 * @param {string} tenantSuffix - appended to 'e2e-dsa-s6-' to form the tenantId
 * @returns {Promise<{sessionId: string, tenantId: string}>}
 */
async function isolatedSession(page, tenantSuffix) {
  var sessionId = freshSessionId();
  var tenantId = 'e2e-dsa-s6-' + tenantSuffix;
  var res = await page.request.get('/test/session?sessionId=' + sessionId + '&tenantId=' + tenantId);
  expect(res.status(), '/test/session seed').toBe(200);
  await page.context().addCookies([
    { name: 'session_id', value: sessionId, domain: 'localhost', path: '/', httpOnly: true, secure: false }
  ]);
  return { sessionId: sessionId, tenantId: tenantId };
}

/**
 * Create a real product for the CURRENT session's tenant, via the real
 * POST /products/new + POST /products/confirm round trip. Mirrors
 * dsa-s2-dashboard-restyle.spec.js's own createProduct() -- needed so the
 * dashboard renders its "has products" content (.sw-skill-grid, .sw-cols)
 * rather than the zero-products onboarding CTA.
 * @param {import('@playwright/test').APIRequestContext} request - page.request
 * @param {string} name
 * @returns {Promise<string>} the created product's id
 */
async function createProduct(request, name) {
  var draftRes = await request.post('/products/new', {
    data: { name: name, description: 'dsa-s6 E2E fixture product.' },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(draftRes.status(), 'product draft creation').toBe(200);

  var csrfToken = await getCsrfToken(request, '/products/new', 'products/new page');
  var confirmRes = await request.post('/products/confirm', {
    form: { name: name, description: 'dsa-s6 E2E fixture product.', _csrf: csrfToken },
    maxRedirects: 0
  });
  expect(confirmRes.status(), 'product confirm should redirect to the product view').toBe(302);
  return confirmRes.headers()['location'].split('/products/')[1];
}

/**
 * Real rendered line count of an element's text content -- uses a DOM Range
 * over the element's contents so wrapping is measured directly from layout,
 * not inferred from height/font-metric thresholds. Returns 1 for a single
 * unwrapped line, >=2 if the browser wrapped the text onto multiple lines.
 * @param {import('@playwright/test').Locator} locator
 * @returns {Promise<number>}
 */
async function lineCount(locator) {
  return locator.evaluate(function(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    return range.getClientRects().length;
  });
}

// The mobile breakpoint DESIGN.md's "Responsive behavior" section mandates
// (single breakpoint, max-width: 768px) -- both widths named in AC1-AC4.
const MOBILE_WIDTHS = [375, 390];

// ── Task 1 -- AC1/AC2: dashboard (views/dashboard-view.js) ────────────────

withAuth('dashboard-mobile-no-horizontal-overflow', async ({ page }) => {
  await isolatedSession(page, 'overflow');
  await createProduct(page.request, 'dsa-s6 dashboard overflow product');
  await page.goto('/dashboard');

  for (const width of MOBILE_WIDTHS) {
    await page.setViewportSize({ width: width, height: 800 });
    const scrollWidth = await page.evaluate(function() { return document.body.scrollWidth; });
    expect(scrollWidth, 'document.body.scrollWidth at ' + width + 'px viewport').toBeLessThanOrEqual(width);
  }
});

withAuth('dashboard-mobile-grid-collapses-legibly', async ({ page }) => {
  await isolatedSession(page, 'legible');
  await createProduct(page.request, 'dsa-s6 dashboard legible product');
  await page.goto('/dashboard');

  for (const width of MOBILE_WIDTHS) {
    await page.setViewportSize({ width: width, height: 800 });

    // ".sw-skill-grid" ("Run a skill") must collapse to a single real track
    // -- not just visually narrow, but a genuine 1-column grid, confirmed via
    // the real computed grid-template-columns value.
    const skillGridColumns = await page.locator('.sw-skill-grid').evaluate(function(el) {
      return getComputedStyle(el).gridTemplateColumns;
    });
    expect(skillGridColumns.trim().split(/\s+/).length, '.sw-skill-grid track count at ' + width + 'px').toBe(1);

    // ".sw-cols" ("Waiting on you" / "Recent sessions") must likewise
    // collapse to a single real track.
    const colsColumns = await page.locator('.sw-cols').evaluate(function(el) {
      return getComputedStyle(el).gridTemplateColumns;
    });
    expect(colsColumns.trim().split(/\s+/).length, '.sw-cols track count at ' + width + 'px').toBe(1);

    // No skill card renders narrower than a legible floor. Under the
    // pre-fix 3-column layout, a 375-390px viewport squeezes each card to
    // roughly 100-110px -- well below this floor; a genuine single-column
    // collapse leaves each card close to the full content width (~340px+).
    const cardWidths = await page.locator('.sw-skill-grid .sw-skill-card').evaluateAll(function(els) {
      return els.map(function(el) { return el.getBoundingClientRect().width; });
    });
    expect(cardWidths.length, 'at least one skill card rendered').toBeGreaterThan(0);
    for (const w of cardWidths) {
      expect(w, 'skill card width at ' + width + 'px').toBeGreaterThanOrEqual(280);
    }

    // No "Waiting on you" / "Recent sessions" column renders narrower than
    // the same legible floor.
    const colWidths = await page.locator('.sw-cols > section').evaluateAll(function(els) {
      return els.map(function(el) { return el.getBoundingClientRect().width; });
    });
    expect(colWidths.length, 'at least one .sw-cols section rendered').toBeGreaterThan(0);
    for (const w of colWidths) {
      expect(w, '.sw-cols section width at ' + width + 'px').toBeGreaterThanOrEqual(280);
    }

    // The specific documented failure mode: "Definition of ready" (a real
    // skill-card title, routes/dashboard.js's own catalog) must not be
    // forced into a mid-phrase wrap across two lines ("Definition" / "of
    // ready") from column-width compression -- confirmed via real rendered
    // line count, not an assumed pixel width.
    const defOfReadyTitle = page.locator('.sw-skill-card__name', { hasText: 'Definition of ready' });
    await expect(defOfReadyTitle, '"Definition of ready" card title should be present').toBeVisible();
    const lines = await lineCount(defOfReadyTitle);
    expect(lines, '"Definition of ready" title line count at ' + width + 'px').toBe(1);
  }
});

// ── Task 2 -- AC3/AC4: artefact viewer (routes/artefact.js) ────────────────
// Reuses dsa-s1-artefact-viewer-restyle.spec.js's own established TEST_SLUG
// + artefactType ('discovery') combination -- already a known-working
// artefact-viewer fixture, no new seeding needed.

const ARTEFACT_TEST_SLUG = '2026-05-02-web-ui-copilot-execution-layer';

withAuth('artefact-viewer-mobile-no-overflow-no-content-collapse', async ({ page }) => {
  await page.goto('/artefact/' + ARTEFACT_TEST_SLUG + '/discovery');

  for (const width of MOBILE_WIDTHS) {
    await page.setViewportSize({ width: width, height: 800 });

    const scrollWidth = await page.evaluate(function() { return document.body.scrollWidth; });
    expect(scrollWidth, 'document.body.scrollWidth at ' + width + 'px viewport').toBeLessThanOrEqual(width);

    // The documented real bug: pre-fix, .sw-doc (the main content column)
    // collapsed to 0-14px width while the sidebar stayed fixed at 320px
    // (grid-template-columns: minmax(0,1fr) 320px squeezed under 320px+gap
    // of demand at a 375-390px viewport). Post-fix, the grid collapses to a
    // single column and .sw-doc should render close to the full available
    // content width -- well above the near-zero pre-fix values.
    const docWidth = await page.locator('.sw-doc').evaluate(function(el) {
      return el.getBoundingClientRect().width;
    });
    expect(docWidth, '.sw-doc rendered width at ' + width + 'px').toBeGreaterThanOrEqual(250);
  }
});

withAuth('artefact-viewer-mobile-stacks-body-first', async ({ page }) => {
  await page.goto('/artefact/' + ARTEFACT_TEST_SLUG + '/discovery');

  for (const width of MOBILE_WIDTHS) {
    await page.setViewportSize({ width: width, height: 800 });

    // The grid genuinely collapses to a single real track (not just a
    // visually-narrow 2-column grid).
    const layoutColumns = await page.locator('.sw-artefact-layout').evaluate(function(el) {
      return getComputedStyle(el).gridTemplateColumns;
    });
    expect(layoutColumns.trim().split(/\s+/).length, '.sw-artefact-layout track count at ' + width + 'px').toBe(1);

    // Document body (.sw-doc) must stack ABOVE the sidebar
    // (.sw-artefact-sidebar) in real visual order -- DESIGN.md's own
    // document-body-first requirement. The real DOM order was already
    // confirmed correct (.sw-doc before .sw-artefact-sidebar) before this
    // fix -- this assertion locks that in as a real rendered-position
    // check, not just a source-order assumption.
    const docTop = await page.locator('.sw-doc').evaluate(function(el) {
      return el.getBoundingClientRect().top;
    });
    const sidebarTop = await page.locator('.sw-artefact-sidebar').evaluate(function(el) {
      return el.getBoundingClientRect().top;
    });
    expect(docTop, '.sw-doc top position at ' + width + 'px').toBeLessThan(sidebarTop);
  }
});
