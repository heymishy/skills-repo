'use strict';
/**
 * check-s4-drift-comparator-subgraphs.js -- S4: dedicated test coverage
 * proving drift-comparator.js's parseFlowchartMermaid already correctly
 * recognizes mermaid subgraphs (no production code change in this story --
 * see decisions.md ASSUMPTION entry, 2026-08-30, for the empirical evidence
 * this story is built on).
 *
 * Per this story's own Architecture Constraint (testing standards), these
 * tests are mutation-tested during implementation (Task 1 Step 5): a
 * deliberate, real bug is temporarily introduced into parseFlowchartMermaid
 * and these tests are confirmed to fail for the expected reason, before the
 * real (already-correct) code is restored.
 *
 * Run: node tests/check-s4-drift-comparator-subgraphs.js
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

// ── AC1 — nodes inside a subgraph are captured exactly as if outside one ────
test('AC1: nodes inside a subgraph are captured in the flat nodes array', function() {
  const parsed = driftComparator.parseFlowchartMermaid([
    'flowchart LR',
    '  subgraph Group1',
    '    A[Service A]',
    '    B[Service B]',
    '  end',
    '  C[Service C]'
  ].join('\n'));
  const ids = parsed.nodes.map(function(n) { return n.id; }).sort();
  assert.deepStrictEqual(ids, ['A', 'B', 'C'], 'expected all 3 nodes, subgraph membership must not drop A or B');
  const labelA = parsed.nodes.find(function(n) { return n.id === 'A'; }).label;
  assert.strictEqual(labelA, 'Service A', 'expected node A\'s label to be captured correctly despite subgraph wrapping');
});

// ── AC2 — edges crossing a subgraph boundary resolve both endpoints correctly ──
test('AC2: an edge crossing a subgraph boundary (outside -> inside) resolves both endpoints', function() {
  const parsed = driftComparator.parseFlowchartMermaid([
    'flowchart LR',
    '  C[Service C]',
    '  subgraph Group1',
    '    A[Service A]',
    '  end',
    '  C --> A'
  ].join('\n'));
  assert.strictEqual(parsed.edges.length, 1);
  assert.strictEqual(parsed.edges[0].fromLabel, 'Service C');
  assert.strictEqual(parsed.edges[0].toLabel, 'Service A');
});

test('AC2: an edge crossing a subgraph boundary (inside -> outside) resolves both endpoints', function() {
  const parsed = driftComparator.parseFlowchartMermaid([
    'flowchart LR',
    '  subgraph Group1',
    '    A[Service A]',
    '  end',
    '  C[Service C]',
    '  A --> C'
  ].join('\n'));
  assert.strictEqual(parsed.edges.length, 1);
  assert.strictEqual(parsed.edges[0].fromLabel, 'Service A');
  assert.strictEqual(parsed.edges[0].toLabel, 'Service C');
});

// ── AC3 — subgraph grouping is purely organizational, not a drift signal ────
test('AC3: a subgraph-grouped as-designed diagram MATCHES a flat as-built equivalent', function() {
  const asDesigned = [
    'flowchart LR',
    '  subgraph Group1',
    '    direction TB',
    '    A[Service A]',
    '    B[Service B]',
    '  end',
    '  C[Service C]',
    '  A --> B',
    '  B --> C'
  ].join('\n');
  const asBuilt = [
    'flowchart LR',
    '  A[Service A]',
    '  B[Service B]',
    '  C[Service C]',
    '  A --> B',
    '  B --> C'
  ].join('\n');
  const result = driftComparator.compareProgramDesign(asDesigned, asBuilt);
  assert.strictEqual(result.status, 'MATCHED', 'subgraph grouping alone must not register as a structural difference');
});

test('AC3: a real DIVERGED difference is still caught even when one side uses a subgraph', function() {
  const asDesigned = [
    'flowchart LR',
    '  subgraph Group1',
    '    A[Service A]',
    '    B[Service B]',
    '  end',
    '  A --> B'
  ].join('\n');
  const asBuilt = [
    'flowchart LR',
    '  A[Service A]',
    '  B[Service B]',
    '  D[Service D]',
    '  A --> B'
  ].join('\n');
  const result = driftComparator.compareProgramDesign(asDesigned, asBuilt);
  assert.strictEqual(result.status, 'DIVERGED', 'a genuine new node in as-built must still be caught, subgraph wrapping must not mask real drift');
});

// ── AC4 — existing non-subgraph syntax (incl. S3's labeled/multi-target) is unaffected ──
test('AC4: a plain non-subgraph flowchart parses exactly as before', function() {
  const parsed = driftComparator.parseFlowchartMermaid([
    'flowchart LR',
    '  A[Service A]',
    '  B[Service B]',
    '  A --> B'
  ].join('\n'));
  assert.strictEqual(parsed.nodes.length, 2);
  assert.strictEqual(parsed.edges.length, 1);
});

test('AC4: S3\'s labeled/multi-target edge syntax still works correctly inside a subgraph', function() {
  const parsed = driftComparator.parseFlowchartMermaid([
    'flowchart LR',
    '  subgraph Group1',
    '    A[Service A]',
    '    B[Service B]',
    '    C[Service C]',
    '    A -->|creates| B & C',
    '  end'
  ].join('\n'));
  assert.strictEqual(parsed.edges.length, 2, 'expected the multi-target edge to still expand into 2 edges inside a subgraph');
  assert.ok(parsed.edges.every(function(e) { return e.label === 'creates'; }), 'expected the label to still be captured on both expanded edges');
});

console.log('\n[s4-drift-comparator-subgraphs] Results: ' + passed + ' passed, ' + failed + ' failed\n');
if (failed > 0) { process.exit(1); }
