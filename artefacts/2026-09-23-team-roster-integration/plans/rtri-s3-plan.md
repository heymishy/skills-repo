# Render a real member list on /team/members — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Extend `handleGetTeamMembers` to render a real member list (identity + role) above the existing add-teammate form, reusing `rtri-s1`'s `listTeamMembers` directly server-side, with an explicit empty state and `escHtml()`-escaped values throughout.
**Branch:** `feature/rtri-s3`
**Worktree:** `.worktrees/rtri-s3`
**Test command:** `node scripts/run-all-tests.js` (full suite); `node tests/check-rtri-s3-team-members-list.js` (this story's own suite)

---

## File map

```
Create:
  tests/check-rtri-s3-team-members-list.js  — verifies AC1-AC5 for the real member list on /team/members

Modify:
  src/web-ui/routes/team-management.js      — handleGetTeamMembers renders a real member list (via teamManagement.listTeamMembers) above the existing add-teammate form, with an explicit empty state and escHtml()-escaped identity/role values
```

No other file changes. `teamManagement` (`../modules/team-management`) and `htmlShell` (`../utils/html-shell`) are already required at the top of `team-management.js` — no new imports needed. `handleGetTeamMembers` is a nested function inside `createTeamManagementHandlers(pool)`, so `pool` is already in scope.

---

## Task 1: Render the real member list — happy path and empty state (AC1, AC2)

**Files:**
- Modify: `src/web-ui/routes/team-management.js`
- Create: `tests/check-rtri-s3-team-members-list.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/check-rtri-s3-team-members-list.js` with this exact content:

```javascript
#!/usr/bin/env node
// check-rtri-s3-team-members-list.js — rtri-s3
// Verifies /team/members renders a real member list above the existing
// add-teammate form. Follows this repo's hand-rolled test()/assert style
// (see tests/check-rtri-s1-team-roster-api.js, check-tir-s3-admin-adds-teammate.js).
//
// AC1: rendered HTML contains a row per real member, showing identity + role
// AC2: zero-member tenant shows an explicit empty state
// AC3: a newly-added member appears on the very next render -- live data, not stale
// AC4: tenant isolation -- only the viewing tenant's members are shown
// AC5: a real identity string with HTML-significant characters is escaped via escHtml()

'use strict';

process.env.NODE_ENV = 'test';

var assert = require('assert');
var path = require('path');
var { JSDOM } = require('jsdom');

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

var TEAM_MANAGEMENT_ROUTE_PATH = path.resolve(ROOT, 'src/web-ui/routes/team-management.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

function mockReq(overrides) {
  return Object.assign({
    session: {},
    sessionId: 'test-sid-' + Math.random().toString(36).slice(2),
    query: {},
    headers: {},
    body: undefined
  }, overrides || {});
}

function mockRes() {
  var r = { statusCode: null, body: '', headers: {} };
  r.writeHead = function(code, hdrs) { r.statusCode = code; Object.assign(r.headers, hdrs || {}); };
  r.end = function(b) { r.body = (b != null ? String(b) : ''); r._ended = true; };
  return r;
}

// ── Narrow, self-contained in-memory fake pool ──────────────────────────────
// Mirrors check-rtri-s1-team-roster-api.js's own makeFakePool convention for
// the listTeamMembers JOIN query. Extended in Task 3 with
// check-tir-s3-admin-adds-teammate.js's addOrUpdateTeammate query shapes for
// AC3's live-data integration test.
function _norm(sql) {
  return String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
}

function makeFakePool() {
  var teamMemberships = []; // { person_id, tenant_id, role }
  var personIdentities = []; // { identity_key, person_id }
  var nextPersonId = 1;

  function query(sql, params) {
    var s = _norm(sql);
    var p = params || [];

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

    // Any other query (e.g. products/journeys nav-summary queries from
    // renderShellWithNav) is irrelevant to this story -- empty rows matches
    // this repo's own established fake-pool convention.
    return Promise.resolve({ rows: [] });
  }

  // Test-setup helper (not a production query shape) -- seeds a fully
  // resolvable member directly, bypassing SQL. Mirrors
  // check-rtri-s1-team-roster-api.js's own _seedMember convention exactly.
  function _seedMember(tenantId, personId, role, identityKey) {
    teamMemberships.push({ person_id: personId, tenant_id: tenantId, role: role });
    if (identityKey !== null) {
      personIdentities.push({ identity_key: identityKey, person_id: personId });
    }
  }

  function _nextPersonId() { return nextPersonId++; }

  return { query: query, _seedMember: _seedMember, _nextPersonId: _nextPersonId };
}

function parseListItems(html) {
  var dom = new JSDOM(html);
  return Array.from(dom.window.document.querySelectorAll('li')).map(function(li) { return li.textContent; });
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — rendered HTML contains a row per real member, showing identity + role
// ─────────────────────────────────────────────────────────────────────────────

async function testAC1RendersRowPerRealMember() {
  var route = freshRequire(TEAM_MANAGEMENT_ROUTE_PATH);
  var pool = makeFakePool();
  var handlers = route.createTeamManagementHandlers(pool);

  var aliceId = pool._nextPersonId();
  pool._seedMember('tenant-a', aliceId, 'engineer', 'alice@example.com');
  var bobId = pool._nextPersonId();
  pool._seedMember('tenant-a', bobId, 'admin', 'bob-gh');

  var req = mockReq({ session: { tenantId: 'tenant-a' } });
  var res = mockRes();
  await handlers.handleGetTeamMembers(req, res);

  assert.strictEqual(res.statusCode, 200, 'AC1: page renders successfully');
  var items = parseListItems(res.body);
  assert.strictEqual(items.length, 2, 'AC1: rendered HTML contains one row per real member');
  assert.ok(items.some(function(t) { return t.indexOf('alice@example.com') !== -1 && t.indexOf('engineer') !== -1; }), 'AC1: alice is shown with her real identity and role');
  assert.ok(items.some(function(t) { return t.indexOf('bob-gh') !== -1 && t.indexOf('admin') !== -1; }), 'AC1: bob is shown with his real identity and role');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — zero-member tenant shows an explicit empty state
// ─────────────────────────────────────────────────────────────────────────────

async function testAC2ShowsExplicitEmptyStateForZeroMembers() {
  var route = freshRequire(TEAM_MANAGEMENT_ROUTE_PATH);
  var pool = makeFakePool();
  var handlers = route.createTeamManagementHandlers(pool);

  var req = mockReq({ session: { tenantId: 'tenant-a' } });
  var res = mockRes();
  await handlers.handleGetTeamMembers(req, res);

  assert.strictEqual(res.statusCode, 200, 'AC2: page still renders successfully with zero members');
  assert.ok(/no team members yet/i.test(res.body), 'AC2: an explicit empty-state message is shown');
  assert.ok(res.body.indexOf('<form') !== -1, 'AC2: the existing add-teammate form still renders (Architecture Constraints: form unaffected)');
  var items = parseListItems(res.body);
  assert.strictEqual(items.length, 0, 'AC2: no member rows are rendered');
}

// ─────────────────────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n[rtri-s3] Running AC verification tests...\n');

  console.log('AC1 — rendered HTML contains a row per real member');
  await test('AC1: handleGetTeamMembers renders a row for each real member with identity and role', testAC1RendersRowPerRealMember);

  console.log('\nAC2 — zero-member tenant shows an explicit empty state');
  await test('AC2: handleGetTeamMembers shows an explicit empty state for a tenant with no members', testAC2ShowsExplicitEmptyStateForZeroMembers);

  console.log('\n[rtri-s3] ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    console.error('\nFailures:');
    failures.forEach(function(f) { console.error('  - ' + f.name); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[rtri-s3] Unexpected error:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rtri-s3-team-members-list.js
```

Expected output: both tests FAIL — `handleGetTeamMembers` does not yet call `listTeamMembers` or render any `<li>` rows; `AC1` fails on `items.length` (0, not 2) and `AC2` fails on the "no team members yet" regex not matching (the current handler renders only the form, no list/empty-state text at all).

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/team-management.js`, replace the existing `handleGetTeamMembers` function body (inside `createTeamManagementHandlers(pool)`, currently starting at the `async function handleGetTeamMembers(req, res) {` line) with:

```javascript
  async function handleGetTeamMembers(req, res) {
    // rtri-s3: real member list, rendered above the existing add-teammate
    // form (AC1/AC2). Reuses rtri-s1's listTeamMembers directly, server-side
    // -- this page is already server-rendered, no new client-side fetch
    // needed for this story (ADR-026).
    var tenantId = req.session && req.session.tenantId;
    var members = await teamManagement.listTeamMembers(pool, tenantId);

    var memberListHtml;
    if (members.length === 0) {
      memberListHtml = '<p>No team members yet.</p>';
    } else {
      memberListHtml = '<ul>' + members.map(function(m) {
        return '<li>' + htmlShell.escHtml(m.identity) + ' — ' + htmlShell.escHtml(m.role) + '</li>';
      }).join('') + '</ul>';
    }

    var roleOptions = teamManagement.VALID_ROLES.map(function(r) {
      return '<option value="' + htmlShell.escHtml(r) + '">' + htmlShell.escHtml(r) + '</option>';
    }).join('');

    // sec-perf-s3 AC2: session-scoped CSRF token, embedded in the add-teammate form below.
    var csrfToken = await csrf.generateCsrfToken(req);

    var bodyContent = '<h1>Team members</h1>' +
      memberListHtml +
      '<form method="POST" action="/api/team/members">' +
      csrf.csrfField(csrfToken) +
      '<label for="identity">Add teammate by identity (GitHub login, Google email, or email/password email)</label>' +
      '<input id="identity" name="identity" type="text" required>' +
      '<label for="role">Role</label>' +
      '<select id="role" name="role" required>' + roleOptions + '</select>' +
      '<button type="submit">Add teammate</button>' +
      '</form>';

    // pncg-s1 (AC2): wrap via the shared Products-nav helper (instead of
    // htmlShell.renderShell directly) so the persistent Products sidebar
    // section, previously silently dropped on this page, is present.
    var html = await renderShellWithNav(pool, req.session && req.session.tenantId, {
      title: 'Team members',
      bodyContent: bodyContent,
      user: req.session,
      active: 'team-members',
      crumbs: ['Team members'],
      isAdmin: true
    });

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }
```

This is the only change to this file for Task 1 — `roleOptions`, `csrfToken`, the form markup, and the `renderShellWithNav` call are unchanged from the existing code, just reordered around the new `memberListHtml` variable. `teamManagement` and `htmlShell` are already required at the top of the file (lines 10, 16) — no new imports.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rtri-s3-team-members-list.js
```

Expected output:
```
[rtri-s3] Running AC verification tests...

AC1 — rendered HTML contains a row per real member
  [PASS] AC1: handleGetTeamMembers renders a row for each real member with identity and role

AC2 — zero-member tenant shows an explicit empty state
  [PASS] AC2: handleGetTeamMembers shows an explicit empty state for a tenant with no members

[rtri-s3] 2 passed, 0 failed
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing except the 2 established pre-existing/environmental failures acknowledged at `/branch-setup` (`tests/check-p3.5-validate-trace.js`, `tests/check-pcr-s1-test-runner.js`) — no new failures, and specifically `tests/check-tir-s3-admin-adds-teammate.js` and `tests/check-wsi-s6-invite-creation-ui.js` (the other two test files touching `team-management.js`'s route file) still pass unmodified.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/team-management.js tests/check-rtri-s3-team-members-list.js
git commit -m "feat(rtri-s3): render a real member list above the add-teammate form (AC1, AC2)"
```

---

## Task 2: Security and tenant-isolation fixtures against the same handler (AC4, AC5)

No production code changes in this task — both tests exercise the handler Task 1 already implemented, with different fixtures.

**Files:**
- Modify: `tests/check-rtri-s3-team-members-list.js`

- [ ] **Step 1: Write the failing tests**

Insert these two functions into `tests/check-rtri-s3-team-members-list.js`, directly after `testAC2ShowsExplicitEmptyStateForZeroMembers` and before the `// Runner` section:

```javascript
// ─────────────────────────────────────────────────────────────────────────────
// AC5 — a real identity string with HTML-significant characters is escaped
// ─────────────────────────────────────────────────────────────────────────────

async function testAC5IdentityWithHtmlCharsIsEscaped() {
  var route = freshRequire(TEAM_MANAGEMENT_ROUTE_PATH);
  var pool = makeFakePool();
  var handlers = route.createTeamManagementHandlers(pool);

  var evilId = pool._nextPersonId();
  pool._seedMember('tenant-a', evilId, 'engineer', '<img src=x onerror=alert(1)>');

  var req = mockReq({ session: { tenantId: 'tenant-a' } });
  var res = mockRes();
  await handlers.handleGetTeamMembers(req, res);

  assert.strictEqual(res.body.indexOf('<img src=x onerror=alert(1)>'), -1, 'AC5: the raw payload string never appears unescaped');
  assert.ok(res.body.indexOf('&lt;img src=x onerror=alert(1)&gt;') !== -1, 'AC5: the payload appears in its escHtml()-encoded form');

  var dom = new JSDOM(res.body);
  assert.strictEqual(dom.window.document.querySelectorAll('img').length, 0, 'AC5: the payload never parses into a real <img> element');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — tenant isolation: another tenant's members never appear
// ─────────────────────────────────────────────────────────────────────────────

async function testAC4NeverIncludesAnotherTenantsMembers() {
  var route = freshRequire(TEAM_MANAGEMENT_ROUTE_PATH);
  var pool = makeFakePool();
  var handlers = route.createTeamManagementHandlers(pool);

  var aliceId = pool._nextPersonId();
  pool._seedMember('tenant-a', aliceId, 'engineer', 'alice@example.com');
  var carolId = pool._nextPersonId();
  pool._seedMember('tenant-b', carolId, 'engineer', 'carol@example.com');

  var req = mockReq({ session: { tenantId: 'tenant-a' } });
  var res = mockRes();
  await handlers.handleGetTeamMembers(req, res);

  assert.ok(res.body.indexOf('alice@example.com') !== -1, "AC4: tenant-a's own member is shown");
  assert.strictEqual(res.body.indexOf('carol@example.com'), -1, "AC4: tenant-b's member never appears in tenant-a's rendered response");
}
```

Also add these two lines into the `main()` function, between the AC2 block and the `// Runner` results summary:

```javascript
  console.log('\nAC5 — real identity string with HTML-significant characters');
  await test('AC5: a real identity string with HTML-significant characters is never interpreted as markup', testAC5IdentityWithHtmlCharsIsEscaped);

  console.log('\nAC4 — tenant isolation');
  await test('AC4: handleGetTeamMembers never includes another tenant\'s members', testAC4NeverIncludesAnotherTenantsMembers);
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rtri-s3-team-members-list.js
```

Expected output: `4 passed, 0 failed` is NOT yet expected here — both new tests should already PASS immediately, since Task 1's implementation already escapes via `escHtml()` and already scopes the JOIN query by `tenant_id`. This task adds regression-proof coverage for behaviour Task 1 already delivers; if either new test fails, investigate Task 1's implementation before proceeding (it would mean AC4 or AC5 was not actually satisfied by Task 1's code, contrary to expectation).

- [ ] **Step 3: Write minimal implementation**

None — no production code changes for this task. (Per Step 2 above: both tests are expected to pass immediately against Task 1's already-committed implementation.)

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rtri-s3-team-members-list.js
```

Expected output:
```
[rtri-s3] Running AC verification tests...

AC1 — rendered HTML contains a row per real member
  [PASS] AC1: handleGetTeamMembers renders a row for each real member with identity and role

AC2 — zero-member tenant shows an explicit empty state
  [PASS] AC2: handleGetTeamMembers shows an explicit empty state for a tenant with no members

AC5 — real identity string with HTML-significant characters
  [PASS] AC5: a real identity string with HTML-significant characters is never interpreted as markup

AC4 — tenant isolation
  [PASS] AC4: handleGetTeamMembers never includes another tenant's members

[rtri-s3] 4 passed, 0 failed
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing except the same 2 established pre-existing/environmental failures.

- [ ] **Step 6: Commit**

```bash
git add tests/check-rtri-s3-team-members-list.js
git commit -m "test(rtri-s3): tenant-isolation and XSS-escaping regression coverage (AC4, AC5)"
```

---

## Task 3: Live-data integration proof (AC3)

**Files:**
- Modify: `tests/check-rtri-s3-team-members-list.js`

- [ ] **Step 1: Write the failing test**

First, extend `makeFakePool`'s `query` function in `tests/check-rtri-s3-team-members-list.js` to support `addOrUpdateTeammate`'s own query shapes (needed to drive the real write path in this task's test). Insert these branches directly after the existing `SELECT TM.ROLE, PI.IDENTITY_KEY ...` branch and before the final `return Promise.resolve({ rows: [] });` fallback:

```javascript
    if (s.indexOf('SELECT PERSON_ID FROM PERSON_IDENTITIES WHERE IDENTITY_KEY') === 0) {
      var match = personIdentities.filter(function(r) { return r.identity_key === p[0]; });
      return Promise.resolve({ rows: match.length ? [{ person_id: match[0].person_id }] : [] });
    }

    if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0 && s.indexOf('AND PERSON_ID') !== -1) {
      var existingRow = teamMemberships.filter(function(r) { return r.person_id === p[1] && r.tenant_id === p[0]; })[0];
      return Promise.resolve({ rows: existingRow ? [{ role: existingRow.role }] : [] });
    }

    if (s.indexOf('INSERT INTO TEAM_MEMBERSHIPS') === 0 && s.indexOf('ON CONFLICT') !== -1) {
      var personId = p[0], tenantId2 = p[1], role = p[2];
      var existing = teamMemberships.filter(function(r) { return r.person_id === personId && r.tenant_id === tenantId2; })[0];
      if (existing) { existing.role = role; } else { teamMemberships.push({ person_id: personId, tenant_id: tenantId2, role: role }); }
      return Promise.resolve({ rows: [] });
    }
```

Then add a second seeding helper, directly after the existing `_seedMember` function definition (still inside `makeFakePool`, before the `return { query: ..., _seedMember: ..., _nextPersonId: ... };` line):

```javascript
  // Test-setup helper (not a production query shape) -- seeds a person who
  // is already resolvable (has a person_identities row, i.e. has logged in
  // at least once) but is NOT yet a member of any tenant. Matches AC3's own
  // precondition: addOrUpdateTeammate's resolution step must succeed, but
  // there must be no pre-existing team_memberships row.
  function _seedResolvablePersonOnly(personId, identityKey) {
    personIdentities.push({ identity_key: identityKey, person_id: personId });
  }
```

Update the `return` statement at the end of `makeFakePool` to also export the new helper:

```javascript
  return { query: query, _seedMember: _seedMember, _nextPersonId: _nextPersonId, _seedResolvablePersonOnly: _seedResolvablePersonOnly };
```

Then insert this test function directly after `testAC4NeverIncludesAnotherTenantsMembers` and before the `// Runner` section:

```javascript
// ─────────────────────────────────────────────────────────────────────────────
// AC3 — a newly-added member appears on the very next render, no stale snapshot
// ─────────────────────────────────────────────────────────────────────────────

async function testAC3NewlyAddedMemberAppearsOnNextRenderNoStaleSnapshot() {
  var route = freshRequire(TEAM_MANAGEMENT_ROUTE_PATH);
  var teamManagementModule = freshRequire(path.resolve(ROOT, 'src/web-ui/modules/team-management.js'));
  var pool = makeFakePool();
  var handlers = route.createTeamManagementHandlers(pool);

  // Precondition: alice already resolvable (has logged in once via person_identities)
  // but not yet a member of tenant-a.
  var aliceId = pool._nextPersonId();
  pool._seedResolvablePersonOnly(aliceId, 'alice@example.com');

  var req = mockReq({ session: { tenantId: 'tenant-a' } });

  var resBefore = mockRes();
  await handlers.handleGetTeamMembers(req, resBefore);
  assert.ok(/no team members yet/i.test(resBefore.body), 'AC3 setup: the list is empty before the add');

  await teamManagementModule.addOrUpdateTeammate(pool, 'tenant-a', 'alice@example.com', 'engineer');

  var resAfter = mockRes();
  await handlers.handleGetTeamMembers(req, resAfter);
  assert.ok(resAfter.body.indexOf('alice@example.com') !== -1, 'AC3: the newly-added member appears on the very next render');
  assert.ok(resAfter.body.indexOf('engineer') !== -1, 'AC3: with their assigned role');
  assert.ok(!/no team members yet/i.test(resAfter.body), 'AC3: the empty-state message is gone once a real member exists');
}
```

Also add this line into `main()`, after the AC4 block and before the results summary:

```javascript
  console.log('\nAC3 — newly-added member appears on the very next render');
  await test('AC3: a newly-added teammate appears in the list on the very next render, no stale snapshot', testAC3NewlyAddedMemberAppearsOnNextRenderNoStaleSnapshot);
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rtri-s3-team-members-list.js
```

Expected output before this task's fake-pool extension is added correctly: the new test would fail at the `addOrUpdateTeammate` call with `UnknownIdentityError` (person not resolvable) if `_seedResolvablePersonOnly`/the new query branches are missing or wrong — confirming the test genuinely exercises the real write path rather than trivially passing.

- [ ] **Step 3: Write minimal implementation**

None — no production code changes for this task. `addOrUpdateTeammate` (`team-management.js`) and `listTeamMembers` (same file) are both pre-existing, unmodified functions; this task only extends test infrastructure to drive them together.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rtri-s3-team-members-list.js
```

Expected output:
```
[rtri-s3] Running AC verification tests...

AC1 — rendered HTML contains a row per real member
  [PASS] AC1: handleGetTeamMembers renders a row for each real member with identity and role

AC2 — zero-member tenant shows an explicit empty state
  [PASS] AC2: handleGetTeamMembers shows an explicit empty state for a tenant with no members

AC5 — real identity string with HTML-significant characters
  [PASS] AC5: a real identity string with HTML-significant characters is never interpreted as markup

AC4 — tenant isolation
  [PASS] AC4: handleGetTeamMembers never includes another tenant's members

AC3 — newly-added member appears on the very next render
  [PASS] AC3: a newly-added teammate appears in the list on the very next render, no stale snapshot

[rtri-s3] 5 passed, 0 failed
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing except the same 2 established pre-existing/environmental failures. `tests/check-tir-s3-admin-adds-teammate.js` (the real, unmodified `addOrUpdateTeammate` test suite) must still pass unmodified — this task calls the same real function, never changes it.

- [ ] **Step 6: Commit**

```bash
git add tests/check-rtri-s3-team-members-list.js
git commit -m "test(rtri-s3): live-data integration proof -- newly-added member appears on next render (AC3)"
```

---

## Final check before /verify-completion

1. Confirm `git diff --stat` across all 3 tasks touches exactly `src/web-ui/routes/team-management.js` and `tests/check-rtri-s3-team-members-list.js` — no other file.
2. Confirm no change to `handleAddTeammate`, the add-teammate form's markup/action, `team-invitations.js`, or `client-invitations.js` (Architecture Constraints, Out of Scope).
3. Live browser check on `wuce-staging.fly.dev` at `/verify-completion` / DoD if Chrome is available: confirm the member list renders correctly at a normal viewport, the empty state shows correctly for a zero-member tenant, and the list uses real `<ul>`/`<li>` markup (Accessibility NFR) — this story's NFR profile designates this as the DoD-time measurement method for Performance and Accessibility, matching `rtri-s1`/`rtri-s2`'s own established pattern. If Chrome remains unavailable, RISK-ACCEPT per the same pattern used for `rtri-s2`.
