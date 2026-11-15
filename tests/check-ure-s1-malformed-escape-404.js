'use strict';
// ure-s1 -- a broken percent-escape in the URL answers 404 Not Found, not 500, and is not reported as a server error.
// Plain Node script. Run: node tests/check-ure-s1-malformed-escape-404.js
// Story: artefacts/2026-11-16-malformed-url-escape/stories/ure-s1-malformed-url-escape.md
// Test plan: artefacts/2026-11-16-malformed-url-escape/test-plans/ure-s1-test-plan.md

process.env.NODE_ENV = 'test';
const assert = require('assert');
const http = require('http');

const ec = require('../src/web-ui/modules/error-capture');
const server = require('../src/web-ui/server');
const { authGuard } = require('../src/web-ui/routes/auth');
const helper = require('../src/web-ui/utils/invalid-id-error');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

// The engine's own error, not an imitation: this is exactly what the route table's decodeURIComponent throws.
function uriError() { try { decodeURIComponent('%E0%A4%A'); } catch (e) { return e; } throw new Error('decodeURIComponent did not throw'); }
const BROKEN = '%E0%A4%A';

function wire() {
  const calls = [];
  ec._resetForTests();
  function Rec() { this.captureException = (err, id, props) => { calls.push({ err, props }); }; this.shutdown = async () => {}; }
  ec.initErrorCapture('production', { POSTHOG_KEY_PROD: 'phc_fake' }, { PostHogClient: Rec, autocapture: false });
  return calls;
}
async function request(router, url) {
  const app = server.createApp(router ? { router } : undefined);
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

test('T3a the classifier is narrow: a URIError matches only when the request url really cannot be decoded (AC3)', () => {
  const is = helper.isInvalidIdError;
  assert.strictEqual(is(uriError(), { url: '/journey/x/stage/' + BROKEN }), true, 'broken escape in the path');
  assert.strictEqual(is(uriError(), { url: '/x?q=' + BROKEN }), true, 'broken escape only in the query');
  assert.strictEqual(is(uriError(), { url: '/journey/x/stage/ok%20name' }), false, 'the url decodes fine');
  const other = new URIError('something else'); assert.strictEqual(is(other, { url: '/x/' + BROKEN }), false, 'a different URIError message');
  assert.strictEqual(is(new TypeError('URI malformed'), { url: '/x/' + BROKEN }), false, 'not a URIError');
  assert.strictEqual(is(new Error('URI malformed'), { url: '/x/' + BROKEN }), false, 'a plain Error');
  assert.strictEqual(is(null, { url: '/x/' + BROKEN }), false); assert.strictEqual(is('str', { url: '/x/' + BROKEN }), false);
});

test('T4a the uuid-syntax case from uid-s1 is unchanged (AC4)', () => {
  const e = new Error('invalid input syntax for type uuid: "not-a-uuid"'); e.code = '22P02';
  assert.strictEqual(helper.isInvalidIdError(e, { url: '/products/not-a-uuid' }), true);
  assert.strictEqual(helper.isInvalidIdError(e, { url: '/products/other' }), false);
});

test('T7 the classifier never throws on odd inputs (NFR)', () => {
  const throwingName = { get name() { throw new Error('getter'); }, message: 'URI malformed' };
  const cases = [[undefined, undefined], [{}, {}], [throwingName, { url: '/x/' + BROKEN }], [uriError(), null], [uriError(), { url: 42 }], [uriError(), { get url() { throw new Error('url getter'); } }]];
  for (const [err, req] of cases) { assert.doesNotThrow(() => helper.isInvalidIdError(err, req)); assert.strictEqual(helper.isInvalidIdError(err, req), false); }
});

test('T1 a guarded route failing with a URIError caused by the url answers 404 and is not reported (AC1)', async () => {
  const calls = wire(); const restore = quiet();
  try {
    const r = await request(guarded(async () => { throw uriError(); }), '/journey/x/stage/' + BROKEN);
    await settle();
    assert.strictEqual(r.status, 404); assert.strictEqual(r.body, NOT_FOUND_BODY); assert.ok(/application\/json/.test(r.type));
    assert.strictEqual(calls.length, 0, 'a client mistake must not be reported');
  } finally { restore(); }
});

test('T2 a router-level failure answers the same 404 and is not reported (AC2)', async () => {
  const calls = wire(); const restore = quiet();
  try {
    const r = await request(async () => { throw uriError(); }, '/products/x/playback-evidence/' + BROKEN);
    await settle();
    assert.strictEqual(r.status, 404); assert.strictEqual(r.body, NOT_FOUND_BODY); assert.ok(/application\/json/.test(r.type));
    assert.strictEqual(calls.length, 0);
  } finally { restore(); }
});

test('T3b a URIError while the url decodes fine stays a reported 500 (AC3)', async () => {
  const calls = wire(); const restore = quiet();
  try {
    const g = await request(guarded(async () => { throw uriError(); }), '/journey/x/stage/ok');
    const u = await request(async () => { throw uriError(); }, '/journey/x/stage/ok');
    await settle();
    assert.strictEqual(g.status, 500); assert.strictEqual(g.body, 'Internal Server Error');
    assert.strictEqual(u.status, 500); assert.strictEqual(u.body, 'Internal Server Error');
    assert.strictEqual(calls.length, 2, 'both are real defects and must be reported');
  } finally { restore(); }
});

test('T4b other failures are unchanged: 500 and one report each (AC4)', async () => {
  const restore = quiet();
  try {
    for (const make of [() => new TypeError('boom'), () => new URIError('different message'), () => { const e = new Error('duplicate key'); e.code = '23505'; return e; }]) {
      const calls = wire();
      const r = await request(guarded(async () => { throw make(); }), '/journey/x/stage/' + BROKEN);
      await settle();
      assert.strictEqual(r.status, 500); assert.strictEqual(r.body, 'Internal Server Error'); assert.strictEqual(calls.length, 1);
    }
  } finally { restore(); }
});

test('T5 a response that has already ended is not written twice and nothing throws (AC5)', async () => {
  wire(); const restore = quiet();
  try {
    const r = await request(guarded(async (req, res) => { res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('done'); throw uriError(); }), '/journey/x/stage/' + BROKEN);
    await settle();
    assert.strictEqual(r.status, 200); assert.strictEqual(r.body, 'done');
  } finally { restore(); }
});

test('T6a the real route table answers 404 for broken escapes on three decoding routes (AC6)', async () => {
  const calls = wire(); const restore = quiet();
  try {
    for (const url of ['/journey/x/stage/' + BROKEN, '/products/x/playback-evidence/' + BROKEN, '/skills/discovery/sessions/' + BROKEN + '/commit-preview']) {
      const r = await request(null, url);
      assert.strictEqual(r.status, 404, url + ' answered ' + r.status);
      assert.strictEqual(r.body, NOT_FOUND_BODY);
      assert.ok(r.body.indexOf('URI') === -1 && r.body.indexOf('malformed') === -1, 'no error text in the response');
    }
    await settle();
    assert.strictEqual(calls.length, 0);
  } finally { restore(); }
});

test('T6b well-formed escapes still route as before: not answered by the new 404 path (AC6)', async () => {
  const calls = wire(); const restore = quiet();
  try {
    for (const url of ['/journey/x/stage/ok%20name', '/journey/x/stage/a%2Fb']) {
      const r = await request(null, url);
      assert.notStrictEqual(r.body, NOT_FOUND_BODY, url + ' must not be answered by the malformed-escape 404');
      assert.notStrictEqual(r.status, 500, url + ' must not fail');
    }
    await settle();
    assert.strictEqual(calls.length, 0, 'a well-formed request sends no report');
  } finally { restore(); }
});

(async () => {
  let passed = 0, failed = 0;
  for (const t of tests) {
    try { await t.fn(); passed++; console.log('  ok   ' + t.name); }
    catch (e) { failed++; console.log('  FAIL ' + t.name + ' -- ' + (e && e.message)); }
  }
  console.log('[ure-s1-malformed-escape-404] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
