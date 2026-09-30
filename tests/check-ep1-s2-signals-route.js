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

  console.log('\n[ep1-s2] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
