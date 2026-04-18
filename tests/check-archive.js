#!/usr/bin/env node
// check-archive.js — governance tests for pipeline-state.json archive mechanism
// Covers T1–T11 unit tests, T-NFR1, T-NFR2 from test plan psa.1
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const FIXTURE_PATH = path.join(__dirname, 'fixtures', 'archive-test-fixture.json');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
// Run the archive function in isolation against a temp directory with the fixture
function setupTempEnv() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'archive-test-'));
  const ghDir = path.join(tmp, '.github');
  fs.mkdirSync(ghDir, { recursive: true });
  const fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));
  fs.writeFileSync(path.join(ghDir, 'pipeline-state.json'), JSON.stringify(fixture, null, 2));
  return { tmp, ghDir, fixture };
}

function loadArchiveModule() {
  const modPath = path.join(__dirname, '..', 'scripts', 'archive-completed-features.js');
  if (!fs.existsSync(modPath)) return null;
  // Clear require cache so each test gets a fresh module
  delete require.cache[require.resolve(modPath)];
  return require(modPath);
}

function cleanup(tmp) {
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
}

// ── Pre-check ────────────────────────────────────────────────────────────────
const archiveMod = loadArchiveModule();
if (!archiveMod || typeof archiveMod.archive !== 'function') {
  console.log('[check-archive] SKIP: scripts/archive-completed-features.js not found or does not export archive()');
  console.log(`[check-archive] ${passed} passed, ${failed} failed`);
  process.exit(1);
}

// ── T1 — Archive script moves DoD-complete features to archive file ──────────
console.log('  AC1 — archive moves DoD-complete features');
{
  const { tmp, ghDir, fixture } = setupTempEnv();
  archiveMod.archive(tmp);
  const active  = JSON.parse(fs.readFileSync(path.join(ghDir, 'pipeline-state.json'), 'utf8'));
  const archPath = path.join(ghDir, 'pipeline-state-archive.json');
  const archExists = fs.existsSync(archPath);
  const archive = archExists ? JSON.parse(fs.readFileSync(archPath, 'utf8')) : { features: [] };
  const archSlugs = (archive.features || []).map(f => f.slug);
  assert(archExists, 'T1a archive file created');
  assert(archSlugs.includes('completed-feature-1'), 'T1b completed-feature-1 in archive');
  assert(archSlugs.includes('completed-feature-2'), 'T1c completed-feature-2 in archive');
  assert(!active.features.find(f => f.slug === 'completed-feature-1'), 'T1d completed-feature-1 removed from active');
  assert(!active.features.find(f => f.slug === 'completed-feature-2'), 'T1e completed-feature-2 removed from active');
  cleanup(tmp);
}

// ── T2 — Archive preserves feature data integrity ────────────────────────────
console.log('  AC1 — data integrity');
{
  const { tmp, ghDir, fixture } = setupTempEnv();
  const origFeature1 = JSON.parse(JSON.stringify(fixture.features[0]));
  archiveMod.archive(tmp);
  const archive = JSON.parse(fs.readFileSync(path.join(ghDir, 'pipeline-state-archive.json'), 'utf8'));
  const archived1 = archive.features.find(f => f.slug === 'completed-feature-1');
  assert(JSON.stringify(archived1) === JSON.stringify(origFeature1), 'T2 archived feature is identical to original');
  cleanup(tmp);
}

// ── T3 — Archive is idempotent ───────────────────────────────────────────────
console.log('  AC1 — idempotent');
{
  const { tmp, ghDir } = setupTempEnv();
  archiveMod.archive(tmp);
  const afterFirst = fs.readFileSync(path.join(ghDir, 'pipeline-state-archive.json'), 'utf8');
  const activeFirst = fs.readFileSync(path.join(ghDir, 'pipeline-state.json'), 'utf8');
  archiveMod.archive(tmp);
  const afterSecond = fs.readFileSync(path.join(ghDir, 'pipeline-state-archive.json'), 'utf8');
  const activeSecond = fs.readFileSync(path.join(ghDir, 'pipeline-state.json'), 'utf8');
  assert(afterFirst === afterSecond, 'T3a archive file unchanged on second run');
  assert(activeFirst === activeSecond, 'T3b active file unchanged on second run');
  cleanup(tmp);
}

// ── T4 — Active file contains only in-flight features ────────────────────────
console.log('  AC2 — active file in-flight only');
{
  const { tmp, ghDir } = setupTempEnv();
  archiveMod.archive(tmp);
  const active = JSON.parse(fs.readFileSync(path.join(ghDir, 'pipeline-state.json'), 'utf8'));
  // Only active-feature-3 should remain (it has in-flight stories)
  assert(active.features.length === 1, 'T4a active features count is 1');
  assert(active.features[0].slug === 'active-feature-3', 'T4b remaining feature is active-feature-3');
  cleanup(tmp);
}

// ── T5 — Active file size is reduced ─────────────────────────────────────────
console.log('  AC2 — size reduction');
{
  const { tmp, ghDir } = setupTempEnv();
  const before = fs.readFileSync(path.join(ghDir, 'pipeline-state.json'), 'utf8').length;
  archiveMod.archive(tmp);
  const after = fs.readFileSync(path.join(ghDir, 'pipeline-state.json'), 'utf8').length;
  assert(after < before, `T5 active file reduced from ${before} to ${after} bytes`);
  cleanup(tmp);
}

// ── T6 — Viz merge function combines archive and active ──────────────────────
console.log('  AC3 — viz merge');
{
  if (typeof archiveMod.mergeState === 'function') {
    const activeData  = { features: [{ slug: 'active-1', name: 'A', track: 'short', stage: 'definition', health: 'green' }] };
    const archiveData = { features: [
      { slug: 'archived-1', name: 'B', track: 'library', stage: 'definition-of-done', health: 'green' },
      { slug: 'archived-2', name: 'C', track: 'library', stage: 'definition-of-done', health: 'green' }
    ]};
    const merged = archiveMod.mergeState(activeData, archiveData);
    assert(merged.features.length === 3, 'T6a merged features count is 3');
    assert(merged.features.some(f => f.slug === 'active-1'), 'T6b active feature present');
    assert(merged.features.some(f => f.slug === 'archived-1'), 'T6c archived feature 1 present');
    assert(merged.features.some(f => f.slug === 'archived-2'), 'T6d archived feature 2 present');
  } else {
    assert(false, 'T6 mergeState function not exported');
  }
}

// ── T7 — Merge handles missing archive gracefully ───────────────────────────
console.log('  AC3 — missing archive');
{
  if (typeof archiveMod.mergeState === 'function') {
    const activeData = { features: [{ slug: 'only-one', name: 'X', track: 'short', stage: 'definition', health: 'green' }] };
    const merged = archiveMod.mergeState(activeData, null);
    assert(merged.features.length === 1, 'T7a returns active features only');
    assert(merged.features[0].slug === 'only-one', 'T7b correct feature returned');
  } else {
    assert(false, 'T7 mergeState function not exported');
  }
}

// ── T8 — Archive accessible for signal recording ────────────────────────────
console.log('  AC4 — signal recording on archive');
{
  const { tmp, ghDir } = setupTempEnv();
  archiveMod.archive(tmp);
  const archPath = path.join(ghDir, 'pipeline-state-archive.json');
  const archive = JSON.parse(fs.readFileSync(archPath, 'utf8'));
  const f1 = archive.features.find(f => f.slug === 'completed-feature-1');
  assert(f1 && f1.benefitMetrics && f1.benefitMetrics.m1, 'T8a archived feature has benefitMetrics');
  // Simulate signal recording: update a metric field and write back
  f1.benefitMetrics.m1.signal = 'achieved';
  fs.writeFileSync(archPath, JSON.stringify(archive, null, 2));
  const reread = JSON.parse(fs.readFileSync(archPath, 'utf8'));
  const updated = reread.features.find(f => f.slug === 'completed-feature-1');
  assert(updated.benefitMetrics.m1.signal === 'achieved', 'T8b signal update persisted in archive');
  cleanup(tmp);
}

// ── T9 — Top-level archive field in active file ─────────────────────────────
console.log('  AC6 — archive pointer field');
{
  const { tmp, ghDir } = setupTempEnv();
  archiveMod.archive(tmp);
  const active = JSON.parse(fs.readFileSync(path.join(ghDir, 'pipeline-state.json'), 'utf8'));
  assert(active.archive === '.github/pipeline-state-archive.json', 'T9 archive field is correct path');
  cleanup(tmp);
}

// ── T10 — Partial archive: in-flight feature keeps only active stories ──────
console.log('  AC7 — partial archive (Phase 3 pattern)');
{
  const { tmp, ghDir } = setupTempEnv();
  archiveMod.archive(tmp);
  const active  = JSON.parse(fs.readFileSync(path.join(ghDir, 'pipeline-state.json'), 'utf8'));
  const archive = JSON.parse(fs.readFileSync(path.join(ghDir, 'pipeline-state-archive.json'), 'utf8'));
  const activeF3 = active.features.find(f => f.slug === 'active-feature-3');
  const archF3  = archive.features.find(f => f.slug === 'active-feature-3');
  // Active should have 10 in-flight stories
  assert(activeF3 && activeF3.stories.length === 10, `T10a active stories count is ${activeF3 ? activeF3.stories.length : 'n/a'} (expected 10)`);
  // Archive should have completedStories with 16 stories
  assert(archF3 && archF3.completedStories && archF3.completedStories.length === 16, `T10b archived completedStories count is ${archF3 && archF3.completedStories ? archF3.completedStories.length : 'n/a'} (expected 16)`);
  cleanup(tmp);
}

// ── T11 — Partial archive preserves in-flight story data ─────────────────────
console.log('  AC7 — in-flight stories preserved');
{
  const { tmp, ghDir, fixture } = setupTempEnv();
  const origInflight = fixture.features[2].stories.filter(s => s.dodStatus !== 'complete');
  archiveMod.archive(tmp);
  const active = JSON.parse(fs.readFileSync(path.join(ghDir, 'pipeline-state.json'), 'utf8'));
  const activeF3 = active.features.find(f => f.slug === 'active-feature-3');
  const preserved = origInflight.every(orig => {
    const inActive = activeF3.stories.find(s => s.slug === orig.slug);
    return inActive && JSON.stringify(inActive) === JSON.stringify(orig);
  });
  assert(preserved, 'T11 all in-flight stories byte-identical to originals');
  cleanup(tmp);
}

// ── T-NFR1 — Archive file is valid JSON ──────────────────────────────────────
console.log('  NFR — JSON validity');
{
  const { tmp, ghDir } = setupTempEnv();
  archiveMod.archive(tmp);
  const archPath = path.join(ghDir, 'pipeline-state-archive.json');
  let valid = false;
  try { JSON.parse(fs.readFileSync(archPath, 'utf8')); valid = true; } catch (_) {}
  assert(valid, 'T-NFR1 archive file is valid JSON');
  cleanup(tmp);
}

// ── T-NFR2 — Active file is valid JSON after archive ─────────────────────────
{
  const { tmp, ghDir } = setupTempEnv();
  archiveMod.archive(tmp);
  let valid = false;
  try { JSON.parse(fs.readFileSync(path.join(ghDir, 'pipeline-state.json'), 'utf8')); valid = true; } catch (_) {}
  assert(valid, 'T-NFR2 active file is valid JSON after archive');
  cleanup(tmp);
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`[check-archive] ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
