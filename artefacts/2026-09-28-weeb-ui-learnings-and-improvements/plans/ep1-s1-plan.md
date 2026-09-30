# Signals aggregator module: read all 12 sources and normalize to Signal shape — Implementation Plan

> **For agent execution:** Implemented directly, task by task (/tdd), in this session — no subagent dispatch needed for a single cohesive module.

**Goal:** Build `getSignals(repoPath)`, a server-side module reading all 12 workspace/framework signal sources and returning a normalized, sorted `Signal[]` array, with an injectable file-read adapter (D37) and parse-error surfacing.
**Branch:** `feature/ep1-s1-wuli`
**Worktree:** `.worktrees/ep1-s1`
**Test command:** `node tests/check-ep1-s1-signals-aggregator.js` (this repo's own `run-all-tests.js` auto-discovers any `tests/check-*.js` file — the DoR/test-plan's own suggested name `tests/signals-aggregator.test.js` would NOT be picked up; corrected here)

**Real-format grounding note:** the test plan's own illustrative fixture code (proposals as `proposal-N/rationale.md` + `evidence/` subdirectories; results.tsv as a clean 5-column table) does not match this repo's actual current on-disk shapes (`workspace/proposals/` is a flat directory of `YYYY-MM-DD-*-improve-proposal.md` files; `workspace/results.tsv` is a raw, historically ragged TSV with varying column counts per row; `workspace/traces/` is a flat directory of `*.jsonl` files). Per the story's own Out of Scope ("ep1-s1 uses basic string/JSON parsing; robustness per source is ep2-s1 and successors"), this plan implements tolerant parsing against the REAL current shapes, and this story's own test fixtures are built to match — not the test plan's illustrative-but-inaccurate nested-directory sketch. AC-level behaviour (all 12 sources parsed, normalized shape, parse-error surfacing, sorting, no silent data loss) is unaffected by this correction.

---

## File map

```
Create:
  src/web-ui/modules/signals-aggregator.js   — getSignals(repoPath), injectable file-read adapter (D37), 12-source parsing, sort, error handling
  tests/check-ep1-s1-signals-aggregator.js   — unit + integration tests for all 5 ACs + D37 + canonical-builder check

Modify:
  src/web-ui/server.js                        — wire the real file-read adapter at startup (separate D37 task from the module itself)
```

---

## Task 1: D37 injectable file-read adapter + module skeleton

**Files:**
- Create: `src/web-ui/modules/signals-aggregator.js`
- Test: `tests/check-ep1-s1-signals-aggregator.js`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/check-ep1-s1-signals-aggregator.js (new file — full harness built up across all tasks)
'use strict';
const assert = require('assert');
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
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep1-s1-signals-aggregator.js
```

Expected output: `Cannot find module '../src/web-ui/modules/signals-aggregator'`

- [ ] **Step 3: Write minimal implementation**

```javascript
// src/web-ui/modules/signals-aggregator.js
'use strict';
const path = require('path');

// D37: default stub MUST throw, never return empty/null.
let _fileReadAdapter = function() {
  throw new Error('Adapter not wired: file-read. Call setFileReadAdapter() with a real implementation before use.');
};

function setFileReadAdapter(adapter) { _fileReadAdapter = adapter; }
function _resetFileReadAdapterForTesting() {
  _fileReadAdapter = function() {
    throw new Error('Adapter not wired: file-read. Call setFileReadAdapter() with a real implementation before use.');
  };
}

function getSignals(repoPath) {
  return _fileReadAdapter(repoPath);
}

module.exports = { getSignals, setFileReadAdapter, _resetFileReadAdapterForTesting };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s1-signals-aggregator.js
```

Expected output: `  ✓ D37: default adapter throws when not wired`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (plus the 1 known pre-existing environmental failure, `check-p3.5-validate-trace.js`)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/signals-aggregator.js tests/check-ep1-s1-signals-aggregator.js
git commit -m "feat(ep1-s1): add signals-aggregator module skeleton with D37 adapter"
```

---

## Task 2: Real file-read adapter shape + fs-backed helpers

**Files:**
- Modify: `src/web-ui/modules/signals-aggregator.js`
- Modify: `tests/check-ep1-s1-signals-aggregator.js`

The real adapter reads from disk directly. Rather than one giant `readFile(repoPath)` call, the aggregator internally calls small named read functions (`_readFile(p)`, `_readDir(p)`) that go through the injected adapter — this keeps per-source parsers simple and makes every disk touch mockable.

- [ ] **Step 1: Write the failing test**

```javascript
test('setFileReadAdapter wires a real fs-backed adapter and getSignals runs it', function() {
  const fs = require('fs');
  const os = require('os');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s1-'));
  agg.setFileReadAdapter(agg.createFsFileReadAdapter());
  const signals = agg.getSignals(tmp);
  assert.ok(Array.isArray(signals), 'getSignals must return an array even for an empty workspace');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep1-s1-signals-aggregator.js
```

Expected output: `agg.createFsFileReadAdapter is not a function`

- [ ] **Step 3: Write minimal implementation**

```javascript
// Add to src/web-ui/modules/signals-aggregator.js
const fs = require('fs');

// The real, production file-read adapter -- wired in server.js at startup.
// Shape: { readFile(absPath) -> string, readDir(absPath) -> string[] }
// Both throw on missing path; callers (the per-source parsers) catch and
// convert to parse-error signals -- this adapter itself stays dumb.
function createFsFileReadAdapter() {
  return {
    readFile: function(absPath) { return fs.readFileSync(absPath, 'utf8'); },
    readDir:  function(absPath) { return fs.readdirSync(absPath); },
  };
}

function getSignals(repoPath) {
  const adapter = _fileReadAdapter;
  if (typeof adapter === 'function') {
    // Task 1's legacy throwing-stub shape (a bare function) -- calling it
    // triggers the D37 "not wired" error exactly as before.
    return adapter(repoPath);
  }
  return _aggregateAllSources(repoPath, adapter);
}

function _aggregateAllSources(repoPath, adapter) {
  return []; // populated task by task below
}
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s1-signals-aggregator.js
```

Expected output: both tests `✓`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (plus the known pre-existing failure)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/signals-aggregator.js tests/check-ep1-s1-signals-aggregator.js
git commit -m "feat(ep1-s1): add real fs-backed file-read adapter shape"
```

---

## Task 3: Simple text sources — capture-log, learnings, decisions, estimation-norms, reference, architecture-guardrails

**Files:**
- Modify: `src/web-ui/modules/signals-aggregator.js`
- Modify: `tests/check-ep1-s1-signals-aggregator.js`

These 6 sources are all single markdown/text files, parsed by heading- or entry-boundary splitting. Each parser returns `Signal[]`; a parse failure on the file itself (missing, unreadable) is caught by the CALLER (Task 6), not here.

- [ ] **Step 1: Write the failing test**

```javascript
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
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep1-s1-signals-aggregator.js
```

Expected output: `agg._parseCaptureLog is not a function`

- [ ] **Step 3: Write minimal implementation**

```javascript
// Add to src/web-ui/modules/signals-aggregator.js

function _makeSignal(source, type, text, timestamp, cta) {
  return {
    id: source + '-' + (timestamp || 'no-ts') + '-' + Math.random().toString(36).slice(2, 8),
    source: source,
    type: type,
    text: text,
    timestamp: timestamp || null,
    cta: cta || { label: 'Review', skill: '/improve' },
  };
}

// capture-log.md: "- date: YYYY-MM-DD" blocks, 5 required fields (this
// repo's own /capture schema). Tolerant of quoted or bare signal-text.
function _parseCaptureLog(content) {
  const signals = [];
  const blocks = content.split(/\n(?=- date:)/);
  blocks.forEach(function(block) {
    const dateM = block.match(/date:\s*(\S+)/);
    const typeM = block.match(/signal-type:\s*(\S+)/);
    const textM = block.match(/signal-text:\s*"?([^\n"]+)"?/);
    if (!dateM || !typeM || !textM) return;
    signals.push(_makeSignal('capture-log', typeM[1], textM[1].trim(), dateM[1]));
  });
  return signals;
}

// decisions.md / any markdown file: one signal per top-level "## " heading.
function _parseMarkdownHeadings(content, sourceName) {
  const signals = [];
  const headings = content.split(/\n(?=## )/);
  headings.forEach(function(section) {
    const m = section.match(/^## (.+)$/m);
    if (!m) return;
    signals.push(_makeSignal(sourceName, 'note', m[1].trim(), null));
  });
  return signals;
}

function _parseDecisions(content) { return _parseMarkdownHeadings(content, 'decisions'); }

// estimation-norms.md: markdown table, first column is a date.
function _parseEstimationNorms(content) {
  const signals = [];
  const lines = content.split('\n').filter(function(l) { return l.trim().startsWith('|'); });
  lines.forEach(function(line) {
    const cells = line.split('|').map(function(c) { return c.trim(); }).filter(function(c) { return c.length > 0; });
    if (cells.length < 2) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cells[0])) return; // skip header/separator rows
    signals.push(_makeSignal('estimation', 'actuals', cells.slice(1).join(' / '), cells[0]));
  });
  return signals;
}
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s1-signals-aggregator.js
```

Expected output: all 4 new tests `✓`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (plus the known pre-existing failure)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/signals-aggregator.js tests/check-ep1-s1-signals-aggregator.js
git commit -m "feat(ep1-s1): parse capture-log, decisions, learnings, estimation-norms, reference, architecture-guardrails sources"
```

---

## Task 4: JSON sources — suite.json, pipeline-state.json

**Files:**
- Modify: `src/web-ui/modules/signals-aggregator.js`
- Modify: `tests/check-ep1-s1-signals-aggregator.js`

- [ ] **Step 1: Write the failing test**

```javascript
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
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep1-s1-signals-aggregator.js
```

Expected output: `agg._parseSuiteJson is not a function`

- [ ] **Step 3: Write minimal implementation**

```javascript
// Add to src/web-ui/modules/signals-aggregator.js

function _parseSuiteJson(content) {
  const data = JSON.parse(content); // throws on invalid JSON -- caller catches
  const scenarios = Array.isArray(data.scenarios) ? data.scenarios : [];
  return scenarios.map(function(s) {
    return _makeSignal('suite', 'eval-scenario', s.description || s.taskId || 'unnamed scenario', null,
      { label: 'View scenario', skill: '/improve' });
  });
}

function _parsePipelineState(content) {
  const data = JSON.parse(content); // throws on invalid JSON -- caller catches
  const features = Array.isArray(data.features) ? data.features : [];
  return features.map(function(f) {
    return _makeSignal('pipeline-state', 'feature-status',
      (f.name || f.slug) + ' -- stage: ' + (f.stage || 'unknown'),
      f.updatedAt || null,
      { label: 'Open feature', skill: '/workflow', relatedStory: null, featureSlug: f.slug });
  }).map(function(sig, idx) {
    // context sub-object required by the schema (relatedStory/featureSlug/severity/metadata)
    sig.context = { relatedStory: null, featureSlug: features[idx].slug, severity: null, metadata: null };
    return sig;
  });
}
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s1-signals-aggregator.js
```

Expected output: all 3 new tests `✓`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (plus the known pre-existing failure)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/signals-aggregator.js tests/check-ep1-s1-signals-aggregator.js
git commit -m "feat(ep1-s1): parse suite.json and pipeline-state.json sources"
```

---

## Task 5: Directory-listing sources — proposals, traces, DoD

**Files:**
- Modify: `src/web-ui/modules/signals-aggregator.js`
- Modify: `tests/check-ep1-s1-signals-aggregator.js`

Real shapes (confirmed against this repo's own current disk state): `workspace/proposals/` is a flat directory of `YYYY-MM-DD-*-improve-proposal.md` files (one signal per file); `workspace/traces/` is a flat directory of `*.jsonl` files (one signal per JSONL line, matching the story's own AC1 example of per-line trace signals); `artefacts/*/dod/*.md` files exist per-feature, not under one central directory — this module's `dod` source scans every `artefacts/*/dod/*.md` path.

- [ ] **Step 1: Write the failing test**

```javascript
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
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep1-s1-signals-aggregator.js
```

Expected output: `agg._parseProposalsDir is not a function`

- [ ] **Step 3: Write minimal implementation**

```javascript
// Add to src/web-ui/modules/signals-aggregator.js

function _parseProposalsDir(fileNames) {
  return fileNames.filter(function(f) { return f.endsWith('.md'); }).map(function(f) {
    const dateM = f.match(/^(\d{4}-\d{2}-\d{2})-/);
    return _makeSignal('proposals', 'improve-proposal', f.replace(/\.md$/, ''), dateM ? dateM[1] : null,
      { label: 'Review proposal', skill: '/improve' });
  });
}

// One signal per JSONL line -- malformed lines are skipped (not thrown),
// matching this story's own no-single-bad-line-blocks-others contract.
function _parseTracesFile(content, fileName) {
  const signals = [];
  content.split('\n').forEach(function(line) {
    if (!line.trim()) return;
    try {
      const entry = JSON.parse(line);
      signals.push(_makeSignal('traces', 'trace', (entry.skill || 'unknown') + ': ' + (entry.status || 'unknown'), null,
        { label: 'View trace', skill: '/trace' }));
    } catch (_) { /* malformed line -- skip, do not throw */ }
  });
  return signals;
}

function _parseDodFile(content, filePath) {
  return _parseMarkdownHeadings(content, 'dod-follow-up').map(function(sig) {
    sig.context = { relatedStory: null, featureSlug: null, severity: null, metadata: { file: filePath } };
    return sig;
  });
}
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s1-signals-aggregator.js
```

Expected output: all 3 new tests `✓`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (plus the known pre-existing failure)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/signals-aggregator.js tests/check-ep1-s1-signals-aggregator.js
git commit -m "feat(ep1-s1): parse proposals, traces, and DoD sources"
```

---

## Task 6: results.tsv (ragged/tolerant delimited source)

**Files:**
- Modify: `src/web-ui/modules/signals-aggregator.js`
- Modify: `tests/check-ep1-s1-signals-aggregator.js`

- [ ] **Step 1: Write the failing test**

```javascript
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
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep1-s1-signals-aggregator.js
```

Expected output: `agg._parseResultsTsv is not a function`

- [ ] **Step 3: Write minimal implementation**

```javascript
// Add to src/web-ui/modules/signals-aggregator.js

// results.tsv is a raw, historically ragged TSV -- row shapes vary across
// this file's own history (confirmed by direct inspection: first row has 6
// columns, later rows have up to 13). Tolerant: every non-empty row becomes
// exactly one signal, regardless of column count.
function _parseResultsTsv(content) {
  const signals = [];
  content.split('\n').forEach(function(line) {
    if (!line.trim()) return;
    const cols = line.split('\t');
    const first = cols[0];
    const timestamp = /^\d{4}-\d{2}-\d{2}/.test(first) ? first.slice(0, 10) : null;
    signals.push(_makeSignal('results', 'watermark-row', cols.slice(1, 4).join(' / ') || cols[0], timestamp));
  });
  return signals;
}
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s1-signals-aggregator.js
```

Expected output: `  ✓ parses results.tsv rows tolerantly, including ragged column counts`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (plus the known pre-existing failure)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/signals-aggregator.js tests/check-ep1-s1-signals-aggregator.js
git commit -m "feat(ep1-s1): parse results.tsv tolerantly for ragged historical rows"
```

---

## Task 7: Wire all 12 parsers into `_aggregateAllSources` with parse-error surfacing (AC1, AC2, AC3, AC5)

**Files:**
- Modify: `src/web-ui/modules/signals-aggregator.js`
- Modify: `tests/check-ep1-s1-signals-aggregator.js`

This is the task that actually satisfies AC1 (all 12 sources parsed), AC2 (normalized shape), AC3 (parse errors surfaced as signals, never thrown), and AC5 (no silent data loss) together — the per-source parsers from Tasks 3-6 are pure functions; this task is the orchestration + error-boundary layer around them.

- [ ] **Step 1: Write the failing test**

```javascript
test('AC1/AC3: all 12 sources attempted; a missing/malformed source yields a parse-error signal, not a thrown exception', function() {
  const adapter = {
    readFile: function(p) {
      if (p.indexOf('suite.json') !== -1) return '{not valid json';
      if (p.indexOf('capture-log.md') !== -1) throw new Error('ENOENT: no such file or directory');
      return ''; // every other single-file source: empty but present
    },
    readDir: function(p) { return []; }, // every directory source: empty but present
  };
  agg.setFileReadAdapter(adapter);
  const signals = agg.getSignals('/fake/repo');
  const errors = signals.filter(function(s) { return s.type === 'parse-error'; });
  assert.ok(errors.length >= 2, 'expected parse-error signals for suite.json and capture-log.md, got ' + errors.length);
  assert.ok(errors.some(function(e) { return e.text.indexOf('suite') !== -1; }));
  assert.ok(errors.some(function(e) { return e.text.indexOf('capture-log') !== -1; }));
});

test('AC2: every signal has the required normalized fields', function() {
  const adapter = {
    readFile: function() { return ''; },
    readDir: function() { return []; },
  };
  agg.setFileReadAdapter(adapter);
  const signals = agg.getSignals('/fake/repo');
  signals.forEach(function(s) {
    ['id', 'source', 'type', 'text', 'timestamp', 'cta'].forEach(function(field) {
      assert.ok(field in s, 'signal missing required field "' + field + '": ' + JSON.stringify(s));
    });
    assert.ok('label' in s.cta && 'skill' in s.cta);
  });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep1-s1-signals-aggregator.js
```

Expected output: assertion failures (`_aggregateAllSources` still returns `[]` from Task 2's stub)

- [ ] **Step 3: Write minimal implementation**

```javascript
// Replace the Task-2 stub in src/web-ui/modules/signals-aggregator.js

function _safeParse(sourceName, fn) {
  try {
    return fn();
  } catch (err) {
    return [_makeSignal('parse-error', 'parse-error', sourceName + ': ' + err.message, new Date().toISOString())];
  }
}

function _aggregateAllSources(repoPath, adapter) {
  const p = require('path');
  let signals = [];

  signals = signals.concat(_safeParse('capture-log', function() {
    return _parseCaptureLog(adapter.readFile(p.join(repoPath, 'workspace', 'capture-log.md')));
  }));
  signals = signals.concat(_safeParse('learnings', function() {
    return _parseMarkdownHeadings(adapter.readFile(p.join(repoPath, 'workspace', 'learnings.md')), 'learnings');
  }));
  signals = signals.concat(_safeParse('estimation-norms', function() {
    return _parseEstimationNorms(adapter.readFile(p.join(repoPath, 'workspace', 'estimation-norms.md')));
  }));
  signals = signals.concat(_safeParse('architecture-guardrails', function() {
    return _parseMarkdownHeadings(adapter.readFile(p.join(repoPath, '.github', 'architecture-guardrails.md')), 'architecture-guardrails');
  }));
  signals = signals.concat(_safeParse('suite', function() {
    return _parseSuiteJson(adapter.readFile(p.join(repoPath, 'workspace', 'suite.json')));
  }));
  signals = signals.concat(_safeParse('pipeline-state', function() {
    return _parsePipelineState(adapter.readFile(p.join(repoPath, '.github', 'pipeline-state.json')));
  }));
  signals = signals.concat(_safeParse('results', function() {
    return _parseResultsTsv(adapter.readFile(p.join(repoPath, 'workspace', 'results.tsv')));
  }));
  signals = signals.concat(_safeParse('proposals', function() {
    return _parseProposalsDir(adapter.readDir(p.join(repoPath, 'workspace', 'proposals')));
  }));
  signals = signals.concat(_safeParse('traces', function() {
    const dir = p.join(repoPath, 'workspace', 'traces');
    const files = adapter.readDir(dir);
    let out = [];
    files.forEach(function(f) {
      out = out.concat(_safeParse('traces/' + f, function() { return _parseTracesFile(adapter.readFile(p.join(dir, f)), f); }));
    });
    return out;
  }));
  signals = signals.concat(_safeParse('decisions', function() {
    // decisions.md lives per-feature under artefacts/*/decisions.md -- this
    // source scans every feature's own file, tolerant of any single one
    // being absent (most features have none).
    let out = [];
    let featureDirs = [];
    try { featureDirs = adapter.readDir(p.join(repoPath, 'artefacts')); } catch (_) { return []; }
    featureDirs.forEach(function(dir) {
      out = out.concat(_safeParse('decisions/' + dir, function() {
        return _parseDecisions(adapter.readFile(p.join(repoPath, 'artefacts', dir, 'decisions.md')));
      }));
    });
    return out;
  }));
  signals = signals.concat(_safeParse('dod', function() {
    let out = [];
    let featureDirs = [];
    try { featureDirs = adapter.readDir(p.join(repoPath, 'artefacts')); } catch (_) { return []; }
    featureDirs.forEach(function(dir) {
      out = out.concat(_safeParse('dod/' + dir, function() {
        const dodDir = p.join(repoPath, 'artefacts', dir, 'dod');
        const files = adapter.readDir(dodDir);
        let inner = [];
        files.forEach(function(f) {
          inner = inner.concat(_safeParse('dod/' + dir + '/' + f, function() {
            return _parseDodFile(adapter.readFile(p.join(dodDir, f)), p.join(dir, 'dod', f));
          }));
        });
        return inner;
      }));
    });
    return out;
  }));
  signals = signals.concat(_safeParse('reference', function() {
    let out = [];
    let featureDirs = [];
    try { featureDirs = adapter.readDir(p.join(repoPath, 'artefacts')); } catch (_) { return []; }
    featureDirs.forEach(function(dir) {
      out = out.concat(_safeParse('reference/' + dir, function() {
        const refDir = p.join(repoPath, 'artefacts', dir, 'reference');
        const files = adapter.readDir(refDir);
        let inner = [];
        files.forEach(function(f) {
          inner = inner.concat(_safeParse('reference/' + dir + '/' + f, function() {
            return _parseMarkdownHeadings(adapter.readFile(p.join(refDir, f)), 'archived-ref');
          }));
        });
        return inner;
      }));
    });
    return out;
  }));

  return signals;
}
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s1-signals-aggregator.js
```

Expected output: all new tests `✓`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (plus the known pre-existing failure)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/signals-aggregator.js tests/check-ep1-s1-signals-aggregator.js
git commit -m "feat(ep1-s1): orchestrate all 12 source parsers with per-source error boundaries"
```

---

## Task 8: Sort by timestamp, most recent first (AC4)

**Files:**
- Modify: `src/web-ui/modules/signals-aggregator.js`
- Modify: `tests/check-ep1-s1-signals-aggregator.js`

- [ ] **Step 1: Write the failing test**

```javascript
test('AC4: signals are sorted descending by timestamp; timestampless entries go last, stably', function() {
  const adapter = {
    readFile: function(p) {
      if (p.indexOf('capture-log.md') !== -1) {
        return [
          '- date: 2026-09-26',
          '  session-phase: x', '  signal-type: gap', '  signal-text: "A"', '  source: operator-manual',
          '',
          '- date: 2026-09-28',
          '  session-phase: x', '  signal-type: decision', '  signal-text: "B"', '  source: operator-manual',
        ].join('\n');
      }
      if (p.indexOf('learnings.md') !== -1) return '## No timestamp entry\n\ntext\n';
      return '';
    },
    readDir: function() { return []; },
  };
  agg.setFileReadAdapter(adapter);
  const signals = agg.getSignals('/fake/repo');
  const withTs = signals.filter(function(s) { return s.timestamp; });
  for (let i = 1; i < withTs.length; i++) {
    assert.ok(withTs[i - 1].timestamp >= withTs[i].timestamp, 'not sorted descending at index ' + i);
  }
  const lastTimestamped = signals.map(function(s) { return !!s.timestamp; }).lastIndexOf(true);
  const firstUntimestamped = signals.map(function(s) { return !s.timestamp; }).indexOf(true);
  assert.ok(firstUntimestamped === -1 || firstUntimestamped > lastTimestamped, 'timestampless entries must sort after all timestamped ones');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep1-s1-signals-aggregator.js
```

Expected output: assertion failure — signals returned in source-processing order, not sorted

- [ ] **Step 3: Write minimal implementation**

```javascript
// In getSignals(), wrap the aggregation result:
function getSignals(repoPath) {
  const adapter = _fileReadAdapter;
  if (typeof adapter === 'function') {
    return adapter(repoPath);
  }
  const signals = _aggregateAllSources(repoPath, adapter);
  return _sortSignals(signals);
}

// Stable descending sort by timestamp; entries with no timestamp sort last,
// preserving their relative order (Array.prototype.sort is stable per spec
// since Node 12 -- no secondary key needed).
function _sortSignals(signals) {
  return signals.slice().sort(function(a, b) {
    if (!a.timestamp && !b.timestamp) return 0;
    if (!a.timestamp) return 1;
    if (!b.timestamp) return -1;
    return b.timestamp.localeCompare(a.timestamp);
  });
}
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s1-signals-aggregator.js
```

Expected output: `  ✓ AC4: signals are sorted descending by timestamp; timestampless entries go last, stably`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (plus the known pre-existing failure)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/signals-aggregator.js tests/check-ep1-s1-signals-aggregator.js
git commit -m "feat(ep1-s1): sort aggregated signals descending by timestamp (AC4)"
```

---

## Task 9: Integration test against a real fixture workspace + canonical-builder check

**Files:**
- Modify: `tests/check-ep1-s1-signals-aggregator.js`

- [ ] **Step 1: Write the failing test**

```javascript
test('Integration: real fs-backed adapter against a real temp workspace with all 12 sources present', function() {
  const fs = require('fs');
  const os = require('os');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s1-int-'));
  fs.mkdirSync(path.join(tmp, 'workspace', 'proposals'), { recursive: true });
  fs.mkdirSync(path.join(tmp, 'workspace', 'traces'), { recursive: true });
  fs.mkdirSync(path.join(tmp, '.github'), { recursive: true });
  fs.mkdirSync(path.join(tmp, 'artefacts'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'workspace', 'capture-log.md'), '- date: 2026-09-28\n  session-phase: x\n  signal-type: gap\n  signal-text: "Real gap"\n  source: operator-manual\n');
  fs.writeFileSync(path.join(tmp, 'workspace', 'learnings.md'), '## A learning\n\ntext\n');
  fs.writeFileSync(path.join(tmp, 'workspace', 'estimation-norms.md'), '| Date | X |\n|---|---|\n| 2026-09-01 | y |\n');
  fs.writeFileSync(path.join(tmp, '.github', 'architecture-guardrails.md'), '## ADR-1\n\ntext\n');
  fs.writeFileSync(path.join(tmp, 'workspace', 'suite.json'), JSON.stringify({ scenarios: [{ taskId: 's1', description: 'd1' }] }));
  fs.writeFileSync(path.join(tmp, '.github', 'pipeline-state.json'), JSON.stringify({ features: [{ slug: 'f1', name: 'F1', stage: 'review' }] }));
  fs.writeFileSync(path.join(tmp, 'workspace', 'results.tsv'), '2026-09-01\tf1\tactuals\t1\n');
  fs.writeFileSync(path.join(tmp, 'workspace', 'proposals', '2026-09-01-x-improve-proposal.md'), '# X\n');
  fs.writeFileSync(path.join(tmp, 'workspace', 'traces', 't1.jsonl'), '{"skill":"tdd","status":"completed"}\n');

  agg.setFileReadAdapter(agg.createFsFileReadAdapter());
  const signals = agg.getSignals(tmp);
  const sources = signals.map(function(s) { return s.source; });
  ['capture-log', 'learnings', 'estimation', 'architecture-guardrails', 'suite', 'pipeline-state', 'results', 'proposals', 'traces']
    .forEach(function(expected) {
      assert.ok(sources.indexOf(expected) !== -1, 'expected at least one signal from source "' + expected + '", got sources: ' + sources.join(','));
    });
  assert.ok(signals.every(function(s) { return s.type !== 'parse-error'; }), 'no parse-error signals expected against fully valid fixture');

  fs.rmSync(tmp, { recursive: true });
});

test('ADR-028 canonical builder: no other src/ file independently reads workspace/capture-log.md', function() {
  const fs = require('fs');
  const { execSync } = require('child_process');
  const out = execSync('grep -rl "capture-log.md" src/ 2>/dev/null || true').toString().trim();
  const offenders = out.split('\n').filter(function(f) { return f && f.indexOf('signals-aggregator.js') === -1; });
  assert.strictEqual(offenders.length, 0, 'unexpected files independently referencing capture-log.md: ' + offenders.join(', '));
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep1-s1-signals-aggregator.js
```

Expected output: likely passes already if Tasks 1-8 are correctly wired (this is the confirmation test); if the real fs adapter has a path bug, the specific missing source name is printed

- [ ] **Step 3: Write minimal implementation**

No new implementation code — this task is confirmation-only. If it fails, fix the specific parser/path bug it names (do not add new scope).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s1-signals-aggregator.js
```

Expected output: `[ep1-s1] Results: N passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (plus the known pre-existing failure)

- [ ] **Step 6: Commit**

```bash
git add tests/check-ep1-s1-signals-aggregator.js
git commit -m "test(ep1-s1): add real-workspace integration test and ADR-028 canonical-builder check"
```

---

## Task 10: Wire the real adapter in server.js (D37 production wiring — separate task per D37 rule)

**Files:**
- Modify: `src/web-ui/server.js`

Per D37: production wiring is a separate task from the module/handler itself, and its own test must assert behavioural correctness, not just that a function reference was assigned.

- [ ] **Step 1: Write the failing test**

```javascript
// Append to tests/check-ep1-s1-signals-aggregator.js
test('server.js wires the real fs-backed adapter at startup (not just imports the module)', function() {
  const fs = require('fs');
  const serverSrc = fs.readFileSync(require('path').join(__dirname, '..', 'src', 'web-ui', 'server.js'), 'utf8');
  assert.ok(serverSrc.indexOf("require('./modules/signals-aggregator')") !== -1 || serverSrc.indexOf('require("./modules/signals-aggregator")') !== -1,
    'server.js must require signals-aggregator.js');
  assert.ok(serverSrc.indexOf('setFileReadAdapter(') !== -1 && serverSrc.indexOf('createFsFileReadAdapter()') !== -1,
    'server.js must call setFileReadAdapter(createFsFileReadAdapter()) at startup, not just import the module');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep1-s1-signals-aggregator.js
```

Expected output: `✗ server.js wires the real fs-backed adapter at startup`

- [ ] **Step 3: Write minimal implementation**

```javascript
// In src/web-ui/server.js, near the other module-level D37 adapter wiring
// calls made at startup (grep for an existing "setXAdapter(" call to find
// the right location and follow its exact placement convention):
const signalsAggregator = require('./modules/signals-aggregator');
signalsAggregator.setFileReadAdapter(signalsAggregator.createFsFileReadAdapter());
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s1-signals-aggregator.js
```

Expected output: `  ✓ server.js wires the real fs-backed adapter at startup`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (plus the known pre-existing failure)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js tests/check-ep1-s1-signals-aggregator.js
git commit -m "feat(ep1-s1): wire the real signals-aggregator file-read adapter in server.js"
```

---

## Task 11: Performance check (NFR — <200ms)

**Files:**
- Modify: `tests/check-ep1-s1-signals-aggregator.js`

- [ ] **Step 1: Write the failing test**

```javascript
test('NFR: aggregation completes in under 200ms for the real current repo workspace', function() {
  agg.setFileReadAdapter(agg.createFsFileReadAdapter());
  const repoRoot = require('path').join(__dirname, '..');
  const start = Date.now();
  agg.getSignals(repoRoot);
  const duration = Date.now() - start;
  assert.ok(duration < 200, 'expected <200ms, took ' + duration + 'ms');
});
```

- [ ] **Step 2: Run test — must fail (or pass; this is a measurement, not new behaviour)**

```bash
node tests/check-ep1-s1-signals-aggregator.js
```

Expected output: either passes immediately (aggregation is already fast enough) or reports the real duration, which then must be optimized (e.g. skip the artefacts/ full scan for decisions/dod/reference if it dominates the time) without changing any AC's behaviour

- [ ] **Step 3: Write minimal implementation (only if Step 2 shows a real regression)**

No code shown here — if the real measurement exceeds 200ms, the fix is scoped narrowly to whichever source scan is slow (most likely the `artefacts/*/` directory walk for decisions/dod/reference) and must not change parsing output, only reduce redundant disk calls (e.g. read the `artefacts/` directory listing once and reuse it across the 3 per-feature scans instead of 3 separate reads).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s1-signals-aggregator.js
```

Expected output: `  ✓ NFR: aggregation completes in under 200ms for the real current repo workspace`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (plus the known pre-existing failure)

- [ ] **Step 6: Commit**

```bash
git add tests/check-ep1-s1-signals-aggregator.js
git commit -m "test(ep1-s1): confirm aggregation performance against the real repo workspace"
```

---

<!-- End of plan. 11 tasks covering AC1-AC5, the D37 adapter (module + separate server.js wiring), the ADR-028 canonical-builder check, and the NFR performance check. -->
