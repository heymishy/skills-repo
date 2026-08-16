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
