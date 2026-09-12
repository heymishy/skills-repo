#!/usr/bin/env node
/**
 * check-rtvap-s1-archived-test-plan-coverage.js
 *
 * Automated test coverage for r-trace-validation-archived-paths' own AC3
 * (test coverage gate): scripts/validate-trace.sh's/.ps1's `test_plan_coverage`
 * check already resolves a story's test-plan path under `artefacts/archived/`
 * when the primary `artefacts/<slug>/test-plans/` location is gone (commit
 * f7aa0dad, 2026-07-25) -- this file closes the "NEEDS-TESTS" gap the
 * retrospective story itself flagged, without touching the already-merged
 * fix in either script.
 *
 * Reuses the copy-script-into-tmpdir harness pattern already established in
 * tests/check-p3.5-validate-trace.js: both scripts derive their own repo
 * root from their own on-disk location, so copying one into a fixture temp
 * directory's scripts/ subfolder makes it treat that temp directory as the
 * repo root.
 *
 * Run:  node tests/check-rtvap-s1-archived-test-plan-coverage.js
 * Used: npm test
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const cp   = require('child_process');
const os   = require('os');

const root = path.join(__dirname, '..');
const PWSH_SPAWN_TIMEOUT_MS = 90000;

let passed = 0;
let failed = 0;

function pass(name) { console.log('  ✓ ' + name); passed++; }
function fail(name, reason) { console.error('  ✗ ' + name); console.error('      ' + reason); failed++; }

function hasPwsh() {
  try {
    cp.execSync('pwsh -Command "exit 0"', { stdio: 'ignore', timeout: 15000 });
    return true;
  } catch (_) {
    return false;
  }
}

// Builds a fixture repo with one feature/story whose derived test-plan path
// is artefacts/<featureSlug>/test-plans/<storySlug>-test-plan.md, and
// optionally writes that file at the primary and/or archived location.
function makeFixtureRepo(opts) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rtvap-s1-'));
  const featureSlug = 'rtvap-s1-fixture-feature';
  const storySlug = 'rtvap-s1-fixture-story';

  fs.mkdirSync(path.join(tmpDir, '.github'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'artefacts'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'scripts'), { recursive: true });

  const state = {
    features: [
      {
        slug: featureSlug,
        stage: 'test-plan',
        stories: [
          { slug: storySlug, stage: 'test-plan' }
        ]
      }
    ]
  };
  fs.writeFileSync(path.join(tmpDir, '.github', 'pipeline-state.json'), JSON.stringify(state, null, 2), 'utf8');

  const relTestPlan = path.join('artefacts', featureSlug, 'test-plans', storySlug + '-test-plan.md');
  if (opts.primary) {
    const p = path.join(tmpDir, relTestPlan);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, '# Test Plan (primary location)', 'utf8');
  }
  if (opts.archived) {
    const p = path.join(tmpDir, 'artefacts', 'archived', featureSlug, 'test-plans', storySlug + '-test-plan.md');
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, '# Test Plan (archived location)', 'utf8');
  }

  return tmpDir;
}

function cleanup(tmpDir) {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
}

// validate-trace.sh shells out to python3. On a Windows dev machine without a
// real python3 on PATH, bash resolves the Windows Store app-execution-alias
// stub, which fails with "Permission denied" (exit 126) rather than a normal
// python error -- an environment limitation, not a script defect. Same
// detection already established in tests/check-p4-enf-second-line.js's T6.
function isPythonUnavailableSkip(result) {
  const stderr = (result && result.stderr) || '';
  const winEnvError = /WindowsApps|AppData.*Local/i.test(stderr);
  return result.status === -1 || result.status === 126 || winEnvError;
}

// ── T1 — bash: archived-only test plan is found, not reported missing (AC1) ──
(function test_sh_archived_fallback_passes() {
  const name = 'T1: sh test_plan_coverage passes when test plan exists only under artefacts/archived/';
  const sh = path.join(root, 'scripts', 'validate-trace.sh');
  if (!fs.existsSync(sh)) { fail(name, 'scripts/validate-trace.sh not found'); return; }

  const tmpDir = makeFixtureRepo({ primary: false, archived: true });
  try {
    const shCopy = path.join(tmpDir, 'scripts', 'validate-trace.sh');
    fs.copyFileSync(sh, shCopy);
    fs.chmodSync(shCopy, 0o755);

    const result = cp.spawnSync('bash', [shCopy, '--check', 'test_plan_coverage'], { cwd: tmpDir, encoding: 'utf8', timeout: 30000 });
    if (isPythonUnavailableSkip(result)) {
      console.log('      skipped (python3 unavailable on this platform — validate-trace.sh needs it; verified via CI instead)');
      return;
    }
    if (result.status === 0) {
      pass(name);
    } else {
      fail(name, 'exited ' + result.status + '. stdout: ' + (result.stdout || '').slice(-500) + ' stderr: ' + (result.stderr || '').slice(-300));
    }
  } finally {
    cleanup(tmpDir);
  }
})();

// ── T2 — bash: neither path exists, still reported missing (regression guard, AC1) ──
(function test_sh_genuine_gap_still_fails() {
  const name = 'T2: sh test_plan_coverage still fails when test plan exists at neither path (regression guard)';
  const sh = path.join(root, 'scripts', 'validate-trace.sh');
  if (!fs.existsSync(sh)) { fail(name, 'scripts/validate-trace.sh not found'); return; }

  const tmpDir = makeFixtureRepo({ primary: false, archived: false });
  try {
    const shCopy = path.join(tmpDir, 'scripts', 'validate-trace.sh');
    fs.copyFileSync(sh, shCopy);
    fs.chmodSync(shCopy, 0o755);

    const result = cp.spawnSync('bash', [shCopy, '--check', 'test_plan_coverage'], { cwd: tmpDir, encoding: 'utf8', timeout: 30000 });
    if (isPythonUnavailableSkip(result)) {
      console.log('      skipped (python3 unavailable on this platform — validate-trace.sh needs it; verified via CI instead)');
      return;
    }
    if (result.status !== 0) {
      pass(name);
    } else {
      fail(name, 'exited 0 — expected non-zero for a genuinely missing test plan. stdout: ' + (result.stdout || '').slice(-500));
    }
  } finally {
    cleanup(tmpDir);
  }
})();

// ── T3 — PowerShell mirrors T1 (AC2), skipped if pwsh unavailable ──
(function test_ps1_archived_fallback_passes() {
  const name = 'T3: ps1 Check-TestPlanCoverage passes when test plan exists only under artefacts/archived/';
  const ps1 = path.join(root, 'scripts', 'validate-trace.ps1');
  if (!fs.existsSync(ps1)) { fail(name, 'scripts/validate-trace.ps1 not found'); return; }
  if (!hasPwsh()) { process.stdout.write('      pwsh not available in this environment — skip\n'); return; }

  const tmpDir = makeFixtureRepo({ primary: false, archived: true });
  try {
    const ps1Copy = path.join(tmpDir, 'scripts', 'validate-trace.ps1');
    fs.copyFileSync(ps1, ps1Copy);

    const result = cp.spawnSync('pwsh', ['-NonInteractive', '-File', ps1Copy, '--check', 'test_plan_coverage'], { cwd: tmpDir, timeout: PWSH_SPAWN_TIMEOUT_MS, encoding: 'utf8' });
    if (result.status === 0) {
      pass(name);
    } else {
      fail(name, 'exited ' + result.status + '. stderr: ' + (result.stderr || '').slice(0, 300));
    }
  } finally {
    cleanup(tmpDir);
  }
})();

// ── T4 — PowerShell mirrors T2 (AC2), skipped if pwsh unavailable ──
(function test_ps1_genuine_gap_still_fails() {
  const name = 'T4: ps1 Check-TestPlanCoverage still fails when test plan exists at neither path (regression guard)';
  const ps1 = path.join(root, 'scripts', 'validate-trace.ps1');
  if (!fs.existsSync(ps1)) { fail(name, 'scripts/validate-trace.ps1 not found'); return; }
  if (!hasPwsh()) { process.stdout.write('      pwsh not available in this environment — skip\n'); return; }

  const tmpDir = makeFixtureRepo({ primary: false, archived: false });
  try {
    const ps1Copy = path.join(tmpDir, 'scripts', 'validate-trace.ps1');
    fs.copyFileSync(ps1, ps1Copy);

    const result = cp.spawnSync('pwsh', ['-NonInteractive', '-File', ps1Copy, '--check', 'test_plan_coverage'], { cwd: tmpDir, timeout: PWSH_SPAWN_TIMEOUT_MS, encoding: 'utf8' });
    if (result.status !== 0) {
      pass(name);
    } else {
      fail(name, 'exited 0 — expected non-zero for a genuinely missing test plan.');
    }
  } finally {
    cleanup(tmpDir);
  }
})();

console.log('\n[check-rtvap-s1-archived-test-plan-coverage] Results: ' + passed + ' passed, ' + failed + ' failed\n');
process.exit(failed > 0 ? 1 : 0);
