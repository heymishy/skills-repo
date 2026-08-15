'use strict';
// check-wsi-s5-metrics-instrumentation.js — wsi-s5
//
// Covers AC1 in this commit (AC2-AC4 + NFR added in later tasks of this
// same story's plan).

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
var TEAM_MANAGEMENT_ROUTES_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'team-management'));
var TEAM_INVITATIONS_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'team-invitations'));
var TEAM_MANAGEMENT_MODULE_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'team-management'));
var POSTHOG_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'posthog-server'));

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

function patchPosthogCapture() {
  var posthogModule = require(POSTHOG_PATH);
  var original = posthogModule.capture;
  var calls = [];
  posthogModule.capture = function (id, event, props) { calls.push({ id: id, event: event, props: props }); };
  return {
    calls: calls,
    restore: function () { posthogModule.capture = original; }
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

function setUpTeamManagementRoutesWithMagicLink(sendMagicLinkMock) {
  var strategy = freshRequire(MAGIC_LINK_STRATEGY_PATH);
  strategy.registerMagicLinkStrategy({
    secret: 'wsi-s5-test-secret',
    callbackUrl: '/invite/redeem',
    sendMagicLink: sendMagicLinkMock,
    verify: async function () {}
  });
  return freshRequire(TEAM_MANAGEMENT_ROUTES_PATH);
}

(async () => {

await checkAsyncOrSync('AC1: createInvite_success_capturesTeamInviteCreatedWithProperties', async () => {
  var patch = patchPosthogCapture();
  try {
    var state = {};
    var pool = makeMockPool(state);
    var teamManagementRoutes = setUpTeamManagementRoutesWithMagicLink(async function () {});
    var handlers = teamManagementRoutes.createTeamManagementHandlers(pool);
    var req = mockReq({ body: { email: 'metrics@example.com', role: 'product', _csrf: 'test-csrf-token' } });
    var res = mockRes();
    await handlers.handleCreateInvite(req, res);

    var event = patch.calls.find(function (c) { return c.event === 'team_invite_created'; });
    assert.ok(event, 'expected a team_invite_created event to be captured');
    assert.strictEqual(event.props.tenant_id, 'tenant-A', 'expected the real tenant_id');
    assert.strictEqual(event.props.role, 'product', 'expected the real submitted role');
    assert.strictEqual(event.props.team_invitation_id, state.inserted.team_invitation_id, 'expected the real invite id, not a placeholder');
  } finally {
    patch.restore();
  }
});

await checkAsyncOrSync('AC2: acceptInvite_success_capturesTeamInviteAcceptedWithElapsedTime', async () => {
  var patch = patchPosthogCapture();
  try {
    var teamInvitations = freshRequire(TEAM_INVITATIONS_PATH);
    var createdAt = new Date(Date.now() - 90000).toISOString(); // 90 seconds ago
    var pool = {
      query: async function (sql, params) {
        var s = String(sql).toUpperCase();
        if (s.indexOf('SELECT TEAM_INVITATION_ID') === 0) {
          return { rows: [{ team_invitation_id: 'tinv-metrics-1', tenant_id: 'tenant-metrics', email: 'accepted@example.com', role: 'viewer', created_at: createdAt, expires_at: new Date(Date.now() + 3600000).toISOString(), redeemed_at: null }] };
        }
        if (s.indexOf('UPDATE TEAM_INVITATIONS SET REDEEMED_AT') === 0) {
          return { rows: [{ team_invitation_id: 'tinv-metrics-1', tenant_id: 'tenant-metrics', email: 'accepted@example.com', role: 'viewer', created_at: createdAt, redeemed_at: new Date().toISOString() }] };
        }
        if (s.indexOf('SELECT PERSON_ID FROM PERSON_IDENTITIES') === 0) return { rows: [] };
        if (s.indexOf('INSERT INTO PEOPLE DEFAULT VALUES') === 0) return { rows: [{ id: 9001 }] };
        if (s.indexOf('SELECT COUNT(*) AS COUNT FROM TEAM_MEMBERSHIPS') === 0) return { rows: [{ count: '0' }] };
        return { rows: [] };
      }
    };
    var beforeAccept = Date.now();
    var result = await teamInvitations.redeemTeamInvitation(pool, { destination: 'accepted@example.com', teamInvitationId: 'tinv-metrics-1' });
    var afterAccept = Date.now();
    assert.strictEqual(result.ok, true, 'expected acceptance to succeed');

    var event = patch.calls.find(function (c) { return c.event === 'team_invite_accepted'; });
    assert.ok(event, 'expected a team_invite_accepted event to be captured');
    assert.strictEqual(event.props.tenant_id, 'tenant-metrics');
    assert.strictEqual(event.props.role, 'viewer');
    assert.strictEqual(event.props.team_invitation_id, 'tinv-metrics-1');
    assert.ok(typeof event.props.elapsedMs === 'number', 'expected a numeric elapsedMs property');
    var minExpected = beforeAccept - new Date(createdAt).getTime() - 1000; // small tolerance
    var maxExpected = afterAccept - new Date(createdAt).getTime() + 1000;
    assert.ok(event.props.elapsedMs >= minExpected && event.props.elapsedMs <= maxExpected, 'expected elapsedMs to reflect the ACTUAL computed difference (~90000ms), got: ' + event.props.elapsedMs);
  } finally {
    patch.restore();
  }
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
