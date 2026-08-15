'use strict';
// check-wsi-s3-invite-expiry.js — wsi-s3
//
// Covers AC1-AC2 in this commit (AC3 + NFR added in Task 2 of this same
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

    if (s.indexOf('SELECT COUNT(*) AS COUNT FROM TEAM_MEMBERSHIPS') === 0) {
      // wsi-s4: this story's own redeemTeamInvitation now always checks the
      // member-count cap for a still-valid invite -- this pool never seeds
      // team_memberships, so the count is always 0, well under either cap.
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
    _state: function () { return { invitations: invitations, personIdentities: personIdentities, people: people, teamMemberships: teamMemberships }; }
  };
}

(async () => {

await checkAsyncOrSync('AC1: acceptInvite_expiredUnredeemed_rejectedWithClearExpiredMessage', async () => {
  var teamInvitations = freshRequire(TEAM_INVITATIONS_PATH);
  var pool = makeFakePool({
    invitations: [{ team_invitation_id: 'tinv-expired-1', tenant_id: 'tenant-A', email: 'late@example.com', role: 'engineer', created_at: new Date(Date.now() - 25 * 3600 * 1000).toISOString(), expires_at: new Date(Date.now() - 3600 * 1000).toISOString(), redeemed_at: null }]
  });
  var result = await teamInvitations.redeemTeamInvitation(pool, { destination: 'late@example.com', teamInvitationId: 'tinv-expired-1' });
  assert.strictEqual(result.ok, false, 'expected redemption to be rejected');
  assert.strictEqual(result.reason, 'invitation expired', 'expected a distinct "invitation expired" reason, not a generic error');
});

await checkAsyncOrSync('AC2: acceptInvite_expired_noMembershipCreatedRedeemedAtStaysNull', async () => {
  var teamInvitations = freshRequire(TEAM_INVITATIONS_PATH);
  var pool = makeFakePool({
    invitations: [{ team_invitation_id: 'tinv-expired-2', tenant_id: 'tenant-B', email: 'late2@example.com', role: 'viewer', created_at: new Date(Date.now() - 25 * 3600 * 1000).toISOString(), expires_at: new Date(Date.now() - 3600 * 1000).toISOString(), redeemed_at: null }]
  });
  await teamInvitations.redeemTeamInvitation(pool, { destination: 'late2@example.com', teamInvitationId: 'tinv-expired-2' });
  var state = pool._state();
  assert.strictEqual(state.teamMemberships.length, 0, 'expected no team_memberships row from an expired attempt');
  var stillThere = state.invitations.filter(function (r) { return r.team_invitation_id === 'tinv-expired-2'; })[0];
  assert.strictEqual(stillThere.redeemed_at, null, 'expected redeemed_at to remain NULL -- an expired attempt must never be treated as a successful redemption');
});

await checkAsyncOrSync('AC3: acceptInvite_withinWindow_unaffectedByExpiryCheck', async () => {
  var teamInvitations = freshRequire(TEAM_INVITATIONS_PATH);
  var pool = makeFakePool({
    invitations: [{ team_invitation_id: 'tinv-valid', tenant_id: 'tenant-C', email: 'ontime@example.com', role: 'admin', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 12 * 3600 * 1000).toISOString(), redeemed_at: null }]
  });
  var result = await teamInvitations.redeemTeamInvitation(pool, { destination: 'ontime@example.com', teamInvitationId: 'tinv-valid' });
  assert.strictEqual(result.ok, true, 'expected a still-valid invite (12h remaining) to redeem successfully, unaffected by the new expiry check');
  assert.strictEqual(result.user.tenantId, 'tenant-C');
});

await checkAsyncOrSync('NFR-security: expiryCheck_racesWithRedemption_noWindowWhereExpiredInviteSucceeds', async () => {
  var fs = require('fs');
  var SOURCE_PATH = path.resolve(ROOT, 'src/web-ui/modules/team-invitations.js');
  var src = fs.readFileSync(SOURCE_PATH, 'utf8');

  // Structural assertion: the expiry condition lives in the SAME SQL WHERE
  // clause as the atomic redeemed_at IS NULL check -- not a separate,
  // independently-timed `if` statement gating the redemption path. This is
  // the property that makes "no window where an expired invite succeeds"
  // true regardless of timing, rather than merely true "most of the time".
  var updateStatementMatch = /UPDATE team_invitations SET redeemed_at = NOW\(\)[^`]*?RETURNING/.exec(src);
  assert.ok(updateStatementMatch, 'expected to find the markTeamInvitationRedeemed UPDATE statement');
  var whereClause = updateStatementMatch[0];
  assert.ok(/redeemed_at IS NULL/.test(whereClause), 'expected the atomic UPDATE to still check redeemed_at IS NULL');
  assert.ok(/expires_at > NOW\(\)/.test(whereClause), 'expected the SAME atomic UPDATE to also check expires_at > NOW() -- not a separate step');

  // Behavioural boundary check: an invite whose expiry is exactly "now" (already passed by the time the query runs) must never redeem.
  var teamInvitations = freshRequire(TEAM_INVITATIONS_PATH);
  var pool = makeFakePool({
    invitations: [{ team_invitation_id: 'tinv-boundary', tenant_id: 'tenant-D', email: 'boundary@example.com', role: 'viewer', created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), expires_at: new Date(Date.now() - 1).toISOString(), redeemed_at: null }]
  });
  var result = await teamInvitations.redeemTeamInvitation(pool, { destination: 'boundary@example.com', teamInvitationId: 'tinv-boundary' });
  assert.strictEqual(result.ok, false, 'expected an invite whose expiry has just passed to be rejected, not to sneak through a timing window');
  assert.strictEqual(result.reason, 'invitation expired');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
