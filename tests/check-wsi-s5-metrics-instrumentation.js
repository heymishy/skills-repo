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

await checkAsyncOrSync('AC3: addTeammateByAdmin_success_capturesComparableEvent', async () => {
  var patch = patchPosthogCapture();
  try {
    var pool = {
      query: async function (sql) {
        var s = String(sql).toUpperCase();
        if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS') === 0) return { rows: [] };
        return { rows: [] };
      }
    };
    // resolvePersonForIdentity lives in identity-links.js, a real upstream
    // dependency this story does not touch -- mock only what this test
    // needs by monkey-patching it the same way posthog is patched above,
    // matching this same file's own established approach for an
    // unavoidable real dependency. Ordering matters here (same rule as this
    // story's own setUpTeamManagementRoutesWithMagicLink helper): identity-links
    // must be freshRequired and patched BEFORE team-management.js is
    // freshRequired, so team-management.js's own internal
    // require('./identity-links') resolves to this SAME patched instance,
    // not a stale, already-cached, unpatched one.
    var identityLinks = freshRequire(require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'identity-links')));
    var originalResolve = identityLinks.resolvePersonForIdentity;
    identityLinks.resolvePersonForIdentity = async function () { return 4242; };
    var teamManagement = freshRequire(TEAM_MANAGEMENT_MODULE_PATH);
    try {
      var result = await teamManagement.addOrUpdateTeammate(pool, 'tenant-admin-add', 'someone@example.com', 'engineer', 'admin-99');
      assert.strictEqual(result.personId, 4242);

      var event = patch.calls.find(function (c) { return c.event === 'teammate_added_by_admin'; });
      assert.ok(event, 'expected a teammate_added_by_admin event to be captured -- this event does not exist in the pre-story code');
      assert.strictEqual(event.props.tenant_id, 'tenant-admin-add');
      assert.strictEqual(event.props.role, 'engineer');
    } finally {
      identityLinks.resolvePersonForIdentity = originalResolve;
    }
  } finally {
    patch.restore();
  }
});

await checkAsyncOrSync('AC4: bothMetrics_realEventShapes_computableWithoutManualEstimation', async () => {
  var patch = patchPosthogCapture();
  try {
    // Simulate a mix: one self-serve invite created + accepted, one admin-add.
    var teamManagementRoutes = setUpTeamManagementRoutesWithMagicLink(async function () {});
    var createState = {};
    var createPool = makeMockPool(createState);
    var createHandlers = teamManagementRoutes.createTeamManagementHandlers(createPool);
    await createHandlers.handleCreateInvite(mockReq({ body: { email: 'mix1@example.com', role: 'engineer', _csrf: 'test-csrf-token' } }), mockRes());

    var teamInvitations = freshRequire(TEAM_INVITATIONS_PATH);
    var createdAt = new Date(Date.now() - 60000).toISOString();
    var acceptPool = {
      query: async function (sql) {
        var s = String(sql).toUpperCase();
        if (s.indexOf('SELECT TEAM_INVITATION_ID') === 0) return { rows: [{ team_invitation_id: 'tinv-mix', tenant_id: 'tenant-mix', email: 'mix1@example.com', role: 'engineer', created_at: createdAt, expires_at: new Date(Date.now() + 3600000).toISOString(), redeemed_at: null }] };
        if (s.indexOf('UPDATE TEAM_INVITATIONS SET REDEEMED_AT') === 0) return { rows: [{ team_invitation_id: 'tinv-mix', tenant_id: 'tenant-mix', role: 'engineer' }] };
        if (s.indexOf('SELECT PERSON_ID FROM PERSON_IDENTITIES') === 0) return { rows: [] };
        if (s.indexOf('INSERT INTO PEOPLE DEFAULT VALUES') === 0) return { rows: [{ id: 9101 }] };
        if (s.indexOf('SELECT COUNT(*) AS COUNT FROM TEAM_MEMBERSHIPS') === 0) return { rows: [{ count: '0' }] };
        return { rows: [] };
      }
    };
    await teamInvitations.redeemTeamInvitation(acceptPool, { destination: 'mix1@example.com', teamInvitationId: 'tinv-mix' });

    // Ordering fixed proactively (same bug already found and corrected in
    // Task 3): identityLinks must be freshRequired and patched BEFORE
    // teamManagement is freshRequired, or team-management.js's own internal
    // require('./identity-links') resolves to a stale, unpatched instance.
    var identityLinks = freshRequire(require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'identity-links')));
    var originalResolve = identityLinks.resolvePersonForIdentity;
    identityLinks.resolvePersonForIdentity = async function () { return 5555; };
    var teamManagement = freshRequire(TEAM_MANAGEMENT_MODULE_PATH);
    try {
      await teamManagement.addOrUpdateTeammate({ query: async function () { return { rows: [] }; } }, 'tenant-mix', 'mix2@example.com', 'viewer', 'admin-1');
    } finally {
      identityLinks.resolvePersonForIdentity = originalResolve;
    }

    // Metric 1: share of self-serve vs admin-add.
    var selfServeAccepted = patch.calls.filter(function (c) { return c.event === 'team_invite_accepted'; }).length;
    var adminAdded = patch.calls.filter(function (c) { return c.event === 'teammate_added_by_admin'; }).length;
    assert.strictEqual(selfServeAccepted, 1);
    assert.strictEqual(adminAdded, 1);
    var shareOfSelfServe = selfServeAccepted / (selfServeAccepted + adminAdded);
    assert.strictEqual(shareOfSelfServe, 0.5, 'expected the share metric to be directly computable from captured event counts alone');

    // Metric 2: time from creation to access.
    var acceptedEvent = patch.calls.find(function (c) { return c.event === 'team_invite_accepted'; });
    assert.ok(typeof acceptedEvent.props.elapsedMs === 'number' && acceptedEvent.props.elapsedMs > 0, 'expected the elapsed-time metric to be directly computable from the captured event alone, no external correlation needed');
  } finally {
    patch.restore();
  }
});

await checkAsyncOrSync('NFR-security: eventProperties_neverIncludeEmailOrToken', async () => {
  var patch = patchPosthogCapture();
  try {
    var teamManagementRoutes = setUpTeamManagementRoutesWithMagicLink(async function () {});
    var createState = {};
    var createPool = makeMockPool(createState);
    var createHandlers = teamManagementRoutes.createTeamManagementHandlers(createPool);
    await createHandlers.handleCreateInvite(mockReq({ body: { email: 'secret-invitee@example.com', role: 'engineer', _csrf: 'test-csrf-token' } }), mockRes());

    var teamInvitations = freshRequire(TEAM_INVITATIONS_PATH);
    var acceptPool = {
      query: async function (sql) {
        var s = String(sql).toUpperCase();
        if (s.indexOf('SELECT TEAM_INVITATION_ID') === 0) return { rows: [{ team_invitation_id: 'tinv-nfr', tenant_id: 'tenant-nfr', email: 'secret-invitee@example.com', role: 'engineer', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 3600000).toISOString(), redeemed_at: null }] };
        if (s.indexOf('UPDATE TEAM_INVITATIONS SET REDEEMED_AT') === 0) return { rows: [{ team_invitation_id: 'tinv-nfr', tenant_id: 'tenant-nfr', role: 'engineer' }] };
        if (s.indexOf('SELECT PERSON_ID FROM PERSON_IDENTITIES') === 0) return { rows: [] };
        if (s.indexOf('INSERT INTO PEOPLE DEFAULT VALUES') === 0) return { rows: [{ id: 9102 }] };
        if (s.indexOf('SELECT COUNT(*) AS COUNT FROM TEAM_MEMBERSHIPS') === 0) return { rows: [{ count: '0' }] };
        return { rows: [] };
      }
    };
    await teamInvitations.redeemTeamInvitation(acceptPool, { destination: 'secret-invitee@example.com', teamInvitationId: 'tinv-nfr' });

    // Same ordering fix as above: identityLinks freshRequired/patched first.
    var identityLinks = freshRequire(require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'identity-links')));
    var originalResolve = identityLinks.resolvePersonForIdentity;
    identityLinks.resolvePersonForIdentity = async function () { return 6666; };
    var teamManagement = freshRequire(TEAM_MANAGEMENT_MODULE_PATH);
    try {
      await teamManagement.addOrUpdateTeammate({ query: async function () { return { rows: [] }; } }, 'tenant-nfr', 'secret-admin-added@example.com', 'viewer', 'admin-1');
    } finally {
      identityLinks.resolvePersonForIdentity = originalResolve;
    }

    assert.ok(patch.calls.length >= 3, 'expected at least 3 events captured across all three flows');
    patch.calls.forEach(function (c) {
      var serialized = JSON.stringify(c.props);
      assert.ok(serialized.indexOf('@example.com') === -1, 'expected event "' + c.event + '" properties to never contain a raw email address, got: ' + serialized);
      assert.ok(serialized.indexOf('secret-invitee') === -1 && serialized.indexOf('secret-admin-added') === -1, 'expected event "' + c.event + '" properties to never contain the raw email local-part either');
    });
  } finally {
    patch.restore();
  }
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
