'use strict';

var assert = require('assert');
var path = require('path');
var fs = require('fs');

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
var SERVER_JS_PATH = path.resolve(__dirname, '../src/web-ui/server.js');

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

  // AC1 — viewer denied on /billing/checkout
  queue.push(function() {
    console.log('\n[vrne-s3] T-ac1-billing-checkout -- viewer denied');
    return test('AC1: viewer denied on billing-checkout', async function() {
      var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
      var req = viewerSession();
      var res = makeRes();
      var nextCalled = false;
      await gate.requireNonViewer(req, res, function() { nextCalled = true; });
      assert.strictEqual(nextCalled, false, 'next() must not be called for viewer');
      assert.strictEqual(res._status, 403, 'status must be 403');
    });
  });

  // AC2 — engineer/admin roles unaffected
  ['engineer', 'admin'].forEach(function(roleName) {
    queue.push(function() {
      console.log('\n[vrne-s3] T-ac2-' + roleName + '-billing-checkout -- non-viewer unaffected');
      return test('AC2: role=' + roleName + ' proceeds on billing-checkout', async function() {
        var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
        var req = { session: { userId: 'u2', role: roleName, tenantId: 't1', login: roleName + '@test' } };
        var res = makeRes();
        var nextCalled = false;
        await gate.requireNonViewer(req, res, function() { nextCalled = true; });
        assert.ok(nextCalled, 'next() should be called for role=' + roleName);
        assert.strictEqual(res._status, null, 'no response should be written for allowed roles');
      });
    });
  });

  // AC3 — denial logging
  queue.push(function() {
    console.log('\n[vrne-s3] T-ac3-denial-logged -- billing-checkout denial logged');
    return test('AC3: denial on billing-checkout logs personId, tenantId, timestamp, route', async function() {
      var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
      var loggedEvent = null;
      var loggedPayload = null;
      gate.setLogger({ warn: function(event, payload) { loggedEvent = event; loggedPayload = payload; } });
      var req = { session: { userId: 'u1', role: 'viewer', tenantId: 't1', login: 'viewer@test' }, url: '/billing/checkout' };
      var res = makeRes();
      await gate.requireNonViewer(req, res, function() {});
      assert.strictEqual(loggedEvent, 'viewer_write_denied');
      assert.strictEqual(loggedPayload.personId, 'u1');
      assert.strictEqual(loggedPayload.tenantId, 't1');
      assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(loggedPayload.timestamp));
      assert.strictEqual(loggedPayload.route, '/billing/checkout');
    });
  });

  // AC4 — /webhook/stripe unaffected by the gate (static-source regression guard)
  queue.push(function() {
    console.log('\n[vrne-s3] T-ac4-webhook-unaffected -- gate not applied to /webhook/stripe');
    return test('AC4: /webhook/stripe route branch does not call requireNonViewer', function() {
      var serverSrc = fs.readFileSync(SERVER_JS_PATH, 'utf8');
      var webhookIdx = serverSrc.indexOf("pathname === '/webhook/stripe'");
      var checkoutIdx = serverSrc.indexOf("pathname === '/billing/checkout'");
      assert.ok(webhookIdx > -1, '/webhook/stripe branch must exist in server.js');
      assert.ok(checkoutIdx > -1, '/billing/checkout branch must exist in server.js');
      // Slice from the webhook branch to the next " } else if (" branch boundary
      // and confirm requireNonViewer does not appear inside that slice.
      var nextBranchIdx = serverSrc.indexOf('} else if (', webhookIdx);
      var webhookBranchSrc = serverSrc.slice(webhookIdx, nextBranchIdx);
      assert.ok(!webhookBranchSrc.includes('requireNonViewer'), '/webhook/stripe branch must not call requireNonViewer');
    });
  });

  // Integration test — real server.js dispatch. `router` and `seedTestSession`
  // are declared here but deliberately left unassigned: the actual
  // require('../src/web-ui/server') / require('.../middleware/session') calls
  // happen INSIDE the queue.push callback below (execution time), not here
  // (push time). main() runs synchronously through every queue.push() call
  // before the for-loop below ever invokes queue[0](), so a require() sitting
  // at this lexical position -- even though it's textually below the AC1-AC4
  // queue.push calls -- would still execute BEFORE any of those tests actually
  // run, wiring the live role-resolution adapter process-wide and overriding
  // the AC1/AC2/AC3 tests' unseeded mock session role with a live-DB-resolved
  // value instead of trusting the literal mock role (the exact vrne-s2
  // regression this story must not reintroduce). Deferring the require()
  // calls into the async test callback itself guarantees they only run when
  // the integration test executes -- last in the queue, after AC1-AC4.
  var router;
  var seedTestSession;
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

  queue.push(function() {
    console.log('\n[vrne-s3] T-integration-real-dispatch -- real server.js dispatch denies viewer on /billing/checkout');
    return test('integration: requireNonViewer reachable via real server.js dispatch', async function() {
      // env vars required to require('../src/web-ui/server') -- must be set
      // BEFORE that require() below runs. NODE_ENV=test + no DATABASE_URL
      // routes server.js to its in-memory fake-test-db bootstrap branch, which
      // wires a real (fake-backed) getCurrentRole adapter -- required for
      // requireNonViewer's live role resolution to see the viewer role seeded
      // via /test/seed-multi-user-roles below. Mirrors
      // check-vrne-s1-server-wiring.js's and check-vrne-s2-skill-session-gate.js's
      // own setup.
      process.env.NODE_ENV             = 'test';
      process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
      process.env.GITHUB_CLIENT_ID     = 'test-client-id';
      process.env.GITHUB_CLIENT_SECRET = 'test-secret';
      process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
      delete process.env.POSTHOG_KEY;
      delete process.env.DATABASE_URL;

      router = require('../src/web-ui/server').router;
      seedTestSession = require('../src/web-ui/middleware/session').seedTestSession;

      var sharedOrg = 'e2e-vrne-s3-integration';
      await seedMultiUserRolesForIntegrationTest(sharedOrg);

      var sessionId = 'faceb00c03';
      seedTestSession(sessionId, {
        accessToken: 'e2e-test-access-token',
        userId: 9001,
        login: 'e2e-viewer',
        tenantId: sharedOrg
      });
      var cookieHeader = { cookie: 'session_id=' + sessionId };

      var req1 = { headers: Object.assign({ 'content-type': 'application/json' }, cookieHeader), method: 'POST', url: '/billing/checkout' };
      var result1 = await dispatchAndAwaitResponse(req1);
      assert.strictEqual(result1.statusCode, 403, 'POST /billing/checkout must return 403 for a viewer-role session, got ' + result1.statusCode + ' -- ' + result1.body);
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[vrne-s3-billing-gate] AC1+AC2+AC3+AC4 subtotal: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main();
