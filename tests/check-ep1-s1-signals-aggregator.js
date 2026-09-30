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

test('parses suite.json scenarios into signals', function() {
  const content = JSON.stringify({
    scenarios: [
      { taskId: 's-1', description: 'desc 1', failurePatternGuarded: 'fp 1' },
      { taskId: 's-2', description: 'desc 2', failurePatternGuarded: 'fp 2' },
    ],
  });
  const signals = agg._parseSuiteJson(content);
  assert.strictEqual(signals.length, 2);
  assert.strictEqual(signals[0].source, 'suite');
  assert.strictEqual(signals[0].text, 'desc 1');
});

test('parses pipeline-state.json features into signals', function() {
  const content = JSON.stringify({
    features: [
      { slug: 'feat-a', name: 'Feature A', stage: 'review', updatedAt: '2026-09-28T10:00:00Z' },
      { slug: 'feat-b', name: 'Feature B', stage: 'branch-complete', updatedAt: '2026-09-29T10:00:00Z' },
    ],
  });
  const signals = agg._parsePipelineState(content);
  assert.strictEqual(signals.length, 2);
  assert.strictEqual(signals[0].source, 'pipeline-state');
  assert.strictEqual(signals[0].context.featureSlug, 'feat-a');
});

test('suite.json invalid JSON throws (caller converts to parse-error)', function() {
  assert.throws(function() { agg._parseSuiteJson('{not valid json'); });
});

test('parses a flat proposals directory into one signal per file', function() {
  const files = ['2026-07-13-estimate-skip-marker-improve-proposal.md', '2026-08-14-checkpoint-improve-proposal.md'];
  const signals = agg._parseProposalsDir(files);
  assert.strictEqual(signals.length, 2);
  assert.strictEqual(signals[0].source, 'proposals');
  assert.ok(signals[0].timestamp, 'timestamp extracted from filename date prefix');
});

test('parses traces jsonl content into one signal per line', function() {
  const content = '{"traceId":"a","skill":"tdd","status":"completed"}\n{"traceId":"b","skill":"review","status":"failed"}\n';
  const signals = agg._parseTracesFile(content, 'trace-001.jsonl');
  assert.strictEqual(signals.length, 2);
  assert.strictEqual(signals[0].source, 'traces');
});

test('traces jsonl tolerates a malformed line without dropping valid ones', function() {
  const content = '{"traceId":"a","skill":"tdd"}\nNOT JSON\n{"traceId":"b","skill":"review"}\n';
  const signals = agg._parseTracesFile(content, 'trace-002.jsonl');
  assert.strictEqual(signals.length, 2, 'the 1 malformed line is skipped, not thrown');
});

test('parses results.tsv rows tolerantly, including ragged column counts', function() {
  const content = [
    '2026-04-10T12:11:26.579Z\ta1604b2e\tgithub-copilot\t0\t0\tbaseline',
    '2026-04-12\tfeat-a\test-actuals\t8',       // fewer columns -- must not throw
    '2026-04-20\tfeat-b\test-actuals\t24\t0.25\t30h\t1h',
  ].join('\n');
  const signals = agg._parseResultsTsv(content);
  assert.strictEqual(signals.length, 3);
  assert.strictEqual(signals[0].source, 'results');
});

console.log('\n[ep1-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
