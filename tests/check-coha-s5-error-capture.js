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
  assert.strictEqual(out.properties.route, '/:p');
  const keys = Object.keys(out.properties).sort();
  assert.deepStrictEqual(keys, ['$exception_level','$exception_list','$geoip_disable','$is_server','$lib','$lib_version',
    '$process_person_profile','code','environment','route'].sort());
  assert.strictEqual(out.distinctId, 'server-error-capture');
  assert.strictEqual(out.properties.$process_person_profile, false);
  assert.strictEqual(out.properties.environment, 'production');
  assert.ok(!('tenantId' in out.properties) && !('reason' in out.properties));  // tenant-shaped extras never sent
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
test('scrubEvent_dropsEvent_onMalformedOrNonExceptionInput', () => {
  const nonArrayList = sdkEvent('m'); nonArrayList.properties.$exception_list = null;
  assert.strictEqual(ec.scrubEvent(nonArrayList, 'production'), null);
  assert.strictEqual(ec.scrubEvent({ event: 'other', properties: {} }, 'production'), null);  // non-exception events are dropped
});

// ---- leak tests: a canary planted in each field must never reach the output ----
function leakCheck(name, mutate, extra) {
  test('scrubEvent_leak_' + name, () => {
    const canary = 'c' + crypto.randomBytes(6).toString('hex');  // regex-clean: no spaces or punctuation
    const ev = sdkEvent('m', extra ? extra(canary) : {});
    mutate(ev, canary);
    const out = ec.scrubEvent(ev, 'production');
    assert.ok(out !== null, 'well-formed input must not be dropped: ' + name);
    assert.ok(!JSON.stringify(out).includes(canary), 'leaked ' + name + ': ' + canary);
  });
}
const x0 = ev => ev.properties.$exception_list[0];
leakCheck('topLevelUuid', (ev, c) => { ev.uuid = c; });
leakCheck('topLevelGroups', (ev, c) => { ev.groups = { tenant: c }; });
leakCheck('topLevelSet', (ev, c) => { ev.$set = { name: c }; ev.properties.$set = { name: c }; });
leakCheck('mechanismData', (ev, c) => { x0(ev).mechanism = { handled: true, type: 'generic', data: { who: c } }; });
leakCheck('mechanismType', (ev, c) => { x0(ev).mechanism = { handled: true, type: c }; });
leakCheck('stacktraceExtraKeys', (ev, c) => { x0(ev).stacktrace.extra = c; x0(ev).stacktrace.type = c; });
leakCheck('fingerprint', (ev, c) => { ev.properties.$exception_fingerprint = c; });
leakCheck('lib', (ev, c) => { ev.properties.$lib = c + ' Acme Pty Ltd'; });
leakCheck('libVersion', (ev, c) => { ev.properties.$lib_version = c + ' Acme Pty Ltd'; });
leakCheck('exceptionLevel', (ev, c) => { ev.properties.$exception_level = c; });
leakCheck('isServer', (ev, c) => { ev.properties.$is_server = c; ev.properties.$geoip_disable = c; });
leakCheck('type', (ev, c) => { x0(ev).type = c + ' for Acme Pty Ltd'; });
leakCheck('nonNumericLineno', (ev, c) => { x0(ev).stacktrace.frames[0].lineno = c; x0(ev).stacktrace.frames[0].colno = c; });
leakCheck('frameStrings', (ev, c) => { const f = x0(ev).stacktrace.frames[0]; f.filename = c + '?x=jo@acme.example'; f.function = c + '\n"quoted"'; f.module = c + ' !'; f.platform = c + ' !'; f.in_app = c; });
leakCheck('rawUrlRoute', (ev, c) => { ev.properties.route = '/' + c + '/orders/123?token=' + c; });
leakCheck('tenantSlugRoute', (ev, c) => { ev.properties.route = '/acme-pty-ltd/orders/' + c; });
test('scrubEvent_outputTopLevel_isExactlyFixedShape', () => {
  const ev = sdkEvent('m'); ev.uuid = 'u'; ev.groups = { a: 1 }; ev.$set = { a: 1 }; ev.timestamp = 'not-a-date';
  const out = ec.scrubEvent(ev, 'production');
  assert.ok(Object.keys(out).every(k => ['event', 'distinctId', 'properties', 'timestamp'].includes(k)), Object.keys(out).join());
  assert.strictEqual(out.event, '$exception');
});
test('routeLabel_unknownFirstSegment_becomesPlaceholder', () => {
  assert.strictEqual(ec.routeLabel('/acme-pty-ltd/orders'), '/:p/:p');
  assert.strictEqual(ec.routeLabel('/products/abc'), '/products/:p');
});
test('scrubEvent_validatesCopiedValues', () => {
  const p = ec.scrubEvent(sdkEvent('m', { $exception_level: 'weird', $lib: 'bad lib!' }), 'production').properties;
  assert.strictEqual(p.$exception_level, 'error');
  assert.ok(!('$lib' in p));
  assert.strictEqual(p.$lib_version, '5.40.0');
  assert.strictEqual(p.$is_server, true);
});


// ---- allow-list (not charset) tests, regex-clean canaries ----
const hex = () => 'c' + crypto.randomBytes(6).toString('hex');
leakCheck('code', (ev, c) => { ev.properties.code = c; });
leakCheck('codeCanaryWord', (ev) => { ev.properties.code = 'canary'; }, null);
leakCheck('typeRegexClean', (ev, c) => { x0(ev).type = c + 'Error'; });
leakCheck('libRegexClean', (ev, c) => { ev.properties.$lib = c; });
leakCheck('libVersionRegexClean', (ev, c) => { ev.properties.$lib_version = c; });
leakCheck('filenameBareTenantDir', (ev, c) => { x0(ev).stacktrace.frames[0].filename = '/tenants/' + c; });
leakCheck('absPathBareTenantDir', (ev, c) => { x0(ev).stacktrace.frames[0].abs_path = '/tenants/' + c; });
leakCheck('moduleBareToken', (ev, c) => { x0(ev).stacktrace.frames[0].module = c; });
leakCheck('platformBareToken', (ev, c) => { x0(ev).stacktrace.frames[0].platform = c; });
test('scrubEvent_frameFunction_acceptedRisk_identifierIsKept', () => {
  // coha-s5 review round 3: accepted risk, frame function names are code-defined. An identifier-shaped
  // function name is kept on purpose; changing this must be a deliberate decision, not a side effect.
  const e = sdkEvent('m'); e.properties.$exception_list[0].stacktrace.frames[0].function = 'c' + hex();
  const fn = ec.scrubEvent(e, 'production').properties.$exception_list[0].stacktrace.frames[0].function;
  assert.ok(typeof fn === 'string' && fn.length > 1);
});
test('scrubEvent_frame_platformAllowListed_moduleOmitted', () => {
  const e = sdkEvent('m'); const fr = e.properties.$exception_list[0].stacktrace.frames[0]; fr.module = 'task_queues'; fr.platform = 'node:javascript';
  const g = ec.scrubEvent(e, 'production').properties.$exception_list[0].stacktrace.frames[0];
  assert.strictEqual(g.platform, 'node:javascript'); assert.ok(!('module' in g));
});
leakCheck('filenameTenantDir', (ev, c) => { const f = x0(ev).stacktrace.frames[0]; f.filename = '/tenants/' + c + '/a.js'; f.abs_path = '/tenants/' + c + '/a.js'; });
leakCheck('functionAtOrSpace', (ev, c) => { x0(ev).stacktrace.frames[0].function = c + ' for tenant'; });
test('scrubEvent_filename_keptOnlyWhenRepoRelative', () => {
  const fr = (fn) => { const e = sdkEvent('m'); e.properties.$exception_list[0].stacktrace.frames[0].filename = fn; return ec.scrubEvent(e, 'production').properties.$exception_list[0].stacktrace.frames[0].filename; };
  assert.strictEqual(fr('/tenants/' + hex() + '/a.js'), undefined);  // no basename fallback
  assert.strictEqual(fr('/app/src/web-ui/server.js'), 'src/web-ui/server.js');
  assert.strictEqual(fr('/app/src/x/node_modules/pkg/i.js'), 'node_modules/pkg/i.js');
  assert.strictEqual(fr('C:\\work\\src\\web-ui\\s.js'), 'src/web-ui/s.js');
  assert.strictEqual(fr('/home/mysrc/a.js'), undefined);  // 'src/' must sit at a segment boundary
});
test('scrubEvent_function_identifierShapedOnly', () => {
  // A pure identifier is defined by the code itself and cannot carry tenant text; anything else is dropped.
  const fn = (v) => { const e = sdkEvent('m'); e.properties.$exception_list[0].stacktrace.frames[0].function = v; return ec.scrubEvent(e, 'production').properties.$exception_list[0].stacktrace.frames[0].function; };
  assert.strictEqual(fn('Object.handle'), 'Object.handle');
  assert.strictEqual(fn('a@b'), undefined);
  assert.strictEqual(fn('a b'), undefined);
});
test('scrubEvent_codeAndType_allowListsOnly', () => {
  const o = (c, t) => { const e = sdkEvent('m', { code: c }); e.properties.$exception_list[0].type = t; return ec.scrubEvent(e, 'production'); };
  assert.strictEqual(o('request_error', 'TypeError').properties.code, 'request_error');
  assert.strictEqual(o('request_error', 'TypeError').properties.$exception_list[0].type, 'TypeError');
  assert.strictEqual(o('tenant_admin_bootstrap_failed', 'Error').properties.code, 'tenant_admin_bootstrap_failed');
  assert.strictEqual(o('other_code', 'Foo').properties.code, 'unhandled_exception');
  assert.strictEqual(o('other_code', 'Foo').properties.$exception_list[0].type, 'Error');
});
test('scrubEvent_libValues_allowListed', () => {
  const p = ec.scrubEvent(sdkEvent('m', { $lib: 'posthog-node', $lib_version: '5.40.0-beta.1' }), 'production').properties;
  assert.strictEqual(p.$lib, 'posthog-node'); assert.strictEqual(p.$lib_version, '5.40.0-beta.1');
  const q = ec.scrubEvent(sdkEvent('m', { $lib: 'other', $lib_version: 'v5' }), 'production').properties;
  assert.ok(!('$lib' in q) && !('$lib_version' in q));
});
test('routeLabel_capsSegments_atEight', () => {
  const out = ec.routeLabel('/products' + '/a'.repeat(1e5));
  assert.ok(out.length < 100, 'length ' + out.length);
  assert.ok(out.endsWith('/...'));
  assert.strictEqual(ec.routeLabel('/products/a/b'), '/products/:p/:p');
});
test('scrubEvent_invalidTimestamp_isDropped', () => {
  const e = sdkEvent('m'); e.timestamp = 'x' + hex();
  assert.ok(!('timestamp' in ec.scrubEvent(e, 'production')));
  const g = sdkEvent('m'); g.timestamp = '2026-11-13T01:02:03.456Z';
  assert.strictEqual(ec.scrubEvent(g, 'production').timestamp, '2026-11-13T01:02:03.456Z');
});
test('scrubEvent_throwingGetter_returnsNull', () => {
  const e = sdkEvent('m'); Object.defineProperty(e.properties, '$exception_list', { get() { throw new Error('boom'); }, enumerable: true });
  assert.strictEqual(ec.scrubEvent(e, 'production'), null);
});
test('scrubEvent_protoKeys_doNotPolluteOrAppear', () => {
  const c = hex();
  const e = JSON.parse('{"event":"$exception","__proto__":{"polluted":"' + c + '"},"properties":{"__proto__":{"polluted":"' + c + '"},"constructor":{"x":"' + c + '"},"$exception_list":[{"type":"Error","value":"m","__proto__":{"polluted":"' + c + '"}}]}}');
  const out = ec.scrubEvent(e, 'production');
  assert.ok(out !== null);
  assert.ok(!JSON.stringify(out).includes(c));
  assert.strictEqual({}.polluted, undefined);
});

const sinkLib = require('./helpers/error-capture-sink');
const OPTS = { clientOptions: { flushAt: 1, flushInterval: 20 } };

test('captureServerError_beforeInit_throwsNotWiredMessage', () => {
  const fresh = require('../src/web-ui/modules/error-capture');
  fresh._resetForTests();
  assert.throws(() => fresh.captureServerError(new Error('x'), {}), e => e.message === fresh.NOT_WIRED);
});
test('initErrorCapture_unsetKey_returnsNotWired_andNoOps', () => {
  ec._resetForTests();
  const logs = []; const r = ec.initErrorCapture('production', {}, { logger: { error: m => logs.push(m) } });
  assert.strictEqual(r.wired, false);
  assert.ok(logs.join(' ').includes('POSTHOG_KEY_PROD') && !logs.join(' ').includes('phc_'));
  assert.doesNotThrow(() => ec.captureServerError(new Error('x'), {}));
});
test('initErrorCapture_resolvesStagingAndProductionKeys_neverFallsBack', () => {
  ec._resetForTests();
  const r = ec.initErrorCapture('staging', { POSTHOG_KEY_PROD: 'phc_prod_fake' }, { logger: { error: () => {} } });
  assert.strictEqual(r.wired, false);
});
test('captureServerError_suppressesE2eIdentity', async () => {
  const sink = await sinkLib.start();
  try {
    ec._resetForTests();
    ec.initErrorCapture('production', { POSTHOG_KEY_PROD: 'phc_fake', POSTHOG_HOST: sink.url }, OPTS);
    ec.captureServerError(new Error('x'), { identity: 'e2e-test-user', url: '/a' });
    ec.captureServerError(new Error('y'), { identity: 'real-user', url: '/b' });  // positive control
    await ec.flushErrorCapture(1500);
    assert.strictEqual(sink.events.length, 1);
    assert.strictEqual(sink.events[0].properties.route, '/:p');
  } finally { await sink.stop(); }
});
test('captureServerError_setsEnvironmentProperty', async () => {
  const sink = await sinkLib.start();
  try {
    ec._resetForTests();
    ec.initErrorCapture('staging', { POSTHOG_KEY_STAGING: 'phc_stg_fake', POSTHOG_HOST: sink.url }, OPTS);
    ec.captureServerError(new Error('x'), { url: '/a/b' });
    await ec.flushErrorCapture(1500);
    assert.strictEqual(sink.events.length, 1);
    assert.strictEqual(sink.events[0].properties.environment, 'staging');
    assert.strictEqual(sink.events[0].properties.route, '/:p/:p');
    assert.ok(sink.keys.includes('phc_stg_fake'));  // sink records the key it received; never printed
  } finally { await sink.stop(); }
});
test('initErrorCapture_twice_isIdempotent_oneClientAndBoundedListeners', async () => {
  const sink = await sinkLib.start();
  try {
    ec._resetForTests();
    const env = { POSTHOG_KEY_PROD: 'phc_fake', POSTHOG_HOST: sink.url };
    const u0 = process.listenerCount('uncaughtException'), r0 = process.listenerCount('unhandledRejection');
    const Real = require('posthog-node').PostHog; let made = 0;
    const Counting = function (k, o) { made++; return new Real(k, o); };
    const o = { PostHogClient: Counting, autocapture: true, clientOptions: OPTS.clientOptions };
    const first = ec.initErrorCapture('production', env, o);
    const second = ec.initErrorCapture('production', env, o);
    assert.strictEqual(first.wired, true);
    assert.deepStrictEqual(second, { wired: true, alreadyWired: true });
    assert.strictEqual(made, 1);
    assert.ok(process.listenerCount('uncaughtException') - u0 <= 1);
    assert.ok(process.listenerCount('unhandledRejection') - r0 <= 1);
    await ec.flushErrorCapture(1500);
  } finally { await sink.stop(); }
});
function recordingCtor(box) { return function (k, o) { box.opts = o; this.captureException = () => {}; this.shutdown = async () => {}; }; }
test('initErrorCapture_autocapture_defaultsToFalseWithoutUncaughtListener', () => {
  const saved = process.listeners('uncaughtException'); saved.forEach(l => process.removeListener('uncaughtException', l));
  try {
    ec._resetForTests(); const box = {};
    ec.initErrorCapture('production', { POSTHOG_KEY_PROD: 'phc_fake' }, { PostHogClient: recordingCtor(box) });
    assert.strictEqual(box.opts.enableExceptionAutocapture, false);
  } finally { saved.forEach(l => process.on('uncaughtException', l)); }
});
test('initErrorCapture_autocapture_trueWithUncaughtListener_andOverridable', () => {
  const l = () => {}; process.on('uncaughtException', l);
  try {
    ec._resetForTests(); let box = {};
    ec.initErrorCapture('production', { POSTHOG_KEY_PROD: 'phc_fake' }, { PostHogClient: recordingCtor(box) });
    assert.strictEqual(box.opts.enableExceptionAutocapture, true);
    ec._resetForTests(); box = {};
    ec.initErrorCapture('production', { POSTHOG_KEY_PROD: 'phc_fake' }, { PostHogClient: recordingCtor(box), autocapture: false });
    assert.strictEqual(box.opts.enableExceptionAutocapture, false);
  } finally { process.removeListener('uncaughtException', l); }
  const saved = process.listeners('uncaughtException'); saved.forEach(x => process.removeListener('uncaughtException', x));
  try {
    ec._resetForTests(); const box = {};
    ec.initErrorCapture('production', { POSTHOG_KEY_PROD: 'phc_fake' }, { PostHogClient: recordingCtor(box), autocapture: true });
    assert.strictEqual(box.opts.enableExceptionAutocapture, true);
  } finally { saved.forEach(x => process.on('uncaughtException', x)); }
});
test('flushErrorCapture_thenCapture_isExplicitNoOp', async () => {
  const sink = await sinkLib.start();
  try {
    ec._resetForTests();
    ec.initErrorCapture('production', { POSTHOG_KEY_PROD: 'phc_fake', POSTHOG_HOST: sink.url }, OPTS);
    ec.captureServerError(new Error('a'), { url: '/a' });
    await ec.flushErrorCapture(1500);
    assert.strictEqual(sink.events.length, 1);
    assert.doesNotThrow(() => ec.captureServerError(new Error('b'), { url: '/a' }));
    await ec.flushErrorCapture(500);
    assert.strictEqual(sink.events.length, 1);
  } finally { await sink.stop(); }
});
test('flushErrorCapture_hangingSink_returnsWithinTimeoutPlusSlack', async () => {
  const sink = await sinkLib.start({ hang: true });
  try {
    ec._resetForTests();
    ec.initErrorCapture('production', { POSTHOG_KEY_PROD: 'phc_fake', POSTHOG_HOST: sink.url }, OPTS);
    ec.captureServerError(new Error('a'), { url: '/a' });
    const t0 = Date.now(); await ec.flushErrorCapture(400); const ms = Date.now() - t0;
    assert.ok(ms <= 700, 'took ' + ms);
  } finally { await sink.stop(); }
});
test('captureServerError_oddErrorValues_doNotThrow_andAreScrubbed', async () => {
  const sink = await sinkLib.start();
  try {
    ec._resetForTests();
    ec.initErrorCapture('production', { POSTHOG_KEY_PROD: 'phc_fake', POSTHOG_HOST: sink.url }, OPTS);
    const c = rnd();
    [c, undefined, { message: c, tenantId: c }].forEach(v => assert.doesNotThrow(() => ec.captureServerError(v, { url: '/a' })));
    await ec.flushErrorCapture(1500);
    assert.ok(sink.events.length >= 1);
    assert.ok(!JSON.stringify(sink.events).includes(c));
    sink.events.forEach(e => assert.ok(e.properties.environment === 'production' && e.properties.code === 'request_error'));
  } finally { await sink.stop(); }
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
