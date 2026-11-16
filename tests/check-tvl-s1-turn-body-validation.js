'use strict';
// tvl-s1 -- a skill turn with a malformed, empty or oversized body, or the wrong skill in the URL, is refused before any model call.
// Plain Node script. Run: node tests/check-tvl-s1-turn-body-validation.js
// Story: artefacts/2026-11-16-turn-body-validation/stories/tvl-s1-turn-body-validation.md
// Test plan: artefacts/2026-11-16-turn-body-validation/test-plans/tvl-s1-test-plan.md

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
const assert = require('assert');
const { Readable } = require('stream');

const skills = require('../src/web-ui/routes/skills');
const credits = require('../src/web-ui/modules/credits');
const ec = require('../src/web-ui/modules/error-capture');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
const quiet = () => { const e = console.error; const l = console.log; const i = console.info; const w = console.warn; console.error = () => {}; console.log = () => {}; console.info = () => {}; console.warn = () => {}; return () => { console.error = e; console.log = l; console.info = i; console.warn = w; }; };

// ---- counting doubles ----
let modelCalls = 0, streamCalls = 0, creditCalls = 0;
skills.setSkillTurnExecutorAdapter(async () => { modelCalls++; return { text: 'ok reply', usage: null }; });
skills.setSkillTurnExecutorStreamAdapter(async (sys, hist, content, token, onChunk) => { streamCalls++; if (onChunk) onChunk('ok'); return { text: 'ok', usage: null }; });
credits.adjustBalance = async () => { creditCalls++; };
const reports = [];
ec._resetForTests();
function Rec() { this.captureException = (err, id, props) => { reports.push(props); }; this.shutdown = async () => {}; }
ec.initErrorCapture('production', { POSTHOG_KEY_PROD: 'phc_fake' }, { PostHogClient: Rec, autocapture: false });
const reset = () => { modelCalls = 0; streamCalls = 0; creditCalls = 0; reports.length = 0; };

let seq = 0;
function newSession(extra) {
  const id = 'tvl-' + (++seq);
  skills._setHtmlSession(id, Object.assign({ skillName: 'discovery', turns: [], systemPrompt: 'sys', questions: [], answers: [] }, extra));
  return id;
}
function mkReq(sessionId, rawBody, opts) {
  opts = opts || {};
  const req = Readable.from(rawBody === undefined ? [] : [Buffer.from(rawBody)]);
  req.method = 'POST'; req.headers = { 'content-type': 'application/json' };
  req.params = { name: opts.skill || 'discovery', id: sessionId };
  req.session = { accessToken: 'tok', userId: 'u1', login: 'tester', tenantId: 'tenant-1' };
  return req;
}
function mkRes() {
  const r = { statusCode: null, headers: {}, body: '', ended: false };
  r.writeHead = (c, h) => { r.statusCode = c; Object.keys(h || {}).forEach((k) => { r.headers[k.toLowerCase()] = h[k]; }); };
  r.write = (c) => { if (c) r.body += String(c); }; r.end = (c) => { if (c) r.body += String(c); r.ended = true; };
  r.on = () => r; r.setHeader = () => {};
  return r;
}
async function turn(sessionId, raw, opts) { const res = mkRes(); const restore = quiet(); try { await skills.handlePostTurnHtml(mkReq(sessionId, raw, opts), res); } finally { restore(); } return res; }
async function stream(sessionId, raw, opts) { const res = mkRes(); const restore = quiet(); try { await skills.handlePostTurnStreamHtml(mkReq(sessionId, raw, opts), res); } finally { restore(); } return res; }
const J = JSON.stringify;
const E = (code) => J({ error: code });

test('T1 a malformed, empty or non-object body answers 400 INVALID_BODY with no model call, credits or lock (AC1)', async () => {
  for (const raw of ['{"answer": ', '', '[1]', '42', '"x"', 'null']) {
    reset();
    const id = newSession({});
    const res = await turn(id, raw);
    assert.strictEqual(res.statusCode, 400, JSON.stringify(raw) + ' answered ' + res.statusCode);
    assert.strictEqual(res.body, E('INVALID_BODY'), JSON.stringify(raw));
    assert.strictEqual(modelCalls, 0, 'model called for ' + JSON.stringify(raw));
    assert.strictEqual(creditCalls, 0, 'credits adjusted for ' + JSON.stringify(raw));
    assert.strictEqual(reports.length, 0);
  }
});

test('T2 a missing, non-string, empty or whitespace answer answers 400 INVALID_ANSWER; __init__ is accepted (AC2)', async () => {
  for (const raw of ['{}', '{"answer":42}', '{"answer":{"a":1}}', '{"answer":null}', '{"answer":""}', '{"answer":"   "}']) {
    reset();
    const id = newSession({});
    const res = await turn(id, raw);
    assert.strictEqual(res.statusCode, 400, raw + ' answered ' + res.statusCode);
    assert.strictEqual(res.body, E('INVALID_ANSWER'), raw);
    assert.strictEqual(modelCalls, 0, 'model called for ' + raw);
    assert.strictEqual(creditCalls, 0);
  }
  reset();
  const ok = await turn(newSession({}), '{"answer":"__init__"}');
  assert.strictEqual(ok.statusCode, 200, '__init__ answered ' + ok.statusCode);
  assert.strictEqual(modelCalls, 1);
});

test('T3a the limited body reader stops at the limit and reports too large (AC3)', async () => {
  let consumed = 0;
  const big = new Readable({ read() { consumed += 65536; this.push(Buffer.alloc(65536, 97)); if (consumed >= 4 * 1024 * 1024) this.push(null); } });
  big.headers = {};
  const r = await skills._readTurnBody(big);
  assert.ok(r && r.tooLarge === true, 'reported too large: ' + J(r && Object.keys(r)));
  assert.ok(consumed <= 262144 + 3 * 65536, 'kept reading after the limit: consumed ' + consumed);
});

test('T3b an oversized answer or body answers 413 ANSWER_TOO_LARGE; exactly 100000 characters is accepted (AC3)', async () => {
  reset();
  let res = await turn(newSession({}), J({ answer: 'a'.repeat(100001) }));
  assert.strictEqual(res.statusCode, 413); assert.strictEqual(res.body, E('ANSWER_TOO_LARGE')); assert.strictEqual(modelCalls, 0);
  res = await turn(newSession({}), J({ answer: 'a', pad: 'b'.repeat(300000) }));
  assert.strictEqual(res.statusCode, 413); assert.strictEqual(res.body, E('ANSWER_TOO_LARGE')); assert.strictEqual(modelCalls, 0);
  res = await turn(newSession({}), J({ answer: 'a'.repeat(100000) }));
  assert.strictEqual(res.statusCode, 200, 'exactly 100000 answered ' + res.statusCode); assert.strictEqual(modelCalls, 1);
});

test('T4 a different skill in the URL answers 404 and makes no model call (AC4)', async () => {
  for (const skill of ['not-a-skill', '..%2F..%2Fetc', 'ideate']) {
    reset();
    const res = await turn(newSession({}), J({ answer: 'hello' }), { skill });
    assert.strictEqual(res.statusCode, 404, skill + ' answered ' + res.statusCode);
    assert.strictEqual(res.body, E('Session not found').replace('error', 'error'), skill);
    assert.strictEqual(modelCalls, 0);
  }
});

test('T5 the same rejections on /turn-stream, as JSON before any SSE headers (AC5)', async () => {
  const cases = [['{"answer": ', 400, 'INVALID_BODY'], ['{}', 400, 'INVALID_ANSWER'], ['{"answer":""}', 400, 'INVALID_ANSWER'],
    [J({ answer: 'a'.repeat(100001) }), 413, 'ANSWER_TOO_LARGE']];
  for (const [raw, status, code] of cases) {
    reset();
    const res = await stream(newSession({}), raw);
    assert.strictEqual(res.statusCode, status, raw.slice(0, 30) + ' answered ' + res.statusCode);
    assert.strictEqual(res.body, E(code));
    assert.ok(String(res.headers['content-type'] || '').indexOf('text/event-stream') === -1, 'SSE headers were sent');
    assert.strictEqual(streamCalls, 0); assert.strictEqual(creditCalls, 0);
  }
  reset();
  const wrong = await stream(newSession({}), J({ answer: 'hi' }), { skill: 'not-a-skill' });
  assert.strictEqual(wrong.statusCode, 404); assert.ok(String(wrong.headers['content-type'] || '').indexOf('text/event-stream') === -1); assert.strictEqual(streamCalls, 0);
});

test('T6 valid turns are unchanged on both endpoints (AC6)', async () => {
  reset();
  for (const answer of ['An ordinary sentence.', 'héllo 🙂 – unicode', '__init__']) {
    const res = await turn(newSession({}), J({ answer, attemptId: 'a1' }));
    assert.strictEqual(res.statusCode, 200, answer + ' answered ' + res.statusCode);
  }
  assert.strictEqual(modelCalls, 3);
  reset();
  const s = await stream(newSession({}), J({ answer: 'An ordinary sentence.' }));
  assert.strictEqual(s.statusCode, 200); assert.ok(String(s.headers['content-type']).indexOf('text/event-stream') !== -1, 'stream headers'); assert.strictEqual(streamCalls, 1);
});

test('T7 a rejection sends no error report and logs no input (AC7)', async () => {
  reset();
  const lines = []; const orig = { e: console.error, l: console.log, i: console.info, w: console.warn };
  const grab = (...a) => lines.push(a.map(String).join(' '));
  console.error = grab; console.log = grab; console.info = grab; console.warn = grab;
  const canary = 'canary-' + Date.now();
  try { await skills.handlePostTurnHtml(mkReq(newSession({}), '{"answer": "' + canary + ' bad json'), mkRes()); await turn.call(null, newSession({}), J({ answer: 42, note: canary })); }
  finally { console.error = orig.e; console.log = orig.l; console.info = orig.i; console.warn = orig.w; }
  assert.strictEqual(reports.length, 0, 'an error report was sent');
  assert.ok(lines.join('\n').indexOf(canary) === -1, 'the input was logged');
});

test('T8 validation never throws and never leaves the journey locked (NFR)', async () => {
  reset();
  const bad = new Readable({ read() { this.destroy(new Error('boom')); } });
  bad.method = 'POST'; bad.headers = {}; bad.params = { name: 'discovery', id: newSession({}) }; bad.session = { accessToken: 't', tenantId: 'x' };
  const res = mkRes(); const restore = quiet();
  try { await skills.handlePostTurnHtml(bad, res); } finally { restore(); }
  assert.ok(res.statusCode === 400 || res.statusCode === 413, 'stream error answered ' + res.statusCode);
  assert.strictEqual(modelCalls, 0);
  assert.strictEqual(typeof skills._validateTurnRequest, 'function');
  assert.doesNotThrow(() => skills._validateTurnRequest('discovery', undefined, undefined));
  assert.doesNotThrow(() => skills._validateTurnRequest(undefined, null, null));
});

(async () => {
  let passed = 0, failed = 0;
  for (const t of tests) {
    try { await t.fn(); passed++; console.log('  ok   ' + t.name); }
    catch (e) { failed++; console.log('  FAIL ' + t.name + ' -- ' + (e && e.message)); }
  }
  console.log('[tvl-s1-turn-body-validation] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
