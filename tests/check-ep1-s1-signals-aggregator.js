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

test('parses capture-log.md entries into signals', function() {
  const content = [
    '- date: 2026-09-28',
    '  session-phase: discovery',
    '  signal-type: gap',
    '  signal-text: "Gap A"',
    '  source: operator-manual',
    '',
    '- date: 2026-09-27',
    '  session-phase: review',
    '  signal-type: pattern',
    '  signal-text: "Pattern B"',
    '  source: agent-auto',
  ].join('\n');
  const signals = agg._parseCaptureLog(content);
  assert.strictEqual(signals.length, 2);
  assert.strictEqual(signals[0].source, 'capture-log');
  assert.strictEqual(signals[0].type, 'gap');
  assert.strictEqual(signals[0].text, 'Gap A');
  assert.strictEqual(signals[0].timestamp, '2026-09-28');
});

test('parses decisions.md ## headings into signals', function() {
  const content = '## Decision 1: Use X\n\nContext.\n\n## Decision 2: Use Y\n\nMore context.\n';
  const signals = agg._parseDecisions(content);
  assert.strictEqual(signals.length, 2);
  assert.strictEqual(signals[0].source, 'decisions');
  assert.strictEqual(signals[0].text, 'Decision 1: Use X');
});

test('parses a flat markdown file (learnings/reference/architecture-guardrails) into one signal per top-level heading', function() {
  const content = '## MM3 checkpoint\n\nSome text.\n\n## MM4 other\n\nMore text.\n';
  const signals = agg._parseMarkdownHeadings(content, 'learnings');
  assert.strictEqual(signals.length, 2);
  assert.strictEqual(signals[0].source, 'learnings');
});

test('parses estimation-norms.md table rows into signals', function() {
  const content = [
    '| Date | Feature | Stories |',
    '|------|---------|---------|',
    '| 2026-04-12 | feat-a | 8 |',
    '| 2026-04-20 | feat-b | 24 |',
  ].join('\n');
  const signals = agg._parseEstimationNorms(content);
  assert.strictEqual(signals.length, 2);
  assert.strictEqual(signals[0].source, 'estimation');
  assert.strictEqual(signals[0].timestamp, '2026-04-12');
});

console.log('\n[ep1-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
