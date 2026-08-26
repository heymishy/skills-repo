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

// pncg-s1: handleGetTeamMembers/handleGetCreateInviteForm now wrap via the
// shared renderShellWithNav() helper, which calls pool.query() to build the
// Products sidebar section -- a real (mock) pool is required.
function mockPool() {
  return { query: async function () { return { rows: [] }; } };
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
  var handlers = teamManagementRoutes.createTeamManagementHandlers(mockPool());
  var req = mockReq();
  var res = mockRes();
  await handlers.handleGetTeamMembers(req, res);
  var html = res._get().body;

  assert.ok(html.indexOf('class="sw-app"') !== -1, 'expected the shared shell wrapper (sw-app) to be present');
  assert.ok(html.indexOf('id="sw-sidebar"') !== -1, 'expected the shared shell sidebar to be present');
  assert.ok(html.indexOf('class="sw-main"') !== -1, 'expected the shared shell main content area to be present');
  assert.ok(/<main>[\s\S]*<label for="identity">[\s\S]*<\/main>/.test(html), 'expected the add-teammate form to be rendered inside <main>');
  assert.ok(/<input id="identity" name="identity" type="text" required>/.test(html), 'expected the identity input unchanged');
  assert.ok(/<label for="role">/.test(html) && /<select id="role" name="role" required>/.test(html), 'expected the role field unchanged');
  assert.ok(/<button type="submit">Add teammate<\/button>/.test(html), 'expected the submit button unchanged');
});

await checkAsyncOrSync('AC2: teamManagement_getCreateInviteForm_rendersViaSharedShell', async () => {
  var teamManagementRoutes = require(TEAM_MANAGEMENT_ROUTES_PATH);
  var handlers = teamManagementRoutes.createTeamManagementHandlers(mockPool());
  var req = mockReq();
  var res = mockRes();
  await handlers.handleGetCreateInviteForm(req, res);
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

function htmlShellEscape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

await checkAsyncOrSync('AC3: teamManagement_escapeHtmlRemoved_escHtmlUsedNoRegression', async () => {
  var src = fs.readFileSync(TEAM_MANAGEMENT_ROUTES_PATH, 'utf8');
  assert.ok(!/function _escapeHtml/.test(src), 'expected the locally-defined _escapeHtml function to be removed entirely');
  assert.ok(!/\b_escapeHtml\(/.test(src), 'expected no remaining call sites of the removed _escapeHtml function');

  var teamManagementRoutes = require(TEAM_MANAGEMENT_ROUTES_PATH);
  var teamManagement = require(path.join(ROOT, 'src', 'web-ui', 'modules', 'team-management'));
  var handlers = teamManagementRoutes.createTeamManagementHandlers(mockPool());

  var maliciousRole = '"><script>bad</script>';
  teamManagement.VALID_ROLES.push(maliciousRole);
  try {
    var req = mockReq();
    var res = mockRes();
    await handlers.handleGetTeamMembers(req, res);
    var html = res._get().body;

    assert.ok(html.indexOf('<script>bad</script>') === -1, 'expected the malicious role value to NOT appear unescaped in the rendered HTML');
    assert.ok(html.indexOf(htmlShellEscape(maliciousRole)) !== -1, 'expected the malicious role value to appear HTML-escaped');
  } finally {
    teamManagement.VALID_ROLES.pop();
  }
});

await checkAsyncOrSync('AC4: teamManagement_csrfFieldUnchangedInBothForms', async () => {
  var teamManagementRoutes = require(TEAM_MANAGEMENT_ROUTES_PATH);
  var handlers = teamManagementRoutes.createTeamManagementHandlers(mockPool());

  var req1 = mockReq();
  var res1 = mockRes();
  await handlers.handleGetTeamMembers(req1, res1);
  var html1 = res1._get().body;
  assert.ok(/<input type="hidden" name="_csrf" value="test-csrf-token">/.test(html1), 'expected an unchanged CSRF hidden field on /team/members');

  var req2 = mockReq();
  var res2 = mockRes();
  await handlers.handleGetCreateInviteForm(req2, res2);
  var html2 = res2._get().body;
  assert.ok(/<input type="hidden" name="_csrf" value="test-csrf-token">/.test(html2), 'expected an unchanged CSRF hidden field on /team/invites/new');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
