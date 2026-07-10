#!/usr/bin/env node
/**
 * check-pcr-s1-test-runner.js
 *
 * Tests for pcr-s1 AC1/AC2 — dynamic test-file discovery runner
 * (scripts/run-all-tests.js) that replaces package.json's monolithic
 * `&&`-chained scripts.test string.
 *
 * Covers: U1, U2, IT1 (adapted — see decisions.md / plan for why "verdict
 * parity" is interpreted as coverage-superset + overall exit-code parity,
 * not a literal per-file failure-set match), IT2 (automated proxy only —
 * the real cmd.exe check is manual, per the DoR contract's assumption that
 * it cannot be validly reproduced from bash/PowerShell), IT3, N1.
 *
 * Run: node tests/check-pcr-s1-test-runner.js
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { execSync } = require('child_process');

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

// ── Module under test ──────────────────────────────────────────────────────

const runner = require('../scripts/run-all-tests');
const { discoverTestFiles, GRANDFATHER_LIST, getAllTestFiles } = runner;

// ── U1 — discoverTestFiles() returns all check-*.js files in sorted order ──

{
  const T = 'U1-discover-sorted-order';
  const dir = makeTempDir('pcr-s1-u1');
  try {
    fs.writeFileSync(path.join(dir, 'check-b.js'), '');
    fs.writeFileSync(path.join(dir, 'check-a.js'), '');
    fs.writeFileSync(path.join(dir, 'check-c.js'), '');
    fs.writeFileSync(path.join(dir, 'helpers.js'), '');
    const found = discoverTestFiles(dir);
    const basenames = found.map(f => path.basename(f));
    assert(T + '-count', basenames.length === 3, `Expected 3 files, got ${basenames.length}: ${basenames.join(', ')}`);
    assert(T + '-order', JSON.stringify(basenames) === JSON.stringify(['check-a.js', 'check-b.js', 'check-c.js']),
      `Expected sorted [check-a.js, check-b.js, check-c.js], got ${JSON.stringify(basenames)}`);
    assert(T + '-excludes-nonmatching', !basenames.includes('helpers.js'), 'helpers.js should be excluded');
  } finally { rmDir(dir); }
}

// ── U2 — discoverTestFiles() returns [] for a directory with no matches ────

{
  const T = 'U2-discover-empty';
  const dir = makeTempDir('pcr-s1-u2');
  try {
    fs.writeFileSync(path.join(dir, 'helpers.js'), '');
    fs.mkdirSync(path.join(dir, 'subdir'));
    fs.writeFileSync(path.join(dir, 'subdir', 'check-nested.js'), '');
    let threw = false;
    let found;
    try { found = discoverTestFiles(dir); } catch (_) { threw = true; }
    assert(T + '-no-throw', !threw, 'discoverTestFiles should not throw on a no-match directory');
    assert(T + '-empty', Array.isArray(found) && found.length === 0, `Expected [], got ${JSON.stringify(found)}`);
  } finally { rmDir(dir); }
}

// ── U2b — discoverTestFiles() on a non-existent directory returns [] ───────

{
  const T = 'U2b-discover-nonexistent-dir';
  const found = discoverTestFiles(path.join(os.tmpdir(), 'pcr-s1-does-not-exist-' + Date.now()));
  assert(T, Array.isArray(found) && found.length === 0, `Expected [], got ${JSON.stringify(found)}`);
}

// ── IT1 (adapted) — getAllTestFiles() is a coverage superset of today's chain ─
// See plan's "Pre-implementation finding" section: the real `&&` chain
// silently masks most of the suite today (aborts at position 16/224), so a
// literal failure-set match is not a meaningful comparison. What IS testable
// and required: every file that was in the OLD chain must still be covered
// by the NEW mechanism (grandfather list ∪ dynamic glob) — nothing that used
// to run stops running.

{
  const T = 'IT1-old-chain-is-subset-of-new-discovery';
  const oldChainFiles = [
    '.github/scripts/check-viz-syntax.js', '.github/scripts/check-governance-sync.js',
    '.github/scripts/check-docs-structure.js', '.github/scripts/check-skill-contracts.js',
    '.github/scripts/check-pipeline-artefact-paths.js', '.github/scripts/check-changelog-readme.js',
    'tests/check-workspace-state.js', '.github/scripts/check-assembly.js',
    '.github/scripts/check-surface-adapter.js', '.github/scripts/check-model-risk.js',
    '.github/scripts/check-suite.js', '.github/scripts/check-standards-model.js',
    'tests/check-assurance-gate.js', '.github/scripts/check-watermark-gate.js',
    '.github/scripts/check-viz-behaviour.js', 'tests/check-definition-skill.js',
  ];
  const allNew = getAllTestFiles(root).map(f => path.relative(root, f).split(path.sep).join('/'));
  const missing = oldChainFiles.filter(f => !allNew.includes(f));
  assert(T, missing.length === 0, `These previously-chained files are no longer covered: ${missing.join(', ')}`);
}

{
  const T = 'IT1-grandfather-list-fully-covered';
  const allNew = getAllTestFiles(root).map(f => path.relative(root, f).split(path.sep).join('/'));
  const missing = GRANDFATHER_LIST.filter(f => !allNew.includes(f));
  assert(T, missing.length === 0, `Grandfather-listed files missing from getAllTestFiles(): ${missing.join(', ')}`);
}

{
  const T = 'IT1-grandfather-list-matches-dor-contract';
  const expected = [
    'tests/watermark-gate.test.js', 'tests/failure-detector.test.js',
    'tests/failure-detector.integration.test.js', 'src/improvement-agent/calibration.test.js',
    'src/trace-registry/getTraces.test.js', 'src/improvement-agent/compliance-report.test.js',
    'scripts/check-pipeline-state-integrity.js', 'tests/cli-subprocess.test.js',
    'tests/session-isolation.test.js', 'tests/skill-discovery.test.js', 'tests/byok-config.test.js',
    'tests/skill-launcher.test.js', 'tests/artefact-preview.test.js', 'tests/artefact-writeback.test.js',
    'tests/session-persistence.test.js', 'tests/run-gpa-tests.js',
  ];
  assert(T, JSON.stringify(GRANDFATHER_LIST) === JSON.stringify(expected),
    'GRANDFATHER_LIST does not match the DoR contract\'s 16-file list');
}

{
  const T = 'IT1-dynamic-glob-picks-up-all-check-files-on-disk';
  const allNew = getAllTestFiles(root).map(f => path.relative(root, f).split(path.sep).join('/'));
  const onDiskTests = fs.readdirSync(path.join(root, 'tests')).filter(f => /^check-.*\.js$/.test(f)).map(f => 'tests/' + f);
  const onDiskGhScripts = fs.readdirSync(path.join(root, '.github', 'scripts')).filter(f => /^check-.*\.js$/.test(f)).map(f => '.github/scripts/' + f);
  const missing = onDiskTests.concat(onDiskGhScripts).filter(f => !allNew.includes(f));
  assert(T, missing.length === 0, `check-*.js files on disk not discovered by getAllTestFiles(): ${missing.join(', ')}`);
}

// ── IT2 (automated proxy) — scripts.test string is short enough to never hit
//    the Windows cmd.exe ~8191-char command-line length limit ─────────────
// The real reproduction (running `npm test` from an actual cmd.exe shell) is
// manual — see verification-scripts/pcr-s1-...-verification.md Scenario 2 —
// because Git Bash / PowerShell cannot validly reproduce cmd.exe's limit.

{
  const T = 'IT2-proxy-scripts-test-is-short';
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const testCmd = pkg.scripts.test;
  assert(T + '-length', testCmd.length < 200, `Expected scripts.test under 200 chars, got ${testCmd.length}: "${testCmd}"`);
  assert(T + '-invokes-runner', testCmd.includes('scripts/run-all-tests.js'),
    `Expected scripts.test to invoke scripts/run-all-tests.js, got "${testCmd}"`);
}

// ── IT3 — adding a new tests/check-*.js file requires zero package.json edits ─

{
  const T = 'IT3-new-test-file-zero-package-json-diff';
  const dummyPath = path.join(root, 'tests', 'check-pcr-s1-zzz-dummy.js');
  const alreadyExisted = fs.existsSync(dummyPath);
  try {
    fs.writeFileSync(dummyPath, '#!/usr/bin/env node\nconsole.log("[pcr-s1-zzz-dummy] 1 check(s) OK ✓");\nprocess.exit(0);\n', 'utf8');
    const diff = execSync('git diff -- package.json', { cwd: root, encoding: 'utf8' });
    assert(T, diff.trim() === '', `Expected empty git diff for package.json after adding a new test file, got: ${diff.slice(0, 300)}`);
  } finally {
    if (!alreadyExisted) { try { fs.unlinkSync(dummyPath); } catch (_) {} }
  }
}

// ── N1 — run-all-tests.js does not meaningfully regress wall-clock time ───
// Baseline: measured once (2026-07-11) by looping the then-224-file chain
// command-by-command with node's child_process, bypassing the cmd.exe
// length limit — 152691ms for 224 files (~682ms/file average). The new
// runner covers more files (dynamic discovery closes a pre-existing
// registration gap — see plan), so the fair comparison is per-file average,
// not raw total wall-clock.

{
  const T = 'N1-perf-per-file-average-within-110pct';
  const BASELINE_MS_PER_FILE = 152691 / 224;
  const files = getAllTestFiles(root);
  // Sample a bounded subset for a fast NFR check rather than the full ~290-file suite,
  // to keep this file itself fast to run standalone (its own runtime is NOT part of
  // what N1 measures — that's `runAll()`'s job, exercised in verify-completion).
  const sample = files.slice(0, 40);
  const { spawnSync } = require('child_process');
  const start = Date.now();
  sample.forEach(f => { spawnSync(process.execPath, [f], { cwd: root, timeout: 30000 }); });
  const elapsed = Date.now() - start;
  const perFile = elapsed / sample.length;
  assert(T, perFile <= BASELINE_MS_PER_FILE * 1.10,
    `Expected <= ${(BASELINE_MS_PER_FILE * 1.10).toFixed(1)}ms/file, measured ${perFile.toFixed(1)}ms/file over ${sample.length} files`);
}

// ── Report ─────────────────────────────────────────────────────────────────

if (totalFailed > 0) {
  console.error(`[pcr-s1-test-runner] FAIL — ${issues.length} issue(s) found:`);
  issues.forEach(i => console.error(i));
  process.exit(1);
} else {
  console.log(`[pcr-s1-test-runner] ${totalPassed} check(s) OK ✓`);
}
