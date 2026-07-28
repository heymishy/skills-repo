'use strict';
// tests/check-dsh-s4-evict-skill-session.js -- dsh-s4 Task 2
// Story: artefacts/2026-07-28-durable-session-history/stories/dsh-s4-fix-resume-conversation-link.md
// Test plan: artefacts/2026-07-28-durable-session-history/test-plans/dsh-s4-fix-resume-conversation-link-test-plan.md
// Plan: artefacts/2026-07-28-durable-session-history/plans/dsh-s4-fix-resume-conversation-link-plan.md (Task 2)
//
// Covers:
//   - _evictHtmlSession(sessionId) (routes/skills.js): deletes exactly one
//     entry from the in-memory _sessionStore Map, leaving every other entry
//     untouched.
//   - POST /test/evict-skill-session (server.js): the staging-safe endpoint
//     wrapping _evictHtmlSession, gated by _isTestEndpointAllowed(req) (the
//     same gate as /test/seed-multi-user-roles) -- NOT the plain
//     NODE_ENV==='test' inline check some other seed endpoints use, since
//     this endpoint must also work against real staging via the
//     E2E_STAGING_AUTH_STUB_SECRET bypass-header path (dsh-s4's own E2E spec
//     runs against real deployed staging, not the local ephemeral server).
//
// Testing approach: server.js is a monolithic dispatch file with no
// per-route export for /test/* routes (see
// tests/check-dss-s1-staging-safe-test-endpoint-gate.js and
// tests/check-dsh-s3-seed-durable-stage.js for the established precedent).
// server.js is require()'d exactly ONCE in this process via createApp() +
// a real listening HTTP server (re-requiring it repeatedly is a known hang
// risk -- its DB/Redis-wiring modules leak across re-requires). Gate
// coverage flips process.env.NODE_ENV / E2E_STAGING_AUTH_STUB_SECRET around
// individual requests within the same running server, since
// _isTestEndpointAllowed(req) reads those at call time, not at module load
// -- no child process or re-require needed for that part.

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';

var assert = require('assert');
var http = require('http');

var passed = 0;
var failed = 0;

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}

function postJson(port, urlPath, body, extraHeaders) {
  return new Promise(function(resolve, reject) {
    var payload = JSON.stringify(body || {});
    var headers = Object.assign(
      { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      extraHeaders || {}
    );
    var req = http.request({
      hostname: '127.0.0.1',
      port: port,
      path: urlPath,
      method: 'POST',
      headers: headers
    }, function(res) {
      var chunks = '';
      res.on('data', function(c) { chunks += c; });
      res.on('end', function() {
        var parsed = null;
        try { parsed = JSON.parse(chunks); } catch (_) {}
        resolve({ status: res.statusCode, body: parsed, raw: chunks });
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

(async function main() {
  var fs = require('fs');
  var path = require('path');
  var SERVER_PATH = path.resolve(__dirname, '../src/web-ui/server.js');
  var serverSrc = fs.readFileSync(SERVER_PATH, 'utf8');

  var { createApp, TEST_ENDPOINT_BYPASS_HEADER_NAME } = require('../src/web-ui/server');
  var routesSkills = require('../src/web-ui/routes/skills');

  var server = createApp();
  await new Promise(function(resolve) { server.listen(0, '127.0.0.1', resolve); });
  var port = server.address().port;

  try {

    // ── _evictHtmlSession direct-call coverage ──────────────────────────────
    await test('_evictHtmlSession(sessionId) deletes exactly the named entry from _sessionStore, returns true, and leaves other entries untouched', function() {
      routesSkills._setHtmlSession('dsh-s4-direct-target', { skillName: 'discovery', turns: [] });
      routesSkills._setHtmlSession('dsh-s4-direct-bystander', { skillName: 'discovery', turns: [] });

      assert.ok(routesSkills._getHtmlSession('dsh-s4-direct-target'), 'expected target session to exist before eviction');
      var result = routesSkills._evictHtmlSession('dsh-s4-direct-target');
      assert.strictEqual(result, true, 'expected _evictHtmlSession to return true for an existing key');
      assert.strictEqual(routesSkills._getHtmlSession('dsh-s4-direct-target'), undefined, 'expected target session to be gone after eviction');
      assert.ok(routesSkills._getHtmlSession('dsh-s4-direct-bystander'), 'expected bystander session to remain untouched');
    });

    await test('_evictHtmlSession(sessionId) returns false for a key that was never registered', function() {
      var result = routesSkills._evictHtmlSession('dsh-s4-direct-never-existed');
      assert.strictEqual(result, false, 'expected _evictHtmlSession to return false for a non-existent key');
    });

    // ── POST /test/evict-skill-session HTTP wiring ──────────────────────────
    await test('POST /test/evict-skill-session removes exactly the named session and leaves a different session untouched', async function() {
      routesSkills._setHtmlSession('dsh-s4-evict-target', { skillName: 'discovery', turns: [] });
      routesSkills._setHtmlSession('dsh-s4-evict-bystander', { skillName: 'discovery', turns: [] });

      assert.ok(routesSkills._getHtmlSession('dsh-s4-evict-target'), 'expected the target session to be retrievable before eviction');
      assert.ok(routesSkills._getHtmlSession('dsh-s4-evict-bystander'), 'expected the bystander session to be retrievable before eviction');

      var res = await postJson(port, '/test/evict-skill-session', { sessionId: 'dsh-s4-evict-target' });
      assert.strictEqual(res.status, 200, 'expected 200, got ' + res.status + ' body: ' + res.raw);
      assert.strictEqual(res.body && res.body.evicted, true, 'expected evicted:true in the response body, got: ' + res.raw);

      assert.strictEqual(routesSkills._getHtmlSession('dsh-s4-evict-target'), undefined, 'expected the target session to be gone after eviction');
      assert.ok(routesSkills._getHtmlSession('dsh-s4-evict-bystander'), 'expected the bystander session to remain untouched by eviction');
    });

    await test('POST /test/evict-skill-session for an id that never existed returns 200 with evicted:false, not an error', async function() {
      var res = await postJson(port, '/test/evict-skill-session', { sessionId: 'dsh-s4-evict-never-existed' });
      assert.strictEqual(res.status, 200, 'expected 200, got ' + res.status + ' body: ' + res.raw);
      assert.strictEqual(res.body && res.body.evicted, false, 'expected evicted:false, got: ' + res.raw);
    });

    // ── Gate coverage: _isTestEndpointAllowed(req), not a bare NODE_ENV check ──
    await test('the route is gated by _isTestEndpointAllowed(req), not a plain NODE_ENV==="test" inline check (matches /test/seed-multi-user-roles\' convention, per the implementation plan)', function() {
      var lineMatch = /if \(pathname === '\/test\/evict-skill-session'[^\n]*\)\s*\{/;
      var m = lineMatch.exec(serverSrc);
      assert.ok(m, 'expected to find the route condition line for /test/evict-skill-session');
      assert.ok(m[0].indexOf('_isTestEndpointAllowed(req)') !== -1, 'expected the route to use _isTestEndpointAllowed(req), got: ' + m[0]);
      assert.ok(m[0].indexOf("process.env.NODE_ENV === 'test'") === -1, 'expected the route NOT to use a bare NODE_ENV=test inline check, got: ' + m[0]);
    });

    await test('reachable under the local-harness gate (NODE_ENV=test)', async function() {
      routesSkills._setHtmlSession('dsh-s4-evict-nodeenv-check', { skillName: 'discovery', turns: [] });
      var res = await postJson(port, '/test/evict-skill-session', { sessionId: 'dsh-s4-evict-nodeenv-check' });
      assert.strictEqual(res.status, 200, 'expected NODE_ENV=test to reach the route, got status ' + res.status);
      assert.strictEqual(res.body && res.body.evicted, true, 'expected the eviction to actually occur under NODE_ENV=test, got: ' + res.raw);
    });

    await test('reachable via the staging bypass-secret header even when NODE_ENV is not "test" (the real-staging path this endpoint exists for, per dss-s1\'s gate)', async function() {
      routesSkills._setHtmlSession('dsh-s4-evict-bypass-check', { skillName: 'discovery', turns: [] });

      var origNodeEnv = process.env.NODE_ENV;
      var origSecret = process.env.E2E_STAGING_AUTH_STUB_SECRET;
      process.env.NODE_ENV = 'staging';
      process.env.E2E_STAGING_AUTH_STUB_SECRET = 'dsh-s4-test-bypass-secret';
      try {
        var headers = {};
        headers[TEST_ENDPOINT_BYPASS_HEADER_NAME] = 'dsh-s4-test-bypass-secret';
        var res = await postJson(port, '/test/evict-skill-session', { sessionId: 'dsh-s4-evict-bypass-check' }, headers);
        assert.strictEqual(res.status, 200, 'expected the bypass-secret header to reach the route with NODE_ENV=staging, got status ' + res.status + ' body: ' + res.raw);
        assert.strictEqual(res.body && res.body.evicted, true, 'expected the eviction to actually occur via the bypass path, got: ' + res.raw);
      } finally {
        process.env.NODE_ENV = origNodeEnv;
        if (origSecret === undefined) delete process.env.E2E_STAGING_AUTH_STUB_SECRET; else process.env.E2E_STAGING_AUTH_STUB_SECRET = origSecret;
      }
    });

    await test('NOT reachable when NODE_ENV is not "test" and no matching bypass header is present (gate stays closed by default; request falls through to the unrelated default handler)', async function() {
      routesSkills._setHtmlSession('dsh-s4-evict-should-not-run', { skillName: 'discovery', turns: [] });

      var origNodeEnv = process.env.NODE_ENV;
      var origSecret = process.env.E2E_STAGING_AUTH_STUB_SECRET;
      process.env.NODE_ENV = 'staging';
      delete process.env.E2E_STAGING_AUTH_STUB_SECRET;
      try {
        var res = await postJson(port, '/test/evict-skill-session', { sessionId: 'dsh-s4-evict-should-not-run' });
        // With the gate closed, this route's `if` never matches, so the
        // request falls through to server.js's final unconditional `else`
        // branch (the sign-in page), NOT this endpoint's JSON response --
        // there is no dedicated 404 handler in this dispatcher, so the
        // faithful assertion is "not this endpoint's JSON shape", not a
        // particular status code.
        assert.strictEqual(res.body, null, 'expected the response NOT to be this endpoint\'s JSON body when the gate is closed, got: ' + res.raw);
        assert.ok(routesSkills._getHtmlSession('dsh-s4-evict-should-not-run'), 'expected the session to remain untouched since the gate should have blocked the request');
      } finally {
        process.env.NODE_ENV = origNodeEnv;
        if (origSecret === undefined) delete process.env.E2E_STAGING_AUTH_STUB_SECRET; else process.env.E2E_STAGING_AUTH_STUB_SECRET = origSecret;
      }
    });

  } finally {
    server.close();
    process.env.NODE_ENV = 'test';
  }

  console.log('\n--- dsh-s4 evict-skill-session Results ---');
  console.log('Passed:', passed, ' Failed:', failed);
  process.exit(failed > 0 ? 1 : 0);
})().catch(function(err) {
  console.error('[dsh-s4] Unexpected error:', err && err.stack || err);
  process.exit(1);
});
