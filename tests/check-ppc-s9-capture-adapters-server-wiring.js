'use strict';
// tests/check-ppc-s9-capture-adapters-server-wiring.js -- ppc-s9 (D37 rule 3
// wiring verification, final cross-task review finding). Confirms
// src/web-ui/server.js genuinely wires capture-nonce-store.js's and
// capture-dispatch-adapter.js's REAL implementations, not just that a
// set*Adapter() reference was assigned somewhere -- per D37 rule 4
// (CLAUDE.md), the assertion must be an observable, differentiating outcome:
// the D37 stub throws "Adapter not wired: ..." unconditionally; each real
// implementation throws its OWN distinct, adapter-specific error when its
// own required config is missing (Redis env vars / PLATFORM_* env vars).
// Two different, individually-correct error shapes prove the wiring reaches
// the real code, not the stub -- this is as deep as D37 compliance can be
// verified without a real Redis instance or a real GitHub API token.
//
// Requires server.js fresh with WIRE_CAPTURE_ADAPTERS=true (mirrors the
// existing WIRE_SKILL_ADAPTERS escape hatch server.js already uses for the
// skills adapters) so the real wiring closure runs while NODE_ENV stays
// 'test' -- changing NODE_ENV itself would also flip server.js's own
// test-mode DB bootstrap branch, which this test has no need to disturb.

process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
delete process.env.POSTHOG_KEY;
delete process.env.DATABASE_URL;

var assert = require('assert');
var passed = 0; var failed = 0; var failures = [];
function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve();
  }
}
var queue = [];

function freshRequireServerWithRealWiring() {
  delete require.cache[require.resolve('../src/web-ui/server')];
  delete require.cache[require.resolve('../src/web-ui/adapters/capture-nonce-store')];
  delete require.cache[require.resolve('../src/web-ui/adapters/capture-dispatch-adapter')];
  var savedFlag = process.env.WIRE_CAPTURE_ADAPTERS;
  process.env.WIRE_CAPTURE_ADAPTERS = 'true';
  try {
    require('../src/web-ui/server');
  } finally {
    if (savedFlag === undefined) delete process.env.WIRE_CAPTURE_ADAPTERS;
    else process.env.WIRE_CAPTURE_ADAPTERS = savedFlag;
  }
}

queue.push(function() {
  return test('server.js wires the REAL nonce-store adapter, not the D37 stub -- distinct error shape proves it', async function() {
    freshRequireServerWithRealWiring();
    var nonceStore = require('../src/web-ui/adapters/capture-nonce-store');

    var savedUrl = process.env.UPSTASH_REDIS_REST_URL;
    var savedToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    var thrown = null;
    try {
      await nonceStore.issueNonce('some-session-id');
    } catch (err) {
      thrown = err;
    } finally {
      if (savedUrl !== undefined) process.env.UPSTASH_REDIS_REST_URL = savedUrl;
      if (savedToken !== undefined) process.env.UPSTASH_REDIS_REST_TOKEN = savedToken;
    }

    assert.ok(thrown, 'must throw (no Redis configured)');
    assert.ok(!/Adapter not wired/i.test(thrown.message), 'must NOT be the D37 stub error -- that would mean the real adapter was never wired');
    assert.ok(/Redis not configured/i.test(thrown.message), 'must be the REAL adapter\'s own distinct error -- proving server.js wired realNonceStoreAdapter, not the stub');
  });
});

queue.push(function() {
  return test('server.js wires the REAL capture-dispatch adapter, not the D37 stub -- distinct error shape proves it', async function() {
    freshRequireServerWithRealWiring();
    var captureDispatchAdapter = require('../src/web-ui/adapters/capture-dispatch-adapter');

    var savedVars = {
      PLATFORM_GITHUB_TOKEN: process.env.PLATFORM_GITHUB_TOKEN,
      PLATFORM_REPO_OWNER: process.env.PLATFORM_REPO_OWNER,
      PLATFORM_REPO_NAME: process.env.PLATFORM_REPO_NAME,
      PLATFORM_CAPTURE_WORKFLOW_ID: process.env.PLATFORM_CAPTURE_WORKFLOW_ID
    };
    Object.keys(savedVars).forEach(function(k) { delete process.env[k]; });

    var thrown = null;
    try {
      await captureDispatchAdapter.dispatchCaptureWorkflow({
        nonce: 'n', baseUrl: 'b', featureSlug: 'f', acIds: [], targets: [], correlationId: 'c'
      });
    } catch (err) {
      thrown = err;
    } finally {
      Object.keys(savedVars).forEach(function(k) { if (savedVars[k] !== undefined) process.env[k] = savedVars[k]; });
    }

    assert.ok(thrown, 'must throw (no PLATFORM_* config)');
    assert.ok(!/Adapter not wired/i.test(thrown.message), 'must NOT be the D37 stub error -- that would mean the real adapter was never wired');
    assert.ok(/PLATFORM_GITHUB_TOKEN/i.test(thrown.message), 'must be the REAL adapter\'s own distinct fail-closed error -- proving server.js wired realDispatchCaptureWorkflow, not the stub');
  });
});

queue.push(function() {
  return test('without WIRE_CAPTURE_ADAPTERS, requiring server.js under NODE_ENV=test leaves the D37 stub active (control case)', async function() {
    delete require.cache[require.resolve('../src/web-ui/server')];
    delete require.cache[require.resolve('../src/web-ui/adapters/capture-nonce-store')];
    require('../src/web-ui/server');
    var nonceStore = require('../src/web-ui/adapters/capture-nonce-store');

    var thrown = null;
    try {
      await nonceStore.issueNonce('some-session-id');
    } catch (err) {
      thrown = err;
    }

    assert.ok(thrown, 'must throw');
    assert.ok(/Adapter not wired/i.test(thrown.message), 'under plain NODE_ENV=test (no escape hatch), the stub must still be active -- confirms the other two tests above are genuinely exercising the real wiring path, not something that is always true regardless');
  });
});

(async function() {
  console.log('\ncheck-ppc-s9-capture-adapters-server-wiring.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
