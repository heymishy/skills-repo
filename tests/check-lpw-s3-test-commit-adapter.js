'use strict';
// lpw-s3 T4 (AC4, AC1) -- the board's Advance works end to end against the real test server, with the opt-in test-mode
// artefact commit adapter. Behavioural, not "a function was assigned" (D37 point 4): a seeded ready card is advanced
// with the token the board page itself handed to its script, and it ends up in the next column.
// Plain Node script. Run: node tests/check-lpw-s3-test-commit-adapter.js

const assert = require('assert');
const path = require('path');
const { spawn } = require('child_process');
const root = path.resolve(__dirname, '..');
const { request } = require(path.join(root, 'node_modules', '@playwright', 'test'));
const { getCsrfToken } = require(path.join(root, 'tests', 'e2e', 'fixtures', 'csrf'));
const writer = require(path.join(root, 'src', 'web-ui', 'adapters', 'artefact-commit-writer'));

const tests = [];
function test(name, fn) { tests.push({ name: name, fn: fn }); }
const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

test('T4a the test commit adapter refuses to run outside NODE_ENV=test and returns a Contents-API-shaped result inside it', async function () {
  assert.strictEqual(typeof writer.testCommitArtefact, 'function', 'artefact-commit-writer must export testCommitArtefact');
  const saved = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';
    await assert.rejects(function () { return writer.testCommitArtefact('a.md', 'x', 't', 'o', 'r'); }, /test/i);
    process.env.NODE_ENV = 'test';
    const r = await writer.testCommitArtefact('a.md', 'x', 't', 'o', 'r');
    assert.ok(r && r.content && r.content.sha && r.commit && r.commit.sha, 'result must look like the Contents API response');
  } finally { process.env.NODE_ENV = saved; }
});

async function withServer(port, extraEnv, fn) {
  const env = Object.assign({}, process.env, {
    NODE_ENV: 'test', PORT: String(port), GITHUB_CLIENT_ID: 'x', GITHUB_CLIENT_SECRET: 'x',
    SESSION_SECRET: 'e2e-test-session-secret-minimum32chars', E2E_BASE_URL: 'http://localhost:' + port,
    E2E_RATE_LIMIT_BYPASS: 'true', TENANT_ORG_ALLOWLIST: 'e2e-shared-org', WIRE_SKILL_ADAPTERS: 'true'
  }, extraEnv);
  const srv = spawn(process.execPath, ['src/web-ui/server.js'], { cwd: root, env: env, stdio: 'ignore' });
  try {
    for (let i = 0; i < 60; i++) { try { await fetch('http://localhost:' + port + '/'); break; } catch (e) { await sleep(500); } }
    const ctx = await request.newContext({ baseURL: 'http://localhost:' + port });
    try { return await fn(ctx); } finally { await ctx.dispose(); }
  } finally { srv.kill(); }
}

async function seedReadyCard(ctx) {
  await ctx.get('/test/session');
  const name = 'Board Probe ' + Date.now();
  await ctx.post('/products/new', { data: { name: name, description: 'p' }, headers: { 'Content-Type': 'application/json' } });
  const csrf = await getCsrfToken(ctx, '/products/new', 'new product page');
  const c = await ctx.post('/products/confirm', { form: { name: name, description: 'p', _csrf: csrf }, maxRedirects: 0 });
  const productId = c.headers()['location'].split('/products/')[1];
  await ctx.post('/test/seed-product-repo', { data: { productId: productId }, headers: { 'Content-Type': 'application/json' } });
  const seeded = await (await ctx.post('/test/seed-board-journey', { data: { productId: productId, stage: 'discovery', done: true, featureSlug: 'lpw-s3-' + Date.now() }, headers: { 'Content-Type': 'application/json' } })).json();
  return { productId: productId, journeyId: seeded.journeyId };
}
async function columnOf(ctx, s) {
  const html = await (await ctx.get('/products/' + s.productId + '/kanban')).text();
  return { html: html, columns: html.split('data-stage="').slice(1).filter(function (p) { return p.indexOf(s.journeyId) !== -1; }).map(function (p) { return p.slice(0, p.indexOf('"')); }) };
}

test('T4b with the adapter wired, advancing with the board page\'s own token moves the card to the next column', async function () {
  await withServer(3996, { E2E_STUB_ARTEFACT_COMMIT: 'true' }, async function (ctx) {
    const s = await seedReadyCard(ctx);
    const before = await columnOf(ctx, s);
    assert.deepStrictEqual(before.columns, ['discovery']);
    const token = (before.html.match(/KB_CSRF\s*=\s*"([0-9a-f]{16,})"/) || [])[1];
    assert.ok(token, 'the board page must hand a real token to its script');
    const adv = await ctx.post('/api/board/journey/' + s.journeyId + '/advance', { data: { _csrf: token }, headers: { 'Content-Type': 'application/json' } });
    const body = await adv.json();
    assert.strictEqual(adv.status(), 200, JSON.stringify(body));
    assert.strictEqual(body.advanced, true); assert.strictEqual(body.stage, 'benefit-metric');
    assert.deepStrictEqual((await columnOf(ctx, s)).columns, ['benefit-metric']);
  });
});

test('T4c without the token the request is refused 403 and the card stays put (the board no longer lies about it)', async function () {
  await withServer(3995, { E2E_STUB_ARTEFACT_COMMIT: 'true' }, async function (ctx) {
    const s = await seedReadyCard(ctx);
    const adv = await ctx.post('/api/board/journey/' + s.journeyId + '/advance');
    assert.strictEqual(adv.status(), 403);
    assert.ok((await adv.json()).advanced !== true);
    assert.deepStrictEqual((await columnOf(ctx, s)).columns, ['discovery']);
  });
});

test('T4d without the opt-in env var the default stays the throwing stub: the advance is a 502, not a pretend commit', async function () {
  await withServer(3994, {}, async function (ctx) {
    const s = await seedReadyCard(ctx);
    const token = ((await columnOf(ctx, s)).html.match(/KB_CSRF\s*=\s*"([0-9a-f]{16,})"/) || [])[1];
    const adv = await ctx.post('/api/board/journey/' + s.journeyId + '/advance', { data: { _csrf: token }, headers: { 'Content-Type': 'application/json' } });
    assert.strictEqual(adv.status(), 502);
  });
});

(async function () {
  let passed = 0; let failed = 0;
  for (const t of tests) {
    try { await t.fn(); console.log('[lpw-s3] PASS: ' + t.name); passed++; }
    catch (e) { console.error('[lpw-s3] FAIL: ' + t.name + '\n    ' + String(e && e.message).split('\n').join('\n    ')); failed++; }
  }
  console.log('\n[lpw-s3] ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
