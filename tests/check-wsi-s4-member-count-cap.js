'use strict';
// check-wsi-s4-member-count-cap.js — wsi-s4
//
// Covers AC1-AC2 in this commit (AC3-AC4 + NFR added in Task 2 of this same
// story's plan).

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
var TEAM_INVITATIONS_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'team-invitations'));
var TENANT_PLAN_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'tenant-plan'));

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
  var countQueryCalls = [];

  function query(sql, params) {
    var s = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
    var p = params || [];

    if (s.indexOf('SELECT COUNT(*) AS COUNT FROM TEAM_MEMBERSHIPS') === 0) {
      countQueryCalls.push(p[0]);
      var n = teamMemberships.filter(function (r) { return r.tenant_id === p[0]; }).length;
      return Promise.resolve({ rows: [{ count: String(n) }] });
    }
    if (s.indexOf('SELECT TEAM_INVITATION_ID') === 0) {
      var match = invitations.filter(function (r) { return r.team_invitation_id === p[0]; });
      return Promise.resolve({ rows: match });
    }
    if (s.indexOf('UPDATE TEAM_INVITATIONS SET REDEEMED_AT') === 0) {
      var idx = -1;
      for (var i = 0; i < invitations.length; i++) {
        var row = invitations[i];
        var notRedeemed = !row.redeemed_at;
        var notExpired = new Date(row.expires_at).getTime() > Date.now();
        if (row.team_invitation_id === p[0] && notRedeemed && notExpired) { idx = i; break; }
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
      teamMemberships.push({ person_id: p[0], tenant_id: p[1], role: p[2] });
      return Promise.resolve({ rows: [] });
    }
    return Promise.resolve({ rows: [] });
  }

  return {
    query: query,
    _state: function () { return { invitations: invitations, personIdentities: personIdentities, people: people, teamMemberships: teamMemberships }; },
    _countQueryCalls: function () { return countQueryCalls; }
  };
}

function seedMembers(tenantId, n) {
  var arr = [];
  for (var i = 0; i < n; i++) arr.push({ person_id: 5000 + i, tenant_id: tenantId, role: 'engineer' });
  return arr;
}

(async () => {

await checkAsyncOrSync('AC1: acceptInvite_tenantAtTrialCap_blockedInviteNotConsumed', async () => {
  var tenantPlan = freshRequire(TENANT_PLAN_PATH);
  tenantPlan.setCapReader(function () { return null; }); // irrelevant to this story's own cap, but avoid env-var leakage
  var teamInvitations = freshRequire(TEAM_INVITATIONS_PATH);
  var pool = makeFakePool({
    invitations: [{ team_invitation_id: 'tinv-cap-1', tenant_id: 'tenant-attrialcap', email: 'blocked@example.com', role: 'engineer', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 3600000).toISOString(), redeemed_at: null }],
    teamMemberships: seedMembers('tenant-attrialcap', teamInvitations.TRIAL_MEMBER_CAP)
  });
  var result = await teamInvitations.redeemTeamInvitation(pool, { destination: 'blocked@example.com', teamInvitationId: 'tinv-cap-1' });
  assert.strictEqual(result.ok, false, 'expected the join to be blocked');
  assert.strictEqual(result.reason, 'member limit reached', 'expected a distinct "member limit reached" reason');
  var stillThere = pool._state().invitations.filter(function (r) { return r.team_invitation_id === 'tinv-cap-1'; })[0];
  assert.strictEqual(stillThere.redeemed_at, null, 'expected redeemed_at to remain NULL -- the invite is not consumed by a cap-blocked attempt');
  assert.strictEqual(pool._state().teamMemberships.filter(function (r) { return r.tenant_id === 'tenant-attrialcap'; }).length, teamInvitations.TRIAL_MEMBER_CAP, 'expected no new team_memberships row from a blocked attempt');
});

await checkAsyncOrSync('AC2: acceptInvite_tenantBelowCap_unaffected', async () => {
  var tenantPlan = freshRequire(TENANT_PLAN_PATH);
  tenantPlan.setCapReader(function () { return null; });
  var teamInvitations = freshRequire(TEAM_INVITATIONS_PATH);
  var pool = makeFakePool({
    invitations: [{ team_invitation_id: 'tinv-cap-2', tenant_id: 'tenant-belowcap', email: 'roomtojoin@example.com', role: 'viewer', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 3600000).toISOString(), redeemed_at: null }],
    teamMemberships: seedMembers('tenant-belowcap', 1)
  });
  var result = await teamInvitations.redeemTeamInvitation(pool, { destination: 'roomtojoin@example.com', teamInvitationId: 'tinv-cap-2' });
  assert.strictEqual(result.ok, true, 'expected a tenant well below its cap to be unaffected by this story\'s check');
  assert.strictEqual(result.user.tenantId, 'tenant-belowcap');
});

await checkAsyncOrSync('AC3: capValues_paidTierVsTrialTier_paidIsMateriallyHigher', async () => {
  var teamInvitations = freshRequire(TEAM_INVITATIONS_PATH);
  assert.ok(teamInvitations.PAID_MEMBER_CAP > teamInvitations.TRIAL_MEMBER_CAP, 'expected the paid cap to be strictly greater than the trial cap');
  assert.ok(teamInvitations.PAID_MEMBER_CAP >= teamInvitations.TRIAL_MEMBER_CAP * 2, 'expected the paid cap to be materially higher -- at least double the trial cap, not a trivial increment (review finding wsi-s4 1-L1)');
});

await checkAsyncOrSync('AC4: acceptInvite_countExactlyAtCap_stillBlocked', async () => {
  var tenantPlan = freshRequire(TENANT_PLAN_PATH);
  tenantPlan.setCapReader(function () { return null; });
  var teamInvitations = freshRequire(TEAM_INVITATIONS_PATH);
  var pool = makeFakePool({
    invitations: [{ team_invitation_id: 'tinv-cap-4', tenant_id: 'tenant-exactlyatcap', email: 'exact@example.com', role: 'admin', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 3600000).toISOString(), redeemed_at: null }],
    teamMemberships: seedMembers('tenant-exactlyatcap', teamInvitations.TRIAL_MEMBER_CAP) // exactly at cap, not one over
  });
  var result = await teamInvitations.redeemTeamInvitation(pool, { destination: 'exact@example.com', teamInvitationId: 'tinv-cap-4' });
  assert.strictEqual(result.ok, false, 'expected a tenant with count EXACTLY equal to its cap to still be blocked (inclusive maximum)');
  assert.strictEqual(result.reason, 'member limit reached');
});

await checkAsyncOrSync('NFR-security: capCheck_tenantScoped_countQueryUsesInviteOwnTenantId', async () => {
  var tenantPlan = freshRequire(TENANT_PLAN_PATH);
  tenantPlan.setCapReader(function () { return null; });
  var teamInvitations = freshRequire(TEAM_INVITATIONS_PATH);
  var pool = makeFakePool({
    invitations: [{ team_invitation_id: 'tinv-cap-5', tenant_id: 'tenant-real', email: 'scoped@example.com', role: 'engineer', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 3600000).toISOString(), redeemed_at: null }],
    teamMemberships: seedMembers('tenant-real', 1)
  });
  // Payload carries a spoofed tenantId field -- must be completely ignored;
  // the invite's own server-side-stored tenant_id is the only source used.
  await teamInvitations.redeemTeamInvitation(pool, { destination: 'scoped@example.com', teamInvitationId: 'tinv-cap-5', tenantId: 'tenant-spoofed' });
  var calls = pool._countQueryCalls();
  assert.strictEqual(calls.length, 1, 'expected exactly one member-count query');
  assert.strictEqual(calls[0], 'tenant-real', 'expected the count query to use the invite\'s own stored tenant_id, never a request-supplied field');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
