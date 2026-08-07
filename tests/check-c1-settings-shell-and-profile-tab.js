#!/usr/bin/env node
// check-c1-settings-shell-and-profile-tab.js — c1
// Verifies the Settings page shell + Profile tab: src/web-ui/routes/settings.js,
// the getLinkedProviders() addition to src/web-ui/modules/identity-links.js, and
// the authProvider session field added to src/web-ui/routes/auth.js.
// Follows this repo's hand-rolled test()/assert style (see
// tests/check-tir-s2-cross-provider-linking.js) — no Jest/Mocha.
//
// AC1: Settings page renders inside the shared shell (header/sidebar), not a bare fragment
// AC2: Profile tab shows identity + linked/not-linked status per sign-in method
// AC3: The "Link Google account" control reaches handleStartGoogleLink unmodified
// AC4: A fully-linked account offers no dead-end "Link" control for either provider

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

var IDENTITY_LINKS_PATH = path.resolve(ROOT, 'src/web-ui/modules/identity-links.js');
var SETTINGS_PATH       = path.resolve(ROOT, 'src/web-ui/routes/settings.js');
var ACCOUNT_LINKING_PATH = path.resolve(ROOT, 'src/web-ui/routes/account-linking.js');
var AUTH_PATH            = path.resolve(ROOT, 'src/web-ui/routes/auth.js');
var OAUTH_ADAPTER_PATH   = path.resolve(ROOT, 'src/web-ui/auth/oauth-adapter.js');

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test-google-client-id';

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

// ── In-memory fake pool — mirrors tests/check-tir-s2-cross-provider-linking.js's own
// makeFakePool() convention (narrow, explicit-branch fake, not fake-test-db.js). ──────
function _norm(sql) {
  return String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
}

function makeFakePool() {
  var people = [];
  var nextPersonId = 1;
  var teamMemberships = [];
  var personIdentities = [];

  function query(sql, params) {
    var s = _norm(sql);
    var p = params || [];

    if (s.indexOf('CREATE TABLE IF NOT EXISTS') === 0) {
      return Promise.resolve({ rows: [] });
    }
    if (s.indexOf('SELECT PERSON_ID FROM PERSON_IDENTITIES WHERE IDENTITY_KEY') === 0) {
      var match = personIdentities.filter(function(r) { return r.identity_key === p[0]; });
      return Promise.resolve({ rows: match.length ? [{ person_id: match[0].person_id }] : [] });
    }
    if (s.indexOf('INSERT INTO PERSON_IDENTITIES') === 0) {
      personIdentities.push({ identity_key: p[0], person_id: p[1], provider: p[2] });
      return Promise.resolve({ rows: [] });
    }
    if (s.indexOf('SELECT PERSON_ID FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0) {
      var tm = teamMemberships.filter(function(r) { return r.tenant_id === p[0]; });
      return Promise.resolve({ rows: tm.length ? [{ person_id: tm[0].person_id }] : [] });
    }
    if (s.indexOf('SELECT PROVIDER FROM PERSON_IDENTITIES WHERE PERSON_ID') === 0) {
      var links = personIdentities.filter(function(r) { return r.person_id === p[0]; });
      return Promise.resolve({ rows: links.map(function(r) { return { provider: r.provider }; }) });
    }

    console.warn('[fake-pool] unhandled query (returning empty rows): ' + s.slice(0, 120));
    return Promise.resolve({ rows: [] });
  }

  function _seedPerson(tenantId, role) {
    var person = { id: nextPersonId++ };
    people.push(person);
    teamMemberships.push({ person_id: person.id, tenant_id: tenantId, role: role || 'user' });
    return person.id;
  }

  return {
    query: query,
    _seedPerson: _seedPerson,
    _state: function() { return { people: people, teamMemberships: teamMemberships, personIdentities: personIdentities }; }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Task 1 — identity-links.js: getLinkedProviders
// ─────────────────────────────────────────────────────────────────────────────

async function testGetLinkedProvidersEmptyThenPopulated() {
  var identityLinks = freshRequire(IDENTITY_LINKS_PATH);
  var pool = makeFakePool();
  pool._seedPerson('dana-github');

  var before = await identityLinks.getLinkedProviders(pool, 'dana-github');
  assert.deepStrictEqual(before, [], 'no explicit links yet -- empty array');

  await identityLinks.linkIdentity(pool, 'dana-github', 'google-sub-dana', 'google', { info: function() {}, warn: function() {} });

  var after = await identityLinks.getLinkedProviders(pool, 'dana-github');
  assert.deepStrictEqual(after, ['google'], 'after linking Google, getLinkedProviders reports it');
}

async function testGetLinkedProvidersUnknownIdentity() {
  var identityLinks = freshRequire(IDENTITY_LINKS_PATH);
  var pool = makeFakePool();
  var result = await identityLinks.getLinkedProviders(pool, 'nobody-known');
  assert.deepStrictEqual(result, [], 'identity resolving to no person -- empty array, not a throw');
}

// ─────────────────────────────────────────────────────────────────────────────
// Task 2 — auth.js: session.authProvider
// ─────────────────────────────────────────────────────────────────────────────

async function testAuthProviderSetOnGithubLogin() {
  var oauthAdapter = freshRequire(OAUTH_ADAPTER_PATH);
  var auth = freshRequire(AUTH_PATH);

  oauthAdapter.validateOAuthState = function() { return true; };
  oauthAdapter.setProviderAdapter({
    exchangeCode: async function() { return 'tok'; },
    getUserIdentity: async function() { return { id: 1, login: 'erin' }; }
  });

  var req = mockReq({ session: { oauthState: 's1' }, query: { code: 'c', state: 's1' } });
  var res = mockRes();

  await auth.handleAuthCallback(req, res);

  assert.strictEqual(req.session.authProvider, 'github', 'AC2: GitHub login sets session.authProvider = github');
}

async function testAuthProviderSetOnGoogleLogin() {
  var oauthAdapter = freshRequire(OAUTH_ADAPTER_PATH);
  var auth = freshRequire(AUTH_PATH);

  oauthAdapter.validateOAuthState = function() { return true; };
  oauthAdapter.setGoogleUserInfoAdapter(async function() {
    return { sub: 'google-sub-erin', email: 'erin@example.com', accessToken: 'ya29.stub' };
  });

  var req = mockReq({ session: { oauthState: 's2' }, query: { code: 'c', state: 's2' } });
  var res = mockRes();

  await auth.handleAuthGoogleCallback(req, res);

  assert.strictEqual(req.session.authProvider, 'google', 'AC2: Google login sets session.authProvider = google');
}

// ─────────────────────────────────────────────────────────────────────────────
// Task 3 — settings.js render functions
// ─────────────────────────────────────────────────────────────────────────────

async function testAC1RendersInsideSharedShell() {
  var settings = freshRequire(SETTINGS_PATH);
  var html = settings.renderSettingsPage({
    user: { login: 'fay' },
    linkedSet: new Set(),
    isAdmin: false
  });

  assert.ok(html.indexOf('sw-brand-mark') !== -1, 'AC1: shell brand mark present');
  assert.ok(html.indexOf('sw-nav-item') !== -1, 'AC1: shell nav structure present');
  assert.ok(html.indexOf('<title>') !== -1, 'AC1: full document, not a bare fragment');
  assert.ok(html.indexOf('Link a second sign-in method</h1>') === -1, 'AC1: not the old bare unstyled fragment');
}

async function testAC2ProfileTabShowsGithubLinkedGoogleNot() {
  var settings = freshRequire(SETTINGS_PATH);
  var html = settings.renderProfileTab({ login: 'gale' }, new Set(['github']));

  assert.ok(/GitHub[\s\S]*Linked/.test(html), 'AC2: GitHub shown as Linked');
  assert.ok(/Google[\s\S]*Not linked/.test(html), 'AC2: Google shown as Not linked');
  assert.ok(html.indexOf('href="/settings/link-account/google/start"') !== -1, 'AC2: Link Google control targets the existing start route');
  assert.ok(/Link Google account/.test(html), 'AC2: a "Link Google account" control is offered');
}

async function testAC4NoDeadEndControlWhenBothLinked() {
  var settings = freshRequire(SETTINGS_PATH);
  var html = settings.renderProfileTab({ login: 'hart' }, new Set(['github', 'google']));

  assert.ok(html.indexOf('/settings/link-account/google/start') === -1, 'AC4: no Google Link control when already linked');
  assert.ok(html.indexOf('/settings/link-account/github/start') === -1, 'AC4: no GitHub Link control when already linked');
  assert.ok(!/Link (GitHub|Google) account/.test(html), 'AC4: no dead-end Link control text for either provider');
}

async function testCreditsTabAdminOnly() {
  var settings = freshRequire(SETTINGS_PATH);
  var nonAdminHtml = settings.renderSettingsPage({ user: { login: 'ivy' }, linkedSet: new Set(), isAdmin: false });
  var adminHtml = settings.renderSettingsPage({ user: { login: 'jill', role: 'admin' }, linkedSet: new Set(), isAdmin: true });

  assert.ok(nonAdminHtml.indexOf('tab-credits') === -1, 'Non-admin: no Credits tab button rendered');
  assert.ok(adminHtml.indexOf('tab-credits') !== -1, 'Admin: Credits tab button rendered (extensibility for C3, content out of scope)');
  assert.ok(adminHtml.indexOf('tab-billing') !== -1, 'Billing tab button rendered for all users (extensibility for C2, content out of scope)');
}

// ─────────────────────────────────────────────────────────────────────────────
// Task 4 — integration: Link Google control reaches handleStartGoogleLink unmodified
// ─────────────────────────────────────────────────────────────────────────────

async function testAC3LinkGoogleReachesExistingStartHandlerUnmodified() {
  var settings = freshRequire(SETTINGS_PATH);
  var accountLinking = freshRequire(ACCOUNT_LINKING_PATH);
  var oauthAdapter = freshRequire(OAUTH_ADAPTER_PATH);

  var html = settings.renderProfileTab({ login: 'kim' }, new Set(['github']));
  assert.ok(html.indexOf('href="/settings/link-account/google/start"') !== -1, 'the rendered control targets the real start route');

  // Simulate the browser navigating to that exact href -- this is the same
  // handleStartGoogleLink already covered end-to-end by tir-s2; this story
  // wires TO it, it does not reimplement its CSRF-state-setting behaviour.
  oauthAdapter.getGoogleAuthUrl = function(state) { return 'https://accounts.google.com/o/oauth2/auth?state=' + state; };

  var req = mockReq({ session: { accessToken: 'gho_kim', tenantId: 'kim-github' } });
  var res = mockRes();

  await accountLinking.handleStartGoogleLink(req, res);

  assert.strictEqual(res.statusCode, 302, 'AC3: reaches the existing start handler, which redirects to Google');
  assert.ok(req.session.linkOauthState, 'AC3: the existing CSRF-state-setting behaviour (linkOauthState) still runs, unmodified');
  assert.ok(res.headers.Location.indexOf('accounts.google.com') !== -1, 'AC3: redirected to the real Google OAuth URL');
}

// ─────────────────────────────────────────────────────────────────────────────
// Task 4 — server.js wiring (source inspection, matches lab-s2.1's T5.1 convention)
// ─────────────────────────────────────────────────────────────────────────────

async function testServerWiresSettingsRoute() {
  var fs = require('fs');
  var serverSource = fs.readFileSync(path.join(ROOT, 'src/web-ui/server.js'), 'utf8');

  assert.ok(serverSource.indexOf('createSettingsHandlers') !== -1, 'server.js imports createSettingsHandlers');
  assert.ok(/pathname === '\/settings' && req\.method === 'GET'/.test(serverSource), 'server.js registers GET /settings');
  assert.ok(/pathname === '\/settings\/link-account' && req\.method === 'GET'/.test(serverSource), 'server.js still handles GET /settings/link-account (now a redirect)');
  assert.ok(serverSource.indexOf("Location: '/settings' + qs") !== -1, 'the old /settings/link-account route redirects into the new shell, preserving the query string');
}

// ─────────────────────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n[c1] Running AC verification tests...\n');

  console.log('Task 1 — identity-links.getLinkedProviders');
  await test('getLinkedProviders: empty before link, populated after link', testGetLinkedProvidersEmptyThenPopulated);
  await test('getLinkedProviders: unknown identity resolves to empty array, not a throw', testGetLinkedProvidersUnknownIdentity);

  console.log('\nTask 2 — auth.js session.authProvider');
  await test('AC2: GitHub login sets session.authProvider', testAuthProviderSetOnGithubLogin);
  await test('AC2: Google login sets session.authProvider', testAuthProviderSetOnGoogleLogin);

  console.log('\nAC1 — Settings renders inside the shared shell');
  await test('AC1: Settings page HTML includes shared shell markup, not a bare fragment', testAC1RendersInsideSharedShell);

  console.log('\nAC2 — Profile tab shows identity + linked-method status');
  await test('AC2: GitHub linked, Google not linked -- with a Link Google control', testAC2ProfileTabShowsGithubLinkedGoogleNot);

  console.log('\nAC4 — fully linked account offers no dead-end control');
  await test('AC4: both providers linked -- no Link control for either', testAC4NoDeadEndControlWhenBothLinked);

  console.log('\nExtensibility — tab container ready for C2/C3 without restructuring');
  await test('Billing tab always present, Credits tab admin-only', testCreditsTabAdminOnly);

  console.log('\nAC3 — Link Google reaches the existing start handler unmodified');
  await test('AC3: rendered Link Google control reaches handleStartGoogleLink unmodified', testAC3LinkGoogleReachesExistingStartHandlerUnmodified);

  console.log('\nTask 4 — server.js wiring');
  await test('server.js wires /settings and redirects the legacy /settings/link-account route', testServerWiresSettingsRoute);

  console.log('\n[c1] ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    console.error('\nFailures:');
    failures.forEach(function(f) { console.error('  - ' + f.name); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[c1] Unexpected error:', err);
  process.exit(1);
});
