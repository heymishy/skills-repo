# Implementation Plan: Invite acceptance is blocked if the tenant is at its member-count cap (wsi-s4)

**Story:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s4-member-count-cap.md
**Test plan:** artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s4-member-count-cap-test-plan.md
**DoR:** artefacts/2026-08-14-wuce-self-serve-invites/dor/wsi-s4-dor.md
**Worktree:** `.worktrees/wsi-s4`, branch `feature/wsi-s4`

## File map

- **Modify:** `src/web-ui/modules/team-invitations.js` — add `TRIAL_MEMBER_CAP`/`PAID_MEMBER_CAP` constants, `checkMemberCountCap`; wire into `redeemTeamInvitation`
- **Create:** `tests/check-wsi-s4-member-count-cap.js` — all 5 tests (4 unit AC1–AC4, 1 NFR)

**Reference read in full before writing this plan:** `modules/tenant-plan.js`'s real `getPlanState(tenantId)` (returns `{plan, status}`, defaults to `{plan: 'trial', status: 'active'}`) and its existing `checkJourneyCap`/`getJourneyCap` (a DIFFERENT resource — journeys, not team members — with a Stripe/env-var/per-tenant-file-driven cap mechanism). This story's own Architecture Constraint is explicit that member caps are simple hardcoded per-tier constants, not that mechanism — `checkMemberCountCap` below is a new, purpose-built function, not a reuse of `checkJourneyCap`.

## Design note (read before implementing)

Unlike `wsi-s3`'s expiry check (embedded directly in the atomic SQL `UPDATE`'s `WHERE` clause, since expiry needed to be race-proof against concurrent redemption), the cap check here is a **separate, earlier read** in `redeemTeamInvitation`, run only when the already-fetched invitation still *looks* redeemable (not yet marked `redeemed_at`, not yet past its own `expires_at` per the row already fetched). This ordering exists so that an invite which is ALSO already-expired or already-used reports THAT reason, not a cap-related one — AC1's own wording ("a valid, unexpired invite") implies the cap check applies to an otherwise-valid invite, not as a blanket first check.

This does not weaken the story's own tenant-scoping NFR: the count query always uses `invitation.tenant_id`, the invite's own server-side-stored value from `getInvitationById`, never anything from the accept-time request. It also does not reintroduce a race: the atomic `UPDATE ... WHERE redeemed_at IS NULL AND expires_at > NOW()` from `wsi-s3` remains the final arbiter of whether redemption actually succeeds — the cap check only decides whether to *attempt* it. If blocked by cap, `markTeamInvitationRedeemed` is never called at all, so `redeemed_at` is never touched (AC1/AC2's own requirement).

---

## Task 1: Tenant at cap is blocked with a clear message; invite is not consumed (AC1, AC2)

**Files:**
- Modify: `src/web-ui/modules/team-invitations.js`
- Create: `tests/check-wsi-s4-member-count-cap.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/check-wsi-s4-member-count-cap.js`:

```javascript
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

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wsi-s4-member-count-cap.js
```

Expected: both tests fail — `teamInvitations.TRIAL_MEMBER_CAP is not defined` / `redeemTeamInvitation` doesn't yet perform any cap check, so AC1's tenant-at-cap scenario succeeds instead of being blocked.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/modules/team-invitations.js`, add near the top (after the existing `_defaultLogger`/`_genId` declarations):

```javascript
var tenantPlan = require('./tenant-plan');

// wsi-s4: simple, hardcoded per-tier member-count caps -- NOT read from
// Stripe, NOT per-tenant configurable (both explicitly out of scope). A
// deliberately separate mechanism from tenant-plan.js's own checkJourneyCap
// (a different resource -- journeys -- with a Stripe/env-var-driven cap).
var TRIAL_MEMBER_CAP = 3;
var PAID_MEMBER_CAP = 25;
```

Add this function before `redeemTeamInvitation`:

```javascript
/**
 * AC1/AC3/AC4: resolve the member-count cap for a tenant's plan tier and
 * check whether it currently has room for one more member. A live COUNT(*)
 * against team_memberships -- not a cached/denormalized counter, avoiding a
 * second source of truth that could drift (this story's own Architecture
 * Constraint).
 * @param {object} pool
 * @param {string} tenantId
 * @returns {Promise<{allowed: boolean, cap: number, count: number}>}
 */
async function checkMemberCountCap(pool, tenantId) {
  var planState = await tenantPlan.getPlanState(tenantId);
  var cap = planState.plan === 'paid' ? PAID_MEMBER_CAP : TRIAL_MEMBER_CAP;
  var result = await pool.query('SELECT COUNT(*) AS count FROM team_memberships WHERE tenant_id = $1', [tenantId]);
  var count = parseInt(result.rows[0].count, 10);
  return { allowed: count < cap, cap: cap, count: count };
}
```

In `redeemTeamInvitation`, insert this block immediately after the existing `invitation not found` check and before the `var redeemed = await markTeamInvitationRedeemed(...)` line:

```javascript
  // AC1/AC2/AC4: only check the member-count cap for an invite that still
  // looks redeemable based on its own already-fetched state -- an invite
  // that is already redeemed or already expired should report THAT reason,
  // not a cap-related one. The atomic UPDATE below remains the final
  // arbiter of whether redemption actually succeeds; this check only
  // decides whether to attempt it, so a cap-blocked invite's redeemed_at
  // is never touched (AC1).
  var looksRedeemable = !invitation.redeemed_at && new Date(invitation.expires_at).getTime() > Date.now();
  if (looksRedeemable) {
    var capCheck = await checkMemberCountCap(pool, invitation.tenant_id);
    if (!capCheck.allowed) {
      log.info(JSON.stringify({
        event: 'team_invite_blocked_by_cap',
        tenant_id: invitation.tenant_id,
        cap: capCheck.cap,
        count: capCheck.count,
        timestamp: new Date().toISOString()
      }));
      return { ok: false, reason: 'member limit reached' };
    }
  }
```

**Note:** `redeemTeamInvitation` does not currently declare a local `log` variable (it passes `logger` straight through to `markTeamInvitationRedeemed`) — add `var log = logger || _defaultLogger;` as the first line of the function body if it is not already present, so the new block above can call `log.info(...)`.

Finally, update `module.exports` to include the two new exports:

```javascript
module.exports = { migrateTeamInvitationsSchema, createInvitation, getInvitationById, markTeamInvitationRedeemed, createOrReuseTeamMemberAndMembership, redeemTeamInvitation, checkMemberCountCap, TRIAL_MEMBER_CAP, PAID_MEMBER_CAP };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wsi-s4-member-count-cap.js
```

Expected: `2 passed, 0 failed`

- [ ] **Step 5: Run sibling regressions**

```bash
node tests/check-wsi-s3-invite-expiry.js
node tests/check-wsi-s2-invitee-accepts-and-joins.js
```

Both must remain fully green — this task changes shared code (`redeemTeamInvitation`) that both stories' own tests exercise directly. `wsi-s3`'s tests use tenants with no seeded `team_memberships` at all (so `count` is always `0`, well under either cap) — confirm this holds by actually running the file, not assuming it.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/team-invitations.js tests/check-wsi-s4-member-count-cap.js
git commit -m "feat(wsi-s4): block invite acceptance at the tenant's member-count cap (AC1, AC2)"
```

---

## Task 2: Paid tier cap is materially higher; exact-cap boundary blocks; cap check is tenant-scoped (AC3, AC4, NFR)

**Files:**
- Modify: `tests/check-wsi-s4-member-count-cap.js`

- [ ] **Step 1: Write the tests**

Add before the final `console.log`:

```javascript
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
```

- [ ] **Step 2: Run test — expected to already pass**

```bash
node tests/check-wsi-s4-member-count-cap.js
```

Expected: `5 passed, 0 failed` — Task 1's implementation already makes all three true (exported constants, inclusive `count < cap` boundary semantics, and `checkMemberCountCap` always receiving `invitation.tenant_id`, never anything from `payload`). If any fails, investigate before forcing a pass.

- [ ] **Step 3: Run full sibling regressions**

```bash
node tests/check-wsi-s3-invite-expiry.js
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

Expected: matches the true baseline (33 pre-existing failures, same file list independently verified by `wsi-s1`/`wsi-s2`/`wsi-s3`; total file count reflects this story's own new test file).

```bash
git add tests/check-wsi-s4-member-count-cap.js
git commit -m "test(wsi-s4): lock in AC3/AC4/NFR -- paid cap materially higher, inclusive boundary, tenant-scoped"
```

---

## Final story-level check (before /verify-completion)

After both tasks: `node tests/check-wsi-s4-member-count-cap.js` → `5 passed, 0 failed`. All 6 sibling regression files unchanged. Full `npm test` at the true baseline. This story completes the epic's own guardrail on unbounded free growth — after it merges, only `wsi-s5` (metrics instrumentation) and `wsi-s6` (invite-creation UI, still needs `/review → /test-plan → /definition-of-ready`) remain in Epic 1.
