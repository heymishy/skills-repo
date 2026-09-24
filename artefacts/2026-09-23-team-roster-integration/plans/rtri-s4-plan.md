# Backfill person_identities on login so existing real memberships become resolvable — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/rtri-s4`
**Worktree:** `.worktrees/rtri-s4`
**Test command:** `node scripts/run-all-tests.js` (full suite) / `node tests/check-rtri-s4-identity-backfill.js` (this story's file only)

---

## File map

```
Modify:
  src/web-ui/modules/identity-links.js   — add backfillIdentityIfNeeded(pool, identityKey, personId, provider, logger)
  src/web-ui/modules/user-roles.js       — extend resolveRoleForPerson/getRoleForTenant with optional 4th/3rd `provider` param
  src/web-ui/server.js                   — forward `provider` through both setGetRoleForTenant wiring sites
  src/web-ui/routes/auth.js              — pass 'github'/'google' at the 2 real OAuth call sites
  src/web-ui/routes/auth-email.js        — pass 'email' at the 2 real email call sites

Create:
  tests/check-rtri-s4-identity-backfill.js — all 5 AC tests + backward-compat + audit NFR test (9 total)
```

---

## Task 1: `backfillIdentityIfNeeded` — AC3, Audit NFR

**Files:**
- Modify: `src/web-ui/modules/identity-links.js`
- Create: `tests/check-rtri-s4-identity-backfill.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/check-rtri-s4-identity-backfill.js` with this content:

```javascript
#!/usr/bin/env node
// check-rtri-s4-identity-backfill.js — rtri-s4
// Verifies the person_identities login-time backfill: backfillIdentityIfNeeded
// (src/web-ui/modules/identity-links.js) and the resolveRoleForPerson/
// getRoleForTenant extension (src/web-ui/modules/user-roles.js). Follows
// this repo's hand-rolled test()/assert style.
//
// AC1: backfill fires on all 4 real login call sites (unit + integration)
// AC2: backfilled identity becomes visible in listTeamMembers (rtri-s1)
// AC3: idempotent -- no duplicate row, no error on repeat login
// AC4: unknown identity never backfilled
// AC5: existing 3 write sites unaffected (regression, covered by
//      /verify-completion's full-suite run, not duplicated here)
// Plus: backward compatibility (omitted provider), Audit NFR

'use strict';

var assert = require('assert');
var path = require('path');

var ROOT = path.join(__dirname, '..');

var passed = 0;
var failed = 0;
var failures = [];

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(function() { passed++; console.log('  [PASS]', name); })
    .catch(function(err) {
      failed++;
      failures.push({ name: name, err: err });
      console.log('  [FAIL]', name, '--', (err && err.message) || err);
    });
}

var IDENTITY_LINKS_PATH = path.resolve(ROOT, 'src/web-ui/modules/identity-links.js');
var USER_ROLES_PATH = path.resolve(ROOT, 'src/web-ui/modules/user-roles.js');
var TEAM_MANAGEMENT_PATH = path.resolve(ROOT, 'src/web-ui/modules/team-management.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

// ── Narrow, self-contained in-memory fake pool ──────────────────────────────
// Mirrors rtri-s1's own makeFakePool convention exactly, extended with
// people + a resolvable-only-via-fallback seed helper.
function makeFakePool() {
  var people = []; // { id }
  var teamMemberships = []; // { person_id, tenant_id, role }
  var personIdentities = []; // { identity_key, person_id, provider }
  var nextPersonId = 1;

  function _norm(sql) {
    return String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
  }

  function query(sql, params) {
    var s = _norm(sql);
    var p = params || [];

    if (s.indexOf('SELECT PERSON_ID FROM PERSON_IDENTITIES WHERE IDENTITY_KEY') === 0) {
      var match = personIdentities.filter(function(r) { return r.identity_key === p[0]; });
      return Promise.resolve({ rows: match.length ? [{ person_id: match[0].person_id }] : [] });
    }

    if (s.indexOf('SELECT PERSON_ID FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0) {
      var tm = teamMemberships.filter(function(r) { return r.tenant_id === p[0]; });
      return Promise.resolve({ rows: tm.length ? [{ person_id: tm[0].person_id }] : [] });
    }

    if (s.indexOf('INSERT INTO PERSON_IDENTITIES') === 0) {
      personIdentities.push({ identity_key: p[0], person_id: p[1], provider: p[2] });
      return Promise.resolve({ rows: [] });
    }

    if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0) {
      var tmRole = teamMemberships.filter(function(r) { return r.tenant_id === p[0]; });
      return Promise.resolve({ rows: tmRole.length ? [{ role: tmRole[0].role }] : [] });
    }

    if (s.indexOf('SELECT TM.ROLE, PI.IDENTITY_KEY FROM TEAM_MEMBERSHIPS TM INNER JOIN PERSON_IDENTITIES PI') === 0) {
      var tenantId = p[0];
      var rows = teamMemberships
        .filter(function(r) { return r.tenant_id === tenantId; })
        .map(function(tm) {
          var pi = personIdentities.filter(function(x) { return x.person_id === tm.person_id; })[0];
          return pi ? { role: tm.role, identity_key: pi.identity_key } : null;
        })
        .filter(function(r) { return r !== null; });
      return Promise.resolve({ rows: rows });
    }

    console.warn('[fake-pool] unhandled query (returning empty rows): ' + s.slice(0, 160));
    return Promise.resolve({ rows: [] });
  }

  // Test-setup helper — seeds a person resolvable ONLY via the
  // team_memberships.tenant_id fallback (no explicit person_identities row)
  // -- exactly reproducing the live-verified wuce-staging gap.
  function _seedFallbackResolvable(tenantId, role) {
    var person = { id: nextPersonId++ };
    people.push(person);
    teamMemberships.push({ person_id: person.id, tenant_id: tenantId, role: role || 'engineer' });
    return person.id;
  }

  return {
    query: query,
    _seedFallbackResolvable: _seedFallbackResolvable,
    _state: function() { return { people: people, teamMemberships: teamMemberships, personIdentities: personIdentities }; }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 (core) — backfillIdentityIfNeeded writes a real row when none exists
// ─────────────────────────────────────────────────────────────────────────────

async function testBackfillWritesRowWhenNoneExists() {
  var identityLinks = freshRequire(IDENTITY_LINKS_PATH);
  var pool = makeFakePool();
  var personId = pool._seedFallbackResolvable('acme');

  var result = await identityLinks.backfillIdentityIfNeeded(pool, 'acme', personId, 'github');

  assert.strictEqual(result.backfilled, true, 'AC1: backfill reports it wrote a new row');
  var state = pool._state();
  assert.strictEqual(state.personIdentities.length, 1, 'AC1: exactly one person_identities row now exists');
  assert.strictEqual(state.personIdentities[0].identity_key, 'acme', 'AC1: row has the real identity_key');
  assert.strictEqual(state.personIdentities[0].person_id, personId, 'AC1: row links to the real person_id');
  assert.strictEqual(state.personIdentities[0].provider, 'github', 'AC1: row has the real provider');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — idempotent, no duplicate row on repeat call
// ─────────────────────────────────────────────────────────────────────────────

async function testBackfillIsIdempotent() {
  var identityLinks = freshRequire(IDENTITY_LINKS_PATH);
  var pool = makeFakePool();
  var personId = pool._seedFallbackResolvable('acme');

  await identityLinks.backfillIdentityIfNeeded(pool, 'acme', personId, 'github');
  var result2 = await identityLinks.backfillIdentityIfNeeded(pool, 'acme', personId, 'github');

  assert.strictEqual(result2.backfilled, false, 'AC3: second call reports no new write');
  var state = pool._state();
  assert.strictEqual(state.personIdentities.length, 1, 'AC3: still exactly one row -- no duplicate');
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit NFR — logs identity_backfilled, never the raw identity string
// ─────────────────────────────────────────────────────────────────────────────

async function testBackfillAuditLogsWithoutRawIdentity() {
  var identityLinks = freshRequire(IDENTITY_LINKS_PATH);
  var pool = makeFakePool();
  var personId = pool._seedFallbackResolvable('acme');
  var calls = [];
  var spyLogger = { info: function(event, data) { calls.push({ event: event, data: data }); }, warn: function() {} };

  await identityLinks.backfillIdentityIfNeeded(pool, 'alice@example.com', personId, 'email', spyLogger);

  var event = calls.filter(function(c) { return c.event === 'identity_backfilled'; })[0];
  assert.ok(event, 'Audit: an identity_backfilled event was logged');
  assert.strictEqual(event.data.personId, personId, 'Audit: log includes the real person id');
  assert.strictEqual(event.data.provider, 'email', 'Audit: log includes the real provider');
  assert.ok(event.data.timestamp, 'Audit: log includes a timestamp');
  assert.ok(/^[0-9a-f]{64}$/.test(event.data.identityHash), 'Audit: log includes a SHA-256 hex hash of the identity');
  assert.ok(JSON.stringify(event.data).indexOf('alice@example.com') === -1, 'Audit: raw identity string never appears in the logged data');
}

// ─────────────────────────────────────────────────────────────────────────────
// Runner (extended by later tasks)
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n[rtri-s4] Running AC verification tests...\n');

  console.log('AC1 (core) — backfillIdentityIfNeeded writes a real row');
  await test('AC1: backfillIdentityIfNeeded writes a real person_identities row when none exists', testBackfillWritesRowWhenNoneExists);

  console.log('\nAC3 — idempotent');
  await test('AC3: backfillIdentityIfNeeded is idempotent, no duplicate row on repeat call', testBackfillIsIdempotent);

  console.log('\nAudit NFR — logs without raw identity');
  await test('Audit: backfillIdentityIfNeeded logs identity_backfilled without ever logging the raw identity string', testBackfillAuditLogsWithoutRawIdentity);

  console.log('\n[rtri-s4] ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    console.error('\nFailures:');
    failures.forEach(function(f) { console.error('  - ' + f.name); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[rtri-s4] Unexpected error:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rtri-s4-identity-backfill.js
```

Expected output: `[FAIL]` on all 3 tests — `identityLinks.backfillIdentityIfNeeded is not a function`.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/modules/identity-links.js`, add this function (place it after `linkIdentity`, before `getLinkedProviders`):

```javascript
/**
 * Backfill a person_identities row for an identity that already resolves to
 * a real person (rtri-s4) -- via either an explicit link or the
 * team_memberships.tenant_id fallback -- but has no explicit row yet. Never
 * creates a new person or team_membership; only makes an ALREADY-existing,
 * already-legitimate membership resolvable by rtri-s1's listTeamMembers.
 * Idempotent: a no-op if a row already exists for identityKey.
 * @param {object} pool
 * @param {string} identityKey - GitHub login, Google sub, or email
 * @param {number} personId - the already-resolved person this identity belongs to
 * @param {string} provider - 'github', 'google', or 'email'
 * @param {{info: Function, warn: Function}} [logger]
 * @returns {Promise<{backfilled: boolean}>}
 */
async function backfillIdentityIfNeeded(pool, identityKey, personId, provider, logger) {
  var log = logger || _defaultLogger;

  var existing = await pool.query('SELECT person_id FROM person_identities WHERE identity_key = $1', [identityKey]);
  if (existing.rows.length) {
    return { backfilled: false };
  }

  await pool.query(
    'INSERT INTO person_identities (identity_key, person_id, provider) VALUES ($1, $2, $3)',
    [identityKey, personId, provider]
  );

  // Audit (NFR): person id + a SHA-256 hash of the identity + provider + a
  // timestamp -- never the raw identity string, matching linkIdentity's own
  // established convention exactly.
  log.info('identity_backfilled', {
    personId: personId,
    identityHash: _hashIdentity(identityKey),
    provider: provider,
    timestamp: new Date().toISOString()
  });

  return { backfilled: true };
}
```

Update `module.exports` at the bottom of the same file to:

```javascript
module.exports = {
  migrateIdentityLinksSchema,
  resolvePersonForIdentity,
  linkIdentity,
  backfillIdentityIfNeeded,
  getLinkedProviders,
  IdentityAlreadyLinkedError
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rtri-s4-identity-backfill.js
```

Expected output: `[rtri-s4] 3 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same baseline as `/branch-setup` (699 files, 1 pre-existing failure — `tests/check-p3.5-validate-trace.js`), plus this story's own new file now passing.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/identity-links.js tests/check-rtri-s4-identity-backfill.js
git commit -m "feat(rtri-s4): add backfillIdentityIfNeeded, idempotent identity backfill"
```

---

## Task 2: Extend `resolveRoleForPerson`/`getRoleForTenant` — AC1 (github case), AC4, backward-compat

**Files:**
- Modify: `src/web-ui/modules/user-roles.js`
- Modify: `tests/check-rtri-s4-identity-backfill.js`

- [ ] **Step 1: Write the failing tests**

Add these test functions to `tests/check-rtri-s4-identity-backfill.js`, after `testBackfillAuditLogsWithoutRawIdentity`:

```javascript
// ─────────────────────────────────────────────────────────────────────────────
// AC1 (github call shape) — resolveRoleForPerson backfills when provider is given
// ─────────────────────────────────────────────────────────────────────────────

async function testResolveRoleForPersonBackfillsGithubShape() {
  var userRoles = freshRequire(USER_ROLES_PATH);
  var pool = makeFakePool();
  pool._seedFallbackResolvable('acme');

  // mirrors auth.js's real GitHub call shape: identityKey and tenantId both
  // resolve to the same string for a solo/personal tenant
  await userRoles.resolveRoleForPerson(pool, 'acme', 'acme', 'github');

  var state = pool._state();
  assert.strictEqual(state.personIdentities.length, 1, 'AC1 (github): a person_identities row was backfilled');
  assert.strictEqual(state.personIdentities[0].provider, 'github', 'AC1 (github): the real provider was recorded');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — a genuinely unknown identity is never backfilled
// ─────────────────────────────────────────────────────────────────────────────

async function testUnknownIdentityNeverBackfilled() {
  var userRoles = freshRequire(USER_ROLES_PATH);
  var pool = makeFakePool();
  // no people/team_memberships/person_identities row for 'nobody' at all

  await userRoles.resolveRoleForPerson(pool, 'nobody', 'nobody', 'email');

  var state = pool._state();
  assert.strictEqual(state.personIdentities.length, 0, 'AC4: no person_identities row is created for a genuinely unknown identity');
  assert.strictEqual(state.people.length, 0, 'AC4: no new person row is created either');
}

// ─────────────────────────────────────────────────────────────────────────────
// Backward compatibility — omitted provider preserves exact prior behaviour
// ─────────────────────────────────────────────────────────────────────────────

async function testOmittedProviderSkipsBackfill() {
  var userRoles = freshRequire(USER_ROLES_PATH);
  var pool = makeFakePool();
  pool._seedFallbackResolvable('acme', 'admin');

  var role = await userRoles.resolveRoleForPerson(pool, 'acme', 'acme');

  assert.strictEqual(role, 'admin', 'Backward-compat: role resolution still works exactly as before');
  var state = pool._state();
  assert.strictEqual(state.personIdentities.length, 0, 'Backward-compat: omitting provider correctly skips the backfill, not errors or backfills with a garbage value');
}
```

Add the calls to `main()`, right after the Audit NFR block and before the summary line:

```javascript
  console.log('\nAC1 (github shape) — resolveRoleForPerson backfills');
  await test('AC1: resolveRoleForPerson backfills a real row for the GitHub OAuth call shape', testResolveRoleForPersonBackfillsGithubShape);

  console.log('\nAC4 — unknown identity never backfilled');
  await test('AC4: a genuinely unknown identity is never backfilled', testUnknownIdentityNeverBackfilled);

  console.log('\nBackward compatibility — omitted provider');
  await test('Backward-compat: omitting the new provider argument preserves exact prior behaviour', testOmittedProviderSkipsBackfill);
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rtri-s4-identity-backfill.js
```

Expected output: the 3 new tests fail (`resolveRoleForPerson` doesn't yet accept/use a 4th argument); the first 3 tests (Task 1) still pass.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/modules/user-roles.js`, add this require near the top of the file (with the existing requires):

```javascript
const { backfillIdentityIfNeeded } = require('./identity-links');
```

Update `resolveRoleForPerson`'s signature and body (find the existing function — search for `async function resolveRoleForPerson`):

```javascript
/**
 * Resolve the role for the authenticating PERSON, not just their tenant
 * (tir-s7 fix-forward for the tir-s1 bug described at the top of this file).
 * Resolves identityKey -> personId via resolvePersonForIdentity
 * (identity-links.js, tir-s2) first, then queries team_memberships filtering
 * by BOTH person_id AND tenant_id — closing the gap where 2+ people sharing a
 * tenant could resolve to an arbitrary row's role instead of their own
 * (AC1/AC2).
 *
 * rtri-s4: accepts an optional 4th `provider` argument. When supplied and a
 * personId resolves (via either path), backfills a person_identities row if
 * none exists yet -- closing the gap where a real, already-existing
 * team_memberships row is invisible to rtri-s1's listTeamMembers because no
 * login path ever wrote person_identities. Omitting `provider` preserves
 * EXACT prior behaviour for every pre-rtri-s4 caller -- no backfill is
 * attempted.
 *
 * Falls through to the pre-tir-s7 resolveRoleForTenant behaviour (tenant-only
 * lookup, legacy user_roles fallback, default 'user') in two cases:
 *  - resolvePersonForIdentity returns null — a completely unknown identity
 *    with no team_memberships/person_identities row anywhere (AC4). This
 *    story does NOT add auto-creation of a person/team_membership row for a
 *    brand-new signup — the existing default-to-'user' behaviour is
 *    preserved exactly as before.
 *  - a personId IS resolved but no team_memberships row matches both filters
 *    (defensive — should not happen in normal operation for a resolved
 *    person, but avoids a hard failure if it ever does).
 *
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @param {string} identityKey - the identity string used to resolve personId (GitHub login, Google sub, or email — whatever the login flow already computes as tenantId today)
 * @param {string} tenantId - the tenant to scope the team_memberships lookup to
 * @param {string} [provider] - 'github', 'google', or 'email' (rtri-s4) — when supplied, triggers the person_identities backfill if needed
 * @returns {Promise<string>}
 */
async function resolveRoleForPerson(pool, identityKey, tenantId, provider) {
  const personId = await resolvePersonForIdentity(pool, identityKey);
  if (personId == null) {
    // AC4: unknown identity — no auto-creation, fall through unchanged.
    return resolveRoleForTenant(pool, tenantId);
  }

  if (provider) {
    // rtri-s4: backfill is idempotent and safe to call on every login.
    await backfillIdentityIfNeeded(pool, identityKey, personId, provider);
  }

  const membership = await pool.query(
    'SELECT role FROM team_memberships WHERE person_id = $1 AND tenant_id = $2 LIMIT 1',
    [personId, tenantId]
  );
  if (membership.rows.length) return membership.rows[0].role;

  // Defensive fallback: personId resolved but no row matches both filters —
  // defer to the same legacy-table + default-'user' semantics as
  // resolveRoleForTenant rather than throwing.
  return resolveRoleForTenant(pool, tenantId);
}
```

Update `getRoleForTenant`'s signature and body (find the existing function — search for `async function getRoleForTenant`):

```javascript
/**
 * Return the role for a tenant via the person/team-membership lookup path.
 *
 * tir-s9 (fix-forward): accepts an optional second `identityKey` argument and
 * forwards it to the wired implementation. Every pre-tir-s9 call site (and
 * `auth-email.js`'s two call sites, unmodified by this story) calls this with
 * a single argument -- that remains fully supported; the wired implementation
 * (`server.js`) falls back to `tenantId` itself when `identityKey` is
 * omitted, exactly preserving prior behaviour for the solo-tenant and
 * email/password cases where `tenantId` already equals the person's own
 * identity. See decisions.md (2026-07-14) for why this argument was missing
 * in production despite tir-s7 already fixing the underlying query.
 *
 * rtri-s4: accepts an optional 3rd `provider` argument, forwarded to the
 * wired implementation the same way. Omitting it preserves exact prior
 * behaviour for every pre-rtri-s4 caller.
 * @param {string} tenantId
 * @param {string} [identityKey] - the authenticating person's own per-person identity (GitHub login, Google sub, or email) -- distinct from tenantId whenever a tenant is shared by 2+ people (e.g. a TENANT_ORG_ALLOWLIST-matched GitHub org)
 * @param {string} [provider] - 'github', 'google', or 'email' (rtri-s4)
 * @returns {Promise<string>}
 */
async function getRoleForTenant(tenantId, identityKey, provider) {
  if (_getRoleForTenant) {
    return _getRoleForTenant(tenantId, identityKey, provider);
  }
  if (_getUserRole) {
    return _getUserRole(tenantId);
  }
  throw new Error('Adapter not wired: getRoleForTenant. Call setGetRoleForTenant() with a real implementation before use.');
}
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rtri-s4-identity-backfill.js
```

Expected output: `[rtri-s4] 6 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same baseline. Pay particular attention to `tests/check-tir-s1*.js`, `tests/check-tir-s7*.js`, `tests/check-tir-s9*.js` and any other test exercising `resolveRoleForPerson`/`getRoleForTenant` directly — this change must not alter their behaviour.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/user-roles.js tests/check-rtri-s4-identity-backfill.js
git commit -m "feat(rtri-s4): extend resolveRoleForPerson/getRoleForTenant with optional provider arg, backward-compatible"
```

---

## Task 3: AC1's remaining 2 call shapes (Google, email sign-in) — AC2 end-to-end proof

**Files:**
- Modify: `tests/check-rtri-s4-identity-backfill.js`

No production code change — Task 2's implementation already handles every call shape; this task adds the remaining test coverage the review's own LOW finding [1-L1]/[2-L1] required (4 separate call-site cases, not one standing in for all four), plus AC2's direct end-to-end proof.

- [ ] **Step 1: Write the failing tests**

Add these test functions after `testOmittedProviderSkipsBackfill`:

```javascript
// ─────────────────────────────────────────────────────────────────────────────
// AC1 (google shape) and AC1 (email sign-in shape)
// ─────────────────────────────────────────────────────────────────────────────

async function testResolveRoleForPersonBackfillsGoogleShape() {
  var userRoles = freshRequire(USER_ROLES_PATH);
  var pool = makeFakePool();
  pool._seedFallbackResolvable('acme');

  await userRoles.resolveRoleForPerson(pool, 'acme', 'acme', 'google');

  var state = pool._state();
  assert.strictEqual(state.personIdentities.length, 1, 'AC1 (google): a person_identities row was backfilled');
  assert.strictEqual(state.personIdentities[0].provider, 'google', 'AC1 (google): the real provider was recorded');
}

async function testResolveRoleForPersonBackfillsEmailSignInShape() {
  var userRoles = freshRequire(USER_ROLES_PATH);
  var pool = makeFakePool();
  pool._seedFallbackResolvable('alice@example.com');

  // mirrors auth-email.js's real sign-in call shape: identityKey omitted,
  // resolveRoleForPerson receives tenantId as the 2nd (identityKey) arg from
  // getRoleForTenant's own identityKey-omitted fallback -- exercise that
  // exact omitted-identityKey path here, not just a supplied one.
  await userRoles.resolveRoleForPerson(pool, 'alice@example.com', 'alice@example.com', 'email');

  var state = pool._state();
  assert.strictEqual(state.personIdentities.length, 1, 'AC1 (email sign-in): a person_identities row was backfilled');
  assert.strictEqual(state.personIdentities[0].provider, 'email', 'AC1 (email sign-in): the real provider was recorded');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — backfilled identity becomes visible in listTeamMembers (rtri-s1)
// ─────────────────────────────────────────────────────────────────────────────

async function testBackfilledIdentityVisibleInRoster() {
  var userRoles = freshRequire(USER_ROLES_PATH);
  var teamManagement = freshRequire(TEAM_MANAGEMENT_PATH);
  var pool = makeFakePool();
  pool._seedFallbackResolvable('acme', 'engineer');

  var before = await teamManagement.listTeamMembers(pool, 'acme');
  assert.deepStrictEqual(before, [], 'AC2: before the fix runs, the roster is empty -- exactly the live-verified wuce-staging gap');

  // simulate the person's next login
  await userRoles.resolveRoleForPerson(pool, 'acme', 'acme', 'github');

  var after = await teamManagement.listTeamMembers(pool, 'acme');
  assert.deepStrictEqual(after, [{ identity: 'acme', role: 'engineer' }], 'AC2: after the next login, the real membership is now visible in the roster');
}
```

Add the calls to `main()`, after the backward-compat block:

```javascript
  console.log('\nAC1 (google shape)');
  await test('AC1: resolveRoleForPerson backfills a real row for the Google OAuth call shape', testResolveRoleForPersonBackfillsGoogleShape);

  console.log('\nAC1 (email sign-in shape)');
  await test('AC1: resolveRoleForPerson backfills a real row for the email sign-in call shape', testResolveRoleForPersonBackfillsEmailSignInShape);

  console.log('\nAC2 — backfilled identity visible in roster');
  await test('AC2: a backfilled identity becomes visible in listTeamMembers, closing the live-verified gap', testBackfilledIdentityVisibleInRoster);
```

- [ ] **Step 2: Run test — must fail**

Trick question — these should already PASS, since Task 2's implementation is provider-agnostic (no per-provider branching) and `listTeamMembers` already exists (rtri-s1). Run:

```bash
node tests/check-rtri-s4-identity-backfill.js
```

If any of these 3 new tests fail, it means Task 2's implementation has a hidden provider-specific assumption or the AC2 wiring is broken — investigate before proceeding; do not simply mark them as "expected to already pass" without running them.

- [ ] **Step 3: (no implementation step — Task 2 already provides the code)**

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rtri-s4-identity-backfill.js
```

Expected output: `[rtri-s4] 9 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same baseline.

- [ ] **Step 6: Commit**

```bash
git add tests/check-rtri-s4-identity-backfill.js
git commit -m "test(rtri-s4): cover remaining AC1 call shapes (Google, email sign-in) and AC2's end-to-end proof"
```

---

## Task 4: Wire the real login call sites — AC1, AC5

**Files:**
- Modify: `src/web-ui/server.js`
- Modify: `src/web-ui/routes/auth.js`
- Modify: `src/web-ui/routes/auth-email.js`

No new tests — this task wires the already-tested logic (Tasks 1-3) into the 4 real production call sites. Verified by the full suite (no regressions in existing auth tests) and by `/verify-completion`'s route/handler E2E coverage check.

- [ ] **Step 1: (no new failing test — this task wires already-proven logic into production call sites)**

- [ ] **Step 2: (skipped — see Step 1)**

- [ ] **Step 3: Write the wiring**

In `src/web-ui/server.js`, find BOTH `setGetRoleForTenant(function(tenantId, identityKey) {` blocks (search for that exact string — there are 2: one using `_userRolesPool`, one using `_fakeTestDb`). Change EACH to:

```javascript
    setGetRoleForTenant(function(tenantId, identityKey, provider) {
      return resolveRoleForPerson(_userRolesPool, identityKey || tenantId, tenantId, provider);
    });
```

(For the second occurrence, keep `_fakeTestDb` in place of `_userRolesPool` — only add the `provider` parameter and forward it, do not change which pool each site uses.)

In `src/web-ui/routes/auth.js`, find the GitHub OAuth callback's role-resolution line (search for `req.session.role = await _userRoles.getRoleForTenant(req.session.tenantId, user.login);`) and change it to:

```javascript
      req.session.role = await _userRoles.getRoleForTenant(req.session.tenantId, user.login, 'github');
```

Find the Google OAuth callback's role-resolution line (search for `req.session.role = await _userRoles.getRoleForTenant(req.session.tenantId, userInfo.sub);`) and change it to:

```javascript
      req.session.role = await _userRoles.getRoleForTenant(req.session.tenantId, userInfo.sub, 'google');
```

In `src/web-ui/routes/auth-email.js`, find BOTH `req.session.role = await _userRoles.getRoleForTenant(email);` lines (sign-up and sign-in — search for that exact string, there are 2) and change EACH to:

```javascript
    req.session.role = await _userRoles.getRoleForTenant(email, email, 'email');
```

- [ ] **Step 4: Run this story's own test file — must still pass**

```bash
node tests/check-rtri-s4-identity-backfill.js
```

Expected output: `[rtri-s4] 9 passed, 0 failed` (unchanged from Task 3 — this task only wires production call sites, not test-facing logic).

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same baseline (699 files, 1 pre-existing failure). This is the most important full-suite run in this story — it touches 5 files including the 2 real login route files. Pay close attention to EVERY test file with "auth" in its name, and re-run the specific `grep -rn "req\.session\.token[^A]" src/web-ui/` check from the DoR to confirm zero real matches (the auth-patterns.md rule).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js src/web-ui/routes/auth.js src/web-ui/routes/auth-email.js
git commit -m "feat(rtri-s4): wire the identity backfill into all 4 real login call sites"
```

---

## Final check before /verify-completion

- [ ] All 9 tests in `tests/check-rtri-s4-identity-backfill.js` pass
- [ ] `node scripts/run-all-tests.js` shows no NEW failures beyond the acknowledged baseline
- [ ] `grep -rn "req\.session\.token[^A]" src/web-ui/` returns zero real matches (auth-patterns.md)
- [ ] Walk through `artefacts/2026-09-23-team-roster-integration/verification-scripts/rtri-s4-verification.md` manually (live server, real sign-in/sign-out) before opening the PR — and, given the operator's own established practice this session, consider a real live re-check on `wuce-staging.fly.dev` matching the one that found this gap in the first place
