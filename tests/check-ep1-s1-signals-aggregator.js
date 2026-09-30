#!/usr/bin/env node
/**
 * check-ep1-s1-signals-aggregator.js -- AC verification for ep1-s1
 * (signals aggregator module: read all 12 sources and normalize to Signal shape).
 *
 * Story: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep1-s1.md
 * Test plan: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep1-s1-test-plan.md
 * Implementation plan: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/plans/ep1-s1-plan.md
 *
 * Run: node tests/check-ep1-s1-signals-aggregator.js
 */
'use strict';

const assert = require('assert');
const path = require('path');
const agg = require('../src/web-ui/modules/signals-aggregator');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log('  ✓ ' + name); passed++; }
  catch (err) { console.log('  ✗ ' + name + ' -- ' + (err && err.message || err)); failed++; }
}

test('D37: default adapter throws when not wired', function() {
  agg._resetFileReadAdapterForTesting();
  assert.throws(function() { agg.getSignals('/nonexistent'); }, /Adapter not wired: file-read/);
});

test('setFileReadAdapter wires a real fs-backed adapter and getSignals runs it', function() {
  const fs = require('fs');
  const os = require('os');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s1-'));
  agg.setFileReadAdapter(agg.createFsFileReadAdapter());
  const signals = agg.getSignals(tmp);
  assert.ok(Array.isArray(signals), 'getSignals must return an array even for an empty workspace');
  fs.rmSync(tmp, { recursive: true });
});

console.log('\n[ep1-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
