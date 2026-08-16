#!/usr/bin/env node
// check-bse-s1-billing-settings-error-banner.js — bse-s1
// Verifies src/web-ui/routes/settings.js surfaces a visible error banner on
// the Billing tab when a billing-portal redirect (bpe-s1's ?error=... query
// param) carries a known error code, instead of silently dropping it.
// Follows this repo's hand-rolled test()/assert style (see
// tests/check-c2-billing-tab.js) — no Jest/Mocha.
//
// AC1: ?error=no_billing_account -> visible banner, exact text, inside #tab-panel-billing
// AC2: ?error=billing_unavailable -> visible banner, exact text, inside #tab-panel-billing
// AC3: no error / unrecognized error -> no banner, raw value never reflected, no regression
// AC4: Billing-tab banner and Credits-tab banner are structurally/behaviourally isolated

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

var SETTINGS_PATH = path.resolve(ROOT, 'src/web-ui/routes/settings.js');
var CREDITS_PATH = path.resolve(ROOT, 'src/web-ui/modules/credits.js');
var IMPERSONATION_AUDIT_ADAPTER_PATH = path.resolve(ROOT, 'src/web-ui/adapters/impersonation-audit-adapter.js');

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

function makeFakePool() {
  function query(sql) {
    return Promise.resolve({ rows: [] });
  }
  return { query: query };
}

// ─────────────────────────────────────────────────────────────────────────────
// Unit — renderBillingTab directly (AC4 markup-shape leg)
// ─────────────────────────────────────────────────────────────────────────────

async function testRenderBillingTabEmbedsErrorBannerWhenOptsErrorMessageSet() {
  var settings = freshRequire(SETTINGS_PATH);

  var withError = settings.renderBillingTab(
    { plan: 'trial', status: 'active' },
    'tok-1',
    { errorMessage: 'Test message' }
  );
  assert.ok(/id="billing-error"/.test(withError), 'banner id present when errorMessage set');
  assert.ok(/class="sw-credits-error"/.test(withError), 'reuses the existing .sw-credits-error class');
  assert.ok(/role="alert"/.test(withError), 'banner has role="alert"');
  assert.ok(withError.indexOf('Test message') !== -1, 'exact message text rendered');

  var withoutOpts = settings.renderBillingTab({ plan: 'trial', status: 'active' }, 'tok-2');
  assert.ok(withoutOpts.indexOf('id="billing-error"') === -1, 'no banner element at all when opts omitted (2-arg call, existing callers)');

  var withEmptyOpts = settings.renderBillingTab({ plan: 'trial', status: 'active' }, 'tok-3', {});
  assert.ok(withEmptyOpts.indexOf('id="billing-error"') === -1, 'no banner element when opts present but errorMessage unset');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — no_billing_account
// ─────────────────────────────────────────────────────────────────────────────

async function testAC1NoBillingAccountErrorShowsBanner() {
  var settings = freshRequire(SETTINGS_PATH);
  var pool = makeFakePool();
  var handlers = settings.createSettingsHandlers(pool);
  var req = mockReq({
    session: { tenantId: 'tenant-a', login: 'ana', accessToken: 'tok' },
    query: { error: 'no_billing_account' }
  });
  var res = mockRes();

  await handlers.handleGetSettings(req, res);

  assert.strictEqual(res.statusCode, 200, 'responds 200');
  assert.ok(res.body.indexOf('id="billing-error"') !== -1, 'AC1: banner present');
  assert.ok(/role="alert"/.test(res.body), 'AC1: role=alert present');
  assert.ok(res.body.indexOf("You don't have a billing account set up yet.") !== -1, 'AC1: exact message text');

  var billingPanelIdx = res.body.indexOf('id="tab-panel-billing"');
  var bannerIdx = res.body.indexOf('id="billing-error"');
  assert.ok(billingPanelIdx !== -1 && bannerIdx > billingPanelIdx, 'AC1: banner is positioned inside #tab-panel-billing');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — billing_unavailable
// ─────────────────────────────────────────────────────────────────────────────

async function testAC2BillingUnavailableErrorShowsBanner() {
  var settings = freshRequire(SETTINGS_PATH);
  var pool = makeFakePool();
  var handlers = settings.createSettingsHandlers(pool);
  var req = mockReq({
    session: { tenantId: 'tenant-b', login: 'ben', accessToken: 'tok' },
    query: { error: 'billing_unavailable' }
  });
  var res = mockRes();

  await handlers.handleGetSettings(req, res);

  assert.strictEqual(res.statusCode, 200, 'responds 200');
  assert.ok(res.body.indexOf('id="billing-error"') !== -1, 'AC2: banner present');
  assert.ok(/role="alert"/.test(res.body), 'AC2: role=alert present');
  assert.ok(res.body.indexOf('Billing is temporarily unavailable — please try again shortly.') !== -1, 'AC2: exact message text');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — no error / unrecognized error
// ─────────────────────────────────────────────────────────────────────────────

async function testAC3NoErrorParamShowsNoBannerNoRegression() {
  var settings = freshRequire(SETTINGS_PATH);
  var pool = makeFakePool();
  var handlers = settings.createSettingsHandlers(pool);
  var req = mockReq({
    session: { tenantId: 'tenant-c', login: 'cleo', accessToken: 'tok' },
    query: {}
  });
  var res = mockRes();

  await handlers.handleGetSettings(req, res);

  assert.strictEqual(res.statusCode, 200, 'responds 200');
  assert.ok(res.body.indexOf('id="billing-error"') === -1, 'AC3: no banner element when no error param');
  assert.ok(res.body.indexOf('href="/settings/billing"') !== -1, 'AC3: Manage billing link still present (no regression)');
  assert.ok(/sw-pill--accent/.test(res.body), 'AC3: trial status pill still rendered (no regression, default trial fixture)');
}

async function testAC3UnrecognizedOrMaliciousErrorParamShowsNoBannerAndNeverReflectsRawValue() {
  var settings = freshRequire(SETTINGS_PATH);
  var pool = makeFakePool();
  var handlers = settings.createSettingsHandlers(pool);

  var adversarial = '<script>alert(1)</script>';
  var req1 = mockReq({
    session: { tenantId: 'tenant-d', login: 'dai', accessToken: 'tok' },
    query: { error: adversarial }
  });
  var res1 = mockRes();
  await handlers.handleGetSettings(req1, res1);
  assert.ok(res1.body.indexOf('id="billing-error"') === -1, 'no banner for adversarial value');
  assert.ok(res1.body.indexOf(adversarial) === -1, 'raw adversarial value never appears verbatim in the response body');

  var unknown = 'some_future_unknown_code';
  var req2 = mockReq({
    session: { tenantId: 'tenant-e', login: 'eve', accessToken: 'tok' },
    query: { error: unknown }
  });
  var res2 = mockRes();
  await handlers.handleGetSettings(req2, res2);
  assert.ok(res2.body.indexOf('id="billing-error"') === -1, 'no banner for unrecognized value');
  assert.ok(res2.body.indexOf(unknown) === -1, 'raw unrecognized value never appears verbatim in the response body');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Billing/Credits banner isolation (admin user)
// ─────────────────────────────────────────────────────────────────────────────

async function testAC4BillingAndCreditsBannersAreIsolatedForAdminUser() {
  var credits = freshRequire(CREDITS_PATH);
  var originalGetAllTenantBalances = credits.getAllTenantBalances;
  credits.getAllTenantBalances = async function() {
    return [{ tenant_id: 'tenant-f', balance: 42 }];
  };

  // isAdmin=true also fetches impersonation audit rows (d3) -- wire the D37
  // injectable adapter with a fake pool so that fetch doesn't throw its
  // "Adapter not wired" stub error. Unrelated to this story's own scope;
  // required purely to exercise the admin branch of handleGetSettings.
  var auditAdapter = freshRequire(IMPERSONATION_AUDIT_ADAPTER_PATH);
  auditAdapter.setImpersonationAuditAdapter({
    query: function() { return Promise.resolve({ rows: [] }); }
  });

  try {
    var settings = freshRequire(SETTINGS_PATH);
    var pool = makeFakePool();
    var handlers = settings.createSettingsHandlers(pool);
    var req = mockReq({
      session: { tenantId: 'tenant-f', login: 'admin-f', role: 'admin', accessToken: 'tok' },
      query: { error: 'no_billing_account' }
    });
    var res = mockRes();

    await handlers.handleGetSettings(req, res);

    var body = res.body;
    var billingPanelStart = body.indexOf('id="tab-panel-billing"');
    var creditsPanelStart = body.indexOf('id="tab-panel-credits"');
    assert.ok(billingPanelStart !== -1, 'Billing panel present');
    assert.ok(creditsPanelStart !== -1, 'Credits panel present (admin session)');
    assert.ok(billingPanelStart < creditsPanelStart, 'Billing panel precedes Credits panel in the markup (matches renderSettingsPage ordering)');

    var billingErrorIdx = body.indexOf('id="billing-error"');
    var creditsErrorIdx = body.indexOf('id="credits-error"');
    assert.ok(billingErrorIdx !== -1, 'billing-error banner present');
    assert.ok(creditsErrorIdx !== -1, 'credits-error element still present (Credits tab unchanged)');
    assert.ok(billingErrorIdx > billingPanelStart && billingErrorIdx < creditsPanelStart, 'billing-error is inside the Billing panel, before the Credits panel starts');
    assert.ok(creditsErrorIdx > creditsPanelStart, 'credits-error is inside the Credits panel, not the Billing panel');

    // Credits tab's own error banner must remain in its default hidden state --
    // this story's query-string error must never trigger it.
    var creditsErrorDivMatch = body.match(/<div id="credits-error"[^>]*>/);
    assert.ok(creditsErrorDivMatch, 'credits-error div present');
    assert.ok(creditsErrorDivMatch[0].indexOf('hidden') !== -1, 'credits-error remains hidden -- unaffected by the Billing ?error= value');

    // creditsJs script content must be byte-for-byte unchanged -- spot-check
    // its defining markers are still present and untouched.
    assert.ok(body.indexOf('document.querySelectorAll(".sw-credits-form")') !== -1, 'creditsJs script content unchanged');
  } finally {
    credits.getAllTenantBalances = originalGetAllTenantBalances;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Regression — tests/check-c2-billing-tab.js's existing 2-arg renderBillingTab
// call sites still behave identically (spot-checked here; full file also run
// separately by npm test / the implementation plan's Step 8).
// ─────────────────────────────────────────────────────────────────────────────

async function testExistingTwoArgCallSitesUnaffected() {
  var settings = freshRequire(SETTINGS_PATH);
  var html = settings.renderBillingTab({ plan: 'paid', status: 'active' }, 'tok-x');
  assert.ok(/sw-pill--green/.test(html), 'existing paid/active rendering unchanged');
  assert.ok(html.indexOf('id="billing-error"') === -1, 'no banner leaks in for a 2-arg call');
}

// ─────────────────────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n[bse-s1] Running AC verification tests...\n');

  await test('renderBillingTab embeds error banner when opts.errorMessage set (AC4 markup shape)', testRenderBillingTabEmbedsErrorBannerWhenOptsErrorMessageSet);
  await test('AC1: no_billing_account error shows banner with exact text', testAC1NoBillingAccountErrorShowsBanner);
  await test('AC2: billing_unavailable error shows banner with exact text', testAC2BillingUnavailableErrorShowsBanner);
  await test('AC3: no error param -> no banner, no regression', testAC3NoErrorParamShowsNoBannerNoRegression);
  await test('AC3: unrecognized/malicious error param -> no banner, no raw-value reflection', testAC3UnrecognizedOrMaliciousErrorParamShowsNoBannerAndNeverReflectsRawValue);
  await test('AC4: Billing and Credits banners are isolated for admin user', testAC4BillingAndCreditsBannersAreIsolatedForAdminUser);
  await test('Existing 2-arg renderBillingTab call sites unaffected', testExistingTwoArgCallSitesUnaffected);

  console.log('\n[bse-s1] ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    console.error('\nFailures:');
    failures.forEach(function(f) { console.error('  - ' + f.name); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[bse-s1] Unexpected error:', err);
  process.exit(1);
});
