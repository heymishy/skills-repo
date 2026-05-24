#!/usr/bin/env node
// check-cdg3-advance-cli.js — TDD tests for cdg.3 (skills advance CLI)
// Tests: T1, T2, T3, T4a, T4b, T5, T6, T7, IT1
// All tests FAIL until src/enforcement/cli-advance.js and bin/skills advance are implemented.
'use strict';

const fs    = require('fs');
const path  = require('path');
const child = require('child_process');

const ROOT       = path.join(__dirname, '..');
const MODULE     = path.join(ROOT, 'src', 'enforcement', 'cli-advance.js');
const BIN_SKILLS = path.join(ROOT, 'bin', 'skills');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function loadModule() {
  if (!fs.existsSync(MODULE)) return null;
  try {
    delete require.cache[require.resolve(MODULE)];
    return require(MODULE);
  } catch (_) { return null; }
}

// ── Shared fixture helpers ────────────────────────────────────────────────────

function makeTmpDir(suffix) {
  return fs.mkdtempSync(path.join(ROOT, `.tmp-test-cdg3-${suffix}-`));
}

function writeFixture(tmpDir, features) {
  const ghDir = path.join(tmpDir, '.github');
  fs.mkdirSync(ghDir, { recursive: true });
  const state = { schemaVersion: '1', features: features };
  fs.writeFileSync(path.join(ghDir, 'pipeline-state.json'), JSON.stringify(state, null, 2) + '\n', 'utf8');
  return path.join(ghDir, 'pipeline-state.json');
}

function readFixture(tmpDir) {
  return JSON.parse(fs.readFileSync(path.join(tmpDir, '.github', 'pipeline-state.json'), 'utf8'));
}

function makeFeature(slug, stories) {
  return { slug: slug, id: slug, name: 'Test Feature', stories: stories };
}

function makeStory(id, extraFields) {
  return Object.assign({ id: id, slug: id, name: 'Test Story' }, extraFields || {});
}

const BASE_FEATURE_SLUG = 'test-feature-cdg3';
const BASE_STORY_ID     = 'test-story-cdg3';

// ── T1 — advances story dorStatus atomically on valid args ────────────────────
console.log('\n[cdg3-advance] T1 — AC1: valid advance writes dorStatus, exit 0, stdout confirmation');
{
  const tmpDir = makeTmpDir('t1');
  writeFixture(tmpDir, [
    makeFeature(BASE_FEATURE_SLUG, [makeStory(BASE_STORY_ID, { dorStatus: 'not-started' })])
  ]);
  const mod = loadModule();
  let result = null;
  if (mod) {
    try { result = mod.advance(BASE_FEATURE_SLUG, BASE_STORY_ID, ['dorStatus=signed-off'], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 0, 'T1a: exitCode === 0 on valid advance');
  const after = readFixture(tmpDir);
  const story = (after.features[0].stories || []).find(function(s) { return s.id === BASE_STORY_ID || s.slug === BASE_STORY_ID; });
  assert(story !== undefined && story.dorStatus === 'signed-off', 'T1b: dorStatus written to signed-off');
  assert(result !== null && typeof result.stdout === 'string' &&
         result.stdout.includes(BASE_FEATURE_SLUG) && result.stdout.includes(BASE_STORY_ID),
         'T1c: stdout contains feature slug and story id');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T2 — exits 8 when feature slug not in pipeline-state.json ────────────────
console.log('\n[cdg3-advance] T2 — AC2: unknown feature slug → exit 8, stderr, file unchanged');
{
  const tmpDir = makeTmpDir('t2');
  const statePath = writeFixture(tmpDir, [
    makeFeature('other-feature-cdg3', [makeStory('some-story')])
  ]);
  const before = fs.readFileSync(statePath, 'utf8');
  const mod = loadModule();
  let result = null;
  if (mod) {
    try { result = mod.advance('unknown-slug-cdg3', 'some-story', ['dorStatus=signed-off'], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 8, 'T2a: exitCode === 8 for unknown feature');
  assert(result !== null && typeof result.stderr === 'string' && result.stderr.includes('unknown-slug-cdg3'),
         'T2b: stderr names the unknown feature slug');
  const after = fs.readFileSync(statePath, 'utf8');
  assert(before === after, 'T2c: pipeline-state.json not modified');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T3 — exits non-zero when enum field value is invalid ─────────────────────
console.log('\n[cdg3-advance] T3 — AC3: invalid enum value → non-zero exit, stderr names value, file unchanged');
{
  const tmpDir = makeTmpDir('t3');
  const statePath = writeFixture(tmpDir, [
    makeFeature(BASE_FEATURE_SLUG, [makeStory(BASE_STORY_ID, { prStatus: 'none' })])
  ]);
  const before = fs.readFileSync(statePath, 'utf8');
  const mod = loadModule();
  let result = null;
  if (mod) {
    try { result = mod.advance(BASE_FEATURE_SLUG, BASE_STORY_ID, ['prStatus=invalid-value'], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode !== 0, 'T3a: exitCode !== 0 for invalid enum');
  assert(result !== null && typeof result.stderr === 'string' && result.stderr.includes('invalid-value'),
         'T3b: stderr contains the rejected value');
  const after = fs.readFileSync(statePath, 'utf8');
  assert(before === after, 'T3c: pipeline-state.json not modified');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T4a — exits 8 with zero positional arguments ─────────────────────────────
console.log('\n[cdg3-advance] T4a — AC4: zero args → exit 8, usage in stderr');
{
  const mod = loadModule();
  let result = null;
  if (mod) {
    try { result = mod.advance(undefined, undefined, [], ROOT); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 8, 'T4a-1: exitCode === 8 for zero args');
  assert(result !== null && typeof result.stderr === 'string' && result.stderr.toLowerCase().includes('usage'),
         'T4a-2: stderr contains usage instructions');
}

// ── T4b — exits 8 with feature-slug only (story-id + field missing) ──────────
console.log('\n[cdg3-advance] T4b — AC4: feature-slug only → exit 8, usage in stderr');
{
  const tmpDir = makeTmpDir('t4b');
  writeFixture(tmpDir, [makeFeature(BASE_FEATURE_SLUG, [makeStory(BASE_STORY_ID)])]);
  const mod = loadModule();
  let result = null;
  if (mod) {
    try { result = mod.advance(BASE_FEATURE_SLUG, undefined, [], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 8, 'T4b-1: exitCode === 8 for feature-slug only');
  assert(result !== null && typeof result.stderr === 'string' && result.stderr.toLowerCase().includes('usage'),
         'T4b-2: stderr contains usage instructions');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T5 — exits 8 on malformed field argument (no = sign) ─────────────────────
console.log('\n[cdg3-advance] T5 — AC5: malformed field arg (no =) → exit 8, stderr names arg, file unchanged');
{
  const tmpDir = makeTmpDir('t5');
  const statePath = writeFixture(tmpDir, [
    makeFeature(BASE_FEATURE_SLUG, [makeStory(BASE_STORY_ID)])
  ]);
  const before = fs.readFileSync(statePath, 'utf8');
  const mod = loadModule();
  let result = null;
  if (mod) {
    try { result = mod.advance(BASE_FEATURE_SLUG, BASE_STORY_ID, ['invalidarg'], tmpDir); } catch (_) {}
  }
  assert(result !== null && result.exitCode === 8, 'T5a: exitCode === 8 for malformed arg');
  assert(result !== null && typeof result.stderr === 'string' && result.stderr.includes('invalidarg'),
         'T5b: stderr names the malformed argument');
  const after = fs.readFileSync(statePath, 'utf8');
  assert(before === after, 'T5c: pipeline-state.json not modified');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T6 — writes multiple fields atomically ────────────────────────────────────
console.log('\n[cdg3-advance] T6 — AC6: multi-field write → both fields written, single atomic write, exit 0');
{
  const tmpDir = makeTmpDir('t6');
  writeFixture(tmpDir, [
    makeFeature(BASE_FEATURE_SLUG, [makeStory(BASE_STORY_ID, { dorStatus: 'not-started', reviewStatus: 'not-started' })])
  ]);
  const mod = loadModule();
  let result = null;
  if (mod) {
    try {
      result = mod.advance(BASE_FEATURE_SLUG, BASE_STORY_ID,
        ['dorStatus=signed-off', 'reviewStatus=passed'], tmpDir);
    } catch (_) {}
  }
  assert(result !== null && result.exitCode === 0, 'T6a: exitCode === 0 for multi-field write');
  const after = readFixture(tmpDir);
  const story = (after.features[0].stories || []).find(function(s) { return s.id === BASE_STORY_ID || s.slug === BASE_STORY_ID; });
  assert(story !== undefined && story.dorStatus === 'signed-off', 'T6b: dorStatus written');
  assert(story !== undefined && story.reviewStatus === 'passed', 'T6c: reviewStatus written');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T7 — validate routing is unaffected ──────────────────────────────────────
console.log('\n[cdg3-advance] T7 — AC8: bin/skills validate routing unchanged after advance added');
{
  const tmpArtefact = path.join(ROOT, '.tmp-test-cdg3-t7-artefact.md');
  fs.writeFileSync(tmpArtefact, '# Clean Artefact\n\nNo story references here.\n', 'utf8');
  let spawn = null;
  try {
    spawn = child.spawnSync('node', [BIN_SKILLS, 'validate', tmpArtefact, 'definition-of-ready'], {
      encoding: 'utf8', timeout: 5000
    });
  } catch (_) {}
  assert(spawn !== null && spawn.status === 0, 'T7a: validate exit 0 after advance added');
  fs.unlinkSync(tmpArtefact);
}

// ── IT1 — end-to-end round-trip with real temp fixture ───────────────────────
console.log('\n[cdg3-advance] IT1 — AC1+AC6: end-to-end round-trip with real temp fixture (no stubs)');
{
  const tmpDir = makeTmpDir('it1');
  writeFixture(tmpDir, [
    makeFeature(BASE_FEATURE_SLUG, [makeStory(BASE_STORY_ID, { dorStatus: 'not-started', reviewStatus: 'not-started' })])
  ]);
  const mod = loadModule();
  let result = null;
  if (mod) {
    try {
      result = mod.advance(
        BASE_FEATURE_SLUG, BASE_STORY_ID,
        ['dorStatus=signed-off', 'reviewStatus=passed'],
        tmpDir
      );
    } catch (_) {}
  }
  assert(result !== null && result.exitCode === 0, 'IT1a: exit 0 for round-trip write');
  const after = readFixture(tmpDir);
  const story = (after.features[0].stories || []).find(function(s) { return s.id === BASE_STORY_ID || s.slug === BASE_STORY_ID; });
  assert(story !== undefined && story.dorStatus === 'signed-off' && story.reviewStatus === 'passed',
         'IT1b: both fields written to disk in final state');
  const tmpPath = path.join(tmpDir, '.github', 'pipeline-state.json.tmp');
  assert(!fs.existsSync(tmpPath), 'IT1c: no leftover .tmp file after atomic write');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── Results ───────────────────────────────────────────────────────────────────
console.log(`\n=== check-cdg3-advance-cli results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
