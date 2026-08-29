'use strict';

// check-cpr-s1-csrf-persist-race.js — unit tests for the cpr-s1 fix closing the
// race between persisting a newly-minted CSRF token and the process suspending
// mid-write. Extends ctpr-s1's own fixtures/house style.
// Story: artefacts/2026-08-27-csrf-persist-race-on-suspend/stories/cpr-s1-await-csrf-persist-before-response.md
// Test plan: artefacts/2026-08-27-csrf-persist-race-on-suspend/test-plans/cpr-s1-test-plan.md
//
// Prior to this fix, session.js's persistSession() fired adapter.writeSession(...)
// without awaiting it, and csrf.js's generateCsrfToken() never awaited
// persistSession() either -- so a real, network-latency-bearing Redis write could
// still be in flight when the process suspended, losing the token. This fix makes
// persistSession() return its write promise (capped at a short timeout so a
// hung/slow adapter can never block the caller indefinitely) and makes
// generateCsrfToken() async, awaiting persistSession() before it resolves.

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

// A real in-memory Map standing in for Redis itself -- needed wherever the data
// written must actually be readable back (e.g. AC1's immediate-read-after-await
// check, and AC2/AC6's rehydration-after-simulated-restart check).
// `delayMs` (optional) makes writeSession artificially slow, to simulate a real
// network round-trip racing against process suspend.
function makeFakeRedis(delayMs) {
  var store = new Map();
  return {
    store: store,
    writeSession: async function(id, data) {
      if (delayMs) { await new Promise(function(r) { setTimeout(r, delayMs); }); }
      store.set(id, Object.assign({}, data));
    },
    readSession: async function(id) { return store.has(id) ? Object.assign({}, store.get(id)) : null; },
    deleteSession: async function(id) { store.delete(id); }
  };
}

// A rejecting adapter -- for AC4's "write fails" branch.
function makeRejectingRedis() {
  return {
    writeSession: async function() { throw new Error('simulated Redis write failure'); },
    readSession: async function() { return null; },
    deleteSession: async function() {}
  };
}

// A hanging adapter -- for AC4's "write never resolves" branch (proves the
// timeout cap, not just the .catch()-based failure path).
function makeHangingRedis() {
  return {
    writeSession: function() { return new Promise(function() { /* never resolves */ }); },
    readSession: async function() { return null; },
    deleteSession: async function() {}
  };
}

async function run() {
  console.log('=== cpr-s1: csrf-persist race-on-suspend tests ===');

  var queue = [];

  // AC1: token is present in the fake Redis store immediately after
  // generateCsrfToken resolves -- no further awaits needed. Proves
  // generateCsrfToken does not resolve until the write has actually landed.
  queue.push(function() {
    return test('AC1: token is durably persisted before generateCsrfToken resolves', async function() {
      session._clearForTesting();
      var adapter = makeFakeRedis();
      session.setRedisAdapterForTesting(adapter);
      try {
        var created = session.createSession();
        var req = { session: session.getSession(created.id), sessionId: created.id };

        var token = await csrf.generateCsrfToken(req);

        // No further awaits -- read the fake Redis store directly, synchronously.
        var stored = adapter.store.get(created.id);
        assert.ok(stored, 'token must already be present in the fake Redis store the instant generateCsrfToken resolves');
        assert.strictEqual(stored.csrfToken, token, 'stored csrfToken must match the minted token');
      } finally {
        session.setRedisAdapterForTesting(null);
        session._clearForTesting();
      }
    });
  });

  // AC2/AC6 (the critical test): a fake adapter with real injected write
  // latency, racing generateCsrfToken's await against a simulated process
  // "restart" immediately afterward. If the await genuinely waits for the
  // delayed write, the restart (however soon after) can never race ahead of
  // it -- the rehydrated session must carry the minted token.
  //
  // Sanity-checked during development (not left in the file): temporarily
  // reverting csrf.js's `await persistSession(...)` back to a bare, unawaited
  // `persistSession(...)` call reproduces the pre-fix bug and makes this exact
  // test fail with the rehydrated csrfToken undefined -- confirming the test
  // is real and would have caught the original race.
  queue.push(function() {
    return test('AC2/AC6: rehydration after a simulated restart immediately following a slow write still carries the minted token', async function() {
      session._clearForTesting();
      var adapter = makeFakeRedis(50); // 50ms simulated network round-trip
      session.setRedisAdapterForTesting(adapter);
      try {
        var created = session.createSession();
        var req = { session: session.getSession(created.id), sessionId: created.id };

        var mintedToken = await csrf.generateCsrfToken(req);

        // Simulate the process "restarting" the instant the response would be
        // sent -- no extra tick, no setImmediate, immediately after the await
        // returns. This is the exact race the story closes.
        session._clearForTesting();
        assert.ok(!session.getSession(created.id), 'session must be absent from memory before rehydration');

        var rehydrateReq = { headers: { cookie: 'session_id=' + created.id } };
        var rehydrateRes = { setHeader: function() {} };
        await session.sessionMiddleware(rehydrateReq, rehydrateRes);

        assert.strictEqual(rehydrateReq.sessionId, created.id, 'rehydrated session must keep the same session id');
        assert.strictEqual(rehydrateReq.session.csrfToken, mintedToken, 'rehydrated csrfToken must match the originally-minted token -- proves the await genuinely waited for the delayed write');
      } finally {
        session.setRedisAdapterForTesting(null);
        session._clearForTesting();
      }
    });
  });

  // cptr-s1 AC1: a write slower than the OLD 500ms cap but within the NEW
  // 8000ms cap must resolve via the real write landing, not via the timeout
  // branch of persistSession's own Promise.race. This is the exact race
  // cptr-s1 closes -- fly.toml's auto_stop_machines = 'suspend' sends no
  // signal to the process before freezing it, so the only way to guarantee
  // durability is for the response to genuinely wait for the real write.
  queue.push(function() {
    return test('cptr-s1 AC1: a 2000ms write (slower than the old 500ms cap) resolves via the real write, not a timeout', async function() {
      session._clearForTesting();
      var adapter = makeFakeRedis(2000);
      session.setRedisAdapterForTesting(adapter);
      try {
        var created = session.createSession();
        var req = { session: session.getSession(created.id), sessionId: created.id };

        var start = Date.now();
        var token = await csrf.generateCsrfToken(req);
        var elapsedMs = Date.now() - start;

        assert.ok(elapsedMs >= 2000, 'generateCsrfToken must have waited for the real 2000ms write, took only ' + elapsedMs + 'ms -- if this is under 2000ms, the OLD 500ms-capped race is still winning');
        var stored = adapter.store.get(created.id);
        assert.ok(stored, 'token must be present in the fake Redis store -- proves the real write landed, not just the timeout branch');
        assert.strictEqual(stored.csrfToken, token, 'stored csrfToken must match the minted token');
      } finally {
        session.setRedisAdapterForTesting(null);
        session._clearForTesting();
      }
    });
  });

  // AC3: no Redis adapter configured -- resolves cleanly, no throw, no hang.
  queue.push(function() {
    return test('AC3: no-adapter case resolves cleanly with no throw', async function() {
      session.setRedisAdapterForTesting(null);
      var req = { session: {} };

      var token = await csrf.generateCsrfToken(req);

      assert.ok(token && token.length > 0, 'token must be non-empty');
      assert.ok(/^[a-f0-9]+$/.test(token), 'token must be hex');
    });
  });

  // AC4a: adapter's writeSession rejects -- generateCsrfToken still resolves
  // with the token, never throws.
  queue.push(function() {
    return test('AC4a: a rejecting Redis write still resolves generateCsrfToken with the token', async function() {
      session._clearForTesting();
      session.setRedisAdapterForTesting(makeRejectingRedis());
      try {
        var created = session.createSession();
        var req = { session: session.getSession(created.id), sessionId: created.id };

        var token = await csrf.generateCsrfToken(req);

        assert.ok(token && token.length > 0, 'generateCsrfToken must still resolve with a valid token despite the write rejecting');
      } finally {
        session.setRedisAdapterForTesting(null);
        session._clearForTesting();
      }
    });
  });

  // AC4b: adapter's writeSession hangs forever -- generateCsrfToken still
  // resolves within a bounded time (proves the timeout cap, not just the
  // .catch()-based rejection path).
  // cptr-s1: bound raised from "well under 2s" to "well under 9s" -- a
  // declared, necessary consequence of raising _PERSIST_TIMEOUT_MS from
  // 500ms to 8000ms (see cptr-s1's own story AC5 and decisions.md). The
  // circuit-breaker property itself (must not hang forever) is unchanged;
  // only the bound's value moved with the timeout constant it tests.
  queue.push(function() {
    return test('AC4b: a hanging Redis write still resolves generateCsrfToken within a bounded time', async function() {
      session._clearForTesting();
      session.setRedisAdapterForTesting(makeHangingRedis());
      try {
        var created = session.createSession();
        var req = { session: session.getSession(created.id), sessionId: created.id };

        var start = Date.now();
        var token = await csrf.generateCsrfToken(req);
        var elapsedMs = Date.now() - start;

        assert.ok(token && token.length > 0, 'generateCsrfToken must still resolve with a valid token despite the write hanging');
        assert.ok(elapsedMs < 9000, 'generateCsrfToken must resolve within a bounded time (well under 9s, consistent with the new 8000ms cap), took ' + elapsedMs + 'ms -- the timeout cap must have fired');
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
      console.log('FAILED:', f.name, '-', f.err && (f.err.stack || f.err.message) || f.err);
    });
    process.exit(1);
  }
  process.exit(0);
}

run();
