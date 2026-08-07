'use strict';

/**
 * check-amgt-s1-mock-gateway-toggle.js — AC verification for amgt-s1
 * "Let an admin toggle the mock LLM gateway on/off from an in-app admin page"
 *
 * Story:     artefacts/2026-07-24-admin-mock-gateway-toggle/stories/amgt-s1.md
 * Test plan: artefacts/2026-07-24-admin-mock-gateway-toggle/test-plans/amgt-s1-test-plan.md
 *
 * Covers:
 *   AC1 — admin page shows live effective mock-gateway state (not stale/cached)
 *   AC2 — toggle flip takes effect immediately, no restart, reaches the real turn-execution path
 *   AC3 — in-memory only, resets on restart, admin page copy states this honestly
 *   AC4 — production hard-override unaffected by the new runtime toggle
 *   AC5 — requireAdmin gate enforced on both the GET and POST routes
 *   NFR — every toggle flip is logged (admin identity + new state)
 *
 * Run: node tests/check-amgt-s1-mock-gateway-toggle.js
 * Exit 0 if all pass, exit 1 if any fail.
 */

const assert = require('assert');
const path   = require('path');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  [PASS] ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
      );
    }
    passed++; console.log('  [PASS] ' + name);
    return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err));
    return Promise.resolve();
  }
}

const mockGatewayPath   = require.resolve('../src/web-ui/modules/mock-llm-gateway');
const adminRoutePath    = require.resolve('../src/web-ui/routes/admin-mock-gateway');
const requireAdminPath  = require.resolve('../src/web-ui/middleware/require-admin');
const executorPath      = require.resolve('../src/modules/skill-turn-executor');
const httpsPath         = require.resolve('https');
const serverPath        = path.resolve(__dirname, '../src/web-ui/server.js');

const ENV_KEYS = ['NODE_ENV', 'MOCK_LLM_GATEWAY', 'SKILL_EXECUTOR_PROVIDER', 'ANTHROPIC_API_KEY', 'GITHUB_TOKEN'];

function snapshotEnv() {
  const snap = {};
  ENV_KEYS.forEach(function(k) { snap[k] = process.env[k]; });
  return snap;
}
function restoreEnv(snap) {
  ENV_KEYS.forEach(function(k) {
    if (snap[k] === undefined) { delete process.env[k]; } else { process.env[k] = snap[k]; }
  });
}

function freshMockGateway() {
  delete require.cache[mockGatewayPath];
  return require('../src/web-ui/modules/mock-llm-gateway');
}

function freshAdminRoute() {
  delete require.cache[adminRoutePath];
  return require('../src/web-ui/routes/admin-mock-gateway');
}

function freshExecutor() {
  delete require.cache[executorPath];
  return require('../src/modules/skill-turn-executor');
}

function makeRes() {
  const r = { _status: null, _headers: {}, _body: '' };
  r.writeHead = function(s, h) { r._status = s; Object.assign(r._headers, h || {}); };
  r.end = function(b) { r._body += (b || ''); };
  return r;
}

function makePostReq(session, bodyStr) {
  return {
    session: session,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    on: function(event, cb) {
      if (event === 'data') cb(bodyStr);
      if (event === 'end') cb();
    }
  };
}

/** Installs a fake `https` module in require.cache; returns { captured }. */
function installHttpsMock() {
  const captured = [];
  const fakeModule = {
    id: httpsPath, filename: httpsPath, loaded: true,
    exports: {
      Agent: function() { return {}; },
      request: function(opts, cb) {
        captured.push(opts);
        const fakeReq = {
          on: function(ev) { return fakeReq; },
          write: function() {},
          end: function() {
            setImmediate(function() {
              const fakeRes = {
                statusCode: 500,
                on: function(ev, fn) { if (ev === 'end') setImmediate(fn); return fakeRes; }
              };
              if (typeof cb === 'function') cb(fakeRes);
            });
          },
          setTimeout: function() { return fakeReq; },
          destroy: function() {}
        };
        return fakeReq;
      }
    }
  };
  require.cache[httpsPath] = fakeModule;
  return { captured: captured };
}

function uninstallHttpsMock() {
  delete require.cache[httpsPath];
  require('https');
}

async function main() {
  const envSnapshot = snapshotEnv();
  const queue = [];

  // ── AC1: admin page shows live effective mock-gateway state ─────────────────

  queue.push(function() {
    console.log('\n[amgt-s1] AC1 -- admin page reflects live effective state');
    return test('adminToggleReflectsLiveEffectiveState', async function() {
      process.env.NODE_ENV = 'test';
      delete process.env.MOCK_LLM_GATEWAY;
      const mockGateway = freshMockGateway();
      mockGateway.resetRuntimeMockGatewayOverride();
      const route = freshAdminRoute();

      const req = { session: { userId: 1, role: 'admin', login: 'hamish' } };
      const res = makeRes();
      await route.adminMockGatewayGet(req, res);

      assert.strictEqual(res._status, 200, 'Expected 200, got ' + res._status);
      const liveState = mockGateway.isMockGatewayEnabled();
      assert.strictEqual(liveState, true, 'Precondition: NODE_ENV=test must make isMockGatewayEnabled() true');
      assert.ok(res._body.includes('ON (mock fixture responses)'), 'Page must render the current ON state sourced from isMockGatewayEnabled()');

      // Flip the underlying env and re-render with a fresh require -- the page must
      // track the live value, not a value cached from module load time.
      delete process.env.NODE_ENV;
      delete process.env.MOCK_LLM_GATEWAY;
      const res2 = makeRes();
      await route.adminMockGatewayGet(req, res2);
      assert.ok(res2._body.includes('OFF (real model calls)'), 'Page must reflect the new OFF state live, not a stale ON value');
    });
  });

  // ── AC2: toggle flip takes effect immediately (unit) ─────────────────────────

  queue.push(function() {
    console.log('\n[amgt-s1] AC2 -- toggle flip takes effect immediately');
    return test('toggleFlipTakesEffectImmediately', function() {
      process.env.NODE_ENV = 'development';
      delete process.env.MOCK_LLM_GATEWAY;
      const mockGateway = freshMockGateway();
      mockGateway.resetRuntimeMockGatewayOverride();

      assert.strictEqual(mockGateway.isMockGatewayEnabled(), false, 'Precondition: off by default (no NODE_ENV=test, no MOCK_LLM_GATEWAY)');

      mockGateway.setRuntimeMockGatewayOverride(true);
      assert.strictEqual(mockGateway.isMockGatewayEnabled(), true, 'isMockGatewayEnabled() must return the new state immediately, no restart');

      mockGateway.setRuntimeMockGatewayOverride(false);
      assert.strictEqual(mockGateway.isMockGatewayEnabled(), false, 'Flipping back off must also take effect immediately');
    });
  });

  // ── AC3: in-memory only, resets on restart, honest page copy ────────────────

  queue.push(function() {
    console.log('\n[amgt-s1] AC3 -- resets on restart, admin page labels this honestly');
    return test('toggleResetsOnRestartAndPageLabelsThisHonestly', async function() {
      delete process.env.NODE_ENV;
      process.env.MOCK_LLM_GATEWAY = 'false';
      const mockGateway = freshMockGateway();

      mockGateway.setRuntimeMockGatewayOverride(true);
      assert.strictEqual(mockGateway.isMockGatewayEnabled(), true, 'Toggle must be flipped away from the env-var default first');

      // Simulate a process restart via the reset function.
      mockGateway.resetRuntimeMockGatewayOverride();
      assert.strictEqual(mockGateway.getRuntimeMockGatewayOverride(), null, 'Override must be unset after a simulated restart');
      assert.strictEqual(mockGateway.isMockGatewayEnabled(), false, 'Post-restart, only the env-var default (MOCK_LLM_GATEWAY=false) must apply');

      const route = freshAdminRoute();
      const req = { session: { userId: 1, role: 'admin', login: 'hamish' } };
      const res = makeRes();
      await route.adminMockGatewayGet(req, res);
      assert.ok(
        /resets to the configured default on (the )?next server restart or redeploy|resets to the configured default/i.test(res._body),
        'Admin page must contain explicit copy describing the reset-on-restart behaviour'
      );
      assert.ok(res._body.includes('MOCK_LLM_GATEWAY'), 'Admin page copy must name the env var that governs the restart default');
    });
  });

  // ── AC4: production hard-override unaffected by the toggle ──────────────────

  queue.push(function() {
    console.log('\n[amgt-s1] AC4 -- production hard-override unaffected by the runtime toggle');
    return test('productionHardOverrideUnaffectedByToggle', function() {
      process.env.NODE_ENV = 'production';
      delete process.env.MOCK_LLM_GATEWAY;
      const mockGateway = freshMockGateway();

      mockGateway.setRuntimeMockGatewayOverride(true);
      assert.strictEqual(
        mockGateway.isMockGatewayEnabled(),
        false,
        'NODE_ENV=production must hard-override the runtime toggle -- isMockGatewayEnabled() must still return false'
      );
    });
  });

  // ── AC5: requireAdmin gate enforced on both routes ───────────────────────────

  queue.push(function() {
    console.log('\n[amgt-s1] AC5 -- requireAdmin gate on POST toggle endpoint');
    return test('toggleEndpointRequiresAdmin', async function() {
      delete require.cache[requireAdminPath];
      const requireAdmin = require('../src/web-ui/middleware/require-admin');

      const req = { session: { userId: 1, role: 'user' } }; // authenticated, non-admin
      const res = makeRes();
      let nextCalled = false;
      await requireAdmin.requireAdmin(req, res, function() { nextCalled = true; });

      assert.ok(!nextCalled, 'next() must NOT be called for a non-admin session');
      assert.strictEqual(res._status, 403, 'Expected 403, got ' + res._status);
      const body = JSON.parse(res._body);
      assert.strictEqual(body.error, 'Forbidden');
    });
  });

  queue.push(function() {
    console.log('\n[amgt-s1] AC5 -- requireAdmin gate on GET toggle page');
    return test('toggleGetEndpointRequiresAdmin', async function() {
      delete require.cache[requireAdminPath];
      const requireAdmin = require('../src/web-ui/middleware/require-admin');

      const req = { session: null }; // unauthenticated
      const res = makeRes();
      let nextCalled = false;
      await requireAdmin.requireAdmin(req, res, function() { nextCalled = true; });

      assert.ok(!nextCalled, 'next() must NOT be called for an unauthenticated request');
      assert.strictEqual(res._status, 403, 'Expected 403, got ' + res._status);
    });
  });

  queue.push(function() {
    return test('server.js wires requireAdmin for both new mock-gateway toggle routes', function() {
      const fs = require('fs');
      const src = fs.readFileSync(serverPath, 'utf8');
      assert.ok(src.includes('/admin/mock-gateway'), 'server.js must register the /admin/mock-gateway GET route');
      assert.ok(src.includes('/api/admin/mock-gateway/toggle'), 'server.js must register the /api/admin/mock-gateway/toggle POST route');
      // Confirm both routes sit behind requireAdmin -- extract the block for each route
      // and assert requireAdmin is referenced within it.
      const getBlockMatch = src.match(/pathname === '\/admin\/mock-gateway'[\s\S]{0,400}/);
      const postBlockMatch = src.match(/pathname === '\/api\/admin\/mock-gateway\/toggle'[\s\S]{0,400}/);
      assert.ok(getBlockMatch && getBlockMatch[0].includes('requireAdmin'), 'GET /admin/mock-gateway route block must call requireAdmin');
      assert.ok(postBlockMatch && postBlockMatch[0].includes('requireAdmin'), 'POST /api/admin/mock-gateway/toggle route block must call requireAdmin');
    });
  });

  // ── AC2 (integration): toggle flip affects the real turn-execution path ─────

  queue.push(function() {
    console.log('\n[amgt-s1] AC2 (integration) -- toggle flip affects real turn-execution path');
    return test('toggleFlipAffectsRealTurnFlow', function() {
      const httpsMock = installHttpsMock();
      try {
        // Deliberately NOT NODE_ENV=test and NOT MOCK_LLM_GATEWAY=true -- proves the
        // effect is coming from the runtime override, not the pre-existing env-var logic.
        delete process.env.NODE_ENV;
        delete process.env.MOCK_LLM_GATEWAY;
        process.env.SKILL_EXECUTOR_PROVIDER = 'copilot';
        process.env.GITHUB_TOKEN = 'fake-token-would-be-real-in-prod';

        const mockGateway = freshMockGateway();
        mockGateway.wireDefaultMockGatewayClient();
        mockGateway.setRuntimeMockGatewayOverride(true);
        assert.strictEqual(mockGateway.isMockGatewayEnabled(), true, 'Precondition: runtime override alone must enable the gateway');

        const executor = freshExecutor();
        return executor.skillTurnExecutor(
          'system prompt', [], 'Begin the session.', process.env.GITHUB_TOKEN,
          { stage: 'discovery', scenarioName: 'success' }
        ).then(function(result) {
          const text = typeof result === 'string' ? result : result.text;
          const fixture = mockGateway.getMockResponse('discovery', 'claude-sonnet-4.6', 'success');
          assert.strictEqual(text, fixture.text, 'Turn must resolve via the mock gateway fixture response');
          assert.strictEqual(httpsMock.captured.length, 0, 'Zero real https.request calls must be made -- the runtime toggle must reach the real turn-execution path');
        }).finally(function() {
          mockGateway.resetRuntimeMockGatewayOverride();
        });
      } finally {
        uninstallHttpsMock();
      }
    });
  });

  // ── NFR Audit: every toggle flip is logged ───────────────────────────────────

  queue.push(function() {
    console.log('\n[amgt-s1] NFR Audit -- toggle flip is logged with admin identity + new state');
    return test('auditLogOnToggleFlip', async function() {
      process.env.NODE_ENV = 'test';
      const mockGateway = freshMockGateway();
      mockGateway.resetRuntimeMockGatewayOverride();
      const route = freshAdminRoute();

      const logLines = [];
      const originalInfo = console.info;
      console.info = function(line) { logLines.push(line); };
      try {
        const req = makePostReq(
          { userId: 1, role: 'admin', login: 'hamish-king', csrfToken: 'real-token' },
          '_csrf=real-token&nextState=on'
        );
        const res = makeRes();
        await route.adminMockGatewayPost(req, res);

        assert.strictEqual(res._status, 302, 'Expected 302 redirect on a valid CSRF-protected POST, got ' + res._status);
        assert.strictEqual(mockGateway.isMockGatewayEnabled(), true, 'Override must be applied after the POST');

        const parsed = logLines.map(function(l) { try { return JSON.parse(l); } catch (_e) { return null; } })
          .filter(function(p) { return p && p.event === 'mock_gateway_toggled'; });
        assert.ok(parsed.length >= 1, 'A structured log line for event="mock_gateway_toggled" must be emitted');
        assert.strictEqual(parsed[0].adminId, 'hamish-king', 'Log line must name the admin identity');
        assert.strictEqual(parsed[0].newState, true, 'Log line must name the new state');
        assert.ok(parsed[0].timestamp, 'Log line must include a timestamp');
      } finally {
        console.info = originalInfo;
        mockGateway.resetRuntimeMockGatewayOverride();
      }
    });
  });

  // ── Run queue sequentially ────────────────────────────────────────────────

  for (let i = 0; i < queue.length; i++) {
    // eslint-disable-next-line no-await-in-loop
    await queue[i]();
  }

  // Restore process state so this test file has no side effects on the rest of the suite.
  delete require.cache[executorPath];
  delete require.cache[httpsPath];
  delete require.cache[mockGatewayPath];
  delete require.cache[adminRoutePath];
  delete require.cache[requireAdminPath];
  require('https');
  restoreEnv(envSnapshot);
  const finalGateway = require('../src/web-ui/modules/mock-llm-gateway');
  finalGateway.resetRuntimeMockGatewayOverride();
  finalGateway.wireDefaultMockGatewayClient();

  console.log('\n[amgt-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', (f.err && f.err.stack) || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[amgt-s1] Unexpected error:', err);
  process.exit(1);
});
