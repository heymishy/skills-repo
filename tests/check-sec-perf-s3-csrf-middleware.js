'use strict';

// check-sec-perf-s3-csrf-middleware.js — unit tests for src/web-ui/middleware/csrf.js
// Story: artefacts/2026-07-01-security-perf-hardening/stories/sec-perf-s3.md
// Test plan: artefacts/2026-07-01-security-perf-hardening/test-plans/sec-perf-s3-test-plan.md

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

var CSRF_PATH = path.resolve(__dirname, '../src/web-ui/middleware/csrf.js');
var csrf = require(CSRF_PATH);

function makeRes() {
  return {
    _status: null,
    _headers: {},
    _body: '',
    writeHead: function(status, headers) { this._status = status; this._headers = headers || {}; },
    end: function(body) { this._body = body || ''; }
  };
}

async function run() {
  console.log('=== sec-perf-s3: csrf.js middleware unit tests ===');

  var queue = [];

  // M1: generateCsrfToken creates a token on first call
  queue.push(function() {
    return test('M1: generateCsrfToken creates a non-empty hex token', function() {
      var req = { session: {} };
      var token = csrf.generateCsrfToken(req);
      assert.ok(token && token.length > 0, 'token must be non-empty');
      assert.ok(/^[a-f0-9]+$/.test(token), 'token must be hex');
      assert.strictEqual(req.session.csrfToken, token, 'token must be stored on req.session.csrfToken');
    });
  });

  // M2: idempotent within a session
  queue.push(function() {
    return test('M2: generateCsrfToken is idempotent within a session', function() {
      var req = { session: {} };
      var t1 = csrf.generateCsrfToken(req);
      var t2 = csrf.generateCsrfToken(req);
      assert.strictEqual(t1, t2, 'second call must return the same token, not regenerate');
    });
  });

  // M3: csrfField returns a well-formed, escaped hidden input
  queue.push(function() {
    return test('M3: csrfField returns escaped hidden input HTML', function() {
      var html = csrf.csrfField('abc123');
      assert.strictEqual(html, '<input type="hidden" name="_csrf" value="abc123">');

      var escaped = csrf.csrfField('a"b<c>d');
      assert.ok(escaped.indexOf('a&quot;b&lt;c&gt;d') !== -1, 'special chars must be escaped: ' + escaped);
    });
  });

  // M4: csrfGuard rejects when _csrf missing
  queue.push(function() {
    return test('M4: csrfGuard rejects missing _csrf field', async function() {
      var req = {
        session: { csrfToken: 'real-token' },
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        on: function(event, cb) {
          if (event === 'data') cb('amount=50');
          if (event === 'end') cb();
        }
      };
      var res = makeRes();
      var ok = await csrf.csrfGuard(req, res);
      assert.strictEqual(ok, false);
      assert.strictEqual(res._status, 403);
      assert.strictEqual(res._body, 'Forbidden');
    });
  });

  // M5: csrfGuard rejects mismatched token
  queue.push(function() {
    return test('M5: csrfGuard rejects mismatched _csrf value', async function() {
      var req = {
        session: { csrfToken: 'real-token' },
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        on: function(event, cb) {
          if (event === 'data') cb('_csrf=wrong-token&amount=50');
          if (event === 'end') cb();
        }
      };
      var res = makeRes();
      var ok = await csrf.csrfGuard(req, res);
      assert.strictEqual(ok, false);
      assert.strictEqual(res._status, 403);
    });
  });

  // M6: csrfGuard rejects when session has no csrfToken at all
  queue.push(function() {
    return test('M6: csrfGuard rejects when req.session.csrfToken was never generated', async function() {
      var req = {
        session: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        on: function(event, cb) {
          if (event === 'data') cb('_csrf=anything&amount=50');
          if (event === 'end') cb();
        }
      };
      var res = makeRes();
      var ok = await csrf.csrfGuard(req, res);
      assert.strictEqual(ok, false);
      assert.strictEqual(res._status, 403);
    });
  });

  // M7: csrfGuard accepts matching token
  queue.push(function() {
    return test('M7: csrfGuard accepts a matching _csrf value', async function() {
      var req = {
        session: { csrfToken: 'real-token' },
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        on: function(event, cb) {
          if (event === 'data') cb('_csrf=real-token&amount=50');
          if (event === 'end') cb();
        }
      };
      var res = makeRes();
      var ok = await csrf.csrfGuard(req, res);
      assert.strictEqual(ok, true);
      assert.strictEqual(res._status, null, 'no response should be written on success');
    });
  });

  // M8: csrfGuard caches parsed body onto req.body for downstream reuse
  queue.push(function() {
    return test('M8: csrfGuard caches parsed body on req.body for downstream _readBody reuse', async function() {
      var req = {
        session: { csrfToken: 'real-token' },
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        on: function(event, cb) {
          if (event === 'data') cb('_csrf=real-token&tenantId=tenant-a&amount=50');
          if (event === 'end') cb();
        }
      };
      var res = makeRes();
      var ok = await csrf.csrfGuard(req, res);
      assert.strictEqual(ok, true);
      assert.ok(req.body !== undefined, 'req.body must be set after csrfGuard runs');
      assert.strictEqual(req.body.tenantId, 'tenant-a');
      assert.strictEqual(req.body.amount, '50');

      // Simulate a downstream handler's own _readBody short-circuit (no stream re-read).
      var reReadCalled = false;
      var downstreamBody = req.body !== undefined
        ? req.body
        : (function() { reReadCalled = true; return null; })();
      assert.strictEqual(reReadCalled, false, 'downstream must not attempt to re-read the stream');
      assert.strictEqual(downstreamBody.tenantId, 'tenant-a');
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n=== Results: ' + passed + ' passed, ' + failed + ' failed ===');
  if (failed > 0) {
    failures.forEach(function(f) {
      console.log('FAILED:', f.name, '-', f.err && f.err.message || f.err);
    });
    process.exit(1);
  }
  process.exit(0);
}

run();
