'use strict';
var assert = require('assert');
var passed = 0; var failed = 0; var failures = [];
function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve();
  }
}
var queue = [];

var captureWorkerAuth = require('../src/web-ui/routes/capture-worker-auth');
var nonceStore = require('../src/web-ui/adapters/capture-nonce-store');

function makeRes() {
  var res = { _status: null, _headers: {}, _body: null };
  res.writeHead = function(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); };
  res.end = function(body) { res._body = body; };
  return res;
}
function makeReq(body) {
  return { headers: {}, body: body };
}
function withExchangeSecret(secret, fn) {
  var saved = process.env.CAPTURE_EXCHANGE_SECRET;
  if (secret === undefined) delete process.env.CAPTURE_EXCHANGE_SECRET;
  else process.env.CAPTURE_EXCHANGE_SECRET = secret;
  return Promise.resolve().then(fn).finally(function() {
    if (saved === undefined) delete process.env.CAPTURE_EXCHANGE_SECRET;
    else process.env.CAPTURE_EXCHANGE_SECRET = saved;
  });
}

// Captures console.log/console.error output during a test so assertions can
// confirm no sensitive value (real nonce/sessionId) was ever logged.
function withCapturedLogs(fn) {
  var lines = [];
  var origLog = console.log;
  var origError = console.error;
  console.log = function() { lines.push(Array.prototype.slice.call(arguments).join(' ')); };
  console.error = function() { lines.push(Array.prototype.slice.call(arguments).join(' ')); };
  return Promise.resolve().then(function() { return fn(); }).finally(function() {
    console.log = origLog;
    console.error = origError;
  }).then(function(result) {
    return { result: result, lines: lines };
  });
}

queue.push(function() {
  return test('handleCaptureExchange_disabledWhenSecretNotConfigured_404sRegardlessOfInput', function() {
    return withExchangeSecret(undefined, async function() {
      var req = makeReq({ nonce: 'some-nonce' });
      req.headers['x-capture-exchange-secret'] = 'anything';
      var res = makeRes();
      await captureWorkerAuth.handleCaptureExchange(req, res);
      assert.strictEqual(res._status, 404);
    });
  });
});

queue.push(function() {
  return test('handleCaptureExchange_wrongSecret_403sRegardlessOfNonceValidity', function() {
    return withExchangeSecret('right-secret', async function() {
      var exchangeCalled = false;
      nonceStore.setNonceStoreAdapter({
        set: async function() {},
        get: async function() { exchangeCalled = true; return 'real-session-id'; },
        del: async function() { exchangeCalled = true; }
      });

      var req = makeReq({ nonce: 'a-valid-unexpired-nonce' });
      req.headers['x-capture-exchange-secret'] = 'wrong-secret';
      var res = makeRes();
      await captureWorkerAuth.handleCaptureExchange(req, res);

      assert.strictEqual(res._status, 403);
      assert.strictEqual(exchangeCalled, false, 'the nonce store must never be consulted when the secret does not match');
    });
  });
});

queue.push(function() {
  return test('handleCaptureExchange_correctSecretValidNonce_returns200WithSessionId', function() {
    return withExchangeSecret('right-secret', async function() {
      nonceStore.setNonceStoreAdapter({
        set: async function() {},
        get: async function() { return 'real-session-id-123'; },
        del: async function() {}
      });

      var req = makeReq({ nonce: 'a-valid-unexpired-nonce' });
      req.headers['x-capture-exchange-secret'] = 'right-secret';
      var res = makeRes();
      await captureWorkerAuth.handleCaptureExchange(req, res);

      assert.strictEqual(res._status, 200);
      var body = JSON.parse(res._body);
      assert.strictEqual(body.sessionId, 'real-session-id-123');
    });
  });
});

queue.push(function() {
  return test('handleCaptureExchange_correctSecretAlreadyUsedNonce_404sWithoutEchoingSessionId', function() {
    return withExchangeSecret('right-secret', async function() {
      // The real sessionId this nonce *was* bound to, before being used up.
      // exchangeNonce() resolving to null (already used / expired / never
      // existed) means this value must never appear anywhere in the response
      // or in logged output.
      var REAL_SESSION_ID = 'should-never-leak-session-id-456';
      nonceStore.setNonceStoreAdapter({
        set: async function() {},
        get: async function() { return null; }, // already exchanged
        del: async function() {}
      });

      var req = makeReq({ nonce: 'an-already-used-nonce' });
      req.headers['x-capture-exchange-secret'] = 'right-secret';
      var res = makeRes();

      var captured = await withCapturedLogs(async function() {
        await captureWorkerAuth.handleCaptureExchange(req, res);
      });

      assert.ok(res._status === 404 || res._status === 410, 'must respond 404 or 410 for a dead nonce');
      assert.ok(res._body.indexOf(REAL_SESSION_ID) === -1, 'response body must never contain the real sessionId');
      captured.lines.forEach(function(line) {
        assert.ok(line.indexOf(REAL_SESSION_ID) === -1, 'logged output must never contain the real sessionId');
      });
    });
  });
});

(async function() {
  console.log('\ncheck-ppc-s9-capture-worker-auth.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
