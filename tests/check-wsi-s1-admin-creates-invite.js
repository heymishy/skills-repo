'use strict';
// check-wsi-s1-admin-creates-invite.js — wsi-s1
//
// Covers AC1-AC2 in this commit (AC3-AC5 added in later tasks of this same
// story's plan).
//
// Uses freshRequire() for src/web-ui/auth/magic-link-strategy.js and
// src/web-ui/routes/team-management.js in every test that reaches the
// invite-email path, mirroring tests/check-story3-self-service-provisioning.js's
// own established pattern -- magic-link-strategy.js holds module-singleton
// state (the one registered Passport strategy instance), so each test must
// get a fresh instance and explicitly register a mock sendMagicLink, or
// state leaks across tests sharing this one process.

var assert = require('assert');
var path = require('path');

var passed = 0;
var failed = 0;

function checkAsyncOrSync(name, fn) {
  return Promise.resolve().then(fn).then(function () {
    console.log('PASS:', name); passed++;
  }).catch(function (e) {
    console.error('FAIL:', name, '—', e.message); failed++; process.exitCode = 1;
  });
}

var ROOT = path.join(__dirname, '..');
var MAGIC_LINK_STRATEGY_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'auth', 'magic-link-strategy'));
var TEAM_MANAGEMENT_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'team-management'));

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

function mockReq(overrides) {
  return Object.assign({
    session: { tenantId: 'tenant-A', userId: 'admin-1', csrfToken: 'test-csrf-token' },
    body: { email: 'newbie@example.com', role: 'engineer', _csrf: 'test-csrf-token' }
  }, overrides || {});
}

function mockRes() {
  var _statusCode = null;
  var _body = '';
  return {
    writeHead: function (code) { _statusCode = code; return this; },
    end: function (body) { if (body != null) _body = body; },
    _get: function () { return { statusCode: _statusCode, body: _body }; }
  };
}

function makeMockPool(state) {
  state.inserted = null;
  return {
    query: async function (sql, params) {
      var s = String(sql);
      if (/INSERT INTO team_invitations/i.test(s)) {
        state.inserted = { team_invitation_id: params[0], tenant_id: params[1], email: params[2], role: params[3], expires_at: params[4] };
        return { rows: [Object.assign({}, state.inserted, { created_at: new Date().toISOString(), redeemed_at: null })] };
      }
      return { rows: [] };
    }
  };
}

// Registers a fresh magic-link strategy instance whose sendMagicLink is the
// given mock, then freshRequires team-management.js so its own internal
// require('../auth/magic-link-strategy') resolves to this SAME freshly
// registered instance (order matters: the strategy module must be
// freshRequired and registered BEFORE team-management.js is freshRequired).
function setUpTeamManagementWithMagicLink(sendMagicLinkMock) {
  var strategy = freshRequire(MAGIC_LINK_STRATEGY_PATH);
  strategy.registerMagicLinkStrategy({
    secret: 'unit-test-secret',
    callbackUrl: '/invite/redeem',
    sendMagicLink: sendMagicLinkMock,
    verify: async function () {}
  });
  return freshRequire(TEAM_MANAGEMENT_PATH);
}

(async () => {

await checkAsyncOrSync('AC1: createInvite_validRoleAndEmail_writesTenantScopedRow', async () => {
  var state = {};
  var pool = makeMockPool(state);
  var teamManagementRoutes = setUpTeamManagementWithMagicLink(async function () {});
  var handlers = teamManagementRoutes.createTeamManagementHandlers(pool);
  var beforeCall = Date.now();
  var req = mockReq();
  var res = mockRes();
  await handlers.handleCreateInvite(req, res);
  var afterCall = Date.now();
  assert.ok(state.inserted, 'expected an INSERT into team_invitations');
  assert.strictEqual(state.inserted.tenant_id, 'tenant-A', 'expected tenant_id from session, not request');
  assert.strictEqual(state.inserted.role, 'engineer', 'expected the submitted role to be written');
  assert.strictEqual(state.inserted.email, 'newbie@example.com', 'expected the submitted email to be written');

  var expiresAt = new Date(state.inserted.expires_at);
  assert.ok(!isNaN(expiresAt.getTime()), 'expected expires_at to be a valid ISO timestamp, got: ' + state.inserted.expires_at);
  var TOLERANCE_MS = 5000;
  var minExpected = beforeCall + 24 * 3600 * 1000 - TOLERANCE_MS;
  var maxExpected = afterCall + 24 * 3600 * 1000 + TOLERANCE_MS;
  assert.ok(
    expiresAt.getTime() >= minExpected && expiresAt.getTime() <= maxExpected,
    'expected expires_at to be ~24 hours after creation, got: ' + state.inserted.expires_at
  );
});

await checkAsyncOrSync('AC1: createInvite_tenantIdNeverFromRequest_onlyFromSession', async () => {
  var state = {};
  var pool = makeMockPool(state);
  var teamManagementRoutes = setUpTeamManagementWithMagicLink(async function () {});
  var handlers = teamManagementRoutes.createTeamManagementHandlers(pool);
  // ADR-025 tamper-resistance: a spoofed tenantId in the request body must be
  // ignored -- only req.session.tenantId is ever used, matching
  // check-tir-s3-admin-adds-teammate.js's own testADR025TenantScopedAuthorization shape.
  var req = mockReq({
    session: { tenantId: 'tenant-A', userId: 'admin-1', csrfToken: 'test-csrf-token' },
    body: { email: 'newbie@example.com', role: 'engineer', tenantId: 'tenant-B', _csrf: 'test-csrf-token' }
  });
  var res = mockRes();
  await handlers.handleCreateInvite(req, res);
  assert.ok(state.inserted, 'expected an INSERT into team_invitations');
  assert.strictEqual(state.inserted.tenant_id, 'tenant-A', 'expected tenant_id from session (tenant-A), never the spoofed request body field');
  assert.notStrictEqual(state.inserted.tenant_id, 'tenant-B', 'expected the spoofed tenantId in the request body to be ignored entirely');
});

await checkAsyncOrSync('AC2: createInvite_success_issuesSignedMagicLinkWithCorrectTeamInvitationId', async () => {
  var state = {};
  var pool = makeMockPool(state);
  var sentCalls = [];
  var teamManagementRoutes = setUpTeamManagementWithMagicLink(async function (destination, href, code) {
    sentCalls.push({ destination: destination, href: href, code: code });
  });
  var handlers = teamManagementRoutes.createTeamManagementHandlers(pool);
  var req = mockReq({ body: { email: 'someone@example.com', role: 'product', _csrf: 'test-csrf-token' } });
  var res = mockRes();
  await handlers.handleCreateInvite(req, res);
  assert.strictEqual(res._get().statusCode, 200, 'expected a successful invite creation response');
  assert.strictEqual(sentCalls.length, 1, 'expected the mocked sendMagicLink to be called exactly once');
  assert.strictEqual(sentCalls[0].destination, 'someone@example.com', 'expected the invitee email to be passed');
  assert.ok(sentCalls[0].href && sentCalls[0].href.indexOf('token=') !== -1, 'expected the sent link to contain a signed token-bearing query param, not a raw id');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
