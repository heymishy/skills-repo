# Implementation Plan: Expired invites (past 24 hours) are rejected cleanly (wsi-s3)

**Story:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s3-invite-expiry.md
**Test plan:** artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s3-invite-expiry-test-plan.md
**DoR:** artefacts/2026-08-14-wuce-self-serve-invites/dor/wsi-s3-dor.md
**Worktree:** `.worktrees/wsi-s3`, branch `feature/wsi-s3`

## File map

- **Modify:** `src/web-ui/modules/team-invitations.js` — extend `markTeamInvitationRedeemed`'s atomic UPDATE to also require `expires_at > NOW()`; extend `redeemTeamInvitation` to distinguish "expired" vs "already used" rejection messages
- **Create:** `tests/check-wsi-s3-invite-expiry.js` — all 4 tests (3 unit AC1–AC3, 1 NFR)

## Design note (read before implementing)

The NFR (`expiryCheck_racesWithRedemption_noWindowWhereExpiredInviteSucceeds`) requires the expiry check and the atomic `redeemed_at IS NULL` check to be evaluated **together**, not as two independently-timed, separately-racy steps. The correct implementation is to add `AND expires_at > NOW()` directly into `markTeamInvitationRedeemed`'s existing atomic SQL `UPDATE ... WHERE ...` clause — the SAME single database operation that already prevents double-redemption now also prevents redeeming an expired invite, with no window where either condition is checked separately from the other.

This means the atomic UPDATE alone cannot tell the caller WHY it failed (already redeemed vs. expired vs. both) — it only returns 0 or 1 rows. To produce AC1's required distinct "this invite has expired" message, `redeemTeamInvitation` does a **read-only, explanatory-only** comparison of the invitation's own immutable `expires_at` field (already fetched before the atomic UPDATE ran) against the current time, AFTER the atomic UPDATE has already failed. This follow-up comparison never re-decides whether redemption succeeded — that decision was already made, atomically, by the UPDATE's own WHERE clause — it only selects which rejection message to return. `expires_at` is immutable once an invite is created, so comparing the already-fetched value against "now" at message-selection time (a moment after the atomic UPDATE ran) is always accurate: if the invite was expired when the UPDATE ran, it is still expired now.

---

## Task 1: Expired invite rejected with a clear message; no membership created (AC1, AC2)

**Files:**
- Modify: `src/web-ui/modules/team-invitations.js`
- Create: `tests/check-wsi-s3-invite-expiry.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/check-wsi-s3-invite-expiry.js`:

```javascript
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

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wsi-s3-invite-expiry.js
```

Expected: AC1 fails (current code returns `reason: 'invitation already used'` for an expired-but-never-redeemed invite, not `'invitation expired'`, since the current `markTeamInvitationRedeemed` doesn't check `expires_at` at all — the mock pool above already rejects expired rows in its `UPDATE` branch, matching the CORRECTED behaviour the real code needs to reach). AC2 passes already (no membership is created either way in the current code, since the mock pool's UPDATE branch already enforces the atomic expiry+redeemed check independently of the source file). `1 passed, 1 failed`.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/modules/team-invitations.js`, update `markTeamInvitationRedeemed`'s SQL from:

```javascript
    'UPDATE team_invitations SET redeemed_at = NOW() ' +
    'WHERE team_invitation_id = $1 AND redeemed_at IS NULL ' +
```

to:

```javascript
    'UPDATE team_invitations SET redeemed_at = NOW() ' +
    'WHERE team_invitation_id = $1 AND redeemed_at IS NULL AND expires_at > NOW() ' +
```

Then update `redeemTeamInvitation`'s rejection branch from:

```javascript
  var redeemed = await markTeamInvitationRedeemed(pool, invitation.team_invitation_id, logger);
  if (!redeemed) {
    return { ok: false, reason: 'invitation already used' };
  }
```

to:

```javascript
  var redeemed = await markTeamInvitationRedeemed(pool, invitation.team_invitation_id, logger);
  if (!redeemed) {
    // Explanatory-only: the atomic UPDATE above already made the real
    // redemption decision (both redeemed_at IS NULL and expires_at > NOW()
    // are checked together, in the same WHERE clause -- wsi-s3's own NFR).
    // This comparison only selects which rejection message to return; it
    // never re-decides whether redemption succeeded. expires_at is
    // immutable, so comparing the already-fetched value against "now" here
    // (a moment after the atomic UPDATE ran) is always accurate.
    var isExpired = new Date(invitation.expires_at).getTime() <= Date.now();
    if (isExpired) {
      return { ok: false, reason: 'invitation expired' };
    }
    return { ok: false, reason: 'invitation already used' };
  }
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wsi-s3-invite-expiry.js
```

Expected: `2 passed, 0 failed`

- [ ] **Step 5: Run sibling regressions**

```bash
node tests/check-wsi-s2-invitee-accepts-and-joins.js
```

Must remain `7 passed, 0 failed` — this task changes shared code (`markTeamInvitationRedeemed`/`redeemTeamInvitation`) that `wsi-s2`'s own tests exercise directly. All of `wsi-s2`'s existing test invites use `expires_at: new Date(Date.now() + 3600000).toISOString()` (1 hour in the future), so the new `expires_at > NOW()` condition should not affect any of them — but this must be CONFIRMED by actually running the file, not assumed.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/team-invitations.js tests/check-wsi-s3-invite-expiry.js
git commit -m "feat(wsi-s3): reject expired invites atomically, with a clear message (AC1, AC2)"
```

---

## Task 2: Unexpired invites are unaffected; expiry and redemption checks are genuinely atomic together (AC3, NFR)

**Files:**
- Modify: `tests/check-wsi-s3-invite-expiry.js`

- [ ] **Step 1: Write the tests**

Add before the final `console.log`:

```javascript
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
```

- [ ] **Step 2: Run test — expected to already pass**

```bash
node tests/check-wsi-s3-invite-expiry.js
```

Expected: `4 passed, 0 failed` — Task 1's implementation already makes both true. If either fails, investigate before forcing a pass — a failure here means the atomic design has a real gap, not something to paper over.

- [ ] **Step 3: Run full sibling regressions**

```bash
node tests/check-wsi-s2-invitee-accepts-and-joins.js
node tests/check-story3-self-service-provisioning.js
node tests/check-story4-dual-path-authentication.js
node tests/check-wsi-s1-admin-creates-invite.js
node tests/check-tir-s3-admin-adds-teammate.js
```

- [ ] **Step 4: Full regression + commit**

```bash
npm test
```

Expected: matches the true baseline (33 pre-existing failures, same file list as `wsi-s1`/`wsi-s2`'s independently-verified baseline; total file count reflects this story's own new test file added to the suite).

```bash
git add tests/check-wsi-s3-invite-expiry.js
git commit -m "test(wsi-s3): lock in AC3 regression + NFR -- expiry and redemption checked atomically together"
```

---

## Final story-level check (before /verify-completion)

After both tasks: `node tests/check-wsi-s3-invite-expiry.js` → `4 passed, 0 failed`. All 5 sibling regression files unchanged. Full `npm test` at the true baseline. This story completes the security bound `decisions.md`'s Q4 /clarify resolution established — after it merges, `wsi-s4` (seat-limit cap) can extend the same `redeemTeamInvitation`/`createOrReuseTeamMemberAndMembership` code path with its own additional check.
