'use strict';
// tests/check-bri-s2.3-upstash-staging-instance.js
// AC verification for bri-s2.3 (Upstash staging instance) -- see
// artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.3-upstash-staging-instance-test-plan.md
//
// T1/T2 are protective regression guards (static source analysis) proving
// session-redis.js / skill-session-redis.js derive Upstash credentials
// exclusively from process.env, with no hardcoded literal fallback anywhere
// in tracked src/. T3 guards the module-level client singleton against
// credential bleed-through on reload. No live Upstash network calls are made
// (see the story's Coverage gaps -- AC2/AC3 live-instance checks are
// manual-only, see the AC verification script).

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const SESSION_REDIS_PATH = path.join(ROOT, 'src/web-ui/adapters/session-redis.js');
const SKILL_SESSION_REDIS_PATH = path.join(ROOT, 'src/web-ui/adapters/skill-session-redis.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.log(`  [FAIL] ${name} -- ${err.message}`);
    failed++;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.log(`  [FAIL] ${name} -- ${err.message}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// T1 -- Redis client factories derive credentials exclusively from env vars
// ---------------------------------------------------------------------------
test('T1: session-redis.js constructs Redis client from process.env.UPSTASH_REDIS_REST_URL/TOKEN with no hardcoded fallback', () => {
  const src = fs.readFileSync(SESSION_REDIS_PATH, 'utf8');
  assert.ok(
    src.includes('url:   process.env.UPSTASH_REDIS_REST_URL') || src.includes('url: process.env.UPSTASH_REDIS_REST_URL'),
    'session-redis.js must construct the Redis client url from process.env.UPSTASH_REDIS_REST_URL'
  );
  assert.ok(
    src.includes('token: process.env.UPSTASH_REDIS_REST_TOKEN'),
    'session-redis.js must construct the Redis client token from process.env.UPSTASH_REDIS_REST_TOKEN'
  );
  assert.ok(
    !/UPSTASH_REDIS_REST_(URL|TOKEN)\s*\|\|\s*['"]/.test(src),
    'session-redis.js must not have a hardcoded literal fallback for the Upstash URL/token'
  );
});

test('T1: skill-session-redis.js constructs Redis client from process.env.UPSTASH_REDIS_REST_URL/TOKEN with no hardcoded fallback', () => {
  const src = fs.readFileSync(SKILL_SESSION_REDIS_PATH, 'utf8');
  assert.ok(
    src.includes('url:   process.env.UPSTASH_REDIS_REST_URL') || src.includes('url: process.env.UPSTASH_REDIS_REST_URL'),
    'skill-session-redis.js must construct the Redis client url from process.env.UPSTASH_REDIS_REST_URL'
  );
  assert.ok(
    src.includes('token: process.env.UPSTASH_REDIS_REST_TOKEN'),
    'skill-session-redis.js must construct the Redis client token from process.env.UPSTASH_REDIS_REST_TOKEN'
  );
  assert.ok(
    !/UPSTASH_REDIS_REST_(URL|TOKEN)\s*\|\|\s*['"]/.test(src),
    'skill-session-redis.js must not have a hardcoded literal fallback for the Upstash URL/token'
  );
});

// ---------------------------------------------------------------------------
// T2 -- no hardcoded Upstash connection literal anywhere in tracked src/
// ---------------------------------------------------------------------------
test('T2: no literal Upstash REST URL or token-shaped literal exists anywhere in tracked src/', () => {
  const trackedFiles = execSync('git ls-files src', { cwd: ROOT, encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean);

  const upstashUrlPattern = /https:\/\/[a-z0-9-]+\.upstash\.io/i;
  // A literal token assigned directly (not via process.env) -- matches
  // `token: '...'` / `token: "..."` where the value isn't process.env.*
  const literalTokenAssignPattern = /token\s*:\s*['"][^'"]+['"]/;

  const offenders = [];
  for (const rel of trackedFiles) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full) || fs.statSync(full).isDirectory()) continue;
    const content = fs.readFileSync(full, 'utf8');
    if (upstashUrlPattern.test(content)) offenders.push(`${rel}: hardcoded upstash.io URL literal`);
    if (literalTokenAssignPattern.test(content)) offenders.push(`${rel}: literal token: '...' assignment (expected process.env.*)`);
  }

  assert.deepStrictEqual(offenders, [], `Hardcoded Upstash literal(s) found:\n${offenders.join('\n')}`);
});

// ---------------------------------------------------------------------------
// T3 -- session-redis.js's module-level _client singleton does not bleed
// across differing credential configs when the module is reloaded
// (mirrors the require.cache reload pattern used in
// tests/check-arl-s4-admin-billing-bypass.js)
// ---------------------------------------------------------------------------
function loadSessionRedisWithMockedClient() {
  const upstashPath = require.resolve('@upstash/redis');
  const calls = [];

  class MockRedis {
    constructor(opts) { calls.push(opts); }
    async set() { return 'OK'; }
    async del() { return 1; }
    async get() { return null; }
    async scan() { return ['0', []]; }
  }

  delete require.cache[upstashPath];
  require.cache[upstashPath] = {
    id: upstashPath,
    filename: upstashPath,
    loaded: true,
    exports: { Redis: MockRedis }
  };

  delete require.cache[require.resolve(SESSION_REDIS_PATH)];
  const mod = require(SESSION_REDIS_PATH);
  return { mod, calls };
}

async function runT3() {
  const savedUrl = process.env.UPSTASH_REDIS_REST_URL;
  const savedToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  try {
    // Config A
    process.env.UPSTASH_REDIS_REST_URL = 'https://config-a.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token-a';
    const a = loadSessionRedisWithMockedClient();
    await a.mod.writeSession('probe-a', { foo: 'bar' });

    await testAsync('T3: client built under config A uses config A url/token', async () => {
      assert.strictEqual(a.calls.length, 1, `expected exactly 1 client construction, got ${a.calls.length}`);
      assert.strictEqual(a.calls[0].url, 'https://config-a.upstash.io');
      assert.strictEqual(a.calls[0].token, 'token-a');
    });

    // Reload under config B -- module-level _client must reset (fresh require.cache entry)
    process.env.UPSTASH_REDIS_REST_URL = 'https://config-b.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token-b';
    const b = loadSessionRedisWithMockedClient();
    await b.mod.writeSession('probe-b', { foo: 'baz' });

    await testAsync('T3: after reload, a NEW client is built under config B -- no bleed-through from config A', async () => {
      assert.strictEqual(b.calls.length, 1, `expected exactly 1 client construction after reload, got ${b.calls.length}`);
      assert.strictEqual(b.calls[0].url, 'https://config-b.upstash.io');
      assert.strictEqual(b.calls[0].token, 'token-b');
      assert.notStrictEqual(b.calls[0].url, a.calls[0].url, 'config B client must not reuse config A url');
      assert.notStrictEqual(b.calls[0].token, a.calls[0].token, 'config B client must not reuse config A token');
    });
  } finally {
    if (savedUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL; else process.env.UPSTASH_REDIS_REST_URL = savedUrl;
    if (savedToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN; else process.env.UPSTASH_REDIS_REST_TOKEN = savedToken;
    delete require.cache[require.resolve('@upstash/redis')];
    delete require.cache[require.resolve(SESSION_REDIS_PATH)];
  }
}

async function main() {
  await runT3();
  console.log(`\n[bri-s2.3] Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[bri-s2.3] Unexpected error:', err);
  process.exit(1);
});
