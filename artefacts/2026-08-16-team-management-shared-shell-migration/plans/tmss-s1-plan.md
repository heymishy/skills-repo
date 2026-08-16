# Migrate team-management admin pages onto the shared HTML shell — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/tmss-s1`
**Worktree:** `.worktrees/tmss-s1`
**Test command:** `npm test`

---

## File map

```
Create:
  tests/check-tmss-s1-shared-shell-migration.js  — unit tests for AC1-AC4

Modify:
  src/web-ui/routes/team-management.js  — swap hand-rolled HTML wrapper + local
                                            _escapeHtml for html-shell.js's
                                            renderShell()/escHtml() in both
                                            handleGetTeamMembers and
                                            handleGetCreateInviteForm
```

---

## Task 1: Migrate `handleGetTeamMembers` to the shared shell (AC1)

**Files:**
- Modify: `src/web-ui/routes/team-management.js`
- Test: `tests/check-tmss-s1-shared-shell-migration.js` (create)

- [ ] **Step 1: Write the failing test**

Create `tests/check-tmss-s1-shared-shell-migration.js`:

```javascript
'use strict';
// check-tmss-s1-shared-shell-migration.js — tmss-s1
//
// Covers AC1 in this commit (AC2-AC4 added in Tasks 2-3 of this same story's plan).

var assert = require('assert');
var path = require('path');
var fs = require('fs');

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
var TEAM_MANAGEMENT_ROUTES_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'team-management'));

function mockReq() {
  return { session: { login: 'admin-user', tenantId: 'tenant-A', userId: 'admin-1', csrfToken: 'test-csrf-token' } };
}

function mockRes() {
  var _statusCode = null;
  var _headers = null;
  var _body = '';
  return {
    writeHead: function (code, headers) { _statusCode = code; _headers = headers; return this; },
    end: function (body) { if (body != null) _body = body; },
    _get: function () { return { statusCode: _statusCode, headers: _headers, body: _body }; }
  };
}

(async () => {

await checkAsyncOrSync('AC1: teamManagement_getTeamMembers_rendersViaSharedShell', async () => {
  var teamManagementRoutes = require(TEAM_MANAGEMENT_ROUTES_PATH);
  var handlers = teamManagementRoutes.createTeamManagementHandlers({});
  var req = mockReq();
  var res = mockRes();
  handlers.handleGetTeamMembers(req, res);
  var html = res._get().body;

  assert.ok(html.indexOf('class="sw-app"') !== -1, 'expected the shared shell wrapper (sw-app) to be present');
  assert.ok(html.indexOf('id="sw-sidebar"') !== -1, 'expected the shared shell sidebar to be present');
  assert.ok(html.indexOf('class="sw-main"') !== -1, 'expected the shared shell main content area to be present');
  assert.ok(/<main>[\s\S]*<label for="identity">[\s\S]*<\/main>/.test(html), 'expected the add-teammate form to be rendered inside <main>');
  assert.ok(/<input id="identity" name="identity" type="text" required>/.test(html), 'expected the identity input unchanged');
  assert.ok(/<label for="role">/.test(html) && /<select id="role" name="role" required>/.test(html), 'expected the role field unchanged');
  assert.ok(/<button type="submit">Add teammate<\/button>/.test(html), 'expected the submit button unchanged');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-tmss-s1-shared-shell-migration.js
```

Expected output: `FAIL: AC1: teamManagement_getTeamMembers_rendersViaSharedShell — expected the shared shell wrapper (sw-app) to be present` (the handler still builds its own bare HTML wrapper, no `sw-app` class exists yet)

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/team-management.js`:

1. Add the import near the top (after the existing `require` lines, before `_logger`):

```javascript
var htmlShell = require('../utils/html-shell');
```

2. Replace `handleGetTeamMembers`'s body (inside `createTeamManagementHandlers`) with:

```javascript
  function handleGetTeamMembers(req, res) {
    var roleOptions = teamManagement.VALID_ROLES.map(function(r) {
      return '<option value="' + htmlShell.escHtml(r) + '">' + htmlShell.escHtml(r) + '</option>';
    }).join('');

    // sec-perf-s3 AC2: session-scoped CSRF token, embedded in the add-teammate form below.
    var csrfToken = csrf.generateCsrfToken(req);

    var bodyContent = '<h1>Team members</h1>' +
      '<form method="POST" action="/api/team/members">' +
      csrf.csrfField(csrfToken) +
      '<label for="identity">Add teammate by identity (GitHub login, Google email, or email/password email)</label>' +
      '<input id="identity" name="identity" type="text" required>' +
      '<label for="role">Role</label>' +
      '<select id="role" name="role" required>' + roleOptions + '</select>' +
      '<button type="submit">Add teammate</button>' +
      '</form>';

    var html = htmlShell.renderShell({
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

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-tmss-s1-shared-shell-migration.js
```

Expected output: `PASS: AC1: teamManagement_getTeamMembers_rendersViaSharedShell` — `1 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same 33 pre-existing failures as the branch-setup baseline (`tests/check-bee3-posthog.js`, `tests/check-mfc1/mfc2-*.js`, `tests/check-ougl*.js`, etc. — see `decisions.md`'s branch-setup RISK-ACCEPT entry), plus the new `check-tmss-s1-shared-shell-migration.js` passing. No new failures beyond the known 33.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/team-management.js tests/check-tmss-s1-shared-shell-migration.js
git commit -m "refactor: migrate handleGetTeamMembers to shared HTML shell"
```

---

## Task 2: Migrate `handleGetCreateInviteForm` to the shared shell (AC2)

**Files:**
- Modify: `src/web-ui/routes/team-management.js`
- Test: `tests/check-tmss-s1-shared-shell-migration.js` (append)

- [ ] **Step 1: Write the failing test**

Append to `tests/check-tmss-s1-shared-shell-migration.js`, inside the `(async () => { ... })()` block, after the AC1 test and before the `console.log('\n' + passed ...` line:

```javascript
await checkAsyncOrSync('AC2: teamManagement_getCreateInviteForm_rendersViaSharedShell', async () => {
  var teamManagementRoutes = require(TEAM_MANAGEMENT_ROUTES_PATH);
  var handlers = teamManagementRoutes.createTeamManagementHandlers({});
  var req = mockReq();
  var res = mockRes();
  handlers.handleGetCreateInviteForm(req, res);
  var html = res._get().body;

  assert.ok(html.indexOf('class="sw-app"') !== -1, 'expected the shared shell wrapper (sw-app) to be present');
  assert.ok(html.indexOf('id="sw-sidebar"') !== -1, 'expected the shared shell sidebar to be present');
  assert.ok(html.indexOf('class="sw-main"') !== -1, 'expected the shared shell main content area to be present');
  assert.ok(/<main>[\s\S]*<label for="email">[\s\S]*<\/main>/.test(html), 'expected the invite form to be rendered inside <main>');
  assert.ok(/<input id="email" name="email" type="email" required>/.test(html), 'expected the email input unchanged');
  assert.ok(/<label for="role">/.test(html) && /<select id="role" name="role" required>/.test(html), 'expected the role field unchanged');
  assert.ok(/<button type="submit">Send invite<\/button>/.test(html), 'expected the submit button unchanged');
  assert.ok(/<form method="POST" action="\/api\/team\/invites">/.test(html), 'expected the form to still POST to the unchanged /api/team/invites endpoint');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-tmss-s1-shared-shell-migration.js
```

Expected output: `FAIL: AC2: teamManagement_getCreateInviteForm_rendersViaSharedShell — expected the shared shell wrapper (sw-app) to be present` (this handler still builds its own bare HTML wrapper)

- [ ] **Step 3: Write minimal implementation**

Replace `handleGetCreateInviteForm`'s body with:

```javascript
  function handleGetCreateInviteForm(req, res) {
    var roleOptions = teamManagement.VALID_ROLES.map(function(r) {
      return '<option value="' + htmlShell.escHtml(r) + '">' + htmlShell.escHtml(r) + '</option>';
    }).join('');

    var csrfToken = csrf.generateCsrfToken(req);

    var bodyContent = '<h1>Invite a teammate</h1>' +
      '<form method="POST" action="/api/team/invites">' +
      csrf.csrfField(csrfToken) +
      '<label for="email">Email</label>' +
      '<input id="email" name="email" type="email" required>' +
      '<label for="role">Role</label>' +
      '<select id="role" name="role" required>' + roleOptions + '</select>' +
      '<button type="submit">Send invite</button>' +
      '</form>';

    var html = htmlShell.renderShell({
      title: 'Invite a teammate',
      bodyContent: bodyContent,
      user: req.session,
      active: 'team-members',
      crumbs: ['Team members', 'Invite a teammate'],
      isAdmin: true
    });

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-tmss-s1-shared-shell-migration.js
```

Expected output: `2 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same 33 pre-existing failures, plus `check-tmss-s1-shared-shell-migration.js` passing (2/2).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/team-management.js tests/check-tmss-s1-shared-shell-migration.js
git commit -m "refactor: migrate handleGetCreateInviteForm to shared HTML shell"
```

---

## Task 3: Remove `_escapeHtml`, prove no escaping regression, confirm CSRF unchanged (AC3, AC4)

**Files:**
- Modify: `src/web-ui/routes/team-management.js`
- Test: `tests/check-tmss-s1-shared-shell-migration.js` (append)

- [ ] **Step 1: Write the failing test**

**Note (see `decisions.md`, 2026-08-16 CORRECTION entry):** the original test-plan design for AC3 proposed checking a `"`-containing CSRF token renders escaped — this is wrong, because `middleware/csrf.js`'s `csrfField()` already does its own independent internal escaping regardless of what `team-management.js` does. The real call site to test is where `_escapeHtml`/`escHtml` wraps `VALID_ROLES` values when building `<option>` tags. `VALID_ROLES` (`modules/team-management.js`) is a plain, non-frozen, directly-exported array — the test temporarily pushes a crafted value into it, asserts on the render, then restores the array.

Append to `tests/check-tmss-s1-shared-shell-migration.js`:

```javascript
await checkAsyncOrSync('AC3: teamManagement_escapeHtmlRemoved_escHtmlUsedNoRegression', async () => {
  var src = fs.readFileSync(TEAM_MANAGEMENT_ROUTES_PATH, 'utf8');
  assert.ok(!/function _escapeHtml/.test(src), 'expected the locally-defined _escapeHtml function to be removed entirely');
  assert.ok(!/\b_escapeHtml\(/.test(src), 'expected no remaining call sites of the removed _escapeHtml function');

  var teamManagementRoutes = require(TEAM_MANAGEMENT_ROUTES_PATH);
  var teamManagement = require(path.join(ROOT, 'src', 'web-ui', 'modules', 'team-management'));
  var handlers = teamManagementRoutes.createTeamManagementHandlers({});

  var maliciousRole = '"><script>bad</script>';
  teamManagement.VALID_ROLES.push(maliciousRole);
  try {
    var req = mockReq();
    var res = mockRes();
    handlers.handleGetTeamMembers(req, res);
    var html = res._get().body;

    assert.ok(html.indexOf('<script>bad</script>') === -1, 'expected the malicious role value to NOT appear unescaped in the rendered HTML');
    assert.ok(html.indexOf(htmlShellEscape(maliciousRole)) !== -1, 'expected the malicious role value to appear HTML-escaped');
  } finally {
    teamManagement.VALID_ROLES.pop();
  }
});

await checkAsyncOrSync('AC4: teamManagement_csrfFieldUnchangedInBothForms', async () => {
  var teamManagementRoutes = require(TEAM_MANAGEMENT_ROUTES_PATH);
  var handlers = teamManagementRoutes.createTeamManagementHandlers({});

  var req1 = mockReq();
  var res1 = mockRes();
  handlers.handleGetTeamMembers(req1, res1);
  var html1 = res1._get().body;
  assert.ok(/<input type="hidden" name="_csrf" value="test-csrf-token">/.test(html1), 'expected an unchanged CSRF hidden field on /team/members');

  var req2 = mockReq();
  var res2 = mockRes();
  handlers.handleGetCreateInviteForm(req2, res2);
  var html2 = res2._get().body;
  assert.ok(/<input type="hidden" name="_csrf" value="test-csrf-token">/.test(html2), 'expected an unchanged CSRF hidden field on /team/invites/new');
});
```

Add this small helper near the top of the file, alongside `mockReq`/`mockRes` (mirrors `html-shell.js`'s own `escHtml` exactly, kept local to the test file so the test does not depend on requiring `html-shell.js` just to compute an expected string):

```javascript
function htmlShellEscape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-tmss-s1-shared-shell-migration.js
```

Expected output: `FAIL: AC3: teamManagement_escapeHtmlRemoved_escHtmlUsedNoRegression — expected the locally-defined _escapeHtml function to be removed entirely` (it still exists at this point in the plan — Tasks 1-2 swapped the call sites to `htmlShell.escHtml` already used at each site, but the now-dead `_escapeHtml` function definition itself has not been deleted yet)

- [ ] **Step 3: Write minimal implementation**

Delete the `_escapeHtml` function definition entirely from `src/web-ui/routes/team-management.js` (the block starting `function _escapeHtml(s) {` through its closing `}`, currently between the `csrf`/`_posthog` requires and `_readBody`).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-tmss-s1-shared-shell-migration.js
```

Expected output: `4 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same 33 pre-existing failures, plus `check-tmss-s1-shared-shell-migration.js` passing (4/4). No new failures.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/team-management.js tests/check-tmss-s1-shared-shell-migration.js
git commit -m "refactor: remove dead _escapeHtml, verify no escaping regression and unchanged CSRF field"
```

---

## Task 4: Open draft PR

- [ ] **Step 1:** Confirm all 4 unit tests pass and the full suite shows only the known 33 pre-existing failures (no new ones).
- [ ] **Step 2:** Push the branch and open a draft PR (handled by `/branch-complete`, not this plan).
