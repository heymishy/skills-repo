'use strict';
// check-sdg6-metrics-recording.js — TDD unit tests for sdg.6 (Callout marker
// detection and metrics recording).
// Tests: T1-T10, per artefacts/2026-06-21-strategy-and-data-hub/test-plans/sdg.6-test-plan.md
//   AC1->T1  AC2/NFR-LITERAL->T2,T3  AC3->T4,T5  AC4->T6,T9  AC5->T7  AC6->T8  NFR-APPEND->T10
// All tests FAIL until src/web-ui/modules/strategy-metrics.js is implemented.

var assert = require('assert');
var path   = require('path');
var fs     = require('fs');
var os     = require('os');

var MODULE_PATH = path.join(__dirname, '..', 'src', 'web-ui', 'modules', 'strategy-metrics.js');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    var r = fn();
    if (r && typeof r.then === 'function') {
      return r.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.message || String(err))); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.message || String(err))); return Promise.resolve();
  }
}

function freshMetrics() {
  delete require.cache[require.resolve(MODULE_PATH)];
  return require(MODULE_PATH);
}

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sdg6-test-'));
}

Promise.resolve()
  // ── T1 — metrics file created with empty array if absent (AC1) ─────────────
  .then(function() { return test('T1: metrics-file-created-with-empty-array-if-absent', function() {
    var tmpDir = makeTmpDir();
    try {
      var mod = freshMetrics();
      mod.initMetricsFile(tmpDir);
      var filePath = path.join(tmpDir, 'strategy-metrics.json');
      assert.ok(fs.existsSync(filePath), 'strategy-metrics.json must be created');
      var parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      assert.deepStrictEqual(parsed, { metrics: [] }, 'initial content must be {"metrics":[]}');
      // Idempotent -- calling twice must not throw or reset existing content
      mod.recordMetrics(tmpDir, { featureSlug: 'f', stage: 'ideate', hasReferenceFiles: false, referenceFileCount: 0, referenceFileNames: [], calloutCount: 0, totalSections: 3 });
      mod.initMetricsFile(tmpDir);
      var afterSecondInit = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      assert.strictEqual(afterSecondInit.metrics.length, 1, 'second initMetricsFile call must not reset existing entries');
    } finally { fs.rmSync(tmpDir, { recursive: true, force: true }); }
  }); })

  // ── T2 — literal, case-sensitive callout marker detection (AC2, NFR-LITERAL) ─
  .then(function() { return test('T2: detect-callout-markers-counts-literal-occurrences', function() {
    var mod = freshMetrics();
    var result = mod.detectCalloutMarkers('Some text [Grounded in: strategy.md] and [Grounded in: data.md] and [grounded in: other.md].');
    assert.strictEqual(result.count, 2, 'must count only the 2 literal-case matches, not the lowercase one');
    assert.deepStrictEqual(result.filenames, ['strategy.md', 'data.md']);
  }); })

  // ── T3 — zero markers present (AC2) ─────────────────────────────────────────
  .then(function() { return test('T3: detect-callout-markers-returns-zero-when-none-present', function() {
    var mod = freshMetrics();
    var result = mod.detectCalloutMarkers('Clean artefact text with no markers.');
    assert.strictEqual(result.count, 0);
    assert.deepStrictEqual(result.filenames, []);
  }); })

  // ── T4 — recordMetrics appends entry with correct structure (AC3) ───────────
  .then(function() { return test('T4: record-metrics-appends-entry-with-correct-structure', function() {
    var tmpDir = makeTmpDir();
    try {
      var mod = freshMetrics();
      mod.initMetricsFile(tmpDir);
      mod.recordMetrics(tmpDir, {
        featureSlug: 'test-feat', stage: 'ideate', hasReferenceFiles: true,
        referenceFileCount: 2, referenceFileNames: ['strategy.md', 'data.md'],
        calloutCount: 4, totalSections: 8
      });
      var parsed = JSON.parse(fs.readFileSync(path.join(tmpDir, 'strategy-metrics.json'), 'utf8'));
      assert.strictEqual(parsed.metrics.length, 1);
      var entry = parsed.metrics[0];
      assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(entry.date), 'date must be ISO 8601');
      assert.strictEqual(entry.featureSlug, 'test-feat');
      assert.strictEqual(entry.stage, 'ideate');
      assert.strictEqual(entry.hasReferenceFiles, true);
      assert.strictEqual(entry.referenceFileCount, 2);
      assert.deepStrictEqual(entry.referenceFileNames, ['strategy.md', 'data.md']);
      assert.strictEqual(entry.calloutCount, 4);
      assert.strictEqual(entry.totalSections, 8);
      assert.strictEqual(entry.calloutRate, 0.5);
    } finally { fs.rmSync(tmpDir, { recursive: true, force: true }); }
  }); })

  // ── T5 — calloutRate computed and rounded correctly (AC3) ───────────────────
  .then(function() { return test('T5: callout-rate-computed-correctly', function() {
    var tmpDir = makeTmpDir();
    try {
      var mod = freshMetrics();
      mod.initMetricsFile(tmpDir);
      mod.recordMetrics(tmpDir, {
        featureSlug: 'f', stage: 'discovery', hasReferenceFiles: true,
        referenceFileCount: 1, referenceFileNames: ['x.md'],
        calloutCount: 3, totalSections: 5
      });
      var parsed = JSON.parse(fs.readFileSync(path.join(tmpDir, 'strategy-metrics.json'), 'utf8'));
      assert.strictEqual(parsed.metrics[0].calloutRate, 0.6, '3/5 must round to 0.6');
    } finally { fs.rmSync(tmpDir, { recursive: true, force: true }); }
  }); })

  // ── T6 — completion summary includes the metrics line (AC4) ─────────────────
  .then(function() { return test('T6: session-completion-summary-includes-metrics-line', function() {
    var mod = freshMetrics();
    var summary = mod.buildCompletionSummary({ calloutCount: 3, totalSections: 8, hasReferenceFiles: true });
    assert.ok(/cited in 3\/8 sections/i.test(summary), 'must mention "cited in 3/8 sections"; got: ' + summary);
  }); })

  // ── T7 — no-reference-files session tracked correctly (AC5) ─────────────────
  .then(function() { return test('T7: no-reference-files-session-tracked-with-has-reference-files-false', function() {
    var tmpDir = makeTmpDir();
    try {
      var mod = freshMetrics();
      mod.initMetricsFile(tmpDir);
      mod.recordMetrics(tmpDir, {
        featureSlug: 'test-feat', stage: 'discovery', hasReferenceFiles: false,
        referenceFileCount: 0, referenceFileNames: [], calloutCount: 0, totalSections: 6
      });
      var parsed = JSON.parse(fs.readFileSync(path.join(tmpDir, 'strategy-metrics.json'), 'utf8'));
      var entry = parsed.metrics[0];
      assert.strictEqual(entry.hasReferenceFiles, false);
      assert.strictEqual(entry.calloutCount, 0);
      assert.strictEqual(entry.calloutRate, 0);
    } finally { fs.rmSync(tmpDir, { recursive: true, force: true }); }
  }); })

  // ── T8 — each artefact gets an independent entry, no aggregation (AC6) ──────
  .then(function() { return test('T8: each-artefact-gets-independent-entry', function() {
    var tmpDir = makeTmpDir();
    try {
      var mod = freshMetrics();
      mod.initMetricsFile(tmpDir);
      mod.recordMetrics(tmpDir, { featureSlug: 'f', stage: 'ideate', hasReferenceFiles: true, referenceFileCount: 1, referenceFileNames: ['a.md'], calloutCount: 2, totalSections: 5 });
      mod.recordMetrics(tmpDir, { featureSlug: 'f', stage: 'discovery', hasReferenceFiles: true, referenceFileCount: 1, referenceFileNames: ['a.md'], calloutCount: 5, totalSections: 8 });
      var parsed = JSON.parse(fs.readFileSync(path.join(tmpDir, 'strategy-metrics.json'), 'utf8'));
      assert.strictEqual(parsed.metrics.length, 2, 'must have exactly 2 independent entries');
      assert.strictEqual(parsed.metrics[0].stage, 'ideate');
      assert.strictEqual(parsed.metrics[0].calloutCount, 2);
      assert.strictEqual(parsed.metrics[1].stage, 'discovery');
      assert.strictEqual(parsed.metrics[1].calloutCount, 5);
    } finally { fs.rmSync(tmpDir, { recursive: true, force: true }); }
  }); })

  // ── T9 — no-reference-files completion summary message (AC4, AC5) ──────────
  .then(function() { return test('T9: session-completion-summary-no-reference-files-message', function() {
    var mod = freshMetrics();
    var summary = mod.buildCompletionSummary({ hasReferenceFiles: false });
    assert.ok(/No strategy grounding used in this session/i.test(summary), 'got: ' + summary);
  }); })

  // ── T10 — append never mutates prior entries (NFR-APPEND) ───────────────────
  .then(function() { return test('T10: metrics-append-does-not-mutate-prior-entries', function() {
    var tmpDir = makeTmpDir();
    try {
      fs.writeFileSync(path.join(tmpDir, 'strategy-metrics.json'), JSON.stringify({
        metrics: [{ featureSlug: 'prior', stage: 'ideate', hasReferenceFiles: true, referenceFileCount: 1, referenceFileNames: ['p.md'], calloutCount: 7, totalSections: 10, calloutRate: 0.7, date: '2026-01-01T00:00:00.000Z' }]
      }), 'utf8');
      var mod = freshMetrics();
      mod.recordMetrics(tmpDir, { featureSlug: 'f', stage: 'discovery', hasReferenceFiles: true, referenceFileCount: 1, referenceFileNames: ['q.md'], calloutCount: 2, totalSections: 4 });
      var parsed = JSON.parse(fs.readFileSync(path.join(tmpDir, 'strategy-metrics.json'), 'utf8'));
      assert.strictEqual(parsed.metrics.length, 2);
      assert.strictEqual(parsed.metrics[0].featureSlug, 'prior', 'prior entry must be unchanged');
      assert.strictEqual(parsed.metrics[0].calloutCount, 7, 'prior entry\'s calloutCount must be unmodified');
      assert.strictEqual(parsed.metrics[1].featureSlug, 'f', 'new entry must be appended second');
    } finally { fs.rmSync(tmpDir, { recursive: true, force: true }); }
  }); })

  .then(function() {
    console.log('\n[sdg6-metrics-recording] Results: ' + passed + ' passed, ' + failed + ' failed');
    if (failures.length) { failures.forEach(function(f) { console.log('  FAILED: ' + f.name); }); process.exit(1); }
  });
