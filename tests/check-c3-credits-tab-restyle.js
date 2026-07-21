#!/usr/bin/env node
'use strict';

// check-c3-credits-tab-restyle.js — c3
// Verifies the Credits tab restyle: src/web-ui/routes/settings.js's new
// renderCreditsTab() and its wiring into renderSettingsPage()/handleGetSettings().
// Follows this repo's hand-rolled test()/assert style (see
// tests/check-c1-settings-shell-and-profile-tab.js) — no Jest/Mocha.
//
// AC1: Admin sees the restyled Credits tab with real tenant balances (not the bare table)
// AC2: Non-admin sees no Credits tab at all — not hidden, absent, and no data ever reaches the HTML
// AC3: The restyled form sends the same CSRF token + payload shape adminCreditsPost already expects
// AC4: An invalid-amount rejection is surfaced clearly, not as raw JSON

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
var ADMIN_CREDITS_PATH = path.resolve(ROOT, 'src/web-ui/routes/admin-credits.js');
var REQUIRE_ADMIN_PATH = path.resolve(ROOT, 'src/web-ui/middleware/require-admin.js');

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

function freshRequireSettings() {
  delete require.cache[require.resolve(SETTINGS_PATH)];
  return require(SETTINGS_PATH);
}

function freshRequireCredits() {
  delete require.cache[require.resolve(CREDITS_PATH)];
  return require(CREDITS_PATH);
}

function freshRequireAdminCredits(creditsMod) {
  if (creditsMod) {
    delete require.cache[require.resolve(CREDITS_PATH)];
    require.cache[require.resolve(CREDITS_PATH)] = {
      id: require.resolve(CREDITS_PATH),
      filename: require.resolve(CREDITS_PATH),
      loaded: true,
      exports: creditsMod
    };
  }
  delete require.cache[require.resolve(ADMIN_CREDITS_PATH)];
  return require(ADMIN_CREDITS_PATH);
}

function makeRes() {
  var r = { _status: null, _headers: {}, _body: '' };
  r.writeHead = function(s, h) { r._status = s; Object.assign(r._headers, h || {}); };
  r.end = function(b) { r._body += (b || ''); };
  return r;
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Admin sees the restyled Credits tab with real tenant balances
// ─────────────────────────────────────────────────────────────────────────────

async function testAC1CreditsTabRendersRealBalances() {
  var settings = freshRequireSettings();
  var html = settings.renderCreditsTab(
    [
      { tenant_id: 'tenant-a', balance: 10 },
      { tenant_id: 'tenant-b', balance: 25 },
      { tenant_id: 'tenant-c', balance: 0 }
    ],
    'csrf-tok-1'
  );

  assert.ok(html.indexOf('tenant-a') !== -1, 'AC1: tenant-a shown');
  assert.ok(html.indexOf('tenant-b') !== -1, 'AC1: tenant-b shown');
  assert.ok(html.indexOf('tenant-c') !== -1, 'AC1: tenant-c shown');
  assert.ok(html.indexOf('10') !== -1, 'AC1: balance 10 shown');
  assert.ok(html.indexOf('sw-table') !== -1, 'AC1: restyled with a real shared-design-system class, not the bare table');
  assert.ok(html.indexOf('sw-card') !== -1, 'AC1: wrapped in the shared card component');
  assert.ok(html.indexOf('_csrf') !== -1 && html.indexOf('csrf-tok-1') !== -1, 'AC1: CSRF token embedded exactly as admin-credits.js embeds it');
}

async function testAC1FullPageIncludesRealCreditsContentForAdmin() {
  var settings = freshRequireSettings();
  var html = settings.renderSettingsPage({
    user: { login: 'ivy' },
    linkedSet: new Set(),
    isAdmin: true,
    creditsRows: [{ tenant_id: 'tenant-z', balance: 99 }],
    csrfToken: 'tok-xyz'
  });

  assert.ok(html.indexOf('tenant-z') !== -1, 'AC1: admin sees real tenant balance data in the full page, not an empty container');
  assert.ok(html.indexOf('sw-table') !== -1, 'AC1: restyled table present');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Non-admin sees no Credits tab at all
// ─────────────────────────────────────────────────────────────────────────────

async function testAC2NonAdminGetsNoCreditsContentAtAll() {
  var settings = freshRequireSettings();
  var html = settings.renderSettingsPage({
    user: { login: 'jack' },
    linkedSet: new Set(),
    isAdmin: false,
    creditsRows: [{ tenant_id: 'should-never-appear', balance: 1 }],
    csrfToken: 'tok-should-not-appear'
  });

  assert.ok(html.indexOf('tab-credits') === -1, 'AC2: no Credits tab button');
  assert.ok(html.indexOf('tab-panel-credits') === -1, 'AC2: no Credits panel container at all');
  assert.ok(html.indexOf('should-never-appear') === -1, 'AC2: tenant balance data never reaches the HTML for a non-admin, even if accidentally passed in');
}

async function testDefenseInDepthApiLayerStillEnforced() {
  var requireAdmin = require(REQUIRE_ADMIN_PATH).requireAdmin;
  var adminCredits = freshRequireAdminCredits();

  var req = { session: { userId: 9, role: 'user' } };
  var res = makeRes();

  var called = false;
  await requireAdmin(req, res, function() { called = true; });
  if (called) { await adminCredits.adminCreditsGet(req, res); }

  assert.strictEqual(res._status, 403, 'A non-admin session must still be rejected at the API layer directly, not merely hidden in the Settings UI');
  assert.ok(res._body.indexOf('<table') === -1, 'No credits HTML must ever be produced for a non-admin, regardless of UI path');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Same CSRF token + payload shape as the existing bare form
// ─────────────────────────────────────────────────────────────────────────────

async function testAC3FormMatchesExistingPayloadAndCsrfShape() {
  var settings = freshRequireSettings();
  var html = settings.renderCreditsTab([{ tenant_id: 'tenant-q', balance: 5 }], 'real-csrf-token');

  assert.ok(/action="\/api\/admin\/credits\/adjust"/.test(html), 'AC3: form posts to the exact existing endpoint');
  assert.ok(/name="_csrf" value="real-csrf-token"/.test(html), 'AC3: same _csrf hidden field admin-credits.js already emits');
  assert.ok(/name="tenantId" value="tenant-q"/.test(html), 'AC3: same tenantId hidden field');
  assert.ok(/name="amount"/.test(html), 'AC3: same amount field name');
}

async function testAC3PayloadRoundTripsThroughExistingHandlerUnmodified() {
  var credits = freshRequireCredits();
  credits.setCreditsAdapter({
    query: async function(sql) {
      if (sql.indexOf('SELECT TENANT_ID FROM') !== -1 || sql.toUpperCase().indexOf('SELECT TENANT_ID FROM') !== -1) {
        return { rows: [{ tenant_id: 'tenant-q' }] };
      }
      if (sql.toUpperCase().indexOf('UPDATE') !== -1) return { rows: [{ balance: 15 }] };
      if (sql.toUpperCase().indexOf('INSERT INTO CREDIT_AUDIT_LOG') !== -1) return { rows: [] };
      return { rows: [{ tenant_id: 'tenant-q' }] };
    }
  });
  var adminCredits = freshRequireAdminCredits(credits);

  var body = '_csrf=real-csrf-token&tenantId=tenant-q&amount=10';
  var req = {
    session: { userId: 1, role: 'admin', csrfToken: 'real-csrf-token', login: 'admin-a' },
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    on: function(event, cb) { if (event === 'data') cb(body); if (event === 'end') cb(); }
  };
  var res = makeRes();
  await adminCredits.adminCreditsPost(req, res);
  assert.strictEqual(res._status, 302, 'AC3: the exact same payload shape the restyled form sends is accepted unmodified by adminCreditsPost');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Invalid amount is surfaced clearly, not as raw JSON
// ─────────────────────────────────────────────────────────────────────────────

async function testAC4InvalidAmountShowsClearMessageNotRawJson() {
  var settings = freshRequireSettings();
  var html = settings.renderCreditsTab(
    [{ tenant_id: 'tenant-r', balance: 3 }],
    'tok-1',
    { errorMessage: 'amount must be a positive integer' }
  );

  assert.ok(html.indexOf('amount must be a positive integer') !== -1, 'AC4: the rejection message is shown');
  assert.ok(html.indexOf('{&quot;error&quot;') === -1 && html.indexOf('{"error"') === -1, 'AC4: raw JSON error body is never shown verbatim');
  assert.ok(/id="credits-error"[^>]*role="alert"/.test(html), 'AC4: shown in a clearly-marked alert region, not silently swallowed');
  var errorDivMatch = html.match(/<div id="credits-error"[^>]*>/);
  assert.ok(errorDivMatch, 'AC4: error region present');
  assert.ok(errorDivMatch[0].indexOf('hidden') === -1, 'AC4: when an error is present, the alert region is not hidden');
}

async function testCreditsErrorBannerHiddenWhenNoError() {
  var settings = freshRequireSettings();
  var html = settings.renderCreditsTab([{ tenant_id: 'tenant-s', balance: 1 }], 'tok-2');
  var errorDivMatch = html.match(/<div id="credits-error"[^>]*>/);
  assert.ok(errorDivMatch, 'error region present even with no error');
  assert.ok(errorDivMatch[0].indexOf('hidden') !== -1, 'No error -- alert region present but hidden, not shown empty');
}

// ─────────────────────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n[c3] Running AC verification tests...\n');

  console.log('AC1 — Admin sees the restyled Credits tab with real balances');
  await test('AC1: renderCreditsTab shows real tenant balances, restyled', testAC1CreditsTabRendersRealBalances);
  await test('AC1: full Settings page includes real Credits content for admin', testAC1FullPageIncludesRealCreditsContentForAdmin);

  console.log('\nAC2 — Non-admin sees no Credits tab at all');
  await test('AC2: non-admin gets zero Credits tab/content, even if data is passed in', testAC2NonAdminGetsNoCreditsContentAtAll);
  await test('AC2 (defense-in-depth): API layer still enforces admin-only independent of the UI', testDefenseInDepthApiLayerStillEnforced);

  console.log('\nAC3 — Same CSRF token + payload shape as the existing bare form');
  await test('AC3: restyled form targets the same endpoint/fields', testAC3FormMatchesExistingPayloadAndCsrfShape);
  await test('AC3: payload round-trips through adminCreditsPost unmodified', testAC3PayloadRoundTripsThroughExistingHandlerUnmodified);

  console.log('\nAC4 — Invalid amount rejection surfaced clearly, not raw JSON');
  await test('AC4: rejection message shown clearly, not raw JSON', testAC4InvalidAmountShowsClearMessageNotRawJson);
  await test('No error -- banner present but hidden', testCreditsErrorBannerHiddenWhenNoError);

  console.log('\n[c3] ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    console.error('\nFailures:');
    failures.forEach(function(f) { console.error('  - ' + f.name); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[c3] Unexpected error:', err);
  process.exit(1);
});
