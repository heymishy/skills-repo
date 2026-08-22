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

async function main() {
  var queue = [];

  // AC3: engineer/product/admin all pass through
  ['admin', 'engineer', 'product'].forEach(function(roleName) {
    queue.push(function() {
      console.log('\n[vrne-s1] T-nonviewer-' + roleName + '-allowed -- ' + roleName + ' role calls next()');
      return test('requireNonViewer: role=' + roleName + ' calls next(), no response written', async function() {
        var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
        var req = { session: { userId: 'u1', role: roleName, tenantId: 't1', login: roleName + '@test' } };
        var res = makeRes();
        var nextCalled = false;
        await gate.requireNonViewer(req, res, function() { nextCalled = true; });
        assert.ok(nextCalled, 'next() should be called for role=' + roleName);
        assert.strictEqual(res._status, null, 'no response should be written for allowed roles');
      });
    });
  });

  // AC1/AC2 core: viewer role denied
  queue.push(function() {
    console.log('\n[vrne-s1] T-nonviewer-viewer-denied -- viewer role denied 403');
    return test('requireNonViewer: role=viewer denied with 403, next() not called', async function() {
      var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
      var req = { session: { userId: 'u1', role: 'viewer', tenantId: 't1', login: 'viewer@test' } };
      var res = makeRes();
      var nextCalled = false;
      await gate.requireNonViewer(req, res, function() { nextCalled = true; });
      assert.strictEqual(nextCalled, false, 'next() must not be called for viewer');
      assert.strictEqual(res._status, 403, 'status must be 403');
      var body = JSON.parse(res._body);
      assert.strictEqual(body.error, 'Forbidden');
    });
  });

  // AC4: fail-closed cases
  var failClosedCases = [
    { name: 'missing-role', session: { userId: 'u1', tenantId: 't1' } },
    { name: 'null-role', session: { userId: 'u1', role: null, tenantId: 't1' } },
    { name: 'unrecognised-role', session: { userId: 'u1', role: 'contractor', tenantId: 't1' } },
    { name: 'no-session', session: null }
  ];
  failClosedCases.forEach(function(c) {
    queue.push(function() {
      console.log('\n[vrne-s1] T-nonviewer-failclosed-' + c.name + ' -- AC4 fail-closed');
      return test('requireNonViewer: ' + c.name + ' denied (fail-closed)', async function() {
        var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
        var req = { session: c.session };
        var res = makeRes();
        var nextCalled = false;
        await gate.requireNonViewer(req, res, function() { nextCalled = true; });
        assert.strictEqual(nextCalled, false, 'next() must not be called for ' + c.name);
        assert.strictEqual(res._status, 403, 'status must be 403 for ' + c.name);
      });
    });
  });

  // AC5: denial logging
  queue.push(function() {
    console.log('\n[vrne-s1] T-nonviewer-denial-logged -- AC5 audit log shape');
    return test('requireNonViewer: denial logs personId, tenantId, timestamp, route', async function() {
      var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
      var loggedEvent = null;
      var loggedPayload = null;
      gate.setLogger({ warn: function(event, payload) { loggedEvent = event; loggedPayload = payload; } });
      var req = { session: { userId: 'u1', role: 'viewer', tenantId: 't1', login: 'viewer@test' }, url: '/products/confirm' };
      var res = makeRes();
      await gate.requireNonViewer(req, res, function() {});
      assert.strictEqual(loggedEvent, 'viewer_write_denied');
      assert.ok(loggedPayload.personId, 'personId must be logged');
      assert.ok(loggedPayload.tenantId, 'tenantId must be logged');
      assert.ok(loggedPayload.timestamp, 'timestamp must be logged');
      assert.ok(loggedPayload.route, 'route must be logged');
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[vrne-s1-require-non-viewer] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main();
