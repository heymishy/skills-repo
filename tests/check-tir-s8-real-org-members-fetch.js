#!/usr/bin/env node
// check-tir-s8-real-org-members-fetch.js — tir-s8
// Verifies the FIX for tir-s5's bulk-add functional-correctness bug:
// bulkAddFromGithubOrg (src/web-ui/modules/github-org-bulk-add.js) reused
// routes/auth.js's setFetchOrgs adapter, which calls GET /user/orgs -- this
// lists the ORGS a token belongs to, NOT the MEMBERS of a specific org. Each
// returned .login was an org's name, not a person's username, so every
// "member" silently failed resolvePersonForIdentity and addedCount was
// always 0 in production.
//
// This story adds a NEW D37 adapter -- setFetchOrgMembers(fn) /
// getOrgMembers(orgName, accessToken, page) -- in routes/auth.js, wires its
// real production implementation in server.js (GET /orgs/{org}/members,
// reusing the same link-header rel="next" pagination pattern as
// setFetchOrgs), and rewires bulkAddFromGithubOrg to call it instead.
//
// Follows this repo's hand-rolled test()/assert style (see
// tests/check-tir-s5-github-org-bulk-add.js) -- no Jest/Mocha.
//
// AC1: the new fetch returns real org member logins, not the list of orgs
//      the admin's token belongs to
// AC2: an unwired setFetchOrgMembers/getOrgMembers throws a clear
//      "Adapter not wired" error (D37)
// AC3: end-to-end bulk-add with a realistic member-object shape adds real
//      teammates (addedCount reflects genuinely new adds)
// AC4: pagination is followed across multiple pages before processing
// AC5: tir-s5's existing test file (corrected in this story) still passes
//      in full after the mock correction -- verified here by spawning it as
//      an isolated child process (that file's main() calls process.exit(),
//      so it must never be require()'d in-process)
// NFR (security) / ADR-025: the org name passed to getOrgMembers is always
//      req.session.tenantId, never a value read from req.body/req.query

'use strict';

var assert = require('assert');
var path = require('path');
var fs = require('fs');
var execFileSync = require('child_process').execFileSync;

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

var AUTH_MODULE_PATH = path.resolve(ROOT, 'src/web-ui/routes/auth.js');
var BULK_ADD_MODULE_PATH = path.resolve(ROOT, 'src/web-ui/modules/github-org-bulk-add.js');
var BULK_ADD_ROUTE_PATH = path.resolve(ROOT, 'src/web-ui/routes/github-org-bulk-add.js');
var TIR_S5_TEST_PATH = path.resolve(ROOT, 'tests/check-tir-s5-github-org-bulk-add.js');

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

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
// Narrow, self-contained fake -- mirrors tests/check-tir-s5-github-org-bulk-add.js's
// own makeFakePool() convention exactly (not shared/imported, per this repo's
// "narrow, explicit-branch fake" pattern -- each test file is self-contained).
function _norm(sql) {
  return String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
}

function makeFakePool() {
  var people = [];
  var nextPersonId = 1;
  var teamMemberships = []; // { person_id, tenant_id, role }
  var personIdentities = []; // { identity_key, person_id, provider }

  function _findMembership(personId, tenantId) {
    return teamMemberships.filter(function(r) { return r.person_id === personId && r.tenant_id === tenantId; })[0];
  }

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

    if (s.indexOf('SELECT PERSON_ID FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0) {
      var tm = teamMemberships.filter(function(r) { return r.tenant_id === p[0]; });
      return Promise.resolve({ rows: tm.length ? [{ person_id: tm[0].person_id }] : [] });
    }

    if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0 && s.indexOf('AND PERSON_ID') !== -1) {
      var found = _findMembership(p[1], p[0]);
      return Promise.resolve({ rows: found ? [{ role: found.role }] : [] });
    }

    if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE PERSON_ID') === 0 && s.indexOf('AND TENANT_ID') !== -1) {
      var found2 = _findMembership(p[0], p[1]);
      return Promise.resolve({ rows: found2 ? [{ role: found2.role }] : [] });
    }

    if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0) {
      var tenantOnly = teamMemberships.filter(function(r) { return r.tenant_id === p[0]; });
      return Promise.resolve({ rows: tenantOnly.length ? [{ role: tenantOnly[0].role }] : [] });
    }

    if (s.indexOf('SELECT ROLE FROM USER_ROLES WHERE TENANT_ID') === 0) {
      return Promise.resolve({ rows: [] });
    }

    if (s.indexOf('INSERT INTO TEAM_MEMBERSHIPS') === 0 && s.indexOf('ON CONFLICT') !== -1 && s.indexOf('DO UPDATE') !== -1) {
      var personId = p[0], tenantId = p[1], role = p[2];
      var existing = _findMembership(personId, tenantId);
      if (existing) {
        existing.role = role;
      } else {
        teamMemberships.push({ person_id: personId, tenant_id: tenantId, role: role });
      }
      return Promise.resolve({ rows: [] });
    }

    if (s.indexOf('INSERT INTO PEOPLE DEFAULT VALUES') === 0) {
      var person = { id: nextPersonId++ };
      people.push(person);
      return Promise.resolve({ rows: [{ id: person.id }] });
    }

    console.warn('[fake-pool] unhandled query (returning empty rows): ' + s.slice(0, 160));
    return Promise.resolve({ rows: [] });
  }

  function _seedKnownPerson(identityKey) {
    var person = { id: nextPersonId++ };
    people.push(person);
    teamMemberships.push({ person_id: person.id, tenant_id: identityKey, role: 'user' });
    return person.id;
  }

  return {
    query: query,
    _seedKnownPerson: _seedKnownPerson,
    _state: function() { return { people: people, teamMemberships: teamMemberships, personIdentities: personIdentities }; }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — an unwired setFetchOrgMembers/getOrgMembers throws a clear D37 error
// ─────────────────────────────────────────────────────────────────────────────

async function testAC2AdapterThrowsWhenUnwired() {
  var auth = freshRequire(AUTH_MODULE_PATH);

  await assert.rejects(
    function() { return auth.getOrgMembers('acme-corp', 'fake-token', 1); },
    function(err) {
      assert.ok(/Adapter not wired/.test(err.message), 'AC2: error message states the adapter is not wired, got: ' + err.message);
      assert.ok(/getOrgMembers/.test(err.message), 'AC2: error message names getOrgMembers, got: ' + err.message);
      assert.ok(/setFetchOrgMembers/.test(err.message), 'AC2: error message names setFetchOrgMembers() as the fix, got: ' + err.message);
      return true;
    },
    'AC2: calling getOrgMembers before wiring throws a clear D37 stub-throw error, matching setFetchOrgs\'s exact wording convention'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — new fetch returns real org member logins for a specific org, not the
// list of orgs the admin's token belongs to
// ─────────────────────────────────────────────────────────────────────────────

async function testAC1FetchReturnsRealMemberLoginsNotOrgs() {
  var auth = freshRequire(AUTH_MODULE_PATH);

  var calls = [];
  auth.setFetchOrgMembers(async function(orgName, accessToken, page) {
    calls.push({ orgName: orgName, accessToken: accessToken, page: page });
    return [{ login: 'alice', id: 1, type: 'User' }, { login: 'bob', id: 2, type: 'User' }, { login: 'carol', id: 3, type: 'User' }];
  });

  var result = await auth.getOrgMembers('acme-corp', 'fake-token', 1);

  assert.strictEqual(calls.length, 1, 'AC1: adapter called exactly once');
  assert.strictEqual(calls[0].orgName, 'acme-corp', 'AC1: adapter is called WITH the org name -- unlike the old setFetchOrgs, which takes no org parameter at all');
  assert.deepStrictEqual(
    result.map(function(m) { return m.login; }),
    ['alice', 'bob', 'carol'],
    'AC1: returns the 3 real member logins for the named org, not a list of orgs the token belongs to'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — end-to-end bulk-add with a realistic member-object shape adds real
// teammates (addedCount reflects genuinely new adds, not 0)
// ─────────────────────────────────────────────────────────────────────────────

async function testAC3EndToEndBulkAddAddsRealTeammates() {
  var bulkAdd = freshRequire(BULK_ADD_MODULE_PATH);
  var pool = makeFakePool();

  pool._seedKnownPerson('alice');

  var getOrgMembers = async function(orgName, accessToken, page) {
    assert.strictEqual(orgName, 'acme-corp', 'AC3: getOrgMembers is called with the admin\'s tenant as the org name');
    return { members: [{ login: 'alice', id: 123, type: 'User' }], nextPage: null };
  };

  var result = await bulkAdd.bulkAddFromGithubOrg(pool, 'acme-corp', getOrgMembers, 'fake-token', 'admin-1');

  assert.strictEqual(result.addedCount, 1, 'AC3: addedCount is 1 -- a genuinely new teammate was added, not the pre-fix 0');

  var state = pool._state();
  var rows = state.teamMemberships.filter(function(r) { return r.tenant_id === 'acme-corp'; });
  assert.strictEqual(rows.length, 1, 'AC3: exactly one team_memberships row was created for the real member');
  assert.strictEqual(rows[0].role, 'engineer', 'AC3: the added row carries the default role');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — pagination is followed across multiple pages before processing
// ─────────────────────────────────────────────────────────────────────────────

async function testAC4PaginationFollowedAcrossPages() {
  var auth = freshRequire(AUTH_MODULE_PATH);
  var bulkAdd = freshRequire(BULK_ADD_MODULE_PATH);
  var pool = makeFakePool();

  pool._seedKnownPerson('page-a');
  pool._seedKnownPerson('page-b');
  pool._seedKnownPerson('page-c');

  var callPages = [];
  auth.setFetchOrgMembers(async function(orgName, accessToken, page) {
    callPages.push(page);
    if (!page || page === 1) {
      return { members: [{ login: 'page-a', id: 201, type: 'User' }, { login: 'page-b', id: 202, type: 'User' }], nextPage: 2 };
    }
    return { members: [{ login: 'page-c', id: 203, type: 'User' }], nextPage: null };
  });

  var result = await bulkAdd.bulkAddFromGithubOrg(pool, 'acme-corp', auth.getOrgMembers, 'fake-token', 'admin-1');

  assert.deepStrictEqual(callPages, [1, 2], 'AC4: both pages were requested, in order, before the fetch completed');
  assert.strictEqual(result.totalOrgMembers, 3, 'AC4: all 3 members across both pages were collected before bulkAddFromGithubOrg processed them');
  assert.strictEqual(result.addedCount, 3, 'AC4: all 3 paginated members were added');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — tir-s5's existing test file (corrected in this story) still passes in
// full after the mock correction. Spawned as a child process, NOT require()'d
// in-process -- that file's main() calls process.exit(), which would kill
// this test runner if loaded in-process.
// ─────────────────────────────────────────────────────────────────────────────

async function testAC5TirS5TestsPassAfterMockCorrection() {
  assert.ok(fs.existsSync(TIR_S5_TEST_PATH), 'AC5 setup: tests/check-tir-s5-github-org-bulk-add.js exists');

  var output;
  var threw = false;
  try {
    output = execFileSync(process.execPath, [TIR_S5_TEST_PATH], {
      encoding: 'utf8',
      env: Object.assign({}, process.env, { NODE_ENV: 'test' }),
      timeout: 60000
    });
  } catch (err) {
    threw = true;
    output = (err && (err.stdout || err.message)) || '';
  }

  assert.ok(!threw, 'AC5: tir-s5\'s existing test file exits 0 (all tests pass) after the mock correction. Output:\n' + output);
  assert.ok(/\d+ passed, 0 failed/.test(output), 'AC5: tir-s5\'s corrected test file reports 0 failed. Output:\n' + output);
}

// ─────────────────────────────────────────────────────────────────────────────
// NFR (security) / ADR-025 — org name is never request-supplied
// ─────────────────────────────────────────────────────────────────────────────

async function testAdr025OrgNameNeverRequestSupplied() {
  var route = freshRequire(BULK_ADD_ROUTE_PATH);
  var pool = makeFakePool();

  pool._seedKnownPerson('mallory');

  var getOrgMembersCallArgs = [];
  var getOrgMembers = async function(orgName, accessToken, page) {
    getOrgMembersCallArgs.push(orgName);
    return { members: [{ login: 'mallory', id: 42, type: 'User' }], nextPage: null };
  };

  var handlers = route.createGithubOrgBulkAddHandlers(pool, getOrgMembers);

  // Attempt to smuggle a different org in the request body AND query --
  // the handler must ignore both entirely; the only source of truth is
  // req.session.tenantId (ADR-025).
  var req = mockReq({
    session: { userId: 'admin-1', tenantId: 'acme-real-org', role: 'admin', accessToken: 'real-token' },
    body: { org: 'attacker-org', orgName: 'attacker-org', tenantId: 'attacker-org' },
    query: { org: 'attacker-org' }
  });
  var res = mockRes();

  await handlers.handleBulkAddFromGithubOrg(req, res);

  assert.strictEqual(res.statusCode, 200, 'ADR-025 setup: bulk-add succeeds for the admin\'s real session tenant');
  assert.ok(getOrgMembersCallArgs.length > 0, 'ADR-025 setup: getOrgMembers was called at least once');

  getOrgMembersCallArgs.forEach(function(orgName) {
    assert.strictEqual(orgName, 'acme-real-org', 'ADR-025: getOrgMembers is always called with req.session.tenantId as orgName, never a request-body/query-supplied value like "attacker-org"');
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n[tir-s8] Running AC verification tests...\n');

  console.log('AC2 — unwired adapter throws (D37)');
  await test('AC2: calling getOrgMembers before wiring throws a clear D37 stub error', testAC2AdapterThrowsWhenUnwired);

  console.log('\nAC1 — new fetch returns real org member logins, not orgs the token belongs to');
  await test('AC1: getOrgMembers returns real member logins for a named org, called with the org name', testAC1FetchReturnsRealMemberLoginsNotOrgs);

  console.log('\nAC3 — end-to-end bulk-add adds real teammates');
  await test('AC3: end-to-end bulk-add with a realistic member-object shape adds real teammates', testAC3EndToEndBulkAddAddsRealTeammates);

  console.log('\nAC4 — pagination followed across multiple pages');
  await test('AC4: pagination is followed across multiple pages before bulk-add processes the members', testAC4PaginationFollowedAcrossPages);

  console.log('\nAC5 — tir-s5\'s existing tests pass after the mock correction');
  await test('AC5: tir-s5\'s existing test file passes in full after its mocks are corrected to use getOrgMembers', testAC5TirS5TestsPassAfterMockCorrection);

  console.log('\nNFR security / ADR-025 — org name is never request-supplied');
  await test('NFR/ADR-025: getOrgMembers is always called with req.session.tenantId, never a request-supplied org name', testAdr025OrgNameNeverRequestSupplied);

  console.log('\n[tir-s8] ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    console.error('\nFailures:');
    failures.forEach(function(f) { console.error('  - ' + f.name); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[tir-s8] Unexpected error:', err);
  process.exit(1);
});
