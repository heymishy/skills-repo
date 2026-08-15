# Implementation Plan: PostHog instrumentation for both benefit metrics (wsi-s5)

**Story:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s5-metrics-instrumentation.md
**Test plan:** artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s5-metrics-instrumentation-test-plan.md
**DoR:** artefacts/2026-08-14-wuce-self-serve-invites/dor/wsi-s5-dor.md
**Worktree:** `.worktrees/wsi-s5`, branch `feature/wsi-s5`

## File map

- **Modify:** `src/web-ui/routes/team-management.js` — capture `team_invite_created` in `handleCreateInvite`
- **Modify:** `src/web-ui/modules/team-invitations.js` — capture `team_invite_accepted` (with elapsed time) in `redeemTeamInvitation`
- **Modify:** `src/web-ui/modules/team-management.js` — capture `teammate_added_by_admin` in `addOrUpdateTeammate`
- **Create:** `tests/check-wsi-s5-metrics-instrumentation.js` — all 5 tests (3 unit AC1–AC3, 1 integration AC4, 1 NFR)

## Design note (read before implementing)

`posthog-server.js`'s `capture()` no-ops entirely when `POSTHOG_KEY` is unset (no injectable `setX()` adapter — this is NOT a D37 case, matching this story's own DoR "H-ADAPTER: not triggered"). The established test-mocking pattern in this codebase (see `tests/check-bsc-s1-billing-success-confirmation.js`) monkey-patches the shared module singleton directly: `var posthogModule = require(posthogPath); var originalCapture = posthogModule.capture; posthogModule.capture = function(id, event, props) { calls.push({...}); }; /* ...exercise the flow... */ posthogModule.capture = originalCapture;`. Because Node's `require()` cache is keyed by resolved absolute path, this single patch intercepts calls from all three consuming files (`routes/team-management.js`, `modules/team-invitations.js`, `modules/team-management.js`) regardless of each file's own relative `require` path — no `freshRequire` needed for `posthog-server.js` itself. Always restore `posthogModule.capture = originalCapture` in a `finally` block so a failed assertion doesn't leak a patched capture function into later tests in the same process.

Distinct ID convention: all three events use the relevant `tenant_id` as the PostHog `distinctId` (these are tenant-level growth metrics, not individual-actor analytics) — consistent across all three call sites.

---

## Task 1: Invite creation captures `team_invite_created` (AC1)

**Files:**
- Modify: `src/web-ui/routes/team-management.js`
- Create: `tests/check-wsi-s5-metrics-instrumentation.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-wsi-s5-metrics-instrumentation.js`:

```javascript
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

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wsi-s5-metrics-instrumentation.js
```

Expected: `0 passed, 1 failed` — no `team_invite_created` event exists yet.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/team-management.js`, add near the top (alongside the other requires):

```javascript
var _posthog = require('../modules/posthog-server');
```

In `handleCreateInvite`, immediately after `var invite = await teamInvitations.createInvitation(pool, tenantId, email, role, adminId, _logger);`, add:

```javascript

      // wsi-s5 AC1: real, observable event for the "share of self-serve
      // invites" benefit metric -- fire-and-forget, never blocks the
      // response (matches this codebase's existing _posthog.capture
      // convention elsewhere). Never includes the invitee's raw email.
      _posthog.capture(tenantId, 'team_invite_created', {
        tenant_id: tenantId,
        role: role,
        team_invitation_id: invite.team_invitation_id
      });
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wsi-s5-metrics-instrumentation.js
```

Expected: `1 passed, 0 failed`

- [ ] **Step 5: Run sibling regressions**

```bash
node tests/check-wsi-s1-admin-creates-invite.js
node tests/check-wsi-s4-member-count-cap.js
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/team-management.js tests/check-wsi-s5-metrics-instrumentation.js
git commit -m "feat(wsi-s5): capture team_invite_created PostHog event (AC1)"
```

---

## Task 2: Invite acceptance captures `team_invite_accepted` with elapsed time (AC2)

**Files:**
- Modify: `src/web-ui/modules/team-invitations.js`
- Modify: `tests/check-wsi-s5-metrics-instrumentation.js`

- [ ] **Step 1: Write the failing test**

Add before the final `console.log`:

```javascript
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
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wsi-s5-metrics-instrumentation.js
```

Expected: `1 passed, 1 failed` — no `team_invite_accepted` event exists yet.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/modules/team-invitations.js`, add near the top (alongside `var tenantPlan = require('./tenant-plan');`):

```javascript
var _posthog = require('./posthog-server');
```

In `redeemTeamInvitation`, immediately after `var user = await createOrReuseTeamMemberAndMembership(pool, invitation.tenant_id, invitation.email, invitation.role, logger);` and before `return { ok: true, user: user };`, add:

```javascript

  // wsi-s5 AC2: real, observable event for both benefit metrics -- the
  // elapsedMs property is the direct input to "time from invite creation
  // to invitee access". Computed from the invite's own already-fetched,
  // immutable created_at, not a separate timestamp read. Never includes
  // the invitee's raw email.
  _posthog.capture(invitation.tenant_id, 'team_invite_accepted', {
    tenant_id: invitation.tenant_id,
    role: invitation.role,
    team_invitation_id: invitation.team_invitation_id,
    elapsedMs: Date.now() - new Date(invitation.created_at).getTime()
  });
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wsi-s5-metrics-instrumentation.js
```

Expected: `2 passed, 0 failed`

- [ ] **Step 5: Run sibling regressions**

```bash
node tests/check-wsi-s2-invitee-accepts-and-joins.js
node tests/check-wsi-s3-invite-expiry.js
node tests/check-wsi-s4-member-count-cap.js
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/team-invitations.js tests/check-wsi-s5-metrics-instrumentation.js
git commit -m "feat(wsi-s5): capture team_invite_accepted PostHog event with elapsed time (AC2)"
```

---

## Task 3: Admin manual add captures a comparable `teammate_added_by_admin` event (AC3)

**Files:**
- Modify: `src/web-ui/modules/team-management.js`
- Modify: `tests/check-wsi-s5-metrics-instrumentation.js`

- [ ] **Step 1: Write the failing test**

Add before the final `console.log`:

```javascript
await checkAsyncOrSync('AC3: addTeammateByAdmin_success_capturesComparableEvent', async () => {
  var patch = patchPosthogCapture();
  try {
    var teamManagement = freshRequire(TEAM_MANAGEMENT_MODULE_PATH);
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
    // unavoidable real dependency.
    var identityLinks = freshRequire(require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'identity-links')));
    var originalResolve = identityLinks.resolvePersonForIdentity;
    identityLinks.resolvePersonForIdentity = async function () { return 4242; };
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
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wsi-s5-metrics-instrumentation.js
```

Expected: `2 passed, 1 failed` — no `teammate_added_by_admin` event exists yet (confirms the test-plan's own claim that this is genuinely new work, not a pre-existing behaviour).

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/modules/team-management.js`, add near the top (alongside `var identityLinks = require('./identity-links');`):

```javascript
var _posthog = require('./posthog-server');
```

In `addOrUpdateTeammate`, immediately after the existing `log.info('teammate_added', {...});` call and before `return { personId: personId, tenantId: adminTenantId, role: role, updated: alreadyMember };`, add:

```javascript

  // wsi-s5 AC3: the comparable "admin-add" side of the self-serve-vs-admin-add
  // benefit metric -- without this, only one side of the comparison exists.
  // Never includes the raw identityKey string, matching this function's
  // own existing audit-log convention above.
  _posthog.capture(adminTenantId, 'teammate_added_by_admin', {
    tenant_id: adminTenantId,
    role: role
  });
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wsi-s5-metrics-instrumentation.js
```

Expected: `3 passed, 0 failed`

**Correction (found during Task 3 dispatch, before any commit):** the plan's Step 1 test code, as originally written, freshRequired `team-management.js` BEFORE freshRequiring and patching `identity-links.js`. This meant `team-management.js`'s own internal `require('./identity-links')` had already resolved to the previous (unpatched) cached module instance by the time the test patched a *different*, later-created instance — `addOrUpdateTeammate` called the real, unpatched `resolvePersonForIdentity`, which legitimately threw `UnknownIdentityError` against the mock pool (always returns `{rows: []}`). This produced a `2 passed, 1 failed` RED state that superficially matched the plan's own prediction, masking the fact that the failure reason was a test-authoring bug, not the intended "no event exists yet" signal. The dispatched subagent correctly diagnosed this via direct `require.cache` object-identity instrumentation (not a guess) and stopped rather than editing the plan's "verbatim" test code on its own initiative. Fixed by reordering: `identityLinks` is now freshRequired and patched FIRST, `teamManagement` freshRequired second — the same "dependency freshRequired before consumer" rule already established in this story's own `setUpTeamManagementRoutesWithMagicLink` helper (and in `wsi-s1`'s/`wsi-s2`'s own test files for `magic-link-strategy.js`). Verified: `3 passed, 0 failed`, sibling regression (`check-tir-s3-admin-adds-teammate.js`) unaffected at `8 passed, 0 failed`.

- [ ] **Step 5: Run sibling regressions**

```bash
node tests/check-tir-s3-admin-adds-teammate.js
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/team-management.js tests/check-wsi-s5-metrics-instrumentation.js
git commit -m "feat(wsi-s5): capture teammate_added_by_admin PostHog event, the comparable admin-add side (AC3)"
```

---

## Task 4: Both metrics are computable from real event data alone; no PII ever captured (AC4, NFR)

**Files:**
- Modify: `tests/check-wsi-s5-metrics-instrumentation.js`

- [ ] **Step 1: Write the tests**

Add before the final `console.log`:

```javascript
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
```

- [ ] **Step 2: Run test — expected to already pass**

```bash
node tests/check-wsi-s5-metrics-instrumentation.js
```

Expected: `5 passed, 0 failed` — Tasks 1-3's implementations already make both true. If either fails, investigate before forcing a pass.

**Correction (found during Task 4 dispatch, before any commit):** the plan's own AC4 and NFR-security tests' `acceptPool.query` mocks (both, identically) omitted two SQL-prefix branches that `redeemTeamInvitation` → `createOrReuseTeamMemberAndMembership` unconditionally issues for a new invitee: `SELECT person_id FROM person_identities WHERE identity_key = $1` and `INSERT INTO people DEFAULT VALUES RETURNING id`. Both fell through to the mock's default `{rows: []}`, and `personResult.rows[0].id` threw `Cannot read properties of undefined (reading 'id')` — a real plan-authoring gap, distinct in kind from the require-ordering bug found and proactively fixed in Task 3/4 earlier (that fix was correct and NOT implicated in this failure; the dispatched subagent correctly distinguished the two rather than assuming a repeat of the same root cause). Task 2's own AC2 test pool already handled both branches correctly (`SELECT PERSON_ID FROM PERSON_IDENTITIES` → `{rows: []}`, `INSERT INTO PEOPLE DEFAULT VALUES` → `{rows: [{id: 9001}]}`) — this pattern was simply not carried over when the AC4/NFR pools were drafted. Fixed by adding the same two branches (with distinct ids `9101`/`9102`) to both pools. Verified: `5 passed, 0 failed`; all 7 sibling regressions unaffected.

- [ ] **Step 3: Run full sibling regressions**

```bash
node tests/check-wsi-s1-admin-creates-invite.js
node tests/check-wsi-s2-invitee-accepts-and-joins.js
node tests/check-wsi-s3-invite-expiry.js
node tests/check-wsi-s4-member-count-cap.js
node tests/check-tir-s3-admin-adds-teammate.js
node tests/check-story3-self-service-provisioning.js
node tests/check-story4-dual-path-authentication.js
```

- [ ] **Step 4: Full regression + commit**

```bash
npm test
```

Expected: matches the true baseline (33 pre-existing failures, same file list independently verified by every prior story in this feature; total file count reflects this story's own new test file).

```bash
git add tests/check-wsi-s5-metrics-instrumentation.js
git commit -m "test(wsi-s5): lock in AC4/NFR -- both metrics computable, no PII in any event"
```

---

## Final story-level check (before /verify-completion)

After all 4 tasks: `node tests/check-wsi-s5-metrics-instrumentation.js` → `5 passed, 0 failed`. All 7 sibling regression files unchanged. Full `npm test` at the true baseline. This story completes Epic 1's own measurability requirement — both benefit metrics can now be computed from real PostHog data. After it merges, only `wsi-s6` (invite-creation UI, still needs `/review → /test-plan → /definition-of-ready`) remains in Epic 1.
