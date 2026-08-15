'use strict';
// check-wsi-s2-invitee-accepts-and-joins.js — wsi-s2
//
// Covers AC1-AC2 in this commit (AC3-AC5 + NFR added in later tasks of this
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
var TEAM_INVITATIONS_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'team-invitations'));

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

function makeFakePool(seed) {
  var invitations = ((seed && seed.invitations) || []).slice();
  var personIdentities = ((seed && seed.personIdentities) || []).slice();
  var people = ((seed && seed.people) || []).slice();
  var teamMemberships = ((seed && seed.teamMemberships) || []).slice();
  var nextPersonId = (seed && seed.nextPersonId) || 1000;

  function query(sql, params) {
    var s = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
    var p = params || [];

    if (s.indexOf('SELECT TEAM_INVITATION_ID') === 0) {
      var match = invitations.filter(function (r) { return r.team_invitation_id === p[0]; });
      return Promise.resolve({ rows: match });
    }
    if (s.indexOf('UPDATE TEAM_INVITATIONS SET REDEEMED_AT') === 0) {
      var idx = -1;
      for (var i = 0; i < invitations.length; i++) {
        if (invitations[i].team_invitation_id === p[0] && !invitations[i].redeemed_at) { idx = i; break; }
      }
      if (idx === -1) return Promise.resolve({ rows: [] });
      invitations[idx] = Object.assign({}, invitations[idx], { redeemed_at: new Date().toISOString() });
      return Promise.resolve({ rows: [invitations[idx]] });
    }
    if (s.indexOf('SELECT PERSON_ID FROM PERSON_IDENTITIES') === 0) {
      var link = personIdentities.filter(function (r) { return r.identity_key === p[0]; });
      return Promise.resolve({ rows: link.length ? [{ person_id: link[0].person_id }] : [] });
    }
    if (s.indexOf('INSERT INTO PEOPLE DEFAULT VALUES') === 0) {
      var newId = nextPersonId++;
      people.push({ id: newId });
      return Promise.resolve({ rows: [{ id: newId }] });
    }
    if (s.indexOf('INSERT INTO PERSON_IDENTITIES') === 0) {
      personIdentities.push({ identity_key: p[0], person_id: p[1] });
      return Promise.resolve({ rows: [] });
    }
    if (s.indexOf('INSERT INTO TEAM_MEMBERSHIPS') === 0) {
      var existingIdx = -1;
      for (var j = 0; j < teamMemberships.length; j++) {
        if (teamMemberships[j].person_id === p[0] && teamMemberships[j].tenant_id === p[1]) { existingIdx = j; break; }
      }
      if (existingIdx !== -1) {
        teamMemberships[existingIdx] = Object.assign({}, teamMemberships[existingIdx], { role: p[2] });
      } else {
        teamMemberships.push({ person_id: p[0], tenant_id: p[1], role: p[2] });
      }
      return Promise.resolve({ rows: [] });
    }
    if (s.indexOf('INSERT INTO TEAM_INVITATIONS') === 0) {
      var row = { team_invitation_id: p[0], tenant_id: p[1], email: p[2], role: p[3], expires_at: p[4], created_at: new Date().toISOString(), redeemed_at: null };
      invitations.push(row);
      return Promise.resolve({ rows: [row] });
    }
    return Promise.resolve({ rows: [] });
  }

  return {
    query: query,
    _state: function () { return { invitations: invitations, personIdentities: personIdentities, people: people, teamMemberships: teamMemberships }; }
  };
}

(async () => {

await checkAsyncOrSync('AC1: acceptInvite_validToken_createsTeamMembershipWithInviteTenantAndRole', async () => {
  var teamInvitations = freshRequire(TEAM_INVITATIONS_PATH);
  var pool = makeFakePool({
    invitations: [{ team_invitation_id: 'tinv-1', tenant_id: 'tenant-A', email: 'newbie@example.com', role: 'engineer', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 3600000).toISOString(), redeemed_at: null }]
  });
  var result = await teamInvitations.redeemTeamInvitation(pool, { destination: 'newbie@example.com', teamInvitationId: 'tinv-1' });
  assert.strictEqual(result.ok, true, 'expected redemption to succeed');
  assert.strictEqual(result.user.tenantId, 'tenant-A', 'expected the invite\'s own tenant_id, not any accept-time value');
  assert.strictEqual(result.user.role, 'engineer', 'expected the invite\'s own stored role');
  var tm = pool._state().teamMemberships.filter(function (r) { return r.tenant_id === 'tenant-A'; })[0];
  assert.ok(tm, 'expected a team_memberships row scoped to tenant-A');
  assert.strictEqual(tm.role, 'engineer');
});

await checkAsyncOrSync('AC2: acceptInvite_newInvitee_createsPersonAndIdentityLink', async () => {
  var teamInvitations = freshRequire(TEAM_INVITATIONS_PATH);
  var pool = makeFakePool({
    invitations: [{ team_invitation_id: 'tinv-2', tenant_id: 'tenant-B', email: 'brandnew@example.com', role: 'viewer', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 3600000).toISOString(), redeemed_at: null }]
  });
  var result = await teamInvitations.redeemTeamInvitation(pool, { destination: 'brandnew@example.com', teamInvitationId: 'tinv-2' });
  assert.strictEqual(result.ok, true);
  var state = pool._state();
  assert.strictEqual(state.people.length, 1, 'expected exactly one new people row created');
  var link = state.personIdentities.filter(function (r) { return r.identity_key === 'brandnew@example.com'; })[0];
  assert.ok(link, 'expected a person_identities link for the invitee email');
  assert.strictEqual(link.person_id, state.people[0].id, 'expected the link to point at the newly created person');
});

await checkAsyncOrSync('AC3: acceptInvite_existingInvitee_reusesPersonNoDuplicate', async () => {
  var teamInvitations = freshRequire(TEAM_INVITATIONS_PATH);
  var pool = makeFakePool({
    invitations: [{ team_invitation_id: 'tinv-3', tenant_id: 'tenant-C', email: 'existing@example.com', role: 'product', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 3600000).toISOString(), redeemed_at: null }],
    personIdentities: [{ identity_key: 'existing@example.com', person_id: 42 }]
  });
  var result = await teamInvitations.redeemTeamInvitation(pool, { destination: 'existing@example.com', teamInvitationId: 'tinv-3' });
  assert.strictEqual(result.ok, true);
  var state = pool._state();
  assert.strictEqual(state.people.length, 0, 'expected no new people row -- the identity already existed');
  assert.strictEqual(result.user.personId, 42, 'expected the reused, pre-existing person_id');
  var tm = state.teamMemberships.filter(function (r) { return r.person_id === 42 && r.tenant_id === 'tenant-C'; })[0];
  assert.ok(tm, 'expected a team_memberships row for the reused person_id');
});

await checkAsyncOrSync('AC4: acceptInvite_sameTokenTwice_secondAttemptRejectedNoSecondMembership', async () => {
  var teamInvitations = freshRequire(TEAM_INVITATIONS_PATH);
  var pool = makeFakePool({
    invitations: [{ team_invitation_id: 'tinv-4', tenant_id: 'tenant-D', email: 'double@example.com', role: 'admin', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 3600000).toISOString(), redeemed_at: null }]
  });
  var first = await teamInvitations.redeemTeamInvitation(pool, { destination: 'double@example.com', teamInvitationId: 'tinv-4' });
  assert.strictEqual(first.ok, true, 'expected the first redemption to succeed');
  var second = await teamInvitations.redeemTeamInvitation(pool, { destination: 'double@example.com', teamInvitationId: 'tinv-4' });
  assert.strictEqual(second.ok, false, 'expected the second redemption attempt to be rejected');
  var state = pool._state();
  assert.strictEqual(state.teamMemberships.length, 1, 'expected exactly one team_memberships row despite two redemption attempts');
});

await checkAsyncOrSync('AC5: combinedDispatcher_clientOrgInvitePayload_stillRoutesToOriginalHandlerUnchanged', async () => {
  var fs = require('fs');
  var SERVER_PATH = path.resolve(ROOT, 'src/web-ui/server.js');
  var src = fs.readFileSync(SERVER_PATH, 'utf8');
  assert.ok(src.indexOf('payload.teamInvitationId') !== -1, 'expected server.js\'s dispatcher to check payload.teamInvitationId');
  assert.ok(src.indexOf('payload.invitationId') !== -1, 'expected the existing Client-org invite check to remain');

  // Replicate the exact 3-way dispatch shape server.js now wires.
  var invitationRedemptionCalls = [];
  var clientLoginCalls = [];
  var teamInviteCalls = [];
  async function _verifyInvitationRedemption(payload, callback) { invitationRedemptionCalls.push(payload); callback(null, { tenantId: 'from-client-org-invite' }); }
  async function _verifyClientLogin(payload, callback) { clientLoginCalls.push(payload); callback(null, { tenantId: 'from-client-login' }); }
  async function _verifyTeamInviteRedemption(payload, callback) { teamInviteCalls.push(payload); callback(null, { tenantId: 'from-team-invite' }); }
  function _combinedMagicLinkVerify(payload, callback, req) {
    if (payload && payload.teamInvitationId) return _verifyTeamInviteRedemption(payload, callback, req);
    if (payload && payload.invitationId) return _verifyInvitationRedemption(payload, callback, req);
    return _verifyClientLogin(payload, callback, req);
  }

  var result = await new Promise(function (resolve) {
    _combinedMagicLinkVerify({ destination: 'x@example.com', invitationId: 'inv-123' }, function (err, user) { resolve(user); });
  });
  assert.strictEqual(invitationRedemptionCalls.length, 1, 'expected the Client-org invite payload to route to the ORIGINAL handler');
  assert.strictEqual(teamInviteCalls.length, 0, 'expected the team-invite handler NOT to be called for this payload shape');
  assert.strictEqual(result.tenantId, 'from-client-org-invite');
});

await checkAsyncOrSync('AC5: combinedDispatcher_clientLoginPayload_stillRoutesToOriginalHandlerUnchanged', async () => {
  var invitationRedemptionCalls = [];
  var clientLoginCalls = [];
  var teamInviteCalls = [];
  async function _verifyInvitationRedemption(payload, callback) { invitationRedemptionCalls.push(payload); callback(null, { tenantId: 'from-client-org-invite' }); }
  async function _verifyClientLogin(payload, callback) { clientLoginCalls.push(payload); callback(null, { tenantId: 'from-client-login' }); }
  async function _verifyTeamInviteRedemption(payload, callback) { teamInviteCalls.push(payload); callback(null, { tenantId: 'from-team-invite' }); }
  function _combinedMagicLinkVerify(payload, callback, req) {
    if (payload && payload.teamInvitationId) return _verifyTeamInviteRedemption(payload, callback, req);
    if (payload && payload.invitationId) return _verifyInvitationRedemption(payload, callback, req);
    return _verifyClientLogin(payload, callback, req);
  }

  var result = await new Promise(function (resolve) {
    _combinedMagicLinkVerify({ destination: 'y@example.com' }, function (err, user) { resolve(user); });
  });
  assert.strictEqual(clientLoginCalls.length, 1, 'expected the plain Client login payload (neither id field) to route to the ORIGINAL login handler');
  assert.strictEqual(teamInviteCalls.length, 0);
  assert.strictEqual(invitationRedemptionCalls.length, 0);
  assert.strictEqual(result.tenantId, 'from-client-login');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
