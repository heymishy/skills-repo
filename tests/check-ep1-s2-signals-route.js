#!/usr/bin/env node
/**
 * check-ep1-s2-signals-route.js -- AC verification for ep1-s2
 * (signals panel route handler: GET /api/signals endpoint).
 *
 * Story: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep1-s2.md
 * Test plan: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep1-s2-test-plan.md
 * Implementation plan: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/plans/ep1-s2-plan.md
 *
 * Run: node tests/check-ep1-s2-signals-route.js
 */
'use strict';

process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
delete process.env.POSTHOG_KEY;
delete process.env.DATABASE_URL;

const assert = require('assert');
const { handleGetSignals, setSignalsAggregator, _resetSignalsAggregatorForTesting } = require('../src/web-ui/routes/signals');

let passed = 0, failed = 0;
function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  ✓ ' + name); },
    function(err) { failed++; console.log('  ✗ ' + name + ' -- ' + (err && err.message || err)); }
  );
}

function mockRes() {
  const res = { statusCode: null, headers: null, body: null };
  res.writeHead = function(code, headers) { res.statusCode = code; res.headers = headers; };
  res.end = function(body) { res.body = body; };
  return res;
}

(async function main() {
  await test('AC1: endpoint returns 200 with the aggregator Signal array verbatim', async function() {
    _resetSignalsAggregatorForTesting();
    const fixed = [{ id: 's1', source: 'capture-log', type: 'gap', text: 'x', timestamp: '2026-01-01', cta: { label: 'Review', skill: '/improve' } }];
    setSignalsAggregator(function() { return fixed; });
    const res = mockRes();
    await handleGetSignals({}, res);
    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(JSON.parse(res.body), fixed);
  });

  await test('AC2: required fields present regardless of optional context presence', async function() {
    _resetSignalsAggregatorForTesting();
    const withContext = { id: 's1', source: 'decisions', type: 'note', text: 'x', timestamp: '2026-01-01', cta: { label: 'Review', skill: '/improve' }, context: { relatedStory: 'a', featureSlug: 'b', severity: 'low', metadata: null } };
    const withoutContext = { id: 's2', source: 'learnings', type: 'note', text: 'y', timestamp: null, cta: { label: 'Review', skill: '/improve' } };
    setSignalsAggregator(function() { return [withContext, withoutContext]; });
    const res = mockRes();
    await handleGetSignals({}, res);
    const body = JSON.parse(res.body);
    body.forEach(function(s) {
      ['id', 'source', 'type', 'text', 'timestamp', 'cta'].forEach(function(f) { assert.ok(f in s, 'missing ' + f); });
      assert.ok('label' in s.cta && 'skill' in s.cta);
    });
    assert.ok(!('context' in body[1]) || body[1].context === undefined, 'entry without context must not fail any check for its absence');
  });

  await test('AC3: aggregator exception returns 500 with structured error, not a partial 200', async function() {
    _resetSignalsAggregatorForTesting();
    setSignalsAggregator(function() { throw new Error('disk read failed'); });
    const res = mockRes();
    await handleGetSignals({}, res);
    assert.strictEqual(res.statusCode, 500);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error, 'disk read failed');
    assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(body.timestamp), 'timestamp must be ISO 8601');
  });

  await test('AC4: endpoint completes within the latency budget (aggregator <200ms + route overhead <50ms)', async function() {
    _resetSignalsAggregatorForTesting();
    setSignalsAggregator(function() {
      const start = Date.now();
      while (Date.now() - start < 150) { /* busy-wait to simulate a 150ms aggregator */ }
      return [];
    });
    const res = mockRes();
    const t0 = Date.now();
    await handleGetSignals({}, res);
    const duration = Date.now() - t0;
    assert.ok(duration < 250, 'expected <250ms total, took ' + duration + 'ms');
  });

  await test('AC5: calling the endpoint twice with an unchanged stubbed aggregator returns identical responses', async function() {
    _resetSignalsAggregatorForTesting();
    const fixed = [{ id: 'a', source: 'suite', type: 'eval-scenario', text: 'x', timestamp: null, cta: { label: 'Review', skill: '/improve' } }];
    setSignalsAggregator(function() { return fixed; });
    const res1 = mockRes();
    await handleGetSignals({}, res1);
    const res2 = mockRes();
    await handleGetSignals({}, res2);
    assert.strictEqual(res1.body, res2.body, 'both responses must be byte-identical JSON');
  });

  console.log('\n[ep1-s2] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
