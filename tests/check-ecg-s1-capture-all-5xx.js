'use strict';
// ecg-s1 -- every server 5xx reaches the error chain exactly once, without changing any response.
// Plain Node script. Run: node tests/check-ecg-s1-capture-all-5xx.js
// Story: artefacts/2026-11-15-error-capture-coverage/stories/ecg-s1-capture-all-server-5xx.md
// Test plan: artefacts/2026-11-15-error-capture-coverage/test-plans/ecg-s1-test-plan.md

process.env.NODE_ENV = 'test';
const assert = require('assert');
const http = require('http');

const ec = require('../src/web-ui/modules/error-capture');
const server = require('../src/web-ui/server');
const { authGuard } = require('../src/web-ui/routes/auth');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

// A recording stand-in for the PostHog client: same method shape the module calls (captureException(err, distinctId, props)).
function wire(opts) {
  opts = opts || {};
  const calls = [];
  ec._resetForTests();
  if (!opts.unwired) {
    function Rec() {
      this.captureException = (err, id, props) => { if (opts.throwing) { throw new Error('client down'); } calls.push({ err, id, props }); };
      this.shutdown = async () => {};
    }
    ec.initErrorCapture('production', { POSTHOG_KEY_PROD: 'phc_fake' }, { PostHogClient: Rec, autocapture: false });
  }
  return calls;
}

// Start the REAL createApp with a test router; resolve { status, body, type } for one request.
async function request(router, url) {
  const app = server.createApp({ router });
  await new Promise((res) => app.listen(0, '127.0.0.1', res));
  try {
    return await new Promise((resolve, reject) => {
      http.get({ host: '127.0.0.1', port: app.address().port, path: url || '/products/abc' }, (r) => {
        let b = ''; r.on('data', (c) => { b += c; }); r.on('end', () => resolve({ status: r.statusCode, body: b, type: r.headers['content-type'] }));
      }).on('error', reject);
    });
  } finally { await new Promise((res) => app.close(res)); }
}
const quiet = () => { const e = console.error; console.error = () => {}; return () => { console.error = e; }; };
const settle = () => new Promise((res) => setTimeout(res, 30)); // let any 'finish'-time work run

function guardedRouter(handler) {
  return async function (req, res) { req.session = { accessToken: 'tok' }; authGuard(req, res, handler); };
}

test('T1 a rejecting guarded handler is reported once and still answers the same 500 (AC1)', async () => {
  const calls = wire(); const restore = quiet();
  try {
    const boom = new Error('boom');
    const r = await request(guardedRouter(async () => { throw boom; }), '/products/some-id');
    await settle();
    assert.strictEqual(r.status, 500); assert.strictEqual(r.body, 'Internal Server Error'); assert.ok(/text\/plain/.test(r.type));
    assert.strictEqual(calls.length, 1, 'expected one report, got ' + calls.length);
    assert.strictEqual(calls[0].err, boom);
    assert.strictEqual(calls[0].props.code, 'request_error');
    assert.strictEqual(calls[0].props.route, ec.routeLabel('/products/some-id'));
  } finally { restore(); }
});

test('T2 a throwing guarded handler is reported once and still answers the same 500 (AC2)', async () => {
  const calls = wire(); const restore = quiet();
  try {
    const r = await request(guardedRouter(() => { throw new Error('sync boom'); }));
    await settle();
    assert.strictEqual(r.status, 500); assert.strictEqual(r.body, 'Internal Server Error');
    assert.strictEqual(calls.length, 1);
  } finally { restore(); }
});

test('T3a a plain 500 written without a throw is reported once as http_5xx (AC3)', async () => {
  const calls = wire();
  const r = await request(async (req, res) => { res.writeHead(500); res.end('x'); });
  await settle();
  assert.strictEqual(r.status, 500); assert.strictEqual(r.body, 'x');
  assert.strictEqual(calls.length, 1, 'expected one report, got ' + calls.length);
  assert.strictEqual(calls[0].props.code, 'http_5xx');
});

test('T3b a 503 is reported once as http_5xx and passes through (AC3)', async () => {
  const calls = wire();
  const r = await request(async (req, res) => { res.writeHead(503, { 'Content-Type': 'text/plain' }); res.end('later'); });
  await settle();
  assert.strictEqual(r.status, 503); assert.strictEqual(r.body, 'later');
  assert.strictEqual(calls.length, 1); assert.strictEqual(calls[0].props.code, 'http_5xx');
});

test('T3c a status set with statusCode then end is reported once (AC3)', async () => {
  const calls = wire();
  const r = await request(async (req, res) => { res.statusCode = 500; res.end('y'); });
  await settle();
  assert.strictEqual(r.status, 500); assert.strictEqual(r.body, 'y');
  assert.strictEqual(calls.length, 1); assert.strictEqual(calls[0].props.code, 'http_5xx');
});

test('T4a a router rejection is reported once, not twice (AC4)', async () => {
  const calls = wire(); const restore = quiet();
  try {
    const r = await request(async () => { throw new Error('router boom'); });
    await settle();
    assert.strictEqual(r.status, 500); assert.strictEqual(r.body, 'Internal Server Error');
    assert.strictEqual(calls.length, 1, 'expected exactly one report, got ' + calls.length);
    assert.strictEqual(calls[0].props.code, 'request_error');
  } finally { restore(); }
});

test('T4b the guard report and the safety net never both fire for one request (AC4)', async () => {
  const calls = wire(); const restore = quiet();
  try {
    await request(guardedRouter(async () => { throw new Error('again'); }));
    await settle();
    assert.strictEqual(calls.length, 1, 'expected exactly one report, got ' + calls.length);
    assert.strictEqual(calls[0].props.code, 'request_error', 'the real-error report wins');
  } finally { restore(); }
});

test('T5 responses below 500 are not reported (AC5)', async () => {
  const calls = wire();
  await request(async (req, res) => { res.writeHead(200); res.end('ok'); });
  await request(async (req, res) => { res.writeHead(302, { Location: '/' }); res.end(); });
  await request(async (req, res) => { res.writeHead(404); res.end('nope'); });
  await settle();
  assert.strictEqual(calls.length, 0);
});

test('T6a unwired capture never changes the response (AC6)', async () => {
  wire({ unwired: true }); const restore = quiet();
  try {
    const g = await request(guardedRouter(async () => { throw new Error('boom'); }));
    const d = await request(async (req, res) => { res.writeHead(500); res.end('x'); });
    await settle();
    assert.strictEqual(g.status, 500); assert.strictEqual(g.body, 'Internal Server Error');
    assert.strictEqual(d.status, 500); assert.strictEqual(d.body, 'x');
  } finally { restore(); }
});

test('T6b a throwing capture client never changes the response (AC6)', async () => {
  wire({ throwing: true }); const restore = quiet();
  try {
    const g = await request(guardedRouter(async () => { throw new Error('boom'); }));
    const d = await request(async (req, res) => { res.writeHead(500); res.end('x'); });
    await settle();
    assert.strictEqual(g.status, 500); assert.strictEqual(g.body, 'Internal Server Error');
    assert.strictEqual(d.status, 500); assert.strictEqual(d.body, 'x');
  } finally { restore(); }
});

test('T7 an unhandled rejection is logged, reported once and does not exit (AC7)', async () => {
  const calls = wire(); const restore = quiet();
  const realExit = process.exit; let exited = false; process.exit = () => { exited = true; };
  try {
    assert.strictEqual(typeof server.handleUnhandledRejection, 'function', 'handleUnhandledRejection must be exported');
    assert.doesNotThrow(() => server.handleUnhandledRejection(new Error('lost promise')));
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0].props.code, 'unhandled_rejection');
    assert.strictEqual(exited, false);
    assert.doesNotThrow(() => server.handleUnhandledRejection('a plain string reason'));
  } finally { process.exit = realExit; restore(); }
});

test('T8 only the allow-listed fields are sent, never the error message or url (NFR)', async () => {
  const calls = wire(); const restore = quiet();
  try {
    await request(guardedRouter(async () => { throw new Error('secret customer@example.com 12345'); }), '/products/6f1c2b3a-0000-4000-8000-000000000000?email=a@b.c');
    await settle();
    assert.strictEqual(calls.length, 1);
    assert.deepStrictEqual(Object.keys(calls[0].props).sort(), ['$process_person_profile', 'code', 'environment', 'route']);
    const sent = JSON.stringify(calls[0].props);
    assert.ok(sent.indexOf('customer@example.com') === -1 && sent.indexOf('6f1c2b3a') === -1 && sent.indexOf('a@b.c') === -1, 'raw value leaked: ' + sent);
  } finally { restore(); }
});

(async () => {
  let passed = 0, failed = 0;
  for (const t of tests) {
    try { await t.fn(); passed++; console.log('  ok   ' + t.name); }
    catch (e) { failed++; console.log('  FAIL ' + t.name + ' -- ' + (e && e.message)); }
  }
  console.log('[ecg-s1-capture-all-5xx] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
