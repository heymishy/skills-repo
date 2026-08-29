'use strict';
/**
 * check-s3-drift-comparator-labeled-multi-target-edges.js -- S3: extends
 * drift-comparator.js's parseFlowchartMermaid to recognize labeled edges
 * (A -->|label| B) and multi-target edges (A --> B & C), so a MATCHED or
 * DIVERGED signal reflects the real diagram content rather than an
 * artifact of the parser's narrow regex.
 *
 * Per this story's own Architecture Constraint (testing standards), the
 * tests below are mutation-tested during implementation (Task 1 Step 5):
 * the fix is temporarily reverted and the tests re-run to confirm they fail
 * for the EXPECTED reason, not by coincidence.
 *
 * Run: node tests/check-s3-drift-comparator-labeled-multi-target-edges.js
 */

const assert = require('assert');
const driftComparator = require('../src/modules/drift-comparator');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  PASS: ' + name);
  } catch (err) {
    failed++;
    console.log('  FAIL: ' + name + '\n       ' + (err && err.message ? err.message : String(err)));
  }
}

// ── AC1 — labeled edge captures the label, without becoming a drift signal ──
test('AC1: a labeled edge (A -->|creates| B) captures the label as a new field', function() {
  const parsed = driftComparator.parseFlowchartMermaid([
    'flowchart LR',
    '    A[Service A]',
    '    B[Service B]',
    '    A -->|creates| B'
  ].join('\n'));
  assert.strictEqual(parsed.edges.length, 1, 'expected exactly one edge');
  assert.strictEqual(parsed.edges[0].from, 'A');
  assert.strictEqual(parsed.edges[0].to, 'B');
  assert.strictEqual(parsed.edges[0].label, 'creates', 'expected the label to be captured');
});

test('AC1: a labeled edge and its unlabeled equivalent are MATCHED (label alone is not a drift signal)', function() {
  const asDesigned = [
    'flowchart LR',
    '    A[Service A]',
    '    B[Service B]',
    '    A -->|creates| B'
  ].join('\n');
  const asBuilt = [
    'flowchart LR',
    '    A[Service A]',
    '    B[Service B]',
    '    A --> B'
  ].join('\n');
  const result = driftComparator.compareProgramDesign(asDesigned, asBuilt);
  assert.strictEqual(result.status, 'MATCHED', 'a label-only difference must not produce a DIVERGED signal');
});

// ── AC2 — multi-target edge expands into separate edge objects ──────────────
test('AC2: a multi-target edge (A --> B & C) expands into two separate edge objects', function() {
  const parsed = driftComparator.parseFlowchartMermaid([
    'flowchart LR',
    '    A[Service A]',
    '    B[Service B]',
    '    C[Service C]',
    '    A --> B & C'
  ].join('\n'));
  assert.strictEqual(parsed.edges.length, 2, 'expected exactly two edges');
  const pairs = parsed.edges.map(function(e) { return e.from + '->' + e.to; }).sort();
  assert.deepStrictEqual(pairs, ['A->B', 'A->C']);
});

// ── AC3 — multi-target vs two-line equivalent is MATCHED ────────────────────
test('AC3: an as-designed multi-target edge and an as-built two-line equivalent are MATCHED', function() {
  const asDesigned = [
    'flowchart LR',
    '    A[Service A]',
    '    B[Service B]',
    '    C[Service C]',
    '    A --> B & C'
  ].join('\n');
  const asBuilt = [
    'flowchart LR',
    '    A[Service A]',
    '    B[Service B]',
    '    C[Service C]',
    '    A --> B',
    '    A --> C'
  ].join('\n');
  const result = driftComparator.compareProgramDesign(asDesigned, asBuilt);
  assert.strictEqual(result.status, 'MATCHED', 'a multi-target edge and its two-line equivalent must be recognized as the same topology');
});

// ── AC4 — existing single-line, single-target syntax is unaffected ─────────
test('AC4: a plain single-target edge (A --> B) still parses exactly as before, no label field added', function() {
  const parsed = driftComparator.parseFlowchartMermaid([
    'flowchart LR',
    '    A[Service A]',
    '    B[Service B]',
    '    A --> B'
  ].join('\n'));
  assert.strictEqual(parsed.edges.length, 1);
  assert.strictEqual(parsed.edges[0].from, 'A');
  assert.strictEqual(parsed.edges[0].to, 'B');
  assert.strictEqual(parsed.edges[0].label, undefined, 'a plain edge must not gain a label field');
});

console.log('\n[s3-drift-comparator-labeled-multi-target-edges] Results: ' + passed + ' passed, ' + failed + ' failed\n');
if (failed > 0) { process.exit(1); }
