'use strict';

// tests/check-dss-s1-staging-safe-test-endpoint-gate.js -- dss-s1
// Story: artefacts/2026-07-25-staging-safe-test-endpoints/stories/dss-s1-staging-safe-test-endpoint-gate.md
// Test plan: artefacts/2026-07-25-staging-safe-test-endpoints/test-plans/dss-s1-test-plan.md
//
// Covers:
//   AC1: secret unset -> unchanged behaviour
//   AC2: secret set + matching header -> allowed
//   AC3: secret set + wrong/absent header -> NOT allowed (same as secret unset)
//   AC7 (structural): the other 4 /test/* routes are untouched -- still
//        NODE_ENV=test-only in the source, never widened
//
// Behavioural coverage of the gate FUNCTIONS themselves (AC1-AC3) uses the
// real exported functions, not a reimplementation. Route-level widening
// (which routes call the new gate vs. which stay untouched) is verified via
// static source-text assertions, matching this codebase's own established
// convention for testing server.js (a monolithic dispatch file with no
// per-route export) -- see tests/check-psh-s1-schema.js,
// tests/check-prc-s2.1-create-repo.js for the same precedent.

process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.NODE_ENV = 'test';

var assert = require('assert');
var path = require('path');
var fs = require('fs');

var passed = 0;
var failed = 0;

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}

var SERVER_PATH = path.resolve(__dirname, '../src/web-ui/server.js');
var serverModule = require(SERVER_PATH);
var serverSrc = fs.readFileSync(SERVER_PATH, 'utf8');

var HEADER = serverModule.TEST_ENDPOINT_BYPASS_HEADER_NAME;
var ENV_VAR = 'E2E_STAGING_AUTH_STUB_SECRET';

(async function() {
  var origSecret = process.env[ENV_VAR];
  var origNodeEnv = process.env.NODE_ENV;

  function withEnv(secret, nodeEnv, fn) {
    if (secret === undefined) delete process.env[ENV_VAR]; else process.env[ENV_VAR] = secret;
    process.env.NODE_ENV = nodeEnv;
    try { return fn(); } finally {
      if (origSecret === undefined) delete process.env[ENV_VAR]; else process.env[ENV_VAR] = origSecret;
      process.env.NODE_ENV = origNodeEnv;
    }
  }

  // ===========================================================================
  // AC1 -- secret unset: unchanged behaviour
  // ===========================================================================
  await test('secret unset + NODE_ENV=staging -> not allowed (AC1)', function() {
    withEnv(undefined, 'staging', function() {
      var req = { headers: {} };
      assert.strictEqual(serverModule._isTestEndpointAllowed(req), false);
    });
  });

  await test('secret unset + NODE_ENV=test -> still allowed, unchanged local-harness behaviour (AC1)', function() {
    withEnv(undefined, 'test', function() {
      var req = { headers: {} };
      assert.strictEqual(serverModule._isTestEndpointAllowed(req), true);
    });
  });

  // ===========================================================================
  // AC2 -- secret set + matching header: allowed
  // ===========================================================================
  await test('secret set + matching header -> allowed (AC2)', function() {
    withEnv('correct-secret-value', 'staging', function() {
      var req = { headers: {} };
      req.headers[HEADER] = 'correct-secret-value';
      assert.strictEqual(serverModule._isTestEndpointAllowed(req), true);
    });
  });

  // ===========================================================================
  // AC3 -- secret set + wrong/absent header: NOT allowed
  // ===========================================================================
  await test('secret set + wrong header value -> NOT allowed (AC3)', function() {
    withEnv('correct-secret-value', 'staging', function() {
      var req = { headers: {} };
      req.headers[HEADER] = 'wrong-value';
      assert.strictEqual(serverModule._isTestEndpointAllowed(req), false);
    });
  });

  await test('secret set + header absent entirely -> NOT allowed (AC3)', function() {
    withEnv('correct-secret-value', 'staging', function() {
      var req = { headers: {} };
      assert.strictEqual(serverModule._isTestEndpointAllowed(req), false);
    });
  });

  await test('secret set + header present but empty string -> NOT allowed (AC3)', function() {
    withEnv('correct-secret-value', 'staging', function() {
      var req = { headers: {} };
      req.headers[HEADER] = '';
      assert.strictEqual(serverModule._isTestEndpointAllowed(req), false);
    });
  });

  await test('_testEndpointBypassSecretConfigured reflects env var presence directly', function() {
    withEnv('x', 'staging', function() {
      assert.strictEqual(serverModule._testEndpointBypassSecretConfigured(), true);
    });
    withEnv(undefined, 'staging', function() {
      assert.strictEqual(serverModule._testEndpointBypassSecretConfigured(), false);
    });
  });

  // ===========================================================================
  // AC7 (structural) -- exactly the 4 named routes were widened; the other 4 were not
  // ===========================================================================
  var widenedRoutes = [
    "pathname === '/test/stripe-call-count'",
    "pathname === '/test/complete-onboarding'",
    "pathname === '/test/real-llm-call-count'",
    "pathname === '/test/seed-multi-user-roles'"
  ];
  var untouchedRoutes = [
    "pathname === '/test/session'",
    "pathname === '/test/seed-definition-session'",
    "pathname === '/test/canvas'",
    "pathname === '/test/seed-board-journey'"
  ];

  widenedRoutes.forEach(function(routeMatch) {
    test('route ' + routeMatch + ' uses the new staging-safe gate, not NODE_ENV=test alone (AC7)', function() {
      var lineMatch = new RegExp('if \\(' + routeMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^\\n]*\\)\\s*\\{');
      var m = lineMatch.exec(serverSrc);
      assert.ok(m, 'expected to find the route condition line for ' + routeMatch);
      assert.ok(m[0].indexOf('_isTestEndpointAllowed(req)') !== -1, 'expected ' + routeMatch + ' to use _isTestEndpointAllowed(req), got: ' + m[0]);
      assert.ok(m[0].indexOf("process.env.NODE_ENV === 'test'") === -1, 'expected ' + routeMatch + ' to no longer use the bare NODE_ENV check, got: ' + m[0]);
    });
  });

  untouchedRoutes.forEach(function(routeMatch) {
    test('route ' + routeMatch + ' remains NODE_ENV=test-only, untouched (AC7)', function() {
      var lineMatch = new RegExp('if \\(' + routeMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^\\n]*\\)\\s*\\{');
      var m = lineMatch.exec(serverSrc);
      assert.ok(m, 'expected to find the route condition line for ' + routeMatch);
      assert.ok(m[0].indexOf("process.env.NODE_ENV === 'test'") !== -1, 'expected ' + routeMatch + ' to still be NODE_ENV=test-only, got: ' + m[0]);
      assert.ok(m[0].indexOf('_isTestEndpointAllowed') === -1, 'expected ' + routeMatch + ' NOT to have been widened, got: ' + m[0]);
    });
  });

  // AC4 -- run in a single, disposable CHILD process (spawnSync + explicit
  // process.exit) rather than deleting/re-requiring server.js's require-cache
  // in THIS process. server.js opens real DB/Redis-adapter resources at
  // module scope; repeatedly re-requiring it in one long-lived process leaks
  // those across each re-require and was observed to hang the whole test
  // file (confirmed during this story's own implementation -- see
  // decisions.md). A child process that explicitly exits sidesteps this
  // entirely and is also a more faithful simulation of "a fresh staging
  // server process starting up".
  await test('counter instrumentation wires global.__BRI_S3_2_REAL_LLM_CALL_COUNT__ even when NODE_ENV is not test, and still forwards real https.request calls (AC4)', function() {
    var script =
      "process.env.SESSION_SECRET = 'test-session-secret-minimum32chars!!';" +
      "process.env.NODE_ENV = 'staging';" +
      "var https = require('https');" +
      "var forwardedTo = null;" +
      // Stub BEFORE requiring server.js, so the module's own `_origHttpsRequest`
      // (captured at require-time) points at THIS stub, not the real transport --
      // proves the wrapper forwards to whatever https.request was bound to when
      // it wired itself, without ever making a real network call.
      "https.request = function(options) { forwardedTo = options; return { on: function(){return this;}, end: function(){}, write: function(){} }; };" +
      "require('" + SERVER_PATH.replace(/\\/g, '\\\\') + "');" +
      "var beforeCount = global.__BRI_S3_2_REAL_LLM_CALL_COUNT__();" +
      "https.request({ hostname: 'api.anthropic.com' });" +
      "var afterCount = global.__BRI_S3_2_REAL_LLM_CALL_COUNT__();" +
      "console.log(JSON.stringify({ wired: typeof global.__BRI_S3_2_REAL_LLM_CALL_COUNT__ === 'function', incremented: afterCount > beforeCount, forwarded: !!forwardedTo }));" +
      "process.exit(0);";
    var result = require('child_process').spawnSync(process.execPath, ['-e', script], { encoding: 'utf8', timeout: 30000 });
    assert.strictEqual(result.status, 0, 'child process should exit cleanly; stderr: ' + result.stderr);
    var lastLine = result.stdout.trim().split('\n').pop();
    var parsed = JSON.parse(lastLine);
    assert.strictEqual(parsed.wired, true, 'expected the counter function to be wired with NODE_ENV=staging');
    assert.strictEqual(parsed.incremented, true, 'expected the counter to increment for an api.anthropic.com call');
    assert.strictEqual(parsed.forwarded, true, 'expected the underlying https.request to still be forwarded');
  });

  console.log('\n[dss-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
