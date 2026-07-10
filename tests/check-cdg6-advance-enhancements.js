#!/usr/bin/env node
// check-cdg6-advance-enhancements.js — TDD tests for cdg.6
// Tests: T1–T13 (epic-nested lookup, dot-notation, integer coercion, prototype guard, governance)
// All tests against the three new capabilities FAIL until src/enforcement/cli-advance.js is updated.
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT   = path.join(__dirname, '..');
const MODULE = path.join(ROOT, 'src', 'enforcement', 'cli-advance.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log('  \u2713 ' + label); passed++; }
  else           { console.log('  \u2717 ' + label); failed++; }
}

function loadModule() {
  if (!fs.existsSync(MODULE)) return null;
  try {
    delete require.cache[require.resolve(MODULE)];
    return require(MODULE);
  } catch (_) { return null; }
}

// ── Fixture helpers ───────────────────────────────────────────────────────────

function makeTmpDir(suffix) {
  return fs.mkdtempSync(path.join(ROOT, '.tmp-test-cdg6-' + suffix + '-'));
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

// ── T1 — AC1: Epic-nested story is found and updated in place ─────────────────
console.log('\n[cdg6] T1 — AC1: epic-nested story found + updated, no phantom flat entry');
{
  var tmpDir = makeTmpDir('t1');
  writeFixture(tmpDir, [{
    slug: 'feat-a', id: 'feat-a', name: 'Feature A',
    stories: [],
    epics: [{ slug: 'epic-1', id: 'epic-1', name: 'Epic 1', stories: [
      { slug: 'cdg.6-t1', id: 'cdg.6-t1', name: 'Story' }
    ]}]
  }]);
  var mod = loadModule();
  var result = null;
  if (mod) {
    try { result = mod.advance('feat-a', 'cdg.6-t1', ['stage=definition-of-done'], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 0, 'T1a: exitCode 0 for epic-nested story');
  var after = readFixture(tmpDir);
  var epicStory = ((after.features[0].epics || [])[0].stories || []).find(function(s) {
    return s.slug === 'cdg.6-t1' || s.id === 'cdg.6-t1';
  });
  assert(epicStory !== undefined && epicStory.stage === 'definition-of-done',
    'T1b: epic-nested story has stage=definition-of-done');
  assert((after.features[0].stories || []).length === 0,
    'T1c: feature.stories[] is empty — no phantom flat entry');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T2 — AC1: Round-trip disk check — no phantom flat entry ───────────────────
console.log('\n[cdg6] T2 — AC1: round-trip disk check — epic-nested update persists, no phantom');
{
  var tmpDir = makeTmpDir('t2');
  writeFixture(tmpDir, [{
    slug: 'feat-b', id: 'feat-b', name: 'Feature B',
    stories: [],
    epics: [{ slug: 'epic-1', id: 'epic-1', name: 'Epic 1', stories: [
      { slug: 'cdg.6-t2', id: 'cdg.6-t2', name: 'Story', stage: 'branch-setup' }
    ]}]
  }]);
  var mod = loadModule();
  var result = null;
  if (mod) {
    try { result = mod.advance('feat-b', 'cdg.6-t2', ['prStatus=draft'], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 0, 'T2a: exitCode 0');
  var disk = readFixture(tmpDir);
  var epicSt = ((disk.features[0].epics || [])[0].stories || []).find(function(s) {
    return s.slug === 'cdg.6-t2' || s.id === 'cdg.6-t2';
  });
  assert(epicSt !== undefined && epicSt.prStatus === 'draft',
    'T2b: disk file has epic-nested story with prStatus=draft');
  var flatMatches = (disk.features[0].stories || []).filter(function(s) {
    return s.id === 'cdg.6-t2' || s.slug === 'cdg.6-t2';
  });
  assert(flatMatches.length === 0, 'T2c: no phantom flat entry in feature.stories[]');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T3 — AC2: Flat story lookup is unchanged (non-regression) ─────────────────
console.log('\n[cdg6] T3 — AC2: flat story lookup non-regression');
{
  var tmpDir = makeTmpDir('t3');
  writeFixture(tmpDir, [{
    slug: 'feat-c', id: 'feat-c', name: 'Feature C',
    stories: [{ slug: 'cdg.6-t3', id: 'cdg.6-t3', name: 'Story' }]
  }]);
  var mod = loadModule();
  var result = null;
  if (mod) {
    try { result = mod.advance('feat-c', 'cdg.6-t3', ['dorStatus=signed-off'], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 0, 'T3a: exitCode 0 for flat story');
  var after = readFixture(tmpDir);
  var flatSt = (after.features[0].stories || []).find(function(s) {
    return s.slug === 'cdg.6-t3' || s.id === 'cdg.6-t3';
  });
  assert(flatSt !== undefined && flatSt.dorStatus === 'signed-off',
    'T3b: flat story field written correctly');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T4 — AC3: Story not found → creates flat entry ────────────────────────────
console.log('\n[cdg6] T4 — AC3: story not found in flat or epic-nested → creates flat entry');
{
  var tmpDir = makeTmpDir('t4');
  writeFixture(tmpDir, [{
    slug: 'feat-d', id: 'feat-d', name: 'Feature D',
    stories: [],
    epics: [{ slug: 'epic-1', id: 'epic-1', name: 'Epic 1', stories: [
      { slug: 'other-story', id: 'other-story', name: 'Other' }
    ]}]
  }]);
  var mod = loadModule();
  var result = null;
  if (mod) {
    try { result = mod.advance('feat-d', 'cdg.6-t4-new', ['stage=definition-of-ready'], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 0, 'T4a: exitCode 0 when creating new flat entry');
  var after = readFixture(tmpDir);
  var created = (after.features[0].stories || []).find(function(s) {
    return s.id === 'cdg.6-t4-new' || s.slug === 'cdg.6-t4-new';
  });
  assert(created !== undefined && created.stage === 'definition-of-ready',
    'T4b: new flat entry created with correct field');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T5 — AC4: Dot-notation creates nested object when parent is absent ─────────
console.log('\n[cdg6] T5 — AC4: dot-notation creates nested object when parent absent');
{
  var tmpDir = makeTmpDir('t5');
  writeFixture(tmpDir, [{
    slug: 'feat-e', id: 'feat-e', name: 'Feature E',
    stories: [{ slug: 'cdg.6-t5', id: 'cdg.6-t5', name: 'Story' }]
  }]);
  var mod = loadModule();
  var result = null;
  if (mod) {
    try { result = mod.advance('feat-e', 'cdg.6-t5', ['testPlan.status=all-passing'], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 0, 'T5a: exitCode 0 for dot-notation write');
  var after = readFixture(tmpDir);
  var st = (after.features[0].stories || []).find(function(s) {
    return s.slug === 'cdg.6-t5' || s.id === 'cdg.6-t5';
  });
  assert(
    st !== undefined &&
    typeof st.testPlan === 'object' &&
    st.testPlan !== null &&
    st.testPlan.status === 'all-passing' &&
    !Object.prototype.hasOwnProperty.call(st, 'testPlan.status'),
    'T5b: story.testPlan.status=all-passing written as nested object, not flat key'
  );
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T6 — AC4: Dot-notation merges with existing nested object ─────────────────
console.log('\n[cdg6] T6 — AC4: dot-notation merges with existing nested object (does not replace)');
{
  var tmpDir = makeTmpDir('t6');
  writeFixture(tmpDir, [{
    slug: 'feat-f', id: 'feat-f', name: 'Feature F',
    stories: [{
      slug: 'cdg.6-t6', id: 'cdg.6-t6', name: 'Story',
      testPlan: { artefact: 'artefacts/test-plan.md' }
    }]
  }]);
  var mod = loadModule();
  var result = null;
  if (mod) {
    try { result = mod.advance('feat-f', 'cdg.6-t6', ['testPlan.status=all-passing'], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 0, 'T6a: exitCode 0 for dot-notation merge');
  var after = readFixture(tmpDir);
  var st = (after.features[0].stories || []).find(function(s) {
    return s.slug === 'cdg.6-t6' || s.id === 'cdg.6-t6';
  });
  assert(
    st !== undefined &&
    typeof st.testPlan === 'object' &&
    st.testPlan.status === 'all-passing' &&
    st.testPlan.artefact === 'artefacts/test-plan.md',
    'T6b: existing testPlan.artefact preserved; testPlan.status added'
  );
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T7 — AC4: Deep dot-notation (2+ dots) is rejected with exit 8 ─────────────
console.log('\n[cdg6] T7 — AC4: deep dot-notation (2+ dots) rejected with exit 8');
{
  var tmpDir = makeTmpDir('t7');
  writeFixture(tmpDir, [{
    slug: 'feat-g', id: 'feat-g', name: 'Feature G',
    stories: [{ slug: 'cdg.6-t7', id: 'cdg.6-t7', name: 'Story' }]
  }]);
  var stateBefore = readFixture(tmpDir);
  var mod = loadModule();
  var result = null;
  if (mod) {
    try { result = mod.advance('feat-g', 'cdg.6-t7', ['a.b.c=value'], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 8, 'T7a: exitCode 8 for 3-level dot-notation');
  assert(result !== null && typeof result.stderr === 'string' && result.stderr.length > 0,
    'T7b: stderr is non-empty on deep dot rejection');
  var stateAfter = readFixture(tmpDir);
  assert(
    JSON.stringify(stateBefore) === JSON.stringify(stateAfter),
    'T7c: pipeline-state.json not modified on deep dot rejection'
  );
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T8 — AC5: Integer-valued strings are coerced to number type ───────────────
console.log('\n[cdg6] T8 — AC5: integer strings coerced to number type');
{
  var tmpDir = makeTmpDir('t8');
  writeFixture(tmpDir, [{
    slug: 'feat-h', id: 'feat-h', name: 'Feature H',
    stories: [{ slug: 'cdg.6-t8', id: 'cdg.6-t8', name: 'Story' }]
  }]);
  var mod = loadModule();
  var result = null;
  if (mod) {
    try { result = mod.advance('feat-h', 'cdg.6-t8', ['acVerified=8', 'passing=23', 'totalTests=23'], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 0, 'T8a: exitCode 0 for integer fields');
  var after = readFixture(tmpDir);
  var st = (after.features[0].stories || []).find(function(s) {
    return s.slug === 'cdg.6-t8' || s.id === 'cdg.6-t8';
  });
  assert(st !== undefined && st.acVerified === 8 && typeof st.acVerified === 'number',
    'T8b: acVerified is number 8, not string "8"');
  assert(st !== undefined && st.passing === 23 && typeof st.passing === 'number',
    'T8c: passing is number 23, not string "23"');
  assert(st !== undefined && st.totalTests === 23 && typeof st.totalTests === 'number',
    'T8d: totalTests is number 23, not string "23"');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T9 — AC5: Non-integer string values remain strings (boundary) ─────────────
console.log('\n[cdg6] T9 — AC5: non-integer string values remain strings');
{
  var tmpDir = makeTmpDir('t9');
  writeFixture(tmpDir, [{
    slug: 'feat-i', id: 'feat-i', name: 'Feature I',
    stories: [{ slug: 'cdg.6-t9', id: 'cdg.6-t9', name: 'Story' }]
  }]);
  var mod = loadModule();
  var result = null;
  if (mod) {
    try { result = mod.advance('feat-i', 'cdg.6-t9', ['stage=definition-of-done', 'updatedAt=2026-05-24'], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 0, 'T9a: exitCode 0 for string fields');
  var after = readFixture(tmpDir);
  var st = (after.features[0].stories || []).find(function(s) {
    return s.slug === 'cdg.6-t9' || s.id === 'cdg.6-t9';
  });
  assert(st !== undefined && st.stage === 'definition-of-done' && typeof st.stage === 'string',
    'T9b: stage remains a string');
  assert(st !== undefined && st.updatedAt === '2026-05-24' && typeof st.updatedAt === 'string',
    'T9c: updatedAt remains a string (contains hyphens, not pure integer)');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T10 — AC6: __proto__ as field name is rejected with exit 8 ────────────────
console.log('\n[cdg6] T10 — AC6: __proto__ as field name rejected with exit 8');
{
  var tmpDir = makeTmpDir('t10');
  writeFixture(tmpDir, [{
    slug: 'feat-j', id: 'feat-j', name: 'Feature J',
    stories: [{ slug: 'cdg.6-t10', id: 'cdg.6-t10', name: 'Story' }]
  }]);
  var stateBefore = readFixture(tmpDir);
  var mod = loadModule();
  var result = null;
  if (mod) {
    try { result = mod.advance('feat-j', 'cdg.6-t10', ['__proto__=malicious'], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 8, 'T10a: exitCode 8 for __proto__ field name');
  assert(result !== null && typeof result.stderr === 'string' && result.stderr.includes('__proto__'),
    'T10b: stderr names __proto__');
  var stateAfter = readFixture(tmpDir);
  assert(
    JSON.stringify(stateBefore) === JSON.stringify(stateAfter),
    'T10c: pipeline-state.json not modified'
  );
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T11 — AC6: constructor as dot-notation parent is rejected with exit 8 ─────
console.log('\n[cdg6] T11 — AC6: constructor dot-notation parent rejected with exit 8');
{
  var tmpDir = makeTmpDir('t11');
  writeFixture(tmpDir, [{
    slug: 'feat-k', id: 'feat-k', name: 'Feature K',
    stories: [{ slug: 'cdg.6-t11', id: 'cdg.6-t11', name: 'Story' }]
  }]);
  var stateBefore = readFixture(tmpDir);
  var mod = loadModule();
  var result = null;
  if (mod) {
    try { result = mod.advance('feat-k', 'cdg.6-t11', ['constructor.polluted=true'], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 8, 'T11a: exitCode 8 for constructor dot-notation');
  assert(result !== null && typeof result.stderr === 'string' && result.stderr.includes('constructor'),
    'T11b: stderr names constructor');
  var stateAfter = readFixture(tmpDir);
  assert(
    JSON.stringify(stateBefore) === JSON.stringify(stateAfter),
    'T11c: pipeline-state.json not modified'
  );
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T12 — Non-regression: enum validation still works ─────────────────────────
console.log('\n[cdg6] T12 — Non-regression: enum validation still works');
{
  var tmpDir = makeTmpDir('t12');
  writeFixture(tmpDir, [{
    slug: 'feat-l', id: 'feat-l', name: 'Feature L',
    stories: [{ slug: 'cdg.6-t12', id: 'cdg.6-t12', name: 'Story' }]
  }]);
  var mod = loadModule();
  var result = null;
  if (mod) {
    try { result = mod.advance('feat-l', 'cdg.6-t12', ['prStatus=invalid-value'], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 8, 'T12a: exitCode 8 for invalid enum value');
  assert(
    result !== null && typeof result.stderr === 'string' &&
    result.stderr.includes('invalid-value') && result.stderr.includes('prStatus'),
    'T12b: stderr names the invalid value and field'
  );
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T13 — Governance: npm test chain includes cdg.6 test file ─────────────────
console.log('\n[cdg6] T13 — Governance: npm test chain includes cdg.6 test file');
{
  var pkgPath = path.join(ROOT, 'package.json');
  var pkgExists = fs.existsSync(pkgPath);
  assert(pkgExists, 'T13a: package.json exists');
  if (pkgExists) {
    var pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    assert(
      typeof pkg.scripts === 'object' &&
      typeof pkg.scripts.test === 'string' &&
      (pkg.scripts.test.includes('node tests/check-cdg6-advance-enhancements.js') ||
       pkg.scripts.test.includes('run-all-tests.js')),
      'T13b: package.json test script includes check-cdg6-advance-enhancements.js (directly, or via the pcr-s1 dynamic discovery runner)'
    );
  } else {
    failed++;
    console.log('  \u2717 T13b: cannot check — package.json missing');
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('\n=== check-cdg6-advance-enhancements results: ' + passed + ' passed, ' + failed + ' failed ===\n');
process.exit(failed > 0 ? 1 : 0);
