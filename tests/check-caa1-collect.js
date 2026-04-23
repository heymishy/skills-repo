#!/usr/bin/env node
// check-caa1-collect.js — governance tests for caa.1 (--collect flag for trace-report.js)
// Covers 18 tests across AC1–AC6 and NFR (performance + security)
// Tests FAIL until scripts/trace-report.js is updated with collectArtefacts logic — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs            = require('fs');
const path          = require('path');
const os            = require('os');
const { spawnSync } = require('child_process');

const ROOT       = path.join(__dirname, '..');
const SCRIPT     = path.join(ROOT, 'scripts', 'trace-report.js');
const { collectArtefacts, resolveActiveFeature, collectGovernanceInputs, classifyArtefact } = require(SCRIPT);

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

// ── helper: build a minimal temp repo dir ────────────────────────────────────
function makeTempRepo(featureSlug, artefactFiles, pipelineState) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'caa1-'));
  const artefactsDir = path.join(dir, 'artefacts', featureSlug);
  fs.mkdirSync(artefactsDir, { recursive: true });
  fs.mkdirSync(path.join(dir, '.github'), { recursive: true });

  for (const [relPath, content] of Object.entries(artefactFiles)) {
    const full = path.join(artefactsDir, relPath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
  }

  const state = pipelineState || {
    features: [{ slug: featureSlug, stage: 'review' }]
  };
  fs.writeFileSync(
    path.join(dir, '.github', 'pipeline-state.json'),
    JSON.stringify(state, null, 2),
    'utf8'
  );

  // Place context.yml in root (for security NFR test)
  fs.writeFileSync(path.join(dir, 'context.yml'), 'meta:\n  name: test\n', 'utf8');

  return dir;
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// ── Unit Tests ────────────────────────────────────────────────────────────────

// T1 — AC1: sequentially numbered files in staging dir
console.log('\n[caa1] T1 — collectArtefacts: produces sequentially numbered files');
{
  const slug = 'test-feature-caa1';
  const dir = makeTempRepo(slug, {
    'discovery.md': '# Discovery\n',
    'benefit-metric.md': '# Benefit\n',
    'stories/s1.md': '# Story 1\n'
  });
  try {
    collectArtefacts(slug, dir);
    const stagingDir = path.join(dir, '.ci-artefact-staging', slug);
    const stagingFiles = fs.readdirSync(stagingDir).filter(f => f !== 'manifest.json').sort();
    assert(stagingFiles.length === 3, 'T1a: 3 files in staging dir');
    assert(stagingFiles[0].startsWith('01-'), 'T1b: first file prefixed 01-');
    assert(stagingFiles[1].startsWith('02-'), 'T1c: second file prefixed 02-');
    assert(stagingFiles[2].startsWith('03-'), 'T1d: third file prefixed 03-');
    // content preserved
    const firstFile = path.join(stagingDir, stagingFiles[0]);
    const content = fs.readFileSync(firstFile, 'utf8');
    assert(content.length > 0, 'T1e: content preserved (not empty)');
  } finally {
    cleanup(dir);
  }
}

// T2 — AC1 + Security NFR: staging dir does NOT contain pipeline-state.json or context.yml
console.log('\n[caa1] T2 — collectArtefacts: excludes pipeline-state.json and context.yml');
{
  const slug = 'test-feature-caa1';
  const dir = makeTempRepo(slug, { 'discovery.md': '# Discovery\n' });
  try {
    collectArtefacts(slug, dir);
    const stagingDir = path.join(dir, '.ci-artefact-staging', slug);
    const stagingFiles = fs.readdirSync(stagingDir);
    assert(!stagingFiles.includes('pipeline-state.json'), 'T2a: pipeline-state.json excluded');
    assert(!stagingFiles.includes('context.yml'), 'T2b: context.yml excluded');
  } finally {
    cleanup(dir);
  }
}

// T3 — AC2: buildManifest writes required fields
console.log('\n[caa1] T3 — buildManifest: writes required fields to manifest.json');
{
  const slug = 'test-feature-caa1';
  const dir = makeTempRepo(slug, {
    'discovery.md': '# D\n',
    'benefit-metric.md': '# B\n',
    'stories/s1.md': '# S\n'
  });
  try {
    collectArtefacts(slug, dir);
    const manifestPath = path.join(dir, '.ci-artefact-staging', slug, 'manifest.json');
    assert(fs.existsSync(manifestPath), 'T3a: manifest.json exists');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert(manifest.featureSlug === slug, 'T3b: featureSlug correct');
    assert(typeof manifest.collectedAt === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(manifest.collectedAt),
      'T3c: collectedAt is ISO 8601');
    assert(manifest.fileCount === 3, 'T3d: fileCount is 3');
    assert(Array.isArray(manifest.files) && manifest.files.length === 3, 'T3e: files array has 3 entries');
    assert(manifest.files.every(f => f.filename && f.sourcePath), 'T3f: each file entry has filename and sourcePath');
    assert(manifest.files.every(f => typeof f.sha256 === 'string' && f.sha256.length === 64), 'T3g: each file entry has sha256 (64-char hex)');
    assert(Array.isArray(manifest.governanceInputs), 'T3h: manifest has governanceInputs array');
    assert(manifest.files.every(f => typeof f.type === 'string' && f.type.length > 0), 'T3i: each file entry has a type string');
    assert(manifest.files.every(f => typeof f.displayName === 'string' && f.displayName.length > 0), 'T3j: each file entry has a displayName string');
  } finally {
    cleanup(dir);
  }
}

// T4 — AC2: fileCount matches actual file count
console.log('\n[caa1] T4 — buildManifest: fileCount matches actual file count');
{
  const slug = 'test-feature-caa1';
  const dir = makeTempRepo(slug, {
    'a.md': '# A\n',
    'b.md': '# B\n'
  });
  try {
    collectArtefacts(slug, dir);
    const stagingDir = path.join(dir, '.ci-artefact-staging', slug);
    const actualFiles = fs.readdirSync(stagingDir).filter(f => f !== 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(path.join(stagingDir, 'manifest.json'), 'utf8'));
    assert(manifest.fileCount === actualFiles.length, 'T4a: fileCount matches actual count');
    assert(manifest.fileCount === manifest.files.length, 'T4b: fileCount matches files array length');
  } finally {
    cleanup(dir);
  }
}

// T5 — AC3: resolveActiveFeature returns slug when exactly one non-archived feature
console.log('\n[caa1] T5 — resolveActiveFeature: returns active slug');
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'caa1-'));
  fs.mkdirSync(path.join(dir, '.github'), { recursive: true });
  const state = {
    features: [
      { slug: 'old-feature', stage: 'archived' },
      { slug: 'active-feature', stage: 'review' }
    ]
  };
  fs.writeFileSync(path.join(dir, '.github', 'pipeline-state.json'), JSON.stringify(state), 'utf8');
  try {
    const resolved = resolveActiveFeature(undefined, dir);
    assert(resolved === 'active-feature', 'T5: resolves to the one non-archived feature slug');
  } catch (e) {
    assert(false, `T5: threw unexpectedly: ${e.message}`);
  } finally {
    cleanup(dir);
  }
}

// T6 — AC4: no feature resolved → exit code 1 + stderr message
console.log('\n[caa1] T6 — resolveActiveFeature: AC4 — throws with required message when no feature');
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'caa1-'));
  fs.mkdirSync(path.join(dir, '.github'), { recursive: true });
  const state = { features: [{ slug: 'a', stage: 'archived' }, { slug: 'b', stage: 'archived' }] };
  fs.writeFileSync(path.join(dir, '.github', 'pipeline-state.json'), JSON.stringify(state), 'utf8');
  try {
    let threw = false;
    let msg = '';
    try {
      resolveActiveFeature(undefined, dir);
    } catch (e) {
      threw = true;
      msg = e.message;
    }
    assert(threw, 'T6a: throws when no active feature');
    assert(msg.includes('[trace-report --collect] No feature resolved.'), 'T6b: error contains required message');
    assert(msg.includes('--feature=<slug>'), 'T6c: error mentions --feature flag');
  } finally {
    cleanup(dir);
  }
}

// T7 — AC4: CLI exits code 1 with stderr when --feature is absent and no single active feature
console.log('\n[caa1] T7 — CLI: exits 1 with stderr when no feature resolved');
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'caa1-'));
  fs.mkdirSync(path.join(dir, '.github'), { recursive: true });
  const state = { features: [] };
  fs.writeFileSync(path.join(dir, '.github', 'pipeline-state.json'), JSON.stringify(state), 'utf8');
  fs.mkdirSync(path.join(dir, 'artefacts'), { recursive: true });
  try {
    const result = spawnSync('node', [SCRIPT, '--collect'], { cwd: dir, encoding: 'utf8' });
    assert(result.status === 1, 'T7a: exit code is 1');
    assert(result.stderr.includes('[trace-report --collect]'), 'T7b: stderr contains marker');
  } finally {
    cleanup(dir);
  }
}

// T8 — AC5: idempotent — second run clears and rebuilds
console.log('\n[caa1] T8 — collectArtefacts: AC5 — second run clears and rebuilds staging dir');
{
  const slug = 'test-feature-caa1';
  const dir = makeTempRepo(slug, {
    'discovery.md': '# Discovery\n'
  });
  try {
    // First run
    collectArtefacts(slug, dir);
    const stagingDir = path.join(dir, '.ci-artefact-staging', slug);
    const beforeFiles = fs.readdirSync(stagingDir).sort();

    // Write a stale file that should be removed
    fs.writeFileSync(path.join(stagingDir, 'stale-file.md'), 'old content\n', 'utf8');

    // Second run
    collectArtefacts(slug, dir);
    const afterFiles = fs.readdirSync(stagingDir).sort();

    assert(!afterFiles.includes('stale-file.md'), 'T8a: stale file removed on second run');
    assert(afterFiles.includes('manifest.json'), 'T8b: manifest.json present after second run');
    assert(afterFiles.filter(f => f !== 'manifest.json').length === 1, 'T8c: correct file count after rebuild');
  } finally {
    cleanup(dir);
  }
}

// T9 — AC6: uses only Node.js built-ins (no external deps)
console.log('\n[caa1] T9 — AC6: no external npm packages used');
{
  const src = fs.readFileSync(SCRIPT, 'utf8');
  // The collect section must only require: fs, path, crypto, os, child_process — all built-ins
  const requireMatches = src.match(/require\(['"]([^'"]+)['"]\)/g) || [];
  const external = requireMatches
    .map(m => m.replace(/require\(['"]|['"]\)/g, ''))
    .filter(m => !m.startsWith('.') && !['fs', 'path', 'crypto', 'os', 'child_process'].includes(m));
  assert(external.length === 0, `T9: no external deps (found: ${external.join(', ') || 'none'})`);
}

// T9b — collectGovernanceInputs: returns array with sourcePath and sha256
console.log('\n[caa1] T9b — collectGovernanceInputs: returns array with sourcePath + sha256');
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'caa1-'));
  fs.mkdirSync(path.join(dir, '.github', 'skills', 'test-skill'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.github', 'copilot-instructions.md'), '# Instructions\n', 'utf8');
  fs.writeFileSync(path.join(dir, '.github', 'skills', 'test-skill', 'SKILL.md'), '# Skill\n', 'utf8');
  try {
    const inputs = collectGovernanceInputs(dir);
    assert(Array.isArray(inputs), 'T9b-1: returns array');
    assert(inputs.length >= 1, 'T9b-2: at least one governance input found');
    assert(inputs.every(i => typeof i.sourcePath === 'string'), 'T9b-3: each entry has sourcePath');
    assert(inputs.every(i => typeof i.sha256 === 'string' && i.sha256.length === 64), 'T9b-4: each entry has sha256 (64-char hex)');
    assert(inputs.some(i => i.sourcePath === '.github/copilot-instructions.md'), 'T9b-5: copilot-instructions.md included');
    assert(inputs.some(i => i.sourcePath.endsWith('SKILL.md')), 'T9b-6: SKILL.md files included');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// T9c — classifyArtefact: correct type and displayName for known path patterns
console.log('\n[caa1] T9c — classifyArtefact: type + displayName for known path patterns');
{
  const slug = 'my-feature';
  const cases = [
    { p: `artefacts/${slug}/discovery.md`,                              type: 'Discovery',           displayName: 'Discovery' },
    { p: `artefacts/${slug}/benefit-metric.md`,                         type: 'Benefit Metric',      displayName: 'Benefit Metric' },
    { p: `artefacts/${slug}/epics/e1-my-feature.md`,                    type: 'Epic',                displayName: null /* any string */ },
    { p: `artefacts/${slug}/stories/caa.1-collect-flag.md`,             type: 'Story',               displayName: 'Caa.1 Collect Flag' },
    { p: `artefacts/${slug}/test-plans/caa.1-collect-flag-test-plan.md`,type: 'Test Plan',           displayName: 'Caa.1 Collect Flag' },
    { p: `artefacts/${slug}/dor/caa.1-collect-flag-dor.md`,             type: 'Definition of Ready', displayName: 'Caa.1 Collect Flag' },
    { p: `artefacts/${slug}/dor/caa.1-collect-flag-dor-contract.md`,    type: 'Definition of Ready', displayName: 'Caa.1 Collect Flag (Contract)' },
    { p: `artefacts/${slug}/dod/caa.1-collect-flag-dod.md`,             type: 'Definition of Done',  displayName: 'Caa.1 Collect Flag' },
    { p: `artefacts/${slug}/review/caa.1-review-1.md`,                  type: 'Review',              displayName: 'Caa.1' },
  ];
  for (const c of cases) {
    const result = classifyArtefact(c.p);
    assert(result.type === c.type, `T9c type: ${c.p} → "${result.type}" (expected "${c.type}")`);
    if (c.displayName !== null) {
      assert(result.displayName === c.displayName, `T9c displayName: ${c.p} → "${result.displayName}" (expected "${c.displayName}")`);
    } else {
      assert(typeof result.displayName === 'string' && result.displayName.length > 0, `T9c displayName: ${c.p} → non-empty string`);
    }
    assert(typeof result.typeOrder === 'number', `T9c typeOrder: ${c.p} → number`);
  }
}

// T10 — AC1: files sourced only from artefacts/[slug]/ subtree
console.log('\n[caa1] T10 — collectArtefacts: sourcePath entries are under artefacts/[slug]/');
{
  const slug = 'test-feature-caa1';
  const dir = makeTempRepo(slug, {
    'discovery.md': '# D\n',
    'dor/caa1-dor.md': '# DoR\n'
  });
  try {
    collectArtefacts(slug, dir);
    const manifest = JSON.parse(
      fs.readFileSync(path.join(dir, '.ci-artefact-staging', slug, 'manifest.json'), 'utf8')
    );
    assert(
      manifest.files.every(f => f.sourcePath.startsWith(`artefacts/${slug}/`)),
      'T10: all sourcePath values are under artefacts/[slug]/'
    );
  } finally {
    cleanup(dir);
  }
}

// T11 — AC2: manifest does not count manifest.json itself in fileCount
console.log('\n[caa1] T11 — buildManifest: manifest.json is not counted in fileCount');
{
  const slug = 'test-feature-caa1';
  const dir = makeTempRepo(slug, { 'story.md': '# S\n' });
  try {
    collectArtefacts(slug, dir);
    const stagingDir = path.join(dir, '.ci-artefact-staging', slug);
    const manifest = JSON.parse(fs.readFileSync(path.join(stagingDir, 'manifest.json'), 'utf8'));
    const actualDataFiles = fs.readdirSync(stagingDir).filter(f => f !== 'manifest.json');
    assert(manifest.fileCount === actualDataFiles.length, 'T11: manifest.json excluded from fileCount');
  } finally {
    cleanup(dir);
  }
}

// T12 — AC3 edge: --feature flag overrides auto-resolve
console.log('\n[caa1] T12 — resolveActiveFeature: explicit --feature overrides auto-resolve');
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'caa1-'));
  fs.mkdirSync(path.join(dir, '.github'), { recursive: true });
  const state = {
    features: [
      { slug: 'feature-a', stage: 'review' },
      { slug: 'feature-b', stage: 'review' }  // two active — auto-resolve would fail
    ]
  };
  fs.writeFileSync(path.join(dir, '.github', 'pipeline-state.json'), JSON.stringify(state), 'utf8');
  try {
    const resolved = resolveActiveFeature('feature-a', dir);
    assert(resolved === 'feature-a', 'T12: explicit flag resolves to the named feature');
  } catch (e) {
    assert(false, `T12: threw unexpectedly: ${e.message}`);
  } finally {
    cleanup(dir);
  }
}

// ── Integration Tests ─────────────────────────────────────────────────────────

// T13 — AC1+AC2+AC5: full CLI invocation with --collect --feature=
console.log('\n[caa1] T13 — Integration: full --collect --feature= invocation');
{
  const slug = 'int-test-feature';
  const dir = makeTempRepo(slug, {
    'discovery.md': '# Discovery\n',
    'stories/s1.md': '# S1\n'
  });
  try {
    const result = spawnSync('node', [SCRIPT, '--collect', `--feature=${slug}`], {
      cwd: dir, encoding: 'utf8'
    });
    assert(result.status === 0, 'T13a: exit code 0 on success');
    const stagingDir = path.join(dir, '.ci-artefact-staging', slug);
    assert(fs.existsSync(stagingDir), 'T13b: staging dir created');
    const manifestPath = path.join(stagingDir, 'manifest.json');
    assert(fs.existsSync(manifestPath), 'T13c: manifest.json created');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert(manifest.featureSlug === slug, 'T13d: manifest featureSlug matches');
    assert(manifest.fileCount === 2, 'T13e: correct file count');
  } finally {
    cleanup(dir);
  }
}

// T14 — AC5: CLI is idempotent on second run
console.log('\n[caa1] T14 — Integration: CLI idempotent on second run');
{
  const slug = 'int-test-feature';
  const dir = makeTempRepo(slug, { 'discovery.md': '# D\n' });
  try {
    spawnSync('node', [SCRIPT, '--collect', `--feature=${slug}`], { cwd: dir, encoding: 'utf8' });
    // inject stale file
    const stagingDir = path.join(dir, '.ci-artefact-staging', slug);
    fs.writeFileSync(path.join(stagingDir, 'stale.md'), 'old\n', 'utf8');
    const r2 = spawnSync('node', [SCRIPT, '--collect', `--feature=${slug}`], { cwd: dir, encoding: 'utf8' });
    assert(r2.status === 0, 'T14a: second run exits 0');
    const afterFiles = fs.readdirSync(stagingDir);
    assert(!afterFiles.includes('stale.md'), 'T14b: stale file removed on second run');
  } finally {
    cleanup(dir);
  }
}

// T15 — AC3: CLI auto-resolves single active feature (no --feature flag)
console.log('\n[caa1] T15 — Integration: CLI auto-resolves when one active feature');
{
  const slug = 'auto-resolve-feature';
  const dir = makeTempRepo(slug, { 'discovery.md': '# D\n' }, {
    features: [
      { slug: 'archived-feature', stage: 'archived' },
      { slug, stage: 'definition' }
    ]
  });
  try {
    const result = spawnSync('node', [SCRIPT, '--collect'], { cwd: dir, encoding: 'utf8' });
    assert(result.status === 0, 'T15a: exit 0 with auto-resolve');
    assert(fs.existsSync(path.join(dir, '.ci-artefact-staging', slug)), 'T15b: staging dir for auto-resolved slug');
  } finally {
    cleanup(dir);
  }
}

// ── NFR Tests ─────────────────────────────────────────────────────────────────

// T16 — NFR: performance ≤2s for ≤30 files
console.log('\n[caa1] T16 — NFR: performance ≤2s for 30 files');
{
  const slug = 'perf-test-feature';
  const files = {};
  for (let i = 1; i <= 30; i++) files[`file-${i}.md`] = `# File ${i}\n`.repeat(50);
  const dir = makeTempRepo(slug, files);
  try {
    const start = Date.now();
    collectArtefacts(slug, dir);
    const elapsed = Date.now() - start;
    assert(elapsed < 2000, `T16: completed in ${elapsed}ms (limit 2000ms)`);
  } finally {
    cleanup(dir);
  }
}

// T17 — NFR Security: context.yml is excluded even if it somehow appears in artefacts dir
console.log('\n[caa1] T17 — NFR Security: context.yml excluded even if in artefacts subdir');
{
  const slug = 'sec-test-feature';
  const dir = makeTempRepo(slug, { 'discovery.md': '# D\n' });
  // Manually place context.yml inside the artefacts dir (unusual but should be blocked)
  fs.writeFileSync(path.join(dir, 'artefacts', slug, 'context.yml'), 'secret: true\n', 'utf8');
  try {
    collectArtefacts(slug, dir);
    const stagingDir = path.join(dir, '.ci-artefact-staging', slug);
    const stagingFiles = fs.readdirSync(stagingDir);
    assert(!stagingFiles.includes('context.yml'), 'T17: context.yml excluded even when in artefacts dir');
  } finally {
    cleanup(dir);
  }
}

// T18 — NFR Security: pipeline-state.json excluded even if it somehow appears in artefacts dir
console.log('\n[caa1] T18 — NFR Security: pipeline-state.json excluded even if in artefacts subdir');
{
  const slug = 'sec-test-feature2';
  const dir = makeTempRepo(slug, { 'discovery.md': '# D\n' });
  fs.writeFileSync(path.join(dir, 'artefacts', slug, 'pipeline-state.json'), '{}', 'utf8');
  try {
    collectArtefacts(slug, dir);
    const stagingDir = path.join(dir, '.ci-artefact-staging', slug);
    const stagingFiles = fs.readdirSync(stagingDir);
    assert(!stagingFiles.includes('pipeline-state.json'), 'T18: pipeline-state.json excluded');
  } finally {
    cleanup(dir);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[caa1] Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
