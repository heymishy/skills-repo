#!/usr/bin/env node
/**
 * check-ep2-s2-signal-seeding-bridge.js -- AC verification for ep2-s2
 * (signal-to-session seeding bridge: CTA creates a seeded skill session).
 *
 * Story: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s2.md
 * Test plan: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep2-s2-test-plan.md
 *
 * Run: node tests/check-ep2-s2-signal-seeding-bridge.js
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
const { extractSignalContext, formatSignalPriorArtefact } = require('../src/web-ui/utils/signal-context');

let passed = 0, failed = 0;
function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  ✓ ' + name); },
    function(err) { failed++; console.log('  ✗ ' + name + ' -- ' + (err && err.message || err)); }
  );
}

(async function main() {

  await test('AC1 (formatting half): signal content formats into exactly one priorArtefacts entry, verbatim', function() {
    const ctx = extractSignalContext({
      signalSource: 'capture-log', signalType: 'decision',
      signalText: 'Use flat stories array, not epics[].stories[]', signalTimestamp: '2026-09-30'
    });
    const entry = formatSignalPriorArtefact(ctx);
    assert.strictEqual(typeof entry.path, 'string');
    assert.strictEqual(typeof entry.content, 'string');
    assert.ok(entry.content.includes('capture-log'));
    assert.ok(entry.content.includes('decision'));
    assert.ok(entry.content.includes('Use flat stories array, not epics[].stories[]'), 'expected signal text verbatim, not paraphrased or truncated');
  });

  await test('No signal-context fields at all -> extractSignalContext returns null (legacy ep1-s3 path, AC5)', function() {
    assert.strictEqual(extractSignalContext({}), null);
    assert.strictEqual(extractSignalContext(undefined), null);
  });

  await test('AC4: missing signalText throws a clear error naming the missing field, before any priorArtefacts is built', function() {
    assert.throws(function() {
      extractSignalContext({ signalSource: 'capture-log', signalType: 'decision', signalText: '' });
    }, /signalText/);
  });

  await test('AC4: missing signalSource throws a clear error naming the missing field', function() {
    assert.throws(function() {
      extractSignalContext({ signalType: 'decision', signalText: 'x' });
    }, /signalSource/);
  });

  console.log('\n[ep2-s2] Results: ' + passed + ' passed, ' + failed + ' failed (partial run -- tasks 3/5/7 append more)');
  process.exit(failed > 0 ? 1 : 0);
})().catch(function(err) {
  console.error('[ep2-s2] Unexpected error:', err && err.stack || err);
  process.exit(1);
});
