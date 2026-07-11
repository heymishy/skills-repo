#!/usr/bin/env node
/**
 * check-cdg7-gate-advance.js
 *
 * Tests for cdg.7 — gated advance and web UI adapter wiring.
 * Covers: T1–T14 from the cdg.7 test plan.
 *
 * Run: node tests/check-cdg7-gate-advance.js
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const root = path.join(__dirname, '..');

// ── Test tracking ──────────────────────────────────────────────────────────────

let totalPassed = 0;
let totalFailed = 0;
const issues = [];

function ok(label) {
  totalPassed++;
}

function fail(label, message) {
  totalFailed++;
  issues.push(`  ✗ [${label}] ${message}`);
}

function assert(label, condition, message) {
  if (condition) { ok(label); } else { fail(label, message); }
}

function assertThrows(label, fn, messageFragment) {
  try {
    fn();
    fail(label, 'Expected an error to be thrown, but none was thrown');
  } catch (err) {
    if (messageFragment && !err.message.includes(messageFragment)) {
      fail(label, `Error thrown but message did not include "${messageFragment}". Got: "${err.message}"`);
    } else {
      ok(label);
    }
  }
}

// ── Temp dir helpers ───────────────────────────────────────────────────────────

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cdg7-test-'));
}

function rmDir(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
}

function writeFile(dir, relPath, content) {
  const abs = path.join(dir, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
}

function makeMinimalPipelineState(featureSlug, storyId, epicNested) {
  const story = { id: storyId, slug: storyId };
  const feature = epicNested
    ? { slug: featureSlug, id: featureSlug, stories: [], epics: [{ id: 'e1', slug: 'e1', stories: [story] }] }
    : { slug: featureSlug, id: featureSlug, stories: [story] };
  return { schemaVersion: '1', features: [feature] };
}

function writePipelineState(dir, state) {
  writeFile(dir, '.github/pipeline-state.json', JSON.stringify(state, null, 2) + '\n');
}

function readPipelineState(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, '.github', 'pipeline-state.json'), 'utf8'));
}

/**
 * Creates a fixture that passes H1/H2/H3 but fails H4 (no Out of Scope section).
 * Returns the artefact path (relative to tempDir) for validate().
 */
function makeH4FailFixture(dir) {
  writeFile(dir, 'artefacts/feat/dor/story-dor.md', [
    '**Story reference:** artefacts/feat/stories/story.md',
    '**Test plan reference:** artefacts/feat/test-plans/tp.md',
    '',
    'Gate validation fixture for H4 failure test.',
  ].join('\n'));

  // Story: 3 ACs with Given/When/Then — but no Out of Scope section
  writeFile(dir, 'artefacts/feat/stories/story.md', [
    '## Story',
    '',
    '**AC1:** First acceptance criterion',
    'Given a valid state',
    'When the action is performed',
    'Then the outcome is correct',
    '',
    '**AC2:** Second acceptance criterion',
    'Given a valid state',
    'When the action is performed',
    'Then the outcome is correct',
    '',
    '**AC3:** Third acceptance criterion',
    'Given a valid state',
    'When the action is performed',
    'Then the outcome is correct',
  ].join('\n'));

  // Test plan covering all ACs
  writeFile(dir, 'artefacts/feat/test-plans/tp.md', [
    '## Test Plan',
    'AC1 — T1', 'AC2 — T2', 'AC3 — T3',
  ].join('\n'));

  return 'artefacts/feat/dor/story-dor.md';
}

// ── Require modules under test ─────────────────────────────────────────────────

const { gateAdvance } = require('../src/enforcement/cli-gate-advance');
const gateMap = require('../src/enforcement/gate-map');
const pipelineStateWriterFactory = require('../src/web-ui/adapters/pipeline-state-writer');

// ── T1 — AC1: validate non-zero blocks gate-advance; state not modified ────────

{
  const T = 'T1-validate-blocks-advance';
  const tmpDir = makeTempDir();
  try {
    const state = makeMinimalPipelineState('test-feat', 's1', false);
    writePipelineState(tmpDir, state);
    // Non-existent artefact → validate exit 1 (H1 fail: file not found)
    const result = gateAdvance('test-feat', 's1', 'definition-of-ready',
      'artefacts/nonexistent.md', ['stage=dor-signed-off'], tmpDir);
    assert(T + '-exitCode', result.exitCode === 1, `Expected exitCode 1 (H1 fail), got ${result.exitCode}`);
    // State must not have been modified
    const after = readPipelineState(tmpDir);
    const story = after.features[0].stories[0];
    assert(T + '-state-unchanged', story.stage === undefined,
      `Expected story.stage to be unset, got '${story.stage}'`);
  } finally { rmDir(tmpDir); }
}

// ── T2 — AC1: validate exit code propagated faithfully (exit 4) ───────────────

{
  const T = 'T2-validate-exit4-propagated';
  const tmpDir = makeTempDir();
  try {
    const artefactPath = makeH4FailFixture(tmpDir);
    const state = makeMinimalPipelineState('test-feat', 's1', false);
    writePipelineState(tmpDir, state);
    const result = gateAdvance('test-feat', 's1', 'definition-of-ready',
      artefactPath, ['stage=dor-signed-off'], tmpDir);
    assert(T, result.exitCode === 4,
      `Expected exitCode 4 (H4 fail — no out-of-scope section), got ${result.exitCode}: ${result.stderr}`);
  } finally { rmDir(tmpDir); }
}

// ── T3 — AC2: validate exit 0 → field written, exit 0 returned ───────────────

{
  const T = 'T3-validate-exit0-field-written';
  const tmpDir = makeTempDir();
  try {
    // Artefact with no story reference header → validate returns exit 0
    writeFile(tmpDir, 'artefacts/feat/dor/gate-ok.md', 'Gate confirmed.');
    const state = makeMinimalPipelineState('test-feat', 's1', false);
    writePipelineState(tmpDir, state);
    const result = gateAdvance('test-feat', 's1', 'definition-of-ready',
      'artefacts/feat/dor/gate-ok.md', ['stage=dor-signed-off'], tmpDir);
    assert(T + '-exitCode', result.exitCode === 0,
      `Expected exitCode 0, got ${result.exitCode}: ${result.stderr}`);
    const after = readPipelineState(tmpDir);
    const story = after.features[0].stories[0];
    assert(T + '-stage-written', story.stage === 'dor-signed-off',
      `Expected story.stage='dor-signed-off', got '${story.stage}'`);
  } finally { rmDir(tmpDir); }
}

// ── T4 — AC2: validate exit 0 + multiple field pairs → all written ────────────

{
  const T = 'T4-multiple-pairs-all-written';
  const tmpDir = makeTempDir();
  try {
    writeFile(tmpDir, 'artefacts/feat/dor/gate-ok.md', 'Gate confirmed.');
    const state = makeMinimalPipelineState('test-feat', 's1', false);
    writePipelineState(tmpDir, state);
    const result = gateAdvance('test-feat', 's1', 'definition-of-ready',
      'artefacts/feat/dor/gate-ok.md',
      ['stage=dor-signed-off', 'prStatus=draft', 'dorStatus=signed-off'], tmpDir);
    assert(T + '-exitCode', result.exitCode === 0,
      `Expected exitCode 0, got ${result.exitCode}: ${result.stderr}`);
    const after = readPipelineState(tmpDir);
    const story = after.features[0].stories[0];
    assert(T + '-stage', story.stage === 'dor-signed-off',
      `Expected stage='dor-signed-off', got '${story.stage}'`);
    assert(T + '-prStatus', story.prStatus === 'draft',
      `Expected prStatus='draft', got '${story.prStatus}'`);
    assert(T + '-dorStatus', story.dorStatus === 'signed-off',
      `Expected dorStatus='signed-off', got '${story.dorStatus}'`);
  } finally { rmDir(tmpDir); }
}

// ── T5 — AC3: missing artefact-path → exit 8 with usage info ─────────────────

{
  const T = 'T5-missing-artefact-path-exit8';
  const result = gateAdvance('test-feat', 's1', 'definition-of-ready', undefined, [], '/fake/root');
  assert(T + '-exitCode', result.exitCode === 8, `Expected exitCode 8, got ${result.exitCode}`);
  const s = result.stderr || '';
  assert(T + '-stderr-feature-slug', s.includes('feature-slug'), `stderr should mention 'feature-slug'`);
  assert(T + '-stderr-story-id',     s.includes('story-id'),     `stderr should mention 'story-id'`);
  assert(T + '-stderr-gate-name',    s.includes('gate-name'),    `stderr should mention 'gate-name'`);
  assert(T + '-stderr-artefact-path',s.includes('artefact-path'),`stderr should mention 'artefact-path'`);
}

// ── T6 — AC3: missing gate-name and artefact-path → exit 8 ───────────────────

{
  const T = 'T6-missing-gatename-exit8';
  const result = gateAdvance('test-feat', 's1', undefined, undefined, [], '/fake/root');
  assert(T, result.exitCode === 8, `Expected exitCode 8, got ${result.exitCode}`);
}

// ── T7 — AC4: gate-map.js exports all 7 gated stage values ───────────────────

{
  const T = 'T7-gate-map-has-7-stages';
  const expected = [
    'discovery-approved', 'benefit-metric-active', 'definition-complete',
    'test-plan-complete', 'dor-signed-off', 'branch-complete', 'definition-of-done',
  ];
  expected.forEach(function(stage) {
    assert(T + '-' + stage, stage in gateMap, `gate-map is missing key '${stage}'`);
  });
}

// ── T8 — AC4: each gate-map entry has a `gate` string property ───────────────

{
  const T = 'T8-gate-map-gate-property';
  Object.keys(gateMap).forEach(function(key) {
    const val = gateMap[key];
    assert(T + '-' + key,
      typeof val.gate === 'string' && val.gate.length > 0,
      `gate-map entry '${key}' is missing a non-empty 'gate' string property`);
  });
}

// ── T9 — AC5: pipeline-state-writer delegates story write to advance() ────────

{
  const T = 'T9-writer-delegates-to-advance';
  const tmpDir = makeTempDir();
  try {
    const state = makeMinimalPipelineState('test-feat', 's1', false);
    writePipelineState(tmpDir, state);
    const writer = pipelineStateWriterFactory(tmpDir);
    writer('test-feat', 's1', { prStatus: 'draft' });
    const after = readPipelineState(tmpDir);
    const story = after.features[0].stories[0];
    assert(T, story.prStatus === 'draft',
      `Expected story.prStatus='draft', got '${story.prStatus}'`);
  } finally { rmDir(tmpDir); }
}

// ── T10 — AC5: pipeline-state-writer with invalid prStatus rejects ────────────

{
  const T = 'T10-invalid-prStatus-rejects';
  const tmpDir = makeTempDir();
  try {
    const state = makeMinimalPipelineState('test-feat', 's1', false);
    writePipelineState(tmpDir, state);
    const writer = pipelineStateWriterFactory(tmpDir);
    assertThrows(T, () => writer('test-feat', 's1', { prStatus: 'INVALID' }), 'INVALID');
  } finally { rmDir(tmpDir); }
}

// ── T11 — AC5: __proto__ key in stateUpdate throws proto guard ────────────────

{
  const T = 'T11-proto-guard-throws';
  const tmpDir = makeTempDir();
  try {
    const state = makeMinimalPipelineState('test-feat', 's1', false);
    writePipelineState(tmpDir, state);
    const writer = pipelineStateWriterFactory(tmpDir);
    // Use Object.defineProperty so '__proto__' is an own enumerable property
    const stateUpdate = { prStatus: 'draft' };
    Object.defineProperty(stateUpdate, '__proto__', {
      value: 'x', enumerable: true, configurable: true, writable: true,
    });
    assertThrows(T, () => writer('test-feat', 's1', stateUpdate), 'prototype pollution');
  } finally { rmDir(tmpDir); }
}

// ── T12 — AC5: pipeline-state-writer updates an epic-nested story correctly ───

{
  const T = 'T12-epic-nested-story-updated';
  const tmpDir = makeTempDir();
  try {
    // Story only exists in epics[0].stories[0], NOT in flat feature.stories
    const state = makeMinimalPipelineState('test-feat', 'es1', true);
    writePipelineState(tmpDir, state);
    const writer = pipelineStateWriterFactory(tmpDir);
    writer('test-feat', 'es1', { prStatus: 'merged' });
    const after = readPipelineState(tmpDir);
    const feat = after.features[0];
    const epicStory = feat.epics[0].stories[0];
    assert(T + '-prStatus', epicStory.prStatus === 'merged',
      `Expected epic-nested story prStatus='merged', got '${epicStory.prStatus}'`);
    assert(T + '-no-phantom-flat', feat.stories.length === 0,
      `Expected feature.stories to remain empty (no phantom flat entry), got length ${feat.stories.length}`);
  } finally { rmDir(tmpDir); }
}

// ── T13 — AC6: copilot-instructions.md contains gate-advance mandate ──────────

{
  const T = 'T13-copilot-instructions-mandate';
  const content = fs.readFileSync(path.join(root, '.github', 'copilot-instructions.md'), 'utf8');
  assert(T + '-gate-advance-string', content.includes('gate-advance'),
    'copilot-instructions.md does not contain the string "gate-advance"');
  const gatedStages = [
    'discovery-approved', 'benefit-metric-active', 'definition-complete',
    'test-plan-complete', 'dor-signed-off', 'branch-complete', 'definition-of-done',
  ];
  const allStagesPresent = gatedStages.every(s => content.includes(s));
  assert(T + '-gate-stage-values', allStagesPresent || content.includes('gate-map'),
    'copilot-instructions.md does not reference all 7 gated stage values or gate-map');
}

// ── T14 — Governance: package.json test chain includes this file ──────────────

{
  const T = 'T14-package-json-includes-test';
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert(T, pkg.scripts.test.includes('node tests/check-cdg7-gate-advance.js') || pkg.scripts.test.includes('run-all-tests.js'),
    'package.json test script does not include "node tests/check-cdg7-gate-advance.js" (directly, or via the pcr-s1 dynamic discovery runner)');
}

// ── Report ─────────────────────────────────────────────────────────────────────

if (totalFailed > 0) {
  console.error(`[cdg7-gate-advance] FAIL — ${issues.length} issue(s) found:`);
  issues.forEach(function(i) { console.error(i); });
  process.exit(1);
} else {
  console.log(`[cdg7-gate-advance] ${totalPassed} check(s) OK ✓`);
}
