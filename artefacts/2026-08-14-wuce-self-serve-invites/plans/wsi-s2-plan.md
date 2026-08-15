# Implementation Plan: Invitee accepts the invite and joins the tenant with the assigned role (wsi-s2)

**Story:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s2-invitee-accepts-and-joins.md
**Test plan:** artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s2-invitee-accepts-and-joins-test-plan.md
**DoR:** artefacts/2026-08-14-wuce-self-serve-invites/dor/wsi-s2-dor.md
**Worktree:** `.worktrees/wsi-s2`, branch `feature/wsi-s2`

## File map

- **Modify:** `src/web-ui/modules/team-invitations.js` — add `markTeamInvitationRedeemed`, `createOrReuseTeamMemberAndMembership`, `redeemTeamInvitation`
- **Modify:** `src/web-ui/server.js` — add `_verifyTeamInviteRedemption`; extend `_combinedMagicLinkVerify` to a 3-way dispatch (`teamInvitationId` checked first); add `redeemTeamInvitation` to the existing `team-invitations` destructure import
- **Create:** `tests/check-wsi-s2-invitee-accepts-and-joins.js` — all 7 tests (4 unit AC1–AC4, 2 integration AC5, 1 NFR)

**Reference precedent read in full before writing this plan:** `modules/client-invitations.js` (`redeemInvitation`/`markInvitationRedeemed`/`createClientOrgUserAndAdminMembership` — the exact functions this story's own DoR contract says to mirror), `modules/team-management.js` (`addOrUpdateTeammate`'s `team_memberships` INSERT statement, reused verbatim shape), `server.js` lines 592–709 (`_combinedMagicLinkVerify`'s current 2-way dispatch), `tests/check-story4-dual-path-authentication.js`'s `serverJsWiresMagicLoginToDistinctRealSessions` test (the established pattern for testing a private, closure-scoped dispatcher: replicate the dispatch logic locally in the test + a source-scan on the real file).

---

## Task 1: Redeem a valid team invite — membership created with correct tenant/role, new invitee gets a new person (AC1, AC2)

**Files:**
- Modify: `src/web-ui/modules/team-invitations.js`
- Create: `tests/check-wsi-s2-invitee-accepts-and-joins.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/check-wsi-s2-invitee-accepts-and-joins.js`:

```javascript
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

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wsi-s2-invitee-accepts-and-joins.js
```

Expected: both tests fail — `teamInvitations.redeemTeamInvitation is not a function`.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/modules/team-invitations.js`, add these three functions before `module.exports`:

```javascript
/**
 * AC4: atomically mark a team invite redeemed -- returns null if it was
 * already redeemed (or never existed), so a second redemption attempt for
 * the same already-used token is always rejected, even under concurrency.
 * Mirrors client-invitations.js's markInvitationRedeemed exactly.
 * @param {object} pool
 * @param {string} teamInvitationId
 * @param {{info: Function}} [logger]
 * @returns {Promise<object|null>}
 */
async function markTeamInvitationRedeemed(pool, teamInvitationId, logger) {
  var log = logger || _defaultLogger;
  var result = await pool.query(
    'UPDATE team_invitations SET redeemed_at = NOW() ' +
    'WHERE team_invitation_id = $1 AND redeemed_at IS NULL ' +
    'RETURNING team_invitation_id, tenant_id, email, role, created_at, expires_at, redeemed_at',
    [teamInvitationId]
  );
  var row = result.rows.length ? result.rows[0] : null;
  if (row) {
    log.info(JSON.stringify({
      event: 'team_invite_redeemed',
      team_invitation_id: row.team_invitation_id,
      tenant_id: row.tenant_id,
      timestamp: new Date().toISOString()
    }));
  }
  return row;
}

/**
 * AC1/AC2/AC3: resolve-or-create the invitee's person + team_memberships row,
 * scoped to the invite's own tenant_id and role (never accept-time request
 * input -- ADR-025). Mirrors client-invitations.js's
 * createClientOrgUserAndAdminMembership's resolve-or-create person logic
 * exactly, but parameterises role instead of hardcoding 'admin' (this
 * story's own Architecture Constraint).
 * @param {object} pool
 * @param {string} tenantId
 * @param {string} email
 * @param {string} role
 * @param {{info: Function}} [logger]
 * @returns {Promise<{personId: number, tenantId: string, email: string, role: string}>}
 */
async function createOrReuseTeamMemberAndMembership(pool, tenantId, email, role, logger) {
  var log = logger || _defaultLogger;

  var existingLink = await pool.query('SELECT person_id FROM person_identities WHERE identity_key = $1', [email]);
  var personId;
  if (existingLink.rows.length) {
    personId = existingLink.rows[0].person_id;
  } else {
    var personResult = await pool.query('INSERT INTO people DEFAULT VALUES RETURNING id');
    personId = personResult.rows[0].id;
    await pool.query(
      'INSERT INTO person_identities (identity_key, person_id, provider) VALUES ($1, $2, $3) ON CONFLICT (identity_key) DO NOTHING',
      [email, personId, 'magic-link']
    );
  }

  await pool.query(
    'INSERT INTO team_memberships (person_id, tenant_id, role) VALUES ($1, $2, $3) ' +
    'ON CONFLICT (person_id, tenant_id) DO UPDATE SET role = EXCLUDED.role',
    [personId, tenantId, role]
  );

  log.info(JSON.stringify({
    event: 'team_invite_member_joined',
    tenant_id: tenantId,
    person_id: personId,
    role: role,
    timestamp: new Date().toISOString()
  }));

  return { personId: personId, tenantId: tenantId, email: email, role: role };
}

/**
 * AC1-AC4: resolve a redeemed team-invite payload (the JWT payload carrying
 * `destination` [the invitee's email] and `teamInvitationId`) into either a
 * successfully created/updated team_memberships row, or a rejection reason
 * (invite not found, email mismatch, or already redeemed -- AC4 edge case).
 * Mirrors client-invitations.js's redeemInvitation exactly.
 * @param {object} pool
 * @param {{destination:string, teamInvitationId:string}} payload
 * @param {{info:Function}} [logger]
 * @returns {Promise<{ok:true, user:object}|{ok:false, reason:string}>}
 */
async function redeemTeamInvitation(pool, payload, logger) {
  var teamInvitationId = payload && payload.teamInvitationId;
  var invitation = await getInvitationById(pool, teamInvitationId);
  if (!invitation || invitation.email !== (payload && payload.destination)) {
    return { ok: false, reason: 'invitation not found' };
  }
  var redeemed = await markTeamInvitationRedeemed(pool, invitation.team_invitation_id, logger);
  if (!redeemed) {
    return { ok: false, reason: 'invitation already used' };
  }
  var user = await createOrReuseTeamMemberAndMembership(pool, invitation.tenant_id, invitation.email, invitation.role, logger);
  return { ok: true, user: user };
}
```

Update `module.exports` at the bottom of the file to:

```javascript
module.exports = { migrateTeamInvitationsSchema, createInvitation, getInvitationById, markTeamInvitationRedeemed, createOrReuseTeamMemberAndMembership, redeemTeamInvitation };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wsi-s2-invitee-accepts-and-joins.js
```

Expected: `2 passed, 0 failed`

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/modules/team-invitations.js tests/check-wsi-s2-invitee-accepts-and-joins.js
git commit -m "feat(wsi-s2): redeem a team invite into a tenant-scoped, role-correct membership (AC1, AC2)"
```

---

## Task 2: Existing invitee reuses their person, no duplicate (AC3)

**Files:**
- Modify: `tests/check-wsi-s2-invitee-accepts-and-joins.js`

- [ ] **Step 1: Write the failing test**

Add before the final `console.log`:

```javascript
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
```

- [ ] **Step 2: Run test — expected to already pass**

```bash
node tests/check-wsi-s2-invitee-accepts-and-joins.js
```

Expected: `3 passed, 0 failed` — Task 1's `createOrReuseTeamMemberAndMembership` already branches on an existing `person_identities` link; this test locks that branch in. If it fails, the reuse branch has a real bug — fix it, don't force the test to match broken behaviour.

- [ ] **Step 3: Commit**

```bash
git add tests/check-wsi-s2-invitee-accepts-and-joins.js
git commit -m "test(wsi-s2): lock in AC3 -- existing invitee's person is reused, never duplicated"
```

---

## Task 3: Double redemption of the same token is rejected atomically (AC4)

**Files:**
- Modify: `tests/check-wsi-s2-invitee-accepts-and-joins.js`

- [ ] **Step 1: Write the failing test**

Add before the final `console.log`:

```javascript
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
```

- [ ] **Step 2: Run test — expected to already pass**

```bash
node tests/check-wsi-s2-invitee-accepts-and-joins.js
```

Expected: `4 passed, 0 failed` — `markTeamInvitationRedeemed`'s `UPDATE ... WHERE redeemed_at IS NULL` is atomic by construction from Task 1. If this fails, the atomicity guarantee is broken — investigate before forcing a pass.

- [ ] **Step 3: Commit**

```bash
git add tests/check-wsi-s2-invitee-accepts-and-joins.js
git commit -m "test(wsi-s2): lock in AC4 -- double redemption of the same token is rejected atomically"
```

---

## Task 4: Extend the shared dispatcher to a third case, without disturbing the existing two (AC5)

**Files:**
- Modify: `src/web-ui/server.js`
- Modify: `tests/check-wsi-s2-invitee-accepts-and-joins.js`

- [ ] **Step 1: Write the failing tests**

Add before the final `console.log`. These replicate the real dispatch logic locally (matching `tests/check-story4-dual-path-authentication.js`'s own established pattern for testing this private, closure-scoped dispatcher) and separately source-scan the real file:

```javascript
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
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wsi-s2-invitee-accepts-and-joins.js
```

Expected: both new tests fail on the first `assert.ok` (`payload.teamInvitationId` not yet present in `server.js`).

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/server.js`, update the existing team-invitations destructure import (near the top of the file, alongside the other `wsi-s1` import):

```javascript
const { migrateTeamInvitationsSchema, redeemTeamInvitation } = require('./modules/team-invitations'); // wsi-s1, wsi-s2
```

Then, inside the `migrateClientInvitationsSchema(...).then(function() { ... })` callback (the same block that already defines `_verifyInvitationRedemption` and `_verifyClientLogin`), add a new function immediately after `_verifyClientLogin`'s own definition:

```javascript
      // wsi-s2: the registered verify() callback delegates to
      // modules/team-invitations.js's redeemTeamInvitation() -- resolves the
      // teamInvitationId carried inside the redeemed JWT payload, atomically
      // marks the invite redeemed, and creates/updates the invitee's
      // team_memberships row with the invite's own stored tenant_id and role
      // (never accept-time request input -- ADR-025).
      async function _verifyTeamInviteRedemption(payload, callback) {
        try {
          var result = await redeemTeamInvitation(_userRolesPool, payload);
          if (!result.ok) {
            callback(null, false, { message: result.reason });
            return;
          }
          callback(null, result.user);
        } catch (err) {
          callback(err);
        }
      }
```

Then update `_combinedMagicLinkVerify`'s existing body from:

```javascript
      function _combinedMagicLinkVerify(payload, callback, req) {
        if (payload && payload.invitationId) {
          return _verifyInvitationRedemption(payload, callback, req);
        }
        return _verifyClientLogin(payload, callback, req);
      }
```

to:

```javascript
      function _combinedMagicLinkVerify(payload, callback, req) {
        if (payload && payload.teamInvitationId) {
          return _verifyTeamInviteRedemption(payload, callback, req);
        }
        if (payload && payload.invitationId) {
          return _verifyInvitationRedemption(payload, callback, req);
        }
        return _verifyClientLogin(payload, callback, req);
      }
```

**Do not modify `_verifyInvitationRedemption` or `_verifyClientLogin`'s own bodies at all** — both must remain byte-for-byte unchanged (AC5's own regression requirement).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wsi-s2-invitee-accepts-and-joins.js
```

Expected: `6 passed, 0 failed`

- [ ] **Step 5: Run sibling regressions**

```bash
node tests/check-story3-self-service-provisioning.js
node tests/check-story4-dual-path-authentication.js
node tests/check-wsi-s1-admin-creates-invite.js
```

All three must be unaffected — `check-story4-dual-path-authentication.js`'s own `serverJsWiresMagicLoginToDistinctRealSessions` test asserts `_combinedMagicLinkVerify` exists and both Story 3/4 branches behave correctly; confirm it still passes after this change (it should, since this task only adds a new FIRST branch, never touching the existing two).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js tests/check-wsi-s2-invitee-accepts-and-joins.js
git commit -m "feat(wsi-s2): extend the shared magic-link dispatcher to a third case -- team invite redemption (AC5)"
```

---

## Task 5: Audit log never contains the raw invite token (NFR-audit)

**Files:**
- Modify: `tests/check-wsi-s2-invitee-accepts-and-joins.js`

**Note (lesson applied from wsi-s1's own DoD, 2026-08-16):** wsi-s1's implementation plan omitted the equivalent NFR test entirely, discovered only post-merge at `/definition-of-done`. This task exists specifically so that gap doesn't repeat here — do not skip it, even though the underlying behaviour will very likely already be correct from Task 1's implementation.

- [ ] **Step 1: Write the failing test**

Add before the final `console.log`. Uses the real `magic-link-strategy.js` round-trip (issue a real signed link, then redeem it), mirroring `tests/check-story3-self-service-provisioning.js`'s own `invitationTokenNeverLoggedInPlaintext` pattern and `tests/check-wsi-s1-admin-creates-invite.js`'s own `setUpTeamManagementWithMagicLink`-style setup:

```javascript
await checkAsyncOrSync('NFR-audit: auditLog_redemption_neverLogsRawToken', async () => {
  var strategy = freshRequire(MAGIC_LINK_STRATEGY_PATH);
  var teamInvitations = freshRequire(TEAM_INVITATIONS_PATH);
  strategy._resetForTesting();

  var pool = makeFakePool({
    invitations: [{ team_invitation_id: 'tinv-audit', tenant_id: 'tenant-audit', email: 'audit@example.com', role: 'engineer', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 3600000).toISOString(), redeemed_at: null }]
  });
  var loggerCalls = [];
  var capturedHref = null;

  strategy.registerMagicLinkStrategy({
    secret: 'wsi-s2-audit-test-secret',
    callbackUrl: '/invite/redeem',
    sendMagicLink: async function (destination, href) { capturedHref = href; },
    verify: async function (payload, callback) {
      var result = await teamInvitations.redeemTeamInvitation(pool, payload, { info: function (m) { loggerCalls.push(String(m)); } });
      if (!result.ok) { callback(null, false); return; }
      callback(null, result.user);
    }
  });

  await strategy.issueMagicLink('audit@example.com', { teamInvitationId: 'tinv-audit' });
  assert.ok(capturedHref, 'expected a magic link to have been issued');
  var tokenMatch = /token=([^&]+)/.exec(capturedHref);
  assert.ok(tokenMatch, 'expected the issued link to contain a token= query param');
  var rawToken = decodeURIComponent(tokenMatch[1]);

  var verifyResult = await strategy.verifyMagicLinkToken(rawToken);
  assert.strictEqual(verifyResult.ok, true, 'expected redemption to succeed');
  assert.ok(loggerCalls.length > 0, 'expected at least one audit log entry to have been captured');
  loggerCalls.forEach(function (entry) {
    assert.ok(entry.indexOf(rawToken) === -1, 'expected the audit log to never contain the raw invite token, found in: ' + entry);
    assert.ok(entry.indexOf(capturedHref) === -1, 'expected the audit log to never contain the full signed link, found in: ' + entry);
  });
});
```

- [ ] **Step 2: Run test — expected to already pass**

```bash
node tests/check-wsi-s2-invitee-accepts-and-joins.js
```

Expected: `7 passed, 0 failed` — Task 1's `markTeamInvitationRedeemed`/`createOrReuseTeamMemberAndMembership` only ever log `team_invitation_id`/`tenant_id`/`person_id`/`role`/timestamp, never a token or link field. If this fails, a real audit-logging bug exists — fix it, don't force the test to match broken behaviour.

- [ ] **Step 3: Run full sibling regressions once more**

```bash
node tests/check-story3-self-service-provisioning.js
node tests/check-story4-dual-path-authentication.js
node tests/check-wsi-s1-admin-creates-invite.js
node tests/check-tir-s3-admin-adds-teammate.js
```

- [ ] **Step 4: Full regression + commit**

```bash
npm test
```

Expected: `517 file(s) run, 33 failed` — matches the true baseline confirmed at this story's own branch-setup (identical file list to `wsi-s1`'s independently-verified baseline).

```bash
git add tests/check-wsi-s2-invitee-accepts-and-joins.js
git commit -m "test(wsi-s2): lock in NFR-audit -- redemption never logs the raw invite token"
```

---

## Final story-level check (before /verify-completion)

After all 5 tasks: `node tests/check-wsi-s2-invitee-accepts-and-joins.js` → `7 passed, 0 failed`. Sibling regressions unchanged: `check-story3-self-service-provisioning.js`, `check-story4-dual-path-authentication.js`, `check-wsi-s1-admin-creates-invite.js`, `check-tir-s3-admin-adds-teammate.js`. Full `npm test` at the true baseline (517 files, 33 pre-existing failures, same list as `wsi-s1`'s independently-verified baseline). This story completes the round-trip `wsi-s1` started — after it merges, `wsi-s3` (expiry) and `wsi-s4` (seat-limit cap) can both extend this story's own `redeemTeamInvitation`/`createOrReuseTeamMemberAndMembership` functions with their own additional checks.
