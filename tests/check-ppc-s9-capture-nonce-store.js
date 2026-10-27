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

queue.push(function() {
  return test('AC2 (D37 stub): issueNonce/exchangeNonce throw until wired', async function() {
    delete require.cache[require.resolve('../src/web-ui/adapters/capture-nonce-store')];
    var mod = require('../src/web-ui/adapters/capture-nonce-store');
    var threw = false;
    try { await mod.issueNonce('some-session-id'); } catch (err) {
      threw = true;
      assert.ok(/not wired/i.test(err.message), 'error must name the adapter and instruct how to wire it');
    }
    assert.ok(threw, 'must throw, never return null/undefined silently');
  });
});

queue.push(function() {
  return test('AC2: nonce exchanges for the real sessionId exactly once, second attempt fails', async function() {
    var mod = require('../src/web-ui/adapters/capture-nonce-store');
    var store = {};
    mod.setNonceStoreAdapter({
      set: async function(key, value) { store[key] = value; },
      get: async function(key) { return store[key] !== undefined ? store[key] : null; },
      del: async function(key) { delete store[key]; }
    });
    var nonce = await mod.issueNonce('abc123sessionid');
    var first = await mod.exchangeNonce(nonce);
    assert.strictEqual(first, 'abc123sessionid');
    var second = await mod.exchangeNonce(nonce);
    assert.strictEqual(second, null, 'a second exchange of the same nonce must fail -- single-use');
  });
});

queue.push(function() {
  return test('AC2: an expired nonce (TTL already elapsed) fails exchange, same as never-existed', async function() {
    var mod = require('../src/web-ui/adapters/capture-nonce-store');
    // Simulate TTL expiry: the fake adapter's own set() never persists past a
    // simulated "already expired" marker -- get() returns null regardless of
    // what was stored, modelling what a real Redis EX-expired key does.
    mod.setNonceStoreAdapter({
      set: async function() {},
      get: async function() { return null; },
      del: async function() {}
    });
    var nonce = await mod.issueNonce('xyz');
    var result = await mod.exchangeNonce(nonce);
    assert.strictEqual(result, null, 'an expired/never-persisted nonce must fail exchange, not throw and not return a stale value');
  });
});

queue.push(function() {
  return test('AC2: two different sessions issue two different, individually-correct nonces (D37 behavioural correctness, not just wiring)', async function() {
    var mod = require('../src/web-ui/adapters/capture-nonce-store');
    var store = {};
    mod.setNonceStoreAdapter({
      set: async function(key, value) { store[key] = value; },
      get: async function(key) { return store[key] !== undefined ? store[key] : null; },
      del: async function(key) { delete store[key]; }
    });
    var nonceA = await mod.issueNonce('session-A');
    var nonceB = await mod.issueNonce('session-B');
    assert.notStrictEqual(nonceA, nonceB, 'two different sessions must get two different nonces');
    var resultA = await mod.exchangeNonce(nonceA);
    var resultB = await mod.exchangeNonce(nonceB);
    assert.strictEqual(resultA, 'session-A');
    assert.strictEqual(resultB, 'session-B');
    assert.notStrictEqual(resultA, resultB, 'nonce A must never resolve to session B\'s own id or vice versa');
  });
});

(async function() {
  console.log('\ncheck-ppc-s9-capture-nonce-store.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
