# Drift-comparator recognizes labeled and multi-target edges — Implementation Plan

> **For agent execution:** Use /subagent-execution (subagents available).

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/s3-drift-comparator-labeled-multi-target-edges`
**Worktree:** `.worktrees/s3-drift-comparator-labeled-multi-target-edges`
**Test command:** `node scripts/run-all-tests.js` (full suite); individual file: `node tests/check-s3-drift-comparator-labeled-multi-target-edges.js`

**Mandatory Architecture Constraint (from the story):** any test asserting `parseFlowchartMermaid` correctly handles labeled/multi-target edges must be **mutation-tested** — temporarily revert the fix, confirm the test fails for the expected reason, then re-apply the fix — before being trusted. Task 1's Step 5 below is this mutation check; do not skip it.

---

## File map

```
Create:
  tests/check-s3-drift-comparator-labeled-multi-target-edges.js   — all tests for this story

Modify:
  src/modules/drift-comparator.js   — EDGE_RE extended to recognize an
                                        optional `|label|` segment and a
                                        `&`-separated multi-target list;
                                        parseFlowchartMermaid's edge-building
                                        loop expands multi-target matches into
                                        separate edge objects and carries an
                                        optional `label` field. No changes to
                                        _diffNodesAndEdges/compareProgramDesign/
                                        compareSystemArchitecture — they
                                        already key comparisons on
                                        `fromLabel --> toLabel` only, ignoring
                                        any `label` field, so AC1's "a label
                                        difference alone is not a drift
                                        signal" requirement holds without any
                                        change there.
```

---

## Task 1: `EDGE_RE` recognizes labeled edges and multi-target edges (AC1, AC2, AC4)

**Files:**
- Create: `tests/check-s3-drift-comparator-labeled-multi-target-edges.js`
- Modify: `src/modules/drift-comparator.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-s3-drift-comparator-labeled-multi-target-edges.js`:

```javascript
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
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-s3-drift-comparator-labeled-multi-target-edges.js
```

Expected output: `FAIL` on the AC1-label-capture test (label is `undefined` since `EDGE_RE` doesn't match `-->|label|` syntax at all today — the whole line fails to match `EDGE_RE`, so the edge is silently dropped), `FAIL` on the AC1-MATCHED test (the labeled edge is dropped entirely on the as-designed side, so `compareProgramDesign` sees a missing edge and reports DIVERGED, not MATCHED), `FAIL` on both AC2 and AC3 (the `&`-syntax line doesn't match `EDGE_RE` either, so `A --> B & C` produces zero edges today). AC4 should already pass (no behaviour change to the syntax it covers). Expect `1 passed, 4 failed`.

- [ ] **Step 3: Write minimal implementation**

In `src/modules/drift-comparator.js`, replace `EDGE_RE` (currently ~line 146):

```javascript
const EDGE_RE = /^([A-Za-z0-9_]+)\s*-->\s*(?:\|([^|]*)\|\s*)?([A-Za-z0-9_]+(?:\s*&\s*[A-Za-z0-9_]+)*)\s*$/;
```

Then replace the edge-matching block inside `parseFlowchartMermaid` (currently ~line 181-184):

```javascript
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
```

Then update the edge-building `.map()` (currently ~line 190-192) to carry the optional `label` field through:

```javascript
  const edges = edgeIdPairs.map(function(e) {
    const edge = { from: e.from, to: e.to, fromLabel: labelOf(e.from), toLabel: labelOf(e.to) };
    if (e.label !== undefined) { edge.label = e.label; }
    return edge;
  });
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-s3-drift-comparator-labeled-multi-target-edges.js
```

Expected output: `5 passed, 0 failed`

- [ ] **Step 5: Mutation check (mandatory — this story's own Architecture Constraint)**

Temporarily revert `EDGE_RE` back to its original value (`/^([A-Za-z0-9_]+)\s*-->\s*([A-Za-z0-9_]+)\s*$/`) without reverting the edge-building `.map()` change, then run the test file again:

```bash
node tests/check-s3-drift-comparator-labeled-multi-target-edges.js
```

Expected output (corrected 2026-08-30 after actually running this step — see below): **all 5 tests fail**, not 4. Reverting only `EDGE_RE` while leaving the Step 3 edge-matching block in place means `edgeMatch[3]` is `undefined` for the reverted 2-group regex, so `.split('&')` throws for any line the OLD regex still matches (including AC4's plain `A --> B`) — AC1-label-capture and AC2 still fail cleanly (0 edges, same as Step 2), while AC1-MATCHED, AC3, and now AC4 fail via a crash (`Cannot read properties of undefined (reading 'split')`) rather than a clean assertion mismatch. This is still a valid mutation-kill result — a crash is stronger evidence of genuine coupling between the tests and the code change, not weaker — but it is a different shape of failure than originally predicted here. Do not force the old prediction; report the actual result.

Then restore the Step 3 `EDGE_RE` change and confirm `5 passed, 0 failed` again before proceeding.

- [ ] **Step 6: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing (same 1 pre-existing flake, `check-p3.5-validate-trace.js`, already RISK-ACCEPTed 7 times). Specifically re-confirm `tests/check-csd-s6-drift-signal.js` and `tests/check-csd-s7-as-built-system-architecture-diagram.js` (both call `parseFlowchartMermaid`/`compareProgramDesign` directly) still pass unchanged.

- [ ] **Step 7: Commit**

```bash
git add src/modules/drift-comparator.js tests/check-s3-drift-comparator-labeled-multi-target-edges.js
git commit -m "feat(s3): drift-comparator recognizes labeled and multi-target flowchart edges"
```

---

## After this task: open the draft PR

This story has only one task — the label/multi-target parsing extension and its AC3 integration case are tightly coupled to the same single regex change, and the story's own test plan maps all 4 ACs to this one cohesive unit of work (no separate task boundary is warranted per the plan's own granularity rule: "one AC per task, or one logical behaviour if an AC is broad" — here all 4 ACs ARE one logical behaviour). Once Task 1 is committed and the full suite passes, run `/verify-completion` then `/branch-complete` per the standard inner-loop sequence. Per this story's own NFRs (Audit: N/A, no runtime event), `/verify-completion`'s route/handler E2E coverage check should report N/A — this story touches `src/modules/drift-comparator.js` only, not `src/web-ui/routes/`. Confirm this when actually running that check, do not assume it from this plan alone.
