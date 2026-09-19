// dsa-s2-dashboard-restyle.spec.js — E2E coverage for dsa-s2 (restyle the
// REAL, live GET /dashboard route -- routes/products.js's handleGetDashboard
// / _renderProductDashboard -- to match DESIGN.md's mock, with real
// pending-actions/journey data wired in).
// Story: artefacts/2026-09-18-design-system-adoption/stories/dsa-s2.md
// Test plan: artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s2-test-plan.md
// Plan (Task 3): artefacts/2026-09-18-design-system-adoption/plans/dsa-s2-plan.md
//
// Realises this test plan's E2E scenarios for AC1-AC3, AC5-AC8. AC4 is
// deliberately NOT covered in this file -- it is verified by re-running
// tests/e2e/psh-s4-dashboard-layout.spec.js (unmodified) plus every other
// pre-existing spec touching handleGetDashboard/_renderProductDashboard, per
// this story's own AC4 wording and Task 4 of the implementation plan.
//
// ── Investigation findings this file's seeding depends on (Task 3 Step 1) ──
//
// AC1/AC2 (tokens): read directly from src/web-ui/utils/html-shell.js's real
// `:root` / `[data-theme="dark"]` blocks (same shared file dsa-s1 already
// restyled and tested against) -- values below were re-confirmed by a fresh
// grep+read of that file at Task 3 time, not copied blindly from dsa-s1's
// own spec, even though (as expected, since it is the same shared file) they
// turned out identical.
//
// AC5 (pending actions): products.js's real handleGetDashboard calls
// adapters/action-queue.js's getPendingActions() DIRECTLY (no injectable
// seam in products.js itself -- see decisions.md's Task 2 entry). That real
// function can only ever return a non-empty items[] when (a) WUCE_REPOSITORIES
// lists at least one "owner/repo" (config/repo-list.js's getRepoList() reads
// process.env fresh on every call; unset in this webServer's own env -- and
// tests/e2e/action-queue.spec.js's own "AC2: no repos configured" test
// explicitly depends on it staying empty) AND (b) action-queue.js's own 3
// real network-calling steps all succeed against a real GitHub repo the
// synthetic e2e-tester token has no real access to. Neither holds in this
// harness, so the real call always degrades to { items: [], bannerMessage: null }
// with no seeding -- confirmed by reading products.js:2663-2669 directly.
// A new NODE_ENV=test-only endpoint (POST /test/seed-pending-action, added
// in this same task, server.js) was therefore genuinely required -- it
// reuses action-queue.js's own existing injectable seams (already used by
// tests/check-wuce5-action-queue.js), rather than inventing a second, parallel
// mock mechanism, calling them via HTTP since the E2E test process cannot
// otherwise reach into the webServer subprocess's module state. Because this
// mutates process-wide state (the whole webServer, not just one session),
// the AC5 test below explicitly resets it (`{ clear: true }`) once it is
// done -- see that test's own trailing cleanup and the endpoint's own
// comment in server.js for why this is mandatory, not optional cleanup.
//
// AC7 (journeys): /test/seed-approval-journey already existed (ep2-s3) but
// only ever set an ACTIVE session, never a completedStages[] entry --
// _deriveDashboardJourneyData (routes/dashboard.js) reads
// journey.completedStages, populated only by journey-store.js's real
// completeStage(). Extended that endpoint (this task, server.js) with an
// optional `completedStages: [{skillName, artefactPath?}]` body field that
// calls the real completeStage() once per entry. A journey seeded this way
// is never marked complete (createJourney()'s own default,
// markJourneyComplete() never called), so it also contributes to the
// dashboard's real in-progress-session count for free -- exactly matching a
// genuinely in-progress feature with some already-completed stages.
//
// ── Fixture isolation ───────────────────────────────────────────────────
//
// Every scenario below that needs a specific products/journeys precondition
// uses its OWN dedicated session (a fresh hex sessionId) and tenant (a
// fresh "e2e-dsa-s2-..." tenantId), seeded via /test/session's own
// sessionId=/tenantId= override (established by bri-s3.5) rather than the
// shared default e2e-tester identity every other withAuth test uses --
// otherwise the Solo-plan "max 1 product per tenant" check
// (handlePostProductConfirm) would make every scenario needing its own
// product collide with every other one, and journey/pending-action state
// seeded for one scenario would leak into another's assertions (the exact
// class of problem dsa-s1's own spec file extensively documents solving via
// distinct artefactType fixtures). Each withAuth test already gets a brand
// new browser context (see fixtures/auth.js), so this is the only extra
// isolation needed on top of that.

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth }      = require('./fixtures/auth');
const { getCsrfToken }  = require('./fixtures/csrf');
const { _DASHBOARD_SKILLS_CATALOG } = require('../../src/web-ui/routes/dashboard');

// ── Real light/dark token tables (src/web-ui/utils/html-shell.js) ─────────
// Same 13-token set dsa-s1's own spec established as "every color token" for
// this shared file -- re-confirmed directly against html-shell.js at Task 3
// time (:root block ~line 434, [data-theme="dark"] block ~line 454).

const TOKEN_NAMES = [
  '--bg', '--surface', '--ink', '--ink-2', '--muted', '--muted-2', '--muted-3',
  '--accent', '--accent-soft', '--accent-ink', '--success', '--warn', '--danger'
];

const LIGHT_TOKENS = {
  '--bg':           '#FAFAFA',
  '--surface':      '#FFFFFF',
  '--ink':          '#14171A',
  '--ink-2':        '#3F454C',
  '--muted':        '#6B7280',
  '--muted-2':      '#52585F',
  '--muted-3':      '#3A3F45',
  '--accent':       '#2563EB',
  '--accent-soft':  '#EFF4FF',
  '--accent-ink':   '#1D4ED8',
  '--success':      '#15803D',
  '--warn':         '#B45309',
  '--danger':       '#B91C1C'
};

const DARK_TOKENS = {
  '--bg':           '#0B0D10',
  '--surface':      '#0E1013',
  '--ink':          '#F5F6F7',
  '--ink-2':        '#B4BAC2',
  '--muted':        '#9AA1AB',
  '--muted-2':      '#6B7280',
  '--muted-3':      '#454B54',
  '--accent':       '#3B82F6',
  '--accent-soft':  '#152238',
  '--accent-ink':   '#93C5FD',
  '--success':      '#34D399',
  '--warn':         '#F59E0B',
  '--danger':       '#F87171'
};

// ── Helpers ─────────────────────────────────────────────────────────────

async function readTokens(page) {
  return page.evaluate(function(names) {
    var s = getComputedStyle(document.documentElement);
    var out = {};
    names.forEach(function(n) { out[n] = s.getPropertyValue(n).trim(); });
    return out;
  }, TOKEN_NAMES);
}

// Same mechanism as dsa-s1's own spec (see that file's own long comment for
// why): calls the exact global function the real .sw-theme-toggle button's
// onclick invokes (html-shell.js SHELL_JS), so the toggle under test is
// byte-for-byte identical to a real click -- this story's own AC1/AC2 don't
// depend on /settings existing either.
async function ensureTheme(page, theme) {
  for (var i = 0; i < 3; i++) {
    var current = await page.evaluate(function() {
      return document.documentElement.getAttribute('data-theme');
    });
    if (current === theme) return;
    await page.evaluate(function() { window.swToggleTheme(); });
  }
  var finalTheme = await page.evaluate(function() {
    return document.documentElement.getAttribute('data-theme');
  });
  if (finalTheme !== theme) {
    throw new Error('Could not set theme to ' + theme + ' via swToggleTheme(), got ' + finalTheme);
  }
}

var _idCounter = 0;
/** A fresh, all-lowercase-hex session id (matches session.js's own
 * /^[a-f0-9]+$/ requirement) -- distinct per call so parallel workers/tests
 * never collide. */
function freshSessionId() {
  _idCounter++;
  return 'da2' + Date.now().toString(16) + _idCounter.toString(16) + Math.random().toString(16).slice(2, 8);
}

/**
 * Re-seed this test's own browser context with a fresh, isolated session +
 * tenant (instead of the shared default e2e-tester identity withAuth's own
 * fixture already seeded) -- both the context's own request-jar (for
 * page.request.*) and the browser's cookie jar (for page.goto) need the new
 * session_id, exactly mirroring what fixtures/auth.js itself does for the
 * default identity (see that file's own comments on why both are needed).
 * @param {import('@playwright/test').Page} page
 * @param {string} tenantSuffix - appended to 'e2e-dsa-s2-' to form the tenantId
 * @returns {Promise<{sessionId: string, tenantId: string}>}
 */
async function isolatedSession(page, tenantSuffix) {
  var sessionId = freshSessionId();
  var tenantId = 'e2e-dsa-s2-' + tenantSuffix;
  var res = await page.request.get('/test/session?sessionId=' + sessionId + '&tenantId=' + tenantId);
  expect(res.status(), '/test/session seed').toBe(200);
  await page.context().addCookies([
    { name: 'session_id', value: sessionId, domain: 'localhost', path: '/', httpOnly: true, secure: false }
  ]);
  return { sessionId: sessionId, tenantId: tenantId };
}

/**
 * Create a real product for the CURRENT session's tenant, via the real
 * POST /products/new + POST /products/confirm round trip (not a test-only
 * shortcut -- unlike /test/seed-product-repo, which only ever UPDATES an
 * already-existing product's repo fields, there is no test-only product
 * CREATE endpoint; this mirrors tests/e2e/bmau-s1-bulk-assign-rerender.spec.js's
 * own already-established real-product-creation pattern).
 * @param {import('@playwright/test').APIRequestContext} request - page.request
 * @param {string} name
 * @returns {Promise<string>} the created product's id
 */
async function createProduct(request, name) {
  var draftRes = await request.post('/products/new', {
    data: { name: name, description: 'dsa-s2 E2E fixture product.' },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(draftRes.status(), 'product draft creation').toBe(200);

  var csrfToken = await getCsrfToken(request, '/products/new', 'products/new page');
  var confirmRes = await request.post('/products/confirm', {
    form: { name: name, description: 'dsa-s2 E2E fixture product.', _csrf: csrfToken },
    maxRedirects: 0
  });
  expect(confirmRes.status(), 'product confirm should redirect to the product view').toBe(302);
  return confirmRes.headers()['location'].split('/products/')[1];
}

// ── AC1/AC2: token tables (has-products session, real mock content page) ──

withAuth('AC1: dark-mode computed CSS custom-property values match DESIGN.md dark token table', async ({ page }) => {
  await isolatedSession(page, 'tokens-dark');
  await createProduct(page.request, 'dsa-s2 tokens dark product');
  await page.goto('/dashboard');
  await ensureTheme(page, 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const tokens = await readTokens(page);
  expect(tokens).toEqual(DARK_TOKENS);
});

withAuth('AC2: light-mode computed CSS custom-property values match DESIGN.md light token table', async ({ page }) => {
  await isolatedSession(page, 'tokens-light');
  await createProduct(page.request, 'dsa-s2 tokens light product');
  await page.goto('/dashboard');
  await ensureTheme(page, 'light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const tokens = await readTokens(page);
  expect(tokens).toEqual(LIGHT_TOKENS);
});

// ── AC3: layout matches the mock for a has-products session ───────────────

withAuth('AC3: layout matches DESIGN.md\'s Dashboard/app shell pattern for a has-products session', async ({ page }) => {
  const productName = 'dsa-s2 layout product';
  await isolatedSession(page, 'layout');
  await createProduct(page.request, productName);
  await page.goto('/dashboard');

  // Sidebar: real, shared shell (dsa-s1 Task 1), not rebuilt by this story --
  // real width read directly from html-shell.js (220px; the story's own AC3
  // wording says "224px" but the real, current CSS value is 220px -- asserting
  // the real value, not the AC's approximate figure, per this feature's own
  // "read real code, don't hardcode assumed values" convention).
  const sidebar = page.locator('.sw-sidebar');
  await expect(sidebar).toBeVisible();
  const sidebarWidth = await sidebar.evaluate((el) => getComputedStyle(el).width);
  expect(sidebarWidth).toBe('220px');
  await expect(sidebar.locator('.sw-product-name', { hasText: productName })).toBeVisible();
  await expect(sidebar.locator('.sw-nav-account')).toBeAttached();

  // Main column: fluid, real content wrapped at the real 1040px cap
  // (dashboard-view.js's own .sw-dash rule) -- the AC's "1080px" is the
  // mock's own approximate wording; the real, current implementation value
  // is 1040px, confirmed directly in views/dashboard-view.js.
  const dash = page.locator('.sw-dash');
  await expect(dash).toBeVisible();
  const dashMaxWidth = await dash.evaluate((el) => getComputedStyle(el).maxWidth);
  expect(dashMaxWidth).toBe('1040px');

  // Greeting + "Run a skill" grid + "Waiting on you"/"Recent sessions" columns
  await expect(page.locator('.sw-greet h1')).toContainText('Good morning');
  await expect(page.locator('.sw-section-title', { hasText: 'Run a skill' })).toBeVisible();
  await expect(page.locator('.sw-skill-grid .sw-skill-card').first()).toBeVisible();
  const cols = page.locator('.sw-cols');
  await expect(cols).toBeVisible();
  await expect(cols.locator('.sw-section-title', { hasText: 'Waiting on you' })).toBeVisible();
  await expect(cols.locator('.sw-section-title', { hasText: 'Recent sessions' })).toBeVisible();

  // The old product-card-grid body is genuinely gone for a has-products
  // session (dsa-s2 Task 1) -- sanity-check the OLD markup isn't just
  // present alongside the new content.
  await expect(page.locator('body')).not.toContainText('New product');
});

// ── AC5: real pending actions render ───────────────────────────────────────

withAuth('AC5: "Waiting on you" shows a real pending sign-off item fetched via getPendingActions', async ({ page }) => {
  await isolatedSession(page, 'pending');
  await createProduct(page.request, 'dsa-s2 pending-actions product');

  const seedRes = await page.request.post('/test/seed-pending-action', {
    data: { featureName: 'dsa-s2-pending-feature', artefactType: 'discovery', daysPending: 4 },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(seedRes.status(), '/test/seed-pending-action seed').toBe(200);

  try {
    await page.goto('/dashboard');
    const waitingSection = page.locator('.sw-cols section', { has: page.locator('.sw-section-title', { hasText: 'Waiting on you' }) });
    await expect(waitingSection).toContainText('Sign off discovery');
    await expect(waitingSection).toContainText('dsa-s2-pending-feature');
    await expect(waitingSection).toContainText('4d ago');
    await expect(waitingSection).not.toContainText('Nothing waiting.');
  } finally {
    // MANDATORY cleanup -- see this file's own top-of-file comment and
    // server.js's /test/seed-pending-action comment: this override is
    // process-wide, not scoped to this test's session, and would otherwise
    // silently break action-queue.spec.js's own "no repos configured"
    // assertion (and every other spec's default empty-pending-actions
    // expectation) for the rest of this webServer process's life.
    const clearRes = await page.request.post('/test/seed-pending-action', {
      data: { clear: true },
      headers: { 'Content-Type': 'application/json' }
    });
    expect(clearRes.status(), '/test/seed-pending-action clear').toBe(200);
  }
});

// ── AC6: real skill catalog renders with working session-start links ──────

withAuth('AC6: "Run a skill" shows the real static skill catalog with working session-start links', async ({ page }) => {
  await isolatedSession(page, 'catalog');
  await createProduct(page.request, 'dsa-s2 catalog product');
  await page.goto('/dashboard');

  // Read the real catalog directly (routes/dashboard.js's own
  // _DASHBOARD_SKILLS_CATALOG, single-sourced by products.js -- see
  // products.js:30) rather than hardcoding an assumed list.
  expect(_DASHBOARD_SKILLS_CATALOG.length).toBeGreaterThan(0);
  expect(_DASHBOARD_SKILLS_CATALOG.length).toBeLessThanOrEqual(6);

  const cards = page.locator('.sw-skill-grid .sw-skill-card');
  await expect(cards).toHaveCount(_DASHBOARD_SKILLS_CATALOG.length);

  for (let i = 0; i < _DASHBOARD_SKILLS_CATALOG.length; i++) {
    const skill = _DASHBOARD_SKILLS_CATALOG[i];
    const card = cards.nth(i);
    await expect(card.locator('.sw-skill-card__name')).toHaveText(skill.label);
    await expect(card.locator('.sw-skill-card__desc')).toHaveText(skill.desc);
    await expect(card.locator('.sw-skill-card__est')).toContainText(skill.est);

    // The card's own <form> targets the real POST /api/skills/:name/sessions
    // route with the correct real skill name -- asserted via DOM attributes
    // (not a real submit, which would start a real skill session as a side
    // effect unrelated to this AC).
    const form = card.locator('form');
    await expect(form).toHaveAttribute('method', 'POST');
    await expect(form).toHaveAttribute('action', '/api/skills/' + skill.name + '/sessions');
  }
});

// ── AC7: real in-progress count + recent sessions ──────────────────────────

withAuth('AC7: real in-progress count and recent sessions render for a session with real journey data', async ({ page }) => {
  await isolatedSession(page, 'journeys-populated');
  await createProduct(page.request, 'dsa-s2 journeys product');

  // Two SEPARATE journeys (not two completedStages on one journey) so each
  // gets its own real completeStage() timestamp from its own HTTP round
  // trip -- avoids a same-millisecond tie that would make the
  // most-recent-first ordering assertion below non-deterministic.
  const seed1 = await page.request.post('/test/seed-approval-journey', {
    data: { featureSlug: 'dsa-s2-e2e-journey-1', stage: 'discovery', completedStages: [{ skillName: 'discovery' }] },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(seed1.status(), 'seed-approval-journey #1').toBe(200);
  const seed1Body = await seed1.json();
  expect(seed1Body.completedStagesCount).toBe(1);

  const seed2 = await page.request.post('/test/seed-approval-journey', {
    data: { featureSlug: 'dsa-s2-e2e-journey-2', stage: 'definition', completedStages: [{ skillName: 'definition' }] },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(seed2.status(), 'seed-approval-journey #2').toBe(200);
  const seed2Body = await seed2.json();
  expect(seed2Body.completedStagesCount).toBe(1);

  await page.goto('/dashboard');

  // In-progress count: 2 journeys seeded, neither marked complete.
  await expect(page.locator('.sw-greet')).toContainText('2 in-progress sessions');

  const recentSection = page.locator('.sw-cols section', { has: page.locator('.sw-section-title', { hasText: 'Recent sessions' }) });
  const recentItems = recentSection.locator('.sw-list > li');
  await expect(recentItems).toHaveCount(2);

  // Most-recent-first: journey #2 (definition) was completed after #1
  // (discovery), so it must appear first.
  const texts = await recentItems.allTextContents();
  expect(texts[0]).toContain('definition');
  expect(texts[0]).toContain('dsa-s2-e2e-journey-2');
  expect(texts[1]).toContain('discovery');
  expect(texts[1]).toContain('dsa-s2-e2e-journey-1');
  texts.forEach(function(t) { expect(t).toContain('today'); });
});

withAuth('AC7: honest empty state when a session has zero journeys', async ({ page }) => {
  await isolatedSession(page, 'journeys-empty');
  await createProduct(page.request, 'dsa-s2 empty journeys product');
  await page.goto('/dashboard');

  await expect(page.locator('.sw-greet')).toContainText('0 in-progress sessions');
  const recentSection = page.locator('.sw-cols section', { has: page.locator('.sw-section-title', { hasText: 'Recent sessions' }) });
  await expect(recentSection).toContainText('No recent sessions.');
  await expect(recentSection.locator('.sw-list > li')).toHaveCount(1); // the single empty-state <li> itself
});

// ── AC8: zero-products onboarding CTA is preserved ─────────────────────────

withAuth('AC8: zero-products onboarding CTA is preserved and unaffected by the new mock-derived content', async ({ page }) => {
  // Deliberately no createProduct() call -- this IS the absence of a
  // fixture (a fresh, dedicated tenant that has never had a product created
  // for it), not a seeded precondition.
  await isolatedSession(page, 'zero-products');
  await page.goto('/dashboard');

  await expect(page.locator('body')).toContainText('No products yet');
  await expect(page.locator('a', { hasText: 'Create your first product' })).toBeVisible();

  // The new mock-derived content must NOT appear on the zero-products path.
  await expect(page.locator('.sw-section-title', { hasText: 'Run a skill' })).toHaveCount(0);
  await expect(page.locator('.sw-skill-grid')).toHaveCount(0);
  await expect(page.locator('.sw-greet')).toHaveCount(0);
});
