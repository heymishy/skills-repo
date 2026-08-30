'use strict';

// check-csdl-s1-csrf-diagnostic-logging.js — unit tests for csdl-s1's temporary
// diagnostic logging in generateCsrfToken/csrfGuard, added to investigate why
// jgcc-s1's fix (the previously-missing _csrf field) did not fully resolve a
// live "Forbidden" bug reproduced on wuce-staging.
// Story: artefacts/2026-08-30-csrf-guard-diagnostic-logging/stories/csdl-s1-add-temporary-csrf-guard-diagnostic-logging.md
// Test plan: artefacts/2026-08-30-csrf-guard-diagnostic-logging/test-plans/csdl-s1-test-plan.md

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
var SESSION_PATH = path.resolve(__dirname, '../src/web-ui/middleware/session.js');
var csrf = require(CSRF_PATH);
var session = require(SESSION_PATH);

// Spies on console.info, capturing every JSON-parseable line logged while
// active. Always restore the original in a finally block.
function spyOnConsoleInfo() {
  var original = console.info;
  var lines = [];
  console.info = function(msg) {
    try { lines.push(JSON.parse(msg)); } catch (_) { /* ignore non-JSON console.info calls */ }
  };
  return {
    lines: lines,
    restore: function() { console.info = original; }
  };
}

function fakeRes() {
  var res = { statusCode: null, headers: null, body: null };
  res.writeHead = function(code, headers) { res.statusCode = code; res.headers = headers; };
  res.end = function(body) { res.body = body; };
  return res;
}

async function run() {
  console.log('=== csdl-s1: CSRF guard diagnostic logging tests ===');

  var queue = [];

  // AC1a: first-ever generateCsrfToken call on a token-less session logs
  // wasNew: true with a tokenPrefix matching the returned token.
  queue.push(function() {
    return test('AC1a: first generateCsrfToken call logs wasNew:true with a matching tokenPrefix', async function() {
      var spy = spyOnConsoleInfo();
      try {
        var created = session.createSession();
        var req = { session: session.getSession(created.id), sessionId: created.id };

        var token = await csrf.generateCsrfToken(req);

        var line = spy.lines.filter(function(l) { return l.event === 'csrf_token_generate'; })[0];
        assert.ok(line, 'must log a csrf_token_generate line');
        assert.strictEqual(line.wasNew, true, 'first call on a token-less session must log wasNew:true');
        assert.strictEqual(line.tokenPrefix, token.slice(0, 8), 'tokenPrefix must match the first 8 chars of the returned token');
        assert.strictEqual(line.sessionIdPrefix, created.id.slice(0, 8), 'sessionIdPrefix must match the first 8 chars of the session id');
        assert.ok(typeof line.machineId === 'string' && line.machineId.length > 0, 'machineId must be a non-empty string');
      } finally {
        spy.restore();
      }
    });
  });

  // AC1b: a second call on the same (now token-bearing) session logs
  // wasNew: false, with the same tokenPrefix as before -- proves the
  // idempotent-reuse path is also logged, not just first-mint.
  queue.push(function() {
    return test('AC1b: second generateCsrfToken call on the same session logs wasNew:false with the same tokenPrefix', async function() {
      var spy = spyOnConsoleInfo();
      try {
        var created = session.createSession();
        var req = { session: session.getSession(created.id), sessionId: created.id };

        var firstToken = await csrf.generateCsrfToken(req);
        spy.lines.length = 0; // only inspect the second call's log line
        var secondToken = await csrf.generateCsrfToken(req);

        assert.strictEqual(secondToken, firstToken, 'token must be reused, not regenerated');
        var line = spy.lines.filter(function(l) { return l.event === 'csrf_token_generate'; })[0];
        assert.ok(line, 'must log a csrf_token_generate line on reuse too');
        assert.strictEqual(line.wasNew, false, 'reuse call must log wasNew:false');
        assert.strictEqual(line.tokenPrefix, firstToken.slice(0, 8), 'tokenPrefix must still match the (reused) token');
      } finally {
        spy.restore();
      }
    });
  });

  // AC2a: a matching csrfGuard submission logs match:true.
  queue.push(function() {
    return test('AC2a: a matching csrfGuard submission logs match:true', async function() {
      var spy = spyOnConsoleInfo();
      try {
        var created = session.createSession();
        var req = { session: session.getSession(created.id), sessionId: created.id };
        var token = await csrf.generateCsrfToken(req);
        req.body = { _csrf: token };
        var res = fakeRes();

        var ok = await csrf.csrfGuard(req, res);

        assert.strictEqual(ok, true, 'guard must pass for a matching token');
        var line = spy.lines.filter(function(l) { return l.event === 'csrf_guard_check'; })[0];
        assert.ok(line, 'must log a csrf_guard_check line');
        assert.strictEqual(line.match, true);
        assert.strictEqual(line.submittedPrefix, token.slice(0, 8));
        assert.strictEqual(line.expectedPrefix, token.slice(0, 8));
      } finally {
        spy.restore();
      }
    });
  });

  // AC2b: a mismatched/missing submission logs match:false, with '(empty)'
  // used for whichever side is falsy.
  queue.push(function() {
    return test('AC2b: a mismatched csrfGuard submission logs match:false and (empty) for a missing side', async function() {
      var spy = spyOnConsoleInfo();
      try {
        var created = session.createSession();
        var req = { session: session.getSession(created.id), sessionId: created.id };
        await csrf.generateCsrfToken(req);
        req.body = {}; // no _csrf submitted at all
        var res = fakeRes();

        var ok = await csrf.csrfGuard(req, res);

        assert.strictEqual(ok, false, 'guard must reject a missing token');
        assert.strictEqual(res.statusCode, 403);
        var line = spy.lines.filter(function(l) { return l.event === 'csrf_guard_check'; })[0];
        assert.ok(line, 'must log a csrf_guard_check line even on rejection');
        assert.strictEqual(line.match, false);
        assert.strictEqual(line.submittedPrefix, '(empty)', 'a missing submitted value must log as (empty), never a real value');
      } finally {
        spy.restore();
      }
    });
  });

  // Negative assertion: no logged line anywhere contains a full-length
  // (64-hex-char) token or session id value -- only 8-char prefixes.
  queue.push(function() {
    return test('No logged line ever contains a full-length token or session id', async function() {
      var spy = spyOnConsoleInfo();
      try {
        var created = session.createSession();
        var req = { session: session.getSession(created.id), sessionId: created.id };
        var token = await csrf.generateCsrfToken(req);
        req.body = { _csrf: token };
        await csrf.csrfGuard(req, req.session && fakeRes());

        spy.lines.forEach(function(line) {
          var serialised = JSON.stringify(line);
          assert.ok(serialised.indexOf(token) === -1, 'full token must never appear in a log line');
          assert.ok(serialised.indexOf(created.id) === -1, 'full session id must never appear in a log line');
        });
      } finally {
        spy.restore();
      }
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n=== Results: ' + passed + ' passed, ' + failed + ' failed ===');
  if (failed > 0) {
    failures.forEach(function(f) {
      console.log('FAILED:', f.name, '-', f.err && (f.err.stack || f.err.message) || f.err);
    });
    process.exit(1);
  }
  process.exit(0);
}

run();
