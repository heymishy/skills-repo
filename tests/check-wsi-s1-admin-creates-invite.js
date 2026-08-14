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

function mockReq(overrides) {
  return Object.assign({
    session: { tenantId: 'tenant-A', userId: 'admin-1' },
    body: { email: 'newbie@example.com', role: 'engineer' }
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
        state.inserted = { team_invitation_id: params[0], tenant_id: params[1], email: params[2], role: params[3] };
        return { rows: [Object.assign({}, state.inserted, { created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(), redeemed_at: null })] };
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
  // Bypass CSRF for this unit-level test — CSRF is exercised at the route-wiring level, not here.
  var req = mockReq();
  var res = mockRes();
  await handlers.handleCreateInvite(req, res, { skipCsrf: true });
  assert.ok(state.inserted, 'expected an INSERT into team_invitations');
  assert.strictEqual(state.inserted.tenant_id, 'tenant-A', 'expected tenant_id from session, not request');
  assert.strictEqual(state.inserted.role, 'engineer', 'expected the submitted role to be written');
  assert.strictEqual(state.inserted.email, 'newbie@example.com', 'expected the submitted email to be written');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
