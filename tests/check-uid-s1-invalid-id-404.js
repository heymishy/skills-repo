'use strict';
// uid-s1 -- a malformed id in the URL answers 404 Not Found, not 500, and is not reported as a server error.
// Plain Node script. Run: node tests/check-uid-s1-invalid-id-404.js
// Story: artefacts/2026-11-15-invalid-id-not-found/stories/uid-s1-invalid-id-not-found.md
// Test plan: artefacts/2026-11-15-invalid-id-not-found/test-plans/uid-s1-test-plan.md

process.env.NODE_ENV = 'test';
const assert = require('assert');
const http = require('http');

const ec = require('../src/web-ui/modules/error-capture');
const server = require('../src/web-ui/server');
const { authGuard } = require('../src/web-ui/routes/auth');
const productsRoute = require('../src/web-ui/routes/products');
const journeysRoute = require('../src/web-ui/routes/journeys');
const MODULES_ADAPTER_PATH = require.resolve('../src/web-ui/adapters/modules-adapter');

function load() { try { return require('../src/web-ui/utils/invalid-id-error'); } catch (e) { return null; } }

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

// The error node-postgres raises when a uuid column is compared with a non-uuid value (shape confirmed against a real
// Postgres by tests/check-uid-s1-real-postgres.js, test P1).
function uuidError(value) {
  const e = new Error('invalid input syntax for type uuid: "' + value + '"');
  e.code = '22P02';
  return e;
}

function wire() {
  const calls = [];
  ec._resetForTests();
  function Rec() { this.captureException = (err, id, props) => { calls.push({ err, props }); }; this.shutdown = async () => {}; }
  ec.initErrorCapture('production', { POSTHOG_KEY_PROD: 'phc_fake' }, { PostHogClient: Rec, autocapture: false });
  return calls;
}
async function request(router, url) {
  const app = server.createApp({ router });
  await new Promise((res) => app.listen(0, '127.0.0.1', res));
  try {
    return await new Promise((resolve, reject) => {
      http.get({ host: '127.0.0.1', port: app.address().port, path: url }, (r) => {
        let b = ''; r.on('data', (c) => { b += c; }); r.on('end', () => resolve({ status: r.statusCode, body: b, type: r.headers['content-type'] }));
      }).on('error', reject);
    });
  } finally { await new Promise((res) => app.close(res)); }
}
const quiet = () => { const e = console.error; const l = console.log; console.error = () => {}; console.log = () => {}; return () => { console.error = e; console.log = l; }; };
const settle = () => new Promise((res) => setTimeout(res, 30));
const guarded = (handler) => async function (req, res) { req.session = { accessToken: 'tok', tenantId: 't1' }; authGuard(req, res, () => handler(req, res)); };
const NOT_FOUND_BODY = JSON.stringify({ error: 'not found' });

test('T3a the classifier is narrow: only a uuid-syntax error whose value is in the url matches (AC3)', () => {
  const m = load();
  assert.ok(m && typeof m.isInvalidIdError === 'function', 'src/web-ui/utils/invalid-id-error.js must export isInvalidIdError');
  const is = m.isInvalidIdError;
  assert.strictEqual(is(uuidError('not-a-uuid'), { url: '/products/not-a-uuid' }), true);
  assert.strictEqual(is(uuidError('%E0%A4%A'), { url: '/products/%E0%A4%A' }), true, 'raw form');
  assert.strictEqual(is(uuidError("' OR 1=1 --"), { url: '/products/%27%20OR%201%3D1%20--' }), true, 'percent-encoded url, decoded value');
  assert.strictEqual(is(uuidError('abc'), { url: '/products/other' }), false, 'value not in the url');
  assert.strictEqual(is(uuidError(''), { url: '/products/x' }), false, 'empty value');
  const intErr = new Error('invalid input syntax for type integer: "abc"'); intErr.code = '22P02';
  assert.strictEqual(is(intErr, { url: '/x/abc' }), false, 'a different type');
  const other = uuidError('abc'); other.code = '23505';
  assert.strictEqual(is(other, { url: '/x/abc' }), false, 'a different code');
  assert.strictEqual(is(null, { url: '/x' }), false); assert.strictEqual(is('str', { url: '/x' }), false);
});

test('T7 the classifier never throws on odd inputs (NFR)', () => {
  const m = load(); assert.ok(m, 'module must exist');
  const bad = { get message() { throw new Error('getter'); }, code: '22P02' };
  for (const [err, req] of [[undefined, undefined], [{}, {}], [{ code: '22P02' }, { url: '/x' }], [bad, { url: '/x' }],
    [{ code: '22P02', message: 42 }, { url: '/x' }], [uuidError('a'), null], [uuidError('a'), { url: 42 }]]) {
    assert.doesNotThrow(() => m.isInvalidIdError(err, req));
    assert.strictEqual(m.isInvalidIdError(err, req), false);
  }
});

test('T1 a guarded route failing with a uuid error caused by the url answers 404 and is not reported (AC1)', async () => {
  const calls = wire(); const restore = quiet();
  try {
    const r = await request(guarded(async () => { throw uuidError('not-a-uuid'); }), '/products/not-a-uuid');
    await settle();
    assert.strictEqual(r.status, 404); assert.strictEqual(r.body, NOT_FOUND_BODY); assert.ok(/application\/json/.test(r.type));
    assert.strictEqual(calls.length, 0, 'a client mistake must not be reported');
  } finally { restore(); }
});

test('T2 an unguarded route failing the same way answers the same 404 and is not reported (AC2)', async () => {
  const calls = wire(); const restore = quiet();
  try {
    const r = await request(async () => { throw uuidError('not-a-uuid'); }, '/products/not-a-uuid');
    await settle();
    assert.strictEqual(r.status, 404); assert.strictEqual(r.body, NOT_FOUND_BODY); assert.ok(/application\/json/.test(r.type));
    assert.strictEqual(calls.length, 0);
  } finally { restore(); }
});

test('T3b a uuid error whose value is not in the url stays a reported 500 (AC3)', async () => {
  const calls = wire(); const restore = quiet();
  try {
    const g = await request(guarded(async () => { throw uuidError('some-other-value'); }), '/products/abc');
    const u = await request(async () => { throw uuidError(''); }, '/products/abc');
    await settle();
    assert.strictEqual(g.status, 500); assert.strictEqual(g.body, 'Internal Server Error');
    assert.strictEqual(u.status, 500); assert.strictEqual(u.body, 'Internal Server Error');
    assert.strictEqual(calls.length, 2, 'both are real defects and must be reported');
  } finally { restore(); }
});

test('T4a another database error is unchanged: 500 and one report (AC4)', async () => {
  const calls = wire(); const restore = quiet();
  try {
    const e = new Error('duplicate key'); e.code = '23505';
    const r = await request(guarded(async () => { throw e; }), '/products/abc');
    await settle();
    assert.strictEqual(r.status, 500); assert.strictEqual(r.body, 'Internal Server Error'); assert.strictEqual(calls.length, 1);
  } finally { restore(); }
});

test('T4b a plain thrown error is unchanged: 500 and one report (AC4)', async () => {
  const calls = wire(); const restore = quiet();
  try {
    const r = await request(async () => { throw new Error('boom'); }, '/products/abc');
    await settle();
    assert.strictEqual(r.status, 500); assert.strictEqual(r.body, 'Internal Server Error'); assert.strictEqual(calls.length, 1);
  } finally { restore(); }
});

test('T5 a response that has already started is not written twice and nothing throws (AC5)', async () => {
  wire(); const restore = quiet();
  try {
    // The response is complete (head and body sent) before the error arrives, as when a handler fails after replying.
    const r = await request(guarded(async (req, res) => { res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('done'); throw uuidError('x'); }), '/products/x');
    await settle();
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body, 'done', 'nothing appended to a response that has already been sent');
  } finally { restore(); }
});

function failingPool(value) { return { query: async () => { throw uuidError(value); } }; }
test('T6a the real product page handler answers 404 for malformed ids, and a well-formed unknown id still 404s (AC6)', async () => {
  const calls = wire(); const restore = quiet();
  try {
    require(MODULES_ADAPTER_PATH).setModulesAdapter({ query: async () => ({ rows: [] }) });
    for (const seg of ['not-a-uuid', '%00', '%E0%A4%A', '%27%20OR%201%3D1%20--']) {
      const value = decodeURIComponentSafe(seg) === seg ? seg : seg; // the server passes the raw segment to the query
      const r = await request(guarded(async (req, res) => {
        req.params = { id: req.url.split('/')[2] };
        await productsRoute.handleGetProductView(req, res, null, failingPool(req.params.id));
      }), '/products/' + seg);
      assert.strictEqual(r.status, 404, '/products/' + seg + ' answered ' + r.status);
      assert.strictEqual(r.body, NOT_FOUND_BODY);
      assert.ok(r.body.indexOf('uuid') === -1 && r.body.indexOf('syntax') === -1, 'no database text in the response');
      void value;
    }
    const unknown = await request(guarded(async (req, res) => {
      req.params = { id: '00000000-0000-0000-0000-000000000000' };
      await productsRoute.handleGetProductView(req, res, null, { query: async () => ({ rows: [] }) });
    }), '/products/00000000-0000-0000-0000-000000000000');
    assert.strictEqual(unknown.status, 404);
    await settle();
    assert.strictEqual(calls.length, 0);
  } finally { restore(); }
});
function decodeURIComponentSafe(s) { try { return decodeURIComponent(s); } catch (e) { return s; } }

test('T6b the real journey page handler answers 404 for malformed ids (AC6)', async () => {
  const calls = wire(); const restore = quiet();
  try {
    for (const seg of ['not-a-uuid', '%00']) {
      const r = await request(guarded(async (req, res) => {
        req.params = { id: req.url.split('/')[2] };
        await journeysRoute.handleGetJourneyCanvas(req, res, null, failingPool(req.params.id));
      }), '/journeys/' + seg);
      assert.strictEqual(r.status, 404, '/journeys/' + seg + ' answered ' + r.status);
      assert.strictEqual(r.body, NOT_FOUND_BODY);
    }
    await settle();
    assert.strictEqual(calls.length, 0);
  } finally { restore(); }
});

(async () => {
  let passed = 0, failed = 0;
  for (const t of tests) {
    try { await t.fn(); passed++; console.log('  ok   ' + t.name); }
    catch (e) { failed++; console.log('  FAIL ' + t.name + ' -- ' + (e && e.message)); }
  }
  console.log('[uid-s1-invalid-id-404] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
