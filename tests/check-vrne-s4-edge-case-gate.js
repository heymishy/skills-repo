'use strict';

var assert = require('assert');
var path = require('path');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  [PASS]', name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err); }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

var REQUIRE_NON_VIEWER_PATH = path.resolve(__dirname, '../src/web-ui/middleware/require-non-viewer.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

function makeRes() {
  var r = { _status: null, _headers: {}, _body: '' };
  r.writeHead = function(s, h) { r._status = s; Object.assign(r._headers, h || {}); };
  r.end = function(b) { r._body += (b || ''); };
  return r;
}

function viewerSession() {
  return { session: { userId: 'u1', role: 'viewer', tenantId: 't1', login: 'viewer@test' } };
}

async function main() {
  var queue = [];

  // AC1/AC2/AC3 -- viewer denied on all 3 routes
  [
    { ac: 'AC1', routeName: 'agency-client-new' },
    { ac: 'AC2', routeName: 'agency-client-invite' },
    { ac: 'AC3', routeName: 'annotation' }
  ].forEach(function(c) {
    queue.push(function() {
      console.log('\n[vrne-s4] T-' + c.ac.toLowerCase() + '-' + c.routeName + ' -- viewer denied');
      return test(c.ac + ': viewer denied on ' + c.routeName, async function() {
        var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
        var req = viewerSession();
        var res = makeRes();
        var nextCalled = false;
        await gate.requireNonViewer(req, res, function() { nextCalled = true; });
        assert.strictEqual(nextCalled, false, c.routeName + ': next() must not be called for viewer');
        assert.strictEqual(res._status, 403, c.routeName + ': status must be 403');
      });
    });
  });

  // AC4 -- engineer/admin unaffected
  [
    { role: 'engineer', route: 'agency-client-new' },
    { role: 'admin',    route: 'agency-client-invite' }
  ].forEach(function(c) {
    queue.push(function() {
      console.log('\n[vrne-s4] T-ac4-' + c.role + '-' + c.route + ' -- non-viewer unaffected');
      return test('AC4: role=' + c.role + ' proceeds on ' + c.route, async function() {
        var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
        var req = { session: { userId: 'u2', role: c.role, tenantId: 't1', login: c.role + '@test' } };
        var res = makeRes();
        var nextCalled = false;
        await gate.requireNonViewer(req, res, function() { nextCalled = true; });
        assert.ok(nextCalled, 'next() should be called for role=' + c.role);
        assert.strictEqual(res._status, null, 'no response should be written for allowed roles');
      });
    });
  });

  // AC6 -- denial logging
  queue.push(function() {
    console.log('\n[vrne-s4] T-ac6-denial-logged -- edge-case route denial logged');
    return test('AC6: denial on an edge-case route logs personId, tenantId, timestamp, route', async function() {
      var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
      var loggedEvent = null;
      var loggedPayload = null;
      gate.setLogger({ warn: function(event, payload) { loggedEvent = event; loggedPayload = payload; } });
      var req = { session: { userId: 'u1', role: 'viewer', tenantId: 't1', login: 'viewer@test' }, url: '/agency/clients/new' };
      var res = makeRes();
      await gate.requireNonViewer(req, res, function() {});
      assert.strictEqual(loggedEvent, 'viewer_write_denied');
      assert.strictEqual(loggedPayload.personId, 'u1');
      assert.strictEqual(loggedPayload.tenantId, 't1');
      assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(loggedPayload.timestamp));
      assert.strictEqual(loggedPayload.route, '/agency/clients/new');
    });
  });

  queue.push(function() {
    console.log('\n[vrne-s4] T-integration-real-dispatch -- real server.js dispatch denies viewer on /api/artefacts/:slug/annotations');
    return test('integration: requireNonViewer reachable via real server.js dispatch', async function() {
      var router = require('../src/web-ui/server').router;
      var seedTestSession = require('../src/web-ui/middleware/session').seedTestSession;
      var EventEmitter = require('events').EventEmitter;

      function integrationMockRes() {
        var _statusCode = null;
        var _headers = {};
        var _chunks = [];
        return {
          writeHead: function(code, headers) { _statusCode = code; Object.assign(_headers, headers || {}); return this; },
          setHeader: function(k, v) { _headers[k] = v; },
          end: function(body) { if (body != null) _chunks.push(body); },
          _get: function() { return { statusCode: _statusCode, headers: _headers, body: _chunks.join('') }; }
        };
      }

      function dispatchAndAwaitResponse(req) {
        return new Promise(function(resolve, reject) {
          var res = integrationMockRes();
          var settled = false;
          var origEnd = res.end;
          res.end = function(body) {
            origEnd(body);
            if (!settled) { settled = true; resolve(res._get()); }
          };
          router(req, res).catch(function(err) {
            if (!settled) { settled = true; reject(err); }
          });
        });
      }

      function seedMultiUserRolesForIntegrationTest(sharedOrg) {
        return new Promise(function(resolve, reject) {
          var req = new EventEmitter();
          req.method = 'POST';
          req.url = '/test/seed-multi-user-roles';
          req.headers = { 'content-type': 'application/json' };
          var res = integrationMockRes();
          var origEnd = res.end;
          res.end = function(body) {
            origEnd(body);
            var result = res._get();
            if (result.statusCode !== 200) {
              reject(new Error('seed-multi-user-roles failed: ' + result.statusCode + ' ' + result.body));
            } else {
              resolve(result);
            }
          };
          router(req, res).then(function() {
            req.emit('data', JSON.stringify({ sharedOrg: sharedOrg }));
            req.emit('end');
          }).catch(reject);
        });
      }

      var sharedOrg = 'e2e-vrne-s4-integration';
      await seedMultiUserRolesForIntegrationTest(sharedOrg);

      var sessionId = 'faceb00c04';
      seedTestSession(sessionId, {
        accessToken: 'e2e-test-access-token',
        userId: 9001,
        login: 'e2e-viewer',
        tenantId: sharedOrg
      });
      var cookieHeader = { cookie: 'session_id=' + sessionId };

      var req1 = { headers: Object.assign({ 'content-type': 'application/json' }, cookieHeader), method: 'POST', url: '/api/artefacts/artefacts%2Ftest%2Fdiscovery.md/annotations' };
      var result1 = await dispatchAndAwaitResponse(req1);
      assert.strictEqual(result1.statusCode, 403, 'POST /api/artefacts/:slug/annotations must return 403 for a viewer-role session, got ' + result1.statusCode + ' -- ' + result1.body);
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[vrne-s4-edge-case-gate] AC1+AC2+AC3+AC4+AC6 subtotal: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main();
