'use strict';
// check-wsi-s1-admin-creates-invite.js — wsi-s1
//
// Covers AC1 (invite row written, tenant-scoped) in this initial commit.
// AC2-AC5 are added in later tasks of this same story's plan.

var assert = require('assert');

var passed = 0;
var failed = 0;

function checkAsyncOrSync(name, fn) {
  return Promise.resolve().then(fn).then(function () {
    console.log('PASS:', name); passed++;
  }).catch(function (e) {
    console.error('FAIL:', name, '—', e.message); failed++; process.exitCode = 1;
  });
}

var teamManagementRoutes = require('../src/web-ui/routes/team-management');
var invitationEmail = require('../src/web-ui/modules/invitation-email');

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

(async () => {

await checkAsyncOrSync('AC1: createInvite_validRoleAndEmail_writesTenantScopedRow', async () => {
  var state = {};
  var pool = makeMockPool(state);
  var handlers = teamManagementRoutes.createTeamManagementHandlers(pool);
  invitationEmail.setSendInvitationEmail(function () { return Promise.resolve(); });
  try {
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
  } finally {
    invitationEmail._resetForTesting();
  }
});

await checkAsyncOrSync('AC1: createInvite_tenantIdNeverFromRequest_onlyFromSession', async () => {
  var state = {};
  var pool = makeMockPool(state);
  var handlers = teamManagementRoutes.createTeamManagementHandlers(pool);
  invitationEmail.setSendInvitationEmail(function () { return Promise.resolve(); });
  try {
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
  } finally {
    invitationEmail._resetForTesting();
  }
});

await checkAsyncOrSync('AC2: createInvite_success_callsSendInvitationEmailWithCorrectArgs', async () => {
  var state = {};
  var pool = makeMockPool(state);
  var handlers = teamManagementRoutes.createTeamManagementHandlers(pool);
  var sentArgs = null;
  invitationEmail.setSendInvitationEmail(function (email, link) { sentArgs = { email: email, link: link }; return Promise.resolve(); });
  try {
    var req = mockReq({ body: { email: 'someone@example.com', role: 'product', _csrf: 'test-csrf-token' } });
    var res = mockRes();
    await handlers.handleCreateInvite(req, res);
    assert.ok(sentArgs, 'expected sendInvitationEmail to be called');
    assert.strictEqual(sentArgs.email, 'someone@example.com', 'expected the invitee email to be passed');
    assert.ok(sentArgs.link && sentArgs.link.indexOf(state.inserted.team_invitation_id) !== -1, 'expected the invite link to contain the real invite id');
  } finally {
    invitationEmail._resetForTesting();
  }
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
