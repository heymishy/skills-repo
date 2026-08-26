'use strict';

// tests/check-pncg-s1-nav-coverage-functional.js — pncg-s1
// Functional (behavioural) coverage tests for a representative sample of the
// 22 sites this story fixes -- confirms the persistent Products sidebar
// section (marker: class="sw-product-nav-list") actually renders in the real
// HTTP response for four different real-world shapes: a direct
// renderShellWithNav( handler (Category A, products.js), a getProductsNavSummary
// -> render-helper handler (Category B, settings.js), a multi-branch handler
// with 3 internal renderShellWithNav( call sites (journey.js's handleGetWizard),
// and a factory-closure handler (team-management.js).
//
// Follows this repo's hand-rolled test()/assert style (see
// tests/check-pncg-s1-shared-nav-wrapper.js and tests/check-psh-s7-org-kanban.js).

var path = require('path');

var passed = 0;
var failed = 0;

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}

function assertTrue(condition, label) {
  if (!condition) { throw new Error(label); }
}

var PRODUCTS_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
var JOURNEY_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var SETTINGS_PATH = path.resolve(__dirname, '../src/web-ui/routes/settings.js');
var TEAM_MANAGEMENT_PATH = path.resolve(__dirname, '../src/web-ui/routes/team-management.js');
var POSTHOG_FLAGS_PATH = path.resolve(__dirname, '../src/web-ui/modules/posthog-flags.js');

var PRODUCTS_NAV_MARKER = 'class="sw-product-nav-list"';

// Generic mock pool -- matches on the SQL text's table reference, mirroring
// tests/check-pncg-s1-shared-nav-wrapper.js's and check-psh-s7-org-kanban.js's
// own established convention in this repo. Every getProductsNavSummary()
// caller issues 3 distinct query shapes (products list, per-product journey
// counts, no-product journey count); handlers with their own additional
// queries (e.g. handleGetOrgKanban's product-scoped journeys query, or
// settings.js's identity/plan queries) fall through to the default empty-rows
// branch, which is a valid, safe response for all of them.
function makeMockPool(products) {
  return {
    query: async function(sql) {
      if (/FROM products/i.test(sql)) { return { rows: products || [] }; }
      if (/FROM journeys/i.test(sql)) { return { rows: [] }; }
      return { rows: [] };
    }
  };
}

function makeMockRes() {
  var res = { statusCode: null, headers: {}, body: null };
  res.writeHead = function(code, hdrs) { res.statusCode = code; if (hdrs) Object.assign(res.headers, hdrs); return res; };
  res.end = function(data) { res.body = (data != null ? String(data) : ''); return res; };
  res.status = function(code) { res.statusCode = code; return res; };
  res.json = function(body) { res.body = JSON.stringify(body); return res; };
  return res;
}

(async function() {

  // ── 1. orgKanbanNowIncludesProductsSection ────────────────────────────────
  // Category A -- products.js's handleGetOrgKanban calls renderShellWithNav(
  // directly. Gated behind a PostHog flag (bri-s1.5); wire the adapter on for
  // this call, matching tests/check-psh-s7-org-kanban.js's own established
  // pattern for exercising this handler.
  await test('orgKanbanNowIncludesProductsSection', async function() {
    require(POSTHOG_FLAGS_PATH).setPostHogFlagsAdapter({ evaluateFlag: async function() { return true; } });
    var products = require(PRODUCTS_PATH);

    var pool = makeMockPool([{ product_id: 'p1', name: 'Acme', created_at: '2026-01-01' }]);
    var req = { session: { tenantId: 'tenant-1', login: 'org-kanban-user' }, query: {} };
    var res = makeMockRes();

    await products.handleGetOrgKanban(req, res, null, pool);

    assertTrue(res.statusCode === 200 || res.statusCode == null, 'expected a successful response, got status ' + res.statusCode);
    assertTrue(typeof res.body === 'string' && res.body.length > 0, 'expected a non-empty HTML response body');
    assertTrue(res.body.indexOf(PRODUCTS_NAV_MARKER) !== -1, 'expected the Products sidebar section (' + PRODUCTS_NAV_MARKER + ') to be present in handleGetOrgKanban\'s response');
  });

  // ── 2. settingsNowIncludesProductsSection ─────────────────────────────────
  // Category B -- settings.js's handleGetSettings fetches getProductsNavSummary
  // itself and threads it into renderSettingsPage via opts.navProducts /
  // opts.noProductJourneyCount (no renderShellWithNav( call in this path at
  // all -- that is the correct, expected shape for this site).
  await test('settingsNowIncludesProductsSection', async function() {
    var settings = require(SETTINGS_PATH);
    var pool = makeMockPool([{ product_id: 'p1', name: 'Acme', created_at: '2026-01-01' }]);
    var handlers = settings.createSettingsHandlers(pool);

    var req = { session: { tenantId: 'tenant-1', login: 'settings-user' }, query: {} };
    var res = makeMockRes();

    await handlers.handleGetSettings(req, res);

    assertTrue(res.statusCode === 200, 'expected a 200 response, got ' + res.statusCode);
    assertTrue(typeof res.body === 'string' && res.body.length > 0, 'expected a non-empty HTML response body');
    assertTrue(res.body.indexOf(PRODUCTS_NAV_MARKER) !== -1, 'expected the Products sidebar section (' + PRODUCTS_NAV_MARKER + ') to be present in handleGetSettings\'s response');
  });

  // ── 3. journeyWizardAllThreeViewsIncludeProductsSection ───────────────────
  // Category A -- journey.js's handleGetWizard has 3 internal
  // _renderShellWithNav( call sites, one per view branch (default,
  // view=existing, view=resume). All 3 must independently include the
  // Products sidebar section.
  await test('journeyWizardAllThreeViewsIncludeProductsSection', async function() {
    var journey = require(JOURNEY_PATH);
    journey.setRepoRoot(null); // default branch: no .github/pipeline-state.json under '' resolves against cwd, which is fine -- read-only
    journey.setListHtmlSessions(function() { return []; }); // view=resume: no active sessions, avoids loading the full skills.js module chain

    var pool = makeMockPool([]);
    var views = [{}, { view: 'existing' }, { view: 'resume' }];

    for (var i = 0; i < views.length; i++) {
      var req = { session: { tenantId: 'tenant-1', login: 'wizard-user' }, query: views[i] };
      var res = makeMockRes();

      await journey.handleGetWizard(req, res, pool);

      assertTrue(typeof res.body === 'string' && res.body.length > 0, 'view ' + JSON.stringify(views[i]) + ': expected a non-empty HTML response body');
      assertTrue(
        res.body.indexOf(PRODUCTS_NAV_MARKER) !== -1,
        'view ' + JSON.stringify(views[i]) + ': expected the Products sidebar section (' + PRODUCTS_NAV_MARKER + ') to be present'
      );
    }
  });

  // ── 4. teamMembersNowIncludesProductsSection ──────────────────────────────
  // Category A -- team-management.js's handleGetTeamMembers has no `pool`
  // parameter of its own; it reaches renderShellWithNav( via the enclosing
  // createTeamManagementHandlers(pool) factory closure.
  await test('teamMembersNowIncludesProductsSection', async function() {
    var teamManagement = require(TEAM_MANAGEMENT_PATH);
    var pool = makeMockPool([{ product_id: 'p1', name: 'Acme', created_at: '2026-01-01' }]);
    var handlers = teamManagement.createTeamManagementHandlers(pool);

    var req = { session: { tenantId: 'tenant-1', login: 'admin-user', csrfToken: 'test-csrf-token' } };
    var res = makeMockRes();

    await handlers.handleGetTeamMembers(req, res);

    assertTrue(res.statusCode === 200, 'expected a 200 response, got ' + res.statusCode);
    assertTrue(typeof res.body === 'string' && res.body.length > 0, 'expected a non-empty HTML response body');
    assertTrue(res.body.indexOf(PRODUCTS_NAV_MARKER) !== -1, 'expected the Products sidebar section (' + PRODUCTS_NAV_MARKER + ') to be present in handleGetTeamMembers\'s response');
  });

  console.log('\n[pncg-s1] Functional coverage results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
