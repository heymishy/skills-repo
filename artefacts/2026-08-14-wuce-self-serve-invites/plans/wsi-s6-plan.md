# Implementation Plan: Admin has a real, reachable form to create a team invite (wsi-s6)

**Story:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s6-invite-creation-ui.md
**Test plan:** artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s6-invite-creation-ui-test-plan.md
**DoR:** artefacts/2026-08-14-wuce-self-serve-invites/dor/wsi-s6-dor.md
**Worktree:** `.worktrees/wsi-s6`, branch `feature/wsi-s6`

## File map

- **Modify:** `src/web-ui/routes/team-management.js` — add `handleGetCreateInviteForm`, exported from `createTeamManagementHandlers`
- **Modify:** `src/web-ui/server.js` — mount `GET /team/invites/new` behind `requireAdmin`
- **Modify:** `tests/check-d2-banner-exit-permission-visibility.js`, `tests/check-d4-nfr-security-review-and-hardening.js` — bump the hardcoded `requireAdmin(` call-site count 13→14 (budgeted upfront per the test plan's own note — the same update `wsi-s1` already made once for its own new route)
- **Create:** `tests/check-wsi-s6-invite-creation-ui.js` — all 4 tests (AC1–AC4)

**Reference precedent read in full before writing this plan:** `handleGetTeamMembers` (`routes/team-management.js:74-96`, the exact rendering pattern this story reuses verbatim), `server.js`'s `GET /team/members` route block (`server.js:2989-2999`, the exact `requireAdmin` wiring pattern this story mirrors), `middleware/csrf.js`'s `csrfField` (`<input type="hidden" name="_csrf" value="...">`).

---

## Task 1: Form renders with labelled inputs, role options, and a real submit button (AC1, AC4)

**Files:**
- Modify: `src/web-ui/routes/team-management.js`
- Modify: `src/web-ui/server.js`
- Create: `tests/check-wsi-s6-invite-creation-ui.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/check-wsi-s6-invite-creation-ui.js`:

```javascript
'use strict';
// check-wsi-s6-invite-creation-ui.js — wsi-s6
//
// Covers AC1, AC4 in this commit (AC2-AC3 added in Task 2 of this same
// story's plan).

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
var SERVER_PATH = path.resolve(ROOT, 'src', 'web-ui', 'server.js');

function mockReq() {
  return { session: { tenantId: 'tenant-A', userId: 'admin-1', csrfToken: 'test-csrf-token' } };
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

await checkAsyncOrSync('AC1: getCreateInviteForm_rendersLabelledFormWithRoleOptionsAndSubmitButton', async () => {
  var teamManagementRoutes = require(TEAM_MANAGEMENT_ROUTES_PATH);
  var teamManagement = require(path.join(ROOT, 'src', 'web-ui', 'modules', 'team-management'));
  var handlers = teamManagementRoutes.createTeamManagementHandlers({});
  var req = mockReq();
  var res = mockRes();
  handlers.handleGetCreateInviteForm(req, res);
  var html = res._get().body;

  assert.ok(/<label for="email">/.test(html), 'expected a labelled email field');
  assert.ok(/<input id="email" name="email"/.test(html), 'expected an email input with the correct name attribute');
  assert.ok(/<label for="role">/.test(html), 'expected a labelled role field');
  assert.ok(/<select id="role" name="role"/.test(html), 'expected a role select with the correct name attribute');
  teamManagement.VALID_ROLES.forEach(function (role) {
    assert.ok(html.indexOf('<option value="' + role + '">') !== -1, 'expected role option "' + role + '" to be present, sourced from VALID_ROLES not a hardcoded list');
  });
  assert.ok(/<button type="submit">/.test(html), 'expected a real, native submit button');
});

await checkAsyncOrSync('AC4: getCreateInviteForm_everyInputHasLabelSubmitIsRealButton', async () => {
  var teamManagementRoutes = require(TEAM_MANAGEMENT_ROUTES_PATH);
  var handlers = teamManagementRoutes.createTeamManagementHandlers({});
  var req = mockReq();
  var res = mockRes();
  handlers.handleGetCreateInviteForm(req, res);
  var html = res._get().body;

  // Resolve every input/select id and confirm a matching label[for] exists --
  // a distinct check from AC1 (which only confirms the controls exist at all).
  var idMatches = html.match(/<(?:input|select) id="([^"]+)"/g) || [];
  var ids = idMatches.map(function (m) { return /id="([^"]+)"/.exec(m)[1]; });
  assert.ok(ids.length >= 2, 'expected at least 2 form controls (email, role)');
  ids.forEach(function (id) {
    assert.ok(html.indexOf('<label for="' + id + '">') !== -1, 'expected a <label for="' + id + '"> pairing every form control');
  });

  assert.ok(/<button type="submit">/.test(html), 'expected a real <button> element');
  assert.ok(!/<div[^>]*onclick/.test(html) && !/<a[^>]*class="[^"]*submit/.test(html), 'expected no styled div/anchor masquerading as the submit control');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wsi-s6-invite-creation-ui.js
```

Expected: both tests fail — `handlers.handleGetCreateInviteForm is not a function`.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/team-management.js`, add this new function immediately after `handleGetTeamMembers`'s own closing brace (before the `/**\n   * POST /api/team/members` comment):

```javascript

  /**
   * GET /team/invites/new — minimal, functional form to create a team
   * invite (wsi-s6 AC1, AC4). Reuses handleGetTeamMembers's exact existing
   * rendering pattern -- native labelled controls, a real <button>, the
   * same CSRF field embedding convention. Role options come from the same
   * VALID_ROLES array wsi-s1's own handler already validates against
   * server-side. The form POSTs to wsi-s1's existing /api/team/invites
   * endpoint unchanged -- no new request shape (AC2).
   */
  function handleGetCreateInviteForm(req, res) {
    var roleOptions = teamManagement.VALID_ROLES.map(function(r) {
      return '<option value="' + _escapeHtml(r) + '">' + _escapeHtml(r) + '</option>';
    }).join('');

    var csrfToken = csrf.generateCsrfToken(req);

    var html = '<!DOCTYPE html><html><head><title>Invite a teammate</title></head><body>' +
      '<h1>Invite a teammate</h1>' +
      '<form method="POST" action="/api/team/invites">' +
      csrf.csrfField(csrfToken) +
      '<label for="email">Email</label>' +
      '<input id="email" name="email" type="email" required>' +
      '<label for="role">Role</label>' +
      '<select id="role" name="role" required>' + roleOptions + '</select>' +
      '<button type="submit">Send invite</button>' +
      '</form>' +
      '</body></html>';

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }
```

Update the factory's return statement from:

```javascript
  return { handleGetTeamMembers: handleGetTeamMembers, handleAddTeammate: handleAddTeammate, handleCreateInvite: handleCreateInvite };
```

to:

```javascript
  return { handleGetTeamMembers: handleGetTeamMembers, handleAddTeammate: handleAddTeammate, handleCreateInvite: handleCreateInvite, handleGetCreateInviteForm: handleGetCreateInviteForm };
```

In `src/web-ui/server.js`, add this new route block immediately after the existing `pathname === '/team/members' && req.method === 'GET'` block (after its closing `}` and before the `} else if (pathname === '/api/team/members' && req.method === 'POST')` line):

```javascript

  } else if (pathname === '/team/invites/new' && req.method === 'GET') {
    // wsi-s6 — invite-creation form (requireAdmin gate)
    if (!_teamManagementHandlers) {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Team management unavailable');
    } else {
      let _raOk = false;
      await requireAdmin(req, res, () => { _raOk = true; });
      if (!_raOk) return;
      await _teamManagementHandlers.handleGetCreateInviteForm(req, res);
    }
```

**Find the exact real current line numbers via grep before editing** — do not assume the line numbers above are still accurate; other stories may have shifted them.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wsi-s6-invite-creation-ui.js
```

Expected: `2 passed, 0 failed`

- [ ] **Step 5: Run sibling regressions**

```bash
node tests/check-tir-s3-admin-adds-teammate.js
node tests/check-wsi-s1-admin-creates-invite.js
```

Both must remain fully green — this task adds a new function to a shared factory and a new route to a shared dispatcher, but does not modify any existing function or route.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/team-management.js src/web-ui/server.js tests/check-wsi-s6-invite-creation-ui.js
git commit -m "feat(wsi-s6): render a real invite-creation form, labelled and keyboard-accessible (AC1, AC4)"
```

---

## Task 2: Form targets the existing endpoint correctly; non-admins are rejected (AC2, AC3)

**Files:**
- Modify: `tests/check-wsi-s6-invite-creation-ui.js`
- Modify: `tests/check-d2-banner-exit-permission-visibility.js`
- Modify: `tests/check-d4-nfr-security-review-and-hardening.js`

- [ ] **Step 1: Write the failing tests**

Add before the final `console.log`:

```javascript
await checkAsyncOrSync('AC2: getCreateInviteForm_formPostsToApiTeamInvitesWithCsrfAndCorrectFieldNames', async () => {
  var teamManagementRoutes = require(TEAM_MANAGEMENT_ROUTES_PATH);
  var handlers = teamManagementRoutes.createTeamManagementHandlers({});
  var req = mockReq();
  var res = mockRes();
  handlers.handleGetCreateInviteForm(req, res);
  var html = res._get().body;

  assert.ok(/<form method="POST" action="\/api\/team\/invites">/.test(html), 'expected the form to POST to the existing, unchanged /api/team/invites endpoint');
  assert.ok(/<input type="hidden" name="_csrf" value="[^"]+">/.test(html), 'expected an embedded CSRF field matching csrf.csrfField\'s own established shape');
  assert.ok(/name="email"/.test(html) && /name="role"/.test(html), 'expected exactly the email/role field names handleCreateInvite already reads -- no new request shape');
});

await checkAsyncOrSync('AC3: getCreateInviteForm_wiredBehindRequireAdminSameStandardWay', async () => {
  var src = fs.readFileSync(SERVER_PATH, 'utf8');
  assert.ok(src.indexOf("pathname === '/team/invites/new'") !== -1, 'expected server.js to register the new GET /team/invites/new route');
  var routeBlock = src.slice(src.indexOf("pathname === '/team/invites/new'"), src.indexOf("pathname === '/team/invites/new'") + 500);
  assert.ok(/await requireAdmin\(req, res, \(\) => \{ _raOk = true; \}\)/.test(routeBlock), 'expected the new route to call requireAdmin the same standard way every other gated route does -- no route-specific bypass');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-wsi-s6-invite-creation-ui.js
```

Expected: `3 passed, 0 failed` on the wsi-s6 file itself (AC2 already passes — Task 1's implementation already targets the correct endpoint and CSRF shape; AC3 already passes too, since Task 1's server.js wiring already calls `requireAdmin` correctly). This task's real RED state is in the two sibling checklist files below, not this file — run Step 3 to see it.

```bash
node tests/check-d2-banner-exit-permission-visibility.js
node tests/check-d4-nfr-security-review-and-hardening.js
```

Expected: both fail — `expected exactly 13/14 requireAdmin(...) call sites` (the count is now 14 after Task 1's new route, but these two files still hardcode 13). This is the exact, budgeted-in-advance consequence flagged in this story's own test plan and DoR contract.

- [ ] **Step 3: Update the two hardcoded checklist tests**

In `tests/check-d2-banner-exit-permission-visibility.js`, find the test whose name contains `exactly 13 requireAdmin(` (this was itself updated from 12→13 during `wsi-s1`'s own delivery — find the real current text via grep, do not assume the number is still 13 by the time you read this). Update:
- The count assertion from `13` to `14`.
- The descriptive test name/comment to add `+ wsi-s6's new GET /team/invites/new route`.
- Add a new block-level assertion confirming the `/team/invites/new` block specifically calls `requireAdmin` the same standard way, mirroring the existing per-route assertions already in that test (e.g. the `teamInvitesBlock` assertion `wsi-s1` added for its own `/api/team/invites` route).

Apply the identical update to `tests/check-d4-nfr-security-review-and-hardening.js`'s own equivalent test, including adding `"'/team/invites/new'"` to its `expectedRoutes` array.

- [ ] **Step 4: Run tests — must pass**

```bash
node tests/check-wsi-s6-invite-creation-ui.js
node tests/check-d2-banner-exit-permission-visibility.js
node tests/check-d4-nfr-security-review-and-hardening.js
```

Expected: `4 passed, 0 failed` for wsi-s6's own file; both checklist files fully green again.

- [ ] **Step 5: Run full sibling regressions**

```bash
node tests/check-tir-s3-admin-adds-teammate.js
node tests/check-wsi-s1-admin-creates-invite.js
node tests/check-wsi-s2-invitee-accepts-and-joins.js
node tests/check-story3-self-service-provisioning.js
node tests/check-story4-dual-path-authentication.js
```

- [ ] **Step 6: Full regression + commit**

```bash
npm test
```

Expected: matches the true baseline (33 pre-existing failures, same file list independently verified by every prior story in this feature; total file count reflects this story's own new test file).

```bash
git add tests/check-wsi-s6-invite-creation-ui.js tests/check-d2-banner-exit-permission-visibility.js tests/check-d4-nfr-security-review-and-hardening.js
git commit -m "test(wsi-s6): lock in AC2/AC3 -- correct POST target, requireAdmin-gated; update route-count checklists"
```

---

## Final story-level check (before /verify-completion)

After both tasks: `node tests/check-wsi-s6-invite-creation-ui.js` → `4 passed, 0 failed`. Both `requireAdmin` checklist files (`check-d2`, `check-d4`) and all 5 sibling regression files unchanged. Full `npm test` at the true baseline. This story is the last one in Epic 1 — after it merges, the whole self-serve invite flow is reachable end-to-end by a real admin, and both benefit metrics can start producing real signal (per `wsi-s1`'s own DoD follow-up action #2, which this story closes).
