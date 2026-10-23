'use strict';
var assert = require('assert');
var passed = 0; var failed = 0; var failures = [];
function test(name, fn) {
  try { fn(); passed++; console.log('  PASS: ' + name); }
  catch (err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); }
}
var { createRateLimiter, buildRateLimitKey } = require('../src/web-ui/middleware/rate-limiter');

function makeReq(tenantId) {
  return { session: { tenantId: tenantId }, headers: {}, ip: '127.0.0.1' };
}
function makeRes() {
  var res = { _status: null, _body: null };
  res.writeHead = function(status) { res._status = status; };
  res.end = function(body) { res._body = body; };
  return res;
}

console.log('\ncheck-ppc-s3-rate-limiter-keyfn.js');

test('regression: no keyFn/onLimited passed -- default tenantId-keyed behaviour is unchanged', function() {
  var limiter = createRateLimiter({ maxRequests: 1, windowMs: 60000 });
  var nextCalled = 0;
  limiter(makeReq('tenant-a'), makeRes(), function() { nextCalled++; });
  var res2 = makeRes();
  limiter(makeReq('tenant-a'), res2, function() { nextCalled++; });
  assert.strictEqual(nextCalled, 1, 'first call allowed, second (same tenant) blocked -- unchanged default shape');
  assert.strictEqual(res2._status, 429);
});

test('keyFn: a custom key function is used instead of buildRateLimitKey when provided', function() {
  var limiter = createRateLimiter({
    maxRequests: 1,
    windowMs: 60000,
    keyFn: function(req) { return req.userIdForTest; }
  });
  var nextCalled = 0;
  limiter({ userIdForTest: 'user-a', session: { tenantId: 'same-tenant' }, headers: {} }, makeRes(), function() { nextCalled++; });
  var res2 = makeRes();
  limiter({ userIdForTest: 'user-b', session: { tenantId: 'same-tenant' }, headers: {} }, res2, function() { nextCalled++; });
  assert.strictEqual(nextCalled, 2, 'two different keyFn-derived keys must not block each other, even under the same tenantId');
  assert.notStrictEqual(res2._status, 429);
});

test('onLimited: a custom callback is invoked instead of the default raw-JSON 429 write', function() {
  var onLimitedCalled = false;
  var limiter = createRateLimiter({
    maxRequests: 1,
    windowMs: 60000,
    keyFn: function() { return 'fixed-key'; },
    onLimited: function(req, res) { onLimitedCalled = true; res.writeHead(429); res.end('custom body'); }
  });
  limiter({ session: {}, headers: {} }, makeRes(), function() {});
  var res2 = makeRes();
  limiter({ session: {}, headers: {} }, res2, function() {});
  assert.strictEqual(onLimitedCalled, true);
  assert.strictEqual(res2._body, 'custom body', 'the default JSON body must not be written when onLimited is provided');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
  process.exit(1);
}
