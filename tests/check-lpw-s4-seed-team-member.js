'use strict';
// lpw-s4 T1 to T4 (AC1, AC2, AC4) -- the test server can seed team members for the pod specs. Behavioural: members
// are seeded through the route and read back through the real GET /api/team/members, the same read the pod manager makes.
// Plain Node script. Run: node tests/check-lpw-s4-seed-team-member.js

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const root = path.resolve(__dirname, '..');
const { request } = require(path.join(root, 'node_modules', '@playwright', 'test'));

const tests = [];
function test(name, fn) { tests.push({ name: name, fn: fn }); }
const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

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
    try { await ctx.get('/test/session'); return await fn(ctx); } finally { await ctx.dispose(); }
  } finally { srv.kill(); }
}
function seed(ctx, body) { return ctx.post('/test/seed-team-member', { data: body, headers: { 'Content-Type': 'application/json' } }); }
async function roster(ctx) { return (await (await ctx.get('/api/team/members')).json()).members; }

test('T1a a seeded member comes back from the real roster read with its role', async function () {
  await withServer(3961, {}, async function (ctx) {
    const r = await seed(ctx, { identity: 'Hamish', role: 'engineer' });
    assert.strictEqual(r.status(), 200, 'seed status ' + r.status());
    const members = await roster(ctx);
    assert.deepStrictEqual(members.filter(function (m) { return m.identity === 'Hamish'; }), [{ identity: 'Hamish', role: 'engineer' }]);
  });
});

test('T1b two different identities both come back, with their own roles', async function () {
  await withServer(3962, {}, async function (ctx) {
    await seed(ctx, { identity: 'Hamish', role: 'engineer' });
    await seed(ctx, { identity: 'Susan', role: 'admin' });
    const members = await roster(ctx);
    const by = {}; members.forEach(function (m) { by[m.identity] = m.role; });
    assert.strictEqual(by.Hamish, 'engineer'); assert.strictEqual(by.Susan, 'admin');
  });
});

test('T1c seeding the same identity twice adds it once', async function () {
  await withServer(3963, {}, async function (ctx) {
    await seed(ctx, { identity: 'Hamish', role: 'engineer' });
    const again = await seed(ctx, { identity: 'Hamish', role: 'engineer' });
    assert.strictEqual(again.status(), 200);
    const members = await roster(ctx);
    assert.strictEqual(members.filter(function (m) { return m.identity === 'Hamish'; }).length, 1);
  });
});

test('T2a the route sits behind the same inline NODE_ENV test guard as its sibling seed routes', function () {
  const src = fs.readFileSync(path.join(root, 'src', 'web-ui', 'server.js'), 'utf8');
  assert.ok(/pathname === '\/test\/seed-team-member' && req\.method === 'POST' && process\.env\.NODE_ENV === 'test'/.test(src),
    'route must be guarded by process.env.NODE_ENV === \'test\' in its own condition');
});

test('T2c an empty, over-long or odd identity is refused 400 and nothing is written', async function () {
  await withServer(3964, {}, async function (ctx) {
    const before = (await roster(ctx)).length;
    const bad = ['', '   ', 'a'.repeat(80), 'has space', '<script>', 'a/b', null, 42];
    for (let i = 0; i < bad.length; i++) {
      const r = await seed(ctx, { identity: bad[i], role: 'engineer' });
      assert.strictEqual(r.status(), 400, JSON.stringify(bad[i]) + ' must be refused, got ' + r.status());
    }
    const badRole = await seed(ctx, { identity: 'Okay', role: 'superuser' });
    assert.strictEqual(badRole.status(), 400, 'an unknown role must be refused');
    assert.strictEqual((await roster(ctx)).length, before, 'nothing may be written');
  });
});

test('T4a the four pod specs are out of quarantine, carry no reason, and at least one is in the core lane', function () {
  const matrix = JSON.parse(fs.readFileSync(path.join(root, 'tests', 'e2e', 'capability-matrix.json'), 'utf8'));
  const entries = matrix.specs || matrix.entries || matrix;
  const list = Array.isArray(entries) ? entries : Object.keys(entries).map(function (k) { return Object.assign({ file: k }, entries[k]); });
  const four = ['ep1-s1-pod-creation', 'ep1-s2-product-default-pod', 'ep1-s3-feature-pod-inheritance', 'ep4-s1-multi-pod-assign'];
  const found = four.map(function (n) { return list.filter(function (e) { return e.file.indexOf(n + '.spec.js') !== -1; })[0]; });
  found.forEach(function (e, i) {
    assert.ok(e, four[i] + ' must be in the matrix');
    assert.notStrictEqual(e.lane, 'quarantined', four[i] + ' must leave quarantine');
    assert.ok(!e.reason, four[i] + ' must carry no quarantine reason');
  });
  assert.ok(found.some(function (e) { return e.lane === 'core'; }), 'at least one pods spec must be in the core lane');
});

// (The acceptance check "no product code changed" compared this branch against master; it held for the pull request that
// added it and would fail any later pull request touching those folders, so it was verified at review and removed.)

(async function () {
  let passed = 0; let failed = 0;
  for (const t of tests) {
    try { await t.fn(); console.log('[lpw-s4] PASS: ' + t.name); passed++; }
    catch (e) { console.error('[lpw-s4] FAIL: ' + t.name + '\n    ' + String(e && e.message).split('\n').join('\n    ')); failed++; }
  }
  console.log('\n[lpw-s4] ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
