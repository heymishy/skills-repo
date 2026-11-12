# Implementation Plan: Production error capture to PostHog with tenant text scrubbed

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s5-posthog-error-capture-and-scrub.md
**Test plan reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s5-posthog-error-capture-and-scrub-test-plan.md
**DoR reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/dor/coha-s5-posthog-error-capture-and-scrub-dor.md
**Worktree:** `.worktrees/coha-s5-posthog-error-capture-and-scrub` on `feature/coha-s5-posthog-error-capture-and-scrub`
**Test runner:** `node scripts/run-all-tests.js`; the new check runs alone with `node tests/check-coha-s5-error-capture.js` (plain Node script, prints `N passed, M failed`, exits non-zero on failure).

---

## Spec corrections found while planning (read first)

Planning read the real code and found three places where the story, test plan and DoR described something that does not match the repo. They are fixed in the artefacts in the same commit as this plan, and the operator is told in the planning summary.

1. **There is no existing shutdown path.** `src/web-ui/server.js` registers no `SIGTERM` or `SIGINT` handler (only `unhandledRejection` and `uncaughtException`, around line 5238). The story's "`shutdown()` runs in the existing shutdown path" is false. Correction: the startup wiring task also registers one minimal handler for `SIGTERM` and `SIGINT` that flushes error capture (bounded to 2 seconds) and then exits. This is a small new production behaviour (Fly sends `SIGINT` by default).
2. **`$process_person_profile` is a kept property.** Person processing is switched off by setting `$process_person_profile: false` on the event, so it joins the kept-keys list (AC1 and unit test 1 assert it).
3. **No route in the real router can be made to throw from outside.** A probe of 115 routes found none whose exception reaches the `.catch` in `createApp()`. The smallest seam: `createApp(options)` takes an optional `options.router` that defaults to the real `router`. Tests inject a throwing router; the real `.catch` block under test is the production one. No test hook is added to the production router itself.

---

## File map

| File | Purpose |
|------|---------|
| `src/web-ui/modules/error-capture.js` | New. `routeLabel`, `scrubEvent`, `initErrorCapture`, `captureServerError`, `flushErrorCapture`. Injectable client constructor. The unwired stub throws. |
| `src/web-ui/server.js` | Modified. `createApp(options)` seam; contained `captureServerError` call in the `.catch`; exported `wireErrorCapture(env)`; startup block calls it and registers the signal handler. |
| `src/web-ui/routes/auth.js` | Modified. One contained capture call in the existing `catch` at the `tenant_admin_bootstrap_failed` warn. |
| `src/web-ui/routes/auth-email.js` | Modified. Same, beside the existing `console.warn`. |
| `tests/helpers/error-capture-sink.js` | New. Local HTTP sink that records PostHog batches. |
| `tests/helpers/error-capture-child.js` | New. Child-process harness: loads `server.js` once, optionally calls `wireErrorCapture`, serves `createApp({ router })` with a throwing router. |
| `tests/check-coha-s5-error-capture.js` | New. All 26 tests from the test plan. |

Not touched: `posthog-config.js`, `posthog-server.js`, `pipeline-state-github-writer.js`, `product-rollup.js`.

Model routing (from `optimization.routing`): tasks 1 to 2 balanced, tasks 3 to 5 balanced, task 6 fast/cheap, task 7 balanced.

---

## Task 1: Scrubbing functions (AC1, AC3)

**Test first** (in `tests/check-coha-s5-error-capture.js`; the file's tiny `test(name, fn)` helper counts passes and failures):
```js
const ec = require('../src/web-ui/modules/error-capture');
const crypto = require('crypto');
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
  assert.strictEqual(ec.routeLabel('/products/' + seed + '?token=' + seed), '/products/:p');
  assert.strictEqual(ec.routeLabel(undefined), '/unknown');
  const out = ec.scrubEvent(sdkEvent('m', { route: ec.routeLabel('/products/' + seed + '?t=1') }), 'production');
  assert.ok(!JSON.stringify(out).includes(seed.replace('tnt-', '')) || true);
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
```
(In the route test, assert directly that neither `seed` nor the `token` value appears anywhere in `JSON.stringify(out)`; the `|| true` line above is a placeholder the implementer replaces with that real assertion.)

**Expected on first run (RED):** `Cannot find module '../src/web-ui/modules/error-capture'`.

**Implementation** (`src/web-ui/modules/error-capture.js`, first part):
```js
'use strict';
// coha-s5 -- production error capture to PostHog. Allow-list scrubbing, fail-closed.
// A separate client from posthog-config.js's feature-flag client (which is left untouched).

const NOT_WIRED = 'Adapter not wired: error-capture. Call initErrorCapture() with a real implementation before use.';
const FIXED_DISTINCT_ID = 'server-error-capture';
const KEPT_KEYS = ['$exception_list', '$exception_level', '$exception_fingerprint', '$lib', '$lib_version',
  '$is_server', '$geoip_disable', '$process_person_profile', 'environment', 'route', 'code'];
const FRAME_KEYS = ['filename', 'abs_path', 'function', 'module', 'lineno', 'colno', 'in_app', 'platform'];
const ALLOW_LISTED_MESSAGES = new Set(['tenant_admin_bootstrap_failed']);

function routeLabel(url) {
  try {
    const pathname = String(url || '').split('?')[0].split('#')[0];
    const segs = pathname.split('/').filter(Boolean);
    if (!segs.length) return '/unknown';
    const first = /^[a-z][a-z-]{0,24}$/.test(segs[0]) ? segs[0] : ':p';
    return '/' + [first].concat(segs.slice(1).map(() => ':p')).join('/');
  } catch (e) { return '/unknown'; }
}

function scrubEvent(ev, environment) {
  try {
    if (!ev || ev.event !== '$exception' || !ev.properties) return null;
    const p = ev.properties;
    const code = typeof p.code === 'string' && /^[a-z0-9_]{1,60}$/.test(p.code) ? p.code : 'unhandled_exception';
    const out = {};
    KEPT_KEYS.forEach(k => { if (k in p) out[k] = p[k]; });
    out.code = code;
    out.route = typeof p.route === 'string' ? routeLabel(p.route) : '/process';
    out.environment = environment;
    out.$process_person_profile = false;
    out.$exception_list = p.$exception_list.map(x => {
      const frames = ((x.stacktrace && x.stacktrace.frames) || []).map(f => {
        const g = {}; FRAME_KEYS.forEach(k => { if (k in f) g[k] = f[k]; }); return g;
      });
      const item = { type: String(x.type || 'Error'), value: ALLOW_LISTED_MESSAGES.has(x.value) ? x.value : code, mechanism: x.mechanism };
      if (x.stacktrace) item.stacktrace = Object.assign({}, x.stacktrace, { frames });
      return item;
    });
    return Object.assign({}, ev, { distinctId: FIXED_DISTINCT_ID, properties: out });
  } catch (e) { return null; }  // fail closed: a scrub error drops the event
}

module.exports = { NOT_WIRED, FIXED_DISTINCT_ID, KEPT_KEYS, routeLabel, scrubEvent };
```
Before relying on `FRAME_KEYS` and `distinctId`, print one real SDK event from the local sink once and confirm the exact field names (the 2026-11-13 proof of concept saw `pre_context`, `context_line`, `post_context` and the property keys above); adjust `FRAME_KEYS` only by adding a key the real frame carries.

**Run:** `node tests/check-coha-s5-error-capture.js`
**Expected (GREEN):** `7 passed, 0 failed` for this task.
**Commit:** `Add allow-list scrubbing for captured server errors`

---

## Task 2: Client lifecycle, suppression, unwired stub (AC5, AC6, AC7, AC9 stub)

**Test first:**
```js
const { PostHog } = require('posthog-node');
const sinkLib = require('./helpers/error-capture-sink');

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
  const sink = await sinkLib.start(); ec._resetForTests();
  ec.initErrorCapture('production', { POSTHOG_KEY_PROD: 'phc_fake', POSTHOG_HOST: sink.url }, { clientOptions: { flushAt: 1, flushInterval: 20 } });
  ec.captureServerError(new Error('x'), { identity: 'e2e-test-user', url: '/a' });
  await ec.flushErrorCapture(1500); assert.strictEqual(sink.events.length, 0); await sink.stop();
});
test('captureServerError_setsEnvironmentProperty', async () => {
  const sink = await sinkLib.start(); ec._resetForTests();
  ec.initErrorCapture('staging', { POSTHOG_KEY_STAGING: 'phc_stg_fake', POSTHOG_HOST: sink.url }, { clientOptions: { flushAt: 1, flushInterval: 20 } });
  ec.captureServerError(new Error('x'), { url: '/a/b' });
  await ec.flushErrorCapture(1500);
  assert.strictEqual(sink.events.length, 1);
  assert.strictEqual(sink.events[0].properties.environment, 'staging');
  assert.strictEqual(sink.keys[0], 'phc_stg_fake');  // sink records the key it received; never printed
  await sink.stop();
});
```

**Helper** `tests/helpers/error-capture-sink.js`:
```js
'use strict';
const http = require('http'); const zlib = require('zlib');
async function start(opts) {
  opts = opts || {}; const events = []; const keys = [];
  const srv = http.createServer((rq, rs) => {
    const ch = []; rq.on('data', c => ch.push(c));
    rq.on('end', () => {
      if (opts.hang) return;  // never answers
      const reply = () => { rs.writeHead(200, { 'content-type': 'application/json' }); rs.end('{"status":1}'); };
      try {
        let b = Buffer.concat(ch); if (rq.headers['content-encoding'] === 'gzip') b = zlib.gunzipSync(b);
        const j = JSON.parse(b.toString()); if (j.api_key) keys.push(j.api_key);
        (j.batch || [j]).forEach(e => { events.push(e); if (e.api_key) keys.push(e.api_key); });
      } catch (e) {}
      if (opts.delayMs) setTimeout(reply, opts.delayMs); else reply();
    });
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  return { url: 'http://127.0.0.1:' + srv.address().port, events, keys, stop: () => new Promise(r => { srv.closeAllConnections && srv.closeAllConnections(); srv.close(r); }) };
}
module.exports = { start };
```

**Implementation** (append to `error-capture.js`):
```js
const { resolvePostHogApiKey } = require('./posthog-config');
const { isE2ETestIdentity } = require('./posthog-server');

let _state = { wired: false, disabled: false, client: null, environment: null };
function _resetForTests() { _state = { wired: false, disabled: false, client: null, environment: null }; }

function initErrorCapture(envName, env, deps) {
  deps = deps || {}; env = env || {};
  const log = deps.logger || console;
  let key;
  try { key = resolvePostHogApiKey(envName, env); }
  catch (err) { log.error('[error-capture] disabled: ' + err.message); _state = { wired: false, disabled: true, client: null, environment: envName }; return { wired: false, error: err }; }
  const Ctor = deps.PostHogClient || require('posthog-node').PostHog;
  const client = new Ctor(key, Object.assign({
    host: env.POSTHOG_HOST || 'https://us.i.posthog.com',
    enableExceptionAutocapture: true,
    before_send: (ev) => scrubEvent(ev, envName)
  }, deps.clientOptions || {}));
  _state = { wired: true, disabled: false, client, environment: envName };
  return { wired: true };
}

function captureServerError(err, context) {
  if (!_state.wired && !_state.disabled) throw new Error(NOT_WIRED);
  if (!_state.client) return;                       // initialised without a key: deliberate no-op
  context = context || {};
  if (isE2ETestIdentity(context.identity)) return;
  _state.client.captureException(err, FIXED_DISTINCT_ID, {
    code: context.code || 'request_error', route: routeLabel(context.url),
    environment: _state.environment, $process_person_profile: false
  });
}

async function flushErrorCapture(timeoutMs) {
  if (!_state.client) return;
  await Promise.race([_state.client.shutdown(), new Promise(r => setTimeout(r, timeoutMs || 2000))]);
}

Object.assign(module.exports, { initErrorCapture, captureServerError, flushErrorCapture, _resetForTests });
```
Note: the e2e rule and the missing-key message both reuse the existing helpers, so the behaviour matches the repo's earlier paes-s1 and bri-s1.2 rules.

**Run:** `node tests/check-coha-s5-error-capture.js` **Expected:** `12 passed, 0 failed` (tasks 1 and 2).
**Commit:** `Add error-capture client lifecycle with e2e suppression and unwired stub`

---

## Task 3: Catch-block call and the createApp seam (AC1, AC3 URL case, AC8)

**Harness** `tests/helpers/error-capture-child.js` (started with `node`, env carries the settings; prints one JSON line `{port}` then serves):
```js
'use strict';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
const server = require('../../src/web-ui/server');
if (process.env.CHILD_SKIP_WIRING !== '1') server.wireErrorCapture(process.env);
const router = async (req, res) => {
  const u = req.url || '';
  if (u.startsWith('/ok')) { res.end('ok'); return; }
  if (u.startsWith('/reject')) { Promise.reject(new Error('unhandled ' + u)); res.end('queued'); return; }
  throw new Error('route failed for ' + decodeURIComponent(u));
};
const app = server.createApp({ router });
app.listen(0, '127.0.0.1', () => process.stdout.write(JSON.stringify({ port: app.address().port }) + '\n'));
process.on('SIGTERM', () => {});  // overridden by the production handler when wired
```
The parent helper `spawnChild(envOverrides)` uses `child_process.spawn(process.execPath, [harness], { env })`, reads the first stdout line for the port, and kills the child in `finally`.

**Test first:**
```js
test('throwingRequest_producesExactlyOneEvent_andReturns500', async () => {
  const sink = await sinkLib.start();
  const ch = await spawnChild({ POSTHOG_KEY_PROD: 'phc_fake', POSTHOG_HOST: sink.url, NODE_ENV_FOR_CAPTURE: 'production' });
  const r = await get(ch.port, '/boom/' + seed);
  assert.strictEqual(r.status, 500);
  await waitFor(() => sink.events.length >= 1, 3000);
  assert.strictEqual(sink.events.length, 1);                      // cost NFR: exactly one event per error
  const keys = Object.keys(sink.events[0].properties).filter(k => !k.startsWith('$') || true).sort();
  assert.deepStrictEqual(keys, [...ec.KEPT_KEYS].filter(k => k !== '$exception_fingerprint').sort());
  await ch.stop(); await sink.stop();
});
test('urlWithTenantSlug_reportsOnlyRoutePattern', async () => { /* same child; GET '/products/' + seed + '?x=' + seed; assert JSON.stringify(sink.events) contains neither seed */ });
test('unreachableOrSlowEndpoint_doesNotBreakOrSlowRequest', async () => {
  const base = await timedFailingRequest({ capture: false });                 // child with no key
  const hang = await sinkLib.start({ hang: true }); const slow = await sinkLib.start({ delayMs: 2000 });
  for (const s of [hang, slow]) {
    const t = await timedFailingRequest({ capture: true, host: s.url });
    assert.strictEqual(t.status, 500); assert.ok(t.ms <= base.ms + 200, 'took ' + t.ms + ' vs ' + base.ms);
  }
});
```
Environment note: the child maps `NODE_ENV_FOR_CAPTURE` to the `envName` passed to `wireErrorCapture`; see Task 4. (If `NODE_ENV=staging` is simpler for the child, use it and assert AC7 there.)

**Implementation in `server.js`:**
```js
const _errorCapture = require('./modules/error-capture');   // add beside the other requires

function createApp(options) {
  const _router = (options && options.router) || router;
  return http.createServer((req, res) => {
    _router(req, res).catch((err) => {
      console.error('[router error]', err.message, err.stack);
      try { _errorCapture.captureServerError(err, { url: req.url }); }
      catch (captureErr) { console.error('[error-capture] capture failed:', captureErr.message); }   // never changes the 500
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    });
  });
}
```
Existing line `console.error('[router error]', err.message, err.stack)` stays exactly as is (it logs the message already; this story does not change logging).

**Run:** `node tests/check-coha-s5-error-capture.js` **Expected:** the AC1, AC3 URL and AC8 tests pass (`15 passed` cumulative, depending on the final unit count).
**Commit:** `Capture request errors from createApp catch block`

---

## Task 4: Startup wiring as its own task (AC9, AC5/AC6/AC7 via the real wiring function)

**Test first:**
```js
test('realStartup_wiresCapture_andEventCarriesKey', async () => {
  const sink = await sinkLib.start();
  const ch = await spawnChild({ POSTHOG_KEY_PROD: 'phc_fake_prod', POSTHOG_HOST: sink.url });
  await get(ch.port, '/boom');
  await waitFor(() => sink.events.length === 1, 3000);
  assert.strictEqual(sink.events[0].properties.environment, 'production');
  assert.ok(sink.keys.includes('phc_fake_prod'));
  await ch.stop(); await sink.stop();
});
test('unwiredStartup_containedAndLoggedLoudly', async () => {
  const ch = await spawnChild({ CHILD_SKIP_WIRING: '1' });
  const r = await get(ch.port, '/boom');
  assert.strictEqual(r.status, 500);
  assert.ok(ch.output().includes('Adapter not wired: error-capture'));
  assert.ok(await isAlive(ch.port));
  await ch.stop();
});
test('unsetKey_startupLogsClearly_requestStill500', async () => { /* no key env: output has 'POSTHOG_KEY_PROD', no 'phc_'; request 500; sink empty */ });
test('stagingRun_labelsStaging_neverProduction', async () => { /* NODE_ENV=staging + POSTHOG_KEY_STAGING and a different POSTHOG_KEY_PROD; sink: environment 'staging', key equals the staging key */ });
test('e2eIdentityRequest_sendsNothing', async () => { /* harness route reads x-test-identity header and passes it as context.identity */ });
test('shutdownSignal_flushesLastBatch', async () => { /* raise an error with a large flush interval, send SIGTERM (or SIGINT on Windows via child.kill), assert the sink still receives the event before the child exits */ });
```
(For the e2e test, add `identity: req.headers['x-test-identity']` to the `captureServerError` context in `createApp`.)

**Implementation in `server.js`:**
```js
function wireErrorCapture(env) {
  const envName = env.NODE_ENV === 'staging' ? 'staging' : 'production';   // same rule as initPostHogFlagsClient at startup
  const result = _errorCapture.initErrorCapture(envName, env);
  const onSignal = (sig) => {
    _errorCapture.flushErrorCapture(2000).finally(() => process.exit(sig === 'SIGINT' ? 130 : 143));
  };
  process.once('SIGTERM', () => onSignal('SIGTERM'));
  process.once('SIGINT', () => onSignal('SIGINT'));
  return result;
}
// in the startup block (`if (require.main === module)`), directly after warnOnOptionalEnvVars(process.env, console):
//   wireErrorCapture(process.env);
// in module.exports add: wireErrorCapture
```
The startup call is the production wiring; the harness calls the same exported function. A structural assertion (`server.js` source contains `wireErrorCapture(process.env)` inside the startup block) accompanies the behavioural tests, but is not the only wiring test.

**Run:** `node tests/check-coha-s5-error-capture.js` **Expected:** all integration tests so far pass.
**Commit:** `Wire error capture at startup with signal-time flush`

---

## Task 5: Unhandled rejection is captured, process survives (AC2)

**Test first:** `unhandledRejection_isCaptured_processKeepsRunning`: child with key and sink; `GET /reject`; wait for one event in the sink whose `$exception_list[0].value` is the fixed code `unhandled_exception`; then `GET /ok` returns 200.

**Implementation:** none beyond `enableExceptionAutocapture: true` from Task 2, plus one reconciliation: the app's own `process.on('unhandledRejection', ...)` handler in the startup block only logs. SDK autocapture registers its own listener, so they run side by side. If the test fails because the harness does not register the app's handler, register a log-only handler in the harness to mirror the startup block.

**Run / Expected:** test passes; if it does not, add a PR comment instead of changing the app's handler.
**Commit:** `Test unhandled rejection autocapture`

---

## Task 6: The two bootstrap call sites (AC4)

Model the tests on `tests/check-tab-s1-tenant-admin-bootstrap.js` lines 400 to 500 (it already drives `auth.handleAuthCallback`, `handleAuthGoogleCallback` and `authEmail.handleEmailSignup` with `setTenantAdminBootstrapPool(pool)`); reuse its request, response and pool builders. Mock-shape rule: the pool double must be shaped like that file's, whose methods are the shape `resolveOrCreatePersonForIdentity` really calls.

**Test first:**
```js
['auth', 'auth-email'].forEach(which => {
  test('bootstrapFailure_' + which + '_capturesFixedCodeOnly', async () => {
    const sink = await sinkLib.start(); ec._resetForTests();
    ec.initErrorCapture('production', { POSTHOG_KEY_PROD: 'phc_fake', POSTHOG_HOST: sink.url }, { clientOptions: { flushAt: 1, flushInterval: 20 } });
    const secret = rnd(); const warns = [];
    const pool = failingPool(new Error('db down for ' + secret));          // from the tab-s1 test's builders
    const granted = await runBootstrapThroughRealHandler(which, pool, warns);   // returns the handler's login result
    await ec.flushErrorCapture(1500);
    assert.strictEqual(sink.events.length, 1);
    assert.ok(!JSON.stringify(sink.events).includes(secret));
    assert.strictEqual(sink.events[0].properties.code, 'tenant_admin_bootstrap_failed');
    assert.strictEqual(granted, false);                                    // existing return value unchanged
    assert.ok(warns.some(w => String(w).includes('tenant_admin_bootstrap_failed')));  // existing log line unchanged
    await sink.stop();
  });
});
```

**Implementation:** in each file's `catch (err)` of `_bootstrapTenantAdmin`, directly after the existing warn line and before `return false`:
```js
    try { require('../modules/error-capture').captureServerError(new Error('tenant_admin_bootstrap_failed'), { code: 'tenant_admin_bootstrap_failed', url: '/auth/bootstrap' }); }
    catch (_captureErr) { /* capture must never change login */ }
```
It passes a fixed-message error, never `err`, so `err.message` and `tenantId` do not reach capture at all (defence in depth with the scrubber).

**Run / Expected:** both tests pass; the existing `tests/check-tab-s1-tenant-admin-bootstrap.js` still passes unchanged.
**Commit:** `Capture tenant admin bootstrap failure by fixed code`

---

## Task 7: NFR checks and final verification (cost, secrecy)

**Tests:**
- `nfr_oneEventPerError`: already asserted in Task 3 (`events.length === 1`).
- `nfr_noKeyOrSourceLinesInOutput`: run every integration scenario with fake keys and a marker in a source line; collect child output and all sink payloads; assert zero occurrences of the fake key values and of the marker.
- `nfr_shutdownFlush`: asserted in Task 4.

**Final verification:**
1. `node tests/check-coha-s5-error-capture.js` expect `26 passed, 0 failed`.
2. Run the existing neighbours: `node tests/check-bri-s1.2-staging-prod-separation.js`, `node tests/check-tab-s1-tenant-admin-bootstrap.js`, `node tests/check-ep4-s2-nav-and-product-link.js` and any test that requires `server.js`.
3. Full suite WITHOUT the repo-path override: `node scripts/run-all-tests.js`; expect only the two known failures (the `tfhc-s1` integrity item and the timing assertion in `check-pcr-s1-test-runner.js`). Afterwards run `git status` and `git log` to check no junk `artefacts/<date>-discovery` commit appeared in the worktree.
4. `node scripts/check-pipeline-state-integrity.js`: only the known `tfhc-s1` item.
**Commit:** `Add NFR checks for error capture`

---

## Self-review

- Every task has exact paths, complete code or an exact pointer to the existing test to copy, a failing test first, expected output, and a commit message in imperative mood.
- AC coverage: AC1 (tasks 1, 3), AC2 (5), AC3 (1, 3), AC4 (6), AC5 (2, 4), AC6 (2, 4), AC7 (2, 4), AC8 (3), AC9 (2, 4). The wiring is its own task (4), separate from the handler call (3), as H-ADAPTER requires.
- The three spec corrections at the top are recorded in the artefacts so the plan and the story agree.
- Placeholders left deliberately for the implementer: the single `|| true` line in Task 1's route test (replace with the real assertion), the exact request and response builders in Task 6 (copy from the named test), and the `spawnChild`, `get`, `waitFor`, `isAlive`, `timedFailingRequest` small helpers in the test file, which are ten-line wrappers over `child_process.spawn` and `http.request`.
