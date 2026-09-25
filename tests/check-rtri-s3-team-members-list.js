#!/usr/bin/env node
// check-rtri-s3-team-members-list.js — rtri-s3
// Verifies /team/members renders a real member list above the existing
// add-teammate form. Follows this repo's hand-rolled test()/assert style
// (see tests/check-rtri-s1-team-roster-api.js, check-tir-s3-admin-adds-teammate.js).
//
// AC1: rendered HTML contains a row per real member, showing identity + role
// AC2: zero-member tenant shows an explicit empty state
// AC3: a newly-added member appears on the very next render -- live data, not stale
// AC4: tenant isolation -- only the viewing tenant's members are shown
// AC5: a real identity string with HTML-significant characters is escaped via escHtml()

'use strict';

process.env.NODE_ENV = 'test';

var assert = require('assert');
var path = require('path');
var { JSDOM } = require('jsdom');

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

var TEAM_MANAGEMENT_ROUTE_PATH = path.resolve(ROOT, 'src/web-ui/routes/team-management.js');

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

// ── Narrow, self-contained in-memory fake pool ──────────────────────────────
// Mirrors check-rtri-s1-team-roster-api.js's own makeFakePool convention for
// the listTeamMembers JOIN query. Extended in Task 3 with
// check-tir-s3-admin-adds-teammate.js's addOrUpdateTeammate query shapes for
// AC3's live-data integration test.
function _norm(sql) {
  return String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
}

function makeFakePool() {
  var teamMemberships = []; // { person_id, tenant_id, role }
  var personIdentities = []; // { identity_key, person_id }
  var nextPersonId = 1;

  function query(sql, params) {
    var s = _norm(sql);
    var p = params || [];

    if (s.indexOf('SELECT TM.ROLE, PI.IDENTITY_KEY FROM TEAM_MEMBERSHIPS TM INNER JOIN PERSON_IDENTITIES PI') === 0) {
      var tenantId = p[0];
      var rows = teamMemberships
        .filter(function(r) { return r.tenant_id === tenantId; })
        .map(function(tm) {
          var pi = personIdentities.filter(function(x) { return x.person_id === tm.person_id; })[0];
          return pi ? { role: tm.role, identity_key: pi.identity_key } : null;
        })
        .filter(function(r) { return r !== null; });
      return Promise.resolve({ rows: rows });
    }

    // Any other query (e.g. products/journeys nav-summary queries from
    // renderShellWithNav) is irrelevant to this story -- empty rows matches
    // this repo's own established fake-pool convention.
    return Promise.resolve({ rows: [] });
  }

  // Test-setup helper (not a production query shape) -- seeds a fully
  // resolvable member directly, bypassing SQL. Mirrors
  // check-rtri-s1-team-roster-api.js's own _seedMember convention exactly.
  function _seedMember(tenantId, personId, role, identityKey) {
    teamMemberships.push({ person_id: personId, tenant_id: tenantId, role: role });
    if (identityKey !== null) {
      personIdentities.push({ identity_key: identityKey, person_id: personId });
    }
  }

  function _nextPersonId() { return nextPersonId++; }

  return { query: query, _seedMember: _seedMember, _nextPersonId: _nextPersonId };
}

function parseListItems(html) {
  var dom = new JSDOM(html);
  return Array.from(dom.window.document.querySelectorAll('li')).map(function(li) { return li.textContent; });
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — rendered HTML contains a row per real member, showing identity + role
// ─────────────────────────────────────────────────────────────────────────────

async function testAC1RendersRowPerRealMember() {
  var route = freshRequire(TEAM_MANAGEMENT_ROUTE_PATH);
  var pool = makeFakePool();
  var handlers = route.createTeamManagementHandlers(pool);

  var aliceId = pool._nextPersonId();
  pool._seedMember('tenant-a', aliceId, 'engineer', 'alice@example.com');
  var bobId = pool._nextPersonId();
  pool._seedMember('tenant-a', bobId, 'admin', 'bob-gh');

  var req = mockReq({ session: { tenantId: 'tenant-a' } });
  var res = mockRes();
  await handlers.handleGetTeamMembers(req, res);

  assert.strictEqual(res.statusCode, 200, 'AC1: page renders successfully');
  var items = parseListItems(res.body);
  assert.strictEqual(items.length, 2, 'AC1: rendered HTML contains one row per real member');
  assert.ok(items.some(function(t) { return t.indexOf('alice@example.com') !== -1 && t.indexOf('engineer') !== -1; }), 'AC1: alice is shown with her real identity and role');
  assert.ok(items.some(function(t) { return t.indexOf('bob-gh') !== -1 && t.indexOf('admin') !== -1; }), 'AC1: bob is shown with his real identity and role');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — zero-member tenant shows an explicit empty state
// ─────────────────────────────────────────────────────────────────────────────

async function testAC2ShowsExplicitEmptyStateForZeroMembers() {
  var route = freshRequire(TEAM_MANAGEMENT_ROUTE_PATH);
  var pool = makeFakePool();
  var handlers = route.createTeamManagementHandlers(pool);

  var req = mockReq({ session: { tenantId: 'tenant-a' } });
  var res = mockRes();
  await handlers.handleGetTeamMembers(req, res);

  assert.strictEqual(res.statusCode, 200, 'AC2: page still renders successfully with zero members');
  assert.ok(/no team members yet/i.test(res.body), 'AC2: an explicit empty-state message is shown');
  assert.ok(res.body.indexOf('<form') !== -1, 'AC2: the existing add-teammate form still renders (Architecture Constraints: form unaffected)');
  var items = parseListItems(res.body);
  assert.strictEqual(items.length, 0, 'AC2: no member rows are rendered');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — tenant isolation: another tenant's members never appear
// ─────────────────────────────────────────────────────────────────────────────

async function testAC4NeverIncludesAnotherTenantsMembers() {
  var route = freshRequire(TEAM_MANAGEMENT_ROUTE_PATH);
  var pool = makeFakePool();
  var handlers = route.createTeamManagementHandlers(pool);

  var aliceId = pool._nextPersonId();
  pool._seedMember('tenant-a', aliceId, 'engineer', 'alice@example.com');
  var carolId = pool._nextPersonId();
  pool._seedMember('tenant-b', carolId, 'engineer', 'carol@example.com');

  var req = mockReq({ session: { tenantId: 'tenant-a' } });
  var res = mockRes();
  await handlers.handleGetTeamMembers(req, res);

  assert.ok(res.body.indexOf('alice@example.com') !== -1, "AC4: tenant-a's own member is shown");
  assert.strictEqual(res.body.indexOf('carol@example.com'), -1, "AC4: tenant-b's member never appears in tenant-a's rendered response");
  var items = parseListItems(res.body);
  assert.strictEqual(items.length, 1, 'AC4: exactly one member row is rendered -- only tenant-a\'s own member, not tenant-b\'s');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — a real identity string with HTML-significant characters is escaped
// ─────────────────────────────────────────────────────────────────────────────

async function testAC5IdentityWithHtmlCharsIsEscaped() {
  var route = freshRequire(TEAM_MANAGEMENT_ROUTE_PATH);
  var pool = makeFakePool();
  var handlers = route.createTeamManagementHandlers(pool);

  var evilId = pool._nextPersonId();
  pool._seedMember('tenant-a', evilId, 'engineer', '<img src=x onerror="alert(1)&foo">');

  var req = mockReq({ session: { tenantId: 'tenant-a' } });
  var res = mockRes();
  await handlers.handleGetTeamMembers(req, res);

  assert.strictEqual(res.body.indexOf('<img src=x onerror="alert(1)&foo">'), -1, 'AC5: the raw payload string never appears unescaped');
  assert.ok(res.body.indexOf('&lt;img src=x onerror=&quot;alert(1)&amp;foo&quot;&gt;') !== -1, 'AC5: the payload appears in its escHtml()-encoded form, including &, and " escaping');

  var dom = new JSDOM(res.body);
  assert.strictEqual(dom.window.document.querySelectorAll('img').length, 0, 'AC5: the payload never parses into a real <img> element');
}

// ─────────────────────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n[rtri-s3] Running AC verification tests...\n');

  console.log('AC1 — rendered HTML contains a row per real member');
  await test('AC1: handleGetTeamMembers renders a row for each real member with identity and role', testAC1RendersRowPerRealMember);

  console.log('\nAC2 — zero-member tenant shows an explicit empty state');
  await test('AC2: handleGetTeamMembers shows an explicit empty state for a tenant with no members', testAC2ShowsExplicitEmptyStateForZeroMembers);

  console.log('\nAC4 — tenant isolation: another tenant\'s members never appear');
  await test('AC4: handleGetTeamMembers never includes another tenant\'s members', testAC4NeverIncludesAnotherTenantsMembers);

  console.log('\nAC5 — a real identity string with HTML-significant characters is escaped');
  await test('AC5: a real identity string with HTML-significant characters is never interpreted as markup', testAC5IdentityWithHtmlCharsIsEscaped);

  console.log('\n[rtri-s3] ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    console.error('\nFailures:');
    failures.forEach(function(f) { console.error('  - ' + f.name); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[rtri-s3] Unexpected error:', err);
  process.exit(1);
});
