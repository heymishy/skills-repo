'use strict';
// sub-s1 -- the dead /answer form route answers 410 Gone, not a 500 that opens a production issue.
// Plain Node script. Run: node tests/check-sub-s1-answer-route-retired.js
// Story: artefacts/2026-11-16-answer-route-retired/stories/sub-s1-retire-the-answer-route.md
// Test plan: artefacts/2026-11-16-answer-route-retired/test-plans/sub-s1-test-plan.md

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
const assert = require('assert');
const crypto = require('crypto');
const http = require('http');

const ec = require('../src/web-ui/modules/error-capture');
const server = require('../src/web-ui/server');
const sessions = require('../src/web-ui/middleware/session');
const skills = require('../src/web-ui/routes/skills');
const skillsAdapter = require('../src/web-ui/adapters/skills');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
const quiet = () => { const e = console.error; const l = console.log; const i = console.info; const w = console.warn; console.error = () => {}; console.log = () => {}; console.info = () => {}; console.warn = () => {}; return () => { console.error = e; console.log = l; console.info = i; console.warn = w; }; };
const settle = () => new Promise((res) => setTimeout(res, 30));

function wire() {
  const calls = [];
  ec._resetForTests();
  function Rec() { this.captureException = (err, id, props) => { calls.push({ err, props }); }; this.shutdown = async () => {}; }
  ec.initErrorCapture('production', { POSTHOG_KEY_PROD: 'phc_fake' }, { PostHogClient: Rec, autocapture: false });
  return calls;
}

// One real server for the whole file; a signed-in cookie for the seeded test session.
const sid = crypto.randomBytes(16).toString('hex');
sessions.seedTestSession(sid, { accessToken: 'tok', userId: 'u1', login: 'u1', tenantId: 't1', csrfToken: 'c' });
let app;
async function post(url, opts) {
  opts = opts || {};
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (opts.signedIn !== false) headers.Cookie = 'session_id=' + sid;
    const r = http.request({ host: '127.0.0.1', port: app.address().port, path: url, method: 'POST', headers }, (res) => {
      let b = ''; res.on('data', (c) => { b += c; }); res.on('end', () => resolve({ status: res.statusCode, body: b, type: res.headers['content-type'], location: res.headers.location }));
    });
    r.on('error', reject); r.end(opts.body === undefined ? 'answer=hi' : opts.body);
  });
}

test('T1 a signed-in POST to /answer answers 410 with the chat link (AC1)', async () => {
  const restore = quiet();
  try {
    const r = await post('/api/skills/discovery/sessions/abc/answer');
    assert.strictEqual(r.status, 410, 'answered ' + r.status + ' ' + r.body.slice(0, 100));
    assert.ok(String(r.type).indexOf('text/html') !== -1, 'content type ' + r.type);
    assert.ok(r.body.indexOf('JavaScript') !== -1, 'the page does not say JavaScript is required');
    assert.ok(r.body.indexOf('href="/skills/discovery/sessions/abc/chat"') !== -1, 'no link to the chat page');
  } finally { restore(); }
});

test('T2 no model call, no adapter call, no error report and no error text (AC2)', async () => {
  const calls = wire(); let adapterCalls = 0;
  skillsAdapter.setSubmitAnswer(async () => { adapterCalls++; return { nextUrl: '/x' }; });
  skills.setSubmitAnswer(async () => { adapterCalls++; return { nextUrl: '/x' }; });
  const restore = quiet();
  try {
    const r = await post('/api/skills/discovery/sessions/abc/answer');
    await settle();
    assert.strictEqual(r.status, 410);
    assert.strictEqual(adapterCalls, 0, 'the legacy submitAnswer adapter was called');
    assert.strictEqual(calls.length, 0, 'an error report was sent');
    assert.ok(r.body.indexOf('Adapter not wired') === -1 && !/\n\s+at \S+/.test(r.body), 'error text in the page');
  } finally { restore(); }
});

test('T3 the skill and session ids in the URL are HTML-escaped (AC3)', async () => {
  const restore = quiet();
  try {
    const evil = '%22%3E%3Cimg%20src%3Dx%20onerror%3D1%3E';
    const r = await post('/api/skills/' + evil + '/sessions/' + evil + '/answer');
    assert.strictEqual(r.status, 410, 'answered ' + r.status);
    assert.ok(r.body.indexOf('<img src=x') === -1, 'raw markup from the URL is in the page');
    assert.ok(r.body.indexOf('&lt;img') !== -1 || r.body.indexOf('&quot;&gt;') !== -1, 'the ids are not shown escaped');
  } finally { restore(); }
});

test('T4 an unauthenticated POST gets the same answer as any other guarded route (AC4)', async () => {
  const restore = quiet();
  try {
    const a = await post('/api/skills/discovery/sessions/abc/answer', { signedIn: false });
    const t = await post('/api/skills/discovery/sessions/abc/turn', { signedIn: false });
    assert.notStrictEqual(a.status, 410, 'an anonymous caller must not see the 410 page');
    assert.ok(a.status < 500, 'anonymous POST answered ' + a.status);
    assert.strictEqual(a.status, t.status, '/answer anonymous answered ' + a.status + ' but /turn anonymous answered ' + t.status);
  } finally { restore(); }
});

test('T5 the legacy handler is unchanged when called directly with a stub (AC5)', async () => {
  const mkRes = () => { const r = { statusCode: null, headers: {}, body: '' }; r.writeHead = (c, h) => { r.statusCode = c; Object.keys(h || {}).forEach((k) => { r.headers[k.toLowerCase()] = h[k]; }); }; r.end = (b) => { if (b) r.body += String(b); }; return r; };
  const mkReq = () => ({ method: 'POST', params: { name: 'discovery', id: 'sid1' }, headers: {}, session: { accessToken: 'tok', userId: 'u1', login: 'u1' }, body: { answer: 'hi' },
    on(ev, cb) { if (ev === 'data') cb(Buffer.from('answer=hi')); if (ev === 'end') cb(); return this; } });
  const restore = quiet();
  try {
    skills.setSubmitAnswer(async () => ({ nextUrl: '/skills/discovery/sessions/sid1/chat' }));
    let res = mkRes(); await skills.handlePostAnswerHtml(mkReq(), res);
    assert.strictEqual(res.statusCode, 303); assert.strictEqual(res.headers.location, '/skills/discovery/sessions/sid1/chat');
    skills.setSubmitAnswer(async () => { const e = new Error('gone'); e.status = 404; throw e; });
    res = mkRes(); await skills.handlePostAnswerHtml(mkReq(), res);
    assert.strictEqual(res.statusCode, 404);
  } finally { restore(); }
});

test('T6 the retired handler never throws (NFR)', async () => {
  assert.strictEqual(typeof skills.handleAnswerRetiredHtml, 'function', 'handleAnswerRetiredHtml is not exported');
  const okRes = () => { const r = { statusCode: null }; r.writeHead = (c) => { r.statusCode = c; }; r.end = () => {}; return r; };
  await assert.doesNotReject(() => skills.handleAnswerRetiredHtml({}, okRes()));
  await assert.doesNotReject(() => skills.handleAnswerRetiredHtml({ params: null, session: null }, okRes()));
  const boom = { writeHead() {}, end() { throw new Error('socket closed'); } };
  await assert.doesNotReject(() => skills.handleAnswerRetiredHtml({ params: { name: 'a', id: 'b' } }, boom));
  const r = okRes(); await skills.handleAnswerRetiredHtml({ params: { name: 'a', id: 'b' }, session: { login: 'u' } }, r);
  assert.strictEqual(r.statusCode, 410);
});

(async () => {
  app = server.createApp();
  await new Promise((res) => app.listen(0, '127.0.0.1', res));
  let passed = 0, failed = 0;
  for (const t of tests) {
    try { await t.fn(); passed++; console.log('  ok   ' + t.name); }
    catch (e) { failed++; console.log('  FAIL ' + t.name + ' -- ' + (e && e.message)); }
  }
  await new Promise((res) => app.close(res));
  console.log('[sub-s1-answer-route-retired] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
