# Provision an Upstash staging instance for Redis — Implementation Plan

> **For agent execution:** Executed task-by-task in this session using /tdd discipline (no subagents dispatched — task set is small and single-file).

**Goal:** Make every test in the test plan pass without adding scope beyond the ACs. This story's only in-repo work is a protective regression-guard test file proving the existing `session-redis.js`/`skill-session-redis.js` env-var-only client factory pattern holds (AC1/AC2/NFR-Security) — Upstash-side provisioning and Fly secret assignment are out-of-repo/manual (see decisions.md and the AC verification script).

**Branch:** `feature/bri-s2.3`
**Worktree:** `.worktrees/bri-s2.3`
**Test command:** `node tests/check-bri-s2.3-upstash-staging-instance.js` (new file; full suite via `npm test` — see baseline note below)

**Baseline note:** `npm test` on this Windows environment hits a cmd.exe command-line-length limit unrelated to this story (the full `&&`-chained script exceeds ~8191 chars). A bash-based baseline run confirmed 24 pre-existing `check-pipeline-state-integrity.js` C3 failures (unrelated merged stories with stale `testPlan.passing` counts) and ~36 other pre-existing script failures (e.g. `check-definition-skill.js` expects `.github/skills/definition/SKILL.md`, which does not exist because skill files live under top-level `skills/` — already flagged in `workspace/phase3-backlog-test-coverage-governance-gaps.md`). None of these relate to Upstash/Redis or this story's scope. Acknowledged as pre-existing per /branch-setup option 2 — not fixed here.

---

## File map

```
Create:
  tests/check-bri-s2.3-upstash-staging-instance.js  — T1 (env-var-only credential derivation), T2 (no hardcoded Upstash literal anywhere in tracked src/), T3 (module-reload credential-bleed guard for session-redis.js)

Modify:
  package.json                                       — register the new test file in `scripts.test`
```

No changes to `src/web-ui/adapters/session-redis.js` or `src/web-ui/adapters/skill-session-redis.js` — both already satisfy the pattern under test (confirmed by reading both files during /definition-of-ready; this is a regression guard, not new application logic).

---

## Task 1: T1 + T2 — static regression guards (env-var-only credentials, no hardcoded literals)

**Files:**
- Create: `tests/check-bri-s2.3-upstash-staging-instance.js`

- [ ] **Step 1: Write the failing test (structural placeholder — see note)**

Per the test plan: "Fails before implementation: No — this already holds true in the codebase today... protective regression guard." There is no red state to force here without breaking the very pattern the test protects. Write the test directly against current source; it is expected to pass immediately, and that pass is the evidence the guard is wired correctly.

```javascript
'use strict';
// tests/check-bri-s2.3-upstash-staging-instance.js
// AC verification for bri-s2.3 (Upstash staging instance) -- see
// artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.3-upstash-staging-instance-test-plan.md
//
// T1/T2 are protective regression guards (static source analysis) proving
// session-redis.js / skill-session-redis.js derive Upstash credentials
// exclusively from process.env, with no hardcoded literal fallback anywhere
// in tracked src/. No live Upstash network calls are made (see the story's
// Coverage gaps -- AC2/AC3 live-instance checks are manual-only).

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

// ---------------------------------------------------------------------------
// T1 -- Redis client factories derive credentials exclusively from env vars
// ---------------------------------------------------------------------------
test('T1: session-redis.js constructs Redis client from process.env.UPSTASH_REDIS_REST_URL/TOKEN with no hardcoded fallback', () => {
  const src = fs.readFileSync(SESSION_REDIS_PATH, 'utf8');
  assert.ok(src.includes('url:   process.env.UPSTASH_REDIS_REST_URL') || src.includes('url: process.env.UPSTASH_REDIS_REST_URL'),
    'session-redis.js must construct the Redis client url from process.env.UPSTASH_REDIS_REST_URL');
  assert.ok(src.includes('token: process.env.UPSTASH_REDIS_REST_TOKEN'),
    'session-redis.js must construct the Redis client token from process.env.UPSTASH_REDIS_REST_TOKEN');
  assert.ok(!/UPSTASH_REDIS_REST_(URL|TOKEN)\s*\|\|\s*['"]/.test(src),
    'session-redis.js must not have a hardcoded literal fallback for the Upstash URL/token');
});

test('T1: skill-session-redis.js constructs Redis client from process.env.UPSTASH_REDIS_REST_URL/TOKEN with no hardcoded fallback', () => {
  const src = fs.readFileSync(SKILL_SESSION_REDIS_PATH, 'utf8');
  assert.ok(src.includes('url:   process.env.UPSTASH_REDIS_REST_URL') || src.includes('url: process.env.UPSTASH_REDIS_REST_URL'),
    'skill-session-redis.js must construct the Redis client url from process.env.UPSTASH_REDIS_REST_URL');
  assert.ok(src.includes('token: process.env.UPSTASH_REDIS_REST_TOKEN'),
    'skill-session-redis.js must construct the Redis client token from process.env.UPSTASH_REDIS_REST_TOKEN');
  assert.ok(!/UPSTASH_REDIS_REST_(URL|TOKEN)\s*\|\|\s*['"]/.test(src),
    'skill-session-redis.js must not have a hardcoded literal fallback for the Upstash URL/token');
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

module.exports = { test, run: () => ({ passed, failed }) };

if (require.main === module) {
  console.log(`\n[bri-s2.3] Results (T1/T2 so far): ${passed} passed, ${failed} failed`);
}
```

- [ ] **Step 2: Run test — expect PASS (regression guard, not new behaviour)**

```bash
node tests/check-bri-s2.3-upstash-staging-instance.js
```

Expected output: `[PASS]` for all 3 assertions above (T1 x2, T2 x1), `0 failed` reported once Task 2's runner section is appended (this task alone only defines `test()`/exports — full summary line comes after Task 2 appends T3 and the final summary block, per Step 3 below).

- [ ] **Step 3: Commit**

```bash
git add tests/check-bri-s2.3-upstash-staging-instance.js
git commit -m "test(bri-s2.3): add T1/T2 regression guards for Upstash env-var-only credentials"
```

---

## Task 2: T3 — module-reload credential-bleed guard + final summary/exit

**Files:**
- Modify: `tests/check-bri-s2.3-upstash-staging-instance.js` (append T3 and the final summary/exit block)

- [ ] **Step 1: Write the failing test (structural placeholder — see note)**

Same "not TDD-red in the strict sense" note as Task 1 applies — `session-redis.js`'s existing lazy-singleton pattern already supports correct behaviour on `require.cache` reload. This test guards against a future regression.

Append to `tests/check-bri-s2.3-upstash-staging-instance.js` (replace the closing `module.exports`/`if (require.main === module)` block from Task 1 with this):

```javascript
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

    await test('T3: client built under config A uses config A url/token', () => {
      assert.strictEqual(a.calls.length, 1, `expected exactly 1 client construction, got ${a.calls.length}`);
      assert.strictEqual(a.calls[0].url, 'https://config-a.upstash.io');
      assert.strictEqual(a.calls[0].token, 'token-a');
    });

    // Reload under config B -- module-level _client must reset (fresh require.cache entry)
    process.env.UPSTASH_REDIS_REST_URL = 'https://config-b.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token-b';
    const b = loadSessionRedisWithMockedClient();
    await b.mod.writeSession('probe-b', { foo: 'baz' });

    await test('T3: after reload, a NEW client is built under config B -- no bleed-through from config A', () => {
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
```

- [ ] **Step 2: Run test — must pass**

```bash
node tests/check-bri-s2.3-upstash-staging-instance.js
```

Expected output: `[bri-s2.3] Results: 5 passed, 0 failed` (T1 x2, T2 x1, T3 x2), exit code 0.

- [ ] **Step 3: Register in package.json's test chain**

Add `&& node tests/check-bri-s2.3-upstash-staging-instance.js` to the end of `scripts.test` in `package.json`.

- [ ] **Step 4: Run full suite — no NEW regressions vs pre-existing baseline**

```bash
bash run-baseline-test-continue.sh
```

Expected output: the new script's line reports `EXIT:0`; all previously-passing scripts still report `EXIT:0`; the same pre-existing failure set from the baseline note (24 `check-pipeline-state-integrity.js` C3 items, ~36 other pre-existing script failures unrelated to Upstash/Redis) is unchanged in membership.

- [ ] **Step 5: Commit**

```bash
git add tests/check-bri-s2.3-upstash-staging-instance.js package.json
git commit -m "test(bri-s2.3): add T3 module-reload credential-bleed guard; register test in npm test chain"
```

---
