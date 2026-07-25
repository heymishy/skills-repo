#!/usr/bin/env node
// check-acv-s1-loud-story-creation-warning.js — TDD tests for acv-s1
// Tests: AC1–AC4 — `skills advance` must make new-story creation loudly
// observable (distinct stdout prefix + stderr warning) while leaving the
// existing-story update path byte-identical, and leaving creation itself
// permitted per CLAUDE.md cdg.6.
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT   = path.join(__dirname, '..');
const MODULE = path.join(ROOT, 'src', 'enforcement', 'cli-advance.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log('  ✓ ' + label); passed++; }
  else           { console.log('  ✗ ' + label); failed++; }
}

function loadModule() {
  if (!fs.existsSync(MODULE)) return null;
  try {
    delete require.cache[require.resolve(MODULE)];
    return require(MODULE);
  } catch (_) { return null; }
}

// ── Fixture helpers (mirrors check-cdg6-advance-enhancements.js) ──────────────

function makeTmpDir(suffix) {
  return fs.mkdtempSync(path.join(ROOT, '.tmp-test-acv1-' + suffix + '-'));
}

function writeFixture(tmpDir, features) {
  var ghDir = path.join(tmpDir, '.github');
  fs.mkdirSync(ghDir, { recursive: true });
  var state = { schemaVersion: '1', features: features };
  fs.writeFileSync(
    path.join(ghDir, 'pipeline-state.json'),
    JSON.stringify(state, null, 2) + '\n',
    'utf8'
  );
}

function readFixture(tmpDir) {
  return JSON.parse(
    fs.readFileSync(path.join(tmpDir, '.github', 'pipeline-state.json'), 'utf8')
  );
}

// ── AC1a — existing flat story match: unchanged stdout, empty stderr ──────────
console.log('\n[acv-s1] AC1a — existing flat story match → unchanged "Advanced: " stdout, empty stderr');
{
  var tmpDir = makeTmpDir('ac1a');
  writeFixture(tmpDir, [{
    slug: 'feat-flat', id: 'feat-flat', name: 'Feature Flat',
    stories: [{ slug: 'my-story', id: 'my-story', name: 'Story' }]
  }]);
  var mod = loadModule();
  var result = null;
  if (mod) {
    try { result = mod.advance('feat-flat', 'my-story', ['prStatus=open'], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 0, 'AC1a-1: exitCode 0');
  assert(result !== null && typeof result.stdout === 'string' && result.stdout.indexOf('Advanced: ') === 0,
    'AC1a-2: stdout starts with "Advanced: "');
  assert(result !== null && result.stderr === '', 'AC1a-3: stderr is empty');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── AC1b — existing epic-nested story match: unchanged stdout, empty stderr ───
console.log('\n[acv-s1] AC1b — existing epic-nested story match → unchanged "Advanced: " stdout, empty stderr');
{
  var tmpDir = makeTmpDir('ac1b');
  writeFixture(tmpDir, [{
    slug: 'feat-epic', id: 'feat-epic', name: 'Feature Epic',
    stories: [],
    epics: [{ slug: 'epic-1', id: 'epic-1', name: 'Epic 1', stories: [
      { slug: 'my-epic-story', id: 'my-epic-story', name: 'Story' }
    ]}]
  }]);
  var mod = loadModule();
  var result = null;
  if (mod) {
    try { result = mod.advance('feat-epic', 'my-epic-story', ['prStatus=open'], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 0, 'AC1b-1: exitCode 0');
  assert(result !== null && typeof result.stdout === 'string' && result.stdout.indexOf('Advanced: ') === 0,
    'AC1b-2: stdout starts with "Advanced: "');
  assert(result !== null && result.stderr === '', 'AC1b-3: stderr is empty');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── AC2 — no match → loud stderr warning + distinct stdout prefix ─────────────
console.log('\n[acv-s1] AC2 — no match anywhere → loud stderr warning + distinct stdout prefix');
{
  var tmpDir = makeTmpDir('ac2');
  writeFixture(tmpDir, [{
    slug: 'feat-typo', id: 'feat-typo', name: 'Feature Typo',
    stories: [],
    epics: [{ slug: 'epic-1', id: 'epic-1', name: 'Epic 1', stories: [
      { slug: 'other-story', id: 'other-story', name: 'Other' }
    ]}]
  }]);
  var mod = loadModule();
  var result = null;
  if (mod) {
    try { result = mod.advance('feat-typo', 'typo-id', ['prStatus=open'], tmpDir); } catch (_) {}
  }
  // Write behaviour unchanged: a new story record IS created
  var after = readFixture(tmpDir);
  var created = (after.features[0].stories || []).find(function(s) {
    return s.id === 'typo-id' || s.slug === 'typo-id';
  });
  assert(created !== undefined && created.prStatus === 'open', 'AC2a: new story record created (write behaviour unchanged)');
  assert(result !== null && typeof result.stderr === 'string' &&
    result.stderr.indexOf('feat-typo') !== -1 && result.stderr.indexOf('typo-id') !== -1,
    'AC2b: stderr names the feature slug and the unmatched story id');
  assert(result !== null && /warning/i.test(result.stderr), 'AC2c: stderr is clearly labelled as a warning');
  assert(result !== null && typeof result.stdout === 'string' && result.stdout.indexOf('Advanced: ') !== 0,
    'AC2d: stdout is NOT the plain "Advanced: " message');
  assert(result !== null && result.stdout.indexOf('Created NEW story record') !== -1,
    'AC2e: stdout is prefixed distinctly (e.g. "Created NEW story record")');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── AC3 — no-match case still exits 0 ──────────────────────────────────────────
console.log('\n[acv-s1] AC3 — no-match case still exits 0');
{
  var tmpDir = makeTmpDir('ac3');
  writeFixture(tmpDir, [{
    slug: 'feat-exit', id: 'feat-exit', name: 'Feature Exit',
    stories: []
  }]);
  var mod = loadModule();
  var result = null;
  if (mod) {
    try { result = mod.advance('feat-exit', 'brand-new-id', ['prStatus=open'], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 0, 'AC3: exitCode 0 even though a new record was created');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── AC4 — feature-only fields never trigger story lookup/warning ──────────────
console.log('\n[acv-s1] AC4 — feature-only fields never trigger story lookup or warning');
{
  var tmpDir = makeTmpDir('ac4');
  writeFixture(tmpDir, [{
    slug: 'feat-only', id: 'feat-only', name: 'Feature Only',
    stories: []
  }]);
  var mod = loadModule();
  var result = null;
  if (mod) {
    try { result = mod.advance('feat-only', 'any-story-id-even-nonexistent', ['feature.health=green'], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 0, 'AC4a: exitCode 0');
  assert(result !== null && result.stderr === '', 'AC4b: stderr is empty — no warning fires');
  var after = readFixture(tmpDir);
  assert(after.features[0].health === 'green', 'AC4c: feature-scoped field applied');
  assert((after.features[0].stories || []).length === 0,
    'AC4d: no new entry appears in feature.stories[] — story lookup never happened');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

console.log('\n[acv-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
