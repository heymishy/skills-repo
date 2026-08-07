'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const CLI_BIN = path.join(ROOT, 'cli', 'bin', 'init.js');
const BOGUS_PLATFORM_ROOT = path.join(os.tmpdir(), 'rb-s1-bogus-platform-root-does-not-exist');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✔ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

function mktmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'rb-s1-test-'));
}

function rmtmp(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
}

function runCli(targetDir, extraArgs) {
  return execFileSync(process.execPath, [CLI_BIN, 'init', targetDir].concat(extraArgs || []), {
    encoding: 'utf8',
    // Deliberately point PLATFORM_ROOT at a bogus, non-existent directory. Per AC2 the CLI must
    // ignore this and resolve its own bundled root from __dirname instead — if it wrongly trusted
    // this env var, every call below would fail with ENOENT.
    env: Object.assign({}, process.env, { PLATFORM_ROOT: BOGUS_PLATFORM_ROOT })
  });
}

function snapshot(dir) {
  const result = {};
  function walk(d, rel) {
    for (const entry of fs.readdirSync(d)) {
      const full = path.join(d, entry);
      const relPath = path.join(rel, entry);
      const st = fs.statSync(full);
      if (st.isDirectory()) walk(full, relPath);
      else result[relPath] = { content: fs.readFileSync(full), mtimeMs: st.mtimeMs };
    }
  }
  walk(dir, '');
  return result;
}

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

console.log('\n[rb-s1] Unit tests\n');

test('resolvesPlatformRootToBundledFiles_whenRunViaNpx', () => {
  const { resolvePlatformRoot } = require('../cli/lib/init');
  const simulatedCallerDir = path.join(ROOT, 'cli', 'bin');
  const result = resolvePlatformRoot(simulatedCallerDir);
  assert.strictEqual(result, ROOT,
    'resolvePlatformRoot should return the package root two levels up from cli/bin, ' +
    'not process.cwd() or an env-var-derived path');
});

test('rejectsWhenTargetDirIsAFileNotADirectory', () => {
  const tmp = mktmp();
  try {
    const notAFolder = path.join(tmp, 'not-a-folder.txt');
    fs.writeFileSync(notAFolder, '', 'utf8');
    let threw = false;
    let stderr = '';
    try {
      runCli(notAFolder);
    } catch (err) {
      threw = true;
      stderr = err.stderr || '';
    }
    assert.ok(threw, 'CLI should exit non-zero when target path is a file, not a directory');
    assert.ok(stderr.length > 0, 'stderr should contain a human-readable error');
  } finally { rmtmp(tmp); }
});

test('seedsContextYmlAndPipelineStateJson_onFreshInit', () => {
  const tmp = mktmp();
  try {
    runCli(tmp);
    const contextPath = path.join(tmp, 'context.yml');
    const statePath = path.join(tmp, '.github', 'pipeline-state.json');
    assert.ok(fs.existsSync(contextPath), 'context.yml was not seeded in target directory');
    assert.ok(fs.existsSync(statePath), '.github/pipeline-state.json was not seeded in target directory');
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    assert.strictEqual(state.version, '1', 'seeded pipeline-state.json should have version "1"');
    assert.ok(Array.isArray(state.features) && state.features.length === 0,
      'seeded pipeline-state.json should have an empty features array');
    assert.ok(Array.isArray(state.programmes), 'seeded pipeline-state.json should have a programmes array');
    assert.ok(!isNaN(Date.parse(state.updated)), 'seeded pipeline-state.json updated field should be a valid ISO date');
    const contextContent = fs.readFileSync(contextPath, 'utf8');
    assert.ok(contextContent.length > 0, 'seeded context.yml should not be empty');
  } finally { rmtmp(tmp); }
});

test('skipsExistingFilesOnSecondRun_reportsWhichWereSkipped', () => {
  const tmp = mktmp();
  try {
    runCli(tmp);
    const before = snapshot(tmp);
    const stdout = runCli(tmp);
    const after = snapshot(tmp);
    assert.deepStrictEqual(Object.keys(before).sort(), Object.keys(after).sort(),
      'second run should not add or remove any files');
    for (const key of Object.keys(before)) {
      assert.ok(before[key].content.equals(after[key].content), `file content changed on second run: ${key}`);
    }
    assert.ok(stdout.toLowerCase().includes('skip'), 'second run stdout should mention skipped files');
    assert.ok(stdout.includes('context.yml'), 'second run stdout should list context.yml as skipped');
    assert.ok(stdout.includes(path.join('.github', 'pipeline-state.json')) || stdout.includes('.github/pipeline-state.json') || stdout.includes('.github\\pipeline-state.json'),
      'second run stdout should list .github/pipeline-state.json as skipped');
  } finally { rmtmp(tmp); }
});

test('secondRunDoesNotReferenceUndefinedUpdateMechanism', () => {
  const tmp = mktmp();
  try {
    runCli(tmp);
    const stdout = runCli(tmp);
    assert.ok(stdout.includes('platform:fetch'),
      `second-run output should reference the real "platform:fetch" mechanism by name. Got: ${stdout.slice(0, 400)}`);
    assert.ok(!stdout.toLowerCase().includes('future update mechanism'),
      'second-run output should not use vague "future update mechanism" language');
  } finally { rmtmp(tmp); }
});

test('packageJson-declares-bin-and-files-for-npm-packaging', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.ok(pkg.bin, 'package.json missing bin field');
  const binEntry = typeof pkg.bin === 'string' ? pkg.bin : Object.values(pkg.bin)[0];
  assert.ok(binEntry.replace(/\\/g, '/').includes('cli/bin/init.js'), 'bin entry should point at cli/bin/init.js');
  assert.ok(Array.isArray(pkg.files), 'package.json missing files field');
  assert.ok(pkg.files.some(f => f.startsWith('cli')), 'files field should include cli/');
  assert.ok(pkg.files.some(f => f.startsWith('scripts')), 'files field should include scripts/');
});

// ---------------------------------------------------------------------------
// Integration tests
// ---------------------------------------------------------------------------

console.log('\n[rb-s1] Integration tests\n');

test('initCommand_wrapsPlatformInitJs_producesIdenticalOutputToDirectInvocation', () => {
  const directTarget = mktmp();
  const cliTarget = mktmp();
  try {
    const directScript = path.join(ROOT, 'scripts', 'platform-init.js');
    execFileSync(process.execPath, [directScript, directTarget], {
      encoding: 'utf8',
      env: Object.assign({}, process.env, { PLATFORM_ROOT: ROOT })
    });
    runCli(cliTarget);

    const directFiles = fs.readdirSync(path.join(directTarget, '.github', 'skills'), { recursive: true })
      .filter(f => f.endsWith('.md')).sort();
    const cliFiles = fs.readdirSync(path.join(cliTarget, '.github', 'skills'), { recursive: true })
      .filter(f => f.endsWith('.md')).sort();
    // rb-s2 extends the CLI wrapper to additionally copy the platform's full
    // top-level skills/ tree into .github/skills/, on top of what
    // platform-init.js puts there directly (a 5-skill legacy set). The CLI's
    // output is therefore now a superset of a bare platform-init.js
    // invocation, not byte-for-byte identical. This assertion is amended
    // accordingly — see
    // artefacts/2026-08-05-repo-bootstrap-no-fork/plans/rb-s2-plan.md.
    assert.ok(cliFiles.length >= directFiles.length,
      'CLI output should be a superset of direct platform-init.js invocation, not smaller');
    for (const f of directFiles) {
      assert.ok(cliFiles.includes(f), `CLI output missing a file platform-init.js produces directly: ${f}`);
    }

    const sampleFile = directFiles[0];
    const directContent = fs.readFileSync(path.join(directTarget, '.github', 'skills', sampleFile), 'utf8');
    const cliContent = fs.readFileSync(path.join(cliTarget, '.github', 'skills', sampleFile), 'utf8');
    assert.strictEqual(directContent, cliContent, 'file content should be identical between direct invocation and CLI wrapper');
  } finally {
    rmtmp(directTarget);
    rmtmp(cliTarget);
  }
});

test('rerunInitAfterFirstBootstrap_fileSystemStateUnchanged', () => {
  const tmp = mktmp();
  try {
    runCli(tmp);
    const before = snapshot(tmp);
    runCli(tmp);
    const after = snapshot(tmp);
    for (const key of Object.keys(before)) {
      assert.strictEqual(before[key].mtimeMs, after[key].mtimeMs,
        `mtime changed for ${key} on second run — file was rewritten instead of skipped`);
    }
  } finally { rmtmp(tmp); }
});

// ---------------------------------------------------------------------------
// NFR tests
// ---------------------------------------------------------------------------

console.log('\n[rb-s1] NFR tests\n');

test('initCompletesUnder30Seconds', () => {
  const tmp = mktmp();
  try {
    const start = Date.now();
    runCli(tmp);
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 30000, `init took ${elapsed}ms — expected under 30000ms`);
  } finally { rmtmp(tmp); }
});

test('noCredentialWrittenToAnyGeneratedFile', () => {
  const tmp = mktmp();
  try {
    runCli(tmp);
    const CREDENTIAL_PATTERNS = [
      /ghp_[A-Za-z0-9]{20,}/,
      /gho_[A-Za-z0-9]{20,}/,
      /sk-[A-Za-z0-9]{20,}/,
      /AKIA[0-9A-Z]{16}/,
      /Bearer\s+[A-Za-z0-9\-_.]{20,}/,
      /^[A-Z_][A-Z0-9_]*_(TOKEN|SECRET|KEY|PASSWORD)\s*=\s*['"]?[^'"\s]{8,}/m
    ];
    function walk(dir) {
      for (const entry of fs.readdirSync(dir)) {
        const full = path.join(dir, entry);
        const st = fs.statSync(full);
        if (st.isDirectory()) { walk(full); continue; }
        let content;
        try { content = fs.readFileSync(full, 'utf8'); } catch (_) { continue; }
        for (const pattern of CREDENTIAL_PATTERNS) {
          assert.ok(!pattern.test(content), `credential-shaped pattern ${pattern} matched in ${path.relative(tmp, full)}`);
        }
      }
    }
    walk(tmp);
  } finally { rmtmp(tmp); }
});

// ---------------------------------------------------------------------------

console.log('');
console.log(`[rb-s1-cli-init] Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
