'use strict';

/**
 * check-mgar-s1-ttl-auto-revert.js — AC verification for mgar-s1
 * "Auto-revert the staging mock LLM gateway override, and force it on before CI staging E2E runs"
 *
 * Story:     artefacts/2026-08-09-mock-gateway-auto-revert/stories/mgar-s1-auto-revert-and-ci-enforcement.md
 * Test plan: artefacts/2026-08-09-mock-gateway-auto-revert/test-plans/mgar-s1-test-plan.md
 *
 * Covers:
 *   AC1 — stale "off" override auto-reverts after the TTL
 *   AC2 — "on" override never auto-reverts
 *   AC3 — refreshing the override restarts the TTL window
 *   AC4 — admin page states the TTL and remaining time when off
 */

const assert = require('assert');

let passed = 0;
let failed = 0;

const pending = [];
function test(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      pending.push(result.then(
        function() { passed++; console.log('  [PASS] ' + name); },
        function(err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
      ));
      return;
    }
    passed++; console.log('  [PASS] ' + name);
  } catch (err) {
    failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err));
  }
}

const mockGatewayPath = require.resolve('../src/web-ui/modules/mock-llm-gateway');
const adminRoutePath = require.resolve('../src/web-ui/routes/admin-mock-gateway');

function freshMockGateway() {
  delete require.cache[mockGatewayPath];
  return require('../src/web-ui/modules/mock-llm-gateway');
}
function freshAdminRoute() {
  delete require.cache[adminRoutePath];
  return require('../src/web-ui/routes/admin-mock-gateway');
}
function makeRes() {
  const r = { _status: null, _headers: {}, _body: '' };
  r.writeHead = function(s, h) { r._status = s; Object.assign(r._headers, h || {}); };
  r.end = function(b) { r._body += (b || ''); };
  return r;
}

const envSnapshot = { NODE_ENV: process.env.NODE_ENV, MOCK_LLM_GATEWAY: process.env.MOCK_LLM_GATEWAY };
function restoreEnv() {
  if (envSnapshot.NODE_ENV === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = envSnapshot.NODE_ENV;
  if (envSnapshot.MOCK_LLM_GATEWAY === undefined) delete process.env.MOCK_LLM_GATEWAY; else process.env.MOCK_LLM_GATEWAY = envSnapshot.MOCK_LLM_GATEWAY;
}

console.log('\n[mgar-s1] AC1 -- stale off override auto-reverts after TTL');
test('offOverride_expiresAfterTTL_fallsBackToEnvDefault', function() {
  process.env.NODE_ENV = 'development';
  process.env.MOCK_LLM_GATEWAY = 'true';
  const mg = freshMockGateway();
  mg.resetRuntimeMockGatewayOverride();

  let fakeNow = 1000000;
  mg._setClockForTest(function() { return fakeNow; });
  try {
    mg.setRuntimeMockGatewayOverride(false);
    assert.strictEqual(mg.isMockGatewayEnabled(), false, 'Precondition: override honoured immediately');

    fakeNow += 31 * 60 * 1000; // 31 minutes later -- past the 30-minute TTL
    assert.strictEqual(mg.isMockGatewayEnabled(), true, 'Expected fallback to MOCK_LLM_GATEWAY=true once the stale off override expired');
    assert.strictEqual(mg.getRuntimeMockGatewayOverride(), null, 'Expired override must be reset to null, not just bypassed');
  } finally {
    mg._setClockForTest(null);
  }
});

console.log('\n[mgar-s1] AC2 -- on override never auto-reverts');
test('onOverride_neverExpires_evenPastTTL', function() {
  delete process.env.NODE_ENV;
  delete process.env.MOCK_LLM_GATEWAY;
  const mg = freshMockGateway();
  mg.resetRuntimeMockGatewayOverride();

  let fakeNow = 1000000;
  mg._setClockForTest(function() { return fakeNow; });
  try {
    mg.setRuntimeMockGatewayOverride(true);
    fakeNow += 10 * 60 * 60 * 1000; // 10 hours later
    assert.strictEqual(mg.isMockGatewayEnabled(), true, 'On override must never expire, regardless of elapsed time');
    assert.strictEqual(mg.getRuntimeMockGatewayOverride(), true, 'On override value itself must be untouched');
  } finally {
    mg._setClockForTest(null);
  }
});

console.log('\n[mgar-s1] AC3 -- refreshing the off override restarts the TTL window');
test('offOverride_refreshedBeforeExpiry_windowRestarts', function() {
  process.env.NODE_ENV = 'development';
  process.env.MOCK_LLM_GATEWAY = 'true';
  const mg = freshMockGateway();
  mg.resetRuntimeMockGatewayOverride();

  let fakeNow = 1000000;
  mg._setClockForTest(function() { return fakeNow; });
  try {
    mg.setRuntimeMockGatewayOverride(false);
    fakeNow += 25 * 60 * 1000; // 25 minutes -- just before the 30-minute TTL
    assert.strictEqual(mg.isMockGatewayEnabled(), false, 'Precondition: still honoured just before expiry');

    mg.setRuntimeMockGatewayOverride(false); // refresh
    fakeNow += 25 * 60 * 1000; // another 25 minutes -- would have expired the ORIGINAL window (50 min total)
    assert.strictEqual(mg.isMockGatewayEnabled(), false, 'Refreshed override must still be honoured -- TTL window must have restarted at the refresh call');
  } finally {
    mg._setClockForTest(null);
  }
});

console.log('\n[mgar-s1] AC4 -- admin page states TTL and remaining time when off');
test('adminPage_offOverride_showsTTLAndRemainingTime', function() {
  process.env.NODE_ENV = 'development';
  process.env.MOCK_LLM_GATEWAY = 'true';
  const mg = freshMockGateway();
  mg.resetRuntimeMockGatewayOverride();

  let fakeNow = 1000000;
  mg._setClockForTest(function() { return fakeNow; });
  try {
    mg.setRuntimeMockGatewayOverride(false);
    fakeNow += 5 * 60 * 1000; // 5 minutes elapsed, 25 remaining

    const route = freshAdminRoute();
    const req = { session: { userId: 1, role: 'admin', login: 'hamish' } };
    const res = makeRes();
    // pncg-s1: adminMockGatewayGet now threads a `pool` param through to
    // renderShellWithNav's own getProductsNavSummary(pool, tenantId) call --
    // empty rows is fine, this test doesn't assert on the Products nav section.
    return route.adminMockGatewayGet(req, res, { query: async function() { return { rows: [] }; } }).then(function() {
      assert.ok(/auto-revert|auto revert/i.test(res._body), 'Admin page must mention auto-revert when the override is off');
      assert.ok(/30 minute/i.test(res._body), 'Admin page must state the TTL duration (30 minutes)');
      assert.ok(/remaining|left|expires in/i.test(res._body), 'Admin page must state approximate remaining time before auto-revert');
    });
  } finally {
    mg._setClockForTest(null);
  }
});

Promise.all(pending).then(function() {
  restoreEnv();
  const mg = freshMockGateway();
  mg.resetRuntimeMockGatewayOverride();
  console.log('\n[mgar-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
});
