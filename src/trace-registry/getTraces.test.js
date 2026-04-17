#!/usr/bin/env node
/**
 * getTraces.test.js
 *
 * Unit tests for the getTraces() cross-team trace registry module (p3.7).
 *
 * Tests from the test plan:
 *   - get-traces-returns-matching-squad            (AC2 — filter by squadId)
 *   - get-traces-filter-by-date-range              (AC2 — filter by dateFrom)
 *   - get-traces-filter-by-pass-rate               (AC2 — passRate filter)
 *   - get-traces-returns-empty-array-for-no-match  (AC2 — empty result contract)
 *   - get-traces-returns-empty-for-unregistered-squad (AC5 — unregistered squad)
 *   - get-traces-handles-empty-registry-directory  (NFR — graceful on absent registry)
 *
 * Run:  node src/trace-registry/getTraces.test.js
 * Used: npm test (via check-trace-registry.js)
 *
 * Zero external dependencies — plain Node.js (fs, path, os) only.
 */
'use strict';

var fs   = require('fs');
var path = require('path');
var os   = require('os');

var { getTraces } = require('./getTraces.js');

var passed   = 0;
var failed   = 0;
var failures = [];

function pass(name) { process.stdout.write('  ✓ ' + name + '\n'); passed++; }
function fail(name, reason) {
  process.stderr.write('  ✗ ' + name + '\n');
  process.stderr.write('      ' + reason + '\n');
  failed++;
  failures.push(name + ': ' + reason);
}

// ── Helper: create a temp registry with fixture traces ──────────────────────

function makeRegistry(spec) {
  var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trace-reg-'));
  for (var squadId in spec) {
    var squadDir = path.join(tmpDir, squadId);
    fs.mkdirSync(squadDir, { recursive: true });
    var stories = spec[squadId];
    for (var storySlug in stories) {
      var lines = stories[storySlug];
      var content = lines.map(function (obj) { return JSON.stringify(obj); }).join('\n') + '\n';
      fs.writeFileSync(path.join(squadDir, storySlug + '.jsonl'), content, 'utf8');
    }
  }
  return tmpDir;
}

// ── Test: filter by squadId ──────────────────────────────────────────────────
(function test_filter_by_squad_id() {
  var name = 'get-traces-returns-matching-squad';
  var reg = makeRegistry({
    'squad-alpha': { 'story-feature-x': [
      { storySlug: 'story-feature-x', passRate: 100, aggregatedAt: '2026-04-10' },
      { storySlug: 'story-feature-x', passRate: 95,  aggregatedAt: '2026-04-11' },
    ]},
    'squad-beta': { 'story-feature-y': [
      { storySlug: 'story-feature-y', passRate: 100, aggregatedAt: '2026-03-15' },
    ]},
  });
  try {
    var result = getTraces({ squadId: 'squad-alpha', registryDir: reg });
    var hasAlpha = result.every(function (e) { return e._squadId === 'squad-alpha'; });
    var hasBeta  = result.some(function (e)  { return e._squadId === 'squad-beta'; });
    if (result.length >= 2 && hasAlpha && !hasBeta) {
      pass(name);
    } else {
      fail(name, 'Expected squad-alpha entries only; got: ' + JSON.stringify(result));
    }
  } finally {
    try { fs.rmSync(reg, { recursive: true, force: true }); } catch (_) {}
  }
})();

// ── Test: filter by date range ────────────────────────────────────────────────
(function test_filter_by_date() {
  var name = 'get-traces-filter-by-date-range';
  var reg = makeRegistry({
    'squad-alpha': {
      'story-feature-x': [
        { storySlug: 'story-feature-x', passRate: 100, aggregatedAt: '2026-04-10' },
      ],
      'story-feature-y': [
        { storySlug: 'story-feature-y', passRate: 100, aggregatedAt: '2026-03-15' },
      ],
    },
  });
  try {
    var result = getTraces({ registryDir: reg, filter: { dateFrom: '2026-04-01' } });
    var marchEntry = result.some(function (e) { return e.aggregatedAt === '2026-03-15'; });
    var aprilEntry = result.some(function (e) { return e.aggregatedAt === '2026-04-10'; });
    if (aprilEntry && !marchEntry) {
      pass(name);
    } else {
      fail(name, 'Expected April entry only after date filter; got: ' + JSON.stringify(result));
    }
  } finally {
    try { fs.rmSync(reg, { recursive: true, force: true }); } catch (_) {}
  }
})();

// ── Test: filter by passRate ──────────────────────────────────────────────────
(function test_filter_by_pass_rate() {
  var name = 'get-traces-filter-by-pass-rate';
  var reg = makeRegistry({
    'squad-alpha': {
      'story-high': [{ storySlug: 'story-high', passRate: 100, aggregatedAt: '2026-04-01' }],
      'story-low':  [{ storySlug: 'story-low',  passRate: 60,  aggregatedAt: '2026-04-02' }],
    },
  });
  try {
    var result = getTraces({ squadId: 'squad-alpha', registryDir: reg, filter: { passRate: '>= 90' } });
    var has100  = result.some(function (e) { return e.passRate === 100; });
    var has60   = result.some(function (e) { return e.passRate === 60; });
    if (has100 && !has60) {
      pass(name);
    } else {
      fail(name, 'Expected passRate:100 only; got: ' + JSON.stringify(result));
    }
  } finally {
    try { fs.rmSync(reg, { recursive: true, force: true }); } catch (_) {}
  }
})();

// ── Test: returns [] for no-match storySlug ───────────────────────────────────
(function test_empty_on_no_match() {
  var name = 'get-traces-returns-empty-array-for-no-match';
  var reg = makeRegistry({
    'squad-alpha': { 'story-feature-x': [{ storySlug: 'story-feature-x', passRate: 100, aggregatedAt: '2026-04-10' }] },
  });
  try {
    var result = getTraces({ squadId: 'squad-alpha', registryDir: reg, filter: { storySlug: 'nonexistent-story' } });
    if (Array.isArray(result) && result.length === 0) {
      pass(name);
    } else {
      fail(name, 'Expected [], got: ' + JSON.stringify(result));
    }
  } finally {
    try { fs.rmSync(reg, { recursive: true, force: true }); } catch (_) {}
  }
})();

// ── Test: unregistered squad returns [] ──────────────────────────────────────
(function test_unregistered_squad() {
  var name = 'get-traces-returns-empty-for-unregistered-squad';
  var reg = makeRegistry({
    'squad-alpha': { 'story-x': [{ storySlug: 'story-x', passRate: 100, aggregatedAt: '2026-04-01' }] },
  });
  try {
    var result = getTraces({ squadId: 'squad-gamma', registryDir: reg });
    if (Array.isArray(result) && result.length === 0) {
      pass(name);
    } else {
      fail(name, 'Expected [] for unregistered squad; got: ' + JSON.stringify(result));
    }
  } finally {
    try { fs.rmSync(reg, { recursive: true, force: true }); } catch (_) {}
  }
})();

// ── Test: returns [] for absent registry directory ────────────────────────────
(function test_absent_registry() {
  var name = 'get-traces-handles-empty-registry-directory';
  var result;
  try {
    result = getTraces({ squadId: 'any-squad', registryDir: '/nonexistent/path/that/does/not/exist' });
  } catch (e) {
    fail(name, 'getTraces threw on absent directory: ' + e.message);
    return;
  }
  if (Array.isArray(result) && result.length === 0) {
    pass(name);
  } else {
    fail(name, 'Expected [], got: ' + JSON.stringify(result));
  }
})();

// ── Summary ───────────────────────────────────────────────────────────────────
process.stdout.write('\n');
process.stdout.write('getTraces.test: ' + passed + ' passed, ' + failed + ' failed\n');
if (failed > 0) {
  process.stderr.write('FAILED:\n');
  failures.forEach(function (f) { process.stderr.write('  - ' + f + '\n'); });
  process.exit(1);
}
