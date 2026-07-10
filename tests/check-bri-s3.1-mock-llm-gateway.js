'use strict';

/**
 * check-bri-s3.1-mock-llm-gateway.js — AC verification for bri-s3.1
 * "Build the mock LLM gateway and fixture set"
 *
 * Covers:
 *   AC1 — deterministic canned response for (stage, model, scenarioName)
 *   AC2 — >=14 fixtures across the 7 gate-map.js stages, >=1 success + >=1 failure each
 *   AC3 — regeneration script refreshes a fixture in place, no manual JSON editing
 *   AC4 — branch-setup/branch-complete fixtures built and wired
 *   AC5 — @mocked runs make zero real network calls to the Copilot API
 *   D37 — injectable adapter default stub throws when not wired
 *   NFR — Performance (<50ms/call), Security (NODE_ENV=test-only activation guard), Audit (regen log)
 *
 * Run: node tests/check-bri-s3.1-mock-llm-gateway.js
 * Exit 0 if all pass, exit 1 if any fail.
 */

const assert = require('assert');
const path   = require('path');
const fs     = require('fs');

const ROOT = path.join(__dirname, '..');

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

const mockGatewayPath  = require.resolve('../src/web-ui/modules/mock-llm-gateway');
const executorPath     = require.resolve('../src/modules/skill-turn-executor');
const httpsPath        = require.resolve('https');
const journeyRoutePath = require.resolve('../src/web-ui/routes/journey');

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

/** Installs a fake `https` module in require.cache; returns { captured, setResponder }. */
function installHttpsMock() {
  const captured = [];
  let responderStatus = 500;
  const fakeModule = {
    id: httpsPath, filename: httpsPath, loaded: true,
    exports: {
      Agent: function() { return {}; },
      request: function(opts, cb) {
        captured.push(opts);
        const chunks = [];
        const fakeReq = {
          _errFn: null,
          on: function(ev, fn) { if (ev === 'error') fakeReq._errFn = fn; return fakeReq; },
          write: function(data) { chunks.push(typeof data === 'string' ? data : data.toString()); },
          end: function() {
            setImmediate(function() {
              const fakeRes = {
                statusCode: responderStatus,
                on: function(ev, fn) {
                  if (ev === 'data') { /* no body chunks needed for this stub */ }
                  if (ev === 'end') { setImmediate(fn); }
                  return fakeRes;
                }
              };
              if (typeof cb === 'function') { cb(fakeRes); }
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
  return {
    captured: captured,
    setResponderStatus: function(code) { responderStatus = code; }
  };
}

function uninstallHttpsMock() {
  delete require.cache[httpsPath];
  require('https'); // restore the real module into the cache
}

function freshExecutor() {
  delete require.cache[executorPath];
  return require('../src/modules/skill-turn-executor');
}

async function main() {
  const envSnapshot = snapshotEnv();
  const mockGateway = require('../src/web-ui/modules/mock-llm-gateway');
  const queue = [];

  // ── Group A — AC1: deterministic fixture lookup ─────────────────────────────

  queue.push(function() {
    console.log('\n[bri-s3.1] A -- AC1: deterministic fixture lookup');
    return test('A1: identical (stage, model, scenarioName) returns byte-identical response twice', function() {
      mockGateway.resetMockGatewayClient();
      mockGateway.wireDefaultMockGatewayClient();
      const first  = mockGateway.getMockResponse('discovery', 'claude-sonnet-4.6', 'success');
      const second = mockGateway.getMockResponse('discovery', 'claude-sonnet-4.6', 'success');
      assert.deepStrictEqual(first, second, 'Two calls with the identical key must return byte-identical response objects');
    });
  });

  queue.push(function() {
    return test('A2: a differently-keyed call (failure vs success) returns a distinct fixture', function() {
      mockGateway.wireDefaultMockGatewayClient();
      const success = mockGateway.getMockResponse('discovery', 'claude-sonnet-4.6', 'success');
      const failure = mockGateway.getMockResponse('discovery', 'claude-sonnet-4.6', 'failure');
      assert.notStrictEqual(success.text, failure.text, 'success and failure fixtures must have different response text');
    });
  });

  queue.push(function() {
    return test('A3 (edge case): an unrecognised key throws a clear error, never returns undefined/empty', function() {
      mockGateway.wireDefaultMockGatewayClient();
      assert.throws(
        function() { mockGateway.getMockResponse('discovery', 'claude-sonnet-4.6', 'no-such-scenario'); },
        /No fixture found/,
        'Unrecognised (stage, model, scenarioName) key must throw, not return undefined/empty'
      );
    });
  });

  // ── Group B — D37: adapter default stub throws when not wired ───────────────

  queue.push(function() {
    console.log('\n[bri-s3.1] B -- D37: adapter default stub throws when not wired');
    return test('B1: getMockResponse() throws the exact D37 stub message before any adapter is wired', function() {
      mockGateway.resetMockGatewayClient(); // simulate a freshly required, unwired module
      assert.throws(
        function() { mockGateway.getMockResponse('discovery', 'claude-sonnet-4.6', 'success'); },
        function(err) {
          return err.message === 'Adapter not wired: mockGatewayClient. Call setMockGatewayClient() with a real implementation before use.';
        },
        'Must throw the exact D37 stub-not-wired message'
      );
      mockGateway.wireDefaultMockGatewayClient(); // restore for subsequent tests
    });
  });

  // ── Group C — NFR Performance: <50ms/call, no real network round-trip ───────

  queue.push(function() {
    console.log('\n[bri-s3.1] C -- NFR Performance: <50ms per call');
    return test('C1: 100 sequential calls each resolve in under 50ms', function() {
      mockGateway.wireDefaultMockGatewayClient();
      const stages = mockGateway.STAGES;
      for (let i = 0; i < 100; i++) {
        const stage = stages[i % stages.length];
        const scenario = i % 2 === 0 ? 'success' : 'failure';
        const start = process.hrtime.bigint();
        mockGateway.getMockResponse(stage, 'claude-sonnet-4.6', scenario);
        const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
        assert.ok(elapsedMs < 50, 'Call ' + i + ' took ' + elapsedMs.toFixed(3) + 'ms, expected < 50ms');
      }
    });
  });

  // ── Group D — AC2: fixture inventory meets 7-stage, 14-fixture minimum ──────

  queue.push(function() {
    console.log('\n[bri-s3.1] D -- AC2: fixture inventory (7 stages, >=14 fixtures)');
    return test('D1: fixture directory exists under tests/e2e/fixtures/llm-gateway/', function() {
      assert.ok(fs.existsSync(mockGateway.FIXTURE_DIR), 'Fixture directory must exist: ' + mockGateway.FIXTURE_DIR);
    });
  });

  queue.push(function() {
    return test('D2: all 7 gate-map.js stages are represented, each with >=1 success and >=1 failure fixture', function() {
      const inv = mockGateway.inventoryFixtures();
      assert.strictEqual(mockGateway.STAGES.length, 7, 'STAGES must list exactly 7 gate-map.js stages');
      mockGateway.STAGES.forEach(function(stage) {
        const entry = inv.byStage[stage];
        assert.ok(entry, 'Stage "' + stage + '" must appear in the fixture inventory');
        assert.ok(entry.success >= 1, 'Stage "' + stage + '" must have >=1 success fixture, found ' + entry.success);
        assert.ok(entry.failure >= 1, 'Stage "' + stage + '" must have >=1 failure/edge-case fixture, found ' + entry.failure);
      });
    });
  });

  queue.push(function() {
    return test('D3: total fixture count across all stages is >= 14', function() {
      const inv = mockGateway.inventoryFixtures();
      assert.ok(inv.total >= 14, 'Expected >=14 total fixtures, found ' + inv.total);
    });
  });

  // ── Group E — AC4: branch-setup/branch-complete are covered too ─────────────

  queue.push(function() {
    console.log('\n[bri-s3.1] E -- AC4: branch-setup/branch-complete fixtures and SLASH_CAPABILITY_MAP wiring');
    return test('E1: branch-setup and branch-complete both resolve success + failure fixtures', function() {
      mockGateway.wireDefaultMockGatewayClient();
      ['branch-setup', 'branch-complete'].forEach(function(stage) {
        const success = mockGateway.getMockResponse(stage, 'claude-sonnet-4.6', 'success');
        const failure = mockGateway.getMockResponse(stage, 'claude-sonnet-4.6', 'failure');
        assert.ok(success.text && success.text.length > 0, stage + ' success fixture must have non-empty text');
        assert.ok(failure.text && failure.text.length > 0, stage + ' failure fixture must have non-empty text');
        assert.notStrictEqual(success.text, failure.text, stage + ' success/failure fixtures must differ');
      });
    });
  });

  queue.push(function() {
    return test('E2: routes/journey.js SLASH_CAPABILITY_MAP lists branch-setup and branch-complete like every other stage', function() {
      delete require.cache[journeyRoutePath];
      const journeyRoutes = require('../src/web-ui/routes/journey');
      const map = journeyRoutes.SLASH_CAPABILITY_MAP;
      assert.ok(map && map['branch-setup'], 'SLASH_CAPABILITY_MAP must have a branch-setup entry');
      assert.ok(map && map['branch-complete'], 'SLASH_CAPABILITY_MAP must have a branch-complete entry');
      // limitedOnWebUI reflects missing git/bash/PR-creation capability, not an LLM-gateway bypass (decisions.md 2026-07-09)
      assert.strictEqual(typeof map['branch-setup'].limitedOnWebUI, 'boolean', 'branch-setup entry must declare limitedOnWebUI');
      assert.strictEqual(typeof map['branch-complete'].limitedOnWebUI, 'boolean', 'branch-complete entry must declare limitedOnWebUI');
    });
  });

  // ── Group F — AC3: regeneration script refreshes a fixture in place ─────────

  queue.push(function() {
    console.log('\n[bri-s3.1] F -- AC3: regeneration script refreshes fixtures in place');
    return test('F1: regenerateFixture() overwrites the fixture file with the stubbed "real response" payload, no manual editing, and logs an audit entry', async function() {
      const { regenerateFixture } = require('../scripts/regenerate-llm-fixtures');
      const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'bri-s3-1-regen-'));
      try {
        const staleFile = path.join(tmpDir, 'discovery.success.json');
        fs.writeFileSync(staleFile, JSON.stringify({ stage: 'discovery', scenarioName: 'success', response: 'STALE' }, null, 2));

        const stubbedRealResponse = {
          stage: 'discovery', scenarioName: 'success', model: 'claude-sonnet-4.6',
          response: 'FRESH regenerated content from stand-in dev/staging response',
          usage: { input_tokens: 10, output_tokens: 20 },
          regeneratedAt: '2026-07-10T00:00:00.000Z', source: 'stubbed-staging'
        };
        const logLines = [];
        const result = await regenerateFixture({
          stage: 'discovery',
          scenarioName: 'success',
          fixtureDir: tmpDir,
          fetchRealResponse: function() { return Promise.resolve(stubbedRealResponse); },
          log: function(line) { logLines.push(line); }
        });

        const onDisk = JSON.parse(fs.readFileSync(result.filePath, 'utf8'));
        assert.strictEqual(onDisk.response, 'FRESH regenerated content from stand-in dev/staging response', 'Fixture file content must be overwritten automatically');
        assert.notStrictEqual(onDisk.response, 'STALE', 'Stale content must be replaced, not preserved');
        assert.ok(logLines.length >= 1, 'A log entry must be written recording the regeneration');
        assert.ok(logLines[0].indexOf('discovery.success.json') !== -1, 'Log entry must name the fixture file that changed');
        assert.ok(logLines[0].indexOf('stubbed-staging') !== -1, 'Log entry must name the source the fixture was regenerated from');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });

  queue.push(function() {
    return test('F2: regenerateFixture() produces valid JSON on disk (no hand-editing required to parse it)', async function() {
      const { regenerateFixture } = require('../scripts/regenerate-llm-fixtures');
      const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'bri-s3-1-regen-'));
      try {
        const result = await regenerateFixture({
          stage: 'test-plan', scenarioName: 'failure', fixtureDir: tmpDir,
          fetchRealResponse: function() { return Promise.resolve({ stage: 'test-plan', scenarioName: 'failure', response: 'x' }); },
          log: function() {}
        });
        assert.doesNotThrow(function() { JSON.parse(fs.readFileSync(result.filePath, 'utf8')); }, 'Regenerated fixture must be valid JSON');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });

  queue.push(function() {
    return test('F3: without live credentials, the default real-response fetcher throws a clear, actionable error (not a silent fake value)', async function() {
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.GITHUB_TOKEN;
      const { defaultFetchRealResponse } = require('../scripts/regenerate-llm-fixtures');
      let threw = false;
      try {
        await defaultFetchRealResponse('discovery', 'claude-sonnet-4.6', 'success');
      } catch (err) {
        threw = true;
        assert.ok(/no live credentials configured/.test(err.message), 'Error must explain that live credentials are required');
      }
      assert.ok(threw, 'defaultFetchRealResponse must throw when no credentials are configured');
    });
  });

  // ── Group G — Security NFR: NODE_ENV=test-only activation guard ─────────────

  queue.push(function() {
    console.log('\n[bri-s3.1] G -- Security NFR: activation guard (structural)');
    return test('G1: isMockGatewayEnabled() is true when NODE_ENV=test', function() {
      delete process.env.MOCK_LLM_GATEWAY;
      process.env.NODE_ENV = 'test';
      assert.strictEqual(mockGateway.isMockGatewayEnabled(), true);
    });
  });

  queue.push(function() {
    return test('G2: isMockGatewayEnabled() is true when MOCK_LLM_GATEWAY=true, even with NODE_ENV unset', function() {
      delete process.env.NODE_ENV;
      process.env.MOCK_LLM_GATEWAY = 'true';
      assert.strictEqual(mockGateway.isMockGatewayEnabled(), true);
    });
  });

  queue.push(function() {
    return test('G3: isMockGatewayEnabled() is false when neither NODE_ENV=test nor MOCK_LLM_GATEWAY=true is set', function() {
      delete process.env.NODE_ENV;
      delete process.env.MOCK_LLM_GATEWAY;
      assert.strictEqual(mockGateway.isMockGatewayEnabled(), false);
    });
  });

  queue.push(function() {
    return test('G4 (edge case): NODE_ENV=production is a hard override — gateway never activates even if MOCK_LLM_GATEWAY=true (no configuration error can enable it)', function() {
      process.env.NODE_ENV = 'production';
      process.env.MOCK_LLM_GATEWAY = 'true';
      assert.strictEqual(mockGateway.isMockGatewayEnabled(), false, 'production must hard-refuse regardless of MOCK_LLM_GATEWAY');
    });
  });

  // ── Group H — AC5: @mocked runs make zero real network calls ────────────────

  queue.push(function() {
    console.log('\n[bri-s3.1] H -- AC5: zero real network calls when mocked; real path attempted otherwise');
    return test('H1: skillTurnExecutor() with a stage + NODE_ENV=test returns the fixture text and makes 0 https calls, even with real credentials present', function() {
      const httpsMock = installHttpsMock();
      try {
        process.env.NODE_ENV = 'test';
        delete process.env.MOCK_LLM_GATEWAY;
        process.env.SKILL_EXECUTOR_PROVIDER = 'copilot';
        process.env.GITHUB_TOKEN = 'fake-token-would-be-real-in-prod';
        mockGateway.wireDefaultMockGatewayClient();

        const executor = freshExecutor();
        return executor.skillTurnExecutor(
          'system prompt', [], 'Begin the session.', process.env.GITHUB_TOKEN,
          { stage: 'discovery', scenarioName: 'success' }
        ).then(function(result) {
          const text = typeof result === 'string' ? result : result.text;
          const fixture = mockGateway.getMockResponse('discovery', 'claude-sonnet-4.6', 'success');
          assert.strictEqual(text, fixture.text, 'Mocked call must return the fixture response text');
          assert.strictEqual(httpsMock.captured.length, 0, 'Zero real https.request calls must be made when the mock gateway is active');
        });
      } finally {
        uninstallHttpsMock();
      }
    });
  });

  queue.push(function() {
    return test('H2: skillTurnExecutor() with a stage but NODE_ENV unset (not test) does NOT return the fixture — falls through to the real provider path', function() {
      const httpsMock = installHttpsMock();
      try {
        delete process.env.NODE_ENV;
        delete process.env.MOCK_LLM_GATEWAY;
        process.env.SKILL_EXECUTOR_PROVIDER = 'copilot';
        process.env.GITHUB_TOKEN = 'fake-token-would-be-real-in-prod';

        const executor = freshExecutor();
        return executor.skillTurnExecutor(
          'system prompt', [], 'Begin the session.', process.env.GITHUB_TOKEN,
          { stage: 'discovery', scenarioName: 'success' }
        ).then(
          function() { throw new Error('expected the real (mocked-500) HTTP path to reject, but it resolved'); },
          function(err) {
            assert.ok(/Copilot API HTTP 500/.test(err.message), 'Must hit the real Copilot code path (proven by the HTTP-500 stub response), not the mock gateway');
            assert.ok(httpsMock.captured.length >= 1, 'The real path must actually invoke https.request when the mock gateway is not enabled');
          }
        );
      } finally {
        uninstallHttpsMock();
      }
    });
  });

  queue.push(function() {
    return test('H3: skillTurnExecutorStream() with a stage + NODE_ENV=test streams the fixture text via onChunk and makes 0 https calls', function() {
      const httpsMock = installHttpsMock();
      try {
        process.env.NODE_ENV = 'test';
        delete process.env.MOCK_LLM_GATEWAY;
        process.env.SKILL_EXECUTOR_PROVIDER = 'copilot';
        process.env.GITHUB_TOKEN = 'fake-token-would-be-real-in-prod';
        mockGateway.wireDefaultMockGatewayClient();

        const executor = freshExecutor();
        const chunks = [];
        let ttfb = null;
        return executor.skillTurnExecutorStream(
          'system prompt', [], 'Begin the session.', process.env.GITHUB_TOKEN,
          function(chunk) { chunks.push(chunk); },
          null,
          function(ms) { ttfb = ms; },
          { stage: 'branch-complete', scenarioName: 'success' }
        ).then(function(result) {
          const fixture = mockGateway.getMockResponse('branch-complete', 'claude-sonnet-4.6', 'success');
          assert.strictEqual(chunks.join(''), fixture.text, 'Streamed chunks must concatenate to the fixture text');
          assert.strictEqual(result.text, fixture.text, 'Resolved text must equal the fixture text');
          assert.strictEqual(ttfb, 0, 'Mocked stream has no real network latency — TTFB must be reported as 0ms');
          assert.strictEqual(httpsMock.captured.length, 0, 'Zero real https.request calls must be made for a mocked stream');
        });
      } finally {
        uninstallHttpsMock();
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
  delete require.cache[journeyRoutePath];
  delete require.cache[httpsPath];
  require('https');
  restoreEnv(envSnapshot);
  mockGateway.wireDefaultMockGatewayClient();

  console.log('\n[bri-s3.1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', (f.err && f.err.stack) || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[bri-s3.1] Unexpected error:', err);
  process.exit(1);
});
