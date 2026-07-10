# Separate staging and prod PostHog projects with isolated API keys — Implementation Plan

> **For agent execution:** Executed directly with /tdd discipline per task in this session (no subagent fan-out — story complexity is rated 1, single-session execution is appropriate per /subagent-execution's fallback note).

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/bri-s1.2`
**Worktree:** `.worktrees/bri-s1.2`
**Test command:** `node tests/check-bri-s1.2-staging-prod-separation.js` (targeted); full suite command noted in Task 2 has a pre-existing environment caveat — see Notes.

---

## File map

```
Create:
  src/web-ui/modules/posthog-config.js              — resolvePostHogApiKey() pure function + initPostHogFlagsClient() startup wiring helper
  tests/check-bri-s1.2-staging-prod-separation.js   — AC1-AC4 unit + integration + NFR tests

Modify:
  src/web-ui/server.js   — call initPostHogFlagsClient() at startup (gated like other adapter wiring, NODE_ENV !== 'test')
  package.json            — register the new test file in scripts.test
```

---

## Task 1: `resolvePostHogApiKey()` — pure environment-to-key resolution (AC1, AC2, AC3, AC4, Security NFR)

**Files:**
- Create: `src/web-ui/modules/posthog-config.js`
- Test: `tests/check-bri-s1.2-staging-prod-separation.js`

- [x] **Step 1: Write the failing tests**

```js
// A1 — AC1: staging env returns staging key
test('A1: resolvePostHogApiKey(staging) returns staging key exactly', function() {
  var cfg = freshConfig();
  var result = cfg.resolvePostHogApiKey('staging', { POSTHOG_KEY_STAGING: 'phc_test_staging', POSTHOG_KEY_PROD: 'phc_test_prod' });
  assert.strictEqual(result, 'phc_test_staging');
});

// A2 — AC2: production env returns prod key
test('A2: resolvePostHogApiKey(production) returns prod key exactly', function() {
  var cfg = freshConfig();
  var result = cfg.resolvePostHogApiKey('production', { POSTHOG_KEY_STAGING: 'phc_test_staging', POSTHOG_KEY_PROD: 'phc_test_prod' });
  assert.strictEqual(result, 'phc_test_prod');
});

// A3 — AC3: both keys present, staging still wins, never equals prod
test('A3: staging never returns prod key even when both are present', function() {
  var cfg = freshConfig();
  var result = cfg.resolvePostHogApiKey('staging', { POSTHOG_KEY_STAGING: 'phc_test_staging', POSTHOG_KEY_PROD: 'phc_test_prod' });
  assert.strictEqual(result, 'phc_test_staging');
  assert.notStrictEqual(result, 'phc_test_prod');
});

// A4 — AC4: missing staging key throws, names the missing var, never falls back
test('A4: missing POSTHOG_KEY_STAGING throws naming the specific missing var', function() {
  var cfg = freshConfig();
  assert.throws(function() {
    cfg.resolvePostHogApiKey('staging', { POSTHOG_KEY_PROD: 'phc_test_prod' });
  }, function(err) {
    assert.ok(err.message.indexOf('POSTHOG_KEY_STAGING') !== -1, 'error must name POSTHOG_KEY_STAGING');
    return true;
  });
});

// A5 — AC4 (independent check): thrown/returned result never equals the prod key
test('A5: missing-staging-key result is never the prod key value, independent of message wording', function() {
  var cfg = freshConfig();
  var threwProdValue = false;
  try {
    var r = cfg.resolvePostHogApiKey('staging', { POSTHOG_KEY_PROD: 'phc_test_prod' });
    threwProdValue = (r === 'phc_test_prod');
  } catch (err) {
    threwProdValue = (err.message.indexOf('phc_test_prod') !== -1);
  }
  assert.strictEqual(threwProdValue, false, 'must never surface the prod key value on a missing-staging-key condition');
});

// N1 — Security NFR: resolved value never carries both keys
test('N1: resolved key for a given env never equals the other env key', function() {
  var cfg = freshConfig();
  var staging = cfg.resolvePostHogApiKey('staging', { POSTHOG_KEY_STAGING: 'phc_test_staging', POSTHOG_KEY_PROD: 'phc_test_prod' });
  var prod = cfg.resolvePostHogApiKey('production', { POSTHOG_KEY_STAGING: 'phc_test_staging', POSTHOG_KEY_PROD: 'phc_test_prod' });
  assert.notStrictEqual(staging, prod);
});
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-bri-s1.2-staging-prod-separation.js
```

Expected output: `Cannot find module '../src/web-ui/modules/posthog-config'` (module does not exist yet)

- [x] **Step 3: Write minimal implementation**

```js
'use strict';

// posthog-config.js — bri-s1.2: env-driven PostHog project/key resolution.
// resolvePostHogApiKey() never returns the non-active environment's key, even
// when both are present in the input env vars (AC3) — and throws, naming the
// specific missing variable, rather than silently falling back (AC4).

function resolvePostHogApiKey(envName, envVars) {
  envVars = envVars || {};
  if (envName === 'staging') {
    var stagingKey = envVars.POSTHOG_KEY_STAGING;
    if (!stagingKey) {
      throw new Error('PostHog config error: POSTHOG_KEY_STAGING is missing or empty. The staging environment requires POSTHOG_KEY_STAGING to be set — refusing to fall back to the production key.');
    }
    return stagingKey;
  }
  if (envName === 'production') {
    var prodKey = envVars.POSTHOG_KEY_PROD;
    if (!prodKey) {
      throw new Error('PostHog config error: POSTHOG_KEY_PROD is missing or empty. The production environment requires POSTHOG_KEY_PROD to be set.');
    }
    return prodKey;
  }
  throw new Error('PostHog config error: unrecognized environment "' + envName + '" — expected "staging" or "production".');
}

module.exports = { resolvePostHogApiKey };
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-bri-s1.2-staging-prod-separation.js
```

Expected output: `PASS` for A1-A5, N1

- [x] **Step 5: Run full suite — no regressions**

See Task 2 Step 5 (combined regression run after both tasks land).

- [x] **Step 6: Commit**

```bash
git add src/web-ui/modules/posthog-config.js tests/check-bri-s1.2-staging-prod-separation.js
git commit -m "feat(bri-s1.2): add resolvePostHogApiKey env-driven key resolution"
```

---

## Task 2: Server startup wiring — `initPostHogFlagsClient()` (AC1, AC2, AC4 integration; Audit NFR)

**Files:**
- Modify: `src/web-ui/modules/posthog-config.js` (add `initPostHogFlagsClient`)
- Modify: `src/web-ui/server.js`
- Test: `tests/check-bri-s1.2-staging-prod-separation.js` (append integration + NFR tests)

D37 note: this story does not introduce a *new* injectable adapter (the adapter contract — `setPostHogFlagsAdapter` / `evaluateFlag` — already exists from bri-s1.1 with a throwing stub default). This task is the wiring of a *real* implementation into `server.js`, which is exactly the separate wiring task D37 requires — it is intentionally split from Task 1's pure-function handler work.

- [x] **Step 1: Write the failing tests**

```js
// I1 — AC1 integration: staging env wires client with staging key, never prod
test('I1: initPostHogFlagsClient(staging) constructs PostHog client with staging key only', function() {
  var cfg = freshConfig();
  var calls = [];
  function FakePostHogCtor(key, opts) { calls.push({ key: key, opts: opts }); this.key = key; }
  var setAdapterCalls = [];
  var logLines = [];
  var result = cfg.initPostHogFlagsClient('staging',
    { POSTHOG_KEY_STAGING: 'phc_test_staging', POSTHOG_KEY_PROD: 'phc_test_prod' },
    {
      PostHogClient: FakePostHogCtor,
      setPostHogFlagsAdapter: function(a) { setAdapterCalls.push(a); },
      logger: { info: function(m) { logLines.push(m); }, error: function(m) { logLines.push(m); } }
    }
  );
  assert.strictEqual(calls.length, 1, 'PostHog client constructor must be called exactly once');
  assert.strictEqual(calls[0].key, 'phc_test_staging', 'constructor must receive the staging key');
  assert.strictEqual(result.wired, true);
  assert.strictEqual(setAdapterCalls.length, 1, 'setPostHogFlagsAdapter must be called exactly once');
});

// I2 — AC2 integration: production env wires client with prod key, never staging
test('I2: initPostHogFlagsClient(production) constructs PostHog client with prod key only', function() {
  var cfg = freshConfig();
  var calls = [];
  function FakePostHogCtor(key) { calls.push(key); }
  var result = cfg.initPostHogFlagsClient('production',
    { POSTHOG_KEY_STAGING: 'phc_test_staging', POSTHOG_KEY_PROD: 'phc_test_prod' },
    { PostHogClient: FakePostHogCtor, setPostHogFlagsAdapter: function() {}, logger: { info: function() {}, error: function() {} } }
  );
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0], 'phc_test_prod');
  assert.strictEqual(result.wired, true);
});

// I3 — AC4 integration: missing staging key logs, does not crash, does not construct a client
test('I3: missing staging key logs identifying error, does not crash, no client constructed', function() {
  var cfg = freshConfig();
  var calls = [];
  function FakePostHogCtor(key) { calls.push(key); }
  var errorLines = [];
  var result = cfg.initPostHogFlagsClient('staging',
    { POSTHOG_KEY_PROD: 'phc_test_prod' },
    { PostHogClient: FakePostHogCtor, setPostHogFlagsAdapter: function() {}, logger: { info: function() {}, error: function(m) { errorLines.push(m); } } }
  );
  assert.strictEqual(calls.length, 0, 'PostHog client must never be constructed on a missing-key condition');
  assert.strictEqual(result.wired, false);
  assert.ok(errorLines.some(function(l) { return l.indexOf('POSTHOG_KEY_STAGING') !== -1; }), 'logged error must name POSTHOG_KEY_STAGING');
});

// N2 — Audit NFR: startup log never contains the raw key value (success path)
test('N2: success-path log line names the project but never the key value', function() {
  var cfg = freshConfig();
  var logLines = [];
  function FakePostHogCtor() {}
  cfg.initPostHogFlagsClient('staging',
    { POSTHOG_KEY_STAGING: 'phc_test_staging_SECRET' },
    { PostHogClient: FakePostHogCtor, setPostHogFlagsAdapter: function() {}, logger: { info: function(m) { logLines.push(m); }, error: function(m) { logLines.push(m); } } }
  );
  var joined = logLines.join(' | ');
  assert.ok(joined.indexOf('staging') !== -1, 'log must name the active project (staging)');
  assert.ok(joined.indexOf('phc_test_staging_SECRET') === -1, 'log must never contain the raw key value');
});

// N3 — Audit NFR: startup log never contains the raw key value (missing-key error path)
test('N3: error-path log line never contains a key value', function() {
  var cfg = freshConfig();
  var logLines = [];
  function FakePostHogCtor() {}
  cfg.initPostHogFlagsClient('staging',
    { POSTHOG_KEY_PROD: 'phc_test_prod_SECRET' },
    { PostHogClient: FakePostHogCtor, setPostHogFlagsAdapter: function() {}, logger: { info: function(m) { logLines.push(m); }, error: function(m) { logLines.push(m); } } }
  );
  var joined = logLines.join(' | ');
  assert.ok(joined.indexOf('phc_test_prod_SECRET') === -1, 'error log must never contain a raw key value');
});
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-bri-s1.2-staging-prod-separation.js
```

Expected output: `TypeError: cfg.initPostHogFlagsClient is not a function`

- [x] **Step 3: Write minimal implementation**

```js
// Appended to src/web-ui/modules/posthog-config.js

/**
 * Wire the real PostHog flags client into the S1.1 adapter contract at startup.
 * Resolves the environment-appropriate key, constructs a PostHog client with it,
 * and calls setPostHogFlagsAdapter() with a real evaluateFlag() implementation.
 * Never throws — a missing/misconfigured key logs a clear, key-value-free error
 * and returns { wired: false } rather than crashing the process (AC4).
 *
 * @param {string} envName - 'staging' or 'production'
 * @param {object} envVars - process.env (or an equivalent map) — injected for testability
 * @param {object} [deps] - { PostHogClient, setPostHogFlagsAdapter, logger } — all injected for testability
 * @returns {{ wired: boolean, project?: string, error?: Error }}
 */
function initPostHogFlagsClient(envName, envVars, deps) {
  deps = deps || {};
  var log = deps.logger || console;
  var PostHogClientCtor = deps.PostHogClient;
  var setAdapter = deps.setPostHogFlagsAdapter;

  var key;
  try {
    key = resolvePostHogApiKey(envName, envVars);
  } catch (err) {
    log.error('[posthog-config] ' + err.message);
    return { wired: false, error: err };
  }

  if (!PostHogClientCtor) {
    PostHogClientCtor = require('posthog-node').PostHog;
  }

  var client = new PostHogClientCtor(key, { host: 'https://us.i.posthog.com' });

  if (typeof setAdapter === 'function') {
    setAdapter({
      evaluateFlag: function(flagKey, context) {
        var distinctId = (context && context.tenantId) || 'anonymous';
        return client.isFeatureEnabled(flagKey, distinctId, { groups: context && context.groups });
      }
    });
  }

  log.info('[posthog-config] PostHog flags client wired to the ' + envName + ' project');
  return { wired: true, project: envName };
}

module.exports = { resolvePostHogApiKey: resolvePostHogApiKey, initPostHogFlagsClient: initPostHogFlagsClient };
```

```js
// src/web-ui/server.js — add near the other D37 wiring blocks (alongside setGoogleUserInfoAdapter etc.)

const { setPostHogFlagsAdapter } = require('./modules/posthog-flags');           // bri-s1.1
const { initPostHogFlagsClient } = require('./modules/posthog-config');          // bri-s1.2

// bri-s1.2 — wire the real PostHog flags client using the env-appropriate key.
// Never active under NODE_ENV=test (consistent with the other adapter-wiring blocks
// in this file); a missing/misconfigured key logs and does not crash the process.
if (process.env.NODE_ENV !== 'test') {
  const _postHogEnvName = process.env.NODE_ENV === 'staging' ? 'staging' : 'production';
  initPostHogFlagsClient(_postHogEnvName, process.env, {
    setPostHogFlagsAdapter: setPostHogFlagsAdapter,
    logger: console
  });
}
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-bri-s1.2-staging-prod-separation.js
```

Expected output: `PASS` for I1-I3, N2-N3; full file result line `[bri-s1.2] Results: 11 passed, 0 failed`

- [x] **Step 5: Run full suite — no regressions**

```bash
node tests/check-bri-s1.2-staging-prod-separation.js
node tests/check-bri-s1.1-isenabled-helper.js
node tests/check-pla-s2-posthog-wiring.js
node -e "require('./src/web-ui/server.js')" # syntax/require sanity check only, does not bind a port under NODE_ENV=test
```

Expected output: all pass, 0 failures. (See Notes below on why the full aggregate `npm test` chain cannot be run end-to-end in this environment — a pre-existing, unrelated gap, not something introduced by this task.)

- [x] **Step 6: Commit**

```bash
git add src/web-ui/modules/posthog-config.js src/web-ui/server.js tests/check-bri-s1.2-staging-prod-separation.js package.json
git commit -m "feat(bri-s1.2): wire PostHog flags client to env-appropriate project at startup"
```

---

## Notes

- `posthog-node` is added as a new runtime dependency. The story's Architecture Constraints explicitly relax the zero-new-npm-dependencies rule for web-ui work (discovery.md Constraints), and the DoR contract's estimated touch points anticipate a real "PostHog SDK client constructor" being mocked in tests — this requires the package to exist as an import target even though all tests inject a fake constructor via dependency injection (never touching the real network).
- The full aggregate `npm test` chain fails on this Windows environment for two pre-existing, unrelated reasons independent of this story: (1) the chained command exceeds the Windows `cmd.exe` command-line length limit when invoked through `npm test`, and (2) even bypassing that by running each check individually, the chain's `check-definition-skill.js` step fails with `FATAL: .github/skills/definition/SKILL.md not found` — confirmed present on `origin/master` before any change in this story. Both are logged in `decisions.md` as acknowledged pre-existing baseline conditions per /branch-setup's Option 2. Verification for this story instead runs the specific test files above individually, plus a scripted full-224-command pass/fail sweep (bypassing the broken `&&` chain and the cmd.exe length limit) to confirm zero new failures beyond the pre-existing baseline.
