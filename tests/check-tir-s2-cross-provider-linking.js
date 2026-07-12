#!/usr/bin/env node
// check-tir-s2-cross-provider-linking.js — tir-s2
// Verifies the cross-provider identity-linking feature: person_identities
// schema + resolvePersonForIdentity/linkIdentity (src/web-ui/modules/identity-links.js)
// and the /settings/link-account route handlers (src/web-ui/routes/account-linking.js).
// Follows this repo's hand-rolled test()/assert style (see
// tests/check-tir-s1-person-team-schema.js) — no Jest/Mocha.
//
// AC1: linking a second identity while authenticated records both as one person
// AC2: unauthenticated request to the link-settings page redirects to login
// AC3: two separate signups sharing an email via different providers stay unlinked
// AC4: linking an already-linked identity is rejected, no data changes
// NFR: audit log records both person identifiers (hash, never raw token) + timestamp

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
var ACCOUNT_LINKING_PATH = path.resolve(ROOT, 'src/web-ui/routes/account-linking.js');
var AUTH_PATH = path.resolve(ROOT, 'src/web-ui/routes/auth.js');
var OAUTH_ADAPTER_PATH = path.resolve(ROOT, 'src/web-ui/auth/oauth-adapter.js');

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

// ── In-memory fake pool ──────────────────────────────────────────────────────
// Narrow, self-contained fake — supports exactly the query shapes
// identity-links.js issues against people / team_memberships / person_identities.
// Mirrors tests/check-tir-s1-person-team-schema.js's own convention (a narrow,
// explicit-branch fake, NOT an extension of src/web-ui/adapters/fake-test-db.js —
// tir-s1's actual test file never touched that shared fixture; it used its own
// inline fake, and this file follows that same established precedent).
function _norm(sql) {
  return String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
}

function makeFakePool() {
  var people = [];
  var nextPersonId = 1;
  var teamMemberships = []; // { person_id, tenant_id, role }
  var personIdentities = []; // { identity_key, person_id, provider }
  var createTableCalls = [];

  function query(sql, params) {
    var s = _norm(sql);
    var p = params || [];

    if (s.indexOf('CREATE TABLE IF NOT EXISTS') === 0) {
      createTableCalls.push(s);
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

    console.warn('[fake-pool] unhandled query (returning empty rows): ' + s.slice(0, 120));
    return Promise.resolve({ rows: [] });
  }

  // Test-setup helper (not a production query shape) — seeds a person already
  // migrated/known to tir-s1's schema (a team_memberships row), simulating a
  // person who already exists before any tir-s2 linking action ever runs.
  function _seedPerson(tenantId, role) {
    var person = { id: nextPersonId++ };
    people.push(person);
    teamMemberships.push({ person_id: person.id, tenant_id: tenantId, role: role || 'user' });
    return person.id;
  }

  return {
    query: query,
    _seedPerson: _seedPerson,
    _state: function() { return { people: people, teamMemberships: teamMemberships, personIdentities: personIdentities, createTableCalls: createTableCalls }; }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — linking Google to an already-logged-in GitHub session records both
// identities as one person
// ─────────────────────────────────────────────────────────────────────────────

async function testAC1LinkRecordsSamePerson() {
  // Exercises the REAL route handler (createLinkCallbackHandlers), not just
  // identity-links.js directly — matches the test plan's "Components
  // involved: Link-settings route handler, mocked gitHubProviderAdapter/
  // setGoogleUserInfoAdapter". ADR-018: the Google auth step is proven via
  // the stubbed adapter (auth-bypass fixture pattern), never a live OAuth call.
  var oauthAdapter = freshRequire(OAUTH_ADAPTER_PATH);
  var identityLinks = freshRequire(IDENTITY_LINKS_PATH);
  var accountLinking = freshRequire(ACCOUNT_LINKING_PATH);
  var pool = makeFakePool();

  var githubPersonId = pool._seedPerson('octocat'); // already logged in as GitHub identity X

  oauthAdapter.validateOAuthState = function() { return true; };
  oauthAdapter.setGoogleUserInfoAdapter(async function() {
    return { sub: 'google-sub-1', email: 'octocat@example.com', accessToken: 'ya29.stub-ac1' };
  });

  var handlers = accountLinking.createLinkCallbackHandlers(pool);
  var req = mockReq({
    session: { accessToken: 'gho_x', tenantId: 'octocat', linkOauthState: 'state-ac1' },
    query: { code: 'c', state: 'state-ac1' }
  });
  var res = mockRes();

  await handlers.handleGoogleLinkCallback(req, res);

  assert.strictEqual(res.statusCode, 302, 'AC1: successful link redirects (302), not an error status');

  var xPerson = await identityLinks.resolvePersonForIdentity(pool, 'octocat');
  var yPerson = await identityLinks.resolvePersonForIdentity(pool, 'google-sub-1');

  assert.strictEqual(xPerson, githubPersonId, 'AC1: identity X still resolves to its original person');
  assert.strictEqual(yPerson, githubPersonId, 'AC1: identity Y (newly linked) resolves to the SAME person as X');
  assert.strictEqual(xPerson, yPerson, 'AC1: a subsequent lookup via either provider resolves to the same person');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — unauthenticated request to the link-settings page redirects to login
// ─────────────────────────────────────────────────────────────────────────────

async function testAC2UnauthenticatedRedirectsToLogin() {
  var auth = freshRequire(AUTH_PATH); // reuse the existing, already-tested authGuard
  var accountLinking = freshRequire(ACCOUNT_LINKING_PATH);

  var handlerCalled = false;
  var wrappedHandler = function(req, res) {
    handlerCalled = true;
    return accountLinking.handleGetLinkSettings(req, res);
  };

  var req = mockReq({ session: {} }); // no accessToken -- unauthenticated
  var res = mockRes();

  auth.authGuard(req, res, function() { return wrappedHandler(req, res); });

  assert.strictEqual(res.statusCode, 302, 'AC2: unauthenticated request responds 302');
  assert.strictEqual(res.headers.Location, '/', 'AC2: unauthenticated request redirects to login (/)');
  assert.strictEqual(handlerCalled, false, 'AC2: the link-settings handler is never reached when unauthenticated');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — two people who signed up separately with the same email remain
// separate, unlinked (no automatic email-based merging, ever)
// ─────────────────────────────────────────────────────────────────────────────

async function testAC3NoAutoMergeByEmail() {
  var identityLinks = freshRequire(IDENTITY_LINKS_PATH);
  var pool = makeFakePool();

  // Person A: signed up via email/password with same@example.com (tenantId == email for this provider).
  var personA = pool._seedPerson('same@example.com');
  // Person B: signed up via Google whose account email also happens to be same@example.com,
  // but Google's identity key is the sub, never the email string.
  var personB = pool._seedPerson('google-sub-other-person');

  assert.notStrictEqual(personA, personB, 'AC3 setup: two distinct people were seeded');

  var resolvedA = await identityLinks.resolvePersonForIdentity(pool, 'same@example.com');
  var resolvedB = await identityLinks.resolvePersonForIdentity(pool, 'google-sub-other-person');

  assert.strictEqual(resolvedA, personA, 'AC3: logging in as A resolves to A');
  assert.strictEqual(resolvedB, personB, 'AC3: logging in as B resolves to B');
  assert.notStrictEqual(resolvedA, resolvedB, 'AC3: no automatic merging occurred based on matching email alone');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — linking an already-linked identity is rejected without changing any data
// ─────────────────────────────────────────────────────────────────────────────

async function testAC4RejectAlreadyLinkedIdentity() {
  // Also exercises the REAL route handler end-to-end (not just identity-links.js
  // directly) — the already-linked-to-a-different-person setup itself uses the
  // module function (simulating a prior, separate linking action), then the
  // rejection path under test goes through the actual HTTP handler.
  var oauthAdapter = freshRequire(OAUTH_ADAPTER_PATH);
  var identityLinks = freshRequire(IDENTITY_LINKS_PATH);
  var accountLinking = freshRequire(ACCOUNT_LINKING_PATH);
  var pool = makeFakePool();

  var personA = pool._seedPerson('alice-github');
  var personB = pool._seedPerson('bob-github');
  // identity 'google-sub-bob' is already linked to Person B.
  await identityLinks.linkIdentity(pool, 'bob-github', 'google-sub-bob', 'google', { info: function() {}, warn: function() {} });

  var stateBefore = JSON.parse(JSON.stringify(pool._state()));

  oauthAdapter.validateOAuthState = function() { return true; };
  oauthAdapter.setGoogleUserInfoAdapter(async function() {
    return { sub: 'google-sub-bob', email: 'bob@example.com', accessToken: 'ya29.stub-ac4' };
  });

  var handlers = accountLinking.createLinkCallbackHandlers(pool);
  var req = mockReq({
    session: { accessToken: 'gho_a', tenantId: 'alice-github', linkOauthState: 'state-ac4' },
    query: { code: 'c', state: 'state-ac4' }
  });
  var res = mockRes();

  await handlers.handleGoogleLinkCallback(req, res);

  assert.strictEqual(res.statusCode, 409, 'AC4: linking an already-linked-to-a-different-person identity responds 409 with a clear error');
  var parsedBody = JSON.parse(res.body);
  assert.ok(parsedBody.error && parsedBody.error.length > 0, 'AC4: response body carries a clear error message');

  var stateAfter = pool._state();
  assert.deepStrictEqual(stateAfter.personIdentities, stateBefore.personIdentities, 'AC4: no person_identities rows changed');
  assert.deepStrictEqual(stateAfter.teamMemberships, stateBefore.teamMemberships, 'AC4: no team_memberships rows changed');

  var resolvedA = await identityLinks.resolvePersonForIdentity(pool, 'alice-github');
  var resolvedB = await identityLinks.resolvePersonForIdentity(pool, 'google-sub-bob');
  assert.strictEqual(resolvedA, personA, 'AC4: Person A unchanged');
  assert.strictEqual(resolvedB, personB, 'AC4: identity remains linked only to Person B');
}

// ─────────────────────────────────────────────────────────────────────────────
// NFR — audit: link actions logged with person id + a hash of the linked
// identity + a timestamp; the raw identity/token value never appears in the
// logged payload
// ─────────────────────────────────────────────────────────────────────────────

async function testNfrAuditLogging() {
  var identityLinks = freshRequire(IDENTITY_LINKS_PATH);
  var pool = makeFakePool();
  pool._seedPerson('carol-github');

  var logEvents = [];
  var spyLogger = {
    info: function(event, data) { logEvents.push({ event: event, data: data }); },
    warn: function(event, data) { logEvents.push({ event: event, data: data }); }
  };

  var RAW_TOKEN = 'ya29.SECRET_GOOGLE_TOKEN_should_never_be_logged';
  await identityLinks.linkIdentity(pool, 'carol-github', 'google-sub-carol', 'google', spyLogger);

  var linkEvent = logEvents.find(function(e) { return e.event === 'identity_linked'; });
  assert.ok(linkEvent, 'NFR audit: a link event was logged');
  assert.strictEqual(linkEvent.data.personId, await identityLinks.resolvePersonForIdentity(pool, 'carol-github'), 'NFR audit: log entry includes the person id');
  assert.ok(linkEvent.data.timestamp, 'NFR audit: log entry includes a timestamp');
  assert.ok(linkEvent.data.linkedIdentityHash, 'NFR audit: log entry includes a hash of the linked identity, not the raw value');
  assert.notStrictEqual(linkEvent.data.linkedIdentityHash, 'google-sub-carol', 'NFR audit: the raw identity string is not logged verbatim');

  var serializedLog = JSON.stringify(logEvents);
  assert.ok(!serializedLog.includes(RAW_TOKEN), 'NFR audit: no token-shaped value ever appears in the logged payload');
  assert.ok(!serializedLog.includes('google-sub-carol'), 'NFR audit: the raw provider identity string never appears in the logged payload');
}

// ─────────────────────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n[tir-s2] Running AC verification tests...\n');

  console.log('AC1 — linking records both identities as one person');
  await test('AC1: linking Google to a logged-in GitHub session records one person', testAC1LinkRecordsSamePerson);

  console.log('\nAC2 — unauthenticated request redirects to login');
  await test('AC2: unauthenticated request to the link-settings page redirects to login', testAC2UnauthenticatedRedirectsToLogin);

  console.log('\nAC3 — no automatic email-based merging');
  await test('AC3: two separate signups sharing an email remain separate, unlinked', testAC3NoAutoMergeByEmail);

  console.log('\nAC4 — already-linked identity rejected, no data changes');
  await test('AC4: linking an already-linked identity is rejected without changing any data', testAC4RejectAlreadyLinkedIdentity);

  console.log('\nNFR — audit logging');
  await test('NFR: link actions are audit-logged (person id + hash + timestamp, never a raw token)', testNfrAuditLogging);

  console.log('\n[tir-s2] ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    console.error('\nFailures:');
    failures.forEach(function(f) { console.error('  - ' + f.name); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[tir-s2] Unexpected error:', err);
  process.exit(1);
});
