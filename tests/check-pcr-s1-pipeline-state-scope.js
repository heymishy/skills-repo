#!/usr/bin/env node
/**
 * check-pcr-s1-pipeline-state-scope.js
 *
 * Tests for pcr-s1 AC3/AC4 — scope pipeline-state.json's feature-level
 * `updatedAt` bump to genuine feature-level milestones only, so that two
 * stories in the same feature advancing their own fields concurrently no
 * longer collide on the shared `feature.updatedAt` line.
 *
 * Covers: U3, U4, U5, IT4.
 *
 * Run: node tests/check-pcr-s1-pipeline-state-scope.js
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { execSync, execFileSync } = require('child_process');

const root = path.join(__dirname, '..');

let totalPassed = 0;
let totalFailed = 0;
const issues = [];

function ok() { totalPassed++; }
function fail(label, message) {
  totalFailed++;
  issues.push(`  ✗ [${label}] ${message}`);
}
function assert(label, condition, message) {
  if (condition) { ok(); } else { fail(label, message); }
}

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix + '-'));
}
function rmDir(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
}
function writeFile(dir, relPath, content) {
  const abs = path.join(dir, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
}
function readPipelineState(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, '.github', 'pipeline-state.json'), 'utf8'));
}
function writePipelineState(dir, state) {
  writeFile(dir, '.github/pipeline-state.json', JSON.stringify(state, null, 2) + '\n');
}
function makeFixtureState() {
  return {
    schemaVersion: '1',
    features: [
      {
        slug: 'test-feat',
        id: 'test-feat',
        updatedAt: 'T0',
        stage: 'implementation-plan',
        stories: [
          { id: 's1', slug: 's1', updatedAt: 'T0' },
          { id: 's2', slug: 's2', updatedAt: 'T0' },
        ],
      },
    ],
  };
}

const { advance } = require('../src/enforcement/cli-advance');
const { gateAdvance } = require('../src/enforcement/cli-gate-advance');

// ── U3 — advance() on a story field does not modify the parent feature's updatedAt ─

{
  const T = 'U3-advance-story-field-leaves-feature-updatedAt';
  const tmpDir = makeTempDir('pcr-s1-u3');
  try {
    writePipelineState(tmpDir, makeFixtureState());
    const result = advance('test-feat', 's1', ['stage=implementation-plan'], tmpDir);
    assert(T + '-exit0', result.exitCode === 0, `Expected exitCode 0, got ${result.exitCode}: ${result.stderr}`);
    const after = readPipelineState(tmpDir);
    const feature = after.features[0];
    const story = feature.stories.find(s => s.id === 's1');
    assert(T + '-story-stage', story.stage === 'implementation-plan', `Expected story.stage='implementation-plan', got '${story.stage}'`);
    assert(T + '-story-updatedAt-changed', story.updatedAt !== 'T0', `Expected story.updatedAt to change from 'T0', still 'T0'`);
    assert(T + '-feature-updatedAt-unchanged', feature.updatedAt === 'T0', `Expected feature.updatedAt to remain 'T0', got '${feature.updatedAt}'`);
  } finally { rmDir(tmpDir); }
}

// ── U4 — gate-advance() on a story field does not modify the parent feature's updatedAt ─

{
  const T = 'U4-gate-advance-story-field-leaves-feature-updatedAt';
  const tmpDir = makeTempDir('pcr-s1-u4');
  try {
    writePipelineState(tmpDir, makeFixtureState());
    writeFile(tmpDir, 'artefacts/feat/dor/story-dor.md', 'Gate confirmed.');
    const result = gateAdvance('test-feat', 's1', 'definition-of-ready', 'artefacts/feat/dor/story-dor.md', ['dorStatus=signed-off'], tmpDir);
    assert(T + '-exit0', result.exitCode === 0, `Expected exitCode 0, got ${result.exitCode}: ${result.stderr}`);
    const after = readPipelineState(tmpDir);
    const feature = after.features[0];
    const story = feature.stories.find(s => s.id === 's1');
    assert(T + '-story-dorStatus', story.dorStatus === 'signed-off', `Expected story.dorStatus='signed-off', got '${story.dorStatus}'`);
    assert(T + '-story-updatedAt-changed', story.updatedAt !== 'T0', `Expected story.updatedAt to change from 'T0', still 'T0'`);
    assert(T + '-feature-updatedAt-unchanged', feature.updatedAt === 'T0', `Expected feature.updatedAt to remain 'T0', got '${feature.updatedAt}'`);
  } finally { rmDir(tmpDir); }
}

// ── U5 — a genuine feature-level milestone write still bumps the feature's updatedAt ─

{
  const T = 'U5-feature-scoped-field-bumps-feature-updatedAt';
  const tmpDir = makeTempDir('pcr-s1-u5');
  try {
    writePipelineState(tmpDir, makeFixtureState());
    const result = advance('test-feat', 's1', ['feature.stage=discovery-approved'], tmpDir);
    assert(T + '-exit0', result.exitCode === 0, `Expected exitCode 0, got ${result.exitCode}: ${result.stderr}`);
    const after = readPipelineState(tmpDir);
    const feature = after.features[0];
    assert(T + '-feature-stage', feature.stage === 'discovery-approved', `Expected feature.stage='discovery-approved', got '${feature.stage}'`);
    assert(T + '-feature-updatedAt-changed', feature.updatedAt !== 'T0', `Expected feature.updatedAt to change from 'T0', still 'T0'`);
  } finally { rmDir(tmpDir); }
}

// ── U5b — a feature-scoped call does not create a phantom story entry ─────

{
  const T = 'U5b-feature-scoped-call-no-phantom-story';
  const tmpDir = makeTempDir('pcr-s1-u5b');
  try {
    const state = makeFixtureState();
    writePipelineState(tmpDir, state);
    // storyId 'does-not-exist' is irrelevant for a pure feature-scoped call
    const result = advance('test-feat', 'does-not-exist', ['feature.stage=benefit-metric-active'], tmpDir);
    assert(T + '-exit0', result.exitCode === 0, `Expected exitCode 0, got ${result.exitCode}: ${result.stderr}`);
    const after = readPipelineState(tmpDir);
    const feature = after.features[0];
    assert(T + '-no-phantom-story', feature.stories.length === 2, `Expected feature.stories to remain length 2 (no phantom entry), got ${feature.stories.length}`);
  } finally { rmDir(tmpDir); }
}

// ── U5c — mixed feature + story fields in one call apply both, bump both updatedAt ─

{
  const T = 'U5c-mixed-feature-and-story-fields';
  const tmpDir = makeTempDir('pcr-s1-u5c');
  try {
    writePipelineState(tmpDir, makeFixtureState());
    const result = advance('test-feat', 's1', ['feature.stage=definition-complete', 'stage=branch-setup'], tmpDir);
    assert(T + '-exit0', result.exitCode === 0, `Expected exitCode 0, got ${result.exitCode}: ${result.stderr}`);
    const after = readPipelineState(tmpDir);
    const feature = after.features[0];
    const story = feature.stories.find(s => s.id === 's1');
    assert(T + '-feature-stage', feature.stage === 'definition-complete', `Expected feature.stage='definition-complete', got '${feature.stage}'`);
    assert(T + '-story-stage', story.stage === 'branch-setup', `Expected story.stage='branch-setup', got '${story.stage}'`);
    assert(T + '-feature-updatedAt-changed', feature.updatedAt !== 'T0', 'Expected feature.updatedAt to change');
    assert(T + '-story-updatedAt-changed', story.updatedAt !== 'T0', 'Expected story.updatedAt to change');
  } finally { rmDir(tmpDir); }
}

// ── IT4 — two concurrent same-feature story writes merge with zero conflict ─

{
  const T = 'IT4-concurrent-story-writes-merge-cleanly';
  const scratchRoot = makeTempDir('pcr-s1-it4-repo');
  try {
    function git(args, cwd) {
      return execFileSync('git', args, { cwd, encoding: 'utf8' });
    }
    git(['init', '-q'], scratchRoot);
    git(['config', 'user.email', 'test@example.com'], scratchRoot);
    git(['config', 'user.name', 'Test'], scratchRoot);
    writeFile(scratchRoot, '.github/pipeline-state.json', JSON.stringify(makeFixtureState(), null, 2) + '\n');
    git(['add', '.'], scratchRoot);
    git(['commit', '-q', '-m', 'base'], scratchRoot);
    git(['branch', '-q', '-M', 'master'], scratchRoot);
    git(['checkout', '-q', '-b', 'branch-a'], scratchRoot);
    git(['checkout', '-q', 'master'], scratchRoot);
    git(['checkout', '-q', '-b', 'branch-b'], scratchRoot);

    // Branch A advances s1
    git(['checkout', '-q', 'branch-a'], scratchRoot);
    let resA = advance('test-feat', 's1', ['stage=implementation-plan'], scratchRoot);
    assert(T + '-a-exit0', resA.exitCode === 0, `branch-a advance failed: ${resA.stderr}`);
    git(['add', '.'], scratchRoot);
    git(['commit', '-q', '-m', 'branch-a advances s1'], scratchRoot);

    // Branch B advances s2
    git(['checkout', '-q', 'branch-b'], scratchRoot);
    let resB = advance('test-feat', 's2', ['stage=implementation-plan'], scratchRoot);
    assert(T + '-b-exit0', resB.exitCode === 0, `branch-b advance failed: ${resB.stderr}`);
    git(['add', '.'], scratchRoot);
    git(['commit', '-q', '-m', 'branch-b advances s2'], scratchRoot);

    // Merge branch-a into master
    git(['checkout', '-q', 'master'], scratchRoot);
    git(['merge', '-q', 'branch-a', '--no-edit'], scratchRoot);

    // Merge master into branch-b — this is where a real conflict would surface
    git(['checkout', '-q', 'branch-b'], scratchRoot);
    let mergeOutput = '';
    let mergeThrew = false;
    try {
      mergeOutput = git(['merge', 'master', '--no-edit'], scratchRoot);
    } catch (e) {
      mergeThrew = true;
      mergeOutput = (e.stdout || '') + (e.stderr || '');
    }
    assert(T + '-merge-succeeds', !mergeThrew, `Expected merge to succeed with zero conflict, got: ${mergeOutput}`);

    const finalContent = fs.readFileSync(path.join(scratchRoot, '.github', 'pipeline-state.json'), 'utf8');
    assert(T + '-no-conflict-markers',
      !/<<<<<<<|=======|>>>>>>>/.test(finalContent),
      'Merged pipeline-state.json contains conflict markers');

    const finalState = JSON.parse(finalContent);
    const feature = finalState.features[0];
    const s1 = feature.stories.find(s => s.id === 's1');
    const s2 = feature.stories.find(s => s.id === 's2');
    assert(T + '-s1-present', s1 && s1.stage === 'implementation-plan', `Expected s1.stage='implementation-plan', got ${JSON.stringify(s1)}`);
    assert(T + '-s2-present', s2 && s2.stage === 'implementation-plan', `Expected s2.stage='implementation-plan', got ${JSON.stringify(s2)}`);
    assert(T + '-feature-updatedAt-untouched', feature.updatedAt === 'T0', `Expected feature.updatedAt to remain 'T0' (neither branch touched it), got '${feature.updatedAt}'`);
  } finally { rmDir(scratchRoot); }
}

// ── Report ─────────────────────────────────────────────────────────────────

if (totalFailed > 0) {
  console.error(`[pcr-s1-pipeline-state-scope] FAIL — ${issues.length} issue(s) found:`);
  issues.forEach(i => console.error(i));
  process.exit(1);
} else {
  console.log(`[pcr-s1-pipeline-state-scope] ${totalPassed} check(s) OK ✓`);
}
