'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync, spawnSync } = require('child_process');

let passed = 0; let failed = 0; let skipped = 0;
function pass(name) { console.log(`  PASS: ${name}`); passed++; }
function fail(name, err) { console.error(`  FAIL: ${name}: ${err.message || err}`); failed++; }

const ROOT = path.join(__dirname, '..');
const SCRIPT = path.join(ROOT, 'scripts', 'validate-trace.sh');

function hasBash() {
  const r = spawnSync('bash', ['--version'], { encoding: 'utf8' });
  return r.status === 0;
}
function hasPython3() {
  const r = spawnSync('bash', ['-c', 'python3 -c "import json,yaml"'], { encoding: 'utf8' });
  return r.status === 0;
}
const ENV_OK = hasBash() && hasPython3();

(async function () {
  // AC3: --check <name> mode still works for every check name, individually.
  const CHECK_NAMES = [
    'schema_valid',
    'discovery_exists',
    'discovery_approved',
    'test_plan_coverage',
    'unresolved_blockers',
    'no_eval_mode_artefacts',
  ];
  if (!ENV_OK) {
    console.log('  - AC3/AC2/AC1: skipped (bash/python3 not usable on this platform — validate manually)');
    skipped += 1;
  } else {
    for (const name of CHECK_NAMES) {
      try {
        const r = spawnSync('bash', [SCRIPT, '--check', name], { cwd: ROOT, encoding: 'utf8', timeout: 60000 });
        assert(r.status === 0 || r.status === 1, `expected exit 0 or 1 for --check ${name}, got ${r.status} (stderr: ${(r.stderr || '').slice(0, 200)})`);
        assert(/Checking:/.test(r.stdout), `expected a "Checking:" line in --check ${name} output`);
        pass(`singleCheckMode_${name}_runsAndReportsCleanly`);
      } catch (e) { fail(`singleCheckMode_${name}_runsAndReportsCleanly`, e); }
    }

    // AC2: the consolidated run spawns exactly one python3 process carrying
    // ARTEFACTS_DIR/STATE_FILE/CONFIG_FILE (the shared-state loader), not one
    // per check. Instrumented via a counting python3 shim placed first on PATH.
    try {
      const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vtp-s1-shim-'));
      const logFile = path.join(shimDir, 'calls.log');
      const realPython3 = spawnSync('bash', ['-c', 'command -v python3'], { encoding: 'utf8' }).stdout.trim();
      const shimPath = path.join(shimDir, 'python3');
      fs.writeFileSync(
        shimPath,
        `#!/usr/bin/env bash\necho "call" >> "${logFile}"\nif [ -n "$ARTEFACTS_DIR" ]; then echo "shared-state-call" >> "${logFile}"; fi\nexec "${realPython3}" "$@"\n`,
      );
      fs.chmodSync(shimPath, 0o755);
      const r = spawnSync('bash', [SCRIPT, '--ci'], {
        cwd: ROOT,
        encoding: 'utf8',
        timeout: 60000,
        env: Object.assign({}, process.env, { PATH: shimDir + path.delimiter + process.env.PATH }),
      });
      const log = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : '';
      const totalCalls = (log.match(/^call$/gm) || []).length;
      const sharedStateCalls = (log.match(/^shared-state-call$/gm) || []).length;
      assert(sharedStateCalls === 1, `expected exactly 1 shared-state python3 invocation, got ${sharedStateCalls}`);
      assert(totalCalls <= 3, `expected at most 3 total python3 invocations (shared-state + is_hard_fail dead code path + CI report writer), got ${totalCalls}`);
      fs.rmSync(shimDir, { recursive: true, force: true });
      pass('consolidatedRun_spawnsExactlyOneSharedStatePython3Process');
    } catch (e) { fail('consolidatedRun_spawnsExactlyOneSharedStatePython3Process', e); }

    // AC1: full-run output is behaviourally equivalent to the pre-change script
    // on the SAME current repo state. Compares against the parent commit's
    // version (before this story's changes), run from inside the repo so
    // REPO_ROOT resolves identically for both.
    try {
      const parentSha = execFileSync('git', ['log', '--format=%P', '-1'], { cwd: ROOT, encoding: 'utf8' }).trim().split(/\s+/)[0];
      const oldScriptContent = execFileSync('git', ['show', `${parentSha}:scripts/validate-trace.sh`], { cwd: ROOT, encoding: 'utf8' });
      const oldScriptPath = path.join(ROOT, 'scripts', '.vtp-s1-old-baseline-tmp.sh');
      fs.writeFileSync(oldScriptPath, oldScriptContent);
      try {
        const oldRun = spawnSync('bash', [oldScriptPath, '--ci'], { cwd: ROOT, encoding: 'utf8', timeout: 90000 });
        const oldReportPath = path.join(ROOT, 'trace-validation-report.json');
        const oldReport = fs.existsSync(oldReportPath) ? JSON.parse(fs.readFileSync(oldReportPath, 'utf8')) : null;

        const newRun = spawnSync('bash', [SCRIPT, '--ci'], { cwd: ROOT, encoding: 'utf8', timeout: 60000 });
        const newReport = fs.existsSync(oldReportPath) ? JSON.parse(fs.readFileSync(oldReportPath, 'utf8')) : null;

        if (oldRun.status === null || /FileNotFoundError|Permission denied/.test(oldRun.stderr || '')) {
          console.log('  - AC1: skipped (pre-change baseline cannot run on this platform — validate via CI)');
          skipped += 1;
        } else {
          assert(oldReport && newReport, 'expected both runs to produce a report');
          const norm = (r) => ({
            passed: [...r.passed].sort(),
            warnings: [...r.warnings].sort(),
            failures: [...r.failures].sort(),
          });
          assert.deepStrictEqual(norm(newReport), norm(oldReport), 'expected byte-for-byte equivalent pass/warning/failure sets');
          pass('fullRun_producesEquivalentReport_toPreChangeBaseline');
        }
      } finally {
        fs.rmSync(oldScriptPath, { force: true });
      }
    } catch (e) { fail('fullRun_producesEquivalentReport_toPreChangeBaseline', e); }
  }

  console.log(`\n${passed} passed, ${failed} failed` +
    (skipped > 0 ? `, ${skipped} skipped (bash/python3 unavailable)` : ''));
  process.exit(failed > 0 ? 1 : 0);
})();
