'use strict';

// check-ctpr-s1-csrf-token-persistence.js — unit tests for the ctpr-s1 fix to
// src/web-ui/middleware/csrf.js's generateCsrfToken, which now calls
// session.js's persistSession() at the moment a new token is minted.
// Story: artefacts/2026-08-27-csrf-token-not-persisted-across-restart/stories/ctpr-s1-persist-csrf-token-on-generation.md
// Test plan: artefacts/2026-08-27-csrf-token-not-persisted-across-restart/test-plans/ctpr-s1-test-plan.md

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

// A call-counting spy adapter — sufficient for AC1-AC3, which only need to
// know whether/how many times a write was attempted, not real read-back.
function makeSpyAdapter() {
  var calls = [];
  return {
    calls: calls,
    writeSession: async function(id, data) { calls.push({ id: id, data: data }); },
    readSession: async function() { return null; },
    deleteSession: async function() {}
  };
}

// A real in-memory Map standing in for Redis itself — needed for AC4's
// end-to-end proof, where the data written must actually be readable back
// on the rehydration path exercised by sessionMiddleware.
function makeFakeRedis() {
  var store = new Map();
  return {
    store: store,
    writeSession: async function(id, data) { store.set(id, Object.assign({}, data)); },
    readSession: async function(id) { return store.has(id) ? Object.assign({}, store.get(id)) : null; },
    deleteSession: async function(id) { store.delete(id); }
  };
}

async function run() {
  console.log('=== ctpr-s1: csrf.js generateCsrfToken Redis persistence tests ===');

  var queue = [];

  // AC1: a fresh generateCsrfToken call triggers exactly one persistSession-driven write
  queue.push(function() {
    return test('AC1: generateCsrfToken persists a newly-minted token', function() {
      session._clearForTesting();
      var adapter = makeSpyAdapter();
      session.setRedisAdapterForTesting(adapter);
      try {
        var created = session.createSession();
        var req = { session: session.getSession(created.id), sessionId: created.id };

        var token = csrf.generateCsrfToken(req);

        assert.strictEqual(adapter.calls.length, 1, 'exactly one Redis write must occur');
        assert.strictEqual(adapter.calls[0].id, created.id, 'write must target the session id');
        assert.strictEqual(adapter.calls[0].data.csrfToken, token, 'written data must contain the newly-minted token');
      } finally {
        session.setRedisAdapterForTesting(null);
        session._clearForTesting();
      }
    });
  });

  // AC2: calling generateCsrfToken again on the same session does not trigger a second write
  queue.push(function() {
    return test('AC2: idempotent reuse does not re-persist', function() {
      session._clearForTesting();
      var adapter = makeSpyAdapter();
      session.setRedisAdapterForTesting(adapter);
      try {
        var created = session.createSession();
        var req = { session: session.getSession(created.id), sessionId: created.id };

        var t1 = csrf.generateCsrfToken(req);
        var t2 = csrf.generateCsrfToken(req);

        assert.strictEqual(t1, t2, 'token must be unchanged on reuse');
        assert.strictEqual(adapter.calls.length, 1, 'only the first, token-minting call may persist');
      } finally {
        session.setRedisAdapterForTesting(null);
        session._clearForTesting();
      }
    });
  });

  // AC3: with no Redis adapter configured, generateCsrfToken behaves exactly as before this fix
  queue.push(function() {
    return test('AC3: no-adapter case behaves exactly as before the fix', function() {
      session.setRedisAdapterForTesting(null);
      var req = { session: {} };

      var token = csrf.generateCsrfToken(req);

      assert.ok(token && token.length > 0, 'token must be non-empty');
      assert.ok(/^[a-f0-9]+$/.test(token), 'token must be hex');
      assert.strictEqual(req.session.csrfToken, token, 'token must still be stored on req.session.csrfToken');
    });
  });

  // AC4: end-to-end — token survives a simulated restart via Redis rehydration
  queue.push(function() {
    return test('AC4: rehydrated session after simulated restart carries the originally-minted token', async function() {
      session._clearForTesting();
      var adapter = makeFakeRedis();
      session.setRedisAdapterForTesting(adapter);
      try {
        var created = session.createSession();
        var req = { session: session.getSession(created.id), sessionId: created.id };
        var mintedToken = csrf.generateCsrfToken(req);

        // Let persistSession's internal async write settle.
        await new Promise(function(r) { setImmediate(r); });

        // Simulate a process restart: in-memory session store is wiped, but
        // the fake Redis's own store survives (it is not touched by _clearForTesting).
        session._clearForTesting();
        assert.ok(!session.getSession(created.id), 'session must be absent from memory before rehydration');

        var rehydrateReq = { headers: { cookie: 'session_id=' + created.id } };
        var rehydrateRes = { setHeader: function() {} };
        await session.sessionMiddleware(rehydrateReq, rehydrateRes);

        assert.strictEqual(rehydrateReq.sessionId, created.id, 'rehydrated session must keep the same session id');
        assert.strictEqual(rehydrateReq.session.csrfToken, mintedToken, 'rehydrated csrfToken must match the originally-minted token');
      } finally {
        session.setRedisAdapterForTesting(null);
        session._clearForTesting();
      }
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
