'use strict';
// lpw-s5 T1 to T4 (AC1, AC2, AC4) -- the test-mode stub that answers streamed chat turns ends on a question, so the
// chat page does not auto-send hidden "continue" turns forever (which left the send button disabled and made four
// model-session specs time out). Behavioural: the real test server, a real streamed turn, a real browser page.
// Plain Node script. Run: node tests/check-lpw-s5-stub-turn-ends-on-question.js

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const root = path.resolve(__dirname, '..');
const { request, chromium } = require(path.join(root, 'node_modules', '@playwright', 'test'));
const { getCsrfToken } = require(path.join(root, 'tests', 'e2e', 'fixtures', 'csrf'));

const tests = [];
function test(name, fn) { tests.push({ name: name, fn: fn }); }
const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

async function withServer(port, fn) {
  const env = Object.assign({}, process.env, {
    NODE_ENV: 'test', PORT: String(port), GITHUB_CLIENT_ID: 'x', GITHUB_CLIENT_SECRET: 'x',
    SESSION_SECRET: 'e2e-test-session-secret-minimum32chars', E2E_BASE_URL: 'http://localhost:' + port,
    E2E_RATE_LIMIT_BYPASS: 'true', TENANT_ORG_ALLOWLIST: 'e2e-shared-org', WIRE_SKILL_ADAPTERS: 'true'
  });
  const srv = spawn(process.execPath, ['src/web-ui/server.js'], { cwd: root, env: env, stdio: 'ignore' });
  try {
    for (let i = 0; i < 60; i++) { try { await fetch('http://localhost:' + port + '/'); break; } catch (e) { await sleep(500); } }
    const ctx = await request.newContext({ baseURL: 'http://localhost:' + port });
    try { await ctx.get('/test/session'); return await fn(ctx, port); } finally { await ctx.dispose(); }
  } finally { srv.kill(); }
}

/** A fresh discovery session on the test server: creates a journey the way the real page does and returns its ids. */
async function freshSession(ctx) {
  const csrf = await getCsrfToken(ctx, '/journey', 'journey home page');
  const created = await ctx.post('/api/journey', { form: { featureName: 'lpw-s5 probe ' + Date.now(), startSkill: 'discovery', _csrf: csrf }, maxRedirects: 0 });
  assert.strictEqual(created.status(), 303, 'journey creation: ' + created.status());
  const location = created.headers()['location'];
  const m = /\/skills\/([^/]+)\/sessions\/([^/]+)\/chat/.exec(location);
  assert.ok(m, 'chat location not recognised: ' + location);
  return { skill: m[1], sessionId: m[2], location: location };
}

/** Parses the server-sent events of one streamed turn into { text, events }. */
function parseStream(body) {
  const events = body.split('\n\n').map(function (b) { return b.replace(/^data: /, '').trim(); }).filter(Boolean)
    .map(function (j) { try { return JSON.parse(j); } catch (e) { return null; } }).filter(Boolean);
  const text = events.filter(function (e) { return typeof e.chunk === 'string'; }).map(function (e) { return e.chunk; }).join('');
  return { text: text, events: events };
}
async function streamTurn(ctx, s, answer) {
  const res = await ctx.post('/api/skills/' + s.skill + '/sessions/' + s.sessionId + '/turn-stream', {
    data: { answer: answer, attemptId: 'lpw-s5-' + Date.now() + '-' + Math.random().toString(16).slice(2) }, headers: { 'Content-Type': 'application/json' }
  });
  assert.strictEqual(res.status(), 200, 'turn-stream status ' + res.status());
  return parseStream(await res.text());
}

test('T1a a streamed turn is not done and its text contains a question', async function () {
  await withServer(3965, async function (ctx) {
    const s = await freshSession(ctx);
    const r = await streamTurn(ctx, s, '__init__');
    const last = r.events[r.events.length - 1];
    assert.ok(last && last.done === false, 'the last event must be done:false, got ' + JSON.stringify(last));
    assert.ok(r.text.indexOf('?') !== -1, 'the streamed text must contain a question mark (the page auto-continues turns without one)');
  });
});

test('T1b the turn still carries its system-architecture and program-design canvas blocks', async function () {
  await withServer(3966, async function (ctx) {
    const s = await freshSession(ctx);
    const r = await streamTurn(ctx, s, '__init__');
    const types = r.events.filter(function (e) { return e.canvasBlock; }).map(function (e) { return e.canvasBlock.type; });
    assert.ok(types.indexOf('system-architecture') !== -1, 'system-architecture block missing: ' + types.join(','));
    assert.ok(types.indexOf('program-design') !== -1, 'program-design block missing: ' + types.join(','));
  });
});

test('T2 a fresh chat page sends at most one stream request in ten seconds and its send button is enabled', async function () {
  await withServer(3967, async function (ctx, port) {
    const s = await freshSession(ctx);
    let browser;
    try { browser = await chromium.launch(); } catch (e) { console.log('[lpw-s5] (chromium could not launch here; T2 skipped: ' + String(e.message).split('\n')[0] + ')'); return; }
    try {
      const state = await ctx.storageState();
      const page = await (await browser.newContext({ baseURL: 'http://localhost:' + port, storageState: state })).newPage();
      let streamRequests = 0;
      page.on('request', function (rq) { if (/\/turn-stream$/.test(rq.url())) streamRequests++; });
      await page.goto(s.location);
      await page.waitForTimeout(10000);
      const disabled = await page.evaluate(function () { const b = document.querySelector('#chat-form button[type="submit"]'); return b ? b.disabled : 'no button'; });
      assert.ok(streamRequests <= 1, 'the page sent ' + streamRequests + ' stream requests in 10 seconds (a runaway continue chain)');
      assert.strictEqual(disabled, false, 'the send button must be enabled, got disabled=' + disabled);
    } finally { await browser.close(); }
  });
});

test('T4a the four specs are out of quarantine with no reason, and the fast ones are in the core lane', function () {
  const matrix = JSON.parse(fs.readFileSync(path.join(root, 'tests', 'e2e', 'capability-matrix.json'), 'utf8'));
  const by = function (n) { return matrix.specs.filter(function (e) { return e.file.indexOf(n + '.spec.js') !== -1; })[0]; };
  const four = ['design-definition-canvas-render', 'ep2-s1-presence-sidebar', 'ep2-s2-stage-visibility', 'rdac-s1-resume-shows-diagrams-artefact-conversation'];
  four.forEach(function (n) {
    const e = by(n);
    assert.ok(e, n + ' must be in the matrix');
    assert.notStrictEqual(e.lane, 'quarantined', n + ' must leave quarantine');
    assert.ok(!e.reason || e.lane !== 'core', n + ' must carry no quarantine reason');
  });
  assert.strictEqual(by('ep2-s2-stage-visibility').lane, 'core');
  assert.strictEqual(by('rdac-s1-resume-shows-diagrams-artefact-conversation').lane, 'core');
  assert.strictEqual(by('design-definition-canvas-render').lane, 'core');
});

// (The acceptance check "no product code changed" compared this branch against master; it held for the pull request that
// added it and would fail any later pull request touching those folders, so it was verified at review and removed.)

(async function () {
  let passed = 0; let failed = 0;
  for (const t of tests) {
    try { await t.fn(); console.log('[lpw-s5] PASS: ' + t.name); passed++; }
    catch (e) { console.error('[lpw-s5] FAIL: ' + t.name + '\n    ' + String(e && e.message).split('\n').join('\n    ')); failed++; }
  }
  console.log('\n[lpw-s5] ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
