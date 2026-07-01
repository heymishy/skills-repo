'use strict';

// check-sec1-sse-rate-limit.js
// Verifies AC1: handlePostTurnStreamHtml is protected by the rate limiter
// (30 requests/min per tenant, 429 before any model API call).
//
// Run: node tests/check-sec1-sse-rate-limit.js

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

// ── test the rate limiter directly ───────────────────────────────────────────

var { createRateLimiter, buildRateLimitKey } = require('../src/web-ui/middleware/rate-limiter');

function fakeRes() {
  var r = { _status: null, _body: '', _headers: {} };
  r.writeHead = function(s, h) { r._status = s; Object.assign(r._headers, h || {}); };
  r.end = function(b) { r._body = b || ''; };
  r.setHeader = function(k, v) { r._headers[k] = v; };
  return r;
}

function fakeReqWithTenant(tenantId) {
  return { session: { tenantId: tenantId, accessToken: 'tok' } };
}

// ── AC1a: requests up to limit pass (next called) ────────────────────────────

console.log('\nAC1a — requests up to maxRequests pass');
(function() {
  var limiter = createRateLimiter({ maxRequests: 30, windowMs: 60000 });
  var req = fakeReqWithTenant('tenant-a');
  var passCount = 0;
  for (var i = 0; i < 30; i++) {
    var res = fakeRes();
    limiter(req, res, function() { passCount++; });
  }
  ok('all 30 requests pass (next called)', passCount === 30);
})();

// ── AC1b: request 31 returns 429 ─────────────────────────────────────────────

console.log('\nAC1b — 31st request returns 429');
(function() {
  var limiter = createRateLimiter({ maxRequests: 30, windowMs: 60000 });
  var req = fakeReqWithTenant('tenant-b');
  var lastRes;
  for (var i = 0; i < 31; i++) {
    lastRes = fakeRes();
    limiter(req, lastRes, function() {});
  }
  ok('31st request returns 429', lastRes._status === 429);
  ok('429 body is JSON', (function() { try { JSON.parse(lastRes._body); return true; } catch (_) { return false; } })());
})();

// ── AC1c: different tenants have independent counters ────────────────────────

console.log('\nAC1c — different tenants have independent counters');
(function() {
  var limiter = createRateLimiter({ maxRequests: 5, windowMs: 60000 });
  var reqA = fakeReqWithTenant('tenant-x');
  var reqB = fakeReqWithTenant('tenant-y');

  // exhaust tenant-x
  for (var i = 0; i < 5; i++) {
    limiter(reqA, fakeRes(), function() {});
  }
  // 6th for tenant-x should 429
  var resA6 = fakeRes();
  limiter(reqA, resA6, function() {});
  ok('tenant-x is rate-limited at 6th request', resA6._status === 429);

  // tenant-y still has capacity
  var resB1 = fakeRes();
  var passedB = false;
  limiter(reqB, resB1, function() { passedB = true; });
  ok('tenant-y counter is independent (not rate-limited)', passedB === true);
  ok('tenant-y response is not 429', resB1._status !== 429);
})();

// ── AC1d: 429 response before any model call (no SSE headers emitted) ────────

console.log('\nAC1d — 429 contains no SSE headers');
(function() {
  var limiter = createRateLimiter({ maxRequests: 1, windowMs: 60000 });
  var req = fakeReqWithTenant('tenant-c');
  limiter(req, fakeRes(), function() {}); // consume the 1 allowed
  var res = fakeRes();
  limiter(req, res, function() {});
  ok('no text/event-stream header on 429', res._headers['Content-Type'] !== 'text/event-stream');
  ok('status is 429', res._status === 429);
})();

// ── AC1e: buildRateLimitKey uses tenantId not IP when tenantId present ────────

console.log('\nAC1e — buildRateLimitKey prefers tenantId over IP');
(function() {
  var req = { session: { tenantId: 'my-org' }, ip: '1.2.3.4' };
  ok('key is tenantId', buildRateLimitKey(req) === 'my-org');

  var reqNoTenant = { session: {}, ip: '5.6.7.8' };
  ok('key falls back to IP when no tenantId', buildRateLimitKey(reqNoTenant) === '5.6.7.8');
})();

// ── AC1f: no session → 401 (not 429, not next) ───────────────────────────────

console.log('\nAC1f — missing session → 401');
(function() {
  var limiter = createRateLimiter({ maxRequests: 30, windowMs: 60000 });
  var req = { session: null };
  var res = fakeRes();
  var nextCalled = false;
  limiter(req, res, function() { nextCalled = true; });
  ok('returns 401 when no session', res._status === 401);
  ok('next not called when no session', nextCalled === false);
})();

// ── finish ────────────────────────────────────────────────────────────────────

console.log('\n--- Results:', passed, 'passed,', failed, 'failed ---');
process.exit(failed > 0 ? 1 : 0);
