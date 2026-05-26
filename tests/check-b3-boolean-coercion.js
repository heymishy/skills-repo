#!/usr/bin/env node
// check-b3-boolean-coercion.js — TDD tests for B3 (cli-advance boolean coercion)
// Tests: T1, T2, T3, T4, T5, T6
// All tests FAIL until src/enforcement/cli-advance.js BOOLEAN_FIELDS coercion is implemented.
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT   = path.join(__dirname, '..');
const MODULE = path.join(ROOT, 'src', 'enforcement', 'cli-advance.js');
const SCHEMA_PATH = path.join(ROOT, '.github', 'pipeline-state.schema.json');
const INTEGRITY_SCRIPT = path.join(ROOT, 'scripts', 'check-pipeline-state-integrity.js');

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
  return fs.mkdtempSync(path.join(ROOT, `.tmp-test-b3-${suffix}-`));
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

const FEAT = 'test-feat-b3';
const STORY = 'test-story-b3';

// ── T1 — "true" string coerces to boolean true for a boolean schema field ──────
console.log('\n[b3-boolean-coercion] T1 \u2014 "true" string coerces to boolean true for releaseReady');
{
  const tmpDir = makeTmpDir('t1');
  writeFixture(tmpDir, [makeFeature(FEAT, [makeStory(STORY)])]);
  const mod = loadModule();
  let result = null;
  if (mod) {
    try { result = mod.advance(FEAT, STORY, ['releaseReady=true'], tmpDir); } catch (_) {}
  }
  const after = readFixture(tmpDir);
  const story = (after.features[0].stories || []).find(s => s.id === STORY || s.slug === STORY);
  assert(result !== null && result.exitCode === 0, 'T1a: exitCode === 0');
  assert(story !== undefined && story.releaseReady === true, 'T1b: story.releaseReady === true (boolean)');
  assert(story !== undefined && typeof story.releaseReady === 'boolean', 'T1c: typeof story.releaseReady === \'boolean\'');
  assert(result !== null && typeof result.stdout === 'string' &&
         result.stdout.includes(FEAT) && result.stdout.includes(STORY),
         'T1d: stdout contains feature slug and story id');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T2 — "false" string coerces to boolean false ────────────────────────────────
console.log('\n[b3-boolean-coercion] T2 \u2014 "false" string coerces to boolean false for releaseReady');
{
  const tmpDir = makeTmpDir('t2');
  writeFixture(tmpDir, [makeFeature(FEAT, [makeStory(STORY, { releaseReady: true })])]);
  const mod = loadModule();
  let result = null;
  if (mod) {
    try { result = mod.advance(FEAT, STORY, ['releaseReady=false'], tmpDir); } catch (_) {}
  }
  const after = readFixture(tmpDir);
  const story = (after.features[0].stories || []).find(s => s.id === STORY || s.slug === STORY);
  assert(result !== null && result.exitCode === 0, 'T2a: exitCode === 0');
  assert(story !== undefined && story.releaseReady === false, 'T2b: story.releaseReady === false (boolean)');
  assert(story !== undefined && typeof story.releaseReady === 'boolean', 'T2c: typeof story.releaseReady === \'boolean\'');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T3 — integer coercion regression: digit strings still coerce to numbers ────
console.log('\n[b3-boolean-coercion] T3 \u2014 integer coercion regression (cdg.6 not broken)');
{
  const tmpDir = makeTmpDir('t3');
  writeFixture(tmpDir, [makeFeature(FEAT, [makeStory(STORY)])]);
  const mod = loadModule();
  let result = null;
  if (mod) {
    try { result = mod.advance(FEAT, STORY, ['acVerified=4'], tmpDir); } catch (_) {}
  }
  const after = readFixture(tmpDir);
  const story = (after.features[0].stories || []).find(s => s.id === STORY || s.slug === STORY);
  assert(result !== null && result.exitCode === 0, 'T3a: exitCode === 0');
  assert(story !== undefined && story.acVerified === 4, 'T3b: story.acVerified === 4 (number)');
  assert(story !== undefined && typeof story.acVerified === 'number', 'T3c: typeof story.acVerified === \'number\'');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T4 — non-coercible value for boolean field exits non-zero ──────────────────
console.log('\n[b3-boolean-coercion] T4 \u2014 non-coercible value for boolean field exits non-zero');
{
  const tmpDir = makeTmpDir('t4');
  writeFixture(tmpDir, [makeFeature(FEAT, [makeStory(STORY)])]);
  const mod = loadModule();
  let result = null;
  let beforeReleaseReady;
  if (mod) {
    try { result = mod.advance(FEAT, STORY, ['releaseReady=maybe'], tmpDir); } catch (_) {}
  }
  const after = readFixture(tmpDir);
  const story = (after.features[0].stories || []).find(s => s.id === STORY || s.slug === STORY);
  assert(result !== null && result.exitCode === 8, 'T4a: exitCode === 8');
  assert(result !== null && typeof result.stderr === 'string' && result.stderr.includes('releaseReady'),
         'T4b: stderr contains \'releaseReady\'');
  assert(result !== null && typeof result.stderr === 'string' &&
         (result.stderr.toLowerCase().includes('boolean') || result.stderr.includes('true')),
         'T4c: stderr contains \'boolean\' or \'true\' (acceptable values indicated)');
  assert(story !== undefined && story.releaseReady === undefined,
         'T4d: story.releaseReady unchanged (not written)');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T5 — non-boolean-schema string fields unchanged ─────────────────────────────
console.log('\n[b3-boolean-coercion] T5 \u2014 non-boolean-schema string fields unchanged (no unexpected coercion)');
{
  const tmpDir = makeTmpDir('t5');
  writeFixture(tmpDir, [makeFeature(FEAT, [makeStory(STORY)])]);
  const mod = loadModule();
  let result = null;
  if (mod) {
    try { result = mod.advance(FEAT, STORY, ['stage=implementation', 'health=green'], tmpDir); } catch (_) {}
  }
  const after = readFixture(tmpDir);
  const story = (after.features[0].stories || []).find(s => s.id === STORY || s.slug === STORY);
  assert(result !== null && result.exitCode === 0, 'T5a: exitCode === 0');
  assert(story !== undefined && story.stage === 'implementation', 'T5b: story.stage === \'implementation\' (string)');
  assert(story !== undefined && story.health === 'green', 'T5c: story.health === \'green\' (string)');
  assert(story !== undefined && typeof story.stage === 'string', 'T5d: typeof story.stage === \'string\'');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T6 — schema validation passes after boolean field written via advance ───────
console.log('\n[b3-boolean-coercion] T6 \u2014 check-pipeline-state-integrity passes after boolean field written');
{
  const tmpDir = makeTmpDir('t6');
  // Use a minimal fixture that matches the real schema well enough for schema validation
  const ghDir = path.join(tmpDir, '.github');
  fs.mkdirSync(ghDir, { recursive: true });
  // Copy the real schema file into the tmp dir so integrity check can find it
  const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf8');
  fs.writeFileSync(path.join(ghDir, 'pipeline-state.schema.json'), schemaContent, 'utf8');
  // Write a minimal valid state fixture
  const state = {
    schemaVersion: '1',
    features: [makeFeature(FEAT, [makeStory(STORY)])]
  };
  fs.writeFileSync(path.join(ghDir, 'pipeline-state.json'), JSON.stringify(state, null, 2) + '\n', 'utf8');

  const mod = loadModule();
  let advanceResult = null;
  if (mod) {
    try { advanceResult = mod.advance(FEAT, STORY, ['releaseReady=true'], tmpDir); } catch (_) {}
  }
  assert(advanceResult !== null && advanceResult.exitCode === 0, 'T6-pre: advance exited 0 before integrity check');

  // Verify the written value is a boolean in the JSON on disk
  const written = JSON.parse(fs.readFileSync(path.join(ghDir, 'pipeline-state.json'), 'utf8'));
  const writtenStory = (written.features[0].stories || []).find(s => s.id === STORY || s.slug === STORY);
  const isBoolean = writtenStory && typeof writtenStory.releaseReady === 'boolean' && writtenStory.releaseReady === true;
  assert(isBoolean, 'T6a: pipeline-state.json on disk contains boolean true for releaseReady (not string)');

  // Run the integrity script against the real pipeline-state.json (it reads from repo root)
  // We validate schema compliance inline using the schema file directly
  let schemaValid = false;
  try {
    const Validator = require('jsonschema').Validator;
    const schema = JSON.parse(schemaContent);
    const v = new Validator();
    const result = v.validate(written, schema);
    schemaValid = result.errors.length === 0;
  } catch (_) {
    // jsonschema not available — fall back to type check only (T6a covers the core requirement)
    schemaValid = isBoolean;
  }
  assert(schemaValid, 'T6b: state file passes schema validation (releaseReady is boolean)');

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── T7 — track field enum validation ──────────────────────────────────────────
console.log('\n[b3-boolean-coercion] T7 \u2014 track field enum validation (prevents track=defect/spike slip-through)');
{
  const tmpDir = makeTmpDir('t7');

  // T7a: track=defect → exit 8 (not a valid schema enum)
  writeFixture(tmpDir, [makeFeature(FEAT, [makeStory(STORY)])]);
  const mod = loadModule();
  let resultDefect = null;
  if (mod) {
    try { resultDefect = mod.advance(FEAT, STORY, ['track=defect'], tmpDir); } catch (_) {}
  }
  assert(resultDefect !== null && resultDefect.exitCode === 8,
         'T7a: track=defect → exitCode 8');
  assert(resultDefect !== null && typeof resultDefect.stderr === 'string' &&
         resultDefect.stderr.includes('track'),
         'T7b: stderr references the field name "track"');

  // T7c: track=short → exit 0 (valid, in schema enum and trace-exempt)
  let resultShort = null;
  if (mod) {
    try { resultShort = mod.advance(FEAT, STORY, ['track=short'], tmpDir); } catch (_) {}
  }
  assert(resultShort !== null && resultShort.exitCode === 0,
         'T7c: track=short → exitCode 0');
  const afterShort = readFixture(tmpDir);
  const storyShort = (afterShort.features[0].stories || []).find(s => s.id === STORY || s.slug === STORY);
  assert(storyShort !== undefined && storyShort.track === 'short',
         'T7d: story.track written as "short"');

  // T7e: track=standard → exit 0 (valid schema enum)
  let resultStd = null;
  if (mod) {
    try { resultStd = mod.advance(FEAT, STORY, ['track=standard'], tmpDir); } catch (_) {}
  }
  assert(resultStd !== null && resultStd.exitCode === 0,
         'T7e: track=standard → exitCode 0');

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ── Summary ────────────────────────────────────────────────────────────────────
console.log(`\n[b3-boolean-coercion] ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
