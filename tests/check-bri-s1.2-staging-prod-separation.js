'use strict';
// check-bri-s1.2-staging-prod-separation.js — AC verification for bri-s1.2
// (env-driven PostHog staging/prod project separation — resolvePostHogApiKey()
// pure function + initPostHogFlagsClient() server-startup wiring helper)

var assert = require('assert');
var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  [PASS]', name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err); }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

var modulePath = require.resolve('../src/web-ui/modules/posthog-config');

function freshConfig() {
  delete require.cache[modulePath];
  return require('../src/web-ui/modules/posthog-config');
}

async function main() {
  var queue = [];

  // ── AC1 — staging environment uses the staging key exclusively ─────────────

  queue.push(function() {
    console.log('\n[bri-s1.2] A1 -- resolvePostHogApiKey(staging) returns staging key exactly (AC1)');
    return test('A1: resolvePostHogApiKey(\'staging\', {...}) returns phc_test_staging', function() {
      var cfg = freshConfig();
      var result = cfg.resolvePostHogApiKey('staging', { POSTHOG_KEY_STAGING: 'phc_test_staging', POSTHOG_KEY_PROD: 'phc_test_prod' });
      assert.strictEqual(result, 'phc_test_staging', 'Expected staging key to be returned exactly');
    });
  });

  // ── AC2 — production environment uses the prod key exclusively ─────────────

  queue.push(function() {
    console.log('\n[bri-s1.2] A2 -- resolvePostHogApiKey(production) returns prod key exactly (AC2)');
    return test('A2: resolvePostHogApiKey(\'production\', {...}) returns phc_test_prod', function() {
      var cfg = freshConfig();
      var result = cfg.resolvePostHogApiKey('production', { POSTHOG_KEY_STAGING: 'phc_test_staging', POSTHOG_KEY_PROD: 'phc_test_prod' });
      assert.strictEqual(result, 'phc_test_prod', 'Expected prod key to be returned exactly');
    });
  });

  // ── AC3 — both keys present, staging still wins, never the prod value ──────

  queue.push(function() {
    console.log('\n[bri-s1.2] A3 -- staging never returns prod key even when both are present (AC3)');
    return test('A3: resolvePostHogApiKey(\'staging\', {both keys}) strictly not-equal to prod value', function() {
      var cfg = freshConfig();
      var result = cfg.resolvePostHogApiKey('staging', { POSTHOG_KEY_STAGING: 'phc_test_staging', POSTHOG_KEY_PROD: 'phc_test_prod' });
      assert.strictEqual(result, 'phc_test_staging');
      assert.notStrictEqual(result, 'phc_test_prod', 'Must never equal the prod key even though both were present');
    });
  });

  // ── AC4 — missing staging key: clear error naming the missing var, no fallback ──

  queue.push(function() {
    console.log('\n[bri-s1.2] A4 -- missing POSTHOG_KEY_STAGING throws naming the specific missing var (AC4)');
    return test('A4: resolvePostHogApiKey(\'staging\', {only prod key}) throws naming POSTHOG_KEY_STAGING', function() {
      var cfg = freshConfig();
      assert.throws(
        function() { cfg.resolvePostHogApiKey('staging', { POSTHOG_KEY_PROD: 'phc_test_prod' }); },
        function(err) {
          assert.ok(err.message.indexOf('POSTHOG_KEY_STAGING') !== -1, 'error message must name POSTHOG_KEY_STAGING specifically');
          return true;
        }
      );
    });
  });

  queue.push(function() {
    console.log('\n[bri-s1.2] A5 -- missing-staging-key result independently never equals/contains the prod key value (AC4)');
    return test('A5: missing-staging-key condition never surfaces the prod key value under any path', function() {
      var cfg = freshConfig();
      var sawProdValue = false;
      try {
        var r = cfg.resolvePostHogApiKey('staging', { POSTHOG_KEY_PROD: 'phc_test_prod' });
        sawProdValue = (r === 'phc_test_prod');
      } catch (err) {
        sawProdValue = (err.message.indexOf('phc_test_prod') !== -1);
      }
      assert.strictEqual(sawProdValue, false, 'Must never surface the prod key value on a missing-staging-key condition');
    });
  });

  // ── Also cover the mirrored missing-prod-key case for completeness ─────────

  queue.push(function() {
    console.log('\n[bri-s1.2] A6 -- missing POSTHOG_KEY_PROD throws naming the specific missing var (mirrors AC4)');
    return test('A6: resolvePostHogApiKey(\'production\', {only staging key}) throws naming POSTHOG_KEY_PROD', function() {
      var cfg = freshConfig();
      assert.throws(
        function() { cfg.resolvePostHogApiKey('production', { POSTHOG_KEY_STAGING: 'phc_test_staging' }); },
        function(err) {
          assert.ok(err.message.indexOf('POSTHOG_KEY_PROD') !== -1, 'error message must name POSTHOG_KEY_PROD specifically');
          return true;
        }
      );
    });
  });

  // ── Security NFR — resolved key for a given env never equals the other env's key ──

  queue.push(function() {
    console.log('\n[bri-s1.2] N1 -- resolved key never carries both staging and prod values simultaneously (Security NFR)');
    return test('N1: resolvePostHogApiKey results for staging vs production are never equal', function() {
      var cfg = freshConfig();
      var staging = cfg.resolvePostHogApiKey('staging', { POSTHOG_KEY_STAGING: 'phc_test_staging', POSTHOG_KEY_PROD: 'phc_test_prod' });
      var production = cfg.resolvePostHogApiKey('production', { POSTHOG_KEY_STAGING: 'phc_test_staging', POSTHOG_KEY_PROD: 'phc_test_prod' });
      assert.notStrictEqual(staging, production, 'A single resolved value must never equal the other environment\'s key');
      assert.strictEqual(typeof staging, 'string');
      assert.strictEqual(typeof production, 'string');
    });
  });

  // ── AC1 integration — server startup wiring constructs client with staging key ──

  queue.push(function() {
    console.log('\n[bri-s1.2] I1 -- initPostHogFlagsClient(staging) constructs PostHog client with staging key only (AC1 integration)');
    return test('I1: initPostHogFlagsClient(\'staging\', envVars, deps) constructs client with staging key exactly once', function() {
      var cfg = freshConfig();
      var ctorCalls = [];
      function FakePostHogCtor(key, opts) { ctorCalls.push({ key: key, opts: opts }); }
      var setAdapterCalls = [];
      var result = cfg.initPostHogFlagsClient(
        'staging',
        { POSTHOG_KEY_STAGING: 'phc_test_staging', POSTHOG_KEY_PROD: 'phc_test_prod' },
        {
          PostHogClient: FakePostHogCtor,
          setPostHogFlagsAdapter: function(a) { setAdapterCalls.push(a); },
          logger: { info: function() {}, error: function() {} }
        }
      );
      assert.strictEqual(ctorCalls.length, 1, 'PostHog client constructor must be called exactly once');
      assert.strictEqual(ctorCalls[0].key, 'phc_test_staging', 'constructor must receive the staging key');
      assert.strictEqual(result.wired, true);
      assert.strictEqual(setAdapterCalls.length, 1, 'setPostHogFlagsAdapter must be called exactly once');
      assert.strictEqual(typeof setAdapterCalls[0].evaluateFlag, 'function', 'wired adapter must expose evaluateFlag');
    });
  });

  // ── AC2 integration — server startup wiring constructs client with prod key ──

  queue.push(function() {
    console.log('\n[bri-s1.2] I2 -- initPostHogFlagsClient(production) constructs PostHog client with prod key only (AC2 integration)');
    return test('I2: initPostHogFlagsClient(\'production\', envVars, deps) constructs client with prod key exactly once', function() {
      var cfg = freshConfig();
      var ctorCalls = [];
      function FakePostHogCtor(key) { ctorCalls.push(key); }
      var result = cfg.initPostHogFlagsClient(
        'production',
        { POSTHOG_KEY_STAGING: 'phc_test_staging', POSTHOG_KEY_PROD: 'phc_test_prod' },
        { PostHogClient: FakePostHogCtor, setPostHogFlagsAdapter: function() {}, logger: { info: function() {}, error: function() {} } }
      );
      assert.strictEqual(ctorCalls.length, 1, 'PostHog client constructor must be called exactly once');
      assert.strictEqual(ctorCalls[0], 'phc_test_prod', 'constructor must receive the prod key');
      assert.strictEqual(result.wired, true);
    });
  });

  // ── AC4 integration — missing key logs, does not crash, no client constructed ──

  queue.push(function() {
    console.log('\n[bri-s1.2] I3 -- missing staging key logs identifying error, no crash, no client constructed (AC4 integration)');
    return test('I3: initPostHogFlagsClient(\'staging\', {no staging key}, deps) never constructs a client', function() {
      var cfg = freshConfig();
      var ctorCalls = [];
      function FakePostHogCtor(key) { ctorCalls.push(key); }
      var errorLines = [];
      var result;
      assert.doesNotThrow(function() {
        result = cfg.initPostHogFlagsClient(
          'staging',
          { POSTHOG_KEY_PROD: 'phc_test_prod' },
          { PostHogClient: FakePostHogCtor, setPostHogFlagsAdapter: function() {}, logger: { info: function() {}, error: function(m) { errorLines.push(m); } } }
        );
      }, 'initPostHogFlagsClient must never throw / crash the process on a missing key');
      assert.strictEqual(ctorCalls.length, 0, 'PostHog client must never be constructed on a missing-key condition');
      assert.strictEqual(result.wired, false);
      assert.ok(errorLines.some(function(l) { return l.indexOf('POSTHOG_KEY_STAGING') !== -1; }), 'logged error must name POSTHOG_KEY_STAGING');
    });
  });

  // ── Audit NFR — startup log records the project, never the raw key value ───

  queue.push(function() {
    console.log('\n[bri-s1.2] N2 -- success-path log line names the project but never the key value (Audit NFR)');
    return test('N2: success-path logger.info output contains "staging" but never the raw key', function() {
      var cfg = freshConfig();
      var logLines = [];
      function FakePostHogCtor() {}
      cfg.initPostHogFlagsClient(
        'staging',
        { POSTHOG_KEY_STAGING: 'phc_test_staging_SECRET' },
        { PostHogClient: FakePostHogCtor, setPostHogFlagsAdapter: function() {}, logger: { info: function(m) { logLines.push(m); }, error: function(m) { logLines.push(m); } } }
      );
      var joined = logLines.join(' | ');
      assert.ok(joined.indexOf('staging') !== -1, 'log must name the active project (staging)');
      assert.ok(joined.indexOf('phc_test_staging_SECRET') === -1, 'log must never contain the raw key value');
    });
  });

  queue.push(function() {
    console.log('\n[bri-s1.2] N3 -- error-path log line never contains a key value (Audit NFR)');
    return test('N3: missing-key logger.error output never contains a raw key value', function() {
      var cfg = freshConfig();
      var logLines = [];
      function FakePostHogCtor() {}
      cfg.initPostHogFlagsClient(
        'staging',
        { POSTHOG_KEY_PROD: 'phc_test_prod_SECRET' },
        { PostHogClient: FakePostHogCtor, setPostHogFlagsAdapter: function() {}, logger: { info: function(m) { logLines.push(m); }, error: function(m) { logLines.push(m); } } }
      );
      var joined = logLines.join(' | ');
      assert.ok(joined.indexOf('phc_test_prod_SECRET') === -1, 'error log must never contain a raw key value');
    });
  });

  // ── Run queue sequentially ────────────────────────────────────────────────

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[bri-s1.2] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[bri-s1.2] Unexpected error:', err);
  process.exit(1);
});
