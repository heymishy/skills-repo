'use strict';
// check-p4.1-tenant-cache-ratelimit.js -- p4.1: Prompt-cache key scoping + per-tenant rate-limit isolation
// TDD: tests FAIL before implementation, PASS after.
// NOTE: Rate-limit counters use in-process Map (W1 RISK-ACCEPT — Phase 3 Redis waived).

var assert = require('assert');

var CACHE_KEY_PATH    = require('path').resolve(__dirname, '../src/web-ui/adapters/cache-key.js');
var RATE_LIMITER_PATH = require('path').resolve(__dirname, '../src/web-ui/middleware/rate-limiter.js');

function freshRequire() {
  try { delete require.cache[require.resolve(CACHE_KEY_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(RATE_LIMITER_PATH)]; } catch (_) {}
  var cacheKey    = require(CACHE_KEY_PATH);
  var rateLimiter = require(RATE_LIMITER_PATH);
  return { cacheKey: cacheKey, rateLimiter: rateLimiter };
}

function makeReq(overrides) {
  return Object.assign(
    { session: {}, headers: {}, connection: { remoteAddress: '1.2.3.4' }, ip: '1.2.3.4' },
    overrides
  );
}

var passed = 0;
var failed = 0;
var failures = [];

function test(name, fn) {
  try {
    passed++; fn(); console.log('  [PASS]', name);
  } catch (err) {
    passed--;
    failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err);
  }
}

function main() {
  var r = freshRequire();
  var buildCacheKey    = r.cacheKey.buildCacheKey;
  var buildRateLimitKey = r.rateLimiter.buildRateLimitKey;
  var createRateLimiter = r.rateLimiter.createRateLimiter;

  // -- AC1: cache keys distinct for same sessionId across different tenants
  console.log('\n[p4.1-tenant-cache-ratelimit] AC1 -- cache key isolation (safety-critical)');
  test('AC1: keys distinct for org-a and org-b with same sessionId', function() {
    var keyA = buildCacheKey({ tenantId: 'org-a', sessionId: 'abc' });
    var keyB = buildCacheKey({ tenantId: 'org-b', sessionId: 'abc' });
    assert.notStrictEqual(keyA, keyB, 'keys must differ — cross-tenant cache bleed risk');
  });

  // -- AC2: cache key format ${tenantId}-${sessionId}
  console.log('\n[p4.1-tenant-cache-ratelimit] AC2 -- cache key format');
  test('AC2: key is tenantId-sessionId', function() {
    var key = buildCacheKey({ tenantId: 'my-org', sessionId: 'xyz123' });
    assert.strictEqual(key, 'my-org-xyz123');
  });

  // -- AC3: fallback to sessionId when tenantId absent
  console.log('\n[p4.1-tenant-cache-ratelimit] AC3 -- cache key fallback');
  test('AC3a: no tenantId field → returns sessionId', function() {
    assert.strictEqual(buildCacheKey({ sessionId: 'xyz123' }), 'xyz123');
  });
  test('AC3b: tenantId: null → returns sessionId', function() {
    assert.strictEqual(buildCacheKey({ tenantId: null, sessionId: 'xyz123' }), 'xyz123');
  });
  test('AC3c: tenantId: undefined → returns sessionId', function() {
    assert.strictEqual(buildCacheKey({ tenantId: undefined, sessionId: 'xyz123' }), 'xyz123');
  });

  // -- AC4: per-tenant rate-limit counters isolated
  console.log('\n[p4.1-tenant-cache-ratelimit] AC4 -- rate-limit counter isolation');
  test('AC4: org-a hitting limit does not affect org-b counter', function() {
    var rl = createRateLimiter({ maxRequests: 5, windowMs: 60000 });
    var blocked = 0;
    var next = function() {};
    // Saturate org-a (6 requests > maxRequests of 5)
    for (var i = 0; i < 6; i++) {
      var res = { _code: null, writeHead: function(c) { this._code = c; }, end: function() {} };
      rl(makeReq({ session: { tenantId: 'org-a', userId: '1', login: 'alice' } }), res, next);
      if (res._code === 429) blocked++;
    }
    assert.ok(blocked > 0, 'org-a should have been rate-limited');

    // org-b should still be allowed
    var res2 = { _code: null, writeHead: function(c) { this._code = c; }, end: function() {} };
    var nextCalled = false;
    rl(makeReq({ session: { tenantId: 'org-b', userId: '2', login: 'bob' } }), res2, function() { nextCalled = true; });
    assert.ok(nextCalled, 'org-b next() should have been called (not rate-limited)');
    assert.notStrictEqual(res2._code, 429, 'org-b must not receive 429');
  });

  // -- AC5: rate-limit key includes tenantId
  console.log('\n[p4.1-tenant-cache-ratelimit] AC5 -- rate-limit key includes tenantId');
  test('AC5: buildRateLimitKey includes tenantId when present', function() {
    var key = buildRateLimitKey(makeReq({ session: { tenantId: 'my-org' } }));
    assert.ok(key.includes('my-org'), 'key must include tenantId, got: ' + key);
  });
  test('AC5b: tenantId takes precedence — key does not need IP when tenantId present', function() {
    var key = buildRateLimitKey(makeReq({ session: { tenantId: 'my-org' } }));
    assert.ok(typeof key === 'string' && key.length > 0, 'key must be non-empty string');
    assert.ok(key.includes('my-org'), 'key must include tenantId');
  });

  // -- AC6: rate-limit key falls back to IP when tenantId absent
  console.log('\n[p4.1-tenant-cache-ratelimit] AC6 -- rate-limit key IP fallback');
  test('AC6a: no tenantId → key includes IP', function() {
    var key = buildRateLimitKey(makeReq({ session: {} }));
    assert.ok(key.includes('1.2.3.4'), 'key must include IP when tenantId absent, got: ' + key);
  });
  test('AC6b: tenantId: null → key includes IP', function() {
    var key = buildRateLimitKey(makeReq({ session: { tenantId: null } }));
    assert.ok(key.includes('1.2.3.4'), 'key must include IP when tenantId null, got: ' + key);
  });

  // -- NFR: buildCacheKey is synchronous
  console.log('\n[p4.1-tenant-cache-ratelimit] NFR -- synchronous key construction');
  test('NFR: buildCacheKey returns a string synchronously (not a Promise)', function() {
    var result = buildCacheKey({ tenantId: 'org-a', sessionId: 'abc' });
    assert.ok(typeof result === 'string', 'expected string, got ' + typeof result);
    assert.ok(!(result && typeof result.then === 'function'), 'must not return a Promise');
  });

  // -- Results
  console.log('\n[p4.1-tenant-cache-ratelimit] ' + (passed + failed) + ' run, ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    failures.forEach(function(f) { console.log('  FAILURE:', f.name, '--', f.err && f.err.message || f.err); });
  }
  if (failed > 0) process.exit(1);
}

main();
