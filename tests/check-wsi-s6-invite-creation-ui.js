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
if (failed > 0) process.exit(1);

})();
