# Admin creates a per-person team invite, which sends the invite email — Implementation Plan

> **For agent execution:** Use /subagent-execution (subagents available).

**Goal:** Make every test in the test plan pass — new `team_invitations` table/module mirroring `client-invitations.js`'s shape, a third handler in `routes/team-management.js`'s existing factory, and route wiring in `server.js` reusing the exact `POST /api/team/members` mounting pattern.
**Branch:** `feature/wsi-s1`
**Worktree:** `.worktrees/wsi-s1`
**Test command:** `node tests/check-wsi-s1-admin-creates-invite.js` (per task) / `npm test` (full suite, final step)

---

## File map

```
Create:
  src/web-ui/modules/team-invitations.js       — AC1-AC5
  tests/check-wsi-s1-admin-creates-invite.js    — AC1-AC5

Modify:
  src/web-ui/routes/team-management.js — add handleCreateInvite to createTeamManagementHandlers
  src/web-ui/server.js                 — wire migrateTeamInvitationsSchema + POST /api/team/invites
```

**Design note — real current code, confirmed against merged master before writing this plan:**
- `routes/team-management.js`'s `createTeamManagementHandlers(pool)` (line 63) already returns `{ handleGetTeamMembers, handleAddTeammate }`, closed over a single `pool`. This plan adds a third handler, `handleCreateInvite`, to the SAME factory and export object — not a new file, not a new factory.
- The file's own established helpers — `_readBody(req)` (line 42, form-urlencoded parsing), `_escapeHtml(s)` (line 28), `_logger`/`setLogger()` (lines 16-26) — are reused unchanged for the new handler.
- CSRF: `handleAddTeammate` (line 102) calls `await csrf.csrfGuard(req, res)` first, returning early if it fails; `handleGetTeamMembers` (line 77) calls `csrf.generateCsrfToken(req)` and embeds it via `csrf.csrfField(csrfToken)`. The new handler follows the exact same `csrfGuard` pattern as `handleAddTeammate` (a mutating POST).
- `modules/team-management.js` already exports `VALID_ROLES` (`['admin', 'engineer', 'product', 'viewer']`) and `InvalidRoleError` (line 142-148) — reused directly, no second role-validation list.
- `modules/client-invitations.js`'s `createInvitation(pool, clientOrgId, email, invitedByOrgId, logger)` (line 62) is the exact shape `team-invitations.js`'s own `createInvitation` mirrors, substituting `tenantId` for `clientOrgId`, adding a `role` parameter, and adding `expires_at` (24h from now) to both the schema and the INSERT — `client_invitations` has no role or expiry column at all.
- `modules/invitation-email.js`'s `sendInvitationEmail(destinationEmail, link, code)` (line 45) is called directly, unchanged — no new adapter, no new import beyond `require('../modules/invitation-email')`.
- `server.js`'s real route-mounting pattern for `POST /api/team/members` (lines 2969-2980): checks `_teamManagementHandlers` is wired (503 if not), calls `requireAdmin`, then dispatches to the handler. The new `POST /api/team/invites` route mirrors this exactly, same `requireAdmin` gate, same `_teamManagementHandlers` reference (the new handler is added to the same wired object, no second module-level handler variable needed).
- `server.js`'s schema migration wiring for `client_invitations` (line 600, `migrateClientInvitationsSchema(_userRolesPool).then(...)`) is the pattern `team_invitations`' own migration call mirrors — added as a sibling `.then()` call using the same `_userRolesPool`.

---

## Task 1: Module + happy-path invite creation (AC1)

**Files:**
- Create: `src/web-ui/modules/team-invitations.js`
- Create: `tests/check-wsi-s1-admin-creates-invite.js`
- Modify: `src/web-ui/routes/team-management.js`
- Modify: `src/web-ui/server.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-wsi-s1-admin-creates-invite.js`:

```javascript
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
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wsi-s1-admin-creates-invite.js
```

Expected: fails — `handleCreateInvite` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create `src/web-ui/modules/team-invitations.js`:

```javascript
'use strict';

// team-invitations.js — wsi-s1
//
// Mirrors modules/client-invitations.js's shape (invitation_id PK, atomic
// single-use redemption via UPDATE ... WHERE redeemed_at IS NULL RETURNING *)
// with 3 additions this feature needs that client_invitations has no column
// for: tenant_id (joining an EXISTING tenant, not creating a new org), role
// (the admin-chosen role — client_invitations always hardcodes 'admin'), and
// expires_at (client_invitations has no expiry at all — this feature's own
// 24-hour rule, per decisions.md's Q4 resolution).
//
// ADR-026 reuse-check confirmed with operator at /definition: genuinely a
// new table, not an extension of client_invitations, to avoid coupling two
// features' schemas together.

var _defaultLogger = { info: function (msg) { console.log(msg); } };

function _genId(prefix) {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

/**
 * Startup schema bootstrap. Idempotent, matching client-invitations.js's own
 * CREATE TABLE IF NOT EXISTS migration convention.
 * @param {object} pool
 * @returns {Promise<void>}
 */
async function migrateTeamInvitationsSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS team_invitations (
      team_invitation_id VARCHAR     PRIMARY KEY,
      tenant_id           VARCHAR     NOT NULL,
      email               VARCHAR     NOT NULL,
      role                VARCHAR     NOT NULL,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at           TIMESTAMPTZ NOT NULL,
      redeemed_at          TIMESTAMPTZ
    )
  `);
}

/**
 * Create a pending team invite, scoped to the admin's own tenant (AC1).
 * @param {object} pool
 * @param {string} tenantId - the calling admin's own tenant (req.session.tenantId), never request input (ADR-025)
 * @param {string} email
 * @param {string} role - one of team-management.js's VALID_ROLES
 * @param {string} [adminId] - the calling admin's own session identifier, for the audit log
 * @param {{info: Function}} [logger]
 * @returns {Promise<{team_invitation_id:string, tenant_id:string, email:string, role:string, created_at:string, expires_at:string, redeemed_at:(string|null)}>}
 */
async function createInvitation(pool, tenantId, email, role, adminId, logger) {
  var log = logger || _defaultLogger;
  var invitationId = _genId('tinv');
  var expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  var result = await pool.query(
    'INSERT INTO team_invitations (team_invitation_id, tenant_id, email, role, expires_at) ' +
    'VALUES ($1, $2, $3, $4, $5) RETURNING team_invitation_id, tenant_id, email, role, created_at, expires_at, redeemed_at',
    [invitationId, tenantId, email, role, expiresAt]
  );
  var row = result.rows[0];
  // Audit: invitation_id + tenant_id + role + admin + timestamp — never the raw token (issued only inside the emailed link).
  log.info(JSON.stringify({
    event: 'team_invite_created',
    team_invitation_id: row.team_invitation_id,
    tenant_id: tenantId,
    role: role,
    created_by: adminId,
    timestamp: new Date().toISOString()
  }));
  return row;
}

/**
 * Read a single invite row by ID.
 * @param {object} pool
 * @param {string} teamInvitationId
 * @returns {Promise<object|null>}
 */
async function getInvitationById(pool, teamInvitationId) {
  var result = await pool.query(
    'SELECT team_invitation_id, tenant_id, email, role, created_at, expires_at, redeemed_at ' +
    'FROM team_invitations WHERE team_invitation_id = $1',
    [teamInvitationId]
  );
  return result.rows.length ? result.rows[0] : null;
}

module.exports = { migrateTeamInvitationsSchema, createInvitation, getInvitationById };
```

In `src/web-ui/routes/team-management.js`, add near the top (after the existing `var teamManagement = require('../modules/team-management');` line):

```javascript
var teamInvitations = require('../modules/team-invitations');
```

Inside `createTeamManagementHandlers(pool)` (after `handleAddTeammate`'s closing brace, before the final `return` statement), add:

```javascript
  /**
   * POST /api/team/invites — create a per-person team invite (wsi-s1 AC1).
   * ADR-025: tenantId is ALWAYS req.session.tenantId, never request input.
   */
  async function handleCreateInvite(req, res, _opts) {
    var opts = _opts || {};
    if (!opts.skipCsrf) {
      var csrfOk = await csrf.csrfGuard(req, res);
      if (!csrfOk) return;
    }

    var body = await _readBody(req);
    var email = body && body.email ? String(body.email) : '';
    var role = body && body.role ? String(body.role) : '';
    var tenantId = req.session && req.session.tenantId;
    var adminId = req.session && req.session.userId;

    if (!email || !role) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'email and role are both required' }));
      return;
    }

    if (teamManagement.VALID_ROLES.indexOf(role) === -1) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid role \'' + role + '\'. Must be one of: ' + teamManagement.VALID_ROLES.join(', ') }));
      return;
    }

    var invite = await teamInvitations.createInvitation(pool, tenantId, email, role, adminId, _logger);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ team_invitation_id: invite.team_invitation_id, email: invite.email, role: invite.role, expires_at: invite.expires_at }));
  }
```

Update the factory's `return` statement:

```javascript
  return { handleGetTeamMembers: handleGetTeamMembers, handleAddTeammate: handleAddTeammate, handleCreateInvite: handleCreateInvite };
```

In `src/web-ui/server.js`, near the `migrateClientInvitationsSchema(_userRolesPool).then(...)` call (~line 600), add a sibling migration call using the same `_userRolesPool`:

```javascript
    migrateTeamInvitationsSchema(_userRolesPool).then(function() {
      console.log('[wsi-s1] team_invitations table ready');
    });
```

(Add the corresponding `const { migrateTeamInvitationsSchema } = require('./modules/team-invitations');` near the top of the file, alongside the other `require`s.)

Near the existing `POST /api/team/members` route block (~line 2980), add:

```javascript
  } else if (pathname === '/api/team/invites' && req.method === 'POST') {
    // wsi-s1 — create a per-person team invite (requireAdmin gate, AC1;
    // ADR-025: handler always writes to req.session.tenantId, never a request field)
    if (!_teamManagementHandlers) {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Team management unavailable');
    } else {
      let _raOk = false;
      await requireAdmin(req, res, () => { _raOk = true; });
      if (!_raOk) return;
      await _teamManagementHandlers.handleCreateInvite(req, res);
    }

```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wsi-s1-admin-creates-invite.js
```

Expected: `1 passed, 0 failed`

- [ ] **Step 5: Run sibling regressions**

```bash
node tests/check-tir-s3-admin-adds-teammate.js
node tests/check-story3-self-service-provisioning.js
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/team-invitations.js src/web-ui/routes/team-management.js src/web-ui/server.js tests/check-wsi-s1-admin-creates-invite.js
git commit -m "feat(wsi-s1): team_invitations module + invite-creation handler (AC1)"
```

**Post-Task-1 correction (recorded here for an accurate historical record, not re-executed):** The two-stage review of the resulting commit (`2b39f06c`) found 2 blocking issues and 2 real test gaps, all fixed in a follow-up commit `29f2cd28` before Task 2 began:
1. The original `handleCreateInvite` hand-rolled its own role-rejection response instead of reusing `teamManagement.InvalidRoleError` (the story's own explicit constraint) — fixed to `throw new teamManagement.InvalidRoleError(...)` inside a try/catch matching `handleAddTeammate`'s exact shape.
2. The original handler accepted an `_opts.skipCsrf` test-convenience flag — a live, undocumented CSRF bypass shipped in production code. Removed entirely; the test file now constructs a real, matching CSRF token pair (`session.csrfToken`/`body._csrf`), following `check-tir-s3-admin-adds-teammate.js`'s own established pattern.
3. The committed AC1 test never asserted `expires_at` despite the test plan requiring it — added.
4. The test plan's own `createInvite_tenantIdNeverFromRequest_onlyFromSession` tamper test (an explicit ADR-025 guarantee) was missing from this plan's own Step 1 code above and from the commit — added, adapted from `check-tir-s3-admin-adds-teammate.js`'s own tamper-test shape. **Test count after this fix is 2 (not 1)** — the plan's own Step 1 code block above under-specified this from the start; treat the plan's embedded test code as the original intent, and the actual committed test file (post-fix) as the corrected, authoritative version going forward.

---

## Task 2: Send the invite email (AC2)

**Files:**
- Modify: `src/web-ui/routes/team-management.js`
- Modify: `tests/check-wsi-s1-admin-creates-invite.js`

- [ ] **Step 1: Write the failing test**

Add to `tests/check-wsi-s1-admin-creates-invite.js`, before the final `console.log`:

```javascript
await checkAsyncOrSync('AC2: createInvite_success_callsSendInvitationEmailWithCorrectArgs', async () => {
  var state = {};
  var pool = makeMockPool(state);
  var handlers = teamManagementRoutes.createTeamManagementHandlers(pool);
  var invitationEmail = require('../src/web-ui/modules/invitation-email');
  var sentArgs = null;
  invitationEmail.setSendInvitationEmail(function (email, link) { sentArgs = { email: email, link: link }; return Promise.resolve(); });
  try {
    var req = mockReq({ body: { email: 'someone@example.com', role: 'product', _csrf: 'test-csrf-token' } });
    var res = mockRes();
    await handlers.handleCreateInvite(req, res);
    assert.ok(sentArgs, 'expected sendInvitationEmail to be called');
    assert.strictEqual(sentArgs.email, 'someone@example.com', 'expected the invitee email to be passed');
    assert.ok(sentArgs.link && sentArgs.link.indexOf(state.inserted.team_invitation_id) !== -1, 'expected the invite link to contain the real invite id');
  } finally {
    invitationEmail._resetForTesting();
  }
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wsi-s1-admin-creates-invite.js
```

Expected: `1 passed, 1 failed` — `sendInvitationEmail` is never called yet.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/team-management.js`, add near the top:

```javascript
var invitationEmail = require('../modules/invitation-email');
```

In `handleCreateInvite`, after the `createInvitation` call and before writing the response, add:

```javascript
    var link = (process.env.APP_BASE_URL || '') + '/invite/redeem?teamInvitationId=' + encodeURIComponent(invite.team_invitation_id);
    await invitationEmail.sendInvitationEmail(invite.email, link);
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wsi-s1-admin-creates-invite.js
```

Expected: `3 passed, 0 failed`.

**Correction (found during Task 2 dispatch, before any commit):** the plan under-specified this step. Once `handleCreateInvite` unconditionally calls `invitationEmail.sendInvitationEmail`, Task 1's two AC1 tests (`createInvite_validRoleAndEmail_writesTenantScopedRow`, `createInvite_tenantIdNeverFromRequest_onlyFromSession`) fail with `Adapter not wired: sendInvitationEmail` — the D37 stub throws by default (correct, intentional behaviour; see `CLAUDE.md`'s D37 rule), and neither AC1 test wires a mock adapter because they were written before Task 2 existed. This is expected, not a regression: in real production behaviour, creating an invite always sends an email, so any test exercising the row-write path must also wire the adapter. Fix: wrap each of the two AC1 tests' `handlers.handleCreateInvite(req, res)` call in a `try { ... } finally { invitationEmail._resetForTesting(); }` block, calling `invitationEmail.setSendInvitationEmail(function () { return Promise.resolve(); });` before the call (same `var invitationEmail = require('../src/web-ui/modules/invitation-email');` require already used by the AC2 test, added once near the top of the IIFE rather than duplicated per test). `tests/check-wsi-s1-admin-creates-invite.js` is already listed as a "Modify" target for this task, so this stays in scope.

- [ ] **Step 5: Run sibling regressions**

```bash
node tests/check-story3-self-service-provisioning.js
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/team-management.js tests/check-wsi-s1-admin-creates-invite.js
git commit -m "feat(wsi-s1): send invite email via reused sendInvitationEmail adapter (AC2)"
```

**Task 2 CORRECTION (found post-commit, via two dispatched review subagents — spec-compliance and code-quality — before Task 3 began):** Steps 1-6 above, as originally written and as committed in `a32a32c9`, do NOT satisfy AC2. AC2's exact text requires "a link containing the signed invite token"; the signed-off DoR contract requires "a link containing a signed JWT carrying `teamInvitationId`". The code above built a plaintext URL around the raw, non-cryptographically-random `team_invitation_id` and passed it straight to `sendInvitationEmail` — an unsigned, guessable bearer credential, not a signed JWT. Full writeup in `decisions.md`'s 2026-08-15 CORRECTION entry. The corrected mechanism, now implemented and committed:

- `src/web-ui/routes/team-management.js` no longer requires `../modules/invitation-email` directly. It requires `../auth/magic-link-strategy` instead, and `handleCreateInvite` now calls `magicLinkStrategy.issueMagicLink(invite.email, { teamInvitationId: invite.team_invitation_id })` — the exact same primitive `routes/agency-provisioning.js`'s own `handlePostInviteUser` uses for the equivalent "invite a person, send a signed magic link" shape. `issueMagicLink` internally builds the signed JWT AND sends it via the same reused `sendInvitationEmail` adapter (wired once in `server.js`'s `sendMagicLink` callback) — so the adapter reuse constraint is still satisfied, just through the correct entry point.
- Because `passport-magic-login`'s own `.send()` swallows a rejected `sendMagicLink` into `{success:false}` rather than rejecting the promise (the same behaviour `agency-provisioning.js` already documents and guards against), the corrected `handleCreateInvite` checks `!sent || !sent.success` and returns HTTP 502 with the message `'The invite was created but could not be emailed. Please try again.'` if the send failed. **This means AC5 (Task 4's whole scope) is now already implemented as a direct consequence of correctly implementing AC2** — see Task 4's own correction note below.
- `tests/check-wsi-s1-admin-creates-invite.js` was rewritten to mock `sendMagicLink` (via a fresh `magic-link-strategy` module instance registered per test, using `freshRequire()` + `registerMagicLinkStrategy()`, exactly mirroring `tests/check-story3-self-service-provisioning.js`'s own established pattern for testing this same shared singleton strategy) instead of mocking `invitation-email.js`'s `sendInvitationEmail` directly. Both AC1 tests and the AC2 test (renamed `createInvite_success_issuesSignedMagicLinkWithCorrectTeamInvitationId`) now go through this setup. Verified: `node tests/check-wsi-s1-admin-creates-invite.js` → `3 passed, 0 failed`; sibling regressions `node tests/check-story3-self-service-provisioning.js` → `18 passed, 0 failed` and `node tests/check-tir-s3-admin-adds-teammate.js` → `8 passed, 0 failed`, both unaffected.
- Manually smoke-tested the failure path (`sendMagicLink` mock throws) before touching Task 4: confirms `handleCreateInvite` already returns `502` with the expected message — Task 4 needs no further source change, only its test.

This correction is committed separately from `a32a32c9` (see the commit immediately following this note in `git log`) rather than amended into it, per this repo's own no-amend convention.

---

## Task 3: Role validation (AC3, AC4)

**Files:**
- Modify: `tests/check-wsi-s1-admin-creates-invite.js`

- [ ] **Step 1: Write the failing tests**

Add before the final `console.log`:

```javascript
await checkAsyncOrSync('AC3: createInvite_invalidRole_rejectedNoRowWritten', async () => {
  var state = {};
  var pool = makeMockPool(state);
  var handlers = teamManagementRoutes.createTeamManagementHandlers(pool);
  var req = mockReq({ body: { email: 'x@example.com', role: 'superadmin', _csrf: 'test-csrf-token' } });
  var res = mockRes();
  await handlers.handleCreateInvite(req, res);
  assert.strictEqual(res._get().statusCode, 400, 'expected 400 for an invalid role');
  assert.ok(!state.inserted, 'expected no team_invitations row to be written');
});

await checkAsyncOrSync('AC4: createInvite_missingRole_rejected', async () => {
  var state = {};
  var pool = makeMockPool(state);
  var handlers = teamManagementRoutes.createTeamManagementHandlers(pool);
  var req = mockReq({ body: { email: 'x@example.com', _csrf: 'test-csrf-token' } });
  var res = mockRes();
  await handlers.handleCreateInvite(req, res);
  assert.strictEqual(res._get().statusCode, 400, 'expected 400 for a missing role');
  assert.ok(!state.inserted, 'expected no team_invitations row to be written');
});
```

- [ ] **Step 2: Run test — expected to already pass**

```bash
node tests/check-wsi-s1-admin-creates-invite.js
```

Expected: `4 passed, 0 failed` — Task 1's implementation already validates `email`/`role` presence and role membership via `VALID_ROLES`, so these should pass without further code changes. If either fails, the validation logic in `handleCreateInvite` has a real bug — fix it, don't force the test to match broken behaviour.

- [ ] **Step 3: Commit**

```bash
git add tests/check-wsi-s1-admin-creates-invite.js
git commit -m "test(wsi-s1): lock in AC3/AC4 -- invalid and missing role both rejected, no row written"
```

---

## Task 4: Email-send failure handling (AC5)

**CORRECTION (superseding this task's original Steps 1-3 below, made when Task 2 was corrected — see Task 2's own correction note and `decisions.md`'s 2026-08-15 CORRECTION entry):** The `502` + `!sent.success` check this task originally set out to add in its own Step 3 is now already implemented in `src/web-ui/routes/team-management.js` as a direct, unavoidable consequence of correctly implementing AC2 via `magicLinkStrategy.issueMagicLink` (`issueMagicLink`'s underlying `passport-magic-login` swallows a rejected `sendMagicLink` into `{success:false}` rather than throwing, so the success check had to be added at Task 2 time, not deferred). Manually smoke-tested and confirmed: a `sendMagicLink` mock that throws already produces `502` + `'The invite was created but could not be emailed. Please try again.'`. This task's remaining scope is now test-only — mirrors Task 3's own "should already pass, lock in via test" shape exactly. The test below is updated to mock `sendMagicLink` (via the same `setUpTeamManagementWithMagicLink()` helper Task 2's correction introduced) instead of `invitation-email.js`'s `sendInvitationEmail` directly — do not use the original mocking shown further below, it targets the wrong (now-unused) layer.

**Files:**
- Modify: `tests/check-wsi-s1-admin-creates-invite.js` (test-only; no source change expected — if the test fails, that indicates a real regression in the Task 2 correction, not a Task-4-shaped gap; investigate rather than adding new source code to force it green.)

- [ ] **Step 1: Write the test (corrected mocking layer)**

Add before the final `console.log`, using the `setUpTeamManagementWithMagicLink()` helper already defined near the top of the test file:

```javascript
await checkAsyncOrSync('AC5: createInvite_emailSendFails_surfacesErrorRowAlreadyWritten', async () => {
  var state = {};
  var pool = makeMockPool(state);
  var teamManagementRoutes = setUpTeamManagementWithMagicLink(async function () {
    throw new Error('Resend API error');
  });
  var handlers = teamManagementRoutes.createTeamManagementHandlers(pool);
  var req = mockReq({ body: { email: 'fail@example.com', role: 'viewer', _csrf: 'test-csrf-token' } });
  var res = mockRes();
  await handlers.handleCreateInvite(req, res);
  var result = res._get();
  assert.strictEqual(result.statusCode, 502, 'expected a distinct error status for an email-send failure, not a generic 500');
  var parsed = JSON.parse(result.body);
  assert.ok(/could not be emailed|failed to send/i.test(parsed.error), 'expected a specific "could not be emailed" style message, not a generic error');
  assert.ok(state.inserted, 'expected the team_invitations row to still exist despite the email failure');
});
```

- [ ] **Step 2: Run test — expected to already pass**

```bash
node tests/check-wsi-s1-admin-creates-invite.js
```

Expected: `5 passed, 0 failed` (4 from Task 2's corrected file + this one) — no source change needed, per the correction note above. If it fails, stop and investigate before writing any new source code; do not force a pass.

<details><summary>Original (superseded) Steps 1-3 — kept for the historical record only, do not follow</summary>

The original plan mocked `invitation-email.js`'s `sendInvitationEmail` directly and proposed adding a try/catch around a direct `sendInvitationEmail` call in `handleCreateInvite`. Both are obsolete: Task 2's correction replaced the direct `sendInvitationEmail` call with `magicLinkStrategy.issueMagicLink`, and the `502`/`!sent.success` handling this task originally proposed adding here was folded into that same correction.

</details>

- [ ] **Step 3 (was Step 5): Run sibling regressions**

```bash
node tests/check-tir-s3-admin-adds-teammate.js
node tests/check-story3-self-service-provisioning.js
```

- [ ] **Step 4 (was Step 6): Full regression + commit**

```bash
npm test
```

Expected: matches the documented pre-existing baseline (33 failures, same list — see `decisions.md`'s 2026-08-15 branch-setup RISK-ACCEPT entry).

```bash
git add tests/check-wsi-s1-admin-creates-invite.js
git commit -m "test(wsi-s1): lock in AC5 -- email-send failure already surfaces 502, no source change needed"
```

---

## Final story-level check (before /verify-completion)

After all 4 tasks: `node tests/check-wsi-s1-admin-creates-invite.js` → `5 passed, 0 failed`, both sibling regression files (`check-tir-s3-admin-adds-teammate.js`, `check-story3-self-service-provisioning.js`) unchanged, `npm test` at the documented baseline. This story closes the first, foundational piece of the self-serve invite epic — after it merges, `wsi-s2` can begin (it depends on this story's `team_invitations` table and `teamInvitationId` payload shape).
