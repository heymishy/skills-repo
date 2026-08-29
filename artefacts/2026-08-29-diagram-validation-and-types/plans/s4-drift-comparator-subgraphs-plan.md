# Drift-comparator recognizes subgraphs — Implementation Plan

> **For agent execution:** Use /subagent-execution (subagents available).

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/s4-drift-comparator-subgraphs`
**Worktree:** `.worktrees/s4-drift-comparator-subgraphs`
**Test command:** `node scripts/run-all-tests.js` (full suite); individual file: `node tests/check-s4-drift-comparator-subgraphs.js`

**Read this before starting — this story has NO production code change.** Empirical testing during implementation planning (4 scenarios run directly via `node -e` against the current, unmodified `parseFlowchartMermaid`) confirmed subgraphs already parse correctly today: `subgraph`/`end`/`direction` lines simply fail to match `NODE_DECL_RE`/`EDGE_RE` and are silently skipped, while nested node/edge declarations are matched individually regardless of indentation. See `decisions.md` (ASSUMPTION, 2026-08-30) for the full evidence and rationale. **Do not "fix" `src/modules/drift-comparator.js` — there is nothing to fix.** This story's entire deliverable is dedicated test coverage proving AC1-AC4, closing the benefit-metric's own M2 target ("dedicated passing fixtures... for subgraphs").

**Mandatory Architecture Constraint (from the story), satisfied differently than S3's:** since there is no fix to revert, Task 1's Step 5 instead temporarily introduces a deliberate, real bug into `parseFlowchartMermaid` (a naive "skip every line between `subgraph` and `end`" mutation), confirms the new tests fail for that exact reason, then reverts to the real unmodified code and confirms the tests pass again. Do not skip this — it is what proves the tests have real detection power rather than trivially passing against already-correct code by coincidence.

---

## File map

```
Create:
  tests/check-s4-drift-comparator-subgraphs.js   — all tests for this story

Modify:
  (none — src/modules/drift-comparator.js is NOT modified; see the note above)
```

---

## Task 1: Dedicated test coverage proving subgraphs already parse correctly (AC1, AC2, AC3, AC4)

**Files:**
- Create: `tests/check-s4-drift-comparator-subgraphs.js`

- [ ] **Step 1: Write the test**

Create `tests/check-s4-drift-comparator-subgraphs.js`:

```javascript
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
```

- [ ] **Step 2: Run test — must pass immediately**

```bash
node tests/check-s4-drift-comparator-subgraphs.js
```

Expected output: `7 passed, 0 failed` — unlike a normal TDD red-green cycle, these tests pass immediately because the code under test is already correct (this is the entire point of this story: proving that with dedicated coverage, not fixing a bug). Do not treat an immediate pass here as suspicious or as a sign the test is vacuous — Step 5's mutation check is what proves these tests have real teeth.

- [ ] **Step 3: No implementation step**

There is no code to write. `src/modules/drift-comparator.js` is not modified by this story.

- [ ] **Step 4: No-op — tests already pass from Step 2**

- [ ] **Step 5: Mutation check (mandatory — this story's own Architecture Constraint)**

In `src/modules/drift-comparator.js`, temporarily replace the `parseFlowchartMermaid` function's `lines.forEach(...)` loop body with a deliberately buggy version that naively skips everything between `subgraph` and `end` (including node/edge declarations, not just the subgraph/end lines themselves) — a plausible mistake a less careful implementation might actually make:

```javascript
  let _mutationInsideSubgraph = false; // TEMPORARY MUTATION -- DO NOT COMMIT
  lines.forEach(function(line) {
    if (/^flowchart\b/i.test(line)) return;
    if (/^subgraph\b/i.test(line)) { _mutationInsideSubgraph = true; return; } // TEMPORARY MUTATION
    if (/^end$/i.test(line)) { _mutationInsideSubgraph = false; return; } // TEMPORARY MUTATION
    if (_mutationInsideSubgraph) return; // TEMPORARY MUTATION -- naively drops everything inside

    const nodeMatch = NODE_DECL_RE.exec(line);
    if (nodeMatch) {
      const id = nodeMatch[1];
      let label = nodeMatch[2] !== undefined ? nodeMatch[2] : nodeMatch[3];
      label = String(label || '').replace(/^"|"$/g, '');
      idToLabel[id] = label;
      return;
    }

    const edgeMatch = EDGE_RE.exec(line);
    if (edgeMatch) {
      const label = edgeMatch[2] !== undefined ? edgeMatch[2].trim() : undefined;
      const targets = edgeMatch[3].split('&').map(function(s) { return s.trim(); });
      targets.forEach(function(targetId) {
        const pair = { from: edgeMatch[1], to: targetId };
        if (label !== undefined) { pair.label = label; }
        edgeIdPairs.push(pair);
      });
    }
  });
```

Run the test file:

```bash
node tests/check-s4-drift-comparator-subgraphs.js
```

Expected output: AC1, AC2 (both), AC3 (both), and the AC4 subgraph-specific test all FAIL (nodes/edges inside the subgraph are now genuinely dropped) — only the AC4 plain non-subgraph test still passes, since it has no subgraph at all. This confirms the tests genuinely exercise subgraph-handling, not just something else.

Then **revert this mutation completely** — restore `parseFlowchartMermaid` to its real, original, unmodified form (the version already in `src/modules/drift-comparator.js` before this step; do not leave any `_mutationInsideSubgraph` code in the file). Run the test file again:

```bash
node tests/check-s4-drift-comparator-subgraphs.js
```

Expected output: `7 passed, 0 failed` again, confirming the revert was clean and complete.

- [ ] **Step 6: Confirm no diff to drift-comparator.js**

```bash
git diff src/modules/drift-comparator.js
```

Expected output: empty — this file must show NO diff after Step 5's mutation is fully reverted. If this shows any diff, the mutation was not fully reverted; fix before proceeding.

- [ ] **Step 7: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing (baseline is now genuinely clean — the `check-p3.5-validate-trace.js` flake was fixed and merged in `p35tf-s1` before this story's `/branch-setup`, so no known flake is expected here). Specifically re-confirm `tests/check-s3-drift-comparator-labeled-multi-target-edges.js`, `tests/check-csd-s6-drift-signal.js`, and `tests/check-csd-s7-as-built-system-architecture-diagram.js` still pass unchanged.

- [ ] **Step 8: Commit**

```bash
git add tests/check-s4-drift-comparator-subgraphs.js
git commit -m "test(s4): dedicated coverage proving drift-comparator already handles subgraphs correctly"
```

---

## After this task: open the draft PR

Once Task 1 is committed and the full suite passes, run `/verify-completion` then `/branch-complete`. Per this story's own NFRs (Audit: N/A, no runtime event), `/verify-completion`'s route/handler E2E coverage check should report N/A — this story touches `tests/` only, not `src/web-ui/routes/`. Confirm this when actually running that check.
