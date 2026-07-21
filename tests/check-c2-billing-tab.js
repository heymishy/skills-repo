#!/usr/bin/env node
// check-c2-billing-tab.js — c2
// Verifies the Billing tab: src/web-ui/routes/settings.js's new
// renderBillingTab/_billingStatusPill, renderSettingsPage's real Billing panel
// content, and handleGetSettings wiring real /billing/plan-state data + a CSRF
// token into that render. Follows this repo's hand-rolled test()/assert style
// (see tests/check-c1-settings-shell-and-profile-tab.js) — no Jest/Mocha.
//
// Mock-shape verification (CLAUDE.md): the real production shape returned by
// tenantPlan.getPlanState() / GET /billing/plan-state is exactly
// { plan: 'trial'|'paid', status: 'active'|'past_due'|'canceled' } -- verified
// directly against src/web-ui/modules/tenant-plan.js before writing these
// fixtures. There is no trialEndsInDays field in the real store; fixtures here
// intentionally use only the two real fields.
//
// AC1: Trial plan shows a clear visual "Trial" status + plan details
// AC2: Active paid plan shows active status, no trial messaging
// AC3: past_due/canceled visually distinct from active (different pill class + text label)
// AC4: "Manage billing" reaches the existing /settings/billing portal-redirect route
// AC5: "Upgrade to Pro" (trial only) reaches the existing /billing/checkout route

'use strict';

var assert = require('assert');
var path = require('path');

var ROOT = path.join(__dirname, '..');

var passed = 0;
var failed = 0;
var failures = [];

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(function() { passed++; console.log('  [PASS]', name); })
    .catch(function(err) {
      failed++;
      failures.push({ name: name, err: err });
      console.log('  [FAIL]', name, '--', (err && err.message) || err);
    });
}

var SETTINGS_PATH     = path.resolve(ROOT, 'src/web-ui/routes/settings.js');
var TENANT_PLAN_PATH  = path.resolve(ROOT, 'src/web-ui/modules/tenant-plan.js');

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

function mockReq(overrides) {
  return Object.assign({
    session: {},
    sessionId: 'test-sid-' + Math.random().toString(36).slice(2),
    query: {},
    headers: {},
    body: undefined
  }, overrides || {});
}

function mockRes() {
  var r = { statusCode: null, body: '', headers: {} };
  r.writeHead = function(code, hdrs) { r.statusCode = code; Object.assign(r.headers, hdrs || {}); };
  r.end = function(b) { r.body = (b != null ? String(b) : ''); r._ended = true; };
  return r;
}

// ─────────────────────────────────────────────────────────────────────────────
// Task 1 — renderBillingTab / _billingStatusPill
// ─────────────────────────────────────────────────────────────────────────────

async function testAC1TrialShowsClearStatusAndPlanDetails() {
  var settings = freshRequire(SETTINGS_PATH);
  var html = settings.renderBillingTab({ plan: 'trial', status: 'active' }, 'tok-1');

  assert.ok(/sw-pill--accent/.test(html), 'AC1: trial status uses a distinct pill class');
  assert.ok(/Trial</.test(html), 'AC1: "Trial" shown as a clear visual status');
  assert.ok(/Trial plan/.test(html), 'AC1: plan details (plan label) shown alongside the status');
}

async function testAC2ActivePaidShowsNoTrialMessaging() {
  var settings = freshRequire(SETTINGS_PATH);
  var html = settings.renderBillingTab({ plan: 'paid', status: 'active' }, 'tok-2');

  assert.ok(/sw-pill--green/.test(html), 'AC2: active status uses the green pill class');
  assert.ok(/Active</.test(html), 'AC2: "Active" status text shown');
  assert.ok(!/trial/i.test(html), 'AC2: no "trial" text anywhere for an active paid plan');
}

async function testAC3PastDueVisuallyDistinctFromActive() {
  var settings = freshRequire(SETTINGS_PATH);
  var pastDueHtml = settings.renderBillingTab({ plan: 'trial', status: 'past_due' }, 'tok-3');
  var activeHtml  = settings.renderBillingTab({ plan: 'paid', status: 'active' }, 'tok-3');

  assert.ok(/sw-pill--amber/.test(pastDueHtml), 'AC3: past_due uses the amber pill class');
  assert.ok(/Past due</.test(pastDueHtml), 'AC3: "Past due" text label present (not colour alone)');
  assert.ok(!/sw-pill--amber/.test(activeHtml), 'AC3: active-status rendering does not also use the amber class');

  var canceledHtml = settings.renderBillingTab({ plan: 'trial', status: 'canceled' }, 'tok-3');
  assert.ok(/sw-pill--red/.test(canceledHtml), 'AC3: canceled uses the red pill class');
  assert.ok(/Canceled</.test(canceledHtml), 'AC3: "Canceled" text label present');
}

async function testAC4ManageBillingLinksToExistingPortalRoute() {
  var settings = freshRequire(SETTINGS_PATH);
  var variants = [
    { plan: 'trial', status: 'active' },
    { plan: 'paid', status: 'active' },
    { plan: 'trial', status: 'past_due' },
    { plan: 'trial', status: 'canceled' }
  ];
  variants.forEach(function(ps) {
    var html = settings.renderBillingTab(ps, 'tok-4');
    assert.ok(html.indexOf('href="/settings/billing"') !== -1, 'AC4: Manage billing links to the existing portal-redirect route for ' + JSON.stringify(ps));
    assert.ok(/Manage billing/.test(html), 'AC4: visible "Manage billing" text for ' + JSON.stringify(ps));
  });
}

async function testAC5UpgradeToProReachesExistingCheckoutRouteOnTrialOnly() {
  var settings = freshRequire(SETTINGS_PATH);

  var trialHtml = settings.renderBillingTab({ plan: 'trial', status: 'active' }, 'real-csrf-tok');
  assert.ok(/<form action="\/billing\/checkout" method="POST"/.test(trialHtml), 'AC5: Upgrade form posts to the existing /billing/checkout route');
  assert.ok(trialHtml.indexOf('name="_csrf" value="real-csrf-tok"') !== -1, 'AC5: form embeds the passed CSRF token');
  assert.ok(trialHtml.indexOf('name="planId" value="pro"') !== -1, 'AC5: form submits planId=pro');
  assert.ok(/Upgrade to Pro/.test(trialHtml), 'AC5: visible "Upgrade to Pro" control');

  var paidHtml = settings.renderBillingTab({ plan: 'paid', status: 'active' }, 'real-csrf-tok');
  assert.ok(!/Upgrade to Pro/.test(paidHtml), 'AC5: no re-offered Upgrade control once already on a paid plan');
}

async function testNfrNoSensitivePaymentDataRendered() {
  var settings = freshRequire(SETTINGS_PATH);
  var fixtures = [
    { plan: 'trial', status: 'active' },
    { plan: 'paid', status: 'active' },
    { plan: 'trial', status: 'past_due' },
    { plan: 'trial', status: 'canceled' }
  ];
  fixtures.forEach(function(ps) {
    var html = settings.renderBillingTab(ps, 'tok-nfr');
    // Note: the layout class "sw-card" legitimately contains the substring "card" --
    // check for actual sensitive-data field names/prefixes, not the bare word.
    assert.ok(!/cardNumber|card_number|\bcus_|stripeCustomerId|customerId/i.test(html), 'NFR: no card/customer-ID data rendered for ' + JSON.stringify(ps));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Task 2 — renderSettingsPage wires real Billing panel content
// ─────────────────────────────────────────────────────────────────────────────

async function testRenderSettingsPageEmbedsRealBillingContent() {
  var settings = freshRequire(SETTINGS_PATH);
  var html = settings.renderSettingsPage({
    user: { login: 'nora' },
    linkedSet: new Set(),
    isAdmin: false,
    planState: { plan: 'trial', status: 'active' },
    csrfToken: 'page-tok'
  });

  assert.ok(html.indexOf('id="tab-panel-billing"') !== -1, 'Billing panel wrapper still present');
  assert.ok(/Trial</.test(html), 'Real Billing content (Trial pill) rendered inside the page, not an empty placeholder');
  assert.ok(html.indexOf('name="_csrf" value="page-tok"') !== -1, 'The page-level csrfToken reaches the Upgrade form');
}

async function testRenderSettingsPageSafeDefaultsPreserveC1Behaviour() {
  var settings = freshRequire(SETTINGS_PATH);
  // C1's own existing call sites never pass planState/csrfToken -- must not throw or regress.
  var nonAdminHtml = settings.renderSettingsPage({ user: { login: 'ivy' }, linkedSet: new Set(), isAdmin: false });
  var adminHtml = settings.renderSettingsPage({ user: { login: 'jill', role: 'admin' }, linkedSet: new Set(), isAdmin: true });

  assert.ok(nonAdminHtml.indexOf('tab-credits') === -1, 'Non-admin: no Credits tab button rendered');
  assert.ok(adminHtml.indexOf('tab-credits') !== -1, 'Admin: Credits tab button rendered');
  assert.ok(nonAdminHtml.indexOf('tab-billing') !== -1, 'Billing tab button still rendered for all users');
  assert.ok(nonAdminHtml.indexOf('id="tab-panel-billing"') !== -1, 'Billing panel still renders with safe defaults (no throw)');
}

// ─────────────────────────────────────────────────────────────────────────────
// Task 3 — handleGetSettings wires real /billing/plan-state data + CSRF token
// ─────────────────────────────────────────────────────────────────────────────

function makeFakePool() {
  function query(sql) {
    var s = String(sql).trim().toUpperCase();
    if (s.indexOf('CREATE TABLE IF NOT EXISTS') === 0) return Promise.resolve({ rows: [] });
    return Promise.resolve({ rows: [] });
  }
  return { query: query };
}

async function testHandleGetSettingsReflectsRealPlanStateNoDuplicateComputation() {
  var settings = freshRequire(SETTINGS_PATH);
  // Plain require (not freshRequire) -- must resolve to the SAME module instance
  // settings.js's own internal require('../modules/tenant-plan') just captured,
  // otherwise this monkeypatch would silently patch a different object.
  var tenantPlan = require(TENANT_PLAN_PATH);

  // Monkeypatch the exact function the real /billing/plan-state endpoint itself
  // calls -- proves the Billing tab reads from the same source, not a
  // separate/duplicated plan-status computation (per the c2 test plan's own
  // integration-test intent).
  var originalGetPlanState = tenantPlan.getPlanState;
  tenantPlan.getPlanState = async function(tenantId) {
    assert.strictEqual(tenantId, 'tenant-nora', 'getPlanState called with the session tenantId');
    return { plan: 'paid', status: 'past_due' };
  };

  try {
    var pool = makeFakePool();
    var handlers = settings.createSettingsHandlers(pool);
    var req = mockReq({ session: { tenantId: 'tenant-nora', login: 'nora', accessToken: 'tok' } });
    var res = mockRes();

    await handlers.handleGetSettings(req, res);

    assert.strictEqual(res.statusCode, 200, 'handleGetSettings responds 200');
    assert.ok(/sw-pill--amber/.test(res.body), 'AC3: past_due fixture reflected as the amber pill in the rendered page');
    assert.ok(/Past due</.test(res.body), 'AC3: "Past due" text label reflected in the rendered page');
    assert.ok(req.session.csrfToken, 'A CSRF token is generated and stored on the session');
    // paid/past_due -> no Upgrade form is rendered (trial-only, AC5), so no _csrf
    // field is embedded here -- that's correct (a GET-only Manage-billing link
    // needs no CSRF protection). The trial-tenant test below covers embedding.
    assert.ok(res.body.indexOf('name="_csrf"') === -1, 'No CSRF field rendered when no form is shown (paid/past_due -- Manage billing is a plain GET link)');
  } finally {
    tenantPlan.getPlanState = originalGetPlanState;
  }
}

async function testHandleGetSettingsTrialShowsUpgradeControl() {
  var settings = freshRequire(SETTINGS_PATH);
  var tenantPlan = require(TENANT_PLAN_PATH);

  var originalGetPlanState = tenantPlan.getPlanState;
  tenantPlan.getPlanState = async function() {
    return { plan: 'trial', status: 'active' };
  };

  try {
    var pool = makeFakePool();
    var handlers = settings.createSettingsHandlers(pool);
    var req = mockReq({ session: { tenantId: 'tenant-orin', login: 'orin', accessToken: 'tok' } });
    var res = mockRes();

    await handlers.handleGetSettings(req, res);

    assert.ok(/Upgrade to Pro/.test(res.body), 'AC5: trial tenant sees the Upgrade to Pro control on the real rendered page');
    assert.ok(res.body.indexOf('href="/settings/billing"') !== -1, 'AC4: Manage billing link present on the real rendered page');
    assert.ok(req.session.csrfToken, 'A CSRF token is generated and stored on the session');
    assert.ok(res.body.indexOf('name="_csrf" value="' + req.session.csrfToken + '"') !== -1, 'AC5: the real session-generated CSRF token (not a placeholder) is embedded in the Upgrade form');
  } finally {
    tenantPlan.getPlanState = originalGetPlanState;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// server.js wiring — confirm no NEW route needed (all three routes pre-exist)
// ─────────────────────────────────────────────────────────────────────────────

async function testServerAlreadyWiresAllThreeReusedRoutes() {
  var fs = require('fs');
  var serverSource = fs.readFileSync(path.join(ROOT, 'src/web-ui/server.js'), 'utf8');

  assert.ok(/pathname === '\/settings' && req\.method === 'GET'/.test(serverSource), 'server.js already registers GET /settings (c1)');
  assert.ok(/pathname === '\/settings\/billing' && req\.method === 'GET'/.test(serverSource), 'server.js already registers GET /settings/billing (lab-s3.5)');
  assert.ok(/pathname === '\/billing\/checkout' && req\.method === 'POST'/.test(serverSource), 'server.js already registers POST /billing/checkout (lab-s3.2)');
}

// ─────────────────────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n[c2] Running AC verification tests...\n');

  console.log('Task 1 — renderBillingTab / _billingStatusPill');
  await test('AC1: trial plan shows a clear "Trial" status + plan details', testAC1TrialShowsClearStatusAndPlanDetails);
  await test('AC2: active paid plan shows active status, no trial messaging', testAC2ActivePaidShowsNoTrialMessaging);
  await test('AC3: past_due/canceled visually distinct from active', testAC3PastDueVisuallyDistinctFromActive);
  await test('AC4: Manage billing links to the existing portal-redirect route', testAC4ManageBillingLinksToExistingPortalRoute);
  await test('AC5: Upgrade to Pro reaches the existing checkout route (trial only)', testAC5UpgradeToProReachesExistingCheckoutRouteOnTrialOnly);
  await test('NFR: no sensitive payment data rendered', testNfrNoSensitivePaymentDataRendered);

  console.log('\nTask 2 — renderSettingsPage real Billing panel content');
  await test('renderSettingsPage embeds real Billing tab content', testRenderSettingsPageEmbedsRealBillingContent);
  await test('renderSettingsPage safe defaults preserve C1 behaviour', testRenderSettingsPageSafeDefaultsPreserveC1Behaviour);

  console.log('\nTask 3 — handleGetSettings wiring');
  await test('handleGetSettings reflects real plan-state, no duplicated computation', testHandleGetSettingsReflectsRealPlanStateNoDuplicateComputation);
  await test('handleGetSettings: trial tenant sees Upgrade to Pro control', testHandleGetSettingsTrialShowsUpgradeControl);

  console.log('\nserver.js wiring — all three reused routes already registered');
  await test('server.js already wires /settings, /settings/billing, /billing/checkout', testServerAlreadyWiresAllThreeReusedRoutes);

  console.log('\n[c2] ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    console.error('\nFailures:');
    failures.forEach(function(f) { console.error('  - ' + f.name); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[c2] Unexpected error:', err);
  process.exit(1);
});
