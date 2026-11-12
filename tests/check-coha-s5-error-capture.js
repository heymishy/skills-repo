'use strict';
// coha-s5 -- production error capture to PostHog with tenant text scrubbed.
// Plain Node script. Run: node tests/check-coha-s5-error-capture.js
const assert = require('assert');
const crypto = require('crypto');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

const ec = require('../src/web-ui/modules/error-capture');
const rnd = () => 'tnt-' + crypto.randomBytes(6).toString('hex');
const seed = rnd();  // printed on failure

function sdkEvent(msg, extra) {
  return { event: '$exception', distinctId: 'someone@example.com', properties: Object.assign({
    $exception_list: [{ type: 'Error', value: msg, mechanism: { handled: true },
      stacktrace: { type: 'raw', frames: [{ filename: 'a.js', function: 'f', lineno: 1, colno: 2, in_app: true, platform: 'node:javascript',
        pre_context: ['x ' + seed], context_line: 'y ' + seed, post_context: ['z ' + seed] }] } }],
    $exception_level: 'error', $lib: 'posthog-node', $lib_version: '5.40.0', $is_server: true, $geoip_disable: true,
    tenantId: seed, reason: 'db ' + seed }, extra || {}) };
}

test('scrubEvent_keepsOnlyNamedKeys_andFixedDistinctId', () => {
  const out = ec.scrubEvent(sdkEvent('boom ' + seed, { route: '/x', code: 'request_error' }), 'production');
  const keys = Object.keys(out.properties).sort();
  assert.deepStrictEqual(keys, ['$exception_level','$exception_list','$geoip_disable','$is_server','$lib','$lib_version',
    '$process_person_profile','code','environment','route'].sort());
  assert.strictEqual(out.distinctId, 'server-error-capture');
  assert.strictEqual(out.properties.$process_person_profile, false);
  assert.strictEqual(out.properties.environment, 'production');
});
test('scrubEvent_removesTenantShapes_fromMessage', () => {
  const shapes = ['Acme Pty Ltd', 'jo@acme.example', 'duplicate key value violates "users_pkey" (id)=(' + seed + ')', seed];
  shapes.forEach(s => {
    const out = ec.scrubEvent(sdkEvent('failed for ' + s), 'production');
    assert.ok(!JSON.stringify(out).includes(s), 'leaked: ' + s + ' seed=' + seed);
    assert.strictEqual(out.properties.$exception_list[0].type, 'Error');
  });
});
test('scrubEvent_keepsAllowListedMessageUnchanged', () => {
  const out = ec.scrubEvent(sdkEvent('tenant_admin_bootstrap_failed', { code: 'tenant_admin_bootstrap_failed' }), 'production');
  assert.strictEqual(out.properties.$exception_list[0].value, 'tenant_admin_bootstrap_failed');
});
test('scrubEvent_removesSourceContextLines_keepsFrames', () => {
  const f = ec.scrubEvent(sdkEvent('m'), 'production').properties.$exception_list[0].stacktrace.frames[0];
  ['pre_context','context_line','post_context'].forEach(k => assert.ok(!(k in f), k));
  assert.strictEqual(f.function, 'f'); assert.strictEqual(f.lineno, 1);
});
test('scrubEvent_routeIsPattern_notRawUrl', () => {
  const token = rnd();
  assert.strictEqual(ec.routeLabel('/products/' + seed + '?token=' + token), '/products/:p');
  assert.strictEqual(ec.routeLabel(undefined), '/unknown');
  const out = ec.scrubEvent(sdkEvent('m', { route: ec.routeLabel('/products/' + seed + '?token=' + token) }), 'production');
  const s = JSON.stringify(out);
  assert.ok(!s.includes(seed), 'seed leaked: ' + seed);
  assert.ok(!s.includes(token), 'token leaked: ' + token);
});
test('scrubEvent_throwingHook_dropsEvent', () => {
  const circ = sdkEvent('m'); circ.properties.$exception_list = null;  // makes the mapper throw
  assert.strictEqual(ec.scrubEvent(circ, 'production'), null);
  assert.strictEqual(ec.scrubEvent({ event: 'other', properties: {} }, 'production'), null);  // non-exception events are dropped
});
test('scrubEvent_thrownErrorWithTenantReason_neverSendsReason', () => {
  const out = ec.scrubEvent(sdkEvent('x', { code: 'tenant_admin_bootstrap_failed' }), 'production');
  assert.ok(!('tenantId' in out.properties) && !('reason' in out.properties));
});

// ---- runner (supports async tests; runs sequentially) ----
(async () => {
  let passed = 0, failed = 0;
  for (const t of tests) {
    try { await t.fn(); passed++; console.log('  ok   ' + t.name); }
    catch (e) { failed++; console.log('  FAIL ' + t.name + ' -- ' + (e && e.message) + ' (seed=' + seed + ')'); }
  }
  console.log(passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
