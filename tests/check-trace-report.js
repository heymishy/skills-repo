#!/usr/bin/env node
// check-trace-report.js
// Tests for scripts/trace-report.js — atr.1: Generate standalone audit trace report from CLI
// TDD: all tests written to fail until trace-report.js is implemented.

'use strict';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');
const { execSync } = require('child_process');

const SCRIPT_PATH = path.join(__dirname, '..', 'scripts', 'trace-report.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  \u2714 ${name}`);
    passed++;
  } catch (e) {
    console.log(`  \u2718 ${name}`);
    console.log(`    ${e.message}`);
    failed++;
  }
}

// ---------- Helpers ----------

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'trace-report-test-'));
}

function rmDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

/** Set up a rootDir with pipeline-state files and artefact stubs. */
function setupFixture(tmpDir, opts) {
  opts = opts || {};
  const ghDir = path.join(tmpDir, '.github');
  fs.mkdirSync(ghDir, { recursive: true });

  // Load the base fixture
  const fixture = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'fixtures', 'trace-report-test-fixture.json'), 'utf8')
  );

  // Filter features if provided
  let stateData = JSON.parse(JSON.stringify(fixture));
  if (opts.featuresFilter) {
    stateData.features = stateData.features.filter(f => opts.featuresFilter.includes(f.slug));
  }

  // Write active state
  fs.writeFileSync(path.join(ghDir, 'pipeline-state.json'), JSON.stringify(stateData, null, 2));

  // Write archive state if provided
  if (opts.archiveFeatures) {
    const archData = {
      version: '1',
      archivedAt: '2026-04-18T10:00:00Z',
      features: opts.archiveFeatures
    };
    fs.writeFileSync(path.join(ghDir, 'pipeline-state-archive.json'), JSON.stringify(archData, null, 2));
  }

  // Create artefact stubs for specified features
  const featuresToStub = opts.stubArtefacts || [];
  for (const feature of stateData.features) {
    if (!featuresToStub.includes(feature.slug)) continue;
    // Feature-level artefacts
    if (feature.discoveryArtefact) {
      const p = path.join(tmpDir, feature.discoveryArtefact);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, '# Discovery\n');
    }
    if (feature.benefitMetricArtefact) {
      const p = path.join(tmpDir, feature.benefitMetricArtefact);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, '# Benefit Metric\n');
    }
    // Story-level artefacts
    for (const story of (feature.stories || [])) {
      const paths = ['artefact', 'testPlanArtefact', 'dorArtefact', 'dodArtefact', 'reviewArtefact'];
      for (const key of paths) {
        if (story[key]) {
          const p = path.join(tmpDir, story[key]);
          fs.mkdirSync(path.dirname(p), { recursive: true });
          fs.writeFileSync(p, `# ${key}\n`);
        }
      }
    }
  }

  // Create trace JSONL if requested
  if (opts.traceEntries) {
    const tracesDir = path.join(tmpDir, 'workspace', 'traces');
    fs.mkdirSync(tracesDir, { recursive: true });
    for (const entry of opts.traceEntries) {
      const filename = `${entry.startedAt.replace(/[:.]/g, '-')}-ci-${entry.traceHash || 'abcd1234'}.jsonl`;
      const inProgress = JSON.stringify({ status: 'inProgress', trigger: 'ci', prRef: entry.prRef || '', commitSha: entry.commitSha || '', startedAt: entry.startedAt });
      const completed = JSON.stringify({
        status: 'completed',
        trigger: 'ci',
        prRef: entry.prRef || '',
        commitSha: entry.commitSha || '',
        startedAt: entry.startedAt,
        completedAt: entry.completedAt || entry.startedAt,
        verdict: entry.verdict || 'pass',
        failurePattern: null,
        traceHash: entry.traceHash || 'abcd123456789012',
        checks: entry.checks || [{ name: 'basic-check', passed: true }]
      });
      fs.writeFileSync(path.join(tracesDir, filename), inProgress + '\n' + completed + '\n');
    }
  }

  return tmpDir;
}

/** Load generateReport */
function loadModule() {
  // Clear require cache for fresh load
  delete require.cache[require.resolve(SCRIPT_PATH)];
  return require(SCRIPT_PATH);
}

// ===================================================================
// TESTS
// ===================================================================

console.log('[check-trace-report] atr.1 — Audit Trace Report CLI');
console.log('');

// ---------- T1: Active feature produces Markdown report with story sections ----------
test('T1: active feature produces Markdown report with story sections', () => {
  const tmpDir = makeTmpDir();
  try {
    setupFixture(tmpDir, {
      featuresFilter: ['test-feature'],
      stubArtefacts: ['test-feature']
    });
    const { generateReport } = loadModule();
    const report = generateReport({ feature: 'test-feature', rootDir: tmpDir });
    assert.ok(typeof report === 'string', 'report should be a string');
    assert.ok(report.includes('test-feature'), 'report should contain feature slug');
    assert.ok(report.includes('tf.1') || report.includes('First story'), 'report should contain first story');
    assert.ok(report.includes('tf.2') || report.includes('Second story'), 'report should contain second story');
    // Chain links
    assert.ok(report.includes('discovery'), 'report should mention discovery chain link');
    assert.ok(report.includes('story'), 'report should mention story chain link');
  } finally {
    rmDir(tmpDir);
  }
});

// ---------- T2: Report includes feature-level metadata ----------
test('T2: report includes feature-level metadata', () => {
  const tmpDir = makeTmpDir();
  try {
    setupFixture(tmpDir, {
      featuresFilter: ['test-feature'],
      stubArtefacts: ['test-feature']
    });
    const { generateReport } = loadModule();
    const report = generateReport({ feature: 'test-feature', rootDir: tmpDir });
    assert.ok(report.includes('test-feature'), 'report should contain feature slug');
    assert.ok(report.includes('definition-of-done'), 'report should contain stage');
    assert.ok(report.includes('green'), 'report should contain health status');
    assert.ok(report.includes('2'), 'report should contain story count or the number 2');
  } finally {
    rmDir(tmpDir);
  }
});

// ---------- T3: Archived feature found and reported ----------
test('T3: archived feature found and reported', () => {
  const tmpDir = makeTmpDir();
  try {
    const archFeature = {
      slug: 'archived-feature',
      name: 'Archived Feature',
      stage: 'definition-of-done',
      health: 'green',
      discoveryArtefact: 'artefacts/archived-feature/discovery.md',
      benefitMetricArtefact: 'artefacts/archived-feature/benefit-metric.md',
      stories: [
        {
          slug: 'af.1',
          name: 'Archived story',
          stage: 'definition-of-done',
          dodStatus: 'complete',
          artefact: 'artefacts/archived-feature/stories/af.1-story.md',
          dorArtefact: 'artefacts/archived-feature/dor/af.1-dor.md',
          testPlanArtefact: 'artefacts/archived-feature/test-plans/af.1-test-plan.md',
          dodArtefact: 'artefacts/archived-feature/dod/af.1-dod.md',
          reviewArtefact: 'artefacts/archived-feature/review/af.1-review.md'
        }
      ]
    };
    // Active state has no features, archive has the feature
    setupFixture(tmpDir, {
      featuresFilter: [],
      archiveFeatures: [archFeature]
    });
    // Stub artefact files for archive feature
    const stubPaths = [
      archFeature.discoveryArtefact,
      archFeature.benefitMetricArtefact,
      ...archFeature.stories.flatMap(s => [s.artefact, s.dorArtefact, s.testPlanArtefact, s.dodArtefact, s.reviewArtefact].filter(Boolean))
    ];
    for (const p of stubPaths) {
      const full = path.join(tmpDir, p);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, '# stub\n');
    }
    const { generateReport } = loadModule();
    const report = generateReport({ feature: 'archived-feature', rootDir: tmpDir });
    assert.ok(typeof report === 'string', 'report should be a string');
    assert.ok(report.includes('archived-feature'), 'report should contain slug');
    assert.ok(/\[archived\]/i.test(report) || /archived/i.test(report), 'report should indicate archived');
  } finally {
    rmDir(tmpDir);
  }
});

// ---------- T4: Archive fallback — checks archive when active state misses ----------
test('T4: archive fallback — returns valid report, not error', () => {
  const tmpDir = makeTmpDir();
  try {
    const archFeature = {
      slug: 'archived-feature',
      name: 'Archived Feature',
      stage: 'definition-of-done',
      health: 'green',
      discoveryArtefact: 'artefacts/archived-feature/discovery.md',
      benefitMetricArtefact: 'artefacts/archived-feature/benefit-metric.md',
      stories: [{ slug: 'af.1', name: 'Archived story', stage: 'definition-of-done', artefact: 'artefacts/archived-feature/stories/af.1-story.md' }]
    };
    setupFixture(tmpDir, {
      featuresFilter: [],
      archiveFeatures: [archFeature]
    });
    // Create minimal artefact stubs
    for (const p of [archFeature.discoveryArtefact, archFeature.benefitMetricArtefact, archFeature.stories[0].artefact]) {
      const full = path.join(tmpDir, p);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, '# stub\n');
    }
    const { generateReport } = loadModule();
    const report = generateReport({ feature: 'archived-feature', rootDir: tmpDir });
    assert.ok(typeof report === 'string', 'report should be a string');
    assert.ok(!report.includes('Error'), 'report should not be an error');
    assert.ok(report.length > 50, 'report should have substantive content');
  } finally {
    rmDir(tmpDir);
  }
});

// ---------- T5: Gate evidence section populated when trace JSONL matches ----------
test('T5: gate evidence populated when trace JSONL matches', () => {
  const tmpDir = makeTmpDir();
  try {
    // Use test-feature, give tf.1 a prUrl and commitSha that matches a trace
    const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'trace-report-test-fixture.json'), 'utf8'));
    const feature = fixture.features.find(f => f.slug === 'test-feature');
    feature.stories[0].commitSha = 'abc123def456';
    const ghDir = path.join(tmpDir, '.github');
    fs.mkdirSync(ghDir, { recursive: true });
    fs.writeFileSync(path.join(ghDir, 'pipeline-state.json'), JSON.stringify({ ...fixture, features: [feature] }, null, 2));
    // Stub artefacts
    for (const s of feature.stories) {
      for (const key of ['artefact', 'testPlanArtefact', 'dorArtefact', 'dodArtefact', 'reviewArtefact']) {
        if (s[key]) {
          const full = path.join(tmpDir, s[key]);
          fs.mkdirSync(path.dirname(full), { recursive: true });
          fs.writeFileSync(full, '# stub\n');
        }
      }
    }
    if (feature.discoveryArtefact) {
      const full = path.join(tmpDir, feature.discoveryArtefact);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, '# stub\n');
    }
    if (feature.benefitMetricArtefact) {
      const full = path.join(tmpDir, feature.benefitMetricArtefact);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, '# stub\n');
    }
    // Create matching JSONL
    const tracesDir = path.join(tmpDir, 'workspace', 'traces');
    fs.mkdirSync(tracesDir, { recursive: true });
    const line1 = JSON.stringify({ status: 'inProgress', trigger: 'ci', prRef: '', commitSha: 'abc123def456', startedAt: '2026-04-18T10:00:00Z' });
    const line2 = JSON.stringify({
      status: 'completed', trigger: 'ci', prRef: '', commitSha: 'abc123def456',
      startedAt: '2026-04-18T10:00:00Z', completedAt: '2026-04-18T10:00:01Z',
      verdict: 'pass', failurePattern: null, traceHash: 'abcd123456789012',
      checks: [{ name: 'check-1', passed: true }, { name: 'check-2', passed: true }]
    });
    fs.writeFileSync(path.join(tracesDir, '2026-04-18T10-00-00-000Z-ci-abcd1234.jsonl'), line1 + '\n' + line2 + '\n');

    const { generateReport } = loadModule();
    const report = generateReport({ feature: 'test-feature', rootDir: tmpDir });
    assert.ok(/gate evidence/i.test(report), 'report should contain gate evidence section');
    assert.ok(report.includes('pass'), 'report should contain verdict');
    assert.ok(report.includes('abcd123456789012'), 'report should contain traceHash');
  } finally {
    rmDir(tmpDir);
  }
});

// ---------- T6: Gate evidence shows "not found" when no matching trace ----------
test('T6: gate evidence shows "not found" when no matching trace', () => {
  const tmpDir = makeTmpDir();
  try {
    setupFixture(tmpDir, {
      featuresFilter: ['test-feature'],
      stubArtefacts: ['test-feature']
      // No trace entries created
    });
    const { generateReport } = loadModule();
    const report = generateReport({ feature: 'test-feature', rootDir: tmpDir });
    // Stories have prUrl but no matching JSONL
    assert.ok(/not found|no trace|none/i.test(report), 'report should indicate gate evidence not found');
  } finally {
    rmDir(tmpDir);
  }
});

// ---------- T7: Missing artefact files marked as MISSING ----------
test('T7: missing artefact files marked as MISSING with path', () => {
  const tmpDir = makeTmpDir();
  try {
    // Use missing-artefacts-feature but do NOT create artefact stubs
    setupFixture(tmpDir, {
      featuresFilter: ['missing-artefacts-feature'],
      stubArtefacts: [] // intentionally empty — no stubs
    });
    const { generateReport } = loadModule();
    const report = generateReport({ feature: 'missing-artefacts-feature', rootDir: tmpDir });
    assert.ok(/MISSING/i.test(report), 'report should contain MISSING indicator');
    assert.ok(report.includes('artefacts/missing-artefacts-feature/'), 'report should show expected path');
  } finally {
    rmDir(tmpDir);
  }
});

// ---------- T8: Unknown feature slug exits with error ----------
test('T8: unknown feature slug returns error with available slugs', () => {
  const tmpDir = makeTmpDir();
  try {
    setupFixture(tmpDir, {
      featuresFilter: ['test-feature'],
      stubArtefacts: []
    });
    const { generateReport } = loadModule();
    let threw = false;
    let errorMsg = '';
    try {
      generateReport({ feature: 'nonexistent', rootDir: tmpDir });
    } catch (e) {
      threw = true;
      errorMsg = e.message;
    }
    assert.ok(threw, 'should throw for unknown slug');
    assert.ok(errorMsg.includes('nonexistent'), 'error should name the missing slug');
    assert.ok(errorMsg.includes('test-feature'), 'error should list available slugs');
  } finally {
    rmDir(tmpDir);
  }
});

// ---------- T9: No arguments prints usage ----------
test('T9: no arguments prints usage with --feature flag', () => {
  const tmpDir = makeTmpDir();
  try {
    setupFixture(tmpDir, { featuresFilter: [], stubArtefacts: [] });
    const { generateReport } = loadModule();
    let threw = false;
    let errorMsg = '';
    try {
      generateReport({ rootDir: tmpDir }); // no feature
    } catch (e) {
      threw = true;
      errorMsg = e.message;
    }
    assert.ok(threw, 'should throw when no feature specified');
    assert.ok(errorMsg.includes('--feature'), 'error should mention --feature flag');
  } finally {
    rmDir(tmpDir);
  }
});

// ---------- T10: Story at early stage shows links as "not yet reached" ----------
test('T10: early stage story shows links as "not yet reached"', () => {
  const tmpDir = makeTmpDir();
  try {
    setupFixture(tmpDir, {
      featuresFilter: ['early-feature'],
      stubArtefacts: ['early-feature']
    });
    const { generateReport } = loadModule();
    const report = generateReport({ feature: 'early-feature', rootDir: tmpDir });
    // ef.1 at definition stage — test-plan, DoR, DoD should be "not yet reached"
    assert.ok(/not yet reached/i.test(report), 'report should contain "not yet reached" for early-stage links');
    // Should NOT mark them as MISSING
    const ef1Section = report.split(/ef\.2|DoR story/i)[0]; // rough split to get ef.1 portion
    // Check that test-plan for ef.1 is not MISSING
    const lines = report.split('\n');
    let inEf1 = false;
    let foundNotYetReached = false;
    for (const line of lines) {
      if (line.includes('ef.1') || line.includes('Early story')) inEf1 = true;
      if (inEf1 && (line.includes('ef.2') || line.includes('DoR story'))) inEf1 = false;
      if (inEf1 && /not yet reached/i.test(line)) foundNotYetReached = true;
    }
    assert.ok(foundNotYetReached, 'ef.1 section should have "not yet reached" for later-stage links');
  } finally {
    rmDir(tmpDir);
  }
});

// ---------- T11: Story at DoR stage shows DoD as "not yet reached" ----------
test('T11: DoR stage story shows DoD as "not yet reached"', () => {
  const tmpDir = makeTmpDir();
  try {
    setupFixture(tmpDir, {
      featuresFilter: ['early-feature'],
      stubArtefacts: ['early-feature']
    });
    const { generateReport } = loadModule();
    const report = generateReport({ feature: 'early-feature', rootDir: tmpDir });
    // ef.2 at definition-of-ready — DoD should be "not yet reached"
    const lines = report.split('\n');
    let inEf2 = false;
    let dodNotYetReached = false;
    for (const line of lines) {
      if (line.includes('ef.2') || line.includes('DoR story')) inEf2 = true;
      if (inEf2 && /dod|definition.of.done/i.test(line) && /not yet reached/i.test(line)) {
        dodNotYetReached = true;
      }
    }
    assert.ok(dodNotYetReached, 'ef.2 section should show DoD as "not yet reached"');
  } finally {
    rmDir(tmpDir);
  }
});

// ---------- NFR1: Report generation completes in under 5 seconds ----------
test('NFR1: report generation completes in under 5 seconds for 20 stories', () => {
  const tmpDir = makeTmpDir();
  try {
    // Build a fixture with 20 stories
    const ghDir = path.join(tmpDir, '.github');
    fs.mkdirSync(ghDir, { recursive: true });
    const stories = [];
    for (let i = 1; i <= 20; i++) {
      const slug = `perf.${i}`;
      stories.push({
        slug,
        name: `Performance story ${i}`,
        stage: 'definition-of-done',
        dodStatus: 'complete',
        artefact: `artefacts/perf-feature/stories/${slug}-story.md`,
        testPlanArtefact: `artefacts/perf-feature/test-plans/${slug}-test-plan.md`,
        dorArtefact: `artefacts/perf-feature/dor/${slug}-dor.md`,
        dodArtefact: `artefacts/perf-feature/dod/${slug}-dod.md`
      });
    }
    const state = {
      version: '1',
      features: [{
        slug: 'perf-feature',
        name: 'Performance Feature',
        stage: 'definition-of-done',
        health: 'green',
        discoveryArtefact: 'artefacts/perf-feature/discovery.md',
        benefitMetricArtefact: 'artefacts/perf-feature/benefit-metric.md',
        stories
      }]
    };
    fs.writeFileSync(path.join(ghDir, 'pipeline-state.json'), JSON.stringify(state, null, 2));
    // Create stub files
    for (const s of stories) {
      for (const key of ['artefact', 'testPlanArtefact', 'dorArtefact', 'dodArtefact']) {
        if (s[key]) {
          const full = path.join(tmpDir, s[key]);
          fs.mkdirSync(path.dirname(full), { recursive: true });
          fs.writeFileSync(full, '# stub\n');
        }
      }
    }
    const discDir = path.join(tmpDir, 'artefacts', 'perf-feature');
    fs.mkdirSync(discDir, { recursive: true });
    fs.writeFileSync(path.join(discDir, 'discovery.md'), '# stub\n');
    fs.writeFileSync(path.join(discDir, 'benefit-metric.md'), '# stub\n');

    const { generateReport } = loadModule();
    const start = Date.now();
    const report = generateReport({ feature: 'perf-feature', rootDir: tmpDir });
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 5000, `report took ${elapsed}ms — should be under 5000ms`);
    assert.ok(typeof report === 'string' && report.length > 0, 'report should be non-empty');
  } finally {
    rmDir(tmpDir);
  }
});

// ===================================================================
// Summary
// ===================================================================

console.log('');
console.log(`[check-trace-report] ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
