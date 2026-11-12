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

// ---- Task 3: catch-block call through a real child process running createApp ----
const _cp = require('child_process');
const _http = require('http');
const _harness = require('path').join(__dirname, 'helpers', 'error-capture-child.js');
const FAKE_PROD = 'phc_fake_prod';

// Minimal child environment: only what Node needs to run; nothing secret or service-related is inherited.
const CHILD_ENV_ALLOW = ['PATH', 'Path', 'SystemRoot', 'SYSTEMROOT', 'windir', 'TEMP', 'TMP', 'TMPDIR', 'HOME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'ProgramData', 'ComSpec', 'COMSPEC', 'PATHEXT', 'OS'];
function buildChildEnv(envOverrides) {
  const env = {};
  CHILD_ENV_ALLOW.forEach(k => { if (process.env[k] !== undefined) env[k] = process.env[k]; });
  return Object.assign(env, { NODE_ENV: 'test' }, envOverrides || {});
}
function spawnChild(envOverrides) {
  const env = buildChildEnv(envOverrides);
  const child = _cp.spawn(process.execPath, [_harness], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  child.stderr.on('data', d => { out += d; });
  const stop = () => new Promise(r => {
    if (child.exitCode !== null || child.signalCode) return r();
    child.once('exit', () => r()); child.kill();
    setTimeout(r, 3000).unref();
  });
  return new Promise((resolve, reject) => {
    let buf = '';
    const timer = setTimeout(() => { stop().then(() => reject(new Error('child startup timeout; output: ' + out.slice(0, 300)))); }, 20000);
    let done = false;
    child.stdout.on('data', d => {
      out += d; buf += d;
      const m = buf.match(/^\{"port":(\d+)\}\s*$/m);
      if (m && !done) { done = true; clearTimeout(timer); resolve({ port: Number(m[1]), output: () => out, stop, exitCode: () => child.exitCode, waitExit: ms => new Promise(r => { if (child.exitCode !== null) return r(child.exitCode); child.once('exit', c => r(c)); setTimeout(() => r(null), ms).unref(); }) }); }
    });
    child.once('exit', code => { if (done) return; clearTimeout(timer); reject(new Error('child exited early (' + code + '): ' + out.slice(0, 300))); });
  });
}
function get(port, p, headers) {
  return new Promise((resolve, reject) => {
    const rq = _http.get({ host: '127.0.0.1', port, path: p, headers: headers || {}, agent: false }, rs => {
      let b = ''; rs.on('data', d => { b += d; }); rs.on('end', () => resolve({ status: rs.statusCode, body: b }));
    });
    rq.setTimeout(10000, () => rq.destroy(new Error('request timeout')));
    rq.on('error', reject);
  });
}
async function waitFor(pred, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (pred()) return true; await new Promise(r => setTimeout(r, 25)); }
  return pred();
}
// Sends n failing requests to one child and returns the best (lowest) elapsed time. If a sink is given, waits until
// it has really received something before stopping the child, so the timing is never measured against a capture that did not happen.
async function timedFailingRequest(opts) {
  const ch = await spawnChild(opts.capture ? { POSTHOG_KEY_PROD: FAKE_PROD, POSTHOG_HOST: opts.host } : {});
  try {
    let best = Infinity, status = 500;
    for (let i = 0; i < (opts.n || 1); i++) {
      const t0 = Date.now(); const r = await get(ch.port, '/boom/' + seed); const ms = Date.now() - t0;
      if (r.status !== 500) status = r.status;
      best = Math.min(best, ms);
    }
    if (opts.sink) assert.ok(await waitFor(() => opts.sink.requests >= 1, 8000), 'sink never received a request');
    return { status, ms: best, output: ch.output() };
  } finally { await ch.stop(); }
}

test('throwingRequest_producesExactlyOneEvent_andReturns500', async () => {
  const sink = await sinkLib.start(); let ch;
  try {
    ch = await spawnChild({ POSTHOG_KEY_PROD: FAKE_PROD, POSTHOG_HOST: sink.url });
    const r = await get(ch.port, '/boom/' + seed);
    assert.strictEqual(r.status, 500);
    assert.strictEqual(r.body, 'Internal Server Error');
    assert.ok(await waitFor(() => sink.events.length >= 1, 5000), 'no event reached the sink within 5s');
    await new Promise(r2 => setTimeout(r2, 300));
    assert.strictEqual(sink.events.length, 1);  // cost NFR: exactly one event per error
    const p = sink.events[0].properties;
    assert.deepStrictEqual(Object.keys(p).sort(), [...ec.KEPT_KEYS].filter(k => k !== '$exception_fingerprint').sort());
    assert.strictEqual(p.route, '/:p/:p');
    assert.strictEqual(p.environment, 'production');
    assert.ok(!JSON.stringify(sink.events).includes(seed));
  } finally { if (ch) await ch.stop(); await sink.stop(); }
});
test('urlWithTenantSlug_reportsOnlyRoutePattern', async () => {
  const sink = await sinkLib.start(); let ch;
  try {
    ch = await spawnChild({ POSTHOG_KEY_PROD: FAKE_PROD, POSTHOG_HOST: sink.url });
    const r = await get(ch.port, '/products/' + seed + '?x=' + seed);
    assert.strictEqual(r.status, 500);
    assert.ok(await waitFor(() => sink.events.length >= 1, 5000), 'no event reached the sink within 5s');
    assert.ok(!JSON.stringify(sink.events).includes(seed));
    assert.strictEqual(sink.events[0].properties.route, '/products/:p');
  } finally { if (ch) await ch.stop(); await sink.stop(); }
});
test('unreachableOrSlowEndpoint_doesNotBreakOrSlowRequest', async () => {
  const hang = await sinkLib.start({ hang: true }); const slow = await sinkLib.start({ delayMs: 2000 });
  try {
    const runs = [];
    for (let i = 0; i < 3; i++) runs.push((await timedFailingRequest({ capture: false })).ms);
    const base = runs.sort((a, b) => a - b)[1];
    for (const s of [hang, slow]) {
      const t = await timedFailingRequest({ capture: true, host: s.url, sink: s, n: 3 });
      assert.strictEqual(t.status, 500);
      assert.ok(s.requests >= 1, 'capture never reached this sink, so the timing proves nothing');
      assert.ok(t.ms <= base + 200, 'took ' + t.ms + ' vs baseline ' + base);
      assert.ok(!t.output.includes(FAKE_PROD), 'key leaked to output');
    }
    assert.ok(slow.events.length >= 1, 'slow sink received no event');
  } finally { await hang.stop(); await slow.stop(); }
});
test('requestWithE2eIdentityHeader_isStillCaptured_headerCannotSuppress', async () => {
  const sink = await sinkLib.start(); let ch;
  try {
    ch = await spawnChild({ POSTHOG_KEY_PROD: FAKE_PROD, POSTHOG_HOST: sink.url });
    const r = await get(ch.port, '/boom/' + seed, { 'x-test-identity': 'e2e-test-x' });
    assert.strictEqual(r.status, 500);
    assert.ok(await waitFor(() => sink.events.length >= 1, 5000), 'event was suppressed by a request header');
    await new Promise(r2 => setTimeout(r2, 300));
    assert.strictEqual(sink.events.length, 1);
  } finally { if (ch) await ch.stop(); await sink.stop(); }
});
test('spawnChildEnv_isMinimal_noInheritedSecretsOrServiceUrls', () => {
  const names = ['DATABASE_URL', 'REDIS_URL', 'WIRE_X', 'GITHUB_TOKEN', 'STRIPE_SECRET_KEY', 'SESSION_SECRET', 'POSTHOG_KEY_PROD', 'POSTHOG_HOST'];
  const saved = {}; names.forEach(n => { saved[n] = process.env[n]; process.env[n] = 'parent-' + n; });
  try {
    const env = buildChildEnv({});
    names.forEach(n => assert.ok(!(n in env), n + ' leaked into the child env'));
    assert.strictEqual(env.NODE_ENV, 'test');
    assert.ok(env.PATH || env.Path, 'PATH is needed');
    assert.strictEqual(buildChildEnv({ POSTHOG_HOST: 'h' }).POSTHOG_HOST, 'h');
  } finally { names.forEach(n => { if (saved[n] === undefined) delete process.env[n]; else process.env[n] = saved[n]; }); }
});
test('unwiredCapture_isContained_requestStill500_andLoggedWithoutKey', async () => {
  let ch;
  try {
    ch = await spawnChild({ CHILD_SKIP_WIRING: '1', POSTHOG_KEY_PROD: FAKE_PROD });
    const r = await get(ch.port, '/boom/' + seed);
    assert.strictEqual(r.status, 500);
    assert.strictEqual(r.body, 'Internal Server Error');
    const o = ch.output();
    assert.ok(o.includes('Adapter not wired: error-capture') || o.includes('[error-capture] capture failed'), o.slice(0, 300));
    assert.ok(!o.includes(FAKE_PROD));
    assert.strictEqual((await get(ch.port, '/ok')).status, 200);
  } finally { if (ch) await ch.stop(); }
});

// ---- Task 4: startup wiring (real wireErrorCapture via the harness) ----
const FAKE_STAGING = 'phc_fake_staging';
test('wireErrorCapture_isCalledInStartupBlock_afterUncaughtExceptionHandler', () => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'src', 'web-ui', 'server.js'), 'utf8');
  const start = src.indexOf('if (require.main === module) {');
  assert.ok(start > 0, 'startup block not found');
  const block = src.slice(start);
  const iUnc = block.indexOf("process.on('uncaughtException'");
  const iWarn = block.indexOf('warnOnOptionalEnvVars(process.env, console)');
  const iWire = block.indexOf('wireErrorCapture(process.env)');
  assert.ok(iUnc > 0 && iWarn > iUnc && iWire > iWarn, 'wiring must follow the uncaughtException handler and warnOnOptionalEnvVars');
  assert.strictEqual(block.split('wireErrorCapture(process.env)').length, 2);
});
test('realStartup_wiresCapture_andEventCarriesKey', async () => {
  const sink = await sinkLib.start(); let ch;
  try {
    ch = await spawnChild({ POSTHOG_KEY_PROD: FAKE_PROD, POSTHOG_HOST: sink.url });
    assert.strictEqual((await get(ch.port, '/boom')).status, 500);
    assert.ok(await waitFor(() => sink.events.length === 1, 5000), 'no event reached the sink');
    assert.strictEqual(sink.events[0].properties.environment, 'production');
    assert.ok(sink.keys.includes(FAKE_PROD));
    assert.ok(!ch.output().includes(FAKE_PROD));
  } finally { if (ch) await ch.stop(); await sink.stop(); }
});
test('unsetKey_startupLogsClearly_requestStill500', async () => {
  const sink = await sinkLib.start(); let ch;
  try {
    ch = await spawnChild({ POSTHOG_HOST: sink.url });
    assert.strictEqual((await get(ch.port, '/boom')).status, 500);
    await new Promise(r => setTimeout(r, 400));
    const o = ch.output();
    assert.ok(o.includes('POSTHOG_KEY_PROD'), o.slice(0, 300));
    assert.ok(!o.includes('phc_'));
    assert.strictEqual(sink.events.length, 0);
    assert.strictEqual(sink.requests, 0);
  } finally { if (ch) await ch.stop(); await sink.stop(); }
});
test('stagingRun_labelsStaging_neverProduction', async () => {
  const sink = await sinkLib.start(); let ch;
  try {
    ch = await spawnChild({ CHILD_ENV_NAME: 'staging', POSTHOG_KEY_STAGING: FAKE_STAGING, POSTHOG_KEY_PROD: FAKE_PROD, POSTHOG_HOST: sink.url });
    assert.strictEqual((await get(ch.port, '/boom')).status, 500);
    assert.ok(await waitFor(() => sink.events.length >= 1, 5000), 'no event reached the sink');
    await new Promise(r => setTimeout(r, 300));
    sink.events.forEach(e => assert.strictEqual(e.properties.environment, 'staging'));
    assert.ok(sink.keys.includes(FAKE_STAGING));
    assert.ok(!sink.keys.includes(FAKE_PROD));
  } finally { if (ch) await ch.stop(); await sink.stop(); }
});
test('shutdownSignal_flushesLastBatch', async () => {
  const sink = await sinkLib.start(); let ch;
  try {
    ch = await spawnChild({ POSTHOG_KEY_PROD: FAKE_PROD, POSTHOG_HOST: sink.url, CHILD_FLUSH_AT: '100', CHILD_FLUSH_INTERVAL: '60000' });
    assert.strictEqual((await get(ch.port, '/boom')).status, 500);
    await new Promise(r => setTimeout(r, 500));
    assert.strictEqual(sink.events.length, 0, 'event was sent before shutdown, so the test proves nothing');
    await get(ch.port, '/shutdown');
    assert.strictEqual(await ch.waitExit(6000), 143);
    assert.strictEqual(sink.events.length, 1);
  } finally { if (ch) await ch.stop(); await sink.stop(); }
});
test('wireErrorCapture_registersSignalHandlersOnce', async () => {
  let a, b;
  try {
    a = await spawnChild({ CHILD_SKIP_WIRING: '1' });
    b = await spawnChild({ POSTHOG_KEY_PROD: FAKE_PROD, CHILD_WIRE_TWICE: '1' });
    const base = JSON.parse((await get(a.port, '/listeners')).body);
    const wired = JSON.parse((await get(b.port, '/listeners')).body);
    assert.strictEqual(wired.SIGTERM, base.SIGTERM + 1);
    assert.strictEqual(wired.SIGINT, base.SIGINT + 1);
  } finally { if (a) await a.stop(); if (b) await b.stop(); }
});

test('unhandledRejection_isCaptured_processKeepsRunning', async () => {
  const sink = await sinkLib.start(); let ch;
  try {
    ch = await spawnChild({ POSTHOG_KEY_PROD: FAKE_PROD, POSTHOG_HOST: sink.url });
    const r = await get(ch.port, '/reject');
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body, 'queued');
    const got = await waitFor(() => sink.events.length >= 1, 5000);
    assert.ok(got, 'no unhandled-rejection event reached the sink within 5s');
    await new Promise(r2 => setTimeout(r2, 300));
    assert.strictEqual(sink.events.length, 1, 'expected exactly one event, got ' + sink.events.length);
    const ev = sink.events[0]; const p = ev.properties;
    assert.strictEqual(ev.event, '$exception');
    assert.strictEqual(p.$exception_list[0].value, 'unhandled_exception');
    assert.strictEqual(p.code, 'unhandled_exception');
    assert.strictEqual(p.route, '/process');
    assert.strictEqual(p.environment, 'production');
    assert.strictEqual(ev.distinct_id, 'server-error-capture');
    assert.deepStrictEqual(Object.keys(p).sort(), [...ec.KEPT_KEYS].filter(k => k !== '$exception_fingerprint').sort());
    assert.ok(!JSON.stringify(sink.events).includes('unhandled /reject'), 'request text leaked into payload');
    const ok = await get(ch.port, '/ok');
    assert.strictEqual(ok.status, 200);
    assert.strictEqual(ch.exitCode(), null, 'child exited after unhandled rejection');
  } finally { if (ch) await ch.stop(); await sink.stop(); }
});
test('unhandledRejection_withCanaryMessage_neverLeaksCanary', async () => {
  const sink = await sinkLib.start(); let ch;
  try {
    ch = await spawnChild({ POSTHOG_KEY_PROD: FAKE_PROD, POSTHOG_HOST: sink.url });
    const r = await get(ch.port, '/reject?msg=' + seed);
    assert.strictEqual(r.status, 200);
    assert.ok(await waitFor(() => sink.events.length >= 1, 5000), 'no unhandled-rejection event reached the sink within 5s');
    await new Promise(r2 => setTimeout(r2, 300));
    assert.ok(!JSON.stringify(sink.events).includes(seed), 'canary leaked into payload');
  } finally { if (ch) await ch.stop(); await sink.stop(); }
});

// ---- coha-s5 Task 6: tenant admin bootstrap call sites (AC4/AC5) ----
// Env the auth modules need at require time (same values as check-tab-s1).
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'test-gh-client-id';
process.env.GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'test-gh-secret';
process.env.GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback';
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'test-google-client-secret';
process.env.GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback';
const AUTH_PATH = require.resolve('../src/web-ui/routes/auth');
const AUTH_EMAIL_PATH = require.resolve('../src/web-ui/routes/auth-email');
function freshRequire(p) { delete require.cache[p]; return require(p); }
function mockAuthReq(o) { return Object.assign({ session: {}, sessionId: 'test-sid-' + rnd(), query: {}, headers: {} }, o || {}); }
function mockAuthRes() {
  const h = {};
  return { statusCode: null, get headers() { return h; },
    writeHead(c, x) { this.statusCode = c; if (x) Object.assign(h, x); },
    setHeader(n, v) { h[n] = v; }, end(b) { this.body = (b != null ? String(b) : ''); this._ended = true; } };
}
function mockEmailReq(o) {
  const req = Object.assign({ session: {}, sessionId: 'test-sid-' + rnd(), headers: {}, connection: { remoteAddress: '127.0.0.1' }, body: undefined }, o || {});
  if (!req.session.csrfToken) req.session.csrfToken = 'test-csrf-' + rnd();
  if (req.body && typeof req.body === 'object' && req.body._csrf === undefined) req.body = Object.assign({}, req.body, { _csrf: req.session.csrfToken });
  return req;
}
const STUB_PW = { hash: async () => 'stub-hash', compare: async () => true };
// Same shape as check-tab-s1's fake pool (query + connect()->client{query,release}); the
// real code path (resolveOrCreatePersonForIdentity -> pool.query) rejects with the canary.
function makeFailingPool(canary) {
  const fail = () => Promise.reject(new Error('db down ' + canary));
  return { query: fail, connect: () => Promise.resolve({ query: fail, release() {} }) };
}
const B_CODE = 'tenant_admin_bootstrap_failed';
const BOOT_OPTS = { autocapture: false, clientOptions: { flushAt: 1, flushInterval: 20 } };
const FAKE_PROD_B = 'phc_fake_boot';

async function runBootstrapScenario(kind, tenantKey) {
  const canary = 'cnry-' + crypto.randomBytes(6).toString('hex');
  const warns = [];
  const pool = makeFailingPool(canary);
  let req, threw = null;
  const origWarn = console.warn;
  try {
    if (kind === 'github') {
      const auth = freshRequire(AUTH_PATH);
      auth.setLogger({ info() {}, warn: (m, d) => warns.push({ m, d }) });
      auth.setTenantAdminBootstrapPool(pool);
      const oa = require('../src/web-ui/auth/oauth-adapter');
      oa.setProviderAdapter(oa.gitHubProviderAdapter);
      const tok = require('./fixtures/github/oauth-token-exchange-success.json');
      const usr = Object.assign({}, require('./fixtures/github/user-identity.json'), { login: tenantKey });
      const origFetch = global.fetch;
      global.fetch = async url => ({ json: async () => (url.includes('access_token') ? tok : url.includes('/user') ? usr : {}) });
      req = mockAuthReq({ session: { oauthState: 's-gh' }, query: { code: 'c', state: 's-gh' } });
      try { await auth.handleAuthCallback(req, mockAuthRes()); } catch (e) { threw = e; } finally { global.fetch = origFetch; }
    } else if (kind === 'google') {
      const auth = freshRequire(AUTH_PATH);
      auth.setLogger({ info() {}, warn: (m, d) => warns.push({ m, d }) });
      auth.setTenantAdminBootstrapPool(pool);
      const oa = require('../src/web-ui/auth/oauth-adapter');
      oa.setGoogleUserInfoAdapter(async () => ({ sub: tenantKey, email: tenantKey + '@example.com', accessToken: 'g-tok' }));
      req = mockAuthReq({ session: { oauthState: 's-g' }, query: { code: 'c', state: 's-g' } });
      try { await auth.handleAuthGoogleCallback(req, mockAuthRes()); } catch (e) { threw = e; }
    } else {
      require('../src/web-ui/modules/password').setPasswordAdapter(STUB_PW);
      const ae = freshRequire(AUTH_EMAIL_PATH);
      ae._clearRateLimits();
      ae.setTenantAdminBootstrapPool(pool);
      ae.setUserDb({ query: async sql => (/INSERT INTO users/i.test(sql) ? { rows: [{ id: 'uuid-' + rnd() }] } : { rows: [] }) });
      req = mockEmailReq({ body: { email: tenantKey, password: 'TestPassw0rd!xyz' } });
      console.warn = (m, d) => warns.push({ m, d });
      try { await ae.handleEmailSignup(req, mockAuthRes()); } catch (e) { threw = e; } finally { console.warn = origWarn; }
    }
  } finally { console.warn = origWarn; }
  return { warns, req, threw, canary };
}
async function withSink(fn) {
  const sink = await sinkLib.start();
  ec._resetForTests();
  try {
    ec.initErrorCapture('production', { POSTHOG_KEY_PROD: FAKE_PROD_B, POSTHOG_HOST: sink.url }, BOOT_OPTS);
    await fn(sink);
  } finally { try { await ec.flushErrorCapture(); } catch (e) {} ec._resetForTests(); await sink.stop(); }
}
async function settle(sink, n) {
  await waitFor(() => sink.events.length >= n, 3000);
  await new Promise(r => setTimeout(r, 300));
}
function assertFixedOnly(sink, canary, tenantTexts) {
  assert.strictEqual(sink.events.length, 1, 'expected exactly one sink event, got ' + sink.events.length);
  const p = sink.events[0].properties;
  assert.strictEqual(p.code, B_CODE);
  assert.strictEqual(p.$exception_list[0].value, B_CODE);
  const s = JSON.stringify(sink.events);
  assert.ok(!s.includes(canary), 'canary leaked');
  tenantTexts.forEach(t => assert.ok(!s.includes(t), 'tenant text leaked: ' + t));
}

test('bootstrapFailure_authJs_capturesFixedCodeOnly', async () => {
  for (const kind of ['github', 'google']) {
    await withSink(async sink => {
      const tenant = 'tnt' + rnd().slice(4);
      const r = await runBootstrapScenario(kind, tenant);
      assert.strictEqual(r.threw, null, kind + ' handler threw');
      assert.ok(r.warns.some(w => w.m === B_CODE), kind + ': existing warn line missing');
      assert.notStrictEqual(r.req.session.role, 'admin', kind + ': admin must not be granted');
      await settle(sink, 1);
      assertFixedOnly(sink, r.canary, [tenant]);
    });
  }
});
test('bootstrapFailure_authEmailJs_capturesFixedCodeOnly', async () => {
  await withSink(async sink => {
    const local = 'tnt' + rnd().slice(4).replace('-', '');
    const tenant = local + '@example.com';
    const r = await runBootstrapScenario('email', tenant);
    assert.strictEqual(r.threw, null, 'email handler threw');
    assert.ok(r.warns.some(w => w.m === B_CODE), 'existing warn line missing');
    assert.notStrictEqual(r.req.session.role, 'admin');
    await settle(sink, 1);
    assertFixedOnly(sink, r.canary, [tenant, local]);
  });
});
test('bootstrapFailure_e2eIdentity_sendsNothing', async () => {
  for (const kind of ['google', 'email']) {
    await withSink(async sink => {
      const key = kind === 'email' ? 'e2e-test-' + rnd().slice(4) + '@example.com' : 'e2e-test-' + rnd().slice(4);
      const r = await runBootstrapScenario(kind, key);
      assert.strictEqual(r.threw, null);
      assert.ok(r.warns.some(w => w.m === B_CODE), kind + ': existing warn must still fire');
      await ec.flushErrorCapture();
      await new Promise(r2 => setTimeout(r2, 300));
      assert.strictEqual(sink.events.length, 0, kind + ': e2e identity must send nothing, got ' + sink.events.length);
    });
  }
  // positive control: a non-e2e failure through the same path does reach the sink
  await withSink(async sink => {
    const tenant = 'tnt' + rnd().slice(4);
    const r = await runBootstrapScenario('google', tenant);
    await settle(sink, 1);
    assertFixedOnly(sink, r.canary, [tenant]);
  });
});
test('bootstrapFailure_captureNotWired_doesNotChangeLogin', async () => {
  ec._resetForTests();
  for (const kind of ['google', 'email']) {
    const key = kind === 'email' ? 'nw' + rnd().slice(4) + '@example.com' : 'nw' + rnd().slice(4);
    const r = await runBootstrapScenario(kind, key);
    assert.strictEqual(r.threw, null, kind + ': login must not throw when capture is not wired');
    assert.ok(r.warns.some(w => w.m === B_CODE), kind + ': warn still fires');
    assert.notStrictEqual(r.req.session.role, 'admin', kind + ': no admin');
    assert.ok(r.req.session.tenantId || r.req.session.login, kind + ': login completed (session populated)');
  }
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
